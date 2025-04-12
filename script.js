import * as THREE from './js/three.module.js'
import { OrbitControls } from './js/OrbitControls.js'
import { GLTFLoader } from './js/GLTFLoader.js';
import { RGBELoader } from './js/RGBELoader.js';
import { CharacterControls } from './CharacterControls.js';
import * as CANNON from './js/cannon-es.js'
import { FBXLoader } from "./js/FBXLoader.js"
import { MarchingCubes } from './js/MarchingCubes.js';

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var renderer, scene, camera, orbitcontrols, world;
var clock = new THREE.Clock();
var characterControls;
var CharacterBody;
//保存按键wasd的
const keysPressed = {}
// const keyDisplayQueue = new KeyDisplay();
var jumpNumber = 0;
const jumpSpeed = 1;
init();


if (!IsPhone()) {
    window.document.getElementById("test").style.display = "none";
    window.document.getElementById("test1").style.display = "none";
    window.document.getElementsByClassName("div1")[0].style.display = "none";
    window.document.getElementsByClassName("div2")[0].style.display = "none";
    window.document.getElementsByClassName("div3")[0].style.display = "none";
}


window.document.getElementById("test").addEventListener('touchstart', () => {
    jumpNumber = 1;
})
window.document.getElementById("test").addEventListener('touchend', () => {
    jumpNumber = 0;
})
window.document.getElementById("test1").addEventListener('touchstart', () => {
    jumpNumber = 2;
})

window.document.getElementById("test1").addEventListener('touchend', () => {
    jumpNumber = 0;
})





// 创建 MarchingCubes 对象
const resolution = 60;
const effect = new MarchingCubes(
    resolution,
    new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }), // 灰色材质
    true, true, 10000000
);

effect.position.set(0, 70, 0);
effect.scale.set(60, 60, 60);

// 先调用 reset 初始化 field 数组
effect.reset();

// 生成云状数据模型（Perlin Noise）
function generateNoiseField(resolution, scale) {
    const field = new Float32Array(resolution * resolution * resolution);
    const noise = new SimplexNoise();

    const centerX = resolution / 2;
    const centerY = resolution / 2;
    const centerZ = resolution / 2;

    for (let x = 0; x < resolution; x++) {
        for (let y = 0; y < resolution; y++) {
            for (let z = 0; z < resolution; z++) {
                // 计算噪声值
                const nx = x / scale;
                const ny = y / scale;
                const nz = z / scale;

                // 用 SimplexNoise 生成一个平滑噪声值
                const noiseValue = noise.noise3D(nx, ny, nz);

                // 将噪声值映射到合理的范围
                field[x + y * resolution + z * resolution * resolution] = noiseValue;
            }
        }
    }
    return field;
}

// 使用生成的噪声数据填充 MarchingCubes 的 field
const noiseField = generateNoiseField(resolution, 30); // 10 是缩放系数，用于调整噪声的细节
effect.field = noiseField;

// 设置阈值并更新
effect.isolation = 0.8;  // 设定适当的隔离值来展示云状
effect.update(); // 调用 update 生成几何体

// 添加 MarchingCubes 到场景
scene.add(effect);

// 添加深度拖动条容器
const sliderContainer = document.createElement('div');
sliderContainer.id = 'slider-container';
sliderContainer.style.position = 'absolute';
sliderContainer.style.top = '20px';
sliderContainer.style.left = '20px';
sliderContainer.style.zIndex = 1;
sliderContainer.style.color = 'white';
sliderContainer.style.display = 'flex';
sliderContainer.style.alignItems = 'center';
sliderContainer.style.gap = '10px';
document.body.appendChild(sliderContainer);

// 深度文字
const depthLabel = document.createElement('span');
depthLabel.textContent = '深度';
sliderContainer.appendChild(depthLabel);

// 当前值显示
const depthValue = document.createElement('span');
depthValue.textContent = '0.10'; // 初始值
sliderContainer.appendChild(depthValue);

// 深度滑块
const slider = document.createElement('input');
slider.type = 'range';
slider.min = 0.0;
slider.max = 1.0;
slider.step = 0.01;
slider.value = 0.1;
slider.style.width = '300px';

