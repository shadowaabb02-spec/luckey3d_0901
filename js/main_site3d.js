import * as THREE from 'three';
import { OrbitControls } from '../vendor/three-r171/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../vendor/three-r171/jsm/loaders/GLTFLoader.js';

// GitHub rejects files larger than 100 MB. These two parts are byte-for-byte
// chunks of the original 111.6 MB GLB and are merged before GLTFLoader parses it.
const MODEL_PART_URLS = [
    'models/factory_demo_1024.glb.part00',
    'models/factory_demo_1024.glb.part01'
];
const MODEL_URL = MODEL_PART_URLS.join(',');
const MAX_MODEL_LOAD_RETRIES = 2;
const PROJECT_FACILITY_ID = 'dual-membrane';

const STATUS_META = {
    running: { label: '运行', color: 0x72e0ae, cssColor: '#72e0ae', icon: 'activity' },
    stopped: { label: '停运', color: 0x9aa7a9, cssColor: '#9aa7a9', icon: 'circle-pause' },
    maintenance: { label: '检修', color: 0xf2c66d, cssColor: '#f2c66d', icon: 'wrench' }
};

const FACILITY_DEFINITIONS = [
    {
        id: 'reclaimed-water',
        name: '中水回收',
        nodeNames: ['中水回收1'],
        status: 'running',
        verified: true,
        metrics: [['状态来源', '演示数据'], ['内部模型', '待接入']]
    },
    {
        id: PROJECT_FACILITY_ID,
        name: '中水双膜',
        nodeNames: ['中水双膜（本项目所在地）1'],
        status: 'running',
        verified: true,
        metrics: [['工艺配置', 'UF + RO'], ['数据接入', '待现场联调']]
    },
    {
        id: 'pure-water',
        name: '纯水站',
        nodeNames: ['黑白涂布号机（纯水站）1'],
        status: 'running',
        verified: false,
        metrics: [['状态来源', '演示数据'], ['模型位置', '待美术修订']]
    },
    {
        id: 'water-membrane-prep',
        name: '水膜纯水制备',
        nodeNames: ['水膜纯水设备1'],
        status: 'maintenance',
        verified: false,
        metrics: [['状态来源', '演示数据'], ['模型外形', '待美术修订']]
    },
    {
        id: 'reclaimed-station-2',
        name: '中水站2',
        nodeNames: ['图2'],
        status: 'stopped',
        verified: false,
        metrics: [['状态来源', '演示数据'], ['建筑映射', '待复核']]
    },
    {
        id: 'wastewater-station',
        name: '污水站',
        nodeNames: ['污水处理站建筑1'],
        status: 'running',
        verified: false,
        metrics: [['状态来源', '演示数据'], ['模型外形', '待美术修订']]
    },
    {
        id: 'membrane-phase-1',
        name: '水膜一期水处理',
        nodeNames: ['图3'],
        status: 'stopped',
        verified: false,
        metrics: [['建设状态', '待建'], ['建筑映射', '待复核']]
    },
    {
        id: 'membrane-demo-line',
        name: '水膜示范线水处理',
        nodeNames: ['图4'],
        status: 'maintenance',
        verified: false,
        metrics: [['状态来源', '演示数据'], ['建筑映射', '待复核']]
    }
];

const FUNCTIONAL_NODE_NAMES = new Set([
    ...FACILITY_DEFINITIONS.flatMap((facility) => facility.nodeNames),
    ...Array.from({ length: 9 }, (_, index) => `水膜纯水设备1_copy${index + 1}`)
]);
const HIGHLIGHT_LANDMARK_NODE_NAMES = new Set(['大门1', '喷泉1']);
const GROUND_NODE_NAMES = new Set(['PM3D_Cube3D1_1']);
const PASSIVE_LIGHT_COMPENSATION_NODE_NAMES = new Set(['东办公大楼1', '办公大楼1', 'PM3D_Cube3D1_2']);
const TECH_COLORS = {
    background: 0x03101d,
    fog: 0x051523,
    ground: 0x0a2943,
    passive: 0x3d6d8d,
    passiveEmissive: 0x0d3551,
    functional: 0x2f73a8,
    functionalEmissive: 0x083c66,
    project: 0x348fbd,
    projectEmissive: 0x066893,
    edge: 0x45c8ff,
    projectEdge: 0x83efff
};

