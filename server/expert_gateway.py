#!/usr/bin/env python3
"""本机专家库网关：将网页请求安全转发到 OpenCode Go。

只使用 Python 标准库；API Key 只由本文件从 server/.env 读取，永不发送给浏览器。
"""

from __future__ import annotations

import json
import hmac
import os
import re
import ssl
import sys
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / ".env"
DATA_DIR = ROOT / "data"
MAX_BODY_BYTES = 24 * 1024
MAX_QUESTION_CHARS = 1200
RATE_LIMITS: dict[str, deque[float]] = defaultdict(deque)


def load_dotenv(path: Path) -> None:
    """Minimal .env loader so the local gateway has no third-party dependency."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv(ENV_PATH)


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def trusted_ssl_context() -> ssl.SSLContext:
    """Use the installed certifi CA bundle when this Python lacks macOS root certificates."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def allowed_origins() -> set[str]:
    return {item.strip() for item in env("ALLOWED_ORIGINS", "http://127.0.0.1:4173,http://localhost:4173").split(",") if item.strip()}


def env_flag(name: str, default: bool = False) -> bool:
    value = env(name, "true" if default else "false").lower()
    return value in {"1", "true", "yes", "on"}


def json_text(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False).encode("utf-8").decode("utf-8")


def trimmed_text(value: Any, maximum: int = 600) -> str:
    text = str(value if value is not None else "").strip()
    return text[:maximum]


def string_list(value: Any, maximum_items: int = 5) -> list[str]:
    if not isinstance(value, list):
        return []
    return [trimmed_text(item, 320) for item in value if trimmed_text(item, 320)][:maximum_items]


