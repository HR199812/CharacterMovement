import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

var camera, scene, renderer, skeleton, orbitControls, actions = [], mixer ,idle;

var animationModels = ['Boxing.fbx', 'Breathing Idle.fbx', 'Jump.fbx',
    'Running.fbx', 'Silly Dancing.fbx', 'Start Walking.fbx'];
var clipActionModel = [];

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-180, 250, -150);

    let dirlight = new THREE.DirectionalLight(0xd3d3d3, 1);
    dirlight.position.set(20, 100, 10);
    dirlight.target.position.set(0, 0, 0);
    dirlight.castShadow = true;
    dirlight.shadow.mapSize.width = 2048;
    dirlight.shadow.mapSize.height = 2048;
    dirlight.shadow.camera.near = 0.1;
    dirlight.shadow.camera.far = 500.0;
    dirlight.shadow.camera.near = 0.5;
    dirlight.shadow.camera.far = 500.0;
    dirlight.shadow.camera.left = 100;
    dirlight.shadow.camera.right = -100;
    dirlight.shadow.camera.top = 100;
    dirlight.shadow.camera.bottom = -100;

    scene.add(dirlight);

    // var ambientLight = new THREE.AmbientLight(0xFFFFFF, 3);
    // scene.add(ambientLight);

    let hemiLight = new THREE.HemisphereLight(0xd3d3d3, 0xFFFFFF, 1);
    hemiLight.color.setHSL(0.6, 0.6, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);


    // Ground
    const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(15000, 15000),
        new THREE.MeshPhongMaterial({ color: 0xFFFFFF, wireframe: false, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const gridHelper = new THREE.GridHelper(15000, 100, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);


    let character = new FBXLoader();
    character.load('./CharacterResources/ybot.fbx', (fbx) => {

        mixer = new THREE.AnimationMixer(fbx);

        fbx.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = false;
        });


        skeleton = new THREE.SkeletonHelper(fbx);
        skeleton.visible = true;
        scene.add(skeleton);


        character.load('./CharacterResources/Breathing Idle.fbx', function (anim) {

            mixer.clipAction(anim.animations[0]).play();
            idle = mixer.clipAction(anim.animations[0]);
            
            actions.push({ anim, mixer });


            anim.traverse(function (child) {

                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });
        });


        for (let i = 0; i < animationModels.length; i++) {

            character.load(`./CharacterResources/${animationModels[i]}`, function (anim) {

                mixer.clipAction(anim.animations[0]);
                clipActionModel.push(mixer.clipAction(anim.animations[0]));
                actions.push({ anim, mixer });

                anim.traverse(function (child) {

                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });
            });
        }


        scene.add(fbx);

    });


    renderer = new THREE.WebGLRenderer({ antialiasing: true });
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.3;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.enableZoom = true;
    orbitControls.zoomSpeed = 1.15;
    // orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 0;
    orbitControls.maxDistance = 45000;
    orbitControls.minPolarAngle = -Math.PI / 1.5;
    orbitControls.maxPolarAngle = Math.PI / 2.5;
    orbitControls.update();

    animate();
}

const clock = new THREE.Clock();

function animate() {

    actions.forEach(({ mixer }) => { mixer.update(clock.getDelta()); });

    requestAnimationFrame(animate);

    orbitControls.update();
    renderer.render(scene, camera);
}

init();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);


function PlayNextAnimation(param) {

    const currentClip = mixer.existingAction(mixer.clipAction);

    console.log(currentClip);

    mixer.stopAllAction();
        
    const action = actions[param];
    
    // idle.crossFadeTo(mixer.clipAction(action["anim"].animations[0]), .5)
    clipActionModel[param].crossFadeTo(mixer.clipAction(action["anim"].animations[0]), .5)

    mixer.weight = 1;
    mixer.fadein = 1;
    mixer.clipAction(action["anim"].animations[0]).play();
}

// function backToIdleState(){
//     mixer.stopAllAction();
//     const action = actions[5];
//     mixer.weight = 1;
//     mixer.clipAction(action["anim"].animations[0]).play();
// }

window.addEventListener('keydown', (e) => {
    console.log(e.key);
    if (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd') {
        PlayNextAnimation(4);
    }
    if (e.key === 'q') {
        PlayNextAnimation(3);
    }
    if (e.key === 'e') {
        PlayNextAnimation(5);
    }
    if (e.key === ' ') {
        PlayNextAnimation(2);
    }
    if (e.key === 'Shift' && (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd')) {
        PlayNextAnimation(0);
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd') {

    }
    if (e.key === 'q') {
    }
});

window.addEventListener('mousedown', (e) => {
    PlayNextAnimation(1);
});
window.addEventListener('mouseup', (e) => {
});