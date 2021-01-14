var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 30;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls( camera,renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

var geometry1 = new THREE.SphereGeometry(6, 32,32);
var material1 = new THREE.MeshPhongMaterial({color: 0xffffff}); // Phong shading
var mesh1 = new THREE.Mesh(geometry1, material1);
scene.add(mesh1);

var geometry2 = new THREE.BoxGeometry(6,8,6);
var material2 = new THREE.MeshPhongMaterial({color: 0xffffff});
var mesh2 = new THREE.Mesh(geometry2, material2);
mesh2.position.set(mesh1.position.x, mesh1.position.y + 8, mesh1.position.z);
scene.add(mesh2);

var geometry3 = new THREE.BoxGeometry(1,2,3);
var material3 = new THREE.MeshPhongMaterial({color: 0x000000});
var mesh3 = new THREE.Mesh(geometry3, material3);
mesh3.position.set(mesh2.position.x - 1, mesh2.position.y + 2, mesh2.position.z + 2);
scene.add(mesh3);

var mesh4 = new THREE.Mesh(geometry3, material3);
mesh4.position.set(mesh2.position.x + 1, mesh2.position.y + 2, mesh2.position.z + 2);
scene.add(mesh4);

var geometry5 = new THREE.BoxGeometry(4, 2, 3);
var material5 = new THREE.MeshPhongMaterial({color: 0xffa500});
var mesh5 = new THREE.Mesh(geometry5, material5);
mesh5.position.set(mesh2.position.x, mesh2.position.y - 1, mesh2.position.z + 3);
scene.add(mesh5);

var legGeometry = new THREE.BoxGeometry(2,7,2);
var legMaterial = new THREE.MeshPhongMaterial({color: 0xffa500});
var mesh6 = new THREE.Mesh(legGeometry, legMaterial);
mesh6.position.set(mesh1.position.x - 2, mesh1.position.y - 8, mesh1.position.z);
scene.add(mesh6);

var mesh7 = new THREE.Mesh(legGeometry, legMaterial);
mesh7.position.set(mesh1.position.x +2 , mesh1.position.y -8, mesh1.position.z);
scene.add(mesh7);

var wingGeometry = new THREE.BoxGeometry(5, 2, 4);
var wingMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
var mesh8 = new THREE.Mesh(wingGeometry, wingMaterial);
mesh8.position.set(mesh1.position.x - 7,mesh1.position.y + 1 ,mesh1.position.z );
scene.add(mesh8);

var mesh9 = new THREE.Mesh(wingGeometry,wingMaterial);
mesh9.position.set(mesh1.position.x + 7, mesh1.position.y + 1, mesh1.position.z);
scene.add(mesh9);

/*
var toeGeometry = new THREE.BoxGeometry(1,1,2);
var toeMaterial = new THREE.MeshPhongMaterial({color: 0xffa500});
var toe1 = new THREE.Mesh(toeGeometry,toeMaterial);
toe1.position.set(mesh6.position.x - 1, mesh6.position.y - 3, mesh6.position.z + 1)
scene.add(toe1);
*/

//Ambient light
var lightAmbient = new THREE.AmbientLight( 0x222222);
scene.add(lightAmbient);

var iFrame = 0;

function animate() 
{
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    iFrame++;

}
animate();