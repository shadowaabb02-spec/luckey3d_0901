// 1. 获取刚刚在 HTML 里留出的空地
const container = document.getElementById('canvas-container');

// 2. 创建 3D 场景
const scene = new THREE.Scene();

// 3. 创建相机 (视角角度, 屏幕宽高比, 最近可见距离, 最远可见距离)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 设置相机在空间中的位置 (x左右, y上下, z前后)
camera.position.set(0, 12, 35); // Y抬高到12，Z拉远到35 

// 4. 创建渲染器 (抗锯齿开启，背景设为透明以露出 CSS 的网格背景)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// 5. 打光 (没有光，模型就是黑的)
// 环境光：给整个场景一个基础亮度
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
scene.add(ambientLight);
// 平行光：模拟太阳光，让设备产生立体阴影
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// 6. 召唤你的核心资产：加载 GLB 模型
const loader = new THREE.GLTFLoader();
loader.load('models/device.glb', function (gltf) {
    const model = gltf.scene;
    
    // 1. 先让模型“站”起来
    model.rotation.x = Math.PI / 2; 
    
    // 🌟 2. 魔法居中代码：自动计算整个厂房的包围盒中心，并强制拉回屏幕正中央 🌟
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    
    // 抵消偏移量（把它实际的中心点挪到坐标原点）
    model.position.x = -center.x;
    model.position.y = -center.y;
    // Y轴(上下)稍微往下沉一点点，留出视觉空间，可以根据你的喜好调这个数字
    model.position.z = -center.z - 2; 
    
    // 3. 缩放比例 (如果模型铺满屏幕看不全，把这三个 1 改成 0.5 或者 0.1 试试)
    model.scale.set(1, 1, 1); 
    
    scene.add(model);
    console.log("模型加载成功，并且已经完美居中！");
}, undefined, function (error) {
    console.error('模型加载失败:', error);
});

// 7. 加入鼠标交互 (旋转、缩放、平移)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 开启阻尼效果
controls.dampingFactor = 0.05; // 让鼠标拖拽模型时有丝滑的惯性

// 8. 动画渲染循环 (让画面一帧一帧动起来)
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 配合丝滑惯性必须加这句
    renderer.render(scene, camera);
}
animate();

// 9. 窗口自适应 (当浏览器放大缩小时，3D画布跟着自适应)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
// ==================== 以下为新增的第 6 步：射线点击交互 ====================

// 1. 准备射线检测器和鼠标位置向量
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 2. 监听鼠标点击事件
window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    // 将鼠标的屏幕坐标转换成 Three.js 能认识的归一化坐标 (-1 到 +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(mouse, camera);

    // 计算射线和场景中所有物体的交点 (true 表示检测模型内部的所有子零件)
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // intersects[0] 就是离我们鼠标最近（被点中）的那个零件
        const clickedObject = intersects[0].object;
        
        console.log("你点击了零件：", clickedObject.name);

        // 给被点击的零件加个高光效果（让它短暂变亮变青色）
        if(clickedObject.material) {
            // 备份原来的颜色
            const originColor = clickedObject.material.color.getHex();
            // 变成青色高光
            clickedObject.material.color.setHex(0x00f3ff); 
            
            // 弹出一个科技感的网页提示框
            // 注意：真实项目中这里会显示该设备的真实传感器数据，我们先用弹窗模拟
            alert(`【设备交互响应】\n您点击了设备部件: ${clickedObject.name || '未知管道/罐体'}\n当前状态: 运行正常\n实时温度: ${(20 + Math.random()*5).toFixed(1)} ℃`);
            
            // 1秒后颜色恢复原样
            setTimeout(() => {
                clickedObject.material.color.setHex(originColor);
            }, 1000);
        }
    }
}