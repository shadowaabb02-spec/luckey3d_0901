window.SiteCampusLayout = {
    world: {
        width: 240,
        depth: 135
    },
    mapOverlay: {
        image: "assets/site/test-Model.png",
        show: false,
        width: 232,
        depth: 130,
        opacity: 0.07,
        y: 0.02
    },
    cadProjection: {
        minX: 370066.1,
        maxX: 371347.8,
        minY: 4301501.1,
        maxY: 4301953.2,
        worldWidth: 220,
        worldDepth: 110
    },
    buildings: [
        {
            id: "wastewater-station",
            name: "污水站",
            type: "污水处理站",
            status: "运行中",
            description: "左侧污水处理核心区域，承担园区废水汇集与预处理任务。",
            alwaysLabel: true,
            focusable: true,
            position: { x: -87, z: 11 },
            footprints: [
                { x: 0, z: 0, w: 18, d: 28, h: 9.5 },
                { x: -10, z: -3, w: 12, d: 12, h: 8.4 },
                { x: 6, z: 10, w: 9, d: 9, h: 7.8 },
                { x: 8, z: -9, w: 7, d: 6, h: 6.4 }
            ],
            roofColor: "#4a6f8e",
            wallColor: "#93acc0",
            accentColor: "#00f3ff"
        },
        {
            id: "five-reclaimed-water-station",
            name: "5中水站",
            type: "中水站",
            status: "联调中",
            description: "与左侧处理片区联动的中水回用节点，适合后续做飞入细化。",
            alwaysLabel: true,
            focusable: true,
            position: { x: -70, z: -2 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 10, h: 8.2 },
                { x: -6, z: 6, w: 7, d: 6, h: 6.6 },
                { x: 7, z: -1, w: 5, d: 4, h: 5.4 }
            ],
            roofColor: "#58768e",
            wallColor: "#a2b6c7",
            accentColor: "#00fa9a"
        },
        {
            id: "membrane-phase-one",
            name: "水膜一期水处理",
            type: "工艺车间",
            status: "运行中",
            description: "左侧双膜工艺主车间之一，后续可挂接膜系统运行状态与告警。",
            alwaysLabel: true,
            focusable: true,
            position: { x: -63, z: 16 },
            footprints: [
                { x: 0, z: 0, w: 28, d: 12, h: 10.4 },
                { x: 12, z: -1, w: 7, d: 8, h: 8.2 },
                { x: -11, z: 3, w: 6, d: 5, h: 6.8 }
            ],
            roofColor: "#6e90a8",
            wallColor: "#b1c2cf",
            accentColor: "#48d8ff"
        },
        {
            id: "membrane-demo-line",
            name: "水膜示范线水处理",
            type: "示范线车间",
            status: "运行中",
            description: "示范线工艺区，适合后续做建筑聚焦与内部设备示意展示。",
            alwaysLabel: true,
            focusable: true,
            position: { x: -60, z: 28 },
            footprints: [
                { x: 0, z: 0, w: 24, d: 11, h: 9.3 },
                { x: -10, z: -1, w: 5, d: 6, h: 7.2 },
                { x: 9, z: 1, w: 4, d: 4, h: 5.8 }
            ],
            roofColor: "#61879f",
            wallColor: "#a9bcc8",
            accentColor: "#11b6ff"
        },
        {
            id: "pure-water-preparation",
            name: "水膜纯水制备",
            type: "纯水制备",
            status: "待接入",
            description: "纯水制备相关建筑，后续可联动 RO 产水与电导率指标。",
            alwaysLabel: true,
            focusable: true,
            position: { x: -45, z: -9 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 11, h: 7.5 },
                { x: 7, z: 0, w: 5, d: 5, h: 5.3 }
            ],
            roofColor: "#5a3a2a",
            wallColor: "#c47a4a",
            accentColor: "#ffb87a"
        },
        {
            id: "reclaimed-water-recycle-1",
            name: "1#中水回收",
            type: "中水回收站",
            status: "运行中",
            description: "中部回收节点，适合作为总览场景中的关键热点与镜头停靠点。",
            alwaysLabel: true,
            focusable: true,
            position: { x: 4, z: -3 },
            footprints: [
                { x: 0, z: 0, w: 18, d: 10, h: 7.2 },
                { x: 9, z: 0, w: 7, d: 7, h: 6.1 },
                { x: -8, z: -1, w: 5, d: 4, h: 5.1 }
            ],
            roofColor: "#5c7b93",
            wallColor: "#a5b7c5",
            accentColor: "#00f3ff"
        },
        {
            id: "pure-water-station",
            name: "纯水站",
            type: "站房",
            status: "运行中",
            description: "右上重点站房，是后续纯水系统视角切换的核心交互对象。",
            alwaysLabel: true,
            focusable: true,
            position: { x: 70, z: -41 },
            footprints: [
                { x: 0, z: 0, w: 22, d: 14, h: 10.4 },
                { x: 12, z: -5, w: 7, d: 5, h: 7.4 },
                { x: -11, z: 4, w: 6, d: 5, h: 5.6 }
            ],
            roofColor: "#4e3020",
            wallColor: "#cc8240",
            accentColor: "#ffba6e"
        },
        {
            id: "main-gate",
            name: "厂区大门",
            type: "入口地标",
            status: "开放中",
            description: "园区入口与访客识别地标，建议作为总览镜头起始区域。",
            alwaysLabel: true,
            focusable: true,
            position: { x: 106, z: 8 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 8, h: 4.2 }
            ],
            roofColor: "#7a6248",
            wallColor: "#bca27d",
            accentColor: "#ffcc7a"
        },
        {
            id: "tongda-company-building",
            name: "通达公司",
            type: "厂房",
            status: "展示中",
            description: "来自 CAD 总图的可见厂房标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -82, z: -34 },
            footprints: [
                { x: 0, z: 0, w: 18, d: 10, h: 5.4 }
            ],
            roofColor: "#5b80a8",
            wallColor: "#c5ced7",
            accentColor: "#7fd0ff"
        },
        {
            id: "paper-bag-workshop-building",
            name: "纸袋车间",
            type: "车间",
            status: "展示中",
            description: "来自 CAD 总图的可见车间标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -96, z: -34 },
            footprints: [
                { x: 0, z: 0, w: 15, d: 9, h: 5.2 }
            ],
            roofColor: "#567ca4",
            wallColor: "#c7d0d8",
            accentColor: "#7fd0ff"
        },
        {
            id: "share-line-nine-building",
            name: "股份9#生产线",
            type: "生产线厂房",
            status: "展示中",
            description: "来自 CAD 总图的可见生产线标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -67, z: -34 },
            footprints: [
                { x: 0, z: 0, w: 18, d: 10, h: 5.8 }
            ],
            roofColor: "#4f79ae",
            wallColor: "#c4ced6",
            accentColor: "#80d3ff"
        },
        {
            id: "share-line-seven-building",
            name: "股份7#生产线",
            type: "生产线厂房",
            status: "展示中",
            description: "来自 CAD 总图的可见生产线标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -58, z: -10 },
            footprints: [
                { x: 0, z: 0, w: 17, d: 10, h: 5.7 }
            ],
            roofColor: "#4c77aa",
            wallColor: "#c5cfd7",
            accentColor: "#77c9ff"
        },
        {
            id: "film-manufacturing-building",
            name: "薄膜制造部",
            type: "厂房",
            status: "展示中",
            description: "来自 CAD 总图的可见厂房标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -50, z: -22 },
            footprints: [
                { x: 0, z: 0, w: 20, d: 11, h: 5.9 }
            ],
            roofColor: "#557fad",
            wallColor: "#c3cdd6",
            accentColor: "#7ccfff"
        },
        {
            id: "film-warehouse-building",
            name: "薄膜仓库",
            type: "仓库",
            status: "展示中",
            description: "来自 CAD 总图的可见仓库标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -10, z: -8 },
            footprints: [
                { x: 0, z: 0, w: 16, d: 10, h: 5.3 }
            ],
            roofColor: "#6a839a",
            wallColor: "#ccd3da",
            accentColor: "#8ad7ff"
        },
        {
            id: "medical-finished-warehouse-building",
            name: "医疗成品库",
            type: "仓库",
            status: "运行中",
            description: "中部偏左的成品库，作为园区配套仓储组团展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -12, z: 25 },
            footprints: [
                { x: 0, z: 0, w: 16, d: 10, h: 5.3 }
            ],
            roofColor: "#6d859c",
            wallColor: "#cbd2da",
            accentColor: "#8ddcff"
        },
        {
            id: "reclaimed-water-pool",
            name: "中水池",
            type: "池体构筑物",
            status: "运行中",
            description: "中水回用池体，作为左侧处理片区的重要构筑物展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -90, z: -7 },
            footprints: [
                { x: 0, z: 0, w: 10, d: 8, h: 2.6 }
            ],
            roofColor: "#47677f",
            wallColor: "#7d9aac",
            accentColor: "#4fd3ff"
        },
        {
            id: "wastewater-pool",
            name: "污水池",
            type: "池体构筑物",
            status: "运行中",
            description: "污水处理池体，作为污水站周边附属构筑物展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -96, z: 27 },
            footprints: [
                { x: 0, z: 0, w: 12, d: 9, h: 2.4 }
            ],
            roofColor: "#436178",
            wallColor: "#7f99a8",
            accentColor: "#39c6ff"
        },
        {
            id: "reclaimed-water-fan-room",
            name: "中水风机房",
            type: "附属站房",
            status: "运行中",
            description: "中水系统附属风机房，作为左侧配套建筑示意。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -74, z: 37 },
            footprints: [
                { x: 0, z: 0, w: 8, d: 6, h: 5.2 }
            ],
            roofColor: "#5f8099",
            wallColor: "#bcc8d1",
            accentColor: "#58d9ff"
        },
        {
            id: "reclaimed-water-pump-room",
            name: "中水泵房",
            type: "附属站房",
            status: "运行中",
            description: "中水系统附属泵房，默认只作为园区配套建筑展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -66, z: 41 },
            footprints: [
                { x: 0, z: 0, w: 8, d: 6, h: 5.3 }
            ],
            roofColor: "#5e7d96",
            wallColor: "#bcc7d0",
            accentColor: "#61dfff"
        },
        {
            id: "comprehensive-treatment-room",
            name: "综合处理间",
            type: "处理间",
            status: "运行中",
            description: "右上片区的综合处理构筑物，用于完善纯水区周边组团。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 64, z: -18 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 8, h: 5.8 }
            ],
            roofColor: "#5c7891",
            wallColor: "#bdc9d2",
            accentColor: "#6cecff"
        },
        {
            id: "regulating-pool",
            name: "调节池",
            type: "池体构筑物",
            status: "运行中",
            description: "右上片区调节池体。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 85, z: -55 },
            footprints: [
                { x: 0, z: 0, w: 10, d: 8, h: 2.3 }
            ],
            roofColor: "#4d6d84",
            wallColor: "#84a0b0",
            accentColor: "#68d7ff"
        },
        {
            id: "grit-oil-pool",
            name: "隔栅隔油池",
            type: "池体构筑物",
            status: "运行中",
            description: "右上片区小型池体，作为纯水站周边工艺配套构筑物展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 95, z: -55 },
            footprints: [
                { x: 0, z: 0, w: 9, d: 7, h: 2.2 }
            ],
            roofColor: "#4f6f87",
            wallColor: "#88a2b2",
            accentColor: "#60d7ff"
        },
        {
            id: "nitrogen-station",
            name: "氮气站",
            type: "公用工程站房",
            status: "运行中",
            description: "纯水区附近公用工程站房，默认作为次级建筑展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 83, z: -41 },
            footprints: [
                { x: 0, z: 0, w: 8, d: 7, h: 5.2 }
            ],
            roofColor: "#67879e",
            wallColor: "#c0ccd4",
            accentColor: "#9ce9ff"
        },
        {
            id: "first-finishing-workshop",
            name: "第一整理车间",
            type: "整理车间",
            status: "运行中",
            description: "中部较大的生产车间体块，用于提升园区整体密度与真实感。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 18, z: 24 },
            footprints: [
                { x: 0, z: 0, w: 24, d: 12, h: 6.4 }
            ],
            roofColor: "#4d77ac",
            wallColor: "#c2cfd7",
            accentColor: "#78c7ff"
        },
        {
            id: "second-finishing-workshop",
            name: "第二整理车间",
            type: "整理车间",
            status: "运行中",
            description: "中部生产车间，与整理工段组团一起补足园区主体建筑。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -2, z: 24 },
            footprints: [
                { x: 0, z: 0, w: 22, d: 12, h: 6.2 }
            ],
            roofColor: "#4f79af",
            wallColor: "#c1cdd6",
            accentColor: "#71c2ff"
        },
        {
            id: "coating-workshop",
            name: "涂布车间",
            type: "生产车间",
            status: "运行中",
            description: "中部偏右的大体量车间，用于表现园区核心厂房密度。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 39, z: 25 },
            footprints: [
                { x: 0, z: 0, w: 28, d: 13, h: 6.8 }
            ],
            roofColor: "#4e78ae",
            wallColor: "#c0ccd5",
            accentColor: "#7bcfff"
        },
        {
            id: "bopet-line",
            name: "BOPET功能薄膜生产线",
            type: "生产线厂房",
            status: "运行中",
            description: "中部偏左的大型生产线厂房，主要用于恢复总图中较长的主体建筑轮廓。",
            alwaysLabel: false,
            focusable: false,
            position: { x: -20, z: -28 },
            footprints: [
                { x: 0, z: 0, w: 30, d: 12, h: 6.6 }
            ],
            roofColor: "#4f79af",
            wallColor: "#c2cdd4",
            accentColor: "#82d2ff"
        },
        {
            id: "recycling-workshop",
            name: "综合回收车间",
            type: "回收车间",
            status: "运行中",
            description: "中部回收类车间体块。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 2, z: -28 },
            footprints: [
                { x: 0, z: 0, w: 18, d: 10, h: 5.8 }
            ],
            roofColor: "#5d81a2",
            wallColor: "#c1ccd5",
            accentColor: "#7ed8ff"
        },
        {
            id: "office-building",
            name: "办公楼",
            type: "办公楼",
            status: "运行中",
            description: "中部办公类建筑，作为园区日常办公区示意。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 42, z: -12 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 8, h: 7.8 }
            ],
            roofColor: "#aa6e55",
            wallColor: "#d3c4bc",
            accentColor: "#ffd79e"
        },
        {
            id: "magnetic-office-building",
            name: "磁信息办公楼",
            type: "办公楼",
            status: "展示中",
            description: "来自 CAD 总图的可见办公楼标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 0, z: -6 },
            footprints: [
                { x: 0, z: 0, w: 12, d: 8, h: 6.6 }
            ],
            roofColor: "#a96e58",
            wallColor: "#d3c6bf",
            accentColor: "#ffd5a4"
        },
        {
            id: "film-research-building-cad",
            name: "片种研究楼",
            type: "研究楼",
            status: "展示中",
            description: "来自 CAD 总图的可见研究楼标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 10, z: -6 },
            footprints: [
                { x: 0, z: 0, w: 12, d: 8, h: 6.8 }
            ],
            roofColor: "#a06e58",
            wallColor: "#d2c6be",
            accentColor: "#ffd19e"
        },
        {
            id: "share-research-building",
            name: "股份研究所",
            type: "研究楼",
            status: "展示中",
            description: "来自 CAD 总图的可见研究所标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 24, z: -14 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 9, h: 7.2 }
            ],
            roofColor: "#9d6f59",
            wallColor: "#d1c5bd",
            accentColor: "#ffd09c"
        },
        {
            id: "share-emulsion-cold-storage-building",
            name: "股份乳剂冷库",
            type: "冷库",
            status: "展示中",
            description: "来自 CAD 总图的可见冷库标注。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 56, z: 18 },
            footprints: [
                { x: 0, z: 0, w: 16, d: 9, h: 5.8 }
            ],
            roofColor: "#6c859c",
            wallColor: "#ccd4da",
            accentColor: "#99deff"
        },
        {
            id: "new-office-tower",
            name: "新办公大楼",
            type: "办公楼",
            status: "运行中",
            description: "北侧办公楼组团中的主楼体，作为非工艺建筑展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 54, z: 48 },
            footprints: [
                { x: 0, z: 0, w: 16, d: 10, h: 8.6 }
            ],
            roofColor: "#a76950",
            wallColor: "#d4c6bd",
            accentColor: "#ffd29a"
        },
        {
            id: "old-office-building",
            name: "旧办公楼",
            type: "办公楼",
            status: "运行中",
            description: "办公区配套楼体，默认悬停显示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 36, z: 48 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 9, h: 7.2 }
            ],
            roofColor: "#a56a51",
            wallColor: "#d3c5bc",
            accentColor: "#ffcf96"
        },
        {
            id: "quality-building",
            name: "质检楼",
            type: "检测楼",
            status: "运行中",
            description: "办公与检测组团中的次级建筑。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 20, z: 48 },
            footprints: [
                { x: 0, z: 0, w: 12, d: 8, h: 6.8 }
            ],
            roofColor: "#9b6f5d",
            wallColor: "#d0c7bf",
            accentColor: "#ffd8a8"
        },
        {
            id: "canteen-building",
            name: "厂区食堂",
            type: "生活配套",
            status: "运行中",
            description: "生活配套建筑，作为北侧组团的辅楼展示。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 72, z: 48 },
            footprints: [
                { x: 0, z: 0, w: 14, d: 9, h: 5.6 }
            ],
            roofColor: "#987057",
            wallColor: "#d0c7bf",
            accentColor: "#ffd8a8"
        },
        {
            id: "new-emulsion-workshop",
            name: "新乳剂车间",
            type: "生产车间",
            status: "运行中",
            description: "东侧较大的生产车间，用于补足右侧园区建筑密度。",
            alwaysLabel: false,
            focusable: false,
            position: { x: 88, z: 42 },
            footprints: [
                { x: 0, z: 0, w: 22, d: 12, h: 6.5 }
            ],
            roofColor: "#4d79ae",
            wallColor: "#c3ced7",
            accentColor: "#88d7ff"
        },
        {
            id: "aec-production-line",
            name: "中水双膜",
            type: "核心工艺站房",
            status: "运行中",
            description: "中水双膜（超滤+反渗透）智慧化系统核心工艺区，为园区重点数字孪生监控对象。",
            alwaysLabel: true,
            focusable: true,
            position: { x: 96, z: 22 },
            footprints: [
                { x: 0, z: 0, w: 24, d: 12, h: 6.4 }
            ],
            roofColor: "#4c79b0",
            wallColor: "#c3cfd8",
            accentColor: "#00f3ff"
        }
    ],
    supplementalBuildings: [
        { id: "tongda-company", name: "通达公司", type: "厂房", status: "展示中", description: "来自 CAD 总图的可见厂房标注。", alwaysLabel: false, focusable: false, position: { x: -82, z: -34 }, footprints: [{ x: 0, z: 0, w: 20, d: 11, h: 5.8 }], roofColor: "#527cad", wallColor: "#c4cfd8", accentColor: "#6fcfff" },
        { id: "paper-bag-workshop", name: "纸袋车间", type: "车间", status: "展示中", description: "来自 CAD 总图的可见车间标注。", alwaysLabel: false, focusable: false, position: { x: -98, z: -34 }, footprints: [{ x: 0, z: 0, w: 16, d: 10, h: 5.5 }], roofColor: "#4e77a7", wallColor: "#c6d0d8", accentColor: "#74cfff" },
        { id: "labor-service-company", name: "劳动服务公司", type: "配套建筑", status: "展示中", description: "来自 CAD 总图的可见配套建筑标注。", alwaysLabel: false, focusable: false, position: { x: -86, z: 50 }, footprints: [{ x: 0, z: 0, w: 15, d: 9, h: 5.2 }], roofColor: "#70849a", wallColor: "#c8d0d8", accentColor: "#9ed9ff" },
        { id: "share-line-9", name: "股份9#生产线", type: "生产线厂房", status: "展示中", description: "来自 CAD 总图的可见生产线标注。", alwaysLabel: false, focusable: false, position: { x: -66, z: -34 }, footprints: [{ x: 0, z: 0, w: 18, d: 10, h: 6 }], roofColor: "#4d78ac", wallColor: "#c3ced7", accentColor: "#80d0ff" },
        { id: "share-line-7", name: "股份7#生产线", type: "生产线厂房", status: "展示中", description: "来自 CAD 总图的可见生产线标注。", alwaysLabel: false, focusable: false, position: { x: -58, z: -8 }, footprints: [{ x: 0, z: 0, w: 17, d: 10, h: 5.8 }], roofColor: "#4b77a7", wallColor: "#c3ccd4", accentColor: "#77c9ff" },
        { id: "film-manufacturing-dept", name: "薄膜制造部", type: "厂房", status: "展示中", description: "来自 CAD 总图的可见厂房标注。", alwaysLabel: false, focusable: false, position: { x: -48, z: -23 }, footprints: [{ x: 0, z: 0, w: 21, d: 11, h: 6 }], roofColor: "#567eae", wallColor: "#c4cdd6", accentColor: "#77cbff" },
        { id: "film-warehouse", name: "薄膜仓库", type: "仓库", status: "展示中", description: "来自 CAD 总图的可见仓库标注。", alwaysLabel: false, focusable: false, position: { x: -33, z: -7 }, footprints: [{ x: 0, z: 0, w: 16, d: 10, h: 5.5 }], roofColor: "#668199", wallColor: "#c9d1d9", accentColor: "#8ed8ff" },
        { id: "share-finishing-workshop", name: "股份整理车间", type: "整理车间", status: "展示中", description: "来自 CAD 总图的可见整理车间标注。", alwaysLabel: false, focusable: false, position: { x: -10, z: 40 }, footprints: [{ x: 0, z: 0, w: 20, d: 10, h: 5.8 }], roofColor: "#507ab0", wallColor: "#c2cdd6", accentColor: "#7ad1ff" },
        { id: "magnetic-office", name: "磁信息办公楼", type: "办公楼", status: "展示中", description: "来自 CAD 总图的可见办公楼标注。", alwaysLabel: false, focusable: false, position: { x: -6, z: -6 }, footprints: [{ x: 0, z: 0, w: 12, d: 8, h: 6.8 }], roofColor: "#a96f57", wallColor: "#d3c7c0", accentColor: "#ffd8a8" },
        { id: "film-research-building", name: "片种研究楼", type: "研究楼", status: "展示中", description: "来自 CAD 总图的可见研究楼标注。", alwaysLabel: false, focusable: false, position: { x: 8, z: -6 }, footprints: [{ x: 0, z: 0, w: 13, d: 8, h: 7 }], roofColor: "#a16e59", wallColor: "#d2c6be", accentColor: "#ffd3a0" },
        { id: "share-research-institute", name: "股份研究所", type: "研究楼", status: "展示中", description: "来自 CAD 总图的可见研究所标注。", alwaysLabel: false, focusable: false, position: { x: 22, z: -16 }, footprints: [{ x: 0, z: 0, w: 14, d: 9, h: 7.2 }], roofColor: "#a16f58", wallColor: "#d1c4bc", accentColor: "#ffd19f" },
        { id: "share-emulsion-cold-storage", name: "股份乳剂冷库", type: "冷库", status: "展示中", description: "来自 CAD 总图的可见冷库标注。", alwaysLabel: false, focusable: false, position: { x: 40, z: 12 }, footprints: [{ x: 0, z: 0, w: 15, d: 9, h: 5.8 }], roofColor: "#6a849a", wallColor: "#ced6dc", accentColor: "#9bddff" },
        { id: "single-dormitory", name: "单身宿舍", type: "宿舍", status: "展示中", description: "来自 CAD 总图的可见宿舍标注。", alwaysLabel: false, focusable: false, position: { x: 92, z: 18 }, footprints: [{ x: 0, z: 0, w: 15, d: 9, h: 6.2 }], roofColor: "#b37355", wallColor: "#d7cac2", accentColor: "#ffd7a7" },
        { id: "west-office", name: "西办公楼", type: "办公楼", status: "展示中", description: "来自 CAD 总图的可见办公楼标注。", alwaysLabel: false, focusable: false, position: { x: 60, z: 24 }, footprints: [{ x: 0, z: 0, w: 14, d: 8, h: 6.8 }], roofColor: "#a46d56", wallColor: "#d3c6be", accentColor: "#ffd29f" },
        { id: "east-office", name: "东办公楼", type: "办公楼", status: "展示中", description: "来自 CAD 总图的可见办公楼标注。", alwaysLabel: false, focusable: false, position: { x: 74, z: 24 }, footprints: [{ x: 0, z: 0, w: 14, d: 8, h: 6.8 }], roofColor: "#a36d57", wallColor: "#d2c6be", accentColor: "#ffd19f" },
        { id: "parking-lot-building", name: "停车场", type: "停车配套", status: "展示中", description: "来自 CAD 总图的可见停车场标注。", alwaysLabel: false, focusable: false, position: { x: 94, z: -10 }, footprints: [{ x: 0, z: 0, w: 18, d: 8, h: 1.2 }], roofColor: "#6b747d", wallColor: "#c9ced3", accentColor: "#dce8f0" },
        { id: "auto-parking-lot", name: "汽车停车场", type: "停车配套", status: "展示中", description: "来自 CAD 总图的可见停车场标注。", alwaysLabel: false, focusable: false, position: { x: 92, z: -22 }, footprints: [{ x: 0, z: 0, w: 20, d: 9, h: 1.2 }], roofColor: "#6b747d", wallColor: "#c9ced3", accentColor: "#dce8f0" },
        { id: "shuguang-factory", name: "曙光厂", type: "厂房", status: "展示中", description: "来自 CAD 总图的可见厂房标注。", alwaysLabel: false, focusable: false, position: { x: -26, z: 52 }, footprints: [{ x: 0, z: 0, w: 18, d: 9, h: 5.6 }], roofColor: "#5e7ba0", wallColor: "#c7d0d8", accentColor: "#8fd7ff" }
    ],
    backgroundBuildings: [
        { id: "bg-west-02", position: { x: -48, z: 8 }, size: { w: 14, d: 9, h: 5 }, color: "#8b9faf", roofColor: "#6485a0", wallColor: "#c5d0d9" },
        { id: "bg-west-03", position: { x: -40, z: 24 }, size: { w: 15, d: 10, h: 5 }, color: "#879daf", roofColor: "#5d809a", wallColor: "#c5d1dc" },
        { id: "bg-center-01", position: { x: -12, z: 13 }, size: { w: 20, d: 11, h: 6 }, color: "#7f95a6", roofColor: "#56748c", wallColor: "#c2ccd6" },
        { id: "bg-center-02", position: { x: 18, z: 17 }, size: { w: 24, d: 12, h: 6 }, color: "#7f93a5", roofColor: "#58748d", wallColor: "#c3ced8" },
        { id: "bg-center-03", position: { x: 38, z: 2 }, size: { w: 16, d: 10, h: 5 }, color: "#7d91a4", roofColor: "#597891", wallColor: "#bfccd8" },
        { id: "bg-center-04", position: { x: 58, z: 21 }, size: { w: 22, d: 13, h: 6 }, color: "#8097a8", roofColor: "#5e7f99", wallColor: "#c4d0d9" },
        { id: "bg-center-05", position: { x: 26, z: 34 }, size: { w: 16, d: 10, h: 5 }, color: "#859aaa", roofColor: "#63839b", wallColor: "#c6d1dc" },
        { id: "bg-center-06", position: { x: 0, z: 34 }, size: { w: 18, d: 10, h: 5 }, color: "#869aa8", roofColor: "#638399", wallColor: "#c7d0d8" },
        { id: "bg-center-07", position: { x: 8, z: -25 }, size: { w: 21, d: 12, h: 6 }, color: "#8193a1", roofColor: "#587189", wallColor: "#bac8d3" },
        { id: "bg-center-08", position: { x: 38, z: -24 }, size: { w: 20, d: 12, h: 6 }, color: "#8496a4", roofColor: "#59748c", wallColor: "#c0cbd5" },
        { id: "bg-center-09", position: { x: 64, z: -23 }, size: { w: 18, d: 11, h: 5 }, color: "#8799a6", roofColor: "#5d7b94", wallColor: "#c6d2db" },
        { id: "bg-center-10", position: { x: -44, z: -28 }, size: { w: 18, d: 11, h: 5 }, color: "#8699a8", roofColor: "#5d7c96", wallColor: "#c6d0d9" },
        { id: "bg-center-11", position: { x: -58, z: -29 }, size: { w: 14, d: 10, h: 5 }, color: "#879aa9", roofColor: "#62839e", wallColor: "#c7d2db" },
        { id: "bg-center-12", position: { x: -30, z: 46 }, size: { w: 22, d: 11, h: 5 }, color: "#889baa", roofColor: "#61839e", wallColor: "#c9d4dc" },
        { id: "bg-center-13", position: { x: -58, z: 48 }, size: { w: 18, d: 10, h: 5 }, color: "#8a9dad", roofColor: "#6585a0", wallColor: "#c9d4dd" },
        { id: "bg-center-14", position: { x: 90, z: 48 }, size: { w: 16, d: 9, h: 5 }, color: "#879aaa", roofColor: "#63839e", wallColor: "#c8d3dc" },
        { id: "bg-center-15", position: { x: 108, z: 42 }, size: { w: 14, d: 8, h: 4 }, color: "#8a9cab", roofColor: "#6686a0", wallColor: "#c8d2db" },
        { id: "bg-east-01", position: { x: 80, z: -10 }, size: { w: 15, d: 10, h: 5 }, color: "#879aaa", roofColor: "#63849f", wallColor: "#c4d0db" },
        { id: "bg-east-02", position: { x: 86, z: 18 }, size: { w: 24, d: 12, h: 6 }, color: "#879baa", roofColor: "#62819b", wallColor: "#c8d4dc" },
        { id: "bg-east-03", position: { x: 89, z: -36 }, size: { w: 22, d: 11, h: 5 }, color: "#8398a8", roofColor: "#62829c", wallColor: "#c7d2db" },
        { id: "bg-east-04", position: { x: 76, z: -44 }, size: { w: 16, d: 9, h: 5 }, color: "#8798a5", roofColor: "#5d7d96", wallColor: "#c4d0d9" },
        { id: "bg-east-05", position: { x: 92, z: -50 }, size: { w: 16, d: 12, h: 5 }, color: "#879aa7", roofColor: "#60809a", wallColor: "#c6d1da" },
        { id: "bg-east-06", position: { x: 96, z: 31 }, size: { w: 26, d: 13, h: 6 }, color: "#8699a9", roofColor: "#5e7f99", wallColor: "#c9d4dd" },
        { id: "bg-east-07", position: { x: 68, z: 36 }, size: { w: 18, d: 9, h: 5 }, color: "#879baa", roofColor: "#64859f", wallColor: "#c5d0db" },
        { id: "bg-east-08", position: { x: 48, z: 46 }, size: { w: 20, d: 10, h: 5 }, color: "#8a9ead", roofColor: "#6686a0", wallColor: "#c4cfd8" }
    ],
    roads: [
        { position: { x: -5, z: 8 }, size: { w: 210, d: 7.8 }, color: "#5d666f" },
        { position: { x: -8, z: 34 }, size: { w: 168, d: 6.6 }, color: "#5b646d" },
        { position: { x: 34, z: -30 }, size: { w: 116, d: 6.8 }, color: "#59626c" },
        { position: { x: 89, z: 2 }, size: { w: 6.2, d: 102 }, color: "#56616b" },
        { position: { x: 53, z: 2 }, size: { w: 4.8, d: 98 }, color: "#56606a" },
        { position: { x: 12, z: 4 }, size: { w: 4.8, d: 90 }, color: "#56606a" },
        { position: { x: -28, z: 2 }, size: { w: 4.8, d: 82 }, color: "#55606a" },
        { position: { x: -68, z: 12 }, size: { w: 6.2, d: 60 }, color: "#55606a" },
        { position: { x: -102, z: -2 }, size: { w: 10.5, d: 30 }, color: "#616b73" }
    ],
    yards: [
        { position: { x: -64, z: 16 }, size: { w: 42, d: 24 }, color: "#c9d0d3" },
        { position: { x: -60, z: 30 }, size: { w: 34, d: 16 }, color: "#c6cdd1" },
        { position: { x: 70, z: -41 }, size: { w: 32, d: 20 }, color: "#c8ced1" },
        { position: { x: 5, z: -3 }, size: { w: 24, d: 16 }, color: "#c5cbcf" },
        { position: { x: 100, z: 10 }, size: { w: 18, d: 12 }, color: "#cbcfd2" }
    ],
    greens: [
        { position: { x: 38, z: 19 }, size: { w: 28, d: 18 }, color: "#23442e", treeCount: 22 },
        { position: { x: 83, z: -15 }, size: { w: 24, d: 18 }, color: "#23462f", treeCount: 18 },
        { position: { x: 101, z: -2 }, size: { w: 12, d: 10 }, color: "#1f3d2a", treeCount: 10 },
        { position: { x: -5, z: -46 }, size: { w: 38, d: 16 }, color: "#1f3f2c", treeCount: 20 },
        { position: { x: 65, z: 49 }, size: { w: 34, d: 16 }, color: "#264832", treeCount: 20 },
        { position: { x: -16, z: 49 }, size: { w: 44, d: 20 }, color: "#24442f", treeCount: 24 },
        { position: { x: -88, z: 44 }, size: { w: 22, d: 16 }, color: "#25452f", treeCount: 18 },
        { position: { x: -82, z: -42 }, size: { w: 24, d: 14 }, color: "#1d3d29", treeCount: 16 },
        { position: { x: 18, z: -50 }, size: { w: 22, d: 10 }, color: "#1f402c", treeCount: 12 },
        { position: { x: 100, z: 44 }, size: { w: 18, d: 16 }, color: "#254934", treeCount: 15 },
        { position: { x: 8, z: 52 }, size: { w: 26, d: 10 }, color: "#274c36", treeCount: 14 }
    ],
    treeBelts: [
        { start: { x: -112, z: -58 }, end: { x: 112, z: -58 }, count: 34, width: 6 },
        { start: { x: -112, z: 58 }, end: { x: 112, z: 58 }, count: 34, width: 6 },
        { start: { x: 112, z: -58 }, end: { x: 112, z: 58 }, count: 20, width: 5 },
        { start: { x: -112, z: -20 }, end: { x: -112, z: 58 }, count: 14, width: 5 },
        { start: { x: -96, z: 24 }, end: { x: -72, z: 24 }, count: 7, width: 2.5 },
        { start: { x: -8, z: 44 }, end: { x: 38, z: 44 }, count: 10, width: 2.4 },
        { start: { x: 66, z: 34 }, end: { x: 106, z: 34 }, count: 10, width: 2.6 },
        { start: { x: 98, z: -20 }, end: { x: 98, z: 18 }, count: 8, width: 2.4 }
    ],
    tanks: [
        { id: "tank-west-1", position: { x: -89, z: 24 }, radius: 4.8, height: 1.8, color: "#3b596f" },
        { id: "tank-west-2", position: { x: -80, z: 24 }, radius: 4.8, height: 1.8, color: "#44657d" },
        { id: "tank-west-3", position: { x: -89, z: 15 }, radius: 4.8, height: 1.8, color: "#466881" },
        { id: "tank-west-4", position: { x: -80, z: 15 }, radius: 4.8, height: 1.8, color: "#3c5d76" },
        { id: "tank-east-1", position: { x: 97, z: 33 }, radius: 3.4, height: 1.2, color: "#58758b" },
        { id: "tank-east-2", position: { x: 103, z: 33 }, radius: 3.4, height: 1.2, color: "#5d7d94" }
    ],
    landmarks: [
        { id: "campus-core", name: "中水双膜项目所在地", position: { x: 50, z: -39 }, color: "#00f3ff" }
    ]
};