const container = document.getElementById('main-3d-canvas');
const loadingLabel = document.getElementById('main-scene-loading');
const facilityLayer = document.getElementById('facility-label-layer');
const inspector = document.getElementById('facility-inspector');
const inspectorTitle = document.getElementById('facility-inspector-title');
const inspectorKicker = document.getElementById('facility-inspector-kicker');
const inspectorStatus = document.getElementById('facility-inspector-status');
const inspectorMetrics = document.getElementById('facility-inspector-metrics');
const mappingNote = document.getElementById('facility-mapping-note');
const enterLink = document.getElementById('facility-enter-link');
const inspectorClose = document.getElementById('facility-inspector-close');
const autoRotateButton = document.getElementById('main-auto-rotate');

if (!container) throw new Error('缺少厂区模型画布容器');

if (window.lucide) window.lucide.createIcons();

const state = {
    root: null,
    overviewBox: null,
    facilities: [],
    selectedFacility: null,
    selectionHelper: null,
    cameraTween: null,
    pixelCheckPassed: false,
    loadStartedAt: performance.now(),
    pointerDown: null
};

window.__mainSite3d = {
    ready: false,
    modelUrl: MODEL_URL,
    objectCount: 0,
    meshCount: 0,
    facilityCount: 0,
    materialAudit: null,
    pixelCheck: null,
    render: null
};

function getPixelRatio() {
    const cap = window.innerWidth <= 900 ? 1.2 : 1.4;
    return Math.min(window.devicePixelRatio, cap);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(TECH_COLORS.background);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.00001, 20);
camera.position.set(0.08, 0.06, 0.08);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
});
renderer.setPixelRatio(getPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.screenSpacePanning = true;
controls.enablePan = false;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotateSpeed = 0.32;

scene.add(new THREE.HemisphereLight(0xb2e5ff, 0x061527, 1.22));
scene.add(new THREE.AmbientLight(0x568bb3, 0.46));

const sunLight = new THREE.DirectionalLight(0x88cfff, 1.35);
sunLight.position.set(-5, 9, 4);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x5c9fff, 1.08);
fillLight.position.set(6, 3, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x58e8ff, 1.36);
rimLight.position.set(-6, 4, -6);
scene.add(rimLight);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const facilityMeshLookup = new WeakMap();

function updateLoading(event) {
    if (!loadingLabel) return;
    if (!event.total) {
        loadingLabel.textContent = '正在加载厂区模型';
        return;
    }

    const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
    loadingLabel.textContent = `正在加载厂区模型 ${percent}%`;
}

function setLoadError(error) {
    console.error('厂区模型加载失败', error);
    document.body.classList.add('main-scene-error');
    document.body.dataset.mainSceneError = error?.message || 'unknown';
    if (loadingLabel) {
        loadingLabel.textContent = '模型加载失败，请重新运行“启动数字孪生.command”后刷新页面';
    }
}

function normalizeModel(model) {
    model.updateMatrixWorld(true);
    const initialBox = new THREE.Box3().setFromObject(model);
    const center = initialBox.getCenter(new THREE.Vector3());

    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= initialBox.min.y;
    model.updateMatrixWorld(true);

    return new THREE.Box3().setFromObject(model);
}

function polishMaterial(material, maxAnisotropy) {
    if (!material) return;
    if (material.map) {
        material.map.anisotropy = maxAnisotropy;
        material.map.needsUpdate = true;
    }
}

function isFunctionalNode(name) {
    return FUNCTIONAL_NODE_NAMES.has(name);
}

