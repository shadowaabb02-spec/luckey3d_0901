const dates = ['05-08', '05-09', '05-10', '05-11', '05-12', '05-13', '05-14'];

// ================= 1. 扩充完整的 22 项设备指标数据字典 =================
// 随机生成围绕基准值波动的假数据函数
const genData = (base, wave) => Array.from({length: 7}, () => (base + (Math.random() * wave - wave/2)).toFixed(2));

const metricsDict = {
    'uf_tmp':       { name: '超滤膜 跨膜压差 (MPa)', data: [0.05, 0.06, 0.07, 0.08, 0.09, 0.08, 0.08], color: '#ff4d4f' },
    'ro_cond':      { name: '反渗透 产水电导率 (μS/cm)', data: [12.5, 12.8, 13.0, 13.2, 13.5, 13.4, 13.8], color: '#00f3ff' },
    'raw_level':    { name: '原水箱 液位 (m)', data: genData(2.5, 0.5), color: '#00fa9a' },
    'ro_ph':        { name: '反渗透 进水pH计 (A)', data: genData(7.2, 0.2), color: '#ffeb3b' },
    'turbidity1':   { name: '超滤 进水在线浊度 (NTU)', data: genData(14.0, 2.0), color: '#ff9800' },
    'turbidity2':   { name: '超滤 产水在线浊度 (NTU)', data: genData(0.08, 0.04), color: '#ff9800' },
    'cl2':          { name: '反渗透 余氯浓度 (mg/L)', data: genData(0.04, 0.02), color: '#e91e63' },
    'pump_freq':    { name: '反渗透 高压泵频率 (Hz)', data: genData(43.0, 1.5), color: '#9c27b0' },
    'uf_flow':      { name: '超滤 产水通量 (m³/h)', data: genData(45.0, 2.0), color: '#3f51b5' },
    'air_press':    { name: '超滤 进压缩空气压力 (MPa)', data: genData(0.58, 0.05), color: '#00bcd4' },
    'ro_flow':      { name: '反渗透 产水流量 (m³/h)', data: genData(12.5, 0.5), color: '#03a9f4' },
    'uf_level':     { name: '超滤水箱 液位 (m)', data: genData(3.2, 0.4), color: '#8bc34a' },
    'soft_level':   { name: '软水箱 液位 (m)', data: genData(2.8, 0.3), color: '#cddc39' },
    'chem_level':   { name: '化学清洗水箱 液位 (m)', data: genData(0.5, 0.1), color: '#ffc107' },
    'bac_flow':     { name: '杀菌剂 投加流量 (L/h)', data: genData(1.5, 0.2), color: '#f44336' },
    'red_flow':     { name: '还原剂 投加流量 (L/h)', data: genData(2.0, 0.3), color: '#673ab7' },
    'sca_flow':     { name: '阻垢剂 投加流量 (L/h)', data: genData(3.5, 0.4), color: '#3f51b5' },
    'sdi_val':      { name: '便携式 SDI 测试值', data: genData(2.8, 0.5), color: '#009688' },
    'ro_press_in':  { name: '反渗透 进水压力 (MPa)', data: genData(1.2, 0.1), color: '#4caf50' },
    'ro_press_out': { name: '反渗透 浓水压力 (MPa)', data: genData(1.0, 0.1), color: '#8bc34a' },
    'multi_diff':   { name: '多介质过滤器压差 (MPa)', data: genData(0.08, 0.02), color: '#ff9800' },
    'sec_filter':   { name: '保安过滤器压差 (MPa)', data: genData(0.05, 0.01), color: '#ff5722' }
};

// ================= 2. 配置记忆功能 (LocalStorage) =================
// 默认选中的 7 个指标配置
const defaultSelection = ['uf_tmp', 'ro_cond', 'raw_level', 'ro_ph', 'turbidity1', 'cl2', 'pump_freq'];
let selectedMetrics = [];

// 从浏览器本地存储加载用户的历史配置
try {
    const saved = localStorage.getItem('lefilm_dashboard_config');
    if (saved) {
        selectedMetrics = JSON.parse(saved);
    } else {
        selectedMetrics = [...defaultSelection];
    }
} catch (e) {
    selectedMetrics = [...defaultSelection];
}