(function applyCadProjection(layout) {
    const cadPositions = {
        "污水站": { x: 370092.5, y: 4301622.8 },
        "5中水站": { x: 370187.2, y: 4301658.4 },
        "水膜一期水处理": { x: 370205.8, y: 4301627.5 },
        "水膜示范线水处理": { x: 370165.2, y: 4301535.9 },
        "水膜纯水制备": { x: 370288.1, y: 4301695.6 },
        "1#中水回收": { x: 370769.4, y: 4301703.8 },
        "纯水站": { x: 371046.3, y: 4301862.1 },
        "厂区大门": { x: 371347.8, y: 4301716.9 },
        "中水池": { x: 370590.3, y: 4301847.0 },
        "污水池": { x: 370581.6, y: 4301830.9 },
        "中水风机房": { x: 370807.8, y: 4301833.0 },
        "中水泵房": { x: 370821.3, y: 4301820.7 },
        "综合处理间": { x: 370935.1, y: 4301916.8 },
        "调节池": { x: 370810.2, y: 4301887.7 },
        "隔栅隔油池": { x: 370815.8, y: 4301897.2 },
        "氮气站": { x: 371101.5, y: 4301862.0 },
        "第一整理车间": { x: 370870.5, y: 4301865.5 },
        "第二整理车间": { x: 370735.2, y: 4301862.5 },
        "涂布车间": { x: 370980.4, y: 4301851.0 },
        "BOPET功能薄膜生产线": { x: 370575.7, y: 4301665.2 },
        "综合回收车间": { x: 370612.3, y: 4301757.2 },
        "办公楼": { x: 370402.3, y: 4301794.0 },
        "新办公大楼": { x: 371114.1, y: 4301758.8 },
        "旧办公楼": { x: 371178.1, y: 4301739.5 },
        "质检楼": { x: 371130.4, y: 4301785.4 },
        "厂区食堂": { x: 371207.6, y: 4301771.8 },
        "新乳剂车间": { x: 371267.5, y: 4301888.1 },
        "中水双膜": { x: 371194.5, y: 4301898.9 },
        "通达公司": { x: 370449.8, y: 4301751.2 },
        "纸袋车间": { x: 370450.1, y: 4301742.9 },
        "劳动服务公司": { x: 370406.6, y: 4301826.3 },
        "股份9#生产线": { x: 370471.2, y: 4301751.5 },
        "股份7#生产线": { x: 370377.3, y: 4301710.5 },
        "薄膜制造部": { x: 370516.5, y: 4301744.3 },
        "薄膜仓库": { x: 370764.5, y: 4301775.1 },
        "医疗成品库": { x: 370583.9, y: 4301894.0 },
        "股份整理车间": { x: 370785.0, y: 4301864.1 },
        "磁信息办公楼": { x: 370902.7, y: 4301757.3 },
        "片种研究楼": { x: 370922.6, y: 4301749.2 },
        "股份研究所": { x: 370819.6, y: 4301719.8 },
        "股份乳剂冷库": { x: 371085.1, y: 4301877.7 },
        "医疗影像乳剂车间": { x: 371125.5, y: 4301739.8 },
        "小礼堂": { x: 371317.8, y: 4301763.6 },
        "单身宿舍": { x: 371347.6, y: 4301828.0 },
        "长寿园": { x: 371314.8, y: 4301935.2 },
        "西办公楼": { x: 371212.8, y: 4301738.3 },
        "东办公楼": { x: 371288.3, y: 4301737.0 },
        "环境监测": { x: 371290.7, y: 4301882.8 },
        "花房": { x: 371278.7, y: 4301929.6 },
        "花房值班": { x: 371270.9, y: 4301902.8 },
        "自行车棚": { x: 371272.2, y: 4301749.1 },
        "停车场": { x: 371347.6, y: 4301749.8 },
        "汽车停车场": { x: 371347.8, y: 4301759.8 },
        "曙光厂": { x: 370379.3, y: 4301926.2 }
    };

    function projectCadPosition(point) {
        const ref = layout.cadProjection;
        const nx = (point.x - ref.minX) / (ref.maxX - ref.minX);
        const ny = (point.y - ref.minY) / (ref.maxY - ref.minY);
        return {
            x: (nx - 0.5) * ref.worldWidth,
            z: -(ny - 0.5) * ref.worldDepth
        };
    }

    layout.buildings.concat(layout.supplementalBuildings || []).forEach((building) => {
        const cadPoint = cadPositions[building.name];
        if (!cadPoint) return;
        building.position = projectCadPosition(cadPoint);
    });

    const campusCore = projectCadPosition({ x: 371181.7, y: 4301883.4 });
    if (layout.landmarks && layout.landmarks[0]) {
        layout.landmarks[0].position = campusCore;
    }
})(window.SiteCampusLayout);
