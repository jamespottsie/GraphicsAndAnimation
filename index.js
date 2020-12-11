("use strict");

var canvas, renderer, scene, camera; // Standard three.js requirements.
var bird, birdBody;
var world;
var timeStep = 1.0 / 60.0;
var frameNumber;

var flap = false;
var turnAmount = 0.0;

//#region WORLD SETUP
function createWorld() {
  scene = new THREE.Scene();
  world = new CANNON.World();
  world.gravity.set(0, -1, 0); // m/s²

  birdBody = new CANNON.Body({
    mass: 1, // kg
    position: new CANNON.Vec3(0, 0, 0), // m
    shape: new CANNON.Sphere(1),
  });
  world.addBody(birdBody);

  // ------------------- Camera etc ----------------------
  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1, 6);
  camera.rotation.x = -0.1;

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("Assets/mars.png", () => {
    const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
    rt.fromEquirectangularTexture(renderer, texture);
    scene.background = rt;
  });

  var light;
  light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  camera.add(light);
  scene.add(camera);

  //------------------- Visible objects ----------------------

  var loader = new THREE.GLTFLoader();

  loader.load("/Assets/bird.gltf", function (gltf) {
    bird = gltf.scene;
    scene.add(gltf.scene);
    bird.rotation.y = 3.14;
  });
}
//#endregion

//UPDATE
function updateForFrame() {
  if (birdBody.position.y < 1.2 && flap) flapBird(1);

  birdTurn(turnAmount);
  //-1 is the boundary
  if (birdBody.position.y < -1.0 && birdBody.velocity.y < 0)
    birdBody.position.y = -1.0;

  bird.position.x = birdBody.position.x;
  bird.position.y = birdBody.position.y;
  birdBody.position.z = 0;
}

function doFrame() {
  frameNumber++;
  if (bird != null) updateForFrame();
  renderer.render(scene, camera);
  requestAnimationFrame(doFrame);
  world.step(timeStep);
}

//#region PC CONTROLS
window.addEventListener("keydown", function (e) {
  if (e.keyCode === null) return;
  switch (e.keyCode) {
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
window.addEventListener("keyup", function (e) {
  if (e.keyCode === null) return;
  switch (e.keyCode) {
    case 32:
      flap = false;
      break;
    case 65:
      if (turnAmount === -1.0) turnAmount = 0;
      break;
    case 68:
      if (turnAmount === 1.0) turnAmount = 0;
      break;
  }
  e.preventDefault();
});
//#endregion

//#region BIRD CONTROLS
var ySpeed = 0;

function flapBird(flapSpeed) {
  if (flapSpeed < 0) {
    if (ySpeed > -0.45) ySpeed += flapSpeed;
  } else {
    ySpeed = flapSpeed;
  }
  //bird.position.y += 0.04 * ySpeed;
  birdBody.velocity.y = flapSpeed;
}

var xSpeed = 0.0;
var zRot = 0.0;

function birdTurn(turnSpeed) {
  xSpeed = lerp(xSpeed, turnSpeed, 0.03);
  zRot = lerp(zRot, 0.012 * turnSpeed, 0.035);
  //xSpeed = clamp(xSpeed, -0.01, 0.01);
  if (
    Math.abs(birdBody.position.x) > 1.5 && //1 is the boundary
    ((xSpeed < 0 && birdBody.position.x < 0) ||
      (xSpeed > 0 && birdBody.position.x > 0))
  )
    xSpeed = 0;
  birdBody.velocity.x = xSpeed;
  bird.rotation.z = zRot * 85;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}
//#endregion

//#region INITIALIZATION
function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
  } catch (e) {
    document.body.innerHTML = "<b>Sorry, an error occurred:<br>" + e + "</b>";
    return;
  }
  createWorld();
  doFrame();
}
//#endregion