slider.addEventListener('input', () => {
    const value = parseFloat(slider.value);
    depthValue.textContent = value.toFixed(2); // 更新当前值显示
    effect.isolation = value;
    const r = 128 + (255 - 128) * value;
    const g = 128 * (1 - value);
    const b = 128 * (1 - value);
    const newColor = new THREE.Color(r / 255, g / 255, b / 255);
    effect.material.color = newColor;
    effect.update();
});

sliderContainer.appendChild(slider);

// 最小值文本和输入框
const minLabel = document.createElement('span');
minLabel.textContent = '最小值:';
sliderContainer.appendChild(minLabel);

const minInput = document.createElement('input');
minInput.type = 'number';
minInput.value = slider.min;
minInput.step = 0.01;
minInput.style.width = '60px';
minInput.addEventListener('change', () => {
    slider.min = parseFloat(minInput.value);
});
sliderContainer.appendChild(minInput);

// 最大值文本和输入框
const maxLabel = document.createElement('span');
maxLabel.textContent = '最大值:';
sliderContainer.appendChild(maxLabel);

const maxInput = document.createElement('input');
maxInput.type = 'number';
maxInput.value = slider.max;
maxInput.step = 0.01;
maxInput.style.width = '60px';
maxInput.addEventListener('change', () => {
    slider.max = parseFloat(maxInput.value);
});
sliderContainer.appendChild(maxInput);



// ========== 透明度滑块 ==========

const sliderContainer1 = document.createElement('div');
sliderContainer1.id = 'slider-container1';
sliderContainer1.style.position = 'absolute';
sliderContainer1.style.top = '60px';
sliderContainer1.style.left = '20px';
sliderContainer1.style.zIndex = 1;
sliderContainer1.style.color = 'white';
sliderContainer1.style.display = 'flex';
sliderContainer1.style.alignItems = 'center';
sliderContainer1.style.gap = '10px';
document.body.appendChild(sliderContainer1);

const opacityLabel = document.createElement('span');
opacityLabel.textContent = '透明度';
sliderContainer1.appendChild(opacityLabel);

const opacityValue = document.createElement('span');
opacityValue.textContent = '0.10';
sliderContainer1.appendChild(opacityValue);

const slider1 = document.createElement('input');
slider1.type = 'range';
slider1.min = 0.0;
slider1.max = 1.0;
slider1.step = 0.01;
slider1.value = 0.1;
slider1.style.width = '300px';

slider1.addEventListener('input', () => {
    const value = parseFloat(slider1.value);
    opacityValue.textContent = value.toFixed(2); // 显示当前值
    effect.material.opacity = value;
});

sliderContainer1.appendChild(slider1);





animate();
function animate() {

    if (jumpNumber == 1) {
        CharacterBody.position.y += jumpSpeed;
    } else if (jumpNumber == 2) {
        CharacterBody.position.y -= jumpSpeed;
    }

    let deltaTime = clock.getDelta();

    if (orbitcontrols) orbitcontrols.update()
    if (characterControls) {
        characterControls.update(deltaTime, keysPressed);
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);



}

document.addEventListener('keydown', (event) => {
    if (event.code == "Space") {
        jumpNumber = 1;
    } else if (event.shiftKey) {
        jumpNumber = 2;
    } else if (event.ctrlKey && characterControls) {
        characterControls.switchRunToggle()
    } else {
        keysPressed[event.key.toLowerCase()] = true
        // console.log(keysPressed)


    }
}, false);
document.addEventListener('keyup', (event) => {
    // keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false
    // console.log(keysPressed)
    jumpNumber = 0;
}, false);


function init() {
    // initStats()
    initRenderer();
    initScene();
    initLights();
    initCamera();
    initControls();
    // initHelp();
    generateFloor();
    initGlb();
}


function initRenderer() {
    var container = document.getElementById('container');
    renderer = new THREE.WebGLRenderer({ antialias: true }); //alpha: true, logarithmicDepthBuffer: true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true
    renderer.setSize(WIDTH, HEIGHT);
    container.appendChild(renderer.domElement);
}

