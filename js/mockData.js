// ================= 1. 宏观大屏：海量数据字典引擎 =================
// 生成波动的模拟数据
const randomVal = (base, wave) => (base + (Math.random() * wave - wave/2)).toFixed(2);

// 供用户配置选取的"数据指标"字典 (共 45 项，工程实际)
const mainMetricsDict = {
    // ── 产水/进水总量 ──
    'flow_in':       { name: '今日进水总量', unit: 'm³', color: '#00f3ff', gen: () => randomVal(12500, 500) },
    'flow_out':      { name: '今日产水总量', unit: 'm³', color: '#00fa9a', gen: () => randomVal(8500, 300) },
    'recovery':      { name: '系统实时回收率', unit: '%', color: '#ffeb3b', gen: () => randomVal(68.5, 2) },
    'uf_flow':       { name: 'UF 产水瞬时通量', unit: 'm³/h', color: '#3f51b5', gen: () => randomVal(45.0, 2.0) },
    'ro_flow':       { name: 'RO 产水瞬时流量', unit: 'm³/h', color: '#03a9f4', gen: () => randomVal(12.5, 0.5) },
    'ro_conc_flow':  { name: 'RO 浓水排放流量', unit: 'm³/h', color: '#ff5722', gen: () => randomVal(5.5, 0.3) },
    // ── UF 膜参数 ──
    'tmp_uf_a':      { name: 'UF-A段 跨膜压差', unit: 'MPa', color: '#ff4d4f', gen: () => randomVal(0.07, 0.02) },
    'tmp_uf_b':      { name: 'UF-B段 跨膜压差', unit: 'MPa', color: '#e91e63', gen: () => randomVal(0.08, 0.02) },
    'uf_flux_norm':  { name: 'UF 标准化通量衰减率', unit: '%', color: '#ff9800', gen: () => randomVal(5.5, 2) },
    'uf_backwash_t': { name: 'UF 物理反洗剩余时间', unit: 'min', color: '#00bcd4', gen: () => randomVal(45, 10) },
    'uf_ceb_t':      { name: 'UF CEB 化学清洗倒计时', unit: 'h', color: '#9c27b0', gen: () => randomVal(18, 4) },
    // ── RO 膜参数 ──
    'ro_press_in':   { name: 'RO 进水压力 (高压泵后)', unit: 'MPa', color: '#4caf50', gen: () => randomVal(1.2, 0.1) },
    'ro_press_out':  { name: 'RO 浓水侧压力', unit: 'MPa', color: '#8bc34a', gen: () => randomVal(0.95, 0.08) },
    'ro_diff_1':     { name: 'RO 一段段间压差', unit: 'MPa', color: '#ff9800', gen: () => randomVal(0.12, 0.03) },
    'ro_diff_2':     { name: 'RO 二段段间压差', unit: 'MPa', color: '#ffc107', gen: () => randomVal(0.09, 0.02) },
    'ro_salt_rej':   { name: 'RO 实时脱盐率', unit: '%', color: '#00f3ff', gen: () => randomVal(99.1, 0.3) },
    'ro_perm_coef':  { name: 'RO 标准化透水系数', unit: 'LMH/bar', color: '#03a9f4', gen: () => randomVal(2.8, 0.3) },
    // ── 水质指标 ──
    'turb_in':       { name: 'UF 进水浊度', unit: 'NTU', color: '#ff4d4f', gen: () => randomVal(12.5, 1.5) },
    'turb_out':      { name: 'UF 产水浊度', unit: 'NTU', color: '#ff9800', gen: () => randomVal(0.08, 0.04) },
    'sdi_val':       { name: 'RO 进水 SDI₁₅ 值', unit: '', color: '#009688', gen: () => randomVal(2.8, 0.5) },
    'cond_in':       { name: 'RO 进水电导率', unit: 'μS/cm', color: '#00f3ff', gen: () => randomVal(850, 50) },
    'cond_out':      { name: 'RO 产水电导率', unit: 'μS/cm', color: '#00fa9a', gen: () => randomVal(13.2, 0.8) },
    'ph_val':        { name: '进水 pH 值', unit: '', color: '#ffeb3b', gen: () => randomVal(7.2, 0.2) },
    'orp_val':       { name: 'RO 进水 ORP 值', unit: 'mV', color: '#f44336', gen: () => randomVal(180, 30) },
    'cl2_val':       { name: 'RO 进水余氯浓度', unit: 'mg/L', color: '#e91e63', gen: () => randomVal(0.04, 0.02) },
    'temp_val':      { name: '进水温度', unit: '℃', color: '#03a9f4', gen: () => randomVal(22.5, 3) },
    'cod_val':       { name: '原水 COD 值', unit: 'mg/L', color: '#795548', gen: () => randomVal(8.5, 1.5) },
    'hardness_val':  { name: '原水总硬度', unit: 'mg/L', color: '#607d8b', gen: () => randomVal(180, 15) },
    // ── 水箱液位 ──
    'raw_level':     { name: '原水箱液位', unit: 'm', color: '#00fa9a', gen: () => randomVal(2.5, 0.3) },
    'uf_level':      { name: 'UF 产水箱液位', unit: 'm', color: '#8bc34a', gen: () => randomVal(3.2, 0.4) },
    'ro_level':      { name: 'RO 产水箱液位', unit: 'm', color: '#03a9f4', gen: () => randomVal(2.8, 0.3) },
    'soft_level':    { name: '软水箱液位', unit: 'm', color: '#cddc39', gen: () => randomVal(2.8, 0.3) },
    'chem_level':    { name: 'CIP 清洗水箱液位', unit: 'm', color: '#ffc107', gen: () => randomVal(0.5, 0.1) },
    // ── 加药系统 ──
    'dose_bac':      { name: '杀菌剂投加流量', unit: 'L/h', color: '#f44336', gen: () => randomVal(1.5, 0.2) },
    'dose_red':      { name: '还原剂投加流量', unit: 'L/h', color: '#673ab7', gen: () => randomVal(2.0, 0.3) },
    'dose_sca':      { name: '阻垢剂投加流量', unit: 'L/h', color: '#3f51b5', gen: () => randomVal(3.5, 0.4) },
    'dose_acid':     { name: '酸投加泵流量', unit: 'L/h', color: '#ff9800', gen: () => randomVal(1.2, 0.2) },
    'dose_alkali':   { name: '碱投加泵流量', unit: 'L/h', color: '#9c27b0', gen: () => randomVal(0.8, 0.15) },
    // ── 过滤器 ──
    'self_clean_diff':{ name: '自清洗过滤器压差', unit: 'MPa', color: '#00bcd4', gen: () => randomVal(0.04, 0.01) },
    'multi_diff':    { name: '多介质过滤器压差', unit: 'MPa', color: '#ff9800', gen: () => randomVal(0.08, 0.02) },
    'sec_filter_diff':{ name: '保安过滤器压差', unit: 'MPa', color: '#ff5722', gen: () => randomVal(0.05, 0.01) },
    // ── 泵/能耗/其他 ──
    'pump_hp_freq':  { name: 'RO 高压泵运行频率', unit: 'Hz', color: '#9c27b0', gen: () => randomVal(43.0, 1.5) },
    'pump_hp_curr':  { name: 'RO 高压泵运行电流', unit: 'A', color: '#673ab7', gen: () => randomVal(28.5, 1.5) },
    'air_press':     { name: '仪表空气压力', unit: 'MPa', color: '#00bcd4', gen: () => randomVal(0.58, 0.04) },
    'energy_total':  { name: '今日总耗电量', unit: 'kWh', color: '#ffeb3b', gen: () => randomVal(3250, 100) },
    'energy_perton': { name: '吨水耗电量', unit: 'kWh/m³', color: '#ffc107', gen: () => randomVal(0.42, 0.03) },
    'chem_total':    { name: '今日药剂总消耗', unit: 'kg', color: '#9c27b0', gen: () => randomVal(45.5, 2.5) }
};

