// 初始化 ECharts 实例
const chartDom = document.getElementById('ai-predict-chart');
let myChart = echarts.init(chartDom);

// ═══ 模型运行状态数据 ═══
const modelStatusMap = { running: '运行中', training: '训练中', dormant: '已休眠' };
const statusCssMap = { running: '', training: 'warning', dormant: 'offline' };

let aiModelStates = {
    m1: 'running', m2: 'running', m3: 'running', m4: 'running',
    m5: 'running', m6: 'running', m7: 'training', m8: 'running',
    m9: 'running', m10: 'running', m11: 'dormant'
};

const modelNames = {
    m1: '超滤膜清洗指令模型', m2: '反渗透膜清洗指令模型',
    m3: '双膜清洗指令模型', m4: '超滤膜健康度评估模型',
    m5: '超滤膜健康度预测模型', m6: '超滤膜产水水质预测模型',
    m7: '各仪表损坏预测模型', m8: '反渗透膜健康度评估模型',
    m9: '反渗透膜健康度预测模型', m10: '反渗透产水水质预测模型',
    m11: 'RO膜污染类型评估模型'
};

// 加载持久化状态
function loadModelStates() {
    try {
        const saved = localStorage.getItem('lefilm_ai_model_states');
        if (saved) aiModelStates = Object.assign({}, aiModelStates, JSON.parse(saved));
    } catch(e) {}
}
loadModelStates();

// 渲染左侧模型列表
window.renderModelList = function() {
    const container = document.getElementById('model-list-container');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= 11; i++) {
        const key = 'm' + i;
        const state = aiModelStates[key];
        const statusText = modelStatusMap[state];
        const statusClass = statusCssMap[state];
        const activeClass = (key === currentModelId) ? ' active' : '';
        html += `<button class="model-menu-btn${activeClass}" onclick="switchAIModel('${key}', this)">
            <span class="model-menu-name">${i}. ${modelNames[key]}</span>
            <span class="model-menu-status ${statusClass}">${statusText}</span>
        </button>`;
    }
    container.innerHTML = html;
};

// 自动同步模拟
let currentModelId = 'm1';
function simulateAutoSync() {
    const possibleStates = ['running', 'running', 'running', 'training', 'dormant'];
    const randKey = 'm' + (Math.floor(Math.random() * 11) + 1);
    const newState = possibleStates[Math.floor(Math.random() * possibleStates.length)];
    if (aiModelStates[randKey] !== newState) {
        aiModelStates[randKey] = newState;
        try { localStorage.setItem('lefilm_ai_model_states', JSON.stringify(aiModelStates)); } catch(e) {}
        renderModelList();
    }
}
setInterval(simulateAutoSync, 300000); // 5分钟自动同步

const xAxisData = ['-5天', '-4天', '-3天', '-2天', '-1天', '昨天', '当前', '未来1天', '未来2天', '未来3天', '未来4天'];