function initScene() {
    scene = new THREE.Scene();
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('./imgs/');
    let cubeTexture = cubeTextureLoader.load([
        '2.png', '3.png',
        '4.png', '5.png',
        '0.png', '1.png'
    ]);
    scene.background = cubeTexture;

    //加载hdr
    new RGBELoader()
        .setPath('./imgs/')
        .load('kloppenheim_12.hdr', function (texture) {

            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;

        });
    //启动物理引擎
    world = new CANNON.World();
    world.gravity.set(0, -9.8, 0);//9.8重力加速度
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 1000);
    // 确定相机位置 并将相机指向场景中心
    camera.position.x = 0;
    camera.position.y = 10;
    camera.position.z = -6;
}

function initControls() {
    orbitcontrols = new OrbitControls(camera, renderer.domElement);
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    orbitcontrols.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度
    //controls.dampingFactor = 0.25;
    //是否可以缩放
    orbitcontrols.enableZoom = true;
    //是否自动旋转
    // orbitcontrols.autoRotate = true;
    // orbitcontrols.autoRotateSpeed = 0.5;
    //设置相机距离原点的最远距离
    orbitcontrols.minDistance = 8;
    //设置相机距离原点的最远距离
    orbitcontrols.maxDistance = 100
    //是否开启右键拖拽
    orbitcontrols.enablePan = false;
    orbitcontrols.maxPolarAngle = Math.PI / 2 - 0;
    //orbitcontrols.minPolarAngle = Math.PI / 2 - 0.8;
    orbitcontrols.target = new THREE.Vector3(0, 1, 0)
    orbitcontrols.addEventListener('change', () => {
        orbitcontrols.minDistance = 0;
    });
}

function initLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(- 60, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
}

/**
 * 加载地板
 */
function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load("./imgs/city.jpg");

    const WIDTH = 320
    const LENGTH = 320

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 300, 300);
    geometry.setAttribute("uv2", new THREE.BufferAttribute(geometry.attributes.uv.array, 2))
    const material = new THREE.MeshPhongMaterial(
        {
            map: sandBaseColor,
            emissive: 0x000000
        })
    // wrapAndRepeatTexture(material.map)


    const floor = new THREE.Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI / 2
    scene.add(floor)
    floor.position.y = -10;
}

function wrapAndRepeatTexture(map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 30
}

/**
 * 加载机器人
 */
function initGlb() {
    const loader = new GLTFLoader();
    loader.load('model/Soldier.glb', function (gltf) {
        const model = gltf.scene;
        model.traverse(function (object) {
            if (object.isMesh) {
                object.castShadow = true;
            }
        });
        model.rotation.y += Math.PI
        //scene.add(model);
        const gltfAnimations = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })

        // 创建物理世界的物体
        const characterBody = new CANNON.Body({
            shape: new CANNON.Cylinder(0.4, 0.4, 1),
            //三维坐标
            position: new CANNON.Vec3(0, 2, 0),//三维坐标
            //   小球质量
            mass: 10,
            //   物体材质
            material: new CANNON.Material({ friction: 0.1, restitution: 0 }),
        });
        model.userData = characterBody;
        // 将物体添加至物理世界
        world.addBody(characterBody);
        CharacterBody = characterBody;
        characterControls = new CharacterControls(characterBody, mixer, animationsMap, orbitcontrols, camera, 'Idle', model); //Idle
        model.position.copy(characterBody.position);
    })
}
window.addEventListener('resize', function () {
    let w = window.innerWidth;
    let h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}, false);
window.addEventListener("orientationchange", function () {
    let w = window.innerWidth;
    let h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function IsPhone() {
    //获取浏览器navigator对象的userAgent属性（浏览器用于HTTP请求的用户代理头的值）
    var info = navigator.userAgent;
    //通过正则表达式的test方法判断是否包含“Mobile”字符串
    var isPhone = /mobile/i.test(info);
    //如果包含“Mobile”（是手机设备）则返回true
    return isPhone;
}
