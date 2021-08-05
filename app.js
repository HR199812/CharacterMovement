var camera, scene, renderer, plane;


function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-180, 250, -150);

    let dirlight = new THREE.DirectionalLight(0xFFF000, 1);
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

    // var ambientLight = new THREE.AmbientLight(0xFFFF00, 3);
    // scene.add(ambientLight);

    // // let hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x080820, 4);
    // let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
    // hemiLight.color.setHSL(0.6, 0.6, 0.6);
    // hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    // hemiLight.position.set(0, 50, 0);
    // scene.add(hemiLight);


    plane = new THREE.Mesh(new THREE.PlaneGeometry(15000, 15000, 30, 30),
        new THREE.MeshBasicMaterial({ color: 0xa0afa4 }));

    // plane.position.set(0, 0, 0);
    // plane.scale.set(50, 2, 50);
    // plane.castShadow = true;
    // plane.receiveShadow = true;
    scene.add(plane);

    // let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0xa0afa4 }));

    // blockPlane.position.set(pos.x, pos.y, pos.z);
    // blockPlane.scale.set(scale.x, scale.y, scale.z);

    // blockPlane.castShadow = true;
    // blockPlane.receiveShadow = true;

    // scene.add(blockPlane);

    const gridHelper = new THREE.GridHelper(10, 1200);
    scene.add(gridHelper);

    renderer = new THREE.WebGLRenderer({ antialiasing: true });
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 2.3;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // renderer.render(scene, camera);

    animate();
}

function animate() {

    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

init();

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener('resize', onWindowResize);