// ================= 11 个模型的数据字典 (包含右侧预期文案) =================
const aiModelsData = {
    'm1': {
        title: "超滤膜清洗指令模型",
        desc: "融合运行时间、跨膜压差(TMP)及通量衰减率，通过随机森林算法预测超滤膜污染拐点，输出最优物理/化学反洗时机。",
        inputs: ["进水浊度 (NTU)", "进水温度 (℃)", "实时跨膜压差 TMP", "产水流量 (m³/h)"],
        outputs: ["下一次物理反洗时间点", "CEB 化学加强反洗预告", "建议气洗/水洗强度"],
        chartType: "line", yName: "TMP (MPa)", 
        realData: [0.05, 0.055, 0.06, 0.07, 0.075, 0.08, 0.085], 
        predictData: ['-','-','-','-','-','-', 0.085, 0.09, 0.10, 0.115, 0.12], threshold: 0.10,
        // 右侧动态文案
        statusDesc: "当前超滤膜 TMP 压差为 0.085 MPa，处于安全运行区间，但呈稳定上升趋势。",
        analysisDesc: "模型识别到原水浊度轻微波动，胶体物质在膜表面形成滤饼层的速率加快，导致通量衰减模型斜率变陡。",
        actionDesc: "预期在 48 小时后自动下发【加强型物理气水联合反洗】指令，气洗时长增加至 5 min。"
    },
    'm2': {
        title: "反渗透膜清洗指令模型",
        desc: "监控RO段间压差及透水率下降趋势，利用时序预测模型规划 CIP (在线清洗) 方案，推荐最优药剂配比。",
        inputs: ["进水电导率 (μS/cm)", "进水压力 (MPa)", "段间压差 (MPa)", "浓水流量"],
        outputs: ["CIP 清洗触发时间窗口", "碱洗/酸洗药剂种类判定", "清洗药剂需求量 (kg)"],
        chartType: "line", yName: "段间压差 (MPa)", 
        realData: [0.12, 0.125, 0.13, 0.14, 0.145, 0.155, 0.16], 
        predictData: ['-','-','-','-','-','-', 0.16, 0.17, 0.185, 0.20, 0.22], threshold: 0.20,
        statusDesc: "反渗透一段压降增速异常，产水量较额定标准下降 8%。",
        analysisDesc: "通过多维度特征提取，判断膜表面可能存在初期碳酸钙结垢现象，尚未形成顽固污堵。",
        actionDesc: "预期在下周工艺低谷期自动挂起【低压酸洗循环】任务，并自动调配 15kg 专用清洗液。"
    },
    'm3': {
        title: "双膜清洗指令模型 (全局联调)",
        desc: "统筹全局水量平衡与药剂消耗，协调超滤与反渗透的清洗时序，避免两段工艺同时停机导致产水断流。",
        inputs: ["原水箱液位", "中间水箱液位", "纯水站需水量", "UF/RO同步污染度"],
        outputs: ["双膜错峰清洗排程表", "清洗水泵能耗最优化指令"],
        chartType: "bar", yName: "综合能耗预估 (kWh)", 
        realData: [120, 125, 118, 130, 128, 122, 125], 
        predictData: ['-','-','-','-','-','-', 125, 120, 115, 110, 105],
        statusDesc: "厂区水池液位充足，缓冲余量达到 85%，具备停机维护条件。",
        analysisDesc: "算法通过电价峰谷模型评估，识别出夜间 02:00-05:00 为能源成本最低窗口。",
        actionDesc: "已将 UF 的物理反洗与 RO 的膜面冲洗指令合并，预期在凌晨自动执行【错峰联合清洗】。"
    },
    'm4': {
        title: "超滤膜健康度评估模型",
        desc: "将当前的截留率、通透性等物理特征与设备出厂基准进行多维对比，实时输出当前超滤膜组的健康评分。",
        inputs: ["初始膜通量", "当前衰减通量", "物理清洗恢复率", "累计运行小时数"],
        outputs: ["UF健康度综合评分 (0-100)", "膜丝断裂风险指数"],
        chartType: "gauge", value: 88, name: "超滤健康度",
        statusDesc: "超滤 A/B 两套膜组件综合健康得分为 88 分，处于优良状态。",
        analysisDesc: "对比过去 6 个月的基准曲线，膜丝力学性能评估未见异常，清洗恢复率保持在 95% 以上。",
        actionDesc: "系统将维持常规反洗频率不变，继续按既定策略循环运行。"
    },
    'm5': {
        title: "超滤膜健康度预测模型",
        desc: "基于 LSTM 神经网络，提取历史健康度衰减曲线特征，预测未来30天至半年的膜组件寿命走向。",
        inputs: ["历史6个月TMP时序序列", "历史清洗频率", "原水恶化频次"],
        outputs: ["未来30天健康度趋势", "预计更换膜组件日期 (YYYY-MM)"],
        chartType: "line", yName: "健康度评分", 
        realData: [95, 94, 92, 90, 89, 88, 88], 
        predictData: ['-','-','-','-','-','-', 88, 86, 83, 80, 75], threshold: 80,
        statusDesc: "预测曲线显示超滤膜健康度将在未来 90 天内逼近 80 分更换阈值。",
        analysisDesc: "模型学习到冬季水温下降导致的黏度增加特征，推演膜寿命衰减斜率略微变大。",
        actionDesc: "已在后台物资库生成【10% 膜组件备品备件采购提醒】，防范突发断丝风险。"
    },
    'm6': {
        title: "超滤膜产水水质预测模型",
        desc: "建立原水水质波动与超滤截留效果的非线性映射，提前预警产水浊度超标风险，保障后续RO进水安全。",
        inputs: ["原水浊度波动率", "原水 COD (mg/L)", "水温 (℃)", "投加絮凝剂浓度"],
        outputs: ["未来1小时产水浊度预估 (NTU)", "水质不达标置信度 (%)"],
        chartType: "line", yName: "产水浊度 (NTU)", 
        realData: [0.08, 0.09, 0.08, 0.11, 0.09, 0.12, 0.10], 
        predictData: ['-','-','-','-','-','-', 0.10, 0.13, 0.15, 0.18, 0.21], threshold: 0.15,
        statusDesc: "预计 3 小时后，超滤产水浊度可能触发 0.15 NTU 警戒线。",
        analysisDesc: "接收到原水池水质恶化前置信号，导致本模型预测超滤截留负荷急剧增加。",
        actionDesc: "预期将通过 PLC 自动调大前端【絮凝剂加药泵】频率，增加 1.5ppm 药剂投加量以应对冲击。"
    },
    'm7': {
        title: "各仪表损坏预测模型",
        desc: "监测传感器信号的跳变毛刺幅度、零点漂移速率及通信延迟，利用异常检测算法预判硬件损坏。",
        inputs: ["仪表通讯延迟时序", "信号方差/毛刺频次", "标定漂移量", "环境温湿度"],
        outputs: ["各仪表故障概率 (%)", "建议校验/更换维护清单"],
        chartType: "bar", yName: "故障发生概率 (%)", 
        realData: [2, 3, 5, 4, 8, 12, 15], 
        predictData: ['-','-','-','-','-','-', 15, 22, 35, 55, 78], threshold: 50,
        statusDesc: "RO 段进水 pH 计信号方差显著增大，呈现跳动特征。",
        analysisDesc: "AI 判断其非水质真实突变，高度疑似玻璃电极老化或参比液耗尽，预测未来故障概率飙升。",
        actionDesc: "系统将在报表系统自动生成一张【pH 探头人工标定与清洗作业票】，分发至现场运维。"
    },
    'm8': {
        title: "反渗透膜健康度评估模型",
        desc: "通过盐透率、脱盐率及标定透水系数，客观计算反渗透膜当前的结构完整性与性能指标。",
        inputs: ["实时脱盐率 (%)", "透水系数", "进水/产水电导率比", "累计加药量"],
        outputs: ["RO膜健康度得分", "当前脱盐效率评级"],
        chartType: "gauge", value: 92, name: "RO健康度",
        statusDesc: "当前 RO 系统脱盐率维持在 99.2% 以上，健康度 92 分，性能卓越。",
        analysisDesc: "经温度与压力标准化校正后，透水系数无明显衰减，说明前端预处理及阻垢剂发挥了完美功效。",
        actionDesc: "保持当前最优运行曲线，暂不需要对工艺参数实施干预。"
    },
    'm9': {
        title: "反渗透膜健康度预测模型",
        desc: "结合膜厂家衰减曲线与现场实际工况，预判反渗透膜性能的不可逆衰减节点，指导大修预算规划。",
        inputs: ["历史脱盐率下降曲线", "历史高压冲击频次", "累计运行日"],
        outputs: ["不可逆衰减临界日", "剩余使用寿命 (Days)"],
        chartType: "line", yName: "预计剩余寿命 (天)", 
        realData: [850, 840, 830, 815, 800, 790, 785], 
        predictData: ['-','-','-','-','-','-', 785, 750, 720, 680, 650],
        statusDesc: "基于服役时间与清洗磨损，预计核心膜组件剩余经济寿命约为 650 天。",
        analysisDesc: "模型识别出高频次的化学清洗对聚酰胺脱盐层造成了不可逆的轻微剥离腐蚀。",
        actionDesc: "建议厂长级账号在下半年的财务预算中，提前列支一套 RO 膜的更换专项资金。"
    },
    'm10': {
        title: "反渗透产水水质预测模型",
        desc: "应对原水电导率突增等极端工况，推演脱盐处理后的终端水质，确保达到车间回用水标准。",
        inputs: ["进水总溶解固体 (TDS)", "进水温度", "高压泵运行频率", "阻垢剂浓度"],
        outputs: ["未来2小时产水电导率 (μS/cm)", "出水达标率预测"],
        chartType: "line", yName: "电导率 (μS/cm)", 
        realData: [12.5, 12.8, 13.0, 13.2, 13.5, 13.4, 13.8], 
        predictData: ['-','-','-','-','-','-', 13.8, 14.5, 15.2, 16.0, 17.5], threshold: 15.0,
        statusDesc: "预计产水电导率将小幅攀升，可能在明天触碰 15 μS/cm 的工艺控制上限。",
        analysisDesc: "结合气象站数据，推断源水水源含盐量上升，超出了当前系统设定压力的最佳脱盐区间。",
        actionDesc: "智控队列已生成平滑干预指令：预期微调高压泵变频器，提升 0.5Hz 工作频率以增加脱盐截留率。"
    },
    'm11': {
        title: "RO膜污染类型评估模型",
        desc: "通过解析前段压差与后段压差的变化特征，分类识别无机盐结垢、有机物污堵或微生物滋生，精准指导对症下药。",
        inputs: ["段压差占比(前段/后段)", "流量衰减梯度", "进水有机物/硬度分析", "压降温度系数"],
        outputs: ["主导污染类型识别结果", "针对性配药清洗方案"],
        chartType: "pie", 
        value: [
            {value: 55, name: '无机盐结垢 (CaCO3)'},
            {value: 30, name: '有机胶体污堵'},
            {value: 15, name: '微生物滋生'}
        ],
        statusDesc: "膜组综合压降特征匹配显示，首段压降明显，主导污染因子判定为【无机盐结垢】。",
        analysisDesc: "相比微生物造成的末段压差攀升，当前模型判定硬度沉积（碳酸钙）是导致通量下降的罪魁祸首。",
        actionDesc: "预期清洗策略锁定：放弃高浓度的碱洗，主要实施 2.0pH 值的低压柠檬酸/盐酸清洗循环。"
    }
};