def parse_json_reply(content: str) -> dict[str, Any]:
    candidate = content.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*|\s*```$", "", candidate, flags=re.IGNORECASE)
    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {"answer": trimmed_text(content, 1200)}


def normalise_answer(model_reply: dict[str, Any]) -> dict[str, Any]:
    risk = trimmed_text(model_reply.get("riskLevel", "data_insufficient"), 32).lower()
    if risk not in {"high", "medium", "low", "data_insufficient"}:
        risk = "data_insufficient"
    return {
        "answer": trimmed_text(model_reply.get("answer", "请以现场 SOP、测点趋势和人工核验结果为准。"), 1400),
        "riskLevel": risk,
        "checks": string_list(model_reply.get("checks")),
        "actions": string_list(model_reply.get("actions")),
        "neededData": trimmed_text(model_reply.get("neededData", "请补充异常时间、关键点位原始值、运行状态与现场检查结果。"), 700),
        # V0 尚未把项目文档切块入库，不能把模型生成的名词伪装成可追溯文献。
        "sources": ["本地 V0 未接入 RAG 文档检索；请以已命中的本地规则、现场 SOP 和人工核验为准。"],
    }


def provider_payload(question: str, equipment: str, current_alarm: Any, recent_metrics: Any) -> dict[str, Any]:
    system = """你是中水双膜水处理项目的辅助诊断助手。必须使用简体中文，且只输出一个 JSON 对象，不要 Markdown。
字段固定为 answer、riskLevel、checks、actions、neededData、sources。
riskLevel 仅可为 high、medium、low、data_insufficient。
你不是 PLC 控制器：不得下发控制指令，不得声称已确认故障；在数据不充分时使用 data_insufficient。
actions 只能写需要现场人员按 SOP、权限和安全规程执行的建议。不要编造项目文件、标准编号、设备参数或引用来源。"""
    user_context = {
        "question": question,
        "equipment": equipment or "all",
        "currentAlarm": current_alarm,
        "recentMetrics": recent_metrics,
        "dataBoundary": "实时质量门控与工艺数据尚未传入；先核验测点质量，再判断工艺异常。",
    }
    return {
        "model": env("OPENCODE_GO_MODEL", "glm-5.3-flash"),
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json_text(user_context)},
        ],
    }


def call_opencode_go(question: str, equipment: str, current_alarm: Any, recent_metrics: Any) -> dict[str, Any]:
    api_key = env("OPENCODE_GO_API_KEY")
    if not api_key:
        raise RuntimeError("not_configured")
    base_url = env("OPENCODE_GO_BASE_URL", "https://opencode.ai/zen/go/v1").rstrip("/")
    request = Request(
        base_url + "/chat/completions",
        data=json_text(provider_payload(question, equipment, current_alarm, recent_metrics)).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "LuckeyExpertGateway/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=60, context=trusted_ssl_context()) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        # 消费上游正文但不记录它，避免认证回显进入本机日志。
        exc.read()
        if exc.code in {HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN}:
            raise RuntimeError("upstream_auth_rejected") from exc
        raise RuntimeError(f"upstream_http_{exc.code}") from exc
    except URLError as exc:
        # 只保留连接层原因，供本机排障；不会包含 Authorization 请求头。
        raise RuntimeError(f"upstream_unreachable:{trimmed_text(exc.reason, 160)}") from exc
    choices = payload.get("choices") if isinstance(payload, dict) else None
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("invalid_provider_response")
    content = choices[0].get("message", {}).get("content", "")
    if isinstance(content, list):
        content = "".join(item.get("text", "") for item in content if isinstance(item, dict))
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("empty_provider_response")
    return normalise_answer(parse_json_reply(content))


class ExpertGatewayHandler(BaseHTTPRequestHandler):
    server_version = "LuckeyExpertGateway/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        # 日志保留请求方法和状态，避免把问题文本或认证信息写进终端。
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))

    def origin_is_allowed(self) -> bool:
        origin = self.headers.get("Origin")
        if origin:
            return origin in allowed_origins()
        return not env_flag("REQUIRE_ORIGIN", False)

    def access_is_allowed(self) -> bool:
        expected = env("EXPERT_GATEWAY_ACCESS_TOKEN")
        if not env_flag("EXPERT_GATEWAY_REQUIRE_ACCESS", bool(expected)):
            return True
        supplied = self.headers.get("X-Expert-Access-Token", "")
        return bool(supplied) and hmac.compare_digest(supplied, expected)

    def within_rate_limit(self) -> bool:
        limit = int(env("EXPERT_RATE_LIMIT_PER_MINUTE", "12"))
        forwarded = self.headers.get("X-Forwarded-For", "")
        client = forwarded.split(",", 1)[0].strip() or self.client_address[0]
        now = time.monotonic()
        window = RATE_LIMITS[client]
        while window and now - window[0] >= 60:
            window.popleft()
        if len(window) >= limit:
            return False
        window.append(now)
        return True

    def send_json(self, status: HTTPStatus, body: dict[str, Any]) -> None:
        raw = json_text(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        origin = self.headers.get("Origin")
        if origin and origin in allowed_origins():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:  # noqa: N802
        if not self.origin_is_allowed():
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "origin_not_allowed"})
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Expert-Access-Token")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def read_body(self) -> dict[str, Any] | None:
        length = self.headers.get("Content-Length", "0")
        try:
            size = int(length)
        except ValueError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_content_length"})
            return None
        if size <= 0 or size > MAX_BODY_BYTES:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_body_size"})
            return None
        try:
            payload = json.loads(self.rfile.read(size).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_json"})
            return None
        if not isinstance(payload, dict):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "json_object_required"})
            return None
        return payload

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/api/expert/health":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})
            return
        ready = bool(env("OPENCODE_GO_API_KEY"))
        self.send_json(HTTPStatus.OK, {
            "status": "ready" if ready else "not_configured",
            "model": env("OPENCODE_GO_MODEL", "glm-5.3-flash"),
            "knowledge": "local_v0_no_rag",
            "webRetrieval": "disabled",
            "host": env("EXPERT_GATEWAY_MODE", "local_only"),
            "requiresAccess": env_flag(
                "EXPERT_GATEWAY_REQUIRE_ACCESS",
                bool(env("EXPERT_GATEWAY_ACCESS_TOKEN")),
            ),
        })

    def do_POST(self) -> None:  # noqa: N802
        if not self.origin_is_allowed():
            self.send_json(HTTPStatus.FORBIDDEN, {"error": "origin_not_allowed"})
            return
        if not self.access_is_allowed():
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "access_denied"})
            return
        if not self.within_rate_limit():
            self.send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "rate_limited"})
            return
        payload = self.read_body()
        if payload is None:
            return
        if self.path == "/api/expert/chat":
            question = trimmed_text(payload.get("question"), MAX_QUESTION_CHARS)
            if not question:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "question_required"})
                return
            try:
                answer = call_opencode_go(question, trimmed_text(payload.get("equipment"), 80), payload.get("currentAlarm"), payload.get("recentMetrics"))
            except RuntimeError as exc:
                code = str(exc)
                # 仅记录归类后的上游状态，避免把请求正文或认证信息写进日志。
                sys.stderr.write(f"OpenCode Go request failed: {code}\n")
                if code == "not_configured":
                    self.send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"error": "gateway_not_configured"})
                elif code == "upstream_auth_rejected":
                    self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "upstream_auth_rejected"})
                elif code == "upstream_http_503":
                    self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "upstream_temporarily_unavailable"})
                else:
                    self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "upstream_unavailable"})
                return
            self.send_json(HTTPStatus.OK, answer)
            return
        if self.path == "/api/expert/feedback":
            record = {
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "questionId": trimmed_text(payload.get("questionId"), 120),
                "helpful": bool(payload.get("helpful")),
                "correctedAnswer": trimmed_text(payload.get("correctedAnswer"), 1600),
                "operator": trimmed_text(payload.get("operator"), 120),
            }
            DATA_DIR.mkdir(exist_ok=True)
            with (DATA_DIR / "expert_feedback.jsonl").open("a", encoding="utf-8") as output:
                output.write(json_text(record) + "\n")
            self.send_json(HTTPStatus.CREATED, {"status": "recorded"})
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})


def main() -> None:
    host = env("EXPERT_GATEWAY_HOST", "0.0.0.0" if env("PORT") else "127.0.0.1")
    port = int(env("PORT", env("EXPERT_GATEWAY_PORT", "8787")))
    server = ThreadingHTTPServer((host, port), ExpertGatewayHandler)
    print(f"专家库网关已启动：http://{host}:{port}")
    print("健康检查：GET /api/expert/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n专家库网关已停止。")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
