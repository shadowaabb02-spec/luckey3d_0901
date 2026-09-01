# 本机 OpenCode Go 专家库网关

这个网关只监听 `127.0.0.1:8787`，用于把当前网页的专家库请求转发到 OpenCode Go。API Key 仅放在 `server/.env`，浏览器、HTML 和提交记录中都不应出现 Key。网关会保持 HTTPS 证书校验；当前 macOS Python 缺少系统根证书时，会自动使用已安装的 `certifi` 证书包。

## 首次配置

1. 在 `server` 目录复制 `.env.example` 为 `.env`。
2. 打开 `.env`，仅填写 `OPENCODE_GO_API_KEY=` 右侧的值；不要把 Key 发送到聊天、HTML 或 JavaScript。
3. 默认模型为 `glm-5.3-flash`，它使用 OpenCode Go 的 `chat/completions` 接口。需要时可调整 `OPENCODE_GO_MODEL`。

## 启动

在项目根目录分别开启两个终端：

```bash
# 终端 1：网页
python3 -m http.server 4173 --bind 127.0.0.1

# 终端 2：专家库网关
python3 server/expert_gateway.py
```

随后打开 `http://127.0.0.1:4173/main.html`。专家库顶部显示“LLM 网关已连接”后，点击“诊断”会调用 OpenCode Go；网关未启动或 Key 未配置时，页面仍可正常使用本地规则。

若网页提示“OpenCode Go Key 未获授权”，请在 OpenCode Zen 的 Go 订阅工作区重新复制 API Key，确保只粘贴 Key 本身（不包含 `Bearer `、引号或其他说明文字），保存 `.env` 后重启网关。

若网页提示“OpenCode Go 当前暂不可用”，表示网关已经成功连到服务但上游返回了 `503`；本地规则仍可继续使用。请稍后重试，或在 `.env` 将 `OPENCODE_GO_MODEL` 改为另一种支持 `chat/completions` 的 Go 模型后重启网关。

## 接口与边界

- `GET /api/expert/health`：返回网关、本地知识库/RAG 和模型配置状态。
- `POST /api/expert/chat`：接收问题、设备范围、当前报警和近期指标，返回 `answer`、`riskLevel`、`checks`、`actions`、`neededData`、`sources`。
- `POST /api/expert/feedback`：将网页反馈保存在 `server/data/expert_feedback.jsonl`，该目录被忽略且不应提交。

当前是本地规则 + LLM 辅助诊断 V0：未接入 RAG 文档检索，所有输出都必须由现场人员依据 SOP、测点质量和安全权限核验；网关不会向 PLC、阀门、泵或加药系统下发控制命令。