// 供用户配置选取的"动态图表"字典 (共 8 项)
const mainChartsDict = {
    'chart_flow':  { name: '📊 产水量与回收率时序趋势', type: 'flow' },
    'chart_wq':    { name: '📈 核心水质 (浊度/电导率) 波动', type: 'wq' },
    'chart_eng':   { name: '🔋 吨水能耗与成本分析动态图', type: 'energy' },
    'chart_press': { name: '🎛️ UF-RO 核心节点压差变化图', type: 'press' },
    'chart_level': { name: '🪣 水箱液位对比趋势', type: 'level' },
    'chart_dose':  { name: '💉 加药系统投加量分布', type: 'dose' },
    'chart_pump':  { name: '⚡ 高压泵运行参数', type: 'pump' },
    'chart_sdi':   { name: '🔬 SDI/ORP 水质综合', type: 'sdi' }
};

// ================= 2. 默认配置与 LocalStorage 记忆 =================
const defaultDashboardConfig = {
    'panel-custom-1': { title: '生产运行总览', mode: 'data', items: ['flow_in', 'flow_out', 'recovery', 'uf_flow', 'ro_flow', 'energy_total', 'chem_total'] },
    'panel-custom-2': { title: '全流程水质监控', mode: 'data', items: ['turb_in', 'turb_out', 'cond_in', 'cond_out', 'ph_val', 'orp_val', 'cl2_val'] },
    'panel-custom-3': { title: '膜组件与过滤器工况', mode: 'data', items: ['tmp_uf_a', 'tmp_uf_b', 'ro_press_in', 'ro_press_out', 'ro_diff_1', 'multi_diff', 'pump_hp_freq'] },
    'panel-custom-4': { title: '药剂投加与单耗分析', mode: 'data', items: ['energy_perton', 'dose_bac', 'dose_red', 'dose_sca', 'dose_acid', 'dose_alkali', 'raw_level'] }
};

