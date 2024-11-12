import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// Delta Time variable to update animations smoothly
const clock = new THREE.Clock();

// Variables for scene, camera, lights models, controls, character, characterAnimationClips
let camera, scene, renderer, skeleton, orbitControls, cameraTRBL = 100, cameraMapSize = 2048, cameraNear = 0.5,
    character, characterRotation, rotationCheck, actions = [], mixer, prevAction, currentAction, hemiLight, dirlight, ambientLight, stats;

let theta = 0;
let phi = 0;
const radius = 300; // Adjust radius based on your scene

const crossFadeControls = [];
let panel;
let panelSettings;
const baseActions = {
    idle: { weight: 1 },
    walk: { weight: 0 },
    run: { weight: 0 }
};
const additiveActions = {
    dance: { weight: 0 },
    box: { weight: 0 },
    block: { weight: 0 },
    crouch: { weight: 0 },
    wave: { weight: 0 }
};

// Character Animation Model
var charAnimationsObj = {
    test: null
};

const keyStates = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    control: false
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

    character.load('Idle.fbx', (fbx) => {
        characterRotation = fbx;
        scene.add(fbx);
        // Initialize the animation mixer with the Idle animation

        // Set shadows
        fbx.traverse((c) => {
            c.castShadow = true;
            c.receiveShadow = false;
        });
        mixer = new THREE.AnimationMixer(fbx);
        // Load additional animations
        loadNextAnimation();

        // Add the model to the scene after setting up the animations

    });
}
console.log('charAnimationsObj', charAnimationsObj)
// Function to load all the animations of the character
function loadNextAnimation() {

    animationModels.forEach((animName, index) => {
        character.load(`${animName}.fbx`, (anim) => {
            console.log('animName', animName)
            const clip = anim.animations[0];
            const action = mixer.clipAction(clip);
            let key = animName.replace(/\s+/g, '').toLowerCase();
            charAnimationsObj[key] = action;

            // Set shadows and add to scene if required
            anim.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });

            if (index === animationModels.length - 1) {
                // Trigger the idle state after all animations are loaded
                charAnimationsObj.idle.play();
                prevAction = charAnimationsObj.idle;
                currentAction = charAnimationsObj.idle;
            }
        });
    });
}

function modifyTimeScale(speed) {

    mixer.timeScale = speed;

}

function createPanel() {
    const folder1 = panel.addFolder('Base Actions');
    const folder2 = panel.addFolder('Additive Action Weights');
    const folder3 = panel.addFolder('General Speed');
    panelSettings = {
        'modify time scale': 1.0
    };

    const baseNames = ['None', ...Object.keys(baseActions)];

    for (let i = 0, l = baseNames.length; i !== l; ++i) {

        const name = baseNames[i];
        const settings = baseActions[name];
        panelSettings[name] = function () {

            const currentSettings = baseActions[currentBaseAction];
            const currentAction = currentSettings ? currentSettings.action : null;
            const action = settings ? settings.action : null;

            if (currentAction !== action) {

                prepareCrossFade(currentAction, action, 0.35);

            }

        };

        crossFadeControls.push(folder1.add(panelSettings, name));

    }

    for (const name of Object.keys(additiveActions)) {

        const settings = additiveActions[name];

        panelSettings[name] = settings.weight;
        folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(function (weight) {

            setWeight(settings.action, weight);
            settings.weight = weight;

        });

    }

    folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);

    folder1.open();
    folder2.open();
    folder3.open();

    crossFadeControls.forEach(function (control) {

        control.setInactive = function () {

            control.domElement.classList.add('control-inactive');

        };

        control.setActive = function () {

            control.domElement.classList.remove('control-inactive');

        };

        const settings = baseActions[control.property];

        if (!settings || !settings.weight) {

            control.setInactive();

        }

    });

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
    const container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.enableZoom = true;
    orbitControls.zoomSpeed = 1.15;
    orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 300;
    orbitControls.maxDistance = 450;
    orbitControls.minPolarAngle = -Math.PI / 1.5;
    orbitControls.maxPolarAngle = Math.PI / 2.5;
    orbitControls.enableRotate = false;
    orbitControls.update();

    // const gui = new dat.GUI();
    panel = new GUI({ width: 310 });

    const stats = new Stats();
    document.body.appendChild(stats.dom);
    createPanel();
    document.body.appendChild(panel.domElement);
}

// Function to initialise 3d World
function initScene() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    scene.fog = new THREE.FogExp2(0xbfd1e5, 0.0015);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);
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
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(15000, 15000),
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

    if (stats) stats.begin();

    if (mixer) mixer.update(clock.getDelta());

    orbitControls.update();
    renderer.render(scene, camera);

    if (stats) stats.end();
    requestAnimationFrame(animate);
}