function createTechnologyMaterial(source, tier) {
    const functional = tier === 'functional' || tier === 'project';
    const project = tier === 'project';
    const ground = tier === 'ground';
    const material = new THREE.MeshPhysicalMaterial({
        name: `${source.name || 'material'}-technology`,
        map: functional ? source.map || null : null,
        color: ground
            ? TECH_COLORS.ground
            : (project ? TECH_COLORS.project : (functional ? TECH_COLORS.functional : TECH_COLORS.passive)),
        emissive: ground
            ? 0x020a12
            : (project ? TECH_COLORS.projectEmissive : (functional ? TECH_COLORS.functionalEmissive : TECH_COLORS.passiveEmissive)),
        emissiveIntensity: ground ? 0.2 : (project ? 0.15 : (functional ? 0.1 : 0.18)),
        roughness: ground ? 0.3 : (project ? 0.3 : (functional ? 0.32 : 0.34)),
        metalness: ground ? 0.34 : (project ? 0.04 : (functional ? 0.03 : 0.14)),
        clearcoat: ground ? 0.35 : (functional ? 0 : 0.22),
        clearcoatRoughness: ground ? 0.24 : 0.28,
        specularIntensity: ground ? 0.45 : (project ? 0.12 : (functional ? 0.1 : 0.28)),
        ior: functional ? 1.34 : 1.42,
        envMapIntensity: ground ? 0.5 : (functional ? 0.82 : 0.48),
        transparent: source.transparent,
        opacity: source.opacity,
        alphaTest: source.alphaTest,
        side: THREE.DoubleSide,
        depthWrite: source.depthWrite,
        depthTest: source.depthTest
    });
    material.userData.technologyTier = tier;
    material.userData.facilityBaseEmissive = material.emissive.clone();
    material.userData.facilityBaseEmissiveIntensity = material.emissiveIntensity;
    return material;
}

function raiseFunctionalGeometry(mesh, factor) {
    const position = mesh.geometry?.getAttribute('position');
    if (!position || factor === 1) return;

    mesh.geometry = mesh.geometry.clone();
    const raisedPosition = mesh.geometry.getAttribute('position');
    mesh.geometry.computeBoundingBox();
    const baseZ = mesh.geometry.boundingBox.max.z;
    for (let index = 0; index < raisedPosition.count; index += 1) {
        const z = raisedPosition.getZ(index);
        raisedPosition.setZ(index, baseZ + ((z - baseZ) * factor));
    }
    raisedPosition.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
}

function addLandmarkEdgeGlow(mesh) {
    const geometry = new THREE.EdgesGeometry(mesh.geometry, 28);
    const material = new THREE.LineBasicMaterial({
        color: TECH_COLORS.edge,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
    });
    const edges = new THREE.LineSegments(geometry, material);
    edges.renderOrder = 8;
    mesh.add(edges);
}

function applyTechnologyMaterials(model) {
    model.children.forEach((object) => {
        const project = object.name === '中水双膜（本项目所在地）1';
        const landmark = HIGHLIGHT_LANDMARK_NODE_NAMES.has(object.name);
        const functional = isFunctionalNode(object.name) || landmark;
        const ground = GROUND_NODE_NAMES.has(object.name);
        const compensatePassiveLight = PASSIVE_LIGHT_COMPENSATION_NODE_NAMES.has(object.name);
        const tier = ground ? 'ground' : (project ? 'project' : (functional ? 'functional' : 'passive'));

        object.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            if (functional && !landmark) raiseFunctionalGeometry(child, project ? 1.08 : 1.045);
            const sources = Array.isArray(child.material) ? child.material : [child.material];
            const materials = sources.map((source) => {
                const material = createTechnologyMaterial(source, tier);
                if (compensatePassiveLight && tier === 'passive') {
                    material.emissiveIntensity = 0.24;
                    material.userData.facilityBaseEmissiveIntensity = material.emissiveIntensity;
                }
                return material;
            });
            child.material = Array.isArray(child.material) ? materials : materials[0];
            child.userData.technologyTier = tier;
            if (landmark) addLandmarkEdgeGlow(child);
        });
    });
}