let dashboardConfig = {};
try {
    const saved = localStorage.getItem('lefilm_main_dashboard');
    if (saved) {
        const parsed = JSON.parse(saved);
        // v2 升级：旧 key 不存在于新字典则丢弃缓存
        var hasOldKeys = false;
        for (var pid in parsed) {
            var conf = parsed[pid];
            if (conf.mode === 'data' && conf.items) {
                for (var i = 0; i < conf.items.length; i++) {
                    if (!mainMetricsDict[conf.items[i]]) { hasOldKeys = true; break; }
                }
            }
            if (hasOldKeys) break;
        }
        dashboardConfig = hasOldKeys ? JSON.parse(JSON.stringify(defaultDashboardConfig)) : parsed;
    } else {
        dashboardConfig = JSON.parse(JSON.stringify(defaultDashboardConfig));
    }
} catch(e) {
    dashboardConfig = JSON.parse(JSON.stringify(defaultDashboardConfig));
}

let activeEcharts = {}; // 存储图表实例

// ================= 3. 核心渲染引擎 =================
function renderCustomPanels() {
    const panelIds = ['panel-custom-1', 'panel-custom-2', 'panel-custom-3', 'panel-custom-4'];
    
    panelIds.forEach(id => {
        const conf = dashboardConfig[id];
        const container = document.getElementById(id);
        if(!container) return;

        // 渲染外层标题和设置按钮
        let html = `
            <div class="toggle-btn ${id === 'panel-custom-4' ? 'right-btn' : 'left-btn'}" onclick="togglePanel('${id}', '${id === 'panel-custom-4' ? 'right' : 'left'}')"></div>
            <div class="custom-panel-header">
                <div class="module-title" style="margin:0; border:none; padding:0;">${conf.title}</div>
                <button class="custom-config-btn" onclick="openMainConfig('${id}')">⚙️ 配置</button>
            </div>
            <div id="content-${id}" class="custom-panel-content"></div>
        `;
        container.innerHTML = html;

        const contentBox = document.getElementById(`content-${id}`);

        // 渲染内容
        if (conf.mode === 'data') {
            let dataHtml = '';
            conf.items.forEach(metricKey => {
                const metric = mainMetricsDict[metricKey];
                if(metric) {
                    dataHtml += `
                        <div class="dynamic-data-item">
                            <span class="dynamic-data-name">${metric.name}</span>
                            <div>
                                <span class="dynamic-data-val" style="color:${metric.color}" id="val-${id}-${metricKey}">${metric.gen()}</span>
                                <span style="font-size:10px; color:#888; margin-left:2px;">${metric.unit}</span>
                            </div>
                        </div>`;
                }
            });
            contentBox.innerHTML = dataHtml;
        } else if (conf.mode === 'chart') {
            contentBox.innerHTML = `<div id="chart-${id}" style="width:100%; height:130px;"></div>`;
            renderEChart(`chart-${id}`, conf.chartId);
        }
    });
}

