(function () {
    if (!window.THREE || !window.SiteCampusLayout) return;

    const layout = window.SiteCampusLayout;
    const container = document.getElementById("canvas-container");
    const labelLayer = document.getElementById("site-label-layer");
    const infoCard = document.getElementById("site-info-card");
    const infoTitle = document.getElementById("site-info-title");
    const infoType = document.getElementById("site-info-type");
    const infoStatus = document.getElementById("site-info-status");
    const infoDesc = document.getElementById("site-info-desc");
    const focusBtn = document.getElementById("site-focus-btn");
    const resetBtn = document.getElementById("site-reset-btn");

    if (!container || !labelLayer) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9e9e8e);
    scene.fog = new THREE.Fog(0xa8a898, 180, 350);

    const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 1000);
    const defaultCamera = {
        position: new THREE.Vector3(0, 115, 128),
        target: new THREE.Vector3(8, 0, 4)
    };
    camera.position.copy(defaultCamera.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 48;
    controls.maxDistance = 220;
    controls.target.copy(defaultCamera.target);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const siteObjects = [];
    const siteLabels = [];
    const clock = new THREE.Clock();
    let renderableBuildings = [];

    let hoveredBuilding = null;
    let selectedBuilding = null;
    let cameraFlight = null;

    let factoryGateDoors = null;
    let factoryTransition = null;

    const ambientLight = new THREE.AmbientLight(0xb7d7ff, 0.34);
    scene.add(ambientLight);

    const hemi = new THREE.HemisphereLight(0xaed8ff, 0x0a1320, 0.72);
    hemi.position.set(0, 120, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xeaf6ff, 1.18);
    sun.position.set(-95, 140, 70);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.00035;
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0x47dfff, 0.34);
    rim.position.set(120, 65, -90);
    scene.add(rim);

    const sunBody = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xfff9e0 })
    );
    sunBody.position.set(-120, 130, 140);
    scene.add(sunBody);

    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createGlowTexture(0xfff5c0, 0.9),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.85
    }));
    sunGlow.scale.set(38, 38, 1);
    sunGlow.position.copy(sunBody.position);
    scene.add(sunGlow);

    const moonBody = new THREE.Mesh(
        new THREE.SphereGeometry(3, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xd8e8f0, visible: false })
    );
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: createGlowTexture(0xaaccff, 0.5),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
        visible: false
    }));
    moonGlow.scale.set(26, 26, 1);

    function createGlowTexture(colorHex, intensity) {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        const c = new THREE.Color(colorHex);
        gradient.addColorStop(0, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, ${intensity})`);
        gradient.addColorStop(0.15, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, ${intensity * 0.7})`);
        gradient.addColorStop(0.4, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, ${intensity * 0.25})`);
        gradient.addColorStop(0.7, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, 0.04)`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    function createGroundTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
        gradient.addColorStop(0, "#3a3830");
        gradient.addColorStop(0.5, "#2d2b24");
        gradient.addColorStop(1, "#1f1e18");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 1024);

        for (let i = 0; i < 110; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const r = 12 + Math.random() * 26;
            ctx.fillStyle = "rgba(180, 160, 120, 0.03)";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2.8, 1.8);
        return texture;
    }

    function createRoadTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#3d3f42";
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 6000; i++) {
            const shade = 42 + Math.random() * 45;
            const r = (shade + (Math.random() - 0.5) * 10) | 0;
            const g = (shade + (Math.random() - 0.5) * 10) | 0;
            const b = (shade + (Math.random() - 0.5) * 8) | 0;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + Math.random() * 0.22})`;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 0.5 + Math.random() * 2.5, 0.5 + Math.random() * 2.5);
        }

        for (let i = 0; i < 800; i++) {
            const shade = 50 + Math.random() * 35;
            ctx.fillStyle = `rgba(${shade | 0}, ${shade | 0}, ${shade | 0}, 0.32)`;
            const size = 1.2 + Math.random() * 4;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
        }

        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = `rgba(28, 28, 28, ${0.03 + Math.random() * 0.05})`;
            ctx.lineWidth = 0.3 + Math.random() * 0.7;
            ctx.beginPath();
            const sx = Math.random() * 512;
            const sy = Math.random() * 512;
            ctx.moveTo(sx, sy);
            const cx = sx + (Math.random() - 0.5) * 50;
            const cy = sy + (Math.random() - 0.5) * 50;
            ctx.quadraticCurveTo(cx, cy, cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2.8, 2.8);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        return texture;
    }

    let cachedRoadTexture = null;

    function getRoadTexture() {
        if (cachedRoadTexture) return cachedRoadTexture;
        cachedRoadTexture = createRoadTexture();
        return cachedRoadTexture;
    }

    function createRoadMaterial(color) {
        const base = new THREE.Color(color).lerp(new THREE.Color(0x4e5257), 0.68);
        return new THREE.MeshStandardMaterial({
            color: base,
            map: getRoadTexture(),
            roughness: 0.85,
            metalness: 0.05,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -2
        });
    }

    function createCampusBase() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(layout.world.width, layout.world.depth),
            new THREE.MeshStandardMaterial({
                map: createGroundTexture(),
                color: 0x2d2b24,
                roughness: 0.98,
                metalness: 0.0,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.renderOrder = 0;
        scene.add(ground);

        const border = new THREE.Mesh(
            new THREE.BoxGeometry(layout.world.width + 6, 2.5, layout.world.depth + 6),
            new THREE.MeshStandardMaterial({
                color: 0x1f1e18,
                roughness: 1
            })
        );
        border.position.y = -1.28;
        border.receiveShadow = true;
        scene.add(border);

        if (layout.mapOverlay && layout.mapOverlay.show) {
            const loader = new THREE.TextureLoader();
            loader.load(
                layout.mapOverlay.image,
                function (texture) {
                    texture.minFilter = THREE.LinearFilter;
                    const overlay = new THREE.Mesh(
                        new THREE.PlaneGeometry(layout.mapOverlay.width, layout.mapOverlay.depth),
                        new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true,
                            opacity: layout.mapOverlay.opacity,
                            depthWrite: false,
                            polygonOffset: true,
                            polygonOffsetFactor: 1,
                            polygonOffsetUnits: 3
                        })
                    );
                    overlay.rotation.x = -Math.PI / 2;
                    overlay.position.y = layout.mapOverlay.y;
                    overlay.renderOrder = 1;
                    scene.add(overlay);
                },
                undefined,
                function () {
                    // Ignore optional overlay loading errors.
                }
            );
        }
    }

    function createRoads() {
        layout.roads.forEach((road) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(road.size.w, 0.16, road.size.d),
                createRoadMaterial(road.color)
            );
            mesh.position.set(road.position.x, 0.1, road.position.z);
            mesh.receiveShadow = true;
            mesh.renderOrder = 2;
            scene.add(mesh);
        });
    }

    function createYards() {
        if (!layout.yards) return;
        layout.yards.forEach((yard) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(yard.size.w, 0.05, yard.size.d),
                new THREE.MeshStandardMaterial({
                    color: yard.color,
                    roughness: 0.96,
                    metalness: 0.0,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -3
                })
            );
            mesh.position.set(yard.position.x, 0.04, yard.position.z);
            mesh.receiveShadow = true;
            mesh.renderOrder = 2;
            scene.add(mesh);
        });
    }

    function createStylizedTree(x, z, variant) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.13, 0.22, 1.55, 8),
            new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 1 })
        );
        trunk.position.set(x, 0.86, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const palette = variant === "light" ? [0x3d7d48, 0x4b8b55, 0x5a9a60] : [0x1f5b33, 0x2c6b3d, 0x2b5633];
        const crownGroup = new THREE.Group();
        crownGroup.position.set(x, 2.15, z);

        const crownParts = [
            { geo: new THREE.ConeGeometry(1.18, 1.72, 10), y: 0.38, s: 1 },
            { geo: new THREE.SphereGeometry(0.82, 10, 10), x: -0.48, y: 0.22, z: 0.12, s: 1 },
            { geo: new THREE.SphereGeometry(0.72, 10, 10), x: 0.5, y: 0.28, z: -0.1, s: 1 },
            { geo: new THREE.SphereGeometry(0.66, 10, 10), x: 0.08, y: 0.72, z: 0.24, s: 1 }
        ];

        crownParts.forEach((part, index) => {
            const mesh = new THREE.Mesh(
                part.geo,
                new THREE.MeshStandardMaterial({
                    color: palette[index % palette.length],
                    roughness: 1,
                    metalness: 0
                })
            );
            mesh.position.set(part.x || 0, part.y || 0, part.z || 0);
            mesh.scale.multiplyScalar(part.s || 1);
            crownGroup.add(mesh);
        });
        scene.add(crownGroup);
    }

    function createGreenZones() {
        layout.greens.forEach((zone) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(zone.size.w, 0.08, zone.size.d),
                new THREE.MeshStandardMaterial({
                    color: zone.color,
                    roughness: 1,
                    metalness: 0,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -4
                })
            );
            mesh.position.set(zone.position.x, 0.05, zone.position.z);
            mesh.receiveShadow = true;
            mesh.renderOrder = 2;
            scene.add(mesh);

            const treeCount = zone.treeCount || 18;
            for (let i = 0; i < treeCount; i++) {
                const px = zone.position.x + (Math.random() - 0.5) * (zone.size.w - 3);
                const pz = zone.position.z + (Math.random() - 0.5) * (zone.size.d - 3);
                createStylizedTree(px, pz, i % 4 === 0 ? "light" : "dark");
            }

            const shrubCount = Math.max(8, Math.round(treeCount * 0.55));
            for (let i = 0; i < shrubCount; i++) {
                const shrub = new THREE.Mesh(
                    new THREE.SphereGeometry(0.62 + Math.random() * 0.34, 9, 9),
                    new THREE.MeshStandardMaterial({
                        color: i % 3 === 0 ? 0x2f6e3f : 0x345d37,
                        roughness: 1,
                        metalness: 0
                    })
                );
                shrub.position.set(
                    zone.position.x + (Math.random() - 0.5) * (zone.size.w - 2),
                    0.35,
                    zone.position.z + (Math.random() - 0.5) * (zone.size.d - 2)
                );
                scene.add(shrub);
            }
        });
    }

    function createTreeBelts() {
        if (!layout.treeBelts) return;
        layout.treeBelts.forEach((belt) => {
            for (let i = 0; i < belt.count; i++) {
                const t = belt.count === 1 ? 0 : i / (belt.count - 1);
                const px = belt.start.x + (belt.end.x - belt.start.x) * t + (Math.random() - 0.5) * belt.width;
                const pz = belt.start.z + (belt.end.z - belt.start.z) * t + (Math.random() - 0.5) * belt.width;
                createStylizedTree(px, pz, i % 5 === 0 ? "light" : "dark");
            }
        });
    }

    function createTanks() {
        layout.tanks.forEach((tank) => {
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(tank.radius, tank.radius, tank.height, 36),
                new THREE.MeshStandardMaterial({
                    color: tank.color,
                    roughness: 0.72,
                    metalness: 0.18
                })
            );
            base.position.set(tank.position.x, tank.height / 2, tank.position.z);
            base.castShadow = true;
            base.receiveShadow = true;
            scene.add(base);

            const rimMesh = new THREE.Mesh(
                new THREE.TorusGeometry(tank.radius * 0.94, 0.18, 12, 60),
                new THREE.MeshStandardMaterial({
                    color: 0x8ed7ff,
                    emissive: 0x0a455e,
                    roughness: 0.38,
                    metalness: 0.42
                })
            );
            rimMesh.rotation.x = Math.PI / 2;
            rimMesh.position.set(tank.position.x, tank.height + 0.04, tank.position.z);
            scene.add(rimMesh);

            const water = new THREE.Mesh(
                new THREE.CircleGeometry(tank.radius * 0.9, 36),
                new THREE.MeshStandardMaterial({
                    color: 0x264d5c,
                    emissive: 0x0f2d37,
                    roughness: 0.24,
                    metalness: 0.08,
                    transparent: true,
                    opacity: 0.92
                })
            );
            water.rotation.x = -Math.PI / 2;
            water.position.set(tank.position.x, tank.height - 0.08, tank.position.z);
            scene.add(water);

            const bridge = new THREE.Mesh(
                new THREE.BoxGeometry(tank.radius * 1.9, 0.16, 0.52),
                new THREE.MeshStandardMaterial({
                    color: 0xd5dee4,
                    roughness: 0.55,
                    metalness: 0.22
                })
            );
            bridge.position.set(tank.position.x, tank.height + 0.2, tank.position.z);
            scene.add(bridge);

            const postMaterial = new THREE.MeshStandardMaterial({ color: 0xc9d4db, roughness: 0.62, metalness: 0.18 });
            const bridgePostA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, tank.height + 0.25, 8), postMaterial);
            bridgePostA.position.set(tank.position.x - tank.radius * 0.78, (tank.height + 0.25) / 2, tank.position.z);
            scene.add(bridgePostA);

            const bridgePostB = bridgePostA.clone();
            bridgePostB.position.x = tank.position.x + tank.radius * 0.78;
            scene.add(bridgePostB);

            for (let i = 0; i < 6; i++) {
                const arm = new THREE.Mesh(
                    new THREE.BoxGeometry(tank.radius * 0.88, 0.08, 0.12),
                    new THREE.MeshStandardMaterial({
                        color: 0xc2ced6,
                        roughness: 0.62,
                        metalness: 0.18
                    })
                );
                arm.position.set(tank.position.x, tank.height + 0.14, tank.position.z);
                arm.rotation.y = (Math.PI / 6) + i * (Math.PI / 3);
                scene.add(arm);
            }
        });
    }

    function makeBuildingMaterial(color, accent) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.93,
            metalness: 0.05,
            emissive: accent ? new THREE.Color(accent).multiplyScalar(0.028) : new THREE.Color(0x000000)
        });
    }

    function createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const brickW = 42, brickH = 18, mortar = 2.5;
        ctx.fillStyle = '#c0aa90'; ctx.fillRect(0, 0, 256, 128);

        for (let row = 0; row < 8; row++) {
            const ox = (row % 2) * (brickW / 2);
            for (let col = 0; col < 8; col++) {
                const x = col * (brickW + mortar) - brickW / 2 + ox;
                const y = row * (brickH + mortar);
                const r = 170 + Math.floor((col * 13 + row * 7) % 35);
                const g = 90 + Math.floor((col * 7 + row * 13) % 25);
                const b = 48 + Math.floor((col * 17 + row * 11) % 22);
                ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                ctx.fillRect(x + mortar / 2, y + mortar / 2, brickW - mortar, brickH - mortar);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        return tex;
    }

    const brickTexture = createBrickTexture();
    const brickBuildings = { 'pure-water-station': true, 'pure-water-preparation': true };

    function makeBrickWallMaterial(part, wallColor, accent) {
        const tex = brickTexture.clone();
        tex.repeat.set(part.w / 5, part.h / 4);
        tex.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
            map: tex,
            color: new THREE.Color(wallColor),
            roughness: 0.82,
            metalness: 0.03,
            emissive: accent ? new THREE.Color(accent).multiplyScalar(0.05) : new THREE.Color(0x000000)
        });
    }

    function addBrickMortarLines(group, part, wallColor) {
        const mortarColor = new THREE.Color(wallColor).multiplyScalar(0.65);
        const brickH = 0.25, gap = 0.04;
        const rows = Math.floor(part.h / (brickH + gap));
        const lineMat = new THREE.MeshStandardMaterial({
            color: mortarColor,
            roughness: 0.95,
            metalness: 0.02
        });

        for (let i = 0; i <= rows; i++) {
            const y = i * (brickH + gap);
            if (y >= part.h) break;
            const hLine = new THREE.Mesh(new THREE.BoxGeometry(part.w * 0.99, gap * 0.6, 0.015), lineMat);
            hLine.position.set(part.x, y + gap / 2, part.z + part.d / 2 + 0.01);
            group.add(hLine);
            const hLineB = hLine.clone();
            hLineB.position.z = part.z - part.d / 2 - 0.01;
            group.add(hLineB);
        }
    }

    function mixColors(a, b, factor) {
        return new THREE.Color(a).lerp(new THREE.Color(b), factor);
    }

    function getBuildingStyleProfile(building) {
        const type = (building.type || "") + " " + (building.name || "");
        if (/池|池体构筑物|调节池|隔油池/.test(type)) {
            return {
                family: "basin",
                windowOpacity: 0,
                windowTint: 0x90c4d8,
                wallBase: 0x688088,
                wallAccent: 0x88a0a8,
                roofBase: 0x486068,
                roofAccent: 0x688088,
                plinthColor: 0x506870,
                corniceColor: 0xc0d0d8,
                equipmentColor: 0xa8bcc4,
                frameColor: 0x708890,
                detailColor: 0xd0dde4,
                waterColor: 0x1a3a48,
                addEntrance: false,
                addRoofRail: true
            };
        }
        if (/办公|研究|楼|宿舍|礼堂/.test(type)) {
            return {
                family: "office",
                windowOpacity: 0.55,
                windowTint: 0x88b8d4,
                wallBase: 0xb89578,
                wallAccent: 0xd4bc9c,
                roofBase: 0x7a5040,
                roofAccent: 0xa07058,
                plinthColor: 0x7a6050,
                corniceColor: 0xe8dac8,
                equipmentColor: 0xc4b098,
                frameColor: 0x6b5040,
                detailColor: 0xe0d4c0,
                addEntrance: true,
                addRoofRail: false
            };
        }
        if (/站|泵房|风机房|处理|制备/.test(type)) {
            return {
                family: "utility",
                windowOpacity: 0.28,
                windowTint: 0x90c0d4,
                wallBase: 0x6e8088,
                wallAccent: 0x8ea0a8,
                roofBase: 0x485860,
                roofAccent: 0x687a82,
                plinthColor: 0x506068,
                corniceColor: 0xb8c8d0,
                equipmentColor: 0xa0b4bc,
                frameColor: 0x5a6a72,
                detailColor: 0xc8d8e0,
                addEntrance: true,
                addRoofRail: true
            };
        }
        return {
            family: "factory",
            windowOpacity: 0.35,
            windowTint: 0xa0c8dc,
            wallBase: 0x889098,
            wallAccent: 0xa8b0b8,
            roofBase: 0x505560,
            roofAccent: 0x707880,
            plinthColor: 0x5a6068,
            corniceColor: 0xc8d0d8,
            equipmentColor: 0xb8c0c8,
            frameColor: 0x556068,
            detailColor: 0xd8e0e8,
            addEntrance: false,
            addRoofRail: true
        };
    }

    function addRoofGlow(group, width, depth, accent) {
        const glow = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.12, depth),
            new THREE.MeshBasicMaterial({
                color: accent,
                transparent: true,
                opacity: 0.12
            })
        );
        glow.position.y = 0.15;
        group.add(glow);
    }

    function getFootprintBounds(footprints) {
        let minX = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxZ = -Infinity;
        footprints.forEach((part) => {
            minX = Math.min(minX, part.x - part.w / 2);
            maxX = Math.max(maxX, part.x + part.w / 2);
            minZ = Math.min(minZ, part.z - part.d / 2);
            maxZ = Math.max(maxZ, part.z + part.d / 2);
        });
        return {
            minX: minX,
            maxX: maxX,
            minZ: minZ,
            maxZ: maxZ,
            width: maxX - minX,
            depth: maxZ - minZ
        };
    }

    function getWorldBounds(building) {
        const bounds = getFootprintBounds(building.footprints);
        return {
            minX: building.position.x + bounds.minX - 4,
            maxX: building.position.x + bounds.maxX + 4,
            minZ: building.position.z + bounds.minZ - 4,
            maxZ: building.position.z + bounds.maxZ + 4
        };
    }

    function boundsOverlap(a, b) {
        return !(a.maxX < b.minX || a.minX > b.maxX || a.maxZ < b.minZ || a.minZ > b.maxZ);
    }

    function overlapArea(a, b) {
        const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
        const depth = Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
        return width * depth;
    }

    function createFacadeDetailMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.78,
            metalness: 0.12
        });
    }

    function addLinearFrames(group, part, style) {
        const longSide = part.w >= part.d;
        const frameCount = Math.max(2, Math.round((longSide ? part.w : part.d) / 5.5));
        for (let i = 0; i < frameCount; i++) {
            const offset = ((i + 0.5) / frameCount - 0.5) * (longSide ? part.w * 0.82 : part.d * 0.82);
            const frame = new THREE.Mesh(
                new THREE.BoxGeometry(longSide ? 0.16 : 0.22, Math.max(2.8, part.h * 0.9), longSide ? 0.22 : 0.16),
                createFacadeDetailMaterial(style.frameColor)
            );
            if (longSide) {
                frame.position.set(part.x + offset, Math.max(2.8, part.h * 0.9) / 2, part.z + part.d / 2 + 0.14);
            } else {
                frame.position.set(part.x + part.w / 2 + 0.14, Math.max(2.8, part.h * 0.9) / 2, part.z + offset);
            }
            group.add(frame);

            const frameMirror = frame.clone();
            if (longSide) frameMirror.position.z = part.z - part.d / 2 - 0.14;
            else frameMirror.position.x = part.x - part.w / 2 - 0.14;
            group.add(frameMirror);
        }
    }

    function addWindowRows(group, part, style) {
        if (style.family === "basin") return;
        const longSide = part.w >= part.d;
        const windowCount = style.family === "office"
            ? Math.max(3, Math.min(10, Math.round((longSide ? part.w : part.d) / 2.9)))
            : Math.max(2, Math.min(7, Math.round((longSide ? part.w : part.d) / 4.6)));
        const rowCount = style.family === "office" ? Math.max(2, Math.min(3, Math.round(part.h / 3.4))) : 1;
        const isOffice = style.family === "office";
        const winW = isOffice ? 1.05 : 1.1;
        const winH = Math.max(0.82, part.h * 0.11);

        for (let row = 0; row < rowCount; row++) {
            const y = rowCount === 1
                ? Math.max(1.6, part.h * 0.56)
                : Math.max(1.55, part.h * (0.34 + row * 0.24));
            for (let i = 0; i < windowCount; i++) {
                const offset = ((i + 0.5) / windowCount - 0.5) * (longSide ? part.w * 0.74 : part.d * 0.74);

                if (isOffice) {
                    const paneFrame = new THREE.Mesh(
                        new THREE.BoxGeometry(winW + 0.12, winH + 0.12, 0.06),
                        new THREE.MeshStandardMaterial({ color: style.frameColor, roughness: 0.4, metalness: 0.2 })
                    );
                    const paneGlass = new THREE.Mesh(
                        new THREE.PlaneGeometry(winW - 0.1, winH - 0.1),
                        new THREE.MeshBasicMaterial({ color: style.windowTint, transparent: true, opacity: style.windowOpacity })
                    );
                    const sill = new THREE.Mesh(
                        new THREE.BoxGeometry(winW + 0.18, 0.08, 0.12),
                        new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.55, metalness: 0.1 })
                    );

                    if (longSide) {
                        paneFrame.position.set(part.x + offset, y, part.z + part.d / 2 + 0.1);
                        paneGlass.position.set(part.x + offset, y, part.z + part.d / 2 + 0.14);
                        sill.position.set(part.x + offset, y - winH / 2 - 0.04, part.z + part.d / 2 + 0.08);

                        const frameB = paneFrame.clone();
                        const glassB = paneGlass.clone();
                        const sillB = sill.clone();
                        frameB.position.z = part.z - part.d / 2 - 0.1;
                        glassB.position.z = part.z - part.d / 2 - 0.14;
                        glassB.rotation.y = Math.PI;
                        sillB.position.z = part.z - part.d / 2 - 0.08;
                        group.add(frameB);
                        group.add(glassB);
                        group.add(sillB);
                    } else {
                        paneFrame.position.set(part.x + part.w / 2 + 0.1, y, part.z + offset);
                        paneGlass.position.set(part.x + part.w / 2 + 0.14, y, part.z + offset);
                        paneGlass.rotation.y = Math.PI / 2;
                        sill.position.set(part.x + part.w / 2 + 0.08, y - winH / 2 - 0.04, part.z + offset);

                        const frameB = paneFrame.clone();
                        const glassB = paneGlass.clone();
                        const sillB = sill.clone();
                        frameB.position.x = part.x - part.w / 2 - 0.1;
                        glassB.position.x = part.x - part.w / 2 - 0.14;
                        glassB.rotation.y = -Math.PI / 2;
                        sillB.position.x = part.x - part.w / 2 - 0.08;
                        group.add(frameB);
                        group.add(glassB);
                        group.add(sillB);
                    }
                    group.add(paneFrame);
                    group.add(paneGlass);
                    group.add(sill);
                } else {
                    const paneMatA = new THREE.MeshBasicMaterial({
                        color: style.windowTint,
                        transparent: true,
                        opacity: style.windowOpacity
                    });
                    const paneMatB = paneMatA.clone();
                    const paneGeo = new THREE.PlaneGeometry(winW, winH);
                    const paneA = new THREE.Mesh(paneGeo, paneMatA);
                    const paneB = new THREE.Mesh(paneGeo, paneMatB);

                    if (longSide) {
                        paneA.position.set(part.x + offset, y, part.z + part.d / 2 + 0.07);
                        paneB.position.set(part.x + offset, y, part.z - part.d / 2 - 0.07);
                        paneB.rotation.y = Math.PI;
                    } else {
                        paneA.position.set(part.x + part.w / 2 + 0.07, y, part.z + offset);
                        paneB.position.set(part.x - part.w / 2 - 0.07, y, part.z + offset);
                        paneA.rotation.y = Math.PI / 2;
                        paneB.rotation.y = -Math.PI / 2;
                    }
                    group.add(paneA);
                    group.add(paneB);
                }
            }
        }
    }

    function addOfficeRoof(group, part, style, roofColor, accentColor) {
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.96, 0.36, part.d * 0.96),
            new THREE.MeshStandardMaterial({
                color: roofColor,
                roughness: 0.72,
                metalness: 0.1,
                emissive: new THREE.Color(accentColor).multiplyScalar(0.08)
            })
        );
        slab.position.set(part.x, part.h + 0.2, part.z);
        slab.castShadow = true;
        group.add(slab);

        const parapetMat = new THREE.MeshStandardMaterial({ color: style.corniceColor, roughness: 0.55, metalness: 0.08 });
        const parapetN = new THREE.Mesh(new THREE.BoxGeometry(part.w * 0.96, 0.55, 0.15), parapetMat);
        parapetN.position.set(part.x, part.h + 0.62, part.z - part.d * 0.48);
        group.add(parapetN);
        const parapetS = new THREE.Mesh(new THREE.BoxGeometry(part.w * 0.96, 0.55, 0.15), parapetMat);
        parapetS.position.set(part.x, part.h + 0.62, part.z + part.d * 0.48);
        group.add(parapetS);
        const parapetE = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, part.d * 0.96), parapetMat);
        parapetE.position.set(part.x + part.w * 0.48, part.h + 0.62, part.z);
        group.add(parapetE);
        const parapetW = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, part.d * 0.96), parapetMat);
        parapetW.position.set(part.x - part.w * 0.48, part.h + 0.62, part.z);
        group.add(parapetW);

        const crown = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.82, 0.22, part.d * 0.22),
            createFacadeDetailMaterial(style.detailColor)
        );
        crown.position.set(part.x, part.h + 0.46, part.z - part.d * 0.18);
        group.add(crown);

        const roofRoom = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(2.4, part.w * 0.22), Math.max(1.5, part.h * 0.16), Math.max(2.2, part.d * 0.2)),
            makeBuildingMaterial(mixColors(style.wallBase, style.wallAccent, 0.48), accentColor)
        );
        roofRoom.position.set(part.x - part.w * 0.18, part.h + 0.95, part.z + part.d * 0.04);
        roofRoom.castShadow = true;
        roofRoom.receiveShadow = true;
        group.add(roofRoom);

        const acUnit = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 1.1, 2.8),
            new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.45, metalness: 0.25 })
        );
        acUnit.position.set(part.x + part.w * 0.2, part.h + 1.18, part.z - part.d * 0.12);
        acUnit.castShadow = true;
        group.add(acUnit);

        const acGrille = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.15, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x5a5a55, roughness: 0.3, metalness: 0.4 })
        );
        acGrille.position.set(part.x + part.w * 0.2, part.h + 1.65, part.z - part.d * 0.12 + 1.35);
        group.add(acGrille);

        const screen = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.78, 0.14, 0.14),
            createFacadeDetailMaterial(style.frameColor)
        );
        screen.position.set(part.x, part.h + 0.78, part.z + part.d * 0.32);
        group.add(screen);

        addRoofGlow(slab, part.w * 0.88, part.d * 0.88, accentColor);
        return part.h + 2.0;
    }

    function addFactoryRoof(group, part, style, roofColor, accentColor) {
        const roofBase = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.98, 0.16, part.d * 0.98),
            new THREE.MeshStandardMaterial({
                color: mixColors(roofColor, style.roofAccent, 0.24),
                roughness: 0.68,
                metalness: 0.18,
                emissive: new THREE.Color(accentColor).multiplyScalar(0.05)
            })
        );
        roofBase.position.set(part.x, part.h + 0.12, part.z);
        roofBase.castShadow = true;
        group.add(roofBase);

        const longSide = part.w >= part.d;
        const moduleSpan = longSide ? part.d : part.w;
        const moduleCount = Math.max(2, Math.round(moduleSpan / 4.8));
        const spacing = moduleSpan / moduleCount;
        let peak = part.h + 0.12;

        for (let i = 0; i < moduleCount; i++) {
            const offset = ((i + 0.5) / moduleCount - 0.5) * (moduleSpan * 0.88);
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(
                    longSide ? part.w * 0.92 : spacing * 0.84,
                    0.16,
                    longSide ? spacing * 0.84 : part.d * 0.92
                ),
                new THREE.MeshStandardMaterial({
                    color: mixColors(roofColor, style.roofAccent, 0.08 + i * 0.04),
                    roughness: 0.56,
                    metalness: 0.24
                })
            );
            if (longSide) {
                panel.position.set(part.x, part.h + 0.66, part.z + offset);
                panel.rotation.x = -0.38;
            } else {
                panel.position.set(part.x + offset, part.h + 0.66, part.z);
                panel.rotation.z = 0.38;
            }
            panel.castShadow = true;
            group.add(panel);

            const clerestory = new THREE.Mesh(
                new THREE.BoxGeometry(
                    longSide ? part.w * 0.88 : 0.2,
                    0.54,
                    longSide ? 0.2 : part.d * 0.88
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xb9d9e8,
                    emissive: 0x1b4559,
                    roughness: 0.3,
                    metalness: 0.12,
                    transparent: true,
                    opacity: 0.84
                })
            );
            if (longSide) {
                clerestory.position.set(part.x, part.h + 0.92, part.z + offset - spacing * 0.16);
            } else {
                clerestory.position.set(part.x + offset + spacing * 0.16, part.h + 0.92, part.z);
            }
            group.add(clerestory);
            peak = Math.max(peak, part.h + 1.08);
        }

        const ventCount = Math.max(1, Math.round((longSide ? part.w : part.d) / 10));
        for (let i = 0; i < ventCount; i++) {
            const ventX = part.x + ((i + 0.5) / ventCount - 0.5) * ((longSide ? part.w : part.d) * 0.7);
            const ventBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x889095, roughness: 0.4, metalness: 0.35 })
            );
            ventBody.position.set(longSide ? ventX : part.x, part.h + 1.1, longSide ? part.z : ventX);
            ventBody.castShadow = true;
            group.add(ventBody);

            const ventCap = new THREE.Mesh(
                new THREE.ConeGeometry(0.4, 0.3, 8),
                new THREE.MeshStandardMaterial({ color: 0x667075, roughness: 0.35, metalness: 0.4 })
            );
            ventCap.position.set(longSide ? ventX : part.x, part.h + 1.75, longSide ? part.z : ventX);
            group.add(ventCap);
            peak = Math.max(peak, part.h + 1.9);
        }

        const eave = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.96, 0.08, 0.18),
            createFacadeDetailMaterial(style.detailColor)
        );
        eave.position.set(part.x, part.h + 0.28, part.z + part.d / 2 + 0.08);
        group.add(eave);

        const eaveBack = eave.clone();
        eaveBack.position.z = part.z - part.d / 2 - 0.08;
        group.add(eaveBack);

        addRoofGlow(roofBase, part.w * 0.9, part.d * 0.9, accentColor);
        return peak;
    }

    function addUtilityRoof(group, part, style, roofColor, accentColor) {
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(part.w * 0.98, 0.24, part.d * 0.98),
            new THREE.MeshStandardMaterial({
                color: roofColor,
                roughness: 0.7,
                metalness: 0.16,
                emissive: new THREE.Color(accentColor).multiplyScalar(0.06)
            })
        );
        slab.position.set(part.x, part.h + 0.16, part.z);
        slab.castShadow = true;
        group.add(slab);

        const longSide = part.w >= part.d;
        const monitor = new THREE.Mesh(
            new THREE.BoxGeometry(
                longSide ? part.w * 0.62 : Math.max(2.4, part.w * 0.24),
                0.62,
                longSide ? Math.max(2.6, part.d * 0.28) : part.d * 0.62
            ),
            new THREE.MeshStandardMaterial({
                color: mixColors(roofColor, style.roofAccent, 0.28),
                roughness: 0.62,
                metalness: 0.18
            })
        );
        monitor.position.set(part.x, part.h + 0.56, part.z);
        monitor.castShadow = true;
        group.add(monitor);

        for (let i = 0; i < 2; i++) {
            const duct = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.18, longSide ? part.w * 0.52 : part.d * 0.52, 10),
                new THREE.MeshStandardMaterial({
                    color: style.equipmentColor,
                    roughness: 0.48,
                    metalness: 0.26
                })
            );
            if (longSide) {
                duct.rotation.z = Math.PI / 2;
                duct.position.set(part.x, part.h + 1.02, part.z + (i === 0 ? -part.d * 0.16 : part.d * 0.16));
            } else {
                duct.rotation.x = Math.PI / 2;
                duct.position.set(part.x + (i === 0 ? -part.w * 0.16 : part.w * 0.16), part.h + 1.02, part.z);
            }
            group.add(duct);
        }

        addRoofGlow(slab, part.w * 0.86, part.d * 0.86, accentColor);
        return part.h + 1.12;
    }

    function addBasinStructure(group, part, style) {
        const wallThickness = Math.max(0.45, Math.min(part.w, part.d) * 0.08);
        const basinHeight = Math.max(1.3, Math.min(part.h, 2.6));
        const wallMaterial = makeBuildingMaterial(mixColors(style.wallBase, style.wallAccent, 0.2), 0x4fcfff);
        const topMaterial = createFacadeDetailMaterial(style.corniceColor);

        const northWall = new THREE.Mesh(new THREE.BoxGeometry(part.w, basinHeight, wallThickness), wallMaterial);
        northWall.position.set(part.x, basinHeight / 2, part.z - part.d / 2 + wallThickness / 2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        group.add(northWall);

        const southWall = northWall.clone();
        southWall.position.z = part.z + part.d / 2 - wallThickness / 2;
        group.add(southWall);

        const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, basinHeight, part.d - wallThickness * 2), wallMaterial);
        eastWall.position.set(part.x + part.w / 2 - wallThickness / 2, basinHeight / 2, part.z);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        group.add(eastWall);

        const westWall = eastWall.clone();
        westWall.position.x = part.x - part.w / 2 + wallThickness / 2;
        group.add(westWall);

        const capNorth = new THREE.Mesh(new THREE.BoxGeometry(part.w, 0.14, wallThickness + 0.04), topMaterial);
        capNorth.position.set(part.x, basinHeight + 0.06, northWall.position.z);
        group.add(capNorth);

        const capSouth = capNorth.clone();
        capSouth.position.z = southWall.position.z;
        group.add(capSouth);

        const capEast = new THREE.Mesh(new THREE.BoxGeometry(wallThickness + 0.04, 0.14, part.d - wallThickness * 2), topMaterial);
        capEast.position.set(eastWall.position.x, basinHeight + 0.06, part.z);
        group.add(capEast);

        const capWest = capEast.clone();
        capWest.position.x = westWall.position.x;
        group.add(capWest);

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(part.w - wallThickness * 2, 0.08, part.d - wallThickness * 2),
            new THREE.MeshStandardMaterial({
                color: 0x52666e,
                roughness: 0.94,
                metalness: 0.02
            })
        );
        floor.position.set(part.x, 0.04, part.z);
        floor.receiveShadow = true;
        group.add(floor);

        const water = new THREE.Mesh(
            new THREE.PlaneGeometry(part.w - wallThickness * 2.3, part.d - wallThickness * 2.3),
            new THREE.MeshStandardMaterial({
                color: style.waterColor,
                emissive: 0x123944,
                roughness: 0.18,
                metalness: 0.04,
                transparent: true,
                opacity: 0.94
            })
        );
        water.rotation.x = -Math.PI / 2;
        water.position.set(part.x, basinHeight - 0.2, part.z);
        group.add(water);

        const walkwayWidth = Math.max(0.55, Math.min(part.w, part.d) * 0.09);
        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(part.w - wallThickness * 2.8, 0.12, walkwayWidth),
            new THREE.MeshStandardMaterial({
                color: style.detailColor,
                roughness: 0.58,
                metalness: 0.18
            })
        );
        bridge.position.set(part.x, basinHeight + 0.2, part.z);
        group.add(bridge);

        for (let i = 0; i < 2; i++) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(part.w - wallThickness * 2.6, 0.08, 0.08),
                createFacadeDetailMaterial(style.frameColor)
            );
            rail.position.set(part.x, basinHeight + 0.5, part.z + (i === 0 ? -walkwayWidth * 0.54 : walkwayWidth * 0.54));
            group.add(rail);
        }

        const postCount = Math.max(3, Math.round(part.w / 4.8));
        for (let i = 0; i < postCount; i++) {
            const offset = ((i + 0.5) / postCount - 0.5) * (part.w - wallThickness * 3.2);
            const postA = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.32, 0.08),
                createFacadeDetailMaterial(style.frameColor)
            );
            postA.position.set(part.x + offset, basinHeight + 0.34, part.z - walkwayWidth * 0.54);
            group.add(postA);

            const postB = postA.clone();
            postB.position.z = part.z + walkwayWidth * 0.54;
            group.add(postB);
        }
        return basinHeight + 0.55;
    }

    function addEntranceVolume(group, part, style) {
        const entranceW = Math.max(2.8, part.w * 0.18);
        const entranceH = Math.max(2.3, part.h * 0.24);
        const isOffice = style.family === "office";

        if (isOffice) {
            const colMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c8, roughness: 0.45, metalness: 0.12 });
            const leftCol = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, entranceH - 0.3, 12), colMat);
            leftCol.position.set(part.x - entranceW / 2 + 0.4, (entranceH - 0.3) / 2, part.z + part.d / 2 + 0.4);
            group.add(leftCol);
            const rightCol = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, entranceH - 0.3, 12), colMat);
            rightCol.position.set(part.x + entranceW / 2 - 0.4, (entranceH - 0.3) / 2, part.z + part.d / 2 + 0.4);
            group.add(rightCol);

            const stepMat = new THREE.MeshStandardMaterial({ color: 0x888078, roughness: 0.7, metalness: 0.05 });
            for (let s = 0; s < 3; s++) {
                const step = new THREE.Mesh(
                    new THREE.BoxGeometry(entranceW - 0.3, 0.1, 0.35),
                    stepMat
                );
                step.position.set(part.x, 0.08 + s * 0.1, part.z + part.d / 2 + 0.2 + s * 0.35);
                group.add(step);
            }
        }

        const entrance = new THREE.Mesh(
            new THREE.BoxGeometry(entranceW, entranceH, 1),
            new THREE.MeshStandardMaterial({
                color: isOffice ? 0x5a4a3a : 0x4a5058,
                roughness: 0.66,
                metalness: 0.14
            })
        );
        entrance.position.set(part.x, Math.max(1.15, part.h * 0.13), part.z + part.d / 2 + 0.52);
        group.add(entrance);

        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(entranceW + 1.2, 0.15, 2.2),
            new THREE.MeshStandardMaterial({
                color: style.detailColor,
                roughness: 0.54,
                metalness: 0.12
            })
        );
        canopy.position.set(part.x, isOffice ? entranceH + 0.25 : Math.max(2.45, part.h * 0.24), part.z + part.d / 2 + 1.1);
        group.add(canopy);
    }

    function buildMainGate(group, building) {
        const p = building.footprints[0];
        const gateSpan = 8;
        const pillarW = 0.8, pillarD = 0.8, pillarH = 5.5;
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8a898, roughness: 0.75, metalness: 0.05 });
        const darkerStone = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.7, metalness: 0.08 });

        const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, pillarD), stoneMat);
        leftPillar.position.set(0, pillarH / 2, -gateSpan / 2);
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        group.add(leftPillar);

        const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(pillarW, pillarH, pillarD), stoneMat);
        rightPillar.position.set(0, pillarH / 2, gateSpan / 2);
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        group.add(rightPillar);

        const pillarCapLeft = new THREE.Mesh(new THREE.BoxGeometry(pillarW + 0.2, 0.3, pillarD + 0.2), darkerStone);
        pillarCapLeft.position.set(0, pillarH + 0.15, -gateSpan / 2);
        pillarCapLeft.castShadow = true;
        group.add(pillarCapLeft);

        const pillarCapRight = pillarCapLeft.clone();
        pillarCapRight.position.z = gateSpan / 2;
        group.add(pillarCapRight);

        const beamMat = new THREE.MeshStandardMaterial({ color: 0x9e8e7e, roughness: 0.65, metalness: 0.12, emissive: building.accentColor, emissiveIntensity: 0.08 });
        const beam = new THREE.Mesh(new THREE.BoxGeometry(pillarW + 0.1, 0.4, gateSpan + pillarD), beamMat);
        beam.position.set(0, pillarH + 0.35, 0);
        beam.castShadow = true;
        group.add(beam);

        const archMat = new THREE.MeshStandardMaterial({ color: 0xc4b8a8, roughness: 0.55, metalness: 0.15 });
        const arch = new THREE.Mesh(new THREE.BoxGeometry(pillarW + 0.6, 0.15, gateSpan + pillarD + 0.3), archMat);
        arch.position.set(0, pillarH + 0.6, 0);
        arch.castShadow = true;
        group.add(arch);

        const signBoard = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.55, gateSpan - 1.5),
            new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.3, metalness: 0.5, emissive: building.accentColor, emissiveIntensity: 0.2 })
        );
        signBoard.position.set(pillarW / 2 + 0.2, pillarH - 0.8, 0);
        group.add(signBoard);

        const signText = new THREE.Mesh(
            new THREE.PlaneGeometry(0.35, gateSpan - 2.2),
            new THREE.MeshBasicMaterial({ color: 0x4a3020, side: THREE.DoubleSide })
        );
        signText.rotation.y = Math.PI / 2;
        signText.position.set(pillarW / 2 + 0.27, pillarH - 0.8, 0);
        group.add(signText);

        const boothMat = new THREE.MeshStandardMaterial({ color: 0xa89888, roughness: 0.55, metalness: 0.1 });
        const booth = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 2.8), boothMat);
        booth.position.set(-2.5, 1.4, -gateSpan / 2 - 2.2);
        booth.castShadow = true;
        booth.receiveShadow = true;
        group.add(booth);

        const boothRoof = new THREE.Mesh(
            new THREE.BoxGeometry(4.2, 0.2, 3.4),
            new THREE.MeshStandardMaterial({ color: 0x6a5d52, roughness: 0.6, metalness: 0.15, emissive: 0x442211, emissiveIntensity: 0.05 })
        );
        boothRoof.position.set(-2.5, 3, -gateSpan / 2 - 2.2);
        boothRoof.castShadow = true;
        group.add(boothRoof);

        const boothWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 1.2),
            new THREE.MeshBasicMaterial({ color: 0xd4e0e8, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        boothWindow.position.set(-2.5 + 1.4 - 0.01, 1.6, -gateSpan / 2 - 2.2);
        group.add(boothWindow);

        const boothDoor = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 2),
            new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide })
        );
        boothDoor.position.set(-2.5 - 1.4 + 0.01, 1, -gateSpan / 2 - 2.2);
        group.add(boothDoor);

        const sideWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2.2, 2.5),
            new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.8, metalness: 0.05 })
        );
        sideWallLeft.position.set(-0.6, 1.1, -gateSpan / 2 - pillarD - 1);
        sideWallLeft.castShadow = true;
        group.add(sideWallLeft);

        const sideWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2.2, 2.5),
            new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.8, metalness: 0.05 })
        );
        sideWallRight.position.set(-0.6, 1.1, gateSpan / 2 + pillarD + 1);
        sideWallRight.castShadow = true;
        group.add(sideWallRight);

        const barrierArm = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 0.08, 0.06),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.5 })
        );
        barrierArm.position.set(-3.2, 1.1, 0);
        group.add(barrierArm);

        const poleStand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 1.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.6 })
        );
        poleStand.position.set(-3.2, 0.7, -1.2);
        group.add(poleStand);

        return pillarH + 1;
    }

    function createDetailedBuilding(building) {
        const group = new THREE.Group();
        group.position.set(building.position.x, 0, building.position.z);
        if (building.rotation) group.rotation.y = building.rotation;
        const style = getBuildingStyleProfile(building);
        group.userData = {
            isSiteBuilding: true,
            id: building.id,
            name: building.name,
            type: building.type,
            status: building.status,
            description: building.description,
            alwaysLabel: !!building.alwaysLabel,
            focusable: building.focusable !== false,
            accentColor: building.accentColor
        };

        let maxHeight = 0;
        const footprintBounds = getFootprintBounds(building.footprints);

        if (building.id === "main-gate") {
            maxHeight = buildMainGate(group, building);
        } else {
        building.footprints.forEach((part, index) => {
            if (style.family === "basin") {
                const basinTop = addBasinStructure(group, part, style);
                maxHeight = Math.max(maxHeight, basinTop);
                return;
            }

            maxHeight = Math.max(maxHeight, part.h);
            const isBrick = brickBuildings[building.id];
            const partWallColor = mixColors(style.wallBase, building.wallColor, 0.32);
            partWallColor.lerp(new THREE.Color(style.wallAccent), index % 2 === 0 ? 0.2 : 0.1);
            partWallColor.offsetHSL(0, 0, index % 2 === 0 ? -0.02 : -0.07);
            const wallMat = isBrick
                ? makeBrickWallMaterial(part, building.wallColor, building.accentColor)
                : makeBuildingMaterial(partWallColor, building.accentColor);
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(part.w, part.h, part.d),
                wallMat
            );
            wall.position.set(part.x, part.h / 2, part.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            group.add(wall);

            if (isBrick) {
                addBrickMortarLines(group, part, building.wallColor);
            }

            const skirt = new THREE.Mesh(
                new THREE.BoxGeometry(part.w * 1.02, 0.58, part.d * 1.02),
                new THREE.MeshStandardMaterial({
                    color: isBrick ? 0x5a4a3a : style.plinthColor,
                    roughness: 0.92,
                    metalness: 0.05
                })
            );
            skirt.position.set(part.x, 0.3, part.z);
            skirt.receiveShadow = true;
            group.add(skirt);

            const corniceBand = new THREE.Mesh(
                new THREE.BoxGeometry(part.w * 0.98, 0.18, part.d * 0.98),
                createFacadeDetailMaterial(isBrick ? 0x8a6e5a : style.corniceColor)
            );
            corniceBand.position.set(part.x, part.h - 0.15, part.z);
            group.add(corniceBand);

            addWindowRows(group, part, style);

            if (style.family === "office") {
                addLinearFrames(group, part, style);

                const floorCount = Math.max(2, Math.round(part.h / 3.4));
                for (let fl = 1; fl < floorCount; fl++) {
                    const floorBand = new THREE.Mesh(
                        new THREE.BoxGeometry(part.w * 0.97, 0.12, part.d * 0.97),
                        createFacadeDetailMaterial(style.detailColor)
                    );
                    floorBand.position.set(part.x, Math.max(1.5, part.h * (fl / floorCount)), part.z);
                    group.add(floorBand);
                }

                const horizontalBand = new THREE.Mesh(
                    new THREE.BoxGeometry(part.w * 0.96, 0.18, part.d * 0.96),
                    createFacadeDetailMaterial(style.detailColor)
                );
                horizontalBand.position.set(part.x, Math.max(1.5, part.h * 0.46), part.z);
                group.add(horizontalBand);
            }

            if (style.family === "factory") {
                addLinearFrames(group, part, style);

                const longSide = part.w >= part.d;
                const ribCount = Math.max(4, Math.round((longSide ? part.w : part.d) / 1.8));
                const ribMat = new THREE.MeshStandardMaterial({ color: style.wallAccent, roughness: 0.7, metalness: 0.08 });
                for (let r = 0; r < ribCount; r++) {
                    const ribOffset = ((r + 0.5) / ribCount - 0.5) * (longSide ? part.w * 0.96 : part.d * 0.96);
                    const rib = new THREE.Mesh(
                        new THREE.BoxGeometry(longSide ? 0.08 : 0.12, part.h * 0.88, longSide ? 0.12 : 0.08),
                        ribMat
                    );
                    if (longSide) {
                        rib.position.set(part.x + ribOffset, part.h / 2, part.z + part.d / 2 + 0.08);
                        group.add(rib);
                        const ribB = rib.clone();
                        ribB.position.z = part.z - part.d / 2 - 0.08;
                        group.add(ribB);
                    } else {
                        rib.position.set(part.x + part.w / 2 + 0.08, part.h / 2, part.z + ribOffset);
                        group.add(rib);
                        const ribB = rib.clone();
                        ribB.position.x = part.x - part.w / 2 - 0.08;
                        group.add(ribB);
        }
        }

                const loadingDoor = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(3.2, part.w * 0.22), Math.max(2.8, part.h * 0.34), 0.14),
                    new THREE.MeshStandardMaterial({
                        color: 0xc2d2dc,
                        roughness: 0.55,
                        metalness: 0.16,
                        emissive: 0x222222,
                        emissiveIntensity: 0.05
                    })
                );
                loadingDoor.position.set(part.x + part.w * 0.22, Math.max(1.5, part.h * 0.18), part.z + part.d / 2 + 0.08);
                group.add(loadingDoor);

                const doorFrame = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(3.5, part.w * 0.26), 0.1, 0.22),
                    new THREE.MeshStandardMaterial({ color: 0x6a6a65, roughness: 0.4, metalness: 0.3 })
                );
                doorFrame.position.set(part.x + part.w * 0.22, Math.max(3, part.h * 0.35), part.z + part.d / 2 + 0.08);
                group.add(doorFrame);
            }

            if (style.family === "utility") {
                const louver = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(2.4, part.w * 0.26), 0.18, 0.12),
                    createFacadeDetailMaterial(style.frameColor)
                );
                louver.position.set(part.x, Math.max(1.7, part.h * 0.56), part.z + part.d / 2 + 0.07);
                group.add(louver);

                const pipeRack = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.12, 0.12, Math.max(2.4, part.w * 0.46), 10),
                    new THREE.MeshStandardMaterial({
                        color: style.equipmentColor,
                        roughness: 0.48,
                        metalness: 0.24
                    })
                );
                pipeRack.rotation.z = Math.PI / 2;
                const rackY = Math.max(1.2, part.h * 0.24);
                pipeRack.position.set(part.x, rackY, part.z - part.d / 2 - 0.4);
                group.add(pipeRack);

                const rackLen = Math.max(2.4, part.w * 0.46);
                const rackZ = part.z - part.d / 2 - 0.4;
                const rackSupMat = new THREE.MeshStandardMaterial({ color: style.equipmentColor, roughness: 0.48, metalness: 0.24 });
                const rackSupL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, rackY, 8), rackSupMat);
                rackSupL.position.set(part.x - rackLen / 2, rackY / 2, rackZ);
                group.add(rackSupL);
                const rackSupR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, rackY, 8), rackSupMat);
                rackSupR.position.set(part.x + rackLen / 2, rackY / 2, rackZ);
                group.add(rackSupR);
            }

            const roofColor = mixColors(style.roofBase, building.roofColor, 0.28);
            roofColor.lerp(new THREE.Color(style.roofAccent), index % 2 === 0 ? 0.16 : 0.08);
            roofColor.offsetHSL(0, 0, index % 2 === 0 ? -0.02 : -0.06);
            const roofTop = style.family === "office"
                ? addOfficeRoof(group, part, style, roofColor, building.accentColor)
                : style.family === "factory"
                    ? addFactoryRoof(group, part, style, roofColor, building.accentColor)
                    : addUtilityRoof(group, part, style, roofColor, building.accentColor);
            maxHeight = Math.max(maxHeight, roofTop);

            const mechanical = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(1.8, part.w * 0.16), 0.7, Math.max(1.2, part.d * 0.14)),
                new THREE.MeshStandardMaterial({
                    color: style.equipmentColor,
                    roughness: 0.56,
                    metalness: 0.18
                })
            );
            mechanical.position.set(part.x - part.w * 0.18, part.h + 1.06, part.z + part.d * 0.14);
            group.add(mechanical);

            if (style.addRoofRail && part.w > 10 && part.d > 8) {
                const rail = new THREE.Mesh(
                    new THREE.BoxGeometry(part.w * 0.9, 0.08, 0.08),
                    new THREE.MeshStandardMaterial({ color: 0xe7eef2, roughness: 0.68, metalness: 0.18 })
                );
                rail.position.set(part.x, part.h + 1.14, part.z - part.d * 0.3);
                group.add(rail);
            }

            if (style.addEntrance && index === 0) addEntranceVolume(group, part, style);
        });

        const primary = building.footprints[0];
        if (primary) {
            if (style.family === "office") {
                const upperBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(primary.w * 0.54, Math.max(2.8, primary.h * 0.34), primary.d * 0.52),
                    makeBuildingMaterial(mixColors(style.wallBase, style.wallAccent, 0.55).offsetHSL(0, 0, -0.08), building.accentColor)
                );
                upperBlock.position.set(primary.x + primary.w * 0.1, primary.h + Math.max(1.4, primary.h * 0.17), primary.z - primary.d * 0.04);
                upperBlock.castShadow = true;
                upperBlock.receiveShadow = true;
                group.add(upperBlock);
                maxHeight = Math.max(maxHeight, upperBlock.position.y + Math.max(2.8, primary.h * 0.34) / 2);

                const stairCore = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(2.2, primary.w * 0.15), Math.max(3.8, primary.h * 0.48), Math.max(2.2, primary.d * 0.18)),
                    makeBuildingMaterial(mixColors(style.wallBase, 0x6d645d, 0.36), building.accentColor)
                );
                stairCore.position.set(primary.x - primary.w * 0.28, Math.max(3.8, primary.h * 0.48) / 2, primary.z + primary.d * 0.18);
                stairCore.castShadow = true;
                stairCore.receiveShadow = true;
                group.add(stairCore);
                maxHeight = Math.max(maxHeight, stairCore.position.y + Math.max(3.8, primary.h * 0.48) / 2);
            } else if (style.family === "factory") {
                const annex = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(4, primary.w * 0.28), Math.max(2.8, primary.h * 0.56), Math.max(3.2, primary.d * 0.3)),
                    makeBuildingMaterial(mixColors(style.wallBase, style.roofBase, 0.32), building.accentColor)
                );
                annex.position.set(primary.x - primary.w * 0.24, Math.max(2.8, primary.h * 0.56) / 2, primary.z + primary.d * 0.24);
                annex.castShadow = true;
                annex.receiveShadow = true;
                group.add(annex);

                const pipeGallery = new THREE.Mesh(
                    new THREE.BoxGeometry(primary.w * 0.62, 0.16, 1.1),
                    new THREE.MeshStandardMaterial({ color: 0xe5ecef, roughness: 0.62, metalness: 0.12 })
                );
                const galleryY = Math.max(2.2, primary.h * 0.22);
                pipeGallery.position.set(primary.x, galleryY, primary.z + primary.d / 2 + 0.88);
                group.add(pipeGallery);

                const galleryZ = primary.z + primary.d / 2 + 0.88;
                const galSupMat = new THREE.MeshStandardMaterial({ color: 0xe5ecef, roughness: 0.62, metalness: 0.12 });
                const galSupL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, galleryY, 8), galSupMat);
                galSupL.position.set(primary.x - primary.w * 0.25, galleryY / 2, galleryZ);
                group.add(galSupL);
                const galSupR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, galleryY, 8), galSupMat);
                galSupR.position.set(primary.x + primary.w * 0.25, galleryY / 2, galleryZ);
                group.add(galSupR);

                const stackA = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.24, 0.28, Math.max(3.4, primary.h * 0.6), 10),
                    new THREE.MeshStandardMaterial({ color: 0xc5d2d9, roughness: 0.5, metalness: 0.24 })
                );
                stackA.position.set(primary.x + primary.w * 0.3, Math.max(3.4, primary.h * 0.6) / 2, primary.z - primary.d * 0.18);
                stackA.castShadow = true;
                group.add(stackA);
                maxHeight = Math.max(maxHeight, stackA.position.y + Math.max(3.4, primary.h * 0.6) / 2);
            } else if (style.family === "utility") {
                const serviceBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(3, primary.w * 0.24), Math.max(2.4, primary.h * 0.42), Math.max(2.4, primary.d * 0.22)),
                    makeBuildingMaterial(mixColors(style.wallBase, style.roofBase, 0.38), building.accentColor)
                );
                serviceBlock.position.set(primary.x + primary.w * 0.22, Math.max(2.4, primary.h * 0.42) / 2, primary.z - primary.d * 0.2);
                serviceBlock.castShadow = true;
                serviceBlock.receiveShadow = true;
                group.add(serviceBlock);

                const stack = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.32, 0.38, Math.max(3.2, primary.h * 0.56), 10),
                    new THREE.MeshStandardMaterial({ color: 0xcfd8de, roughness: 0.55, metalness: 0.2 })
                );
                stack.position.set(primary.x - primary.w * 0.24, Math.max(3.2, primary.h * 0.56) / 2, primary.z - primary.d * 0.18);
                stack.castShadow = true;
                group.add(stack);
                maxHeight = Math.max(maxHeight, stack.position.y + Math.max(3.2, primary.h * 0.56) / 2);

                const sidePipe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.16, Math.max(3.6, primary.d * 0.48), 10),
                    new THREE.MeshStandardMaterial({ color: 0xc4d0d5, roughness: 0.46, metalness: 0.24 })
                );
                sidePipe.rotation.x = Math.PI / 2;
                const sideY = Math.max(1.4, primary.h * 0.22);
                sidePipe.position.set(primary.x + primary.w * 0.1, sideY, primary.z + primary.d * 0.34);
                group.add(sidePipe);

                const sideSupp = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.08, 0.08, sideY, 8),
                    new THREE.MeshStandardMaterial({ color: 0xc4d0d5, roughness: 0.46, metalness: 0.24 })
                );
                sideSupp.position.set(primary.x + primary.w * 0.1, sideY / 2, primary.z + primary.d * 0.34);
                group.add(sideSupp);
            }
        }
        }

        if (building.id === "aec-production-line") {
            const primary = building.footprints[0];
            const gateW = 6;
            const gateH = 4.8;
            const gateX = -primary.w / 2 + gateW / 2;

            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 0.65, metalness: 0.15 });
            const lintelMat = new THREE.MeshStandardMaterial({ color: 0x7a746a, roughness: 0.55, metalness: 0.2 });
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0x6e6860, roughness: 0.6, metalness: 0.25 });
            const apronMat = new THREE.MeshStandardMaterial({ color: 0x5e5952, roughness: 0.9, metalness: 0.05 });

            const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, gateH, 0.65), pillarMat);
            leftPillar.position.set(gateX - gateW / 2, gateH / 2, primary.d / 2 + 0.32);
            leftPillar.castShadow = true;
            leftPillar.receiveShadow = true;
            group.add(leftPillar);

            const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, gateH, 0.65), pillarMat);
            rightPillar.position.set(gateX + gateW / 2, gateH / 2, primary.d / 2 + 0.32);
            rightPillar.castShadow = true;
            rightPillar.receiveShadow = true;
            group.add(rightPillar);

            const lintel = new THREE.Mesh(new THREE.BoxGeometry(gateW + 0.8, 0.3, 0.75), lintelMat);
            lintel.position.set(gateX, gateH + 0.12, primary.d / 2 + 0.28);
            lintel.castShadow = true;
            group.add(lintel);

            const canopy = new THREE.Mesh(
                new THREE.BoxGeometry(gateW + 2.4, 0.16, 2.2),
                canopyMat
            );
            canopy.position.set(gateX, gateH + 0.55, primary.d / 2 + 1.1);
            canopy.castShadow = true;
            group.add(canopy);

            const apron = new THREE.Mesh(
                new THREE.BoxGeometry(gateW + 1.6, 0.12, 3.5),
                apronMat
            );
            apron.position.set(gateX, 0.06, primary.d / 2 + 1.8);
            apron.receiveShadow = true;
            group.add(apron);

            const threshold = new THREE.Mesh(
                new THREE.BoxGeometry(gateW - 0.1, 0.15, 0.7),
                new THREE.MeshStandardMaterial({ color: 0x5a554e, roughness: 0.7, metalness: 0.1 })
            );
            threshold.position.set(gateX, 0.1, primary.d / 2 + 0.48);
            threshold.receiveShadow = true;
            group.add(threshold);

            group.userData.gateWorldZ = building.position.z + primary.d / 2;
            group.userData.gateWorldX = building.position.x + gateX;
            factoryGateDoors = group;

            const signBoard = new THREE.Mesh(
                new THREE.BoxGeometry(gateW - 1.4, 0.55, 0.06),
                new THREE.MeshStandardMaterial({ color: 0xe8e0d4, roughness: 0.3, metalness: 0.45, emissive: 0x221100, emissiveIntensity: 0.2 })
            );
            signBoard.position.set(gateX, gateH - 0.75, primary.d / 2 + 0.38);
            group.add(signBoard);
        }

        const base = new THREE.Mesh(
            new THREE.BoxGeometry(footprintBounds.width + 7, 0.4, footprintBounds.depth + 7),
            new THREE.MeshStandardMaterial({
                color: 0x2a2822,
                roughness: 1,
                metalness: 0,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -2
            })
        );
        base.position.set(0, 0.2, 0);
        base.receiveShadow = true;
        group.add(base);

        scene.add(group);
        siteObjects.push(group);

        createLabel(building, maxHeight + 8.5);
    }

    function createBackgroundBuildings() {
        const occupiedBounds = renderableBuildings.map(getWorldBounds);
        layout.backgroundBuildings.forEach((building) => {
            const bgBounds = {
                minX: building.position.x - building.size.w / 2 - 2,
                maxX: building.position.x + building.size.w / 2 + 2,
                minZ: building.position.z - building.size.d / 2 - 2,
                maxZ: building.position.z + building.size.d / 2 + 2
            };
            if (occupiedBounds.some((bounds) => boundsOverlap(bounds, bgBounds))) return;

            const bgStyle = /a7|a8|a9|b3|9f/i.test(String(building.roofColor || ""))
                ? getBuildingStyleProfile({ type: "办公楼", name: "办公楼" })
                : getBuildingStyleProfile({ type: building.size.w > building.size.d * 1.4 ? "厂房" : "站房", name: "背景建筑" });
            const wallColor = mixColors(bgStyle.wallBase, building.wallColor || building.color, 0.34);
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(building.size.w, building.size.h, building.size.d),
                makeBuildingMaterial(wallColor, 0x7fd7ff)
            );
            mesh.position.set(building.position.x, building.size.h / 2, building.position.z);
            if (building.rotation) mesh.rotation.y = building.rotation;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);

            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(building.size.w * 0.98, 0.22, building.size.d * 0.98),
                new THREE.MeshStandardMaterial({
                    color: mixColors(bgStyle.roofBase, building.roofColor || 0x5b7389, 0.4),
                    roughness: 0.66,
                    metalness: 0.16
                })
            );
            roof.position.set(building.position.x, building.size.h + 0.12, building.position.z);
            if (building.rotation) roof.rotation.y = building.rotation;
            roof.castShadow = true;
            scene.add(roof);

            const longSide = building.size.w >= building.size.d;
            if (bgStyle.family === "factory") {
                const axisSpan = longSide ? building.size.d : building.size.w;
                const moduleCount = Math.max(2, Math.round(axisSpan / 5.2));
                const spacing = axisSpan / moduleCount;
                for (let i = 0; i < moduleCount; i++) {
                    const offset = ((i + 0.5) / moduleCount - 0.5) * (axisSpan * 0.84);
                    const panel = new THREE.Mesh(
                        new THREE.BoxGeometry(
                            longSide ? building.size.w * 0.92 : spacing * 0.82,
                            0.14,
                            longSide ? spacing * 0.82 : building.size.d * 0.92
                        ),
                        new THREE.MeshStandardMaterial({
                            color: mixColors(bgStyle.roofBase, bgStyle.roofAccent, 0.24),
                            roughness: 0.58,
                            metalness: 0.2
                        })
                    );
                    if (longSide) {
                        panel.position.set(building.position.x, building.size.h + 0.58, building.position.z + offset);
                        panel.rotation.x = -0.36;
                    } else {
                        panel.position.set(building.position.x + offset, building.size.h + 0.58, building.position.z);
                        panel.rotation.z = 0.36;
                    }
                    if (building.rotation) panel.rotation.y += building.rotation;
                    panel.castShadow = true;
                    scene.add(panel);
                }
            } else {
                const monitor = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        longSide ? building.size.w * 0.56 : Math.max(2.2, building.size.w * 0.24),
                        0.42,
                        longSide ? Math.max(2.2, building.size.d * 0.26) : building.size.d * 0.56
                    ),
                    new THREE.MeshStandardMaterial({
                        color: mixColors(bgStyle.roofBase, bgStyle.roofAccent, 0.28),
                        roughness: 0.62,
                        metalness: 0.16
                    })
                );
                monitor.position.set(building.position.x, building.size.h + 0.46, building.position.z);
                if (building.rotation) monitor.rotation.y = building.rotation;
                monitor.castShadow = true;
                scene.add(monitor);
            }

            const ventCount = Math.max(1, Math.round(building.size.w / 8));
            for (let i = 0; i < ventCount; i++) {
                const vent = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 0.5, 1),
                    new THREE.MeshStandardMaterial({
                        color: 0xdfe7ec,
                        roughness: 0.6,
                        metalness: 0.14
                    })
                );
                const offsetX = ((i / Math.max(1, ventCount - 1)) - 0.5) * (building.size.w * 0.55);
                vent.position.set(building.position.x + offsetX, building.size.h + 0.68, building.position.z);
                if (building.rotation) {
                    const local = new THREE.Vector3(offsetX, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), building.rotation);
                    vent.position.set(building.position.x + local.x, building.size.h + 0.68, building.position.z + local.z);
                    vent.rotation.y = building.rotation;
                }
                scene.add(vent);
            }

            if (building.size.h > 4.8) {
                const annex = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.max(3.2, building.size.w * 0.22), Math.max(2.2, building.size.h * 0.46), Math.max(2.4, building.size.d * 0.24)),
                    makeBuildingMaterial(mixColors(bgStyle.wallBase, bgStyle.roofBase, 0.34), 0x7fd7ff)
                );
                annex.position.set(building.position.x - building.size.w * 0.22, Math.max(2.2, building.size.h * 0.46) / 2, building.position.z + building.size.d * 0.18);
                if (building.rotation) annex.rotation.y = building.rotation;
                annex.castShadow = true;
                annex.receiveShadow = true;
                scene.add(annex);
            }
        });
    }

    function createLandmarks() {
        layout.landmarks.forEach((landmark) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(3.6, 0.18, 16, 80),
                new THREE.MeshBasicMaterial({
                    color: landmark.color,
                    transparent: true,
                    opacity: 0.58
                })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(landmark.position.x, 0.35, landmark.position.z);
            pulseRings.push(ring);
            scene.add(ring);

            const beacon = new THREE.Mesh(
                new THREE.ConeGeometry(0.9, 3, 18),
                new THREE.MeshStandardMaterial({
                    color: landmark.color,
                    emissive: 0x0a687a,
                    roughness: 0.32,
                    metalness: 0.18
                })
            );
            beacon.position.set(landmark.position.x, 3.2, landmark.position.z);
            beacon.castShadow = true;
            scene.add(beacon);
        });
    }

    function createLabel(building, y) {
        const el = document.createElement("div");
        el.className = "site-building-label";
        el.innerHTML = "<strong>" + building.name + "</strong><span>" + building.type + "</span>";
        labelLayer.appendChild(el);
        siteLabels.push({
            element: el,
            position: new THREE.Vector3(building.position.x, y, building.position.z),
            buildingId: building.id,
            alwaysVisible: !!building.alwaysLabel
        });
    }

    function getBuildingFromObject(object) {
        let current = object;
        while (current && !current.userData.isSiteBuilding) current = current.parent;
        return current || null;
    }

    function updateLabels() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        siteLabels.forEach((item) => {
            const projected = item.position.clone().project(camera);
            const visible = projected.z < 1 && projected.z > -1;

            const shouldShow = item.alwaysVisible || (hoveredBuilding && hoveredBuilding.userData.id === item.buildingId) || (selectedBuilding && selectedBuilding.userData.id === item.buildingId);

            if (!visible || !shouldShow) {
                item.element.style.opacity = "0";
                return;
            }

            const x = (projected.x * 0.5 + 0.5) * width;
            const y = (-projected.y * 0.5 + 0.5) * height;
            item.element.style.transform = "translate(-50%, -50%) translate(" + x + "px, " + y + "px)";
            item.element.style.opacity = "1";
        });
    }

    function setCardVisible(visible) {
        if (!infoCard) return;
        infoCard.classList.toggle("show", visible);
    }

    function updateInfoCard(building) {
        if (!infoCard || !building) return;
        infoTitle.textContent = building.userData.name;
        infoType.textContent = building.userData.type;
        infoStatus.textContent = building.userData.status;
        infoDesc.textContent = building.userData.description;
        if (building.userData.id === "aec-production-line") {
            focusBtn.textContent = "进入厂房";
            focusBtn.style.borderColor = "#00f3ff";
            focusBtn.style.color = "#00f3ff";
        } else {
            focusBtn.textContent = "镜头聚焦";
            focusBtn.style.borderColor = "";
            focusBtn.style.color = "";
        }
        setCardVisible(true);
    }

    function resetMaterials() {
        siteObjects.forEach((group) => {
            group.traverse((child) => {
                if (!child.isMesh || !child.material || !child.material.emissive) return;
                const accent = group.userData.accentColor || "#00f3ff";
                const factor = group === selectedBuilding ? 0.5 : 0.08;
                child.material.emissive.copy(new THREE.Color(accent).multiplyScalar(factor));
            });
        });
    }

    function setHoveredBuilding(building) {
        hoveredBuilding = building;
        resetMaterials();
        if (!hoveredBuilding || hoveredBuilding === selectedBuilding) return;

        hoveredBuilding.traverse((child) => {
            if (!child.isMesh || !child.material || !child.material.emissive) return;
            child.material.emissive.copy(new THREE.Color(hoveredBuilding.userData.accentColor).multiplyScalar(0.65));
        });
    }

    function flyToBuilding(building) {
        if (!building) return;
        const box = new THREE.Box3().setFromObject(building);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const offset = new THREE.Vector3(size.x * 1.3 + 18, Math.max(22, size.y * 1.45 + 20), size.z * 1.5 + 18);

        cameraFlight = {
            startPos: camera.position.clone(),
            endPos: center.clone().add(offset),
            startTarget: controls.target.clone(),
            endTarget: center.clone(),
            progress: 0
        };
    }

    function transitionToFactory() {
        if (!factoryGateDoors || factoryTransition) return;
        controls.enabled = false;
        setCardVisible(false);

        const gw = factoryGateDoors.userData.gateWorldX;
        const gz = factoryGateDoors.userData.gateWorldZ;

        factoryTransition = {
            progress: 0,
            startPos: camera.position.clone(),
            midPos: new THREE.Vector3(gw - 6, 14, gz + 22),
            endPos: new THREE.Vector3(gw, 1.8, gz - 1.5),
            startTarget: controls.target.clone(),
            midTarget: new THREE.Vector3(gw, 2.8, gz + 0.5),
            endTarget: new THREE.Vector3(gw, 2.5, gz - 4),
            midPhase: false
        };

        var overlay = document.getElementById('factory-fade-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'factory-fade-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9998;pointer-events:none;opacity:0;transition:opacity 0.4s ease;';
            document.body.appendChild(overlay);
        }
    }

    function updateFactoryTransition(delta) {
        if (!factoryTransition) return;
        var t = factoryTransition;
        var overlay = document.getElementById('factory-fade-overlay');

        if (!t.midPhase) {
            t.progress = Math.min(1, t.progress + delta * 0.5);
            var eased = 1 - Math.pow(1 - t.progress, 2.5);
            camera.position.lerpVectors(t.startPos, t.midPos, eased);
            controls.target.lerpVectors(t.startTarget, t.midTarget, eased);
            if (t.progress > 0.7 && overlay) {
                overlay.style.opacity = ((t.progress - 0.7) / 0.3) * 0.7;
            }
            if (t.progress >= 1) {
                t.midPhase = true;
                t.progress = 0;
                t.startPos.copy(camera.position);
                t.startTarget.copy(controls.target);
            }
        } else {
            t.progress = Math.min(1, t.progress + delta * 0.55);
            var eased2 = 1 - Math.pow(1 - t.progress, 2);
            camera.position.lerpVectors(t.startPos, t.endPos, eased2);
            controls.target.lerpVectors(t.midTarget, t.endTarget, eased2);
            if (overlay) overlay.style.opacity = Math.min(1, 0.7 + t.progress * 0.3);
            if (t.progress >= 1) {
                factoryTransition = null;
                controls.enabled = true;
                window.location.href = 'factory.html';
            }
        }
    }

    function focusBuilding(buildingId) {
        const target = siteObjects.find((item) => item.userData.id === buildingId);
        if (!target) return;
        selectedBuilding = target;
        resetMaterials();
        updateInfoCard(target);
        flyToBuilding(target);
    }

    function resetOverview() {
        selectedBuilding = null;
        setCardVisible(false);
        cameraFlight = {
            startPos: camera.position.clone(),
            endPos: defaultCamera.position.clone(),
            startTarget: controls.target.clone(),
            endTarget: defaultCamera.target.clone(),
            progress: 0
        };
        resetMaterials();
    }

    function onPointerMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(siteObjects, true);
        const hit = hits.length ? getBuildingFromObject(hits[0].object) : null;
        renderer.domElement.style.cursor = hit && hit.userData.focusable ? "pointer" : "grab";
        setHoveredBuilding(hit);
    }

    function onPointerDown(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(siteObjects, true);
        if (!hits.length) return;

        const hit = getBuildingFromObject(hits[0].object);
        if (!hit) return;
        if (!hit.userData.focusable) return;

        if (hit.userData.id === "aec-production-line") {
            transitionToFactory();
            return;
        }

        focusBuilding(hit.userData.id);
    }

    function updateCameraFlight(delta) {
        if (!cameraFlight) return;
        cameraFlight.progress = Math.min(1, cameraFlight.progress + delta * 0.58);
        const eased = 1 - Math.pow(1 - cameraFlight.progress, 3);
        camera.position.lerpVectors(cameraFlight.startPos, cameraFlight.endPos, eased);
        controls.target.lerpVectors(cameraFlight.startTarget, cameraFlight.endTarget, eased);
        if (cameraFlight.progress >= 1) cameraFlight = null;
    }

    const pulseRings = [];

    function animatePulseRings(time) {
        for (let i = 0; i < pulseRings.length; i++) {
            const ring = pulseRings[i];
            const scale = 1 + Math.sin(time * 1.8) * 0.08;
            ring.scale.set(scale, scale, scale);
            ring.material.opacity = 0.38 + (Math.sin(time * 1.8) + 1) * 0.12;
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.elapsedTime;

        controls.update();
        updateCameraFlight(delta);
        updateFactoryTransition(delta);
        animatePulseRings(time);
        updateLabels();
        renderer.render(scene, camera);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateLabels();
    }

    if (focusBtn) {
        focusBtn.addEventListener("click", function () {
            if (!selectedBuilding) return;
            if (selectedBuilding.userData.id === "aec-production-line") {
                transitionToFactory();
                return;
            }
            flyToBuilding(selectedBuilding);
        });
    }

    if (resetBtn) resetBtn.addEventListener("click", function () {
        factoryTransition = null;
        controls.enabled = true;
        var overlay = document.getElementById('factory-fade-overlay');
        if (overlay) overlay.style.opacity = '0';
        resetOverview();
    });

    createCampusBase();
    createYards();
    createRoads();
    createGreenZones();
    createTreeBelts();
    createTanks();
    createBackgroundBuildings();
    createLandmarks();
    const seenNames = new Set();
    const keptBounds = [];
    layout.buildings.concat(layout.supplementalBuildings || []).forEach((building) => {
        const dedupeKey = building.name || building.id;
        if (seenNames.has(dedupeKey)) return;
        const bounds = getWorldBounds(building);
        const isPrimary = layout.buildings.includes(building);
        const conflict = keptBounds.some((item) => {
            const area = overlapArea(bounds, item.bounds);
            if (area <= 0) return false;
            const areaA = (bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ);
            const areaB = (item.bounds.maxX - item.bounds.minX) * (item.bounds.maxZ - item.bounds.minZ);
            return area / Math.min(areaA, areaB) > (isPrimary ? 0.55 : 0.28);
        });
        if (conflict && !isPrimary) return;
        seenNames.add(dedupeKey);
        renderableBuildings.push(building);
        keptBounds.push({ bounds: bounds, building: building });
    });
    renderableBuildings.forEach(createDetailedBuilding);
    resetMaterials();

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    window.MainCampusScene = {
        focusBuildingById: focusBuilding,
        resetOverview: resetOverview
    };

    animate();
})();