function createTechnologyPlatform(box) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const diagonal = size.length();
    const thickness = Math.max(diagonal * 0.006, 0.001);
    const geometry = new THREE.BoxGeometry(size.x * 1.055, thickness, size.z * 1.055);
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x061a2d,
        emissive: 0x03101c,
        emissiveIntensity: 0.34,
        roughness: 0.26,
        metalness: 0.42,
        clearcoat: 0.42,
        clearcoatRoughness: 0.2
    });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(center.x, box.min.y - (thickness * 0.6), center.z);
    platform.receiveShadow = false;
    platform.renderOrder = -2;
    scene.add(platform);

    const boundary = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
            color: 0x178fcc,
            transparent: true,
            opacity: 0.58,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        })
    );
    boundary.position.copy(platform.position);
    boundary.renderOrder = 2;
    scene.add(boundary);

    const gridSize = Math.max(size.x, size.z) * 1.04;
    const grid = new THREE.GridHelper(gridSize, 34, 0x1a6389, 0x123954);
    grid.scale.x = size.x / Math.max(size.x, size.z);
    grid.scale.z = size.z / Math.max(size.x, size.z);
    grid.position.set(center.x, box.min.y + (diagonal * 0.0006), center.z);
    grid.material.transparent = true;
    grid.material.opacity = 0.13;
    grid.material.depthWrite = false;
    grid.renderOrder = 1;
    scene.add(grid);
}

function auditAndPolishMaterials(model) {
    const audit = {
        meshes: 0,
        materialSlots: 0,
        texturedSlots: 0,
        untexturedSlots: 0,
        missingUv: 0,
        invalidUvValues: 0,
        missingTextureImages: 0,
        unexpectedFlipY: 0,
        uvOutsideUnitRange: 0,
        passed: false
    };
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    model.traverse((child) => {
        if (!child.isMesh) return;
        audit.meshes += 1;
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
            if (!material) return;
            audit.materialSlots += 1;
            polishMaterial(material, maxAnisotropy);

            if (!material.map) {
                audit.untexturedSlots += 1;
                return;
            }

            audit.texturedSlots += 1;
            const uv = child.geometry.getAttribute('uv');
            if (!uv) {
                audit.missingUv += 1;
            } else {
                let outsideRange = false;
                for (let index = 0; index < uv.count; index += 1) {
                    const u = uv.getX(index);
                    const v = uv.getY(index);
                    if (!Number.isFinite(u) || !Number.isFinite(v)) audit.invalidUvValues += 1;
                    if (u < -0.001 || u > 1.001 || v < -0.001 || v > 1.001) outsideRange = true;
                }
                if (outsideRange) audit.uvOutsideUnitRange += 1;
            }

            const image = material.map.image;
            if (!image || !image.width || !image.height) audit.missingTextureImages += 1;
            if (material.map.flipY !== false) audit.unexpectedFlipY += 1;
        });
    });

    audit.passed = audit.missingUv === 0
        && audit.invalidUvValues === 0
        && audit.missingTextureImages === 0
        && audit.unexpectedFlipY === 0;

    window.__mainSite3d.materialAudit = audit;
    document.body.dataset.materialAudit = audit.passed ? 'passed' : 'failed';
    document.body.dataset.materialAuditDetail = [
        `meshes:${audit.meshes}`,
        `textured:${audit.texturedSlots}`,
        `untextured:${audit.untexturedSlots}`,
        `missingUv:${audit.missingUv}`,
        `missingImages:${audit.missingTextureImages}`,
        `invalidUv:${audit.invalidUvValues}`,
        `uvOutside:${audit.uvOutsideUnitRange}`
    ].join(',');

    return audit;
}

function getBoxView(box, mode) {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 0.0001);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitHeight = maxSize / (2 * Math.tan(fov / 2));
    const fitWidth = fitHeight / Math.max(camera.aspect, 0.7);
    const overviewMultiplier = window.innerWidth <= 900 ? 1.16 : 0.94;
    const multiplier = mode === 'overview' ? overviewMultiplier : (mode === 'top' ? 1.08 : 1.7);
    const distance = Math.max(fitHeight, fitWidth) * multiplier;

    let direction;
    if (mode === 'top') direction = new THREE.Vector3(0, 1, 0.0001).normalize();
    else if (mode === 'facility') direction = new THREE.Vector3(1.24, 0.8, 1.04).normalize();
    else direction = new THREE.Vector3(1.2, 0.92, 1.22).normalize();

    return {
        position: center.clone().add(direction.multiplyScalar(distance)),
        target: center,
        size
    };
}

function animateCamera(position, target, duration = 850) {
    state.cameraTween = {
        startedAt: performance.now(),
        duration,
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPosition: position.clone(),
        toTarget: target.clone()
    };
}

