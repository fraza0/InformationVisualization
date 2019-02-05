THREE.Cache.enabled = true;
var loader = new THREE.FileLoader();

var tmp = []
var allPoints = [];
var coordinates_x_y = [];
var coordinates = [];

var width  = window.innerWidth;
var height = window.innerHeight;

var scene = new THREE.Scene();

// An axis object to visualize the 3 axes in a simple way.
// The X axis is red. The Y axis is green. The Z axis is blue.
// var axes = new THREE.AxesHelper(500);
// scene.add(axes);

var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
// var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0.1, 100000 );

camera.position.set(5000, 5000, 5000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
// renderer.setClearColor(0xcccccc);

function onWindowResize() {
	// Adjusting the renderer and camera features
	renderer.setSize( window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

function preprocessData(geometry, data){
  var x, y, z, minx=Number.MAX_VALUE, miny=Number.MAX_VALUE, minz=Number.MAX_VALUE, maxz=0;
  allPoints = data.split("\n");
  for(var i = 0; i < allPoints.length; i++) {
      tmp = allPoints[i].split(" ");
      if (parseInt(tmp[2]) > 1){
        x = parseInt(tmp[0]);
        y = parseInt(tmp[1]);
        z = parseInt(tmp[2]);
        if (x < minx) {
          minx = x;
        }
        if (y < miny) {
          miny = y;
        }
        if (z > maxz) {
          maxz = z;
        }
        if (z < minz) {
          minz = z;
        }
        coordinates.push(tmp);
      }
  }
  maxz -= minz;

  for (var i = 0; i < coordinates.length; i++) {
    x = parseInt(coordinates[i][0])-minx;
    y = parseInt(coordinates[i][1])-miny;
    z = parseInt(coordinates[i][2])-minz;
    coordinates_x_y.push([x,y]);
    geometry.vertices.push(new THREE.Vector3(x, z, y));
  }
  return geometry;
}

/*
* Delaunay Triangulation
*/
function delaunayTriangulation(geometry){
  var triangles = Delaunator.from(coordinates_x_y);
  for (var i = 0; i < triangles.triangles.length; i += 3) {
    geometry.faces.push(new THREE.Face3(triangles.triangles[i], triangles.triangles[i + 1], triangles.triangles[i + 2]));
  }
}

/*
* Apply colors to faces based on a dictionary of height:color(hex)
*/
function applyColor(geometry, rangeDict){
  var color, val;
  for (var i = 0; i < geometry.faces.length; i++) {
    val = geometry.vertices[geometry.faces[i].a].y;
    // color = new THREE.Color(0x888888);
    for(var key in rangeDict){
      var color_value = rangeDict[key];
      if (val<key){
        color = new THREE.Color(color_value);
        break;
      }
    }
    geometry.faces[i].color = color;
  }
}

/*
* Build face's vertex UV points for texture mapping. This works well in planar surfaces.
* As the meshes used here are not planar, there is some image distortion.
* As UVs have to be calculated individually, it is usually used a software (like Blender) to adapt images to a shape
*/
function build_uvs(geometry) {
  geometry.computeBoundingBox();

  var max = geometry.boundingBox.max,
      min = geometry.boundingBox.min;
  var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
  var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
  var faces = geometry.faces;

  geometry.faceVertexUvs[0] = [];

  for (var i = 0; i < faces.length ; i++) {
      var v1 = geometry.vertices[faces[i].a],
          v2 = geometry.vertices[faces[i].b],
          v3 = geometry.vertices[faces[i].c];

      geometry.faceVertexUvs[0].push([
          new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
          new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
          new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
      ]);
  }
  geometry.uvsNeedUpdate = true;
  return geometry;
}

////Models Functions
/*
* Point Cloud
*/
function showPointCould(geometry){
  var mountain_point_material = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true});
  return new THREE.Points(geometry, mountain_point_material);
}

/*
* Triangle Mesh
*/
function showTriangleMesh(geometry, showColors, rangeDict){
  delaunayTriangulation(geometry);
  if (showColors) {
    //Apply colors to points based on elevation
    var mountain_wire_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, side:THREE.DoubleSide, wireframe:true });
    applyColor(geometry, rangeDict);
  } else {
    var mountain_wire_material = new THREE.MeshPhongMaterial({ color: 0x888888, side:THREE.DoubleSide, wireframe:true });
  }
  return new THREE.Mesh(geometry, mountain_wire_material);
}

/*
* Phong with colors
*/
function showColoredPhongMesh(geometry, rangeDict) {
  delaunayTriangulation(geometry);
  applyColor(geometry, rangeDict);
  var mountain_phong_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, side:THREE.DoubleSide, wireframe:false, specular:'#a9fcff', shininess:30 });

  return new THREE.Mesh(geometry, mountain_phong_material);
}

