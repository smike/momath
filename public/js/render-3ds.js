/*
This library requires the following to also be included:
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
  <script src="/js/lib/jdataview.js"></script>
  <script src="/js/lib/lib3ds.js"></script>
  <script src="/js/lib/three.min.js"></script>
  <script src="/js/lib/TrackballControls.js"></script>
*/

function render3ds(url, container, doneCallback) {
  $.ajax({
    url: url,
    beforeSend: function (xhr) {
      // Required to be able to read data as binary
      xhr.overrideMimeType("text/plain; charset=x-user-defined");
    },
    success: function (response) {
      var lib3ds = new Lib3ds(null, false); // no debug

      // read the 3DS
      console.log("starting to read 3ds");
      var start = new Date();
      lib3ds.readFile(response);
      console.log("finished reading in " + (new Date() - start));

      var sceneContext = {
        lib3ds: lib3ds,
        shouldAnimate: true
      };
      _drawScene(lib3ds, container, sceneContext);
      sceneContext.controls = _createControls(sceneContext.camera);
      _animate(sceneContext);

      doneCallback(sceneContext);
    },
  });

  function _animate(sceneContext) {
    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame(function() { _animate(sceneContext); });

    if (sceneContext.shouldAnimate) {
      sceneContext.object.rotation.x += 0.001;
      sceneContext.object.rotation.y += 0.002;
      sceneContext.object.updateMatrix();
    }
    sceneContext.controls.update();
    sceneContext.renderer.render(sceneContext.scene, sceneContext.camera);
  }

  function _drawScene(lib3ds, container, sceneContext) {
    console.log('starting to draw');
    var start = new Date();

    var scene = new THREE.Scene();

    var object = new THREE.Object3D();
    var bounds = new THREE.Box3();
    for (var i in lib3ds.meshes) {
      var mesh = _createMesh(lib3ds.meshes[i], lib3ds, object);
      object.add(mesh);

      var geometry = mesh.geometry;
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox);
    }
    scene.add(object);

    // Lights...
    var pointLight = new THREE.PointLight(0xa0a0a0);
    pointLight.castShadow = true;
    pointLight.position.x = 5;
    pointLight.position.y = 5;
    pointLight.position.z = 5;
    scene.add(pointLight);

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Camera...
    // Figure out a better way to get the correct position/perspective
    var camera = new THREE.PerspectiveCamera(
      75, container.offsetWidth / container.offsetHeight, 0.1, 10000 );
    camera.position.z = 2;

    // Action!
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    sceneContext.scene = scene;
    sceneContext.camera = camera;
    sceneContext.object = object;
    sceneContext.renderer = renderer;
    sceneContext.bounds = bounds;

    console.log("finished drawing in " + (new Date() - start));
  }

  function _createMesh(lib3dsMesh, lib3ds, object) {
    var geometry = _createGeometry(lib3dsMesh);

    // THREE only supports one material per mesh, not per face, so we just pick the material
    // for the first face and apply to all in the mesh.
    var materialName = lib3dsMesh.faceL[0].material;
    var lib3dsMaterial = lib3ds.materials[materialName];
    var material = new THREE.MeshLambertMaterial({
      color: lib3dsMaterial.diffuseColor,
      ambient: lib3dsMaterial.ambientColor,
      specular: lib3dsMaterial.specularColor,
      wireframe: false,
    });
    return new THREE.Mesh(geometry, material);
  }

  function _createGeometry(lib3dsMesh) {
    var geometry = new THREE.Geometry();
    for (var i in lib3dsMesh.pointL) {
      var point = lib3dsMesh.pointL[i];
      geometry.vertices.push(
        new THREE.Vector3(point[0], point[1], point[2]));
    }

    for (var i in lib3dsMesh.faceL) {
      var face = lib3dsMesh.faceL[i];

      // vertex indices
      var v1 = face.points[0];
      var v2 = face.points[1];
      var v3 = face.points[2];
      geometry.faces.push(new THREE.Face3(v1, v2, v3));

      if (v1 < lib3dsMesh.texelL.length &&
          v2 < lib3dsMesh.texelL.length &&
          v3 < lib3dsMesh.texelL.length) {
        var uv1 = new THREE.Vector2(
                lib3dsMesh.texelL[v1][0], lib3dsMesh.texelL[v1][1])
        var uv2 = new THREE.Vector2(
                lib3dsMesh.texelL[v2][0], lib3dsMesh.texelL[v2][1])
        var uv3 = new THREE.Vector2(
                lib3dsMesh.texelL[v3][0], lib3dsMesh.texelL[v3][1])
        geometry.faceVertexUvs[0].push([uv1, uv2, uv3]);
      }
    }
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeTangents();
    return geometry;
  }
}

function _createControls(camera) {
  // This is copied from
  //https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_trackball.html
  var controls = new THREE.TrackballControls(camera);

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 0.1;
  controls.panSpeed = 0.8;

  controls.noZoom = false;
  controls.noPan = false;

  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  controls.keys = [ 65, 83, 68 ];

  //controls.addEventListener( 'change', render );

  return controls;
}