function focusBox(box, mode, duration = 850) {
    if (!box) return;
    const view = getBoxView(box, mode);
    const maxSize = Math.max(view.size.x, view.size.y, view.size.z, 0.0001);
    controls.minDistance = Math.max(maxSize * 0.08, 0.00005);
    controls.maxDistance = Math.max(maxSize * 7, 0.5);
    camera.up.set(0, mode === 'top' ? 0 : 1, mode === 'top' ? -1 : 0);
    camera.updateProjectionMatrix();
    animateCamera(view.position, view.target, duration);
}

function setActiveView(name) {
    document.querySelectorAll('[data-main-view]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.mainView === name);
    });
}

function showOverview(mode = 'overview') {
    clearFacilitySelection(true);
    focusBox(state.overviewBox, mode, 850);
    setActiveView(mode === 'top' ? 'top' : 'overview');
}

function updateCameraTween(time) {
    if (!state.cameraTween) return;
    const progress = Math.min(1, (time - state.cameraTween.startedAt) / state.cameraTween.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(state.cameraTween.fromPosition, state.cameraTween.toPosition, eased);
    controls.target.lerpVectors(state.cameraTween.fromTarget, state.cameraTween.toTarget, eased);
    if (progress >= 1) state.cameraTween = null;
}

function createFacilityMarker(facility) {
    if (!facilityLayer) return null;
    const meta = STATUS_META[facility.status];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'facility-marker';
    button.dataset.facilityId = facility.id;
    button.dataset.status = facility.status;
    button.setAttribute('aria-label', `${facility.name}，${meta.label}`);
    button.title = `${facility.name} · ${meta.label}`;
    button.innerHTML = `
        <span class="facility-marker-icon"><i data-lucide="${meta.icon}" aria-hidden="true"></i></span>
        <span class="facility-marker-copy">
            <span class="facility-marker-name">${facility.name}</span>
            <span class="facility-marker-state">${meta.label}</span>
        </span>
    `;
    button.addEventListener('click', () => selectFacility(facility, true));
    facilityLayer.appendChild(button);
    return button;
}

function cloneFacilityMaterials(facility) {
    facility.object.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const source = Array.isArray(child.material) ? child.material : [child.material];
        const clones = source.map((material) => {
            const clone = material.clone();
            clone.userData.facilityBaseEmissive = clone.emissive?.clone() || new THREE.Color(0x000000);
            clone.userData.facilityBaseEmissiveIntensity = clone.emissiveIntensity || 0;
            return clone;
        });
        child.material = Array.isArray(child.material) ? clones : clones[0];
        facilityMeshLookup.set(child, facility);
        facility.meshes.push(child);
    });
}

function addFacilityEdgeGlow(facility) {
    const project = facility.id === PROJECT_FACILITY_ID;
    facility.edgeLines = [];
    facility.meshes.forEach((mesh) => {
        const geometry = new THREE.EdgesGeometry(mesh.geometry, project ? 24 : 32);
        const material = new THREE.LineBasicMaterial({
            color: project ? TECH_COLORS.projectEdge : TECH_COLORS.edge,
            transparent: true,
            opacity: project ? 0.9 : 0.58,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        });
        const edges = new THREE.LineSegments(geometry, material);
        edges.renderOrder = 8;
        mesh.add(edges);
        facility.edgeLines.push(edges);
    });
}

function applyFacilityVisualState(facility, selected) {
    const project = facility.id === PROJECT_FACILITY_ID;
    facility.meshes.forEach((mesh) => {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
            if (!material.emissive?.isColor) return;
            material.emissive.setHex(project ? TECH_COLORS.projectEmissive : TECH_COLORS.functionalEmissive);
            material.emissiveIntensity = selected ? (project ? 0.2 : 0.16) : (project ? 0.13 : 0.09);
        });
    });
    facility.edgeLines?.forEach((edges) => {
        edges.material.opacity = selected ? 1 : (project ? 0.9 : 0.58);
        edges.material.color.setHex(selected ? TECH_COLORS.projectEdge : (project ? TECH_COLORS.projectEdge : TECH_COLORS.edge));
    });
    facility.marker?.classList.toggle('is-selected', selected);
}

