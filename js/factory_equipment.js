/**
 * 中水双膜 — 核心工艺设备 3D 模型资产库
 * 所有模型原点(pivot)位于底部正中央，可直接贴地放置。
 * 圆柱分段数: 16-24, 低多边形优化。
 */
(function (global) {
    if (!global.THREE) return;

    /* ===== 材质预设 ===== */
    function mat(color, opts) {
        return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.75, metalness: 0.1 }, opts));
    }
    var SS304 = function () { return mat(0xb8b8b0, { roughness: 0.35, metalness: 0.85 }); };
    var carbonSteel = function () { return mat(0x484842, { roughness: 0.55, metalness: 0.6 }); };
    var castIron = function () { return mat(0x3e3e38, { roughness: 0.6, metalness: 0.5 }); };
    var pumpBlue = function () { return mat(0x1e5a9e, { roughness: 0.38, metalness: 0.25 }); };
    var frpWhite = function () { return mat(0xf5f2ec, { roughness: 0.28, metalness: 0.04 }); };
    var pvcWhite = function () { return mat(0xf0ece4, { roughness: 0.32, metalness: 0.03 }); };
    var blueEndCap = function () { return mat(0x3a6890, { roughness: 0.32, metalness: 0.08 }); };
    var basePlate = function () { return mat(0x3a3832, { roughness: 0.9, metalness: 0.05 }); };
    var flangeSS = function () { return mat(0xc0c0b8, { roughness: 0.3, metalness: 0.8 }); };

    /* ===== 辅助：创建圆柱体 ===== */
    function cyl(rTop, rBot, h, seg) { return new THREE.CylinderGeometry(rTop, rBot, h, seg || 20); }
    function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }

    /* ===== 辅助：碟形 / 椭圆封头 ===== */
    function dishedHead(radius, height, segs) {
        // 用缩放的半球近似椭圆封头
        var geo = new THREE.SphereGeometry(radius, segs || 20, Math.floor(segs / 2), 0, Math.PI * 2, 0, Math.PI / 2);
        // 沿Y轴压缩成椭圆
        var pos = geo.attributes.position;
        for (var i = 0; i < pos.count; i++) {
            var y = pos.getY(i);
            pos.setY(i, y * (height / radius));
        }
        geo.computeVertexNormals();
        return geo;
    }

    // ==================== 1. 立式水处理罐 ====================
    function createFilterTank(opts) {
        opts = opts || {};
        var radius = opts.radius || 0.9;
        var height = opts.height || 3.2;
        var headH = radius * 0.35;       // 封头高度
        var segs = opts.segments || 20;
        var bodyH = height - headH * 2;

        var group = new THREE.Group();

        // 罐体直筒段
        var body = new THREE.Mesh(cyl(radius, radius, bodyH, segs), carbonSteel());
        body.position.y = headH + bodyH / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 上封头
        var topHead = new THREE.Mesh(dishedHead(radius, headH, segs), carbonSteel());
        topHead.position.y = headH + bodyH;
        topHead.castShadow = true;
        group.add(topHead);

        // 下封头 (翻转)
        var botHead = new THREE.Mesh(dishedHead(radius, headH, segs), carbonSteel());
        botHead.rotation.x = Math.PI;
        botHead.position.y = headH;
        botHead.castShadow = true;
        group.add(botHead);

        // 顶部检修人孔
        var manholeNeck = new THREE.Mesh(cyl(0.25, 0.25, 0.25, 16), SS304());
        manholeNeck.position.y = height - 0.05;
        group.add(manholeNeck);
        var manholeFlange = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 20), SS304());
        manholeFlange.rotation.x = Math.PI / 2;
        manholeFlange.position.y = height + 0.08;
        group.add(manholeFlange);

        // 进水法兰 (上半段侧面)
        var inFlange = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 20), flangeSS());
        inFlange.position.set(radius + 0.08, height * 0.78, 0);
        group.add(inFlange);
        var inNeck = new THREE.Mesh(cyl(0.12, 0.12, 0.3, 16), SS304());
        inNeck.rotation.z = Math.PI / 2;
        inNeck.position.set(radius + 0.06, height * 0.78, 0);
        group.add(inNeck);

        // 出水法兰 (下半段侧面)
        var outFlange = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 20), flangeSS());
        outFlange.position.set(radius + 0.08, height * 0.25, 0);
        group.add(outFlange);
        var outNeck = new THREE.Mesh(cyl(0.12, 0.12, 0.3, 16), SS304());
        outNeck.rotation.z = Math.PI / 2;
        outNeck.position.set(radius + 0.06, height * 0.25, 0);
        group.add(outNeck);

        // 底部裙座
        var skirt = new THREE.Mesh(cyl(radius + 0.1, radius + 0.1, 0.35, segs), SS304());
        skirt.position.y = 0.18;
        group.add(skirt);

        // 液位计竖条
        var sightGlass = new THREE.Mesh(box(0.04, bodyH * 0.7, 0.04), new THREE.MeshStandardMaterial({ color: 0x88cc88, roughness: 0.2, metalness: 0.1 }));
        sightGlass.position.set(radius - 0.12, headH + bodyH * 0.35, 0);
        group.add(sightGlass);

        // 铭牌
        var nameplate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.6 }));
        nameplate.position.set(0, height * 0.55, radius + 0.01);
        group.add(nameplate);

        group.userData = { pivotBase: true };
        return group;
    }

    // ==================== 2. 卧式离心泵 ====================
    function createCentrifugalPump(opts) {
        opts = opts || {};
        var scale = opts.scale || 1;

        var group = new THREE.Group();

        // 底板
        var base = new THREE.Mesh(box(1.9 * scale, 0.1 * scale, 0.85 * scale), basePlate());
        base.position.y = 0.05 * scale;
        base.receiveShadow = true;
        group.add(base);

        // 支撑脚 (4个)
        var footPositions = [
            [-0.7, 0, -0.28], [0.7, 0, -0.28],
            [-0.7, 0, 0.28], [0.7, 0, 0.28]
        ];
        footPositions.forEach(function (p) {
            var foot = new THREE.Mesh(box(0.18 * scale, 0.08 * scale, 0.18 * scale), castIron());
            foot.position.set(p[0] * scale, 0.09 * scale, p[2] * scale);
            group.add(foot);
        });

        // 电机主体 (圆柱)
        var motorRadius = 0.32 * scale;
        var motorLen = 1.2 * scale;
        var motor = new THREE.Mesh(cyl(motorRadius, motorRadius, motorLen, 18), pumpBlue());
        motor.rotation.z = Math.PI / 2;
        motor.position.set(0.4 * scale, 0.28 * scale, 0);
        motor.castShadow = true;
        group.add(motor);

        // 散热鳍片 (电机体上的细环)
        for (var fi = 0; fi < 7; fi++) {
            var fin = new THREE.Mesh(new THREE.TorusGeometry(motorRadius + 0.04 * scale, 0.015 * scale, 6, 20), castIron());
            fin.position.set(0.4 * scale + (fi - 3) * 0.16 * scale, 0.28 * scale, 0);
            fin.rotation.y = Math.PI / 2;
            group.add(fin);
        }

        // 电机风扇罩 (尾端)
        var fanCover = new THREE.Mesh(cyl(motorRadius + 0.02 * scale, motorRadius + 0.02 * scale, 0.18 * scale, 18), castIron());
        fanCover.rotation.z = Math.PI / 2;
        fanCover.position.set(0.95 * scale, 0.28 * scale, 0);
        group.add(fanCover);
        var fanEnd = new THREE.Mesh(cyl(motorRadius + 0.01 * scale, motorRadius + 0.01 * scale, 0.04 * scale, 18), mat(0x555555));
        fanEnd.rotation.z = Math.PI / 2;
        fanEnd.position.set(1.05 * scale, 0.28 * scale, 0);
        group.add(fanEnd);

        // 电机接线盒
        var jbox = new THREE.Mesh(box(0.25 * scale, 0.22 * scale, 0.22 * scale), mat(0x3a3c40));
        jbox.position.set(0.3 * scale, 0.6 * scale, 0);
        group.add(jbox);

        // 泵体蜗壳 (组合几何体近似)
        var voluteGroup = new THREE.Group();
        // 蜗壳主体 — 短粗圆柱
        var voluteBody = new THREE.Mesh(cyl(0.3 * scale, 0.3 * scale, 0.25 * scale, 18), castIron());
        voluteBody.rotation.x = Math.PI / 2;
        voluteBody.position.set(0, 0, 0);
        voluteBody.castShadow = true;
        voluteGroup.add(voluteBody);

        // 蜗壳前盖
        var voluteFace = new THREE.Mesh(cyl(0.3 * scale, 0.3 * scale, 0.04 * scale, 18), mat(0x555555));
        voluteFace.position.set(0.14 * scale, 0, 0);
        voluteFace.rotation.z = Math.PI / 2;
        voluteGroup.add(voluteFace);

        // 吸入锥管 (前端)
        var suctionCone = new THREE.Mesh(cyl(0.16 * scale, 0.2 * scale, 0.3 * scale, 16), castIron());
        suctionCone.rotation.z = Math.PI / 2;
        suctionCone.position.set(-0.3 * scale, 0, 0);
        voluteGroup.add(suctionCone);

        // 吸入口法兰
        var suctionFlange = new THREE.Mesh(new THREE.TorusGeometry(0.16 * scale, 0.04 * scale, 8, 16), flangeSS());
        suctionFlange.position.set(-0.48 * scale, 0, 0);
        suctionFlange.rotation.y = Math.PI / 2;
        voluteGroup.add(suctionFlange);

        // 排出口 (向上)
        var dischargeNozzle = new THREE.Mesh(box(0.12 * scale, 0.22 * scale, 0.12 * scale), castIron());
        dischargeNozzle.position.set(0, 0.18 * scale, 0);
        voluteGroup.add(dischargeNozzle);

        var dischargeFlange = new THREE.Mesh(new THREE.TorusGeometry(0.12 * scale, 0.04 * scale, 8, 12), flangeSS());
        dischargeFlange.position.set(0, 0.3 * scale, 0);
        dischargeFlange.rotation.x = Math.PI / 2;
        voluteGroup.add(dischargeFlange);

        // 蜗壳凸起筋 (环形加强筋)
        for (var ri = 0; ri < 2; ri++) {
            var rib = new THREE.Mesh(new THREE.TorusGeometry(0.3 * scale, 0.02 * scale, 6, 18), mat(0x555555));
            rib.position.set(0, 0, (ri - 0.5) * 0.08 * scale);
            rib.rotation.x = Math.PI / 2;
            voluteGroup.add(rib);
        }

        voluteGroup.position.set(-0.35 * scale, 0.2 * scale, 0);
        group.add(voluteGroup);

        // 联轴器护罩 (电机和泵之间)
        var couplingGuard = new THREE.Mesh(cyl(0.26 * scale, 0.26 * scale, 0.25 * scale, 16), mat(0x888800, { roughness: 0.4, metalness: 0.4 }));
        couplingGuard.rotation.z = Math.PI / 2;
        couplingGuard.position.set(-0.05 * scale, 0.28 * scale, 0);
        group.add(couplingGuard);

        group.userData = { pivotBase: true };
        return group;
    }

    // ==================== 3. UF 膜架 (垂直竖立膜管) ====================
    function createUFSkid(opts) {
        opts = opts || {};
        var tubeCount = opts.tubeCount || 8;
        var tubeDia = opts.tubeDia || 0.18;
        var tubeHeight = opts.tubeHeight || 3.0;
        var spacing = tubeDia + 0.12;
        var rackW = tubeCount * spacing - 0.12;
        var rackD = 1.0;

        var group = new THREE.Group();

        // 不锈钢框架立柱 (4角)
        var colPositions = [
            [-rackW / 2 - 0.05, 0, -rackD / 2 - 0.05],
            [rackW / 2 + 0.05, 0, -rackD / 2 - 0.05],
            [-rackW / 2 - 0.05, 0, rackD / 2 + 0.05],
            [rackW / 2 + 0.05, 0, rackD / 2 + 0.05]
        ];
        colPositions.forEach(function (cp) {
            var col = new THREE.Mesh(box(0.08, tubeHeight + 0.2, 0.08), SS304());
            col.position.set(cp[0], (tubeHeight + 0.2) / 2, cp[2]);
            col.castShadow = true;
            group.add(col);
        });

        // 框架顶部横梁
        var topBeams = [
            { x: 0, z: -rackD / 2 - 0.05, w: rackW + 0.1 },
            { x: 0, z: rackD / 2 + 0.05, w: rackW + 0.1 },
            { x: -rackW / 2 - 0.05, z: 0, w: rackD + 0.1 },
            { x: rackW / 2 + 0.05, z: 0, w: rackD + 0.1 }
        ];
        topBeams.forEach(function (b) {
            var beam = new THREE.Mesh(box(b.w, 0.08, 0.08), SS304());
            beam.position.set(b.x, tubeHeight + 0.16, b.z);
            beam.castShadow = true;
            group.add(beam);
        });

        // 框架中间横梁
        topBeams.forEach(function (b) {
            var beam = new THREE.Mesh(box(b.w, 0.06, 0.06), SS304());
            beam.position.set(b.x, tubeHeight * 0.5 + 0.1, b.z);
            group.add(beam);
        });

        // 底部框架
        topBeams.forEach(function (b) {
            var beam = new THREE.Mesh(box(b.w, 0.08, 0.08), SS304());
            beam.position.set(b.x, 0.16, b.z);
            beam.castShadow = true;
            group.add(beam);
        });

        // 垂直膜管 (8根, 竖立)
        for (var ti = 0; ti < tubeCount; ti++) {
            var tx = -rackW / 2 + ti * spacing;

            // 膜管主体 (白色PVC)
            var tube = new THREE.Mesh(cyl(tubeDia / 2, tubeDia / 2, tubeHeight, 18), pvcWhite());
            tube.position.set(tx, tubeHeight / 2 + 0.1, 0);
            tube.castShadow = true;
            tube.receiveShadow = true;
            group.add(tube);

            // 顶部连接短管 (连接集水管)
            var topConn = new THREE.Mesh(cyl(0.04, 0.04, 0.2, 8), SS304());
            topConn.position.set(tx, tubeHeight + 0.1, 0);
            group.add(topConn);

            // 底部连接短管
            var botConn = new THREE.Mesh(cyl(0.04, 0.04, 0.2, 8), SS304());
            botConn.position.set(tx, 0.1, 0);
            group.add(botConn);
        }

        // 上部集水管 (水平横管, 连接所有膜管顶部)
        var topManifold = new THREE.Mesh(cyl(0.06, 0.06, rackW + 0.3, 16), SS304());
        topManifold.rotation.z = Math.PI / 2;
        topManifold.position.set(0, tubeHeight + 0.16, 0);
        topManifold.castShadow = true;
        group.add(topManifold);

        // 下部集水管
        var botManifold = new THREE.Mesh(cyl(0.06, 0.06, rackW + 0.3, 16), SS304());
        botManifold.rotation.z = Math.PI / 2;
        botManifold.position.set(0, 0.12, 0);
        botManifold.castShadow = true;
        group.add(botManifold);

        // 前后集水管 (连接上下)
        [-rackD / 2 - 0.05, rackD / 2 + 0.05].forEach(function (mz) {
            var sidePipe = new THREE.Mesh(cyl(0.04, 0.04, tubeHeight, 12), SS304());
            sidePipe.position.set(0, tubeHeight / 2 + 0.1, mz);
            group.add(sidePipe);
        });

        // 进/出水总管接口
        var inletNozzle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 6, 14), flangeSS());
        inletNozzle.position.set(-rackW / 2 - 0.2, 0.12, 0);
        inletNozzle.rotation.y = Math.PI / 2;
        group.add(inletNozzle);
        var outletNozzle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 6, 14), flangeSS());
        outletNozzle.position.set(rackW / 2 + 0.2, tubeHeight + 0.16, 0);
        outletNozzle.rotation.y = Math.PI / 2;
        group.add(outletNozzle);

        // 底座
        var skidBase = new THREE.Mesh(box(rackW + 0.4, 0.1, rackD + 0.4), basePlate());
        skidBase.position.y = 0.05;
        skidBase.receiveShadow = true;
        group.add(skidBase);

        group.userData = { pivotBase: true };
        return group;
    }

    // ==================== 4. RO 膜架 (垂直膜壳, 多层排列, 低矮底座) ====================
    function createROSkid(opts) {
        opts = opts || {};
        var vesselsPerRow = opts.vesselsPerRow || 6;
        var rows = opts.rows || 3;
        var vesselDia = opts.vesselDia || 0.22;
        var vesselHeight = opts.vesselLen || 3.5;  // vertical height
        var vSpacing = vesselDia + 0.18;
        var rowSpacing = vesselDia + 0.22;
        var rackW = vesselsPerRow * vSpacing - 0.18;
        var rackD = rows * rowSpacing - 0.18;
        var baseH = 0.15;

        var group = new THREE.Group();

        // Short corner posts
        var postTop = vesselHeight + 0.2;
        var corners = [[-rackW/2, -rackD/2], [rackW/2, -rackD/2], [-rackW/2, rackD/2], [rackW/2, rackD/2]];
        corners.forEach(function(c) {
            var post = new THREE.Mesh(box(0.08, postTop, 0.08), SS304());
            post.position.set(c[0], postTop/2, c[1]);
            post.castShadow = true; group.add(post);
        });

        // Top cross beams
        [[-rackD/2, rackW+0.1],[rackD/2, rackW+0.1]].forEach(function(b) {
            var beam = new THREE.Mesh(box(b[1], 0.06, 0.06), SS304());
            beam.position.set(0, postTop - 0.05, b[0]);
            beam.castShadow = true; group.add(beam);
        });

        // Bottom cross beams
        [[-rackD/2, rackW+0.1],[rackD/2, rackW+0.1]].forEach(function(b) {
            var beam = new THREE.Mesh(box(b[1], 0.06, 0.06), SS304());
            beam.position.set(0, baseH + 0.1, b[0]);
            beam.castShadow = true; group.add(beam);
        });

        // Row support plates at bottom
        for (var ri = 0; ri < rows; ri++) {
            var rz = -rackD/2 + ri * rowSpacing + rowSpacing/2;
            var plate = new THREE.Mesh(box(rackW + 0.1, 0.04, rowSpacing - 0.1), SS304());
            plate.position.set(0, baseH + 0.08, rz);
            plate.receiveShadow = true; group.add(plate);
        }

        // VERTICAL membrane vessels (6 per row, 3 rows = 18 total)
        for (var ri = 0; ri < rows; ri++) {
            var rz = -rackD/2 + ri * rowSpacing + rowSpacing/2;
            for (var vi = 0; vi < vesselsPerRow; vi++) {
                var vx = -rackW/2 + vi * vSpacing;
                var vy = baseH + vesselHeight/2 + 0.05;

                var vessel = new THREE.Mesh(cyl(vesselDia/2, vesselDia/2, vesselHeight, 18), frpWhite());
                vessel.position.set(vx, vy, rz);
                vessel.castShadow = true; vessel.receiveShadow = true; group.add(vessel);

                // Top blue end cap
                var topCap = new THREE.Mesh(
                    new THREE.SphereGeometry(vesselDia/2+0.015, 16, 8, 0, Math.PI*2, 0, Math.PI/2), blueEndCap());
                topCap.position.set(vx, baseH + vesselHeight + 0.05, rz); group.add(topCap);

                // Bottom blue end cap
                var botCap = topCap.clone();
                botCap.rotation.x = Math.PI;
                botCap.position.y = baseH + 0.05; group.add(botCap);

                // Top connection nipple
                var nip = new THREE.Mesh(cyl(0.04, 0.04, 0.2, 8), SS304());
                nip.position.set(vx, baseH + vesselHeight + 0.15, rz); group.add(nip);
            }
        }

        // Top horizontal manifold (connects all vessels in each row)
        for (var ri = 0; ri < rows; ri++) {
            var rz = -rackD/2 + ri * rowSpacing + rowSpacing/2;
            var manifold = new THREE.Mesh(cyl(0.05, 0.05, rackW + 0.3, 12), SS304());
            manifold.rotation.z = Math.PI / 2;
            manifold.position.set(0, baseH + vesselHeight + 0.15, rz);
            group.add(manifold);
        }

        // Bottom manifold
        for (var ri = 0; ri < rows; ri++) {
            var rz = -rackD/2 + ri * rowSpacing + rowSpacing/2;
            var manifold = new THREE.Mesh(cyl(0.05, 0.05, rackW + 0.3, 12), SS304());
            manifold.rotation.z = Math.PI / 2;
            manifold.position.set(0, baseH + 0.05, rz);
            group.add(manifold);
        }

        // Vertical header pipes connecting rows at both ends
        [-1, 1].forEach(function(sx) {
            var hx = sx * rackW / 2;
            var header = new THREE.Mesh(cyl(0.04, 0.04, vesselHeight + 0.2, 12), SS304());
            header.position.set(hx, baseH + vesselHeight/2 + 0.05, 0); group.add(header);
        });

        // Base platform
        var base = new THREE.Mesh(box(rackW+0.6, 0.1, rackD+0.6), basePlate());
        base.position.y = 0.05; base.receiveShadow = true; group.add(base);

        group.userData = { pivotBase: true, totalHeight: vesselHeight + baseH + 0.3 };
        return group;
    }

    // 导出到全局
    global.FactoryEquipment = {
        createFilterTank: createFilterTank,
        createCentrifugalPump: createCentrifugalPump,
        createUFSkid: createUFSkid,
        createROSkid: createROSkid
    };

})(window);