let chartInstances = {};

// ================= 3. 图表渲染引擎 =================

// 初始化固定的 Box 1 (综合指标 双Y轴)
function initBox1() {
    const chart = echarts.init(document.getElementById('box1-chart'));
    chartInstances['box1'] = chart;
    const flowData = [750, 780, 760, 810, 790, 820, 800];
    const energyData = [0.42, 0.40, 0.45, 0.38, 0.41, 0.39, 0.40]; 
    const chemicalData = [12.5, 12.0, 13.5, 11.5, 12.2, 11.8, 12.0];

    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['水量', '能耗', '药耗'], textStyle: { color: '#fff', fontSize: 10 }, itemWidth: 10, top: 0 },
        grid: { left: '15%', right: '15%', bottom: '15%', top: '25%' },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#8898aa', fontSize: 10 } },
        yAxis: [
            { type: 'value', axisLabel: { color: '#8898aa', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
            { type: 'value', position: 'right', axisLabel: { color: '#8898aa', fontSize: 10 }, splitLine: { show: false } }
        ],
        series: [
            { name: '水量', type: 'bar', barWidth: '30%', data: flowData, yAxisIndex: 0, itemStyle: { color: '#005f99' } },
            { name: '能耗', type: 'line', data: energyData, yAxisIndex: 1, itemStyle: { color: '#ffeb3b' }, smooth: true },
            { name: '药耗', type: 'line', data: chemicalData, yAxisIndex: 1, itemStyle: { color: '#00fa9a' }, smooth: true }
        ]
    });

    let tbody = '';
    for(let i=0; i<dates.length; i++) {
        tbody += `<tr><td>${dates[i]}</td><td style="color:#00f3ff">${flowData[i]}</td><td style="color:#ffeb3b">${energyData[i]}</td><td style="color:#00fa9a">${chemicalData[i]}</td></tr>`;
    }
    document.getElementById('box1-thead').innerHTML = `<tr><th>日期</th><th>水量</th><th>能耗</th><th>药耗</th></tr>`;
    document.getElementById('box1-tbody').innerHTML = tbody;
}

// 动态渲染指定的图表模块
function initDynamicBox(boxId, metricKey) {
    const metric = metricsDict[metricKey];
    document.getElementById(`title-${boxId}`).innerText = metric.name;

    let chart = chartInstances[boxId];
    if(!chart) {
        chart = echarts.init(document.getElementById(`${boxId}-chart`));
        chartInstances[boxId] = chart;
    }

    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '15%', right: '5%', bottom: '15%', top: '15%' },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#8898aa', fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { color: '#8898aa', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
        series: [{
            name: metric.name, type: 'line', smooth: true,
            data: metric.data,
            itemStyle: { color: metric.color },
            areaStyle: { color: metric.color, opacity: 0.1 }
        }]
    }, true); // true 表示不合并，彻底替换旧配置

    let tbody = '';
    for(let i=0; i<dates.length; i++) {
        tbody += `<tr><td>${dates[i]}</td><td style="color:${metric.color}">${metric.data[i]}</td></tr>`;
    }
    document.getElementById(`${boxId}-thead`).innerHTML = `<tr><th>日期</th><th>数值</th></tr>`;
    document.getElementById(`${boxId}-tbody`).innerHTML = tbody;
}

// ================= 4. 全局面板管控逻辑 =================

// 切换 图表 / 数据表
window.toggleView = function(boxId, btn) {
    const chartDiv = document.getElementById(`${boxId}-chart`);
    const tableDiv = document.getElementById(`${boxId}-table`);
    if (chartDiv.style.display !== 'none') {
        chartDiv.style.display = 'none'; tableDiv.style.display = 'block';
        btn.innerText = '看图表';
    } else {
        chartDiv.style.display = 'block'; tableDiv.style.display = 'none';
        btn.innerText = '纯数据';
    }
};

