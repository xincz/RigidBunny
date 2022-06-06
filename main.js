/**
 * Rigid Body Dynamics
 * Implementation by Xincz
 */
if (WEBGL.isWebGL2Available() === false) {
    document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
}

var container = document.createElement('div');
document.body.appendChild(container);

var canvas = document.createElement("canvas");
var context = canvas.getContext('webgl2');
var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: context
});

renderer.setClearColor(0X5588cc);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

var scene = new THREE.Scene();


// Variables
var meshesLoaded = false;
var light;
var lightDirection;
var ambientLight;
var meshes = {};

var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
camera.position.set(5.0, 5.0, 3.0);
camera.lookAt(scene.position);
scene.add(camera);

// Camera Orbit Control
var controls = new THREE.OrbitControls(camera, container);
controls.damping = 0.2;
controls.autoRotate = false;

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

window.onscroll = function() {
    window.scrollTo(0, 0);  //?
}

// XYZ axis helper
var worldFrame = new THREE.AxesHelper(1);
scene.add(worldFrame);

// Uniforms
var cameraPositionUniform = {type: "v3", value: camera.position};
var lightColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
var ambientColorUniform = {type: "c", value: new THREE.Vector3(1.0, 1.0, 1.0)};
// var lightDirectionUniform = {type: "v3", value: lightDirection};
var kAmbientUniform = {type: "f", value: 0.1};
var kDiffuseUniform = {type: "f", value: 0.8};
var kSpecularUniform = {type: "f", value: 0.4};
var shininessUniform = {type: "f", value: 50.0};
// var lightPositionUniform = { type: "v3", value: light.position};

// Skybox
var cubemap = new THREE.CubeTextureLoader().setPath('images/cubemap/').load([
    "negx.png", "posx.png", "posy.png",
    "negy.png", "posz.png", "negz.png"
]);
cubemap.format = THREE.RGBFormat;

var skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
        skybox: {value: cubemap},
        cameraPosition: cameraPositionUniform
    },
    depthWrite: false,
    side: THREE.BackSide
});

var envmapMaterial = new THREE.ShaderMaterial({
    uniforms: {
        skybox: {value: cubemap},
        matrixWorld: {type: "m4", value: camera.matrixWorldInverse}
    }
});

var shaderFiles = [
    'glsl/skybox.vs.glsl',
    'glsl/skybox.fs.glsl',
];

new THREE.SourceLoader().load(shaderFiles, function(shaders) {
    skyboxMaterial.vertexShader = shaders['glsl/skybox.vs.glsl'];
    skyboxMaterial.fragmentShader = shaders['glsl/skybox.fs.glsl'];
});

var ctx = renderer.context;
// stops shader warnings, seen in some browsers
ctx.getShaderInfoLog = function () { return '' };

var skybox = new THREE.Mesh(new THREE.BoxGeometry(500, 500, 500), skyboxMaterial);
// scene.add(skybox);


// Keyboard Control
var keyboard = new THREEx.KeyboardState();
function checkKeyboard() {
    if (keyboard.pressed("W")) {
        light.position.y += 0.1;
    } else if (keyboard.pressed("S")) {
        light.position.y -= 0.1;
    } else if (keyboard.pressed("A")) {
        light.position.x -= 0.1;
    } else if (keyboard.pressed("D")) {
        light.position.x += 0.1;
    }
    if (typeof sphere != "undefined") {      // if sphere object is defined
        sphere.position.set(light.position.x, light.position.y, light.position.z);
    }

    lightDirection.copy(light.position);
    lightDirection.sub(light.target.position);
}

// Rigid body
let bunnyRigidBody;

// Init
function init() {
    initLights();
    initObjects();
    initFileObjects();
    // console.log(meshes);
}

function updateMaterials() {
    // envmapMaterial.needsUpdate = true;
    // wizardMaterial.needsUpdate = true;
    skyboxMaterial.needsUpdate = true;
}

//                                                                      //
// Main animation loop
//                                                                      //
// Render the scene
function update() {
    checkKeyboard();
    updateMaterials();
    cameraPositionUniform.value = camera.position;

    if (typeof bunnyRigidBody == 'undefined') {
        if (meshesLoaded) {
            bunnyRigidBody = new RigidBody(meshes["bunny"]);
            console.log(meshes["bunny"]);
        }
    } else {  // mesh already loaded
        bunnyRigidBody.update();
    }

    if (keyboard.pressed("D")) {
        meshes["bunny"].position.set(0,3,0);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(update); // Requests the next update call, this creates a loop
}

init();
update();
