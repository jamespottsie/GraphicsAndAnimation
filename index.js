var scene, camera, renderer;

scene = new THREE.Scene();
scene.background = new THREE.Color(0x5f5f0f);

camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight);
camera.position.set(0,1,6);
camera.rotation.x= -0.1;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


var loader = new THREE.FBXLoader();
loader.load( 'Assets/Bird_Asset.fbx', function ( fbx ) {

  scene.add( fbx.scene );
}, undefined, function ( error ) {

  console.error( error );

} );



function animate() {
    requestAnimationFrame(animate);
/*     if(flap)
        flapBird(0.5);
    else
        flapBird(-0.02);
    birdTurn(turnAmount); */
    renderer.render(scene, camera);
  };

animate()











/* 
var flap = false;
var turnAmount = 0.0;
window.addEventListener('keydown',function(e) {
    if (e.keyCode === null)
        return;
    switch (e.keyCode){
        case 32: 
            flap = true;
            break;
        case 65:
            turnAmount = -1.0;
            break;
        case 68:
            turnAmount = 1.0;
            break;
    }
    e.preventDefault();   
});
window.addEventListener('keyup', function(e) {
    if (e.keyCode === null)
        return;
    switch (e.keyCode){
        case 32: 
            flap = false;
            break;
        case 65:
            if(turnAmount === -1.0)
                turnAmount = 0;
            break;
        case 68:
            if(turnAmount === 1.0)
                turnAmount = 0;
            break;
    }
    e.preventDefault();  
});
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);



camera.position.y = 1;
camera.position.z = 6;
camera.rotation.x= -0.1;

var animate = function () {
requestAnimationFrame(animate);
if(flap)
    flapBird(0.5);
else
    flapBird(-0.02);
birdTurn(turnAmount);
renderer.render(scene, camera);
};

var speed = 0;
var flapBird = function (flapSpeed){
if(flapSpeed < 0){
    if(speed > -0.6)
        speed += flapSpeed;
}
else
    speed = flapSpeed;
cube.position.y += 0.1 * speed;
}
var birdTurn = function (turnSpeed){
  cube.position.x += 0.05 * turnSpeed
}
animate(); */