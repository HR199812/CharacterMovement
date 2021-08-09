import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Delta Time variable to update animations smoothly
const clock = new THREE.Clock();

// Variables for scene, camera, lights models, controls, character, characterAnimationClips
let camera, scene, renderer, skeleton, orbitControls, cameraTRBL = 100, cameraMapSize = 2048, cameraNear = 0.5,
    character, characterRotation, rotationCheck, actions = [], mixer, prevAction, hemiLight, dirlight, ambientLight;

// Character Animation Model
var charAnimationsObj = {
    dance: null,
    box: null,
    block: null,
    walk: null,
    run: null,
    idle: null,
    crouch: null,
    wave: null
};

// Array To store models name for referencing in various calls
let animationModels = ['Boxing', 'Idle', 'Jump', 'Waving',
    'Running', 'Silly Dancing', 'Walking', 'Block', 'Standing to Crouch'];

// Fixed path of Character Resources
const resourcePath = './CharacterResources/';

initScene();
initRenderer();
await loadModels();
animate();

// Function to load character and it's related animations
async function loadModels() {
    character = new FBXLoader();

    character.setPath(resourcePath);
    character.load('ybot.fbx', (fbx) => {

        characterRotation = fbx;

        mixer = new THREE.AnimationMixer(fbx);

        fbx.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = false;
        });


        skeleton = new THREE.SkeletonHelper(fbx);
        skeleton.visible = true;
        scene.add(skeleton);


        character.load('Idle.fbx', function (anim) {

            mixer.clipAction(anim.animations[0]).play();
            prevAction = mixer.clipAction(anim.animations[0]);

            actions.push({ anim, mixer });


            anim.traverse(function (child) {

                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });
        });


        loadNextAnimation();


        scene.add(fbx);

    });
}

// Function to load all the animations of the character
function loadNextAnimation() {
    for (let i = 0; i < animationModels.length; i++) {

        character.load(`${animationModels[i]}.fbx`, function (anim) {


            mixer.clipAction(anim.animations[0]);

            if (animationModels[i] === 'Boxing') charAnimationsObj.box = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Block') charAnimationsObj.block = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Standing to Crouch') charAnimationsObj.crouch = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Silly Dancing') charAnimationsObj.dance = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Walking') charAnimationsObj.walk = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Jump') charAnimationsObj.jump = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Running') charAnimationsObj.run = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Waving') charAnimationsObj.wave = mixer.clipAction(anim.animations[0]);
            else if (animationModels[i] === 'Idle') charAnimationsObj.idle = mixer.clipAction(anim.animations[0]);
            actions.push(anim);

            anim.traverse(function (child) {

                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });
        });
    }
}

// Function to render the 3d World
function initRenderer() {

    renderer = new THREE.WebGLRenderer({ antialiasing: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.3;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.enableZoom = true;
    orbitControls.zoomSpeed = 1.15;
    orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 0;
    orbitControls.maxDistance = 45000;
    orbitControls.minPolarAngle = -Math.PI / 1.5;
    orbitControls.maxPolarAngle = Math.PI / 2.5;
    orbitControls.update();
}

// Function to initialise 3d World
function initScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    scene.fog = new THREE.FogExp2(0xbfd1e5, 0.0015);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-180, 250, -150);

    dirlight = new THREE.DirectionalLight(0xd3d3d3, 1);
    dirlight.position.set(100, 100, 10);
    dirlight.target.position.set(0, 0, 0);
    dirlight.castShadow = true;
    dirlight.shadow.mapSize.width = cameraMapSize;
    dirlight.shadow.mapSize.height = cameraMapSize;
    // dirlight.shadow.camera.near = 0.1;
    // dirlight.shadow.camera.far = 500.0;
    dirlight.shadow.camera.near = cameraNear;
    dirlight.shadow.camera.far = cameraNear * 1000;
    dirlight.shadow.camera.left = cameraTRBL;
    dirlight.shadow.camera.right = -cameraTRBL;
    dirlight.shadow.camera.top = cameraTRBL;
    dirlight.shadow.camera.bottom = -cameraTRBL;

    scene.add(dirlight);

    ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0xbfd1e5, 0xFFFFFF, 1);
    hemiLight.color.setHSL(0.8, 0.8, 0.8);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(100, 100, 10);
    scene.add(hemiLight);


    // Ground
    const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(15000, 15000),
        new THREE.MeshPhongMaterial({ color: 0xFFFFFF, wireframe: false, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    scene.add(mesh);

    const gridHelper = new THREE.GridHelper(15000, 100, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    window.addEventListener('resize', onWindowResize);
}


// Animate each and every frame with each and every change
function animate() {

    // mixer.forEach((mixer) => {

    //     mixer.update(clock.getDelta());
    // });

    if (mixer) mixer.update(clock.getDelta());

    requestAnimationFrame(animate);

    orbitControls.update();
    renderer.render(scene, camera);
}

// Called when window is resized and update the view with window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Swtich from Previous to Next Animation
function PlayNextAnimation(param) {

    // mixer.stopAllAction();

    // console.log(skeleton['bones']);


    const action = param;

    action.weight = 1;
    action.fadein = 1;

    prevAction.crossFadeTo(action, .5);

    action.play();

    // action.weight = 0;
    // action.fadeout = 1;
    prevAction = action;

}

// Keyboard Key Click/Release Events
window.addEventListener('keydown', (e) => {


    if (e.key === 'w') {
        if(rotationCheck === 360) {
            characterRotation.rotation.y = -360;
            PlayNextAnimation(charAnimationsObj.walk);
        }
        else PlayNextAnimation(charAnimationsObj.walk);
    }
    if (e.key === 's') {
        // Character rotation to be implemented
        rotationCheck = characterRotation.rotation.y = 360;

        PlayNextAnimation(charAnimationsObj.walk);
    }
    if (e.key === 'q') {
        PlayNextAnimation(charAnimationsObj.dance);
    }
    if (e.key === 'e') {
        PlayNextAnimation(charAnimationsObj.idle);
    }
    if (e.key === 'c') {
        PlayNextAnimation(charAnimationsObj.wave);
    }
    if (e.key === ' ') {
        PlayNextAnimation(charAnimationsObj.jump);
    }
    // if (e.key === 'Shift' && (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd')) {
    if (e.key === 'Shift') {
        PlayNextAnimation(charAnimationsObj.run);
    }
    if (e.key === 'Control') {
        PlayNextAnimation(charAnimationsObj.crouch);
    }
});
// window.addEventListener('keyup', (e) => {
//     if (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd') {

//     }
//     if (e.key === 'q') {
//     }
// });

// Mouse Click/Release Events
window.addEventListener('mousedown', (e) => {
    if(e.button === 0){
        PlayNextAnimation(charAnimationsObj.box);
    }
    else if(e.button === 2){
        PlayNextAnimation(charAnimationsObj.block);
    }
});
// window.addEventListener('mouseup', (e) => {
// });