/*
* Apply Texture
*/
function showTexture(geometry){
  delaunayTriangulation(geometry);
  var textureLoader = new THREE.TextureLoader();
  var img1 = textureLoader.load("./texture/mt_saint_helens_4.png");
  geometry = build_uvs(geometry);
  var mountain_phong_material = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, side:THREE.DoubleSide, wireframe:false, specular:'#a9fcff', shininess:30 });
  return new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({map:img1}));
}

var lightsOn = true;
/*
* Point Cloud
*/
function toggleLights(){
  var light = scene.getObjectByName( "ambientlight" );
  var slight = scene.getObjectByName( "spotlight" );
  if (!lightsOn){
    lightsOn = true;
    light.color.setHex( 0xffffff );
    slight.intensity = 0;
  } else {
    lightsOn = false;
    slight.intensity = 1;
    light.color.setHex( 0x333333 );
  }
}


/*
* Show ThreeJS object's Helpers
*/
function showHelpers(){
  // var boxHelper = new THREE.Box3Helper(box, 0xffff00);
  // scene.add(boxHelper);

  var spotLight = scene.getObjectByName( "spotlight" );
  var spotLightHelper = new THREE.SpotLightHelper( spotLight );
  scene.add( spotLightHelper );
}

//// Animations

function onDocumentKeyDownLog(event){
  var keycode = event.which;
  console.log("tecla"+keycode);
}

/*
*
*/
function onDocumentKeyDown(event){
  var instruction;
  var keycode = event.which;
  if (keycode==107 || keycode==109 || keycode==187 || keycode==189){
    adjustBrightness(keycode);
  } else if(keycode==87) {
    instruction = "up";
    moveLight(instruction);
  } else if(keycode==65) {
    instruction = "left";
    moveLight(instruction);
  } else if(keycode==83) {
    instruction = "down";
    moveLight(instruction);
  } else if(keycode==68) {
    instruction = "right";
    moveLight(instruction);
  } else if (keycode==76){
    toggleLights(lightsOn);
    // console.log(lightsOn);
  } else if (keycode==72){
    showHelpers();
  }
}

function adjustBrightness(key){
  var light = scene.getObjectByName( "spotlight" );
  if (key==107 || key == 187){
    light.intensity += 0.1;
  } else {
    light.intensity -= 0.1;
  }
}

function moveLight(instruction){
  var light = scene.getObjectByName( "spotlight" );
  if(instruction=="up"){
    light.position.y += 100;
  } else if(instruction=="left"){
    light.position.x -= 100;
  } else if(instruction=="down"){
    light.position.y -= 100;
  } else if(instruction=="right"){
    light.position.x += 100;
  }
}

// load values to array of arrays

function threeInit(representation, map) {
  scene = new THREE.Scene();
  coordinates_x_y = [];
  coordinates = [];
  loader.load(
    // resource URL
    "./topo_helens2/helens2.dat",
    // onLoad callback
  	function ( data ) {
          var mountain_geometry = new THREE.Geometry();
          //Preprocessing
          mountain_geometry = preprocessData(mountain_geometry, data);

          // var rangeDict = { 700:0xc1fca4, 1000:0x7ef742, 1500:0xffcc66, 2000:0xff6666 };
          var rangeDict = map;
          // console.log("MAP", rangeDict);

          //// Defining Mountain
          if (representation == "point_cloud") {
            var mountain = showPointCould(mountain_geometry);
          } else if (representation == "triangle_mesh") {
            var mountain = showTriangleMesh(mountain_geometry, false);
          } else if (representation == "colored_triangle_mesh") {
            var mountain = showTriangleMesh(mountain_geometry, true, rangeDict);
          } else if (representation == "colored_triangle_phongmesh") {
            var mountain = showColoredPhongMesh(mountain_geometry, rangeDict);
          } else if (representation == "texture") {
            var mountain = showTexture(mountain_geometry);
          }

          mountain.geometry.colorsNeedUpdate = true;
          var box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
          box.setFromObject(mountain);

          mountain.position.x = (-box.max.x/2);//, -box.max.z/2, 0);
          mountain.position.z = (-box.max.z/2);
          box.setFromObject(mountain);

          mountain_geometry.computeVertexNormals();
          scene.add(mountain);

          //// Lighting
          var alight = new THREE.AmbientLight(0xffffff);
          alight.name = "ambientlight";
          scene.add(alight);

          var spotLight = new THREE.SpotLight({color:0xdddddd, angle:0.1, penumbra:0.5 });
          spotLight.name = "spotlight";
          spotLight.intensity = 0;
          spotLight.position.set( 5000, 3000, 4000 );
          scene.add( spotLight );


          var controls = new THREE.OrbitControls(camera, renderer.domElement);
          document.getElementById("container").appendChild(renderer.domElement)

          function render() {
            controls.update();
            requestAnimationFrame(render);
            renderer.render(scene, camera);
          }

          document.addEventListener("keydown", onDocumentKeyDown, false);

          window.addEventListener('resize', onWindowResize, false);
          render();
  	}
  )
}