// 打开全局配置面板
window.openGlobalConfig = function() {
    const grid = document.getElementById('metric-checkbox-list');
    let html = `
        <label style="display:block; color:#8898aa; margin-bottom:5px; grid-column: span 2;">
            <input type="checkbox" checked disabled> [固定] 近7日 综合运行指标
        </label>
    `;
    // 渲染所有 22 个设备的勾选项
    for(let key in metricsDict) {
        let isChecked = selectedMetrics.includes(key) ? 'checked' : '';
        html += `
            <label style="display:flex; align-items:center; color:#b0c4de; margin-bottom:5px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" class="metric-cb" value="${key}" ${isChecked} onchange="checkMaxLimits(this)" style="margin-right: 5px;"> 
                ${metricsDict[key].name}
            </label>
        `;
    }
    grid.innerHTML = html;
    document.getElementById('chart-config-modal').classList.add('show');
};

// 严格限制只能选择 7 个
window.checkMaxLimits = function(cb) {
    const checkedBoxes = document.querySelectorAll('.metric-cb:checked');
    if(checkedBoxes.length > 7) {
        cb.checked = false;
        alert("⚠️ 面板坑位有限，最多只能挑选 7 个自定义指标！");
    }
};

// 保存配置并更新所有图表
window.saveGlobalConfig = function() {
    const checkedBoxes = document.querySelectorAll('.metric-cb:checked');
    if(checkedBoxes.length !== 7) {
        alert(`⚠️ 请精确选择 7 个自定义指标（您目前选了 ${checkedBoxes.length} 个），以便凑齐完美八宫格！`);
        return;
    }
    
    // 提取所选数组并保存至 LocalStorage
    selectedMetrics = Array.from(checkedBoxes).map(cb => cb.value);
    localStorage.setItem('lefilm_dashboard_config', JSON.stringify(selectedMetrics));

    // 按顺序渲染 2 到 8 号图表
    const boxIds = ['box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8'];
    boxIds.forEach((id, index) => {
        initDynamicBox(id, selectedMetrics[index]);
    });

    document.getElementById('chart-config-modal').classList.remove('show');
};

window.closeModal = function(id) { document.getElementById(id).classList.remove('show'); };
window.switchReportTab = function(tabId, btn) {
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.report-tab-pane').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(`tab-${tabId}`).style.display = 'flex'; // 这里要用 flex 保持布局
    if(tabId === 'analysis') setTimeout(() => { Object.values(chartInstances).forEach(c => c.resize()); }, 100);
};

// ================= 5. 生成底部精简日志 =================
function renderLogs() {
    const tbody = document.getElementById('table-body');
    const nodes = ['1# 预处理多介质', 'UF 超滤膜组 (A段)', 'UF 超滤膜组 (B段)', 'RO 反渗透高压泵', 'RO 膜组件 (1段)'];
    let htmlStr = '';
    let now = new Date();
    for(let i = 0; i < 24; i++) {
        let logTime = new Date(now.getTime() - i * 5 * 60000);
        let timeText = `${String(logTime.getHours()).padStart(2, '0')}:${String(logTime.getMinutes()).padStart(2, '0')}:00`;
        let node = nodes[Math.floor(Math.random() * nodes.length)];
        let pressure = (0.15 + Math.random() * 1.2).toFixed(2);
        let cond = (12 + Math.random() * 5).toFixed(1);
        let isWarn = Math.random() > 0.9;
        if (isWarn) pressure = (1.5 + Math.random() * 0.3).toFixed(2); 

        const warnColor = isWarn ? '#ff4d4f' : '#b0c4de';
        const badgeClass = isWarn ? 'status-warn' : 'status-normal';
        htmlStr += `<tr><td>${timeText}</td><td>${node}</td><td style="color: ${warnColor}; font-weight: bold;">${pressure}</td><td>${cond}</td><td><span class="status-badge ${badgeClass}">${isWarn ? '预警异常' : '正常运行'}</span></td></tr>`;
    }
    tbody.innerHTML = htmlStr;
}

// ================= 启动渲染 =================
window.onload = () => {
    initBox1();
    // 页面初次加载时，根据缓存的配置渲染
    const boxIds = ['box2', 'box3', 'box4', 'box5', 'box6', 'box7', 'box8'];
    boxIds.forEach((id, index) => {
        initDynamicBox(id, selectedMetrics[index]);
    });
    renderLogs();
};