function renderEChart(domId, chartType) {
    if (activeEcharts[domId]) activeEcharts[domId].dispose();
    const dom = document.getElementById(domId);
    if(!dom) return;
    const chart = echarts.init(dom);
    activeEcharts[domId] = chart;

    let option = {};
    const timeData = ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'];

    if(chartType === 'chart_wq') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '12%', bottom: '14%', top: '18%' },
            legend: { data: ['浊度', '电导率'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: [
                { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
                { type: 'value', position: 'right', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { show: false } }
            ],
            series: [
                { name: '浊度', type: 'line', smooth: true, data: [0.15, 0.14, 0.16, 0.12, 0.15, 0.14, 0.13], itemStyle: { color: '#ff4d4f' }, symbol: 'none' },
                { name: '电导率', type: 'line', smooth: true, yAxisIndex: 1, data: [13.2, 13.5, 13.1, 13.8, 13.4, 13.6, 13.5], itemStyle: { color: '#00f3ff' }, symbol: 'none' }
            ]
        };
    } else if(chartType === 'chart_eng') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '5%', bottom: '14%', top: '18%' },
            legend: { data: ['吨水耗电'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
            series: [{ name: '吨水耗电', type: 'line', areaStyle: { color: 'rgba(255,235,59,0.2)' }, smooth: true, data: [0.42, 0.41, 0.43, 0.40, 0.44, 0.42, 0.41], itemStyle: { color: '#ffeb3b' }, symbol: 'none' }]
        };
    } else if(chartType === 'chart_press') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '5%', bottom: '14%', top: '18%' },
            legend: { data: ['超滤TMP'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
            series: [{ name: '超滤TMP', type: 'bar', barWidth: '40%', data: [0.06, 0.065, 0.07, 0.08, 0.075, 0.085, 0.08], itemStyle: { color: '#00fa9a' } }]
        };
    } else if(chartType === 'chart_level') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '5%', bottom: '14%', top: '18%' },
            legend: { data: ['原水箱', 'UF水箱', '软水箱'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
            series: [
                { name: '原水箱', type: 'line', smooth: true, data: [2.4, 2.5, 2.3, 2.6, 2.4, 2.5, 2.6], itemStyle: { color: '#00fa9a' }, symbol: 'none' },
                { name: 'UF水箱', type: 'line', smooth: true, data: [3.1, 3.2, 3.0, 3.3, 3.2, 3.1, 3.2], itemStyle: { color: '#8bc34a' }, symbol: 'none' },
                { name: '软水箱', type: 'line', smooth: true, data: [2.7, 2.8, 2.6, 2.9, 2.8, 2.7, 2.9], itemStyle: { color: '#cddc39' }, symbol: 'none' }
            ]
        };
    } else if(chartType === 'chart_dose') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '5%', bottom: '14%', top: '18%' },
            legend: { data: ['杀菌剂', '还原剂', '阻垢剂'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
            series: [
                { name: '杀菌剂', type: 'bar', barWidth: '25%', data: [1.4, 1.5, 1.6, 1.3, 1.5, 1.6, 1.4], itemStyle: { color: '#f44336' }, barGap: '10%' },
                { name: '还原剂', type: 'bar', barWidth: '25%', data: [1.9, 2.0, 2.1, 1.8, 2.0, 2.2, 1.9], itemStyle: { color: '#673ab7' } },
                { name: '阻垢剂', type: 'bar', barWidth: '25%', data: [3.4, 3.5, 3.6, 3.3, 3.5, 3.4, 3.6], itemStyle: { color: '#3f51b5' } }
            ]
        };
    } else if(chartType === 'chart_pump') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '12%', bottom: '14%', top: '18%' },
            legend: { data: ['频率', '进水压力'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: [
                { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
                { type: 'value', position: 'right', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { show: false } }
            ],
            series: [
                { name: '频率', type: 'line', smooth: true, data: [42.5, 43.0, 42.8, 43.2, 43.5, 43.1, 43.0], itemStyle: { color: '#9c27b0' }, symbol: 'none' },
                { name: '进水压力', type: 'line', smooth: true, yAxisIndex: 1, data: [1.18, 1.22, 1.20, 1.25, 1.23, 1.21, 1.24], itemStyle: { color: '#4caf50' }, symbol: 'none' }
            ]
        };
    } else if(chartType === 'chart_sdi') {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '12%', bottom: '14%', top: '18%' },
            legend: { data: ['SDI', 'ORP'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: [
                { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
                { type: 'value', position: 'right', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { show: false } }
            ],
            series: [
                { name: 'SDI', type: 'line', smooth: true, data: [2.7, 2.8, 2.6, 2.9, 2.8, 3.0, 2.7], itemStyle: { color: '#009688' }, symbol: 'none' },
                { name: 'ORP', type: 'line', smooth: true, yAxisIndex: 1, data: [175, 180, 185, 178, 182, 190, 176], itemStyle: { color: '#f44336' }, symbol: 'none' }
            ]
        };
    } else {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '12%', right: '5%', bottom: '14%', top: '18%' },
            legend: { data: ['产水量'], textStyle: { color: '#fff', fontSize: 7 }, top: 0 },
            xAxis: { type: 'category', data: timeData, axisLabel: { color: '#8898aa', fontSize: 7 } },
            yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 7 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
            series: [{ name: '产水量', type: 'line', smooth: true, data: [45, 46, 44, 47, 45, 46, 45], itemStyle: { color: '#3f51b5' }, symbol: 'none' }]
        };
    }

    chart.setOption(option);
}

