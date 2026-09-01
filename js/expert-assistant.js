/*
 * 专家库 V0
 * - 默认只检索本地、可编辑的规则，不将任何密钥放入浏览器。
 * - 后端网关接入后可由 window.EXPERT_GATEWAY_URL 指定同源/受控地址；
 *   网关的返回契约见项目实施方案，不允许浏览器直连模型供应商。
 */
(function () {
    'use strict';

    const RULES_KEY = 'lefilm_expert_rules_v0';
    const FEEDBACK_KEY = 'lefilm_expert_feedback_v0';
    let gatewayHealth = { state: 'unknown', model: '' };
    let selectedAlarm = null;
    const CATEGORY_LABELS = {
        uf: '超滤 / 预处理',
        ro: '反渗透 / 高压泵',
        chemical: '加药 / CIP',
        instrument: '仪表 / 阀门',
        automation: 'PLC / 通讯',
        process: '工艺运行'
    };
    const CATEGORY_HINTS = {
        uf: {
            checks: ['核对 UF 进出水压差、原水浊度与最近反洗记录', '核对阀位反馈、气洗/反洗压力和持续时间', '确认相关测点无冻结、突变或越界后再判断工艺问题'],
            data: 'UF 进出水压力/TMP、进出水浊度、反洗状态、阀位反馈、最近清洗记录'
        },
        ro: {
            checks: ['核对进水、浓水、产水流量/压力及温度校正后的趋势', '核对电导率、段间压差和高压泵运行状态', '确认采样点、量程和在线仪表质量后再排查膜元件'],
            data: 'RO 进/浓/产水流量与压力、电导率、温度、段间压差、回收率、泵频率/电流'
        },
        chemical: {
            checks: ['核对药箱液位、泵运行状态和进出口压力', '确认注药点、止回阀和管路排气状态', '核对药剂浓度、批次和最近 CIP/加药记录'],
            data: '药箱液位、泵频率/冲程、进出口压力、实际投加量、药剂浓度、阀位状态'
        },
        instrument: {
            checks: ['先用现场比对或标准样核验测量值', '核对供电、接地、信号线、量程和最近校准记录', '排除气泡、结垢、满管/液面等安装工况影响'],
            data: '仪表型号/量程、原始值与人工比对值、校准记录、供电/通讯状态、安装工况'
        },
        automation: {
            checks: ['保持现场安全操作，核对关键设备是否已切换至授权控制方式', '核对 PLC、交换机、电源、网络链路与报警时间线', '由有权限人员处理网络或控制逻辑，不在本页面下发控制命令'],
            data: '报警时间、PLC/交换机状态、通信质量、I/O 状态、供电状态、操作与变更记录'
        },
        process: {
            checks: ['核对异常开始时间、相关联设备和运行负荷', '先复核测点质量，再与设计值和历史趋势对比', '在现场 SOP 和授权范围内执行下一步检查'],
            data: '异常时间段趋势、运行负荷、相关报警、关键测点原始值、操作记录'
        }
    };
    const SEARCH_ALIASES = {
        '压差': ['压差', 'TMP', '压力'],
        'TMP': ['TMP', '压差', '超滤'],
        '电导': ['电导', '电导率', '盐'],
        '流量': ['流量', '产水量', '通量'],
        '产水量': ['产水量', '流量', '通量'],
        '加药': ['加药', '计量泵', '药'],
        '泵': ['泵', '高压泵', '计量泵'],
        '浊度': ['浊度', '膜丝', '反洗'],
        'ORP': ['ORP', '余氯', '还原剂'],
        'PLC': ['PLC', '通讯', '断线', '交换机'],
        '断线': ['断线', '通讯', 'PLC', '交换机'],
        '仪表': ['仪表', '变送器', '在线', '流量计', 'pH'],
        '液位': ['液位', '水箱', '变送器'],
        '阀': ['阀', '蝶阀', '阀门'],
        'CIP': ['CIP', '清洗', '加热'],
        '反洗': ['反洗', '气洗', '超滤']
    };

    function getRules() {
        return window.ExpertRules && typeof window.ExpertRules.get === 'function'
            ? window.ExpertRules.get()
            : [];
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function highlight(value, query) {
        const safe = escapeHtml(value);
        const word = String(query || '').trim();
        if (!word) return safe;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safe.replace(new RegExp(escaped, 'gi'), '<mark>$&</mark>');
    }

    function categoryFor(rule) {
        const text = `${rule.error} ${rule.cause} ${rule.fix}`.toLowerCase();
        if (/plc|通讯|断线|交换机|网络/.test(text)) return 'automation';
        if (/加药|阻垢剂|还原剂|计量泵|cip|清洗液|蒸汽/.test(text)) return 'chemical';
        if (/反渗透|\bro\b|高压泵|浓水|脱盐/.test(text)) return 'ro';
        // 工艺设备（如多介质/保安过滤器）优先归入预处理；纯仪表与执行器再归仪表类。
        if (/超滤|\buf\b|过滤器|原水|反洗|滤芯/.test(text)) return 'uf';
        if (/ph计|流量计|变送器|浊度仪|仪表|蝶阀|电磁阀/.test(text)) return 'instrument';
        return 'process';
    }

    function riskFor(rule) {
        const text = `${rule.error} ${rule.fix}`;
        if (/紧急|立即停|切断|断线|严重|超标/.test(text)) return { key: 'high', label: '高风险，优先核验' };
        if (/异常|下降|升高|偏高|偏低|超限|故障|不打|异响|波动/.test(text)) return { key: 'medium', label: '中风险，建议排查' };
        return { key: 'low', label: '提示，建议观察' };
    }

    function reasonItems(cause) {
        const cleaned = String(cause || '').replace(/\s+/g, ' ').trim();
        const items = cleaned.match(/(?:^|[；。]\s*)(?:\d+\.\s*)?[^；。]+/g) || [cleaned];
        return items.map(item => item.replace(/^[；。\s]+(?:\d+\.\s*)?/, '').trim()).filter(Boolean);
    }

    function queryTerms(query) {
        const source = String(query || '').trim().toLowerCase();
        const terms = new Set([source]);
        Object.keys(SEARCH_ALIASES).forEach(key => {
            if (source.includes(key.toLowerCase())) SEARCH_ALIASES[key].forEach(term => terms.add(term.toLowerCase()));
        });
        return Array.from(terms).filter(Boolean);
    }

    function scoreRule(rule, query, category) {
        const haystack = `${rule.error} ${rule.cause} ${rule.fix}`.toLowerCase();
        const normalized = String(query).toLowerCase();
        let score = 0;
        if (haystack.includes(normalized)) score += 100;
        queryTerms(query).forEach(term => {
            if (term.length > 1 && haystack.includes(term)) score += term === normalized ? 12 : 24;
        });
        if (category !== 'all' && categoryFor(rule) === category) score += 3;
        return score;
    }

    function findMatches(query, category) {
        const candidates = getRules()
            .filter(rule => category === 'all' || categoryFor(rule) === category)
            .map((rule, index) => ({ rule, index, score: scoreRule(rule, query, category) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.index - b.index);
        if (!candidates.length) return [];
        // 有完整现象匹配时，不把只命中“压力”等泛词的跨设备案例混进结果。
        const bestScore = candidates[0].score;
        const narrowed = bestScore >= 80
            ? candidates.filter(item => item.score >= Math.max(60, bestScore * 0.6))
            : candidates;
        return narrowed.slice(0, 3);
    }

    function currentFilter() {
        const element = document.getElementById('expert-equipment-filter');
        return element ? element.value : 'all';
    }

    function setAnalysisPhase(phase) {
        const modal = document.getElementById('expert-modal');
        if (modal) modal.classList.toggle('is-analyzing', phase === 'match');
    }

    function modelLabel(model) {
        const value = String(model || '').trim();
        if (/deepseek/i.test(value)) return 'DeepSeek';
        if (/mimo/i.test(value)) return 'MiMo';
        if (/glm/i.test(value)) return 'GLM';
        return value || 'LLM';
    }

    function emptyStateMarkup() {
        return `
            <div class="expert-empty-state">
                <span class="expert-empty-mark" aria-hidden="true">✦</span>
                <h3>今天想分析什么？</h3>
                <p>描述异常现象，我会按“现象理解、核验项、补充数据”组织建议。</p>
            </div>`;
    }

    function renderUserTurn(query) {
        return `<div class="expert-user-turn"><span>${escapeHtml(query)}</span></div>`;
    }

    function renderAlarmContext(alarm) {
        if (!alarm || !alarm.name) return '';
        return `<div class="expert-alarm-context"><span>预警带入</span><time>${escapeHtml(alarm.time || '刚刚')}</time><strong>${escapeHtml(alarm.name)}</strong></div>`;
    }

    function renderAnalysisTrace() {
        return `
            <div class="expert-analysis-trace" aria-label="正在分析">
                <span>正在理解现象</span><i></i>
                <span>正在整理核验项</span><i></i>
                <span>正在形成建议</span>
            </div>`;
    }

    function renderLoadingConversation(query, alarm) {
        const resultBox = document.getElementById('expert-results');
        if (!resultBox) return;
        resultBox.classList.remove('is-empty');
        resultBox.innerHTML = `${renderAlarmContext(alarm)}${renderUserTurn(query)}
            <article class="expert-assistant-message expert-message-loading">
                <div class="expert-message-head"><span class="expert-assistant-name"><i></i>${escapeHtml(modelLabel(gatewayHealth.model))} 正在分析</span></div>
                ${renderAnalysisTrace()}
                <div class="expert-typing"><span></span><span></span><span></span></div>
            </article>`;
    }

    function gatewayUrl() {
        return String(window.EXPERT_GATEWAY_URL || '').trim().replace(/\/$/, '');
    }

    function setStatus(mode) {
        const status = document.getElementById('expert-runtime-status');
        if (!status) return;
        const count = getRules().length;
        if (mode === 'connected' || gatewayHealth.state === 'ready') {
            status.className = 'expert-runtime-status is-connected';
            status.textContent = `${modelLabel(gatewayHealth.model)} 已连接`;
            return;
        }
        status.className = 'expert-runtime-status';
        if (gatewayHealth.state === 'checking') {
            status.textContent = '正在连接 LLM';
            return;
        }
        if (gatewayHealth.state === 'not_configured') {
            status.textContent = `本地规则 · ${count} 条`;
            return;
        }
        if (gatewayHealth.state === 'unavailable') {
            status.textContent = `本地规则 · 网关未启动`;
            return;
        }
        if (gatewayHealth.state === 'auth_rejected') {
            status.textContent = 'LLM 授权待核验';
            return;
        }
        if (gatewayHealth.state === 'provider_unavailable') {
            status.textContent = 'LLM 暂不可用 · 使用本地规则';
            return;
        }
        status.textContent = `本地规则 · ${count} 条`;
    }

    function renderRuleCard(rule, index, query) {
        const category = categoryFor(rule);
        const hint = CATEGORY_HINTS[category];
        const risk = riskFor(rule);
        const reasons = reasonItems(rule.cause).map(item => `<li>${highlight(item, query)}</li>`).join('');
        const checks = hint.checks.map(item => `<li>${escapeHtml(item)}</li>`).join('');
        const sourceId = `LOCAL-${String(index + 1).padStart(2, '0')}`;
        return `
            <section class="expert-response-section expert-local-rule">
                <div class="expert-response-section-head">
                    <h4>${highlight(rule.error, query)}</h4>
                    <span class="expert-risk ${risk.key}">${risk.label}</span>
                </div>
                <p class="expert-response-meta">${escapeHtml(CATEGORY_LABELS[category])} · 当前无实时数据，不判定是否已发生</p>
                <div class="expert-section">
                    <span class="expert-label-cause">可能原因</span>
                    <ol class="expert-list">${reasons}</ol>
                </div>
                <div class="expert-section">
                    <span class="expert-label-cause">建议先核验</span>
                    <ol class="expert-list">${checks}</ol>
                </div>
                <div class="expert-section">
                    <span class="expert-label-fix">处置建议</span>
                    <span class="expert-text">${highlight(rule.fix, query)}</span>
                </div>
                <div class="expert-section">
                    <span class="expert-label-cause">建议补充数据</span>
                    <span class="expert-text">${escapeHtml(hint.data)}</span>
                </div>
                <div class="expert-source">本地专家规则 ${sourceId} · ${escapeHtml(rule.error)}</div>
            </section>`;
    }

    function renderFeedback(query, matchedIds) {
        return `
            <div class="expert-feedback" id="expert-feedback">
                <span>本次诊断对你有帮助吗？</span>
                <button type="button" data-expert-feedback="helpful">有帮助</button>
                <button type="button" data-expert-feedback="needs-correction">需要修正</button>
                <span data-expert-feedback-state></span>
            </div>`;
    }

    function renderLocal(query, alarm) {
        const resultBox = document.getElementById('expert-results');
        if (!resultBox) return;
        const word = String(query || '').trim();
        if (!word) {
            setAnalysisPhase('idle');
            resultBox.classList.add('is-empty');
            resultBox.innerHTML = emptyStateMarkup();
            return;
        }
        resultBox.classList.remove('is-empty');
        const matches = findMatches(word, currentFilter());
        if (matches.length === 0) {
            resultBox.innerHTML = `${renderAlarmContext(alarm)}${renderUserTurn(word)}
                <article class="expert-assistant-message">
                    <div class="expert-message-head"><span class="expert-assistant-name"><i></i>本地规则检索</span></div>
                    ${renderAnalysisTrace()}
                    <section class="expert-response-section expert-reveal-1">
                        <h4>暂未匹配到可核验方案</h4>
                        <p class="expert-text">请补充设备、报警时间、关键点位与趋势；也可由有权限人员在“专家库配置”中补充规则。</p>
                    </section>
                </article>`;
            setAnalysisPhase('complete');
            return;
        }
        if (typeof window.saveExpertHistory === 'function') window.saveExpertHistory(word);
        if (typeof window.renderExpertHistory === 'function') window.renderExpertHistory();
        resultBox.innerHTML = `${renderAlarmContext(alarm)}${renderUserTurn(word)}
            <article class="expert-assistant-message">
                <div class="expert-message-head"><span class="expert-assistant-name"><i></i>本地规则检索</span></div>
                ${renderAnalysisTrace()}
                ${matches.map(match => renderRuleCard(match.rule, match.index, word)).join('')}
                <div class="expert-message-boundary">仅供现场核验，不执行控制</div>
            </article>` + renderFeedback(word, matches.map(match => match.index + 1));
        setAnalysisPhase('complete');
    }

    function renderGatewayAnswer(payload, query, alarm) {
        const resultBox = document.getElementById('expert-results');
        if (!resultBox) return;
        resultBox.classList.remove('is-empty');
        const risk = String(payload.riskLevel || 'medium').toLowerCase();
        const riskKey = ['high', 'medium', 'low'].includes(risk) ? risk : 'medium';
        const checks = Array.isArray(payload.checks) ? payload.checks : [];
        const actions = Array.isArray(payload.actions) ? payload.actions : [];
        const sources = Array.isArray(payload.sources) ? payload.sources : [];
        const checkMarkup = checks.length ? `<ol class="expert-list">${checks.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>` : '<span class="expert-text">未返回核验项。</span>';
        const actionMarkup = actions.length ? `<ol class="expert-list">${actions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>` : '<span class="expert-text">未返回处置建议。</span>';
        resultBox.innerHTML = `${renderAlarmContext(alarm)}${renderUserTurn(query)}
            <article class="expert-assistant-message">
                <div class="expert-message-head">
                    <span class="expert-assistant-name"><i></i>${escapeHtml(modelLabel(gatewayHealth.model))} 分析结果</span>
                    <span class="expert-risk ${riskKey}">${escapeHtml(payload.riskLevel || '需核验')}</span>
                </div>
                ${renderAnalysisTrace()}
                <section class="expert-response-section expert-reveal-1">
                    <h4>先给结论</h4>
                    <p class="expert-text">${escapeHtml(payload.answer || '未返回摘要。')}</p>
                </section>
                <section class="expert-response-section expert-reveal-2">
                    <h4>建议先核验</h4>
                    ${checkMarkup}
                </section>
                <section class="expert-response-section expert-reveal-3">
                    <h4>处置建议</h4>
                    ${actionMarkup}
                </section>
                <section class="expert-response-section expert-reveal-4">
                    <h4>建议补充数据</h4>
                    <p class="expert-text">${escapeHtml(payload.neededData || '请补充关键点位、时间范围和运行状态。')}</p>
                </section>
                <div class="expert-source">${sources.length ? `来源：${sources.map(escapeHtml).join('；')}` : '网关未返回可追溯来源'}</div>
                <div class="expert-message-boundary">仅供现场核验，不执行控制</div>
            </article>` + renderFeedback(query, []);
        setAnalysisPhase('complete');
        setStatus('connected');
    }

    async function requestGateway(query, alarm) {
        const endpoint = gatewayUrl();
        if (!endpoint || gatewayHealth.state !== 'ready') return false;
        const response = await fetch(endpoint + '/api/expert/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: query,
                equipment: currentFilter(),
                currentAlarm: alarm || null,
                recentMetrics: null
            })
        });
        if (!response.ok) {
            const failure = await response.json().catch(() => ({}));
            const error = new Error(`专家网关返回 ${response.status}`);
            error.code = failure.error;
            throw error;
        }
        renderGatewayAnswer(await response.json(), query, alarm);
        return true;
    }

    async function refreshGatewayHealth() {
        const endpoint = gatewayUrl();
        if (!endpoint) return;
        gatewayHealth = { state: 'checking', model: '' };
        setStatus();
        try {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 2500);
            const response = await fetch(endpoint + '/api/expert/health', { signal: controller.signal });
            window.clearTimeout(timeout);
            const payload = await response.json();
            if (response.ok && payload.status === 'ready') {
                gatewayHealth = { state: 'ready', model: String(payload.model || '') };
            } else {
                gatewayHealth = { state: 'not_configured', model: '' };
            }
        } catch (error) {
            gatewayHealth = { state: 'unavailable', model: '' };
        }
        setStatus();
    }

    async function sendFeedbackToGateway(record) {
        const endpoint = gatewayUrl();
        if (!endpoint || gatewayHealth.state !== 'ready') return;
        try {
            await fetch(endpoint + '/api/expert/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: record.question || null,
                    helpful: record.helpful,
                    correctedAnswer: null,
                    operator: 'local-web'
                })
            });
        } catch (error) {
            // 反馈同步失败不影响本地诊断或本机浏览器中的反馈留存。
        }
    }

    function saveFeedback(kind) {
        const input = document.getElementById('expert-search');
        const state = document.querySelector('[data-expert-feedback-state]');
        const record = {
            question: input ? input.value.trim() : '',
            helpful: kind === 'helpful',
            createdAt: new Date().toISOString(),
            mode: gatewayHealth.state === 'ready' ? 'gateway' : 'local'
        };
        try {
            const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
            saved.unshift(record);
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved.slice(0, 100)));
            if (state) state.textContent = '已记录，将用于后续规则校核。';
            if (state) state.className = 'is-saved';
            sendFeedbackToGateway(record);
        } catch (error) {
            if (state) state.textContent = '浏览器未能保存反馈，请稍后重试。';
        }
    }

    function loadPersistedRules() {
        try {
            const saved = JSON.parse(localStorage.getItem(RULES_KEY) || 'null');
            if (Array.isArray(saved) && saved.length && window.ExpertRules) window.ExpertRules.replace(saved);
        } catch (error) {
            // 本地缓存不合法时继续使用随页面发布的规则，避免影响页面其他功能。
        }
    }

    function persistRules() {
        try {
            localStorage.setItem(RULES_KEY, JSON.stringify(getRules()));
            setStatus();
        } catch (error) {
            window.console && window.console.warn('专家库规则未能保存到浏览器。', error);
        }
    }

    function bindEvents() {
        const input = document.getElementById('expert-search');
        const submit = document.getElementById('expert-submit');
        const filter = document.getElementById('expert-equipment-filter');
        const results = document.getElementById('expert-results');
        const diagnose = async function () {
            const query = input ? input.value.trim() : '';
            if (!query) {
                selectedAlarm = null;
                return renderLocal('');
            }
            const alarm = selectedAlarm;
            selectedAlarm = null;
            setAnalysisPhase('match');
            renderLoadingConversation(query, alarm);
            if (submit) {
                submit.disabled = true;
                submit.classList.add('is-loading');
                const label = submit.querySelector('.expert-submit-label');
                if (label) label.textContent = '分析中';
            }
            try {
                const usedGateway = await requestGateway(query, alarm);
                if (!usedGateway) renderLocal(query, alarm);
            } catch (error) {
                setStatus();
                renderLocal(query, alarm);
                const state = error.code === 'upstream_auth_rejected'
                    ? 'auth_rejected'
                    : error.code === 'upstream_temporarily_unavailable'
                        ? 'provider_unavailable'
                        : 'unavailable';
                gatewayHealth = { state, model: '' };
                setStatus();
            } finally {
                if (submit) {
                    submit.disabled = false;
                    submit.classList.remove('is-loading');
                    const label = submit.querySelector('.expert-submit-label');
                    if (label) label.textContent = '分析';
                }
            }
        };
        if (submit) submit.addEventListener('click', diagnose);
        if (input) input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                diagnose();
            }
        });
        if (filter) filter.addEventListener('change', () => renderLocal(input ? input.value.trim() : ''));
        if (results) results.addEventListener('click', event => {
            const button = event.target.closest('[data-expert-feedback]');
            if (button) saveFeedback(button.dataset.expertFeedback);
        });
    }

    function init() {
        loadPersistedRules();
        bindEvents();
        setStatus();
        refreshGatewayHealth();
    }

    window.ExpertAssistant = {
        search: renderLocal,
        selectAlarm: function (alarm) {
            selectedAlarm = alarm && alarm.name
                ? { id: alarm.id || null, time: String(alarm.time || ''), name: String(alarm.name) }
                : null;
        },
        reset: function () {
            selectedAlarm = null;
            setStatus();
            renderLocal('');
        },
        persistRules: persistRules,
        getRuleCount: function () { return getRules().length; }
    };

    init();
}());
