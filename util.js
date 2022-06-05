function loadOBJ(file, material, scale, xOff, yOff, zOff, xRot, yRot, zRot) {
  var manager = new THREE.LoadingManager();
  manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };

  var onProgress = function (xhr) {
    if (xhr.lengthComputable) {
      var percentComplete = (xhr.loaded / xhr.total) * 100.0;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
  };

  var onError = function (xhr) {};

  var loader = new THREE.OBJLoader(manager);
  loader.load(
    file,
    function (object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });

      object.position.set(xOff, yOff, zOff);
      object.rotation.x = xRot;
      object.rotation.y = yRot;
      object.rotation.z = zRot;
      object.scale.set(scale, scale, scale);
      object.parent = worldFrame;
      scene.add(object);
    },
    onProgress,
    onError
  );
}