// Called when window is resized and update the view with window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function activateAction(action) {

    const clip = action.getClip();
    const settings = baseActions[clip.name] || additiveActions[clip.name];
    setWeight(action, settings.weight);
    action.play();

}

function prepareCrossFade(startAction, endAction, duration) {

    // If the current action is 'idle', execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    if (currentBaseAction === 'idle' || !startAction || !endAction) {

        executeCrossFade(startAction, endAction, duration);

    } else {

        synchronizeCrossFade(startAction, endAction, duration);

    }

    // Update control colors

    if (endAction) {

        const clip = endAction.getClip();
        currentBaseAction = clip.name;

    } else {

        currentBaseAction = 'None';

    }

    crossFadeControls.forEach(function (control) {

        const name = control.property;

        if (name === currentBaseAction) {

            control.setActive();

        } else {

            control.setInactive();

        }

    });

}

function synchronizeCrossFade(startAction, endAction, duration) {

    mixer.addEventListener('loop', onLoopFinished);

    function onLoopFinished(event) {

        if (event.action === startAction) {

            mixer.removeEventListener('loop', onLoopFinished);

            executeCrossFade(startAction, endAction, duration);

        }

    }

}

function executeCrossFade(startAction, endAction, duration) {

    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

    if (endAction) {

        setWeight(endAction, 1);
        endAction.time = 0;

        if (startAction) {

            // Crossfade with warping

            startAction.crossFadeTo(endAction, duration, true);

        } else {

            // Fade in

            endAction.fadeIn(duration);

        }

    } else {

        // Fade out

        startAction.fadeOut(duration);

    }

}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight(action, weight) {

    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);

}

// Swtich from Previous to Next Animation
function PlayNextAnimation(param) {

    setWeight(prevAction, 0);
    prevAction.fadeOut(0);
    prevAction = currentAction;
    currentAction = param;

    setWeight(currentAction, 1);
    currentAction.fadeIn(0);
    prevAction.crossFadeTo(currentAction, .5);

    currentAction.play();


}

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') {
        keyStates.w = false;
        PlayNextAnimation(charAnimationsObj.idle); // Stop moving if 'W' is released
    }
    if (e.key === 'Shift') {
        keyStates.shift = false;

        // If 'W' is still pressed, revert to walking animation
        if (keyStates.w) {
            PlayNextAnimation(charAnimationsObj.walking);
        }
    }
})
// Keyboard Key Click/Release Events
window.addEventListener('keydown', (e) => {
    console.log(e.key);
    if (e.key === 'w' && !keyStates.w) {
        keyStates.w = true;

        // If both 'W' and 'Shift' are pressed, trigger running animation
        if (keyStates.shift) {
            PlayNextAnimation(charAnimationsObj.running);
        } else {
            PlayNextAnimation(charAnimationsObj.walking); // Otherwise, trigger walking animation
        }
    }
    if (e.key === 'Shift') {
        keyStates.shift = true;

        // If 'W' is also pressed, trigger running animation
        if (keyStates.w) {
            PlayNextAnimation(charAnimationsObj.running);
        }
    }

    if (e.key === 's') {
        // Character rotation to be implemented
        rotationCheck = characterRotation.rotation.y = 360;

        PlayNextAnimation(charAnimationsObj.walking);
    }
    if (e.key === 'q') {
        PlayNextAnimation(charAnimationsObj.sillydancing);
    }
    if (e.key === 'e') {
        PlayNextAnimation(charAnimationsObj.idle);
    }
    if (e.key === 'c') {
        PlayNextAnimation(charAnimationsObj.waving);
    }
    if (e.key === ' ') {
        PlayNextAnimation(charAnimationsObj.jump);
    }
    if (e.key === 'Control') {
        PlayNextAnimation(charAnimationsObj.standingtocrouch);
    }
});

// Add `mousemove` event to track movement
document.addEventListener('mousemove', (event) => {
    theta = (event.clientX / window.innerWidth) * 2 * Math.PI;
    phi = (event.clientY / window.innerHeight) * Math.PI;

    // Clamp phi to avoid flipping issues
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

    // Calculate new camera position
    camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(0, 0, 0); // Adjust if your scene center differs
    orbitControls.update();
});

// Mouse Click/Release Events
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        PlayNextAnimation(charAnimationsObj.boxing);
    }
    else if (e.button === 2) {
        PlayNextAnimation(charAnimationsObj.block);
    }
});
window.addEventListener('mouseup', (e) => {
    PlayNextAnimation(charAnimationsObj.idle);
});