function buildFacilities(model) {
    return FACILITY_DEFINITIONS.map((definition) => {
        const object = definition.nodeNames
            .map((name) => model.getObjectByName(name))
            .find(Boolean);
        if (!object) return null;

        const box = new THREE.Box3().setFromObject(object);
        const anchor = box.getCenter(new THREE.Vector3());
        anchor.y = box.max.y;
        const facility = {
            ...definition,
            object,
            box,
            anchor,
            meshes: [],
            marker: null
        };
        facility.marker = createFacilityMarker(facility);
        cloneFacilityMaterials(facility);
        addFacilityEdgeGlow(facility);
        applyFacilityVisualState(facility, false);
        return facility;
    }).filter(Boolean);
}

function updateFacilityMarkers() {
    if (!state.facilities.length) return;
    const placed = [];
    const mobile = window.innerWidth <= 900;
    const markerWidth = mobile ? 38 : 138;
    const markerHeight = mobile ? 38 : 38;
    const minX = mobile ? 24 : 72;
    const maxX = window.innerWidth - minX;
    const minY = mobile ? 118 : 166;
    const maxY = window.innerHeight - 66;

    state.facilities.forEach((facility) => {
        const marker = facility.marker;
        if (!marker) return;
        const point = facility.anchor.clone().project(camera);
        const inView = point.z > -1 && point.z < 1 && Math.abs(point.x) <= 1.1 && Math.abs(point.y) <= 1.1;
        if (!inView) {
            marker.style.display = 'none';
            return;
        }

        const rawX = THREE.MathUtils.clamp((point.x * 0.5 + 0.5) * window.innerWidth, minX, maxX);
        const rawY = THREE.MathUtils.clamp((-point.y * 0.5 + 0.5) * window.innerHeight, minY, maxY);
        const offsets = mobile
            ? [[0, 0], [0, -42], [0, 42], [-42, 0], [42, 0]]
            : [
                [0, 0], [0, -40], [0, 40],
                [-144, 0], [144, 0],
                [-144, -40], [144, -40],
                [-144, 40], [144, 40],
                [0, -80], [0, 80]
            ];
        let x = rawX;
        let y = rawY;

        for (const [offsetX, offsetY] of offsets) {
            const candidateX = THREE.MathUtils.clamp(rawX + offsetX, minX, maxX);
            const candidateY = THREE.MathUtils.clamp(rawY + offsetY, minY, maxY);
            const collision = placed.some((item) => (
                Math.abs(item.x - candidateX) < markerWidth * 0.9
                && Math.abs(item.y - candidateY) < markerHeight
            ));
            if (!collision) {
                x = candidateX;
                y = candidateY;
                break;
            }
        }

        marker.style.display = 'flex';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.zIndex = facility === state.selectedFacility ? '3' : '1';
        placed.push({ x, y });
    });
}

function removeSelectionHelper() {
    if (!state.selectionHelper) return;
    scene.remove(state.selectionHelper);
    state.selectionHelper.geometry.dispose();
    state.selectionHelper.material.dispose();
    state.selectionHelper = null;
}

function showFacilityInspector(facility) {
    if (!inspector) return;
    const meta = STATUS_META[facility.status];
    inspector.hidden = false;
    inspectorTitle.textContent = facility.name;
    inspectorKicker.textContent = facility.id === PROJECT_FACILITY_ID ? '本项目所在建筑' : '厂区功能建筑';
    inspectorStatus.textContent = meta.label;
    inspectorStatus.style.color = meta.cssColor;
    inspectorMetrics.innerHTML = facility.metrics.map(([label, value]) => (
        `<div><dt>${label}</dt><dd>${value}</dd></div>`
    )).join('');
    mappingNote.textContent = facility.verified
        ? `模型节点已核对 · ${facility.object.name}`
        : `当前节点“${facility.object.name}” · 位置或外形待建模复核`;
    enterLink.hidden = facility.id !== PROJECT_FACILITY_ID;
}

function clearFacilitySelection(hideInspector = true) {
    if (state.selectedFacility) applyFacilityVisualState(state.selectedFacility, false);
    state.selectedFacility = null;
    removeSelectionHelper();
    if (hideInspector && inspector) inspector.hidden = true;
}