// ================= 4. 配置弹窗交互 =================
let configTargetPanel = '';
let currentConfigMode = 'data'; 

window.openMainConfig = function(panelId) {
    configTargetPanel = panelId;
    const conf = dashboardConfig[panelId];
    document.getElementById('custom-panel-title').value = conf.title;
    
    let dataHtml = '';
    for(let key in mainMetricsDict) {
        let isChecked = (conf.mode === 'data' && conf.items.includes(key)) ? 'checked' : '';
        dataHtml += `
            <label style="display:flex; align-items:center; color:#b0c4de; font-size: 12px; cursor: pointer;">
                <input type="checkbox" class="config-cb-data" value="${key}" ${isChecked} onchange="limitDataSelection(this)" style="margin-right: 5px;"> 
                ${mainMetricsDict[key].name}
            </label>`;
    }
    document.getElementById('main-metric-list').innerHTML = dataHtml;

    let chartHtml = '';
    for(let key in mainChartsDict) {
        let isChecked = (conf.mode === 'chart' && conf.chartId === key) ? 'checked' : '';
        chartHtml += `
            <label style="display:flex; align-items:center; color:#b0c4de; font-size: 12px; margin-bottom: 5px; cursor: pointer;">
                <input type="radio" name="config-rb-chart" value="${key}" ${isChecked} style="margin-right: 8px;"> 
                ${mainChartsDict[key].name}
            </label>`;
    }
    document.getElementById('main-chart-list').innerHTML = chartHtml;

    switchConfigTab(conf.mode);
    document.getElementById('main-config-modal').classList.add('show');
};

window.switchConfigTab = function(mode) {
    currentConfigMode = mode;
    document.getElementById('tab-btn-data').classList.toggle('active', mode === 'data');
    document.getElementById('tab-btn-chart').classList.toggle('active', mode === 'chart');
    document.getElementById('config-area-data').style.display = mode === 'data' ? 'block' : 'none';
    document.getElementById('config-area-chart').style.display = mode === 'chart' ? 'block' : 'none';
};

window.limitDataSelection = function(cb) {
    const checked = document.querySelectorAll('.config-cb-data:checked');
    if(checked.length > 7) {
        cb.checked = false;
        alert("⚠️ 面板空间有限，最多只能挑选 7 个数据指标！");
    }
};

window.saveMainConfig = function() {
    const title = document.getElementById('custom-panel-title').value.trim() || '未命名版块';
    if (currentConfigMode === 'data') {
        const checked = Array.from(document.querySelectorAll('.config-cb-data:checked')).map(cb => cb.value);
        if(checked.length === 0) return alert("请至少选择 1 个数据指标！");
        dashboardConfig[configTargetPanel] = { title: title, mode: 'data', items: checked };
    } else {
        const selectedChart = document.querySelector('input[name="config-rb-chart"]:checked');
        if(!selectedChart) return alert("请选择 1 个动态图表！");
        dashboardConfig[configTargetPanel] = { title: title, mode: 'chart', chartId: selectedChart.value };
    }
    localStorage.setItem('lefilm_main_dashboard', JSON.stringify(dashboardConfig));
    renderCustomPanels();
    closeMainConfigModal();
};