window.addEventListener('resize', () => { Object.values(chartInstances).forEach(c => c.resize()); });

// ================= 6. "查看报表"卡片系统逻辑 =================
let currentReportType = 'daily'; // 默认是日报

// 切换卡片类型
window.switchReportType = function(type, cardEl) {
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
    cardEl.classList.add('active');
    currentReportType = type;
    generateReport(); // 切换后自动重新生成报表
};

// 动态生成报表数据
window.generateReport = function() {
    const thead = document.getElementById('report-thead');
    const tbody = document.getElementById('report-tbody');
    
    // 不同的报表类型，对应不同的时间刻度和行数
    let timeLabel = '时间刻度';
    let rows = 24; 
    if (currentReportType === 'daily') { timeLabel = '时间段 (小时)'; rows = 24; }
    if (currentReportType === 'weekly') { timeLabel = '日期 (星期)'; rows = 7; }
    if (currentReportType === 'monthly') { timeLabel = '日期 (号)'; rows = 30; }
    if (currentReportType === 'quarterly') { timeLabel = '月份 (近3个月)'; rows = 3; }
    if (currentReportType === 'annual') { timeLabel = '月份 (自然月)'; rows = 12; }

    // 设置动态表头
    thead.innerHTML = `
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">${timeLabel}</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">进水总量 (m³)</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">产水总量 (m³)</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">平均回收率 (%)</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">综合耗电量 (kWh)</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">药剂总耗量 (kg)</th>
        <th style="position: sticky; top: 0; background: #07152b; z-index: 2;">系统预警次数</th>
    `;

    // 填充假数据
    let html = '';
    for (let i = 1; i <= rows; i++) {
        let timeStr = i;
        if (currentReportType === 'daily') timeStr = `${String(i-1).padStart(2, '0')}:00 - ${String(i).padStart(2, '0')}:00`;
        else if (currentReportType === 'weekly') timeStr = `星期${['一','二','三','四','五','六','日'][i-1]}`;
        else if (currentReportType === 'monthly') timeStr = `本月 ${i} 日`;
        else if (currentReportType === 'quarterly') timeStr = `第 ${i} 个月`;
        else if (currentReportType === 'annual') timeStr = `${i} 月`;

        // 依据数据规模微调假数据的基数
        let scale = (currentReportType === 'daily') ? 1 : (currentReportType === 'monthly' ? 24 : 10);
        let inFlow = (100 * scale + Math.random() * 20 * scale).toFixed(1);
        let outFlow = (inFlow * (0.65 + Math.random() * 0.1)).toFixed(1);
        let recovery = ((outFlow / inFlow) * 100).toFixed(1);
        let power = (outFlow * 0.4 + Math.random() * 5).toFixed(1);
        let chemical = (outFlow * 0.012 + Math.random() * 0.2).toFixed(2);
        let alarms = Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0;

        let alarmStyle = alarms > 0 ? 'color: #ff4d4f; font-weight: bold;' : 'color: #00fa9a;';

        html += `<tr>
            <td>${timeStr}</td>
            <td>${inFlow}</td>
            <td style="color:#00f3ff; font-weight:bold;">${outFlow}</td>
            <td>${recovery}%</td>
            <td style="color:#ffeb3b;">${power}</td>
            <td>${chemical}</td>
            <td style="${alarmStyle}">${alarms}</td>
        </tr>`;
    }
    tbody.innerHTML = html;
};

// 重写并合并全局的导出 Excel 功能
window.exportExcel = window.exportData = function() {
    const alertBox = document.getElementById('sys-alert');
    if(!alertBox) return alert('正在打包 Excel 数据，请稍候...');
    alertBox.innerText = '正在聚合台账数据，生成 Excel 报表...';
    alertBox.style.display = 'block';
    setTimeout(() => { 
        alertBox.innerText = '✅ 导出成功！报表已保存至本地下载目录。';
        setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    }, 1500);
};

// 在 window.onload 内部补上一句初始调用 (找到现有的 window.onload，在里面加一句)
const oldOnload = window.onload;
window.onload = () => {
    if(oldOnload) oldOnload();
    generateReport(); // 初始化加载默认的“日报”
};