// ================= 核心渲染函数 =================
window.switchAIModel = function(modelId, btnElement) {
    currentModelId = modelId;
    document.querySelectorAll('.model-menu-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    const data = aiModelsData[modelId];
    if(!data) return;

    // 2. 注入文本信息 (左侧与右侧动态更新)
    document.getElementById('dynamic-model-title').innerText = data.title;
    document.getElementById('dynamic-model-desc').innerText = data.desc;
    document.getElementById('dynamic-model-inputs').innerHTML = data.inputs.map(item => `<span class="param-tag">${item}</span>`).join('');
    document.getElementById('dynamic-model-outputs').innerHTML = data.outputs.map(item => `<span class="param-tag output">${item}</span>`).join('');
    
    // 更新右侧分析面板
    document.getElementById('dynamic-ai-status').innerText = data.statusDesc;
    document.getElementById('dynamic-ai-analysis').innerText = data.analysisDesc;
    document.getElementById('dynamic-ai-action').innerText = data.actionDesc;

    // 3. 动态切换 ECharts 图表类型
    myChart.clear(); 
    let option = {};

    if (data.chartType === 'line' || data.chartType === 'bar') {
        option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['历史真实数据', 'AI 模型预测'], textStyle: { color: '#fff' }, top: 0 },
            grid: { left: '10%', right: '5%', bottom: '15%', top: '20%' }, // 给底部留足空间
            xAxis: { type: 'category', data: xAxisData, axisLabel: { color: '#8898aa' } },
            yAxis: { type: 'value', name: data.yName, nameTextStyle: { color: '#8898aa' }, axisLabel: { color: '#8898aa' }, splitLine: { lineStyle: { color: '#333' } } },
            series: [
                {
                    name: '历史真实数据', type: data.chartType, smooth: true,
                    itemStyle: { color: '#00f3ff' },
                    areaStyle: data.chartType==='line' ? { color: 'rgba(0, 243, 255, 0.2)' } : null,
                    data: data.realData
                },
                {
                    name: 'AI 模型预测', type: data.chartType, smooth: true,
                    lineStyle: { type: 'dashed', color: '#ffeb3b', width: 2 },
                    itemStyle: { color: '#ffeb3b' },
                    data: data.predictData,
                    markLine: data.threshold ? {
                        symbol: ['none', 'none'],
                        label: { formatter: `警戒 (${data.threshold})`, color: '#ff4d4f', position: 'insideStartTop' },
                        lineStyle: { color: '#ff4d4f', type: 'solid', width: 2 },
                        data: [{ yAxis: data.threshold }]
                    } : null
                }
            ]
        };
    } else if (data.chartType === 'gauge') {
        option = {
            tooltip: { formatter: '{a} <br/>{b} : {c}%' },
            series: [{
                name: '健康评估', type: 'gauge',
                radius: '85%', // 稍微缩小，防止上下溢出
                axisLine: { lineStyle: { width: 12, color: [[0.6, '#ff4d4f'], [0.8, '#ffeb3b'], [1, '#00fa9a']] } },
                pointer: { itemStyle: { color: 'auto' }, length: '60%' },
                axisTick: { distance: -15, length: 8, lineStyle: { color: '#fff', width: 2 } },
                splitLine: { distance: -15, length: 15, lineStyle: { color: '#fff', width: 3 } },
                axisLabel: { color: 'inherit', distance: 20, fontSize: 10 },
                detail: { valueAnimation: true, formatter: '{value} 分', color: 'inherit', fontSize: 18, offsetCenter: [0, '60%'] },
                data: [{ value: data.value, name: data.name, title: { offsetCenter: [0, '-30%'], color: '#fff' } }]
            }]
        };
    } else if (data.chartType === 'pie') {
        // 💥 修复溢出的饼图：缩小半径，将指示线缩短，标签置于图表内部或紧凑排列 💥
        option = {
            tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
            legend: { top: '5%', left: 'center', textStyle: { color: '#fff' }, itemWidth: 10, itemHeight: 10 },
            series: [{
                name: '污染因子占比', type: 'pie', 
                radius: ['35%', '60%'], // 缩小半径，给文字留空间
                center: ['50%', '55%'], // 整体往下移一点
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 5, borderColor: '#020917', borderWidth: 2 },
                label: { 
                    show: true, 
                    color: '#fff', 
                    formatter: '{b}\n{c}%', // 分行显示，节约横向空间
                    fontSize: 11
                },
                labelLine: { length: 10, length2: 10 }, // 缩短牵引线，防止左右溢出
                data: data.value
            }]
        };
    }

    myChart.setOption(option, true);
};

// 页面加载完毕后，默认选中第一个模型
window.addEventListener('load', () => {
    renderModelList();
    switchAIModel('m1', document.querySelector('.model-menu-btn'));
});

// 保留原有的假装同步控制台逻辑
window.simulatePLCSync = function(btn) {
    alert("演示完成：当前公开版本未连接现场 PLC，不会下发控制指令。");
};