window.closeMainConfigModal = function() {
    document.getElementById('main-config-modal').classList.remove('show');
};

setInterval(() => {
    for(const panelId in dashboardConfig) {
        const conf = dashboardConfig[panelId];
        if (conf.mode === 'data') {
            conf.items.forEach(metricKey => {
                const dom = document.getElementById(`val-${panelId}-${metricKey}`);
                if(dom && mainMetricsDict[metricKey]) dom.innerText = mainMetricsDict[metricKey].gen();
            });
        }
    }
}, 3000);

window.addEventListener('resize', () => { Object.values(activeEcharts).forEach(c => c.resize()); });

// ================= 5. 💥找回被误删的系统时钟与预警日志逻辑💥 =================

window.startLiveClock = function() {
    const clockDom = document.getElementById('sys-time');
    if(!clockDom) return;
    setInterval(() => {
        const now = new Date();
        clockDom.innerText = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    }, 1000);
};

window.updateSystemStatus = function(status) {
    const textDom = document.getElementById('sys-status-text');
    const orbDom = document.getElementById('sys-status-orb');
    if(textDom && orbDom) {
        textDom.innerText = '系统正常运行';
        orbDom.style.background = '#00fa9a';
        orbDom.style.boxShadow = '0 0 10px #00fa9a';
    }
};

window.scheduleAlerts = function() {
    const alertList = document.getElementById('alert-list');
    if(!alertList) return;
    
    // 初始化 5 条假日志
    const msgs = [
        { type: 'info', text: '1# 多介质过滤器反洗结束，恢复供水。' },
        { type: 'info', text: '超滤 A 段产水浊度 0.08 NTU，达标。' },
        { type: 'warn', text: '⚠ 反渗透一段压差上升，AI 正在分析。' },
        { type: 'info', text: '加药系统计量泵 M-102 频率自动微调。' },
        { type: 'info', text: '系统与远端 PLC 通讯心跳正常。' }
    ];

    let html = '';
    msgs.forEach((m, idx) => {
        let time = new Date(Date.now() - (5-idx) * 600000).toLocaleTimeString('zh-CN', {hour12:false});
        let color = m.type === 'warn' ? '#ff4d4f' : '#b0c4de';
        let bg = m.type === 'warn' ? 'rgba(255,77,79,0.1)' : 'rgba(255,255,255,0.03)';
        html += `<div class="dynamic-data-item" style="background: ${bg}; border-left-color: ${color}; padding: 3px 6px;">
            <span style="color: #8898aa; font-size: 10px; margin-right: 6px;">[${time}]</span> 
            <span style="color: ${color}; font-size: 11px; flex:1;">${m.text}</span>
        </div>`;
    });
    alertList.innerHTML = html;

    // 每 8 秒自动滚动新增一条日志
    setInterval(() => {
        const m = msgs[Math.floor(Math.random() * msgs.length)];
        const time = new Date().toLocaleTimeString('zh-CN', {hour12:false});
        const color = m.type === 'warn' ? '#ff4d4f' : '#b0c4de';
        const bg = m.type === 'warn' ? 'rgba(255,77,79,0.1)' : 'rgba(255,255,255,0.03)';
        const newAlert = document.createElement('div');
        newAlert.className = "dynamic-data-item";
        newAlert.style.cssText = `background: ${bg}; border-left-color: ${color}; padding: 3px 6px; animation: fadeIn 0.5s;`;
        newAlert.innerHTML = `<span style="color: #8898aa; font-size: 10px; margin-right: 6px;">[${time}]</span> <span style="color: ${color}; font-size: 11px; flex:1;">${m.text}</span>`;
        alertList.prepend(newAlert);
        // 超过 8 条则移除最后一条，防止列表溢出
        if(alertList.children.length > 8) alertList.removeChild(alertList.lastChild);
    }, 8000);
};

// 暴露给全局并在稍后执行
window.renderCustomPanels = renderCustomPanels;
setTimeout(renderCustomPanels, 100);