function setAutoRotate(enabled) {
    controls.autoRotate = enabled;
    if (!autoRotateButton) return;
    autoRotateButton.classList.toggle('is-active', enabled);
    autoRotateButton.setAttribute('aria-label', enabled ? '关闭自动旋转' : '开启自动旋转');
}

function selectFacility(facility, moveCamera = true) {
    if (!facility) return;
    clearFacilitySelection(false);
    state.selectedFacility = facility;
    applyFacilityVisualState(facility, true);
    setAutoRotate(false);

    state.selectionHelper = new THREE.Box3Helper(
        facility.box,
        facility.id === PROJECT_FACILITY_ID ? TECH_COLORS.projectEdge : TECH_COLORS.edge
    );
    state.selectionHelper.material.depthTest = false;
    state.selectionHelper.material.transparent = true;
    state.selectionHelper.material.opacity = 0.38;
    state.selectionHelper.renderOrder = 12;
    scene.add(state.selectionHelper);

    showFacilityInspector(facility);
    setActiveView(facility.id === PROJECT_FACILITY_ID ? 'project' : 'facility');
    if (moveCamera) focusBox(facility.box, 'facility', 760);
}

function performPixelCheck() {
    const gl = renderer.getContext();
    const width = Math.min(96, gl.drawingBufferWidth);
    const height = Math.min(96, gl.drawingBufferHeight);
    const pixels = new Uint8Array(width * height * 4);
    const x = Math.max(0, Math.floor((gl.drawingBufferWidth - width) / 2));
    const y = Math.max(0, Math.floor((gl.drawingBufferHeight - height) / 2));
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let brightPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 240) brightPixels += 1;
    }

    const result = {
        samplePixels: width * height,
        brightPixels,
        passed: brightPixels > 24 && renderer.info.render.triangles > 0
    };
    window.__mainSite3d.pixelCheck = result;
    document.body.dataset.mainCanvasPixelCheck = result.passed ? 'passed' : 'failed';
    document.body.dataset.mainCanvasBrightPixels = String(brightPixels);
    state.pixelCheckPassed = result.passed;
}

function finalizeModel(model) {
    const audit = auditAndPolishMaterials(model);
    applyTechnologyMaterials(model);
    state.overviewBox = normalizeModel(model);
    state.root = model;

    scene.add(model);
    state.facilities = buildFacilities(model);
    createTechnologyPlatform(state.overviewBox);

    const size = state.overviewBox.getSize(new THREE.Vector3());
    const diagonal = size.length();
    camera.near = Math.max(diagonal / 6000, 0.00001);
    camera.far = Math.max(diagonal * 16, 20);
    camera.updateProjectionMatrix();
    scene.fog = new THREE.Fog(TECH_COLORS.fog, diagonal * 2.8, diagonal * 7.4);

    window.__mainSite3d.ready = true;
    window.__mainSite3d.objectCount = model.children.length;
    window.__mainSite3d.meshCount = audit.meshes;
    window.__mainSite3d.facilityCount = state.facilities.length;
    window.__mainSite3d.facilities = state.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        nodeName: facility.object.name,
        status: facility.status,
        verified: facility.verified
    }));
    window.__mainSite3d.loadDurationMs = Math.round(performance.now() - state.loadStartedAt);

    document.body.dataset.mainSceneObjects = String(model.children.length);
    document.body.dataset.mainSceneMeshes = String(audit.meshes);
    document.body.dataset.mainFacilityCount = String(state.facilities.length);
    document.body.classList.add('main-scene-ready');

    if (window.lucide) window.lucide.createIcons();
    showOverview('overview');
    const inspectionName = new URLSearchParams(window.location.search).get('inspectNode');
    const inspectionObject = inspectionName && model.getObjectByName(inspectionName);
    if (inspectionObject) {
        focusBox(new THREE.Box3().setFromObject(inspectionObject), 'facility');
        const material = Array.isArray(inspectionObject.material)
            ? inspectionObject.material[0]
            : inspectionObject.material;
        document.body.dataset.mainInspectedNode = inspectionObject.name;
        document.body.dataset.mainInspectedTier = inspectionObject.userData.technologyTier || '';
        document.body.dataset.mainInspectedColor = material?.color?.getHexString() || '';
        document.body.dataset.mainInspectedTextured = String(Boolean(material?.map));
    }
    window.dispatchEvent(new CustomEvent('main-site-model-ready', { detail: window.__mainSite3d }));
}

