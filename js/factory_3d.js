(function () {
    var container = document.getElementById('canvas-container');
    if (!container) return;

    /* ===========================
       1. SCENE & RENDERER
       =========================== */
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    var RW = 80, RD = 30, RH = 30;
    scene.fog = new THREE.Fog(0x334455, 160, 420);

    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 400);
    camera.position.set(35, 12, 55);
    camera.lookAt(0, 3, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    /* ===========================
       2. PROCEDURAL TEXTURES
       =========================== */
    // 水泥墙面纹理
    function createConcreteTexture(w, h, baseColor) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < w * h * 0.04; i++) {
            var x = Math.random() * w, y = Math.random() * h;
            var v = 180 + Math.random() * 40;
            ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.04)';
            ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
        // 水平接缝线
        for (var y = h * 0.25; y < h; y += h * 0.33) {
            ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, y + (Math.random()-0.5)*3); ctx.lineTo(w, y + (Math.random()-0.5)*3); ctx.stroke();
        }
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    // 工业环氧地坪纹理
    function createEpoxyFloorTexture(w, h) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#4a5248'; ctx.fillRect(0, 0, w, h);
        for (var i = 0; i < w * h * 0.06; i++) {
            var v = 65 + Math.random() * 20;
            ctx.fillStyle = 'rgba(' + v + ',' + (v+2) + ',' + (v-4) + ',0.06)';
            ctx.fillRect(Math.random()*w, Math.random()*h, 2+Math.random()*5, 2+Math.random()*5);
        }
        // 地面分隔缝
        ctx.strokeStyle = 'rgba(30,30,25,0.25)'; ctx.lineWidth = 2;
        for (var x = w * 0.2; x < w; x += w * 0.25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (var y = h * 0.2; y < h; y += h * 0.4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    var concreteTex = createConcreteTexture(512, 512, '#d4cec4');
    concreteTex.repeat.set(6, 1);

    var floorTex = createEpoxyFloorTexture(512, 512);
    floorTex.repeat.set(8, 4);

    /* ===========================
       3. MATERIALS (Phong)
       =========================== */
    var wallMat = new THREE.MeshPhongMaterial({
        map: concreteTex, color: 0xe8e2d8,
        specular: 0x333333, shininess: 8
    });
    var floorMat = new THREE.MeshPhongMaterial({
        map: floorTex, color: 0x5a5a50,
        specular: 0x222222, shininess: 15
    });
    var ceilMat = new THREE.MeshPhongMaterial({
        color: 0xc8c4bc, specular: 0x333333, shininess: 10,
        side: THREE.DoubleSide
    });
    var colMat = new THREE.MeshPhongMaterial({
        color: 0xd8d4cc, specular: 0x444444, shininess: 25
    });
    var doorFrame = new THREE.MeshPhongMaterial({
        color: 0x5a5450, specular: 0x666666, shininess: 40
    });
    var glassMat = new THREE.MeshPhongMaterial({
        color: 0xbfd8e8, specular: 0xffffff, shininess: 80,
        transparent: true, opacity: 0.35
    });
    var baseMat = new THREE.MeshPhongMaterial({
        color: 0x3a3834, specular: 0x444444, shininess: 30
    });
    var floorMat = new THREE.MeshStandardMaterial({
        map: floorTex, color: 0x5a5a50,
        roughness: 0.55, metalness: 0.05
    });
    var ceilMat = new THREE.MeshStandardMaterial({
        color: 0xc8c4bc, roughness: 0.6, metalness: 0.3,
        side: THREE.DoubleSide
    });
    var colMat = new THREE.MeshStandardMaterial({
        color: 0xd8d4cc, roughness: 0.5, metalness: 0.35
    });
    var doorFrame = new THREE.MeshStandardMaterial({
        color: 0x5a5450, roughness: 0.4, metalness: 0.6
    });
    var glassMat = new THREE.MeshStandardMaterial({
        color: 0xbfd8e8, roughness: 0.1, metalness: 0.1,
        transparent: true, opacity: 0.35
    });
    // 踢脚线/底座材质
    var baseMat = new THREE.MeshStandardMaterial({
        color: 0x3a3834, roughness: 0.5, metalness: 0.5
    });

    /* ===========================
       4. LIGHTING
       =========================== */
    scene.add(new THREE.AmbientLight(0xc8d8e8, 0.4));

    // 半球光 (天空+地面)
    var hemi = new THREE.HemisphereLight(0xd8e8f8, 0x3a3830, 0.5);
    scene.add(hemi);

    // 主方向光 (模拟天窗/高窗自然光)
    var sun = new THREE.DirectionalLight(0xfff8e8, 0.8);
    sun.position.set(-40, 20, 0);
    scene.add(sun);

    // 补充点光源 (模拟厂房顶部LED工业灯)
    for (var lx = -60; lx <= 60; lx += 20) {
        for (var lz = -16; lz <= 16; lz += 12) {
            var pt = new THREE.PointLight(0xfff4e0, 0.45, 30);
            pt.position.set(lx, RH - 0.5, lz);
            scene.add(pt);
        }
    }

    /* ===========================
       5. ROOM STRUCTURE
       =========================== */
    // 地面
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 天花板 (带金属格栅感)
    var ceiling = new THREE.Mesh(new THREE.PlaneGeometry(RW * 2, RD * 2), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = RH;
    scene.add(ceiling);

    // 天花板钢梁 (横向)
    for (var bx = -60; bx <= 60; bx += 15) {
        var beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.35, RD * 2),
            new THREE.MeshPhongMaterial({ color: 0x6a6864, specular: 0x555555, shininess: 45 })
        );
        beam.position.set(bx, RH, 0);
        beam.castShadow = true;
        scene.add(beam);
    }

    // 墙壁
    function wall(x, z, w, d) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, RH, d), wallMat);
        m.position.set(x, RH / 2, z);
        m.receiveShadow = true;
        m.castShadow = true;
        scene.add(m);
    }
    wall(0, -RD, RW * 2 + 0.4, 0.3);
    wall(0, RD, RW * 2 + 0.4, 0.3);
    wall(-RW, 0, 0.3, RD * 2 + 0.4);
    wall(RW, 0, 0.3, RD * 2 + 0.4);

    // 踢脚线
    function baseboard(x, z, len, dir) {
        var w = dir === 'x' ? len : 0.12;
        var d = dir === 'x' ? 0.12 : len;
        var b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), baseMat);
        b.position.set(x, 0.075, z);
        b.receiveShadow = true;
        scene.add(b);
    }
    baseboard(0, -RD + 0.06, RW * 2 - 0.2, 'x');
    baseboard(0, RD - 0.06, RW * 2 - 0.2, 'x');
    baseboard(-RW + 0.06, 0, RD * 2 - 0.2, 'z');
    baseboard(RW - 0.06, 0, RD * 2 - 0.2, 'z');

    // 结构柱
    for (var cx = -68; cx <= 68; cx += 14) {
        for (var cz = -RD + 1; cz <= RD - 1; cz += (RD - 1) * 2) {
            var col = new THREE.Mesh(new THREE.BoxGeometry(0.5, RH, 0.5), colMat);
            col.position.set(cx, RH / 2, cz);
            col.castShadow = true;
            col.receiveShadow = true;
            scene.add(col);
        }
    }

    // 窗户
    for (var wx = -64; wx <= 64; wx += 14) {
        var wg = new THREE.Group();
        wg.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 0.1), doorFrame));
        var gl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), glassMat);
        gl.position.z = 0.06;
        wg.add(gl);
        wg.position.set(wx, 3.2, RD - 0.02);
        scene.add(wg);
    }

    // 大门
    var dg = new THREE.Group();
    dg.add((function () {
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3, 0.28), doorFrame);
        m.position.set(-0.85, 1.5, 0);
        return m;
    })());
    dg.add((function () {
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3, 0.28), doorFrame);
        m.position.set(0.85, 1.5, 0);
        return m;
    })());
    dg.add((function () {
        var m = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.18, 0.32), doorFrame);
        m.position.set(0, 3, 0);
        return m;
    })());
    dg.position.set(-77, 0.02, RD - 0.02);
    scene.add(dg);

    /* ===========================
       6. LOAD DEVICE GLB MODEL
       =========================== */
    var loader = new THREE.GLTFLoader();
    loader.load('models/device.glb',
        function (gltf) {
            var model = gltf.scene;
            model.rotation.x = Math.PI / 2;
            model.updateMatrixWorld();

            var box = new THREE.Box3().setFromObject(model);
            var size = box.getSize(new THREE.Vector3());
            if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
                model.rotation.x = 0;
                model.updateMatrixWorld();
                box.setFromObject(model);
                size = box.getSize(new THREE.Vector3());
            }

            var targetWidth = RW * 2 * 0.3;
            var refSize = Math.max(size.x, size.z) || 1;
            var scale = targetWidth / refSize;
            if (!isFinite(scale) || scale <= 0) scale = 1;
            model.scale.set(scale, scale, scale);

            model.updateMatrixWorld();
            box.setFromObject(model);
            var center = box.getCenter(new THREE.Vector3());
            var groundY = -box.min.y;
            model.position.set(-center.x, groundY, -center.z);

            // 地面投影阴影(假阴影贴片)
            var shadowGeo = new THREE.PlaneGeometry(
                (box.max.x - box.min.x) * 1.05,
                (box.max.z - box.min.z) * 1.05
            );
            var shadowC = document.createElement('canvas');
            shadowC.width = 256; shadowC.height = 256;
            var sctx = shadowC.getContext('2d');
            var gradient = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, 'rgba(0,0,0,0.45)');
            gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            sctx.fillStyle = gradient;
            sctx.fillRect(0, 0, 256, 256);
            var shadowTex = new THREE.CanvasTexture(shadowC);
            shadowTex.wrapS = shadowTex.wrapT = THREE.ClampToEdgeWrapping;
            var shadowPlane = new THREE.Mesh(shadowGeo,
                new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.7 })
            );
            shadowPlane.rotation.x = -Math.PI / 2;
            shadowPlane.position.set(0, 0.01, 0);
            scene.add(shadowPlane);

            // 底部光晕
            var glowGeo = new THREE.PlaneGeometry(
                (box.max.x - box.min.x) * 1.4,
                (box.max.z - box.min.z) * 1.4
            );
            var glowC = document.createElement('canvas');
            glowC.width = 256; glowC.height = 256;
            var gctx = glowC.getContext('2d');
            var glowGrad = gctx.createRadialGradient(128, 128, 30, 128, 128, 128);
            glowGrad.addColorStop(0, 'rgba(0,200,255,0.06)');
            glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            gctx.fillStyle = glowGrad;
            gctx.fillRect(0, 0, 256, 256);
            var glowTex = new THREE.CanvasTexture(glowC);
            glowTex.wrapS = glowTex.wrapT = THREE.ClampToEdgeWrapping;
            var glowPlane = new THREE.Mesh(glowGeo,
                new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending })
            );
            glowPlane.rotation.x = -Math.PI / 2;
            glowPlane.position.set(0, 0.02, 0);
            scene.add(glowPlane);

            // 增强模型材质
            model.traverse(function (child) {
                if (child.isMesh && child.material) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    var origMat = child.material;
                    // 获取原始颜色和贴图
                    var origColor = origMat.color ? origMat.color.getHex() : 0xcccccc;
                    var origMap = origMat.map || null;

                    // 判断材质类型来设置合适的参数
                    var isMetal = origColor < 0x666666 || origColor > 0xdddddd;
                    var newMat = new THREE.MeshPhongMaterial({
                        color: origColor,
                        map: origMap,
                        specular: isMetal ? 0x666666 : 0x222222,
                        shininess: isMetal ? 50 : 15,
                        emissive: origColor,
                        emissiveIntensity: 0.03,
                        transparent: origMat.transparent || false,
                        opacity: origMat.opacity || 1
                    });
                    child.material = newMat;
                }
            });

    scene.add(model);

            window.deviceModel = model;
        },
        function () { },
        function (err) { console.warn('device.glb load error', err); }
    );

    /* ===========================
       6b. DEVICE DATA & POSITIONS
       =========================== */
    var deviceData = {
        '原水箱':           { disp:'液位: 2.1m',  pos:[-30, 2, 0], info:'<b>原水箱</b><br>● 实时液位：2.1 m<br>● 设计容积：50 m³<br>● 箱体材质：碳钢防腐' },
        '超滤产水箱':       { disp:'液位: 3.2m',  pos:[15, 2, 0], info:'<b>超滤产水箱</b><br>● 实时液位：3.2 m<br>● 设计容积：30 m³<br>● 箱体材质：碳钢防腐' },
        '软水箱':           { disp:'液位: 2.8m',  pos:[-35, 2, 6], info:'<b>软水箱</b><br>● 实时液位：2.8 m<br>● 设计容积：25 m³<br>● 箱体材质：碳钢防腐' },
        '化学清洗水箱':      { disp:'液位: 0.5m',  pos:[-45, 2, -6], info:'<b>化学清洗水箱</b><br>● 实时液位：0.5 m<br>● 设计容积：5 m³<br>● 箱体材质：PE' },
        '杀菌剂加药':       { disp:'投加中',      pos:[-22, 2, 8], info:'<b>杀菌剂加药装置</b><br>● 计量箱液位/容积：0.8m / 1.0m³<br>● 箱体材质：PE<br>● 计量泵实时流量：1.5 L/h' },
        '还原剂加药':       { disp:'投加中',      pos:[-18, 2, 8], info:'<b>还原剂加药装置</b><br>● 计量箱液位/容积：0.6m / 1.0m³<br>● 箱体材质：PE<br>● 计量泵实时流量：2.0 L/h' },
        '阻垢剂加药':       { disp:'投加中',      pos:[-14, 2, 8], info:'<b>阻垢剂加药装置</b><br>● 计量箱液位/容积：0.9m / 1.0m³<br>● 箱体材质：PE<br>● 计量泵实时流量：3.5 L/h' },
        'UF酸洗加药':       { disp:'待机',        pos:[-10, 2, 8], info:'<b>超滤酸洗加药装置</b><br>● 计量箱液位/容积：0.5m / 2.0m³<br>● 箱体材质：PE<br>● 计量泵实时流量：0.0 L/h' },
        '絮凝剂加药':       { disp:'投加中',      pos:[-6, 2, 8], info:'<b>絮凝剂加药装置</b><br>● 计量箱液位/容积：0.7m / 1.0m³<br>● 箱体材质：PE<br>● 计量泵实时流量：1.2 L/h' },
        '保安过滤器':       { disp:'运行: 480h',  pos:[25, 2, 0], info:'<b>反渗透保安过滤器</b><br>● 滤芯材质及精度：PP / 1μm<br>● 累计运行时间：480 小时<br>● 建议：即将到达更换周期' },
        '化学清洗过滤器':    { disp:'运行: 25h',   pos:[-42, 2, -6], info:'<b>化学清洗过滤器</b><br>● 滤芯材质及精度：PP / 5μm<br>● 累计运行时间：25 小时' },
        '袋式过滤器':       { disp:'运行: 120h',   pos:[-8, 2, 0], info:'<b>柱式超滤袋式过滤器</b><br>● 滤袋材质及精度：PP / 100μm<br>● 累计运行时间：120 小时' },
        '自清洗过滤器':      { disp:'正常',        pos:[-20, 2, 0], info:'<b>自清洗过滤器</b><br>● 滤网材质：不锈钢<br>● 过滤精度：200μm<br>● 自动排污系统：就绪' },
        '多介质过滤器':      { disp:'P:0.25MPa',   pos:[-15, 2, 0], info:'<b>多介质过滤器</b><br>● 进水压力：0.25 MPa<br>● 滤料规格：锰砂 (2-4mm)<br>● 设备规格：D2200×3000H<br>● 罐体材质：碳钢防腐' },
        'RO膜组':          { disp:'25支|电导:8.5', pos:[30, 2, 0], info:'<b>反渗透(RO)处理单元</b><br>● 进水流量：12.5 m³/h<br>● 前后压差：0.15 MPa<br>● 产水电导率：8.5 μS/cm<br>● 膜元件数量：25 支<br>● 产水温度：22.5 ℃<br>● 进水pH：7.2 | 产水pH：6.8<br>● 进水COD：3.5 mg/L<br>● ORP：180 mV<br>● 进水余氯：0.04 mg/L' },
        '超滤UF膜组':       { disp:'8支|浊度:0.08', pos:[0, 2, 0], info:'<b>超滤(UF)处理单元</b><br>● 进水流量：18.5 m³/h<br>● 产水流量：15.0 m³/h<br>● 跨膜压差(TMP)：0.04 MPa<br>● 产水浊度：0.08 NTU<br>● 进水温度：21.8 ℃<br>● 进水pH：7.3<br>● 进水COD：4.2 mg/L<br>● 膜组件数量：8 支<br>● 单支面积：77 m²<br>● 膜孔径：≤0.03 μm' },
        '原水提升泵':       { disp:'45Hz|15.2A',  pos:[-25, 2, 0], info:'<b>原水提升泵</b><br>● 数量：2台（1用1备）<br>● 额定流量：50 m³/h<br>● 扬程：32 m<br>● 功率：7.5 kW<br>● 运行频率：45.0 Hz<br>● 实时电流：15.2 A' },
        '超滤进水泵':       { disp:'48.5Hz|22.1A', pos:[-10, 2, 0], info:'<b>超滤进水泵</b><br>● 数量：2台（1用1备）<br>● 额定流量：40 m³/h<br>● 扬程：35 m<br>● 功率：11 kW<br>● 运行频率：48.5 Hz<br>● 实时电流：22.1 A' },
        'RO高压泵':        { disp:'42Hz|1.25MPa', pos:[22, 2, 5], info:'<b>反渗透高压泵</b><br>● 数量：2台（1用1备）<br>● 额定流量：25 m³/h<br>● 扬程：150 m<br>● 功率：18.5 kW<br>● 进水压力：1.2 MPa<br>● 出水压力：1.5 MPa<br>● 运行频率：42.0 Hz' },
        'UF反洗水泵':      { disp:'待机|45Hz',   pos:[5, 2, 5], info:'<b>超滤反洗水泵</b><br>● 数量：1台<br>● 额定流量：80 m³/h<br>● 扬程：20 m<br>● 功率：7.5 kW<br>● 运行状态：待机（无反洗指令）' },
        'CIP清洗水泵':      { disp:'待机|0.3MPa',  pos:[-38, 2, -6], info:'<b>化学清洗水泵</b><br>● 数量：1台<br>● 额定流量：20 m³/h<br>● 扬程：35 m<br>● 功率：4 kW<br>● 运行状态：CIP系统备用' },
        '罗茨风机':         { disp:'待机|0kPa',   pos:[8, 2, -5], info:'<b>反洗风机(罗茨风机)</b><br>● 数量：1台<br>● 额定风量：12 m³/min<br>● 出口风压：0.0 kPa<br>● 功率：5.5 kW<br>● 运行状态：待气洗指令' },
        'RO产水箱':         { disp:'液位: 2.5m',  pos:[40, 2, 0], info:'<b>反渗透产水箱</b><br>● 实时液位：2.5 m<br>● 设计容积：30 m³<br>● 箱体材质：碳钢防腐' },
        '中控柜':           { disp:'运行正常',     pos:[55, 2, -6], info:'<b>中控柜</b><br>● PLC运行状态：正常<br>● 通讯心跳：在线<br>● 当前模式：智控模式<br>● 环境温度：26.5 ℃' }
    };

    function showDeviceDetail(name) {
        var dd = deviceData[name] || { info: '<b>' + name + '</b><br>暂无详细参数' };
        var panel = document.getElementById('device-info-panel');
        if (panel) {
            panel.style.display = 'block';
            panel.innerHTML = '<div class="module-title" style="margin:0 0 10px;border:none;padding:0;font-size:15px;">' +
                name + '</div><div style="color:#b0c4de;font-size:13px;line-height:1.8;">' + dd.info + '</div>';
        }
        // 高亮激活按钮
        var btns = document.querySelectorAll('#device-list .device-item');
        btns.forEach(function(b) { b.classList.remove('active'); });
        var safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
        var activeBtn = document.getElementById('dev-btn-' + safeName);
        if (activeBtn) activeBtn.classList.add('active');
    }

    function flyToDevice(name) {
        var dd = deviceData[name];
        if (!dd || !dd.pos) return;
        var p = dd.pos;
        camera.position.set(p[0] + 6, p[1] + 4, p[2] + 10);
        controls.target.set(p[0], p[1], p[2]);
    }

    function handleDeviceSelect(name) {
        showDeviceDetail(name);
    }

    // 构建设备列表
    (function buildDeviceList() {
        var list = document.getElementById('device-list');
        if (!list) return;
        var ordered = Object.keys(deviceData);
        ordered.forEach(function(name) {
            var dd = deviceData[name];
            var item = document.createElement('div');
            item.className = 'device-item';
            var safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
            item.id = 'dev-btn-' + safeName;
            item.innerHTML = '<div class="device-summary"><span>' + name + '</span><span class="status-tag running" style="font-size:10px;">' + (dd.disp || '') + '</span></div>';
            item.addEventListener('click', function() { handleDeviceSelect(name); });
            list.appendChild(item);
        });
    })();

    /* ===========================
       7. CONTROLS
       =========================== */
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2;
    controls.maxDistance = 120;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, 2, 0);
    controls.update();

    function clampRoom() {
        var m = 1.2;
        camera.position.x = Math.max(-RW + m, Math.min(RW - m, camera.position.x));
        camera.position.z = Math.max(-RD + m, Math.min(RD - m, camera.position.z));
        camera.position.y = Math.max(0.3, Math.min(RH + 20, camera.position.y));
        controls.target.x = Math.max(-RW + 0.5, Math.min(RW - 0.5, controls.target.x));
        controls.target.z = Math.max(-RD + 0.5, Math.min(RD - 0.5, controls.target.z));
        controls.target.y = Math.max(0.1, Math.min(RH - 0.3, controls.target.y));
    }

    /* ===========================
       8. ANIMATION LOOP
       =========================== */
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        clampRoom();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // WASD walking
    var keys = {};
    window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    setInterval(function () {
        if (!keys.w && !keys.a && !keys.s && !keys.d) return;
        var spd = 0.15;
        var fwd = new THREE.Vector3();
        camera.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        var rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
        if (keys.w) { camera.position.addScaledVector(fwd, spd); controls.target.addScaledVector(fwd, spd); }
        if (keys.s) { camera.position.addScaledVector(fwd, -spd); controls.target.addScaledVector(fwd, -spd); }
        if (keys.a) { camera.position.addScaledVector(rgt, -spd); controls.target.addScaledVector(rgt, -spd); }
        if (keys.d) { camera.position.addScaledVector(rgt, spd); controls.target.addScaledVector(rgt, spd); }
        clampRoom();
    }, 16);

    /* ===========================
       9. PUBLIC API
       =========================== */
    window.showSysAlert = function (msg) {
        var b = document.getElementById('sys-alert');
        if (!b) return;
        b.innerText = msg;
        b.style.display = 'block';
        setTimeout(function () { b.style.display = 'none'; }, 4000);
    };
    window.viewGod = function () { camera.position.set(0, 28, 0); controls.target.set(0, 2, 0); };
    window.viewUF = function () { camera.position.set(-7, 10, 15); controls.target.set(-7, 3, 0); };
    window.viewRO = function () { camera.position.set(-12, 10, 15); controls.target.set(-12, 3, 0); };

    /* ===========================
       10. DEVICE SIGNS (3D labels)
       =========================== */
    function createSign(text, statusText, color, x, y, z) {
        var c = document.createElement('canvas');
        c.width = 512; c.height = 200;
        var ctx = c.getContext('2d');
        // 背景面板
        ctx.fillStyle = 'rgba(4, 21, 55, 0.85)';
        roundRect(ctx, 10, 10, 492, 180, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.lineWidth = 3;
        roundRect(ctx, 10, 10, 492, 180, 16);
        ctx.stroke();
        // 左侧色条
        ctx.fillStyle = color;
        roundRect(ctx, 10, 10, 8, 180, { tl: 16, tr: 0, bl: 16, br: 0 });
        ctx.fill();
        // 标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 260, 62);
        // 状态行
        ctx.fillStyle = color;
        ctx.font = '22px Arial';
        ctx.fillText(statusText, 260, 108);
        // 底部指示
        ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
        ctx.font = '16px Arial';
        ctx.fillText('▼ 巡检中 ▼', 260, 155);

        var tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
        var sprite = new THREE.Sprite(mat);
        sprite.position.set(x, y, z);
        sprite.scale.set(3, 1.18, 1);
        scene.add(sprite);
        return sprite;
    }

    function roundRect(ctx, x, y, w, h, r) {
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        ctx.beginPath();
        ctx.moveTo(x + r.tl, y);
        ctx.lineTo(x + w - r.tr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        ctx.lineTo(x + w, y + h - r.br);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        ctx.lineTo(x + r.bl, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        ctx.lineTo(x, y + r.tl);
        ctx.quadraticCurveTo(x, y, x + r.tl, y);
        ctx.closePath();
    }

    // 反渗透(RO)指示牌 - 左侧
    createSign('RO 反渗透膜组', '25支 · 电导率 8.5 μS/cm · 运行中', '#00f3ff', -12, 7, 0);
    // 超滤(UF)指示牌 - 中左
    createSign('UF 超滤膜组', '8支 · 产水浊度 0.08 NTU · 运行中', '#00fa9a', -7, 7, 0);
    window.triggerFlowSimulation = function () { };
    window.stopFlowSimulation = function () { };

    // 控制台 KPI 实时刷新
    setInterval(function () {
        var flow = document.getElementById('kpi-flow');
        var recov = document.getElementById('kpi-recov');
        var cond = document.getElementById('kpi-cond');
        if (flow) flow.innerText = (12 + Math.random() * 1.5).toFixed(1);
        if (recov) recov.innerText = (67 + Math.random() * 3).toFixed(1);
        if (cond) cond.innerText = (12.8 + Math.random() * 1.2).toFixed(1);
    }, 3000);

})();