// Materials
// BlinnPhongMat = new THREE.ShaderMaterial({
//     uniforms: {}
// });
var GouraudMat = new THREE.MeshLambertMaterial({color: 0x22cc33});
var diffuseBlue = new THREE.MeshLambertMaterial( {color: 0xc0c0ff} );
var yellowMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
var physicalMaterial = new THREE.MeshPhysicalMaterial( {
    color: 0xc499c4, roughness: 0.556, metalness: 0.096, reflectivity: 0.56, wireframe: false} );


// Lighting
function initLights() {
    // light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light = new THREE.PointLight(0xffffff);
    light.position.set(0,8,0);
    light.target = worldFrame;
    light.castShadow = true;
    light.shadow.camera.zoom = 0.8;
    scene.add(light);

    lightDirection = new THREE.Vector3();
    lightDirection.copy(light.position);
    lightDirection.sub(light.target.position);

    var ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);

    // var light = new THREE.HemisphereLight(0x404040, 0xFFFFFF, 0.5);
    // scene.add(light);
}

function initObjects() {
    // Floor
    var floorTexture = new THREE.TextureLoader().load('images/floor.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 5);
    var floorMaterial = new THREE.MeshLambertMaterial({
        color: 0xcfcfcf,
        map: floorTexture,
        side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneBufferGeometry(10.0, 10.0);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.z = 3;
    floor.rotation.x = Math.PI / 2.0;
    floor.castShadow = false;
    floor.receiveShadow = true;
    // floor.parent = worldFrame;
    scene.add(floor);

    // Wall
    var wallTexture = new THREE.TextureLoader().load('images/floor.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(5, 5);
    var wallMaterial = new THREE.MeshLambertMaterial({
        color: 0xcfcfcf,
        map: wallTexture,
        side: THREE.DoubleSide
    });
    var wallGeometry = new THREE.PlaneBufferGeometry(10.0, 10.0);
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -2.0;
    wall.position.y = 0.0;
    wall.rotation.x = -Math.PI/6;
    wall.castShadow = false;
    wall.receiveShadow = true;
    // wall.parent = worldFrame;
    scene.add(wall);

    // Light ball
    var sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    sphere = new THREE.Mesh(sphereGeometry, yellowMaterial);
    sphere.position.set(light.position.x, light.position.y ,light.position.z);
    sphere.castShadow = false;
    scene.add(sphere);
}

function onResourcesLoaded() {
    // Create references (shallow copies) to the mesh
    meshes["bunny"] = models.bunny.mesh.clone();
    meshes["bunny"].position.set(0,2,1);
    meshes["bunny"].rotation.set(0,0,0);
    meshes["bunny"].scale.set(1,1,1);
    meshes["bunny"].castShadow = true;
    meshes["bunny"].receiveShadow = true;
    scene.add(meshes["bunny"]);

    meshes["dragon"] = models.dragon.mesh.clone();
    meshes["dragon"].position.set(-13,10,13);
    meshes["dragon"].rotation.set(0,-Math.PI/2.0,0);
    meshes["dragon"].castShadow = true;
    meshes["dragon"].receiveShadow = true;
    // scene.add(meshes["dragon"]);

    meshesLoaded = true;
    // console.log(meshes["bunny"].children[0].geometry);
    console.log("Resources Loaded");
}

function initFileObjects() {
    models = {
        bunny: {obj: "obj/bunny.obj", mtl: physicalMaterial, mesh: null},
        dragon: {obj: "obj/stanford-dragon.obj", mtl: diffuseBlue, mesh: null},
    }

    var manager = new THREE.LoadingManager();
    manager.onLoad = function() {
        console.log("loaded all resources");
        RESOURCES_LOADED = true;
        onResourcesLoaded();
    };
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + "% loaded");
        }
    };
    var onError = function(xhr) {
        console.log("error loading resources");
    };

    // Load models
    for (var _key in models) {
        console.log("Key: ", _key);
        (function(key) {
            var objLoader = new THREE.OBJLoader(manager);
            objLoader.load(models[key].obj, function(object) {
                object.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = models[key].mtl;
                        child.material.shading = THREE.SmoothShading;
                    }
                });
                models[key].mesh = object;
            }, onProgress, onError);
        })(_key);
    }
}