async function fetchModelParts() {
    const buffers = [];
    let loadedBytes = 0;

    for (let index = 0; index < MODEL_PART_URLS.length; index += 1) {
        if (loadingLabel) {
            loadingLabel.textContent = `正在下载厂区模型 ${index + 1}/${MODEL_PART_URLS.length}`;
        }
        const response = await fetch(MODEL_PART_URLS[index]);
        if (!response.ok) {
            throw new Error(`模型分片请求失败：${response.status} ${MODEL_PART_URLS[index]}`);
        }
        const buffer = await response.arrayBuffer();
        buffers.push(buffer);
        loadedBytes += buffer.byteLength;
        updateLoading({ loaded: loadedBytes, total: 111576344 });
    }

    const merged = new Uint8Array(loadedBytes);
    let offset = 0;
    buffers.forEach((buffer) => {
        merged.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    });
    return merged.buffer;
}

function handleModelLoadError(error, attempt) {
    if (attempt < MAX_MODEL_LOAD_RETRIES) {
        if (loadingLabel) {
            loadingLabel.textContent = `模型请求失败，正在重试 ${attempt + 1}/${MAX_MODEL_LOAD_RETRIES}`;
        }
        window.setTimeout(() => loadModel(attempt + 1), 1200);
        return;
    }
    setLoadError(error);
}

function loadModel(attempt = 0) {
    const loader = new GLTFLoader();
    fetchModelParts()
        .then((buffer) => {
            if (loadingLabel) loadingLabel.textContent = '正在解析厂区模型';
            loader.parse(
                buffer,
                '',
                (gltf) => finalizeModel(gltf.scene),
                (error) => handleModelLoadError(error, attempt)
            );
        })
        .catch((error) => handleModelLoadError(error, attempt));
}

function getFacilityAtPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = state.facilities.flatMap((facility) => facility.meshes);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit ? facilityMeshLookup.get(hit.object) || null : null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
    state.pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
    if (!state.pointerDown) return;
    const distance = Math.hypot(event.clientX - state.pointerDown.x, event.clientY - state.pointerDown.y);
    state.pointerDown = null;
    if (distance > 6) return;
    const facility = getFacilityAtPointer(event);
    if (facility) selectFacility(facility, true);
});

renderer.domElement.addEventListener('pointermove', (event) => {
    if (event.buttons) return;
    renderer.domElement.style.cursor = getFacilityAtPointer(event) ? 'pointer' : 'grab';
});

function animate(time) {
    updateCameraTween(time);
    controls.update();
    updateFacilityMarkers();
    renderer.render(scene, camera);

    if (window.__mainSite3d.ready) {
        window.__mainSite3d.render = {
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            pixelRatio: renderer.getPixelRatio(),
            width: renderer.domElement.width,
            height: renderer.domElement.height
        };
        document.body.dataset.mainRenderCalls = String(renderer.info.render.calls);
        document.body.dataset.mainRenderTriangles = String(renderer.info.render.triangles);
        if (!state.cameraTween && !state.pixelCheckPassed) performPixelCheck();
    }
}

renderer.setAnimationLoop(animate);

document.querySelectorAll('[data-main-view]').forEach((button) => {
    button.addEventListener('click', () => {
        const view = button.dataset.mainView;
        if (view === 'project') selectFacility(
            state.facilities.find((facility) => facility.id === PROJECT_FACILITY_ID),
            true
        );
        else showOverview(view);
    });
});

if (inspectorClose) inspectorClose.addEventListener('click', () => clearFacilitySelection(true));

if (autoRotateButton) {
    autoRotateButton.addEventListener('click', () => setAutoRotate(!controls.autoRotate));
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (state.selectedFacility) {
        focusBox(state.selectedFacility.box, 'facility', 360);
    } else if (state.overviewBox) {
        const activeView = document.querySelector('[data-main-view].is-active')?.dataset.mainView;
        showOverview(activeView === 'top' ? 'top' : 'overview');
    }
    state.pixelCheckPassed = false;
});

loadModel();
