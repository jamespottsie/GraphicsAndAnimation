("use strict");

let canvas, renderer, scene, camera; // Standard three.js requirements.
var screenShake = ScreenShake();
let bird, birdBody;
let bombSpawned = false;
let bomb;
let world;
const timeStep = 1.0 / 60.0;
let frameNumber = 0;
let livesEnabled = true;

let kinectron;
let numJsonFrames = 0;
let jsonMotion = null;
let kinectronIpAddress = "192.168.1.140";

let meshRH;
let meshLH;

let flap = false;
let turnAmount = 0.0;
let rings = [];
let ringParent;
let score = 0;
let lives = 3;

const RAIN_PARTICLES_COUNT = 100;
const CLOUD_COUNT = 10;
const RAIN_AREA_X = 10;
const RAIN_AREA_Y = 14;
const RAIN_AREA_Z = 50;
const GROUND_Y = -3;
const SMOKE_PARTICLE_COUNT = 30;

// MY CODE
let guiObject, gui;
let rainParticles, clouds;

let currentState;

const states = {
  MENU: 0,
  PLAY: 1,
  SCORE: 2,
};

// Buttons
let playEl;
let githubEl;
let playAgainEl;

// Score elements
let scoreEl;
let scoreHudEl;

// State screen elements
let preloaderEl;
let menuEl;
let gameOverEl;

let smokeGeometry;
let smokeMaterial;
let smokeParticles;
let pcControls = false;

//#region WORLD SETUP
function createWorld() {
  scene = new THREE.Scene();
  world = new CANNON.World();
  world.gravity.set(0, -1.2, 0); // m/s²

  guiObject = {};
  gui = new dat.GUI();

  createScene();

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

  //------------------- Visible objects ----------------------

  var loader = new THREE.GLTFLoader();

  loader.load("Assets/bird.gltf", function (gltf) {
    bird = gltf.scene;
    scene.add(gltf.scene);
    bird.rotation.y = 3.14;
  });

  ringParent = new THREE.Group();
  ringParent.position.z = -2;
  scene.add(ringParent);
  //leftHandBall
  var gLH = new THREE.SphereGeometry(0.1, 18, 18);
  var mLH = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  meshLH = new THREE.Mesh(gLH, mLH);
  ringParent.add(meshLH);

  //rightHandBall
  var gRH = new THREE.SphereGeometry(0.1, 18, 18);
  var mRH = new THREE.MeshPhongMaterial({ color: 0x00cccc });
  meshRH = new THREE.Mesh(gRH, mRH);
  ringParent.add(meshRH);

  ringParent = new THREE.Group();
  ringParent.position.z = 0;
  ringParent.position.y = 2;

  var geoRingArray = [];
  var matRingArray = [];
  const ringCount = 30;
  for (var i = 0; i < ringCount; i++) {
    geoRingArray.push(new THREE.TorusGeometry(0.2, 0.06, 16, 100));
    matRingArray.push(
      new THREE.MeshPhongMaterial({
        color: 0xffd700,
      })
    );
    rings.push(new THREE.Mesh(geoRingArray[i], matRingArray[i]));
    ringParent.add(rings[i]);
    rings[i].position.x = (i % 3) * -1.3 + 1.3;
    rings[i].position.y = Math.round(Math.random() * 3) * -0.6 - 0.5;
    rings[i].position.z = Math.floor(i / 3) * -16;
  }
  var bombGeom = new THREE.SphereBufferGeometry(0.2, 32, 32);
  var bombMat = new THREE.MeshPhongMaterial({ color: 0x191919 });
  bomb = new THREE.Mesh(bombGeom, bombMat);
  ringParent.add(bomb);
  bomb.visible = false;
  for (var lane = 0; lane < 10; lane++) varyLane(lane);
  console.log(rings.length);
  scene.add(ringParent);
  ringParent.position.z = -15;
}
//#endregion

function varyLane(laneIndex) {
  let x = Math.round(Math.random() * 3.5);
  for (var i = 0; i < 3; i++) {
    rings[laneIndex * 3 + i].visible = i === x - 1;
  }
  //spawn bomb
  if (bombSpawned === false) {
    var r = Math.floor(Math.random() * 10);
    if (r <= 2) {
      rings[laneIndex * 3 + r].visible = false;
      bomb.visible = true;
      bomb.position.x = rings[laneIndex * 3 + r].position.x;
      bomb.position.y = rings[laneIndex * 3 + r].position.y;
      bomb.position.z = rings[laneIndex * 3 + r].position.z;
      bombSpawned = true;
    }
  }
}
let laneSpeed = 0.1;
function moveLanes() {
  ringParent.position.z += laneSpeed;
  var wpVector = new THREE.Vector3();
  for (var i = 0; i < rings.length; i += 3) {
    rings[i].getWorldPosition(wpVector);
    if (wpVector.z > 6) {
      rings[i].position.z -= 160;
      rings[i + 1].position.z -= 160;
      rings[i + 2].position.z -= 160;

      if (
        //if any visible -1 life
        rings[i].visible === true ||
        rings[i + 1].visible === true ||
        rings[i + 2].visible === true
      ) {
        lives--;
        laneSpeed = clamp(laneSpeed - 0.06, 0.1, 0.3);
        screenShake.shake(camera, new THREE.Vector3(0.1, 0, 0), 300);
        console.log("lost life! " + lives);
        if (lives <= 0 && currentState === states.PLAY) die();
      }

      varyLane(i / 3);
    }
  }

  for (var i = 0; i < rings.length; i++) {
    if (rings[i].visible) {
      wpVector = rings[i].getWorldPosition(wpVector);
      if (wpVector.distanceTo(birdBody.position) < 0.5) collectRing(i);
    }
  }
  if (bombSpawned) {
    wpVector = bomb.getWorldPosition(wpVector);
    if (wpVector.distanceTo(birdBody.position) < 0.5) detonateBomb();
    else if (wpVector.z > 6) {
      bomb.visible = false;
      bombSpawned = false;
    }
  }
}
function detonateBomb() {
  lives = 0;
  bomb.visible = false;
  bombSpawned = false;
  screenShake.shake(camera, new THREE.Vector3(0.1, 0, 0), 300);
  if (lives <= 0 && currentState === states.PLAY) die();
}
function collectRing(ring) {
  score++;
  console.log(score);
  rings[ring].visible = false;
  if (lives < 3) lives++;
  new Audio("Assets/point.mp3").play();
}
//UPDATE
function updateForFrame() {
  if (currentState === states.PLAY) {
    moveLanes();

    if (birdBody.position.y < 1.2 && flap) flapBird(1);

    birdTurn(turnAmount);
  }

  //-1 is the boundary
  if (currentState === states.PLAY) {
    if (birdBody.position.y < -1.0 && birdBody.velocity.y < 0) {
      birdBody.position.y = -1.0;
    }
  }

  bird.position.x = birdBody.position.x;
  bird.position.y = birdBody.position.y;
  birdBody.position.z = 0;
}

let lastLeftHandPos;
let lastRightHandPos;
function doFrame() {
  frameNumber++;

  if (numJsonFrames > 0) {
    getBodies(jsonMotion[frameNumber % numJsonFrames]);
  }

  if (pcControls === false) {
    turnAmount = meshLH.position.y - meshRH.position.y;
    var lDiff = meshLH.position.y - lastLeftHandPos;
    var rDiff = meshRH.position.y - lastRightHandPos;
    flapSpeed = -2 * (lDiff + rDiff);
    flap = flapSpeed > 0.3;

    // default = -1.2
  }
  world.gravity.y = clamp(
    -2 + (meshRH.position.x - meshLH.position.x),
    -0.2,
    -2.5
  );
  lastLeftHandPos = meshLH.position.y;
  lastRightHandPos = meshRH.position.y;

  laneSpeed = clamp(laneSpeed + laneSpeed * 0.001, 0.1, 0.3);
  if (bird != null) updateForFrame();

  updateScene();
  screenShake.update(camera);
  renderer.render(scene, camera);
  requestAnimationFrame(doFrame);
  if (currentState !== states.MENU) {
    world.step(timeStep);
  }
}

function updateScene() {
  if (currentState !== states.SCORE) {
    groundTexture.offset.y += 0.02;
  }

  if (lives > 0)
    scoreHudEl.innerHTML =
      "<center>" + score + "<br>" + "<3".repeat(lives) + "</center>";
  else scoreHudEl.innerHTML = "";
  const objectMoveSpeed = 0.05;

  // updates the smoke particles
  for (let i = 0; i < smokeParticles.children.length; i++) {
    const particle = smokeParticles.children[i];

    particle.scale.setScalar(particle.scale.x * 0.95);

    particle.position.y += particle.scale.x * 0.2;
  }

  // updates the rain particles
  for (let i = 0; i < rainParticles.children.length; i++) {
    const particle = rainParticles.children[i];

    particle.translateY(-objectMoveSpeed * particle.speed * 2);
    particle.position.z += 0.1;

    // if the rain particle is outside the screen, then move the rain particle
    // to the top of the screen
    if (particle.position.z > particle.scale.y * 5) {
      particle.position.z = -RAIN_AREA_Z;
    }

    if (particle.position.y < GROUND_Y - particle.scale.y) {
      particle.position.y = RAIN_AREA_Y;
    }
  }

  // update clouds

  for (let i = 0; i < clouds.children.length; i++) {
    const cloud = clouds.children[i];

    let v = cloud.speed * objectMoveSpeed;
    cloud.position.z += v;

    // if the cloud moves outside the view, move it at the right of the screen

    if (cloud.position.z > 0) {
      cloud.position.z = -RAIN_AREA_Z;
    }
  }
}

function createScene() {
  const bgColor = new THREE.Color("lightblue");
  scene.background = bgColor;
  scene.fog = new THREE.Fog(bgColor, 10, 50);

  guiObject["dir light color"] = "#fff";
  guiObject["dir light intensity"] = 0.5;

  guiObject["ambient light color"] = "#fff";
  guiObject["ambient light intensity"] = 0.5;

  // lighting

  const dirLight = new THREE.DirectionalLight(
    guiObject["dir light color"],
    guiObject["dir light intensity"]
  );
  dirLight.position.set(50, 60, 50);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(
    guiObject["ambient light color"],
    guiObject["ambient light intensity"]
  );
  scene.add(ambientLight);

  // add gui components for the lights

  gui.addColor(guiObject, "dir light color").onChange(function (value) {
    dirLight.color.set(value);
  });

  gui
    .add(guiObject, "dir light intensity", 0, 1.0, 0.05)
    .onChange(function (value) {
      dirLight.intensity = value;
    });

  gui.addColor(guiObject, "ambient light color").onChange(function (value) {
    ambientLight.color.set(value);
  });

  gui
    .add(guiObject, "ambient light intensity", 0, 1.0, 0.05)
    .onChange(function (value) {
      ambientLight.intensity = value;
    });

  // initialize the ground texture
  groundTexture = new THREE.CanvasTexture(GroundTexture());

  // set the repeat amount
  groundTexture.repeat.setScalar(60);

  // make the texture to repeat
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.minFilter = groundTexture.magFilter = THREE.NearestFilter;

  // ground
  const groundColor = "#0f0";

  const groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture,
    transparent: true,
    color: groundColor,
  });

  // add gui component for the color of the ground

  guiObject["grass color"] = groundColor;

  gui.addColor(guiObject, "grass color").onChange(function (value) {
    groundMaterial.color.set(value);
  });

  // create the ground and add it to the scene
  const ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(150, 150),
    groundMaterial
  );
  ground.receiveShadow = true;
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  scene.add(ground);

  // create a wrapper object for the rain particles
  rainParticles = new THREE.Object3D();
  scene.add(rainParticles);

  // rain geometry and material
  const boxGeometry = new THREE.BoxBufferGeometry();
  const rainMaterial = new THREE.MeshPhongMaterial({ color: "blue" });

  // add random rain particles
  for (let i = 0; i < RAIN_PARTICLES_COUNT; i++) {
    const mesh = new THREE.Mesh(boxGeometry, rainMaterial);
    mesh.position.x = -RAIN_AREA_X + Math.random() * RAIN_AREA_X * 2;
    mesh.position.y = Math.random() * RAIN_AREA_Y * 2;
    mesh.rotation.x = -Math.PI / 4;
    mesh.position.z = -Math.random() * RAIN_AREA_Z;
    mesh.speed = Math.random() + 0.5;
    mesh.scale.set(0.2, 1.5, 0.2);
    rainParticles.add(mesh);
  }

  // wrapper object for the clouds
  clouds = new THREE.Object3D();
  clouds.position.y = RAIN_AREA_Y * 0.2;
  scene.add(clouds);

  const cloudMaterial = new THREE.MeshLambertMaterial({ color: "white" });

  // add random clouds
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = new THREE.Mesh(boxGeometry, cloudMaterial);
    cloud.position.x = Math.random() * RAIN_AREA_X * 2 - RAIN_AREA_X;
    cloud.position.z = Math.random() * RAIN_AREA_Z * -1;
    //cloud.position.y = Math.random();
    cloud.scale.set(
      Math.random() * 1 + 0.5,
      Math.random() * 0.4 + 0.3,
      Math.random() * 1 + 1
    );
    cloud.speed = Math.random() * 0.2 + 0.2;
    clouds.add(cloud);
  }

  // smoke geometry and material
  smokeGeometry = new THREE.SphereBufferGeometry();
  smokeMaterial = new THREE.MeshLambertMaterial({
    color: "white",
  });

  // wrapper object for smoke particles
  smokeParticles = new THREE.Object3D();
  scene.add(smokeParticles);

  // get the preloader element and hide it
  preloaderEl = document.getElementById("preloader");
  preloaderEl.style.display = "none";

  // show the menu element
  menuEl = document.getElementById("menu");
  menuEl.style.display = "";

  // get other elements
  gameOverEl = document.getElementById("gameOver");

  playEl = document.getElementById("play");
  githubEl = document.getElementById("github");
  playAgainEl = document.getElementById("playAgain");

  scoreEl = document.getElementById("score");
  scoreHudEl = document.getElementById("scoreHud");

  playEl.onclick = function () {
    // hide the appropiate elements and start the game
    menuEl.style.display = "none";
    scoreHudEl.style.display = "";
    scoreHudEl.innerHTML = score;

    currentState = states.PLAY;
  };

  githubEl.onclick = function () {
    // open github link
    window.open("https://github.com/Nattress98/GraphicsAndAnimation", "_open");
  };

  playAgainEl.onclick = function () {
    // update UI
    menuEl.style.display = "";
    gameOverEl.style.display = "none";
    scoreHudEl.innerHTML = "0";

    // reset game state
    currentState = states.MENU;
    birdBody.position.set(0, 0, 0);
    birdBody.position.x = 0;
    birdBody.velocity.y = 0;

    bird.rotation.y = 3.14;
    zRot = 0;
    xSpeed = 0;
    turnSpeed = 0;
    score = 0;
    lives = 3;
    console.log("lives:" + lives);

    // remove the smoke
    smokeParticles.children.length = 0;
  };
}
// add event listeners to the buttons

function die() {
  // update the ui
  if (livesEnabled === true) {
    dead = true;
    currentState = states.SCORE;
    scoreHudEl.style.display = "none";
    gameOverEl.style.display = "";
    scoreEl.innerHTML = score;
    laneSpeed = 0.1;
    ringParent.position.z -= 15;
    // play the dead sound
    new Audio("./Assets/hit.mp3").play();

    // all some random smoke particles
    smokeParticles.position.copy(birdBody.position);

    for (let i = 0; i < SMOKE_PARTICLE_COUNT; i++) {
      const mesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
      mesh.scale.setScalar(Math.random() * 0.1);
      mesh.position.set(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      );
      mesh.position.multiplyScalar(0.3);
      smokeParticles.add(mesh);
    }
  }
}

function GroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;

  const context = canvas.getContext("2d");

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(10, 10, 30, 30);

  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.fillRect(45, 45, 15, 15);

  return canvas;
}
//#region KINECTRON Controls
function readTextFile(file, callback) {
  var rawFile = new XMLHttpRequest();
  rawFile.overrideMimeType("application/json");
  rawFile.open("GET", file, true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      callback(rawFile.responseText);
    }
  };
  rawFile.send(null);
}

function getBodies(skeletonFrame) {
  meshLH.position.x = skeletonFrame.joints[kinectron.HANDLEFT].cameraX;
  meshLH.position.y = skeletonFrame.joints[kinectron.HANDLEFT].cameraY;
  meshLH.position.z = skeletonFrame.joints[kinectron.HANDLEFT].cameraZ;
  meshRH.position.x = skeletonFrame.joints[kinectron.HANDRIGHT].cameraX;
  meshRH.position.y = skeletonFrame.joints[kinectron.HANDRIGHT].cameraY;
  meshRH.position.z = skeletonFrame.joints[kinectron.HANDRIGHT].cameraZ;
}

//#endregion

//#region PC CONTROLS
window.addEventListener("keydown", function (e) {
  if (e.keyCode === null) return;
  switch (e.keyCode) {
    case 32:
      pcControls = true;
      flap = true;
      break;
    case 65:
      turnAmount = -1.0;
      break;
    case 68:
      turnAmount = 1.0;
      break;
    case 73:
      // Read the JSON file motion.json
      pcControls = false;
      readTextFile("RecordedJSON/Flying01.json", function (text) {
        jsonMotion = JSON.parse(text);
        numJsonFrames = Object.keys(jsonMotion).length;
        console.log("Total Frame = " + numJsonFrames);
      });
      break;
    case 79:
      // Read the JSON file motion.json
      pcControls = false;
      readTextFile("RecordedJSON/ArmRaise.json", function (text) {
        jsonMotion = JSON.parse(text);
        numJsonFrames = Object.keys(jsonMotion).length;
        console.log("Total Frame = " + numJsonFrames);
      });
      break;
    case 85:
      // Read the JSON file motion.json
      pcControls = false;
      readTextFile("RecordedJSON/Flying03.json", function (text) {
        jsonMotion = JSON.parse(text);
        numJsonFrames = Object.keys(jsonMotion).length;
        console.log("Total Frame = " + numJsonFrames);
      });
      break;
    case 191:
      livesEnabled = !livesEnabled;
      if (livesEnabled === true) lives = 3;
      else lives = 0;
      break;
  }
  e.preventDefault();
});
window.addEventListener("keyup", function (e) {
  if (e.keyCode === null) return;
  switch (e.keyCode) {
    case 32:
      flap = false;
      new Audio("./Assets/wing.mp3").play();
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

function flapBird(flapSpeed) {
  birdBody.velocity.y = flapSpeed;
}

var xSpeed = 0.0;
var zRot = 0.0;

function birdTurn(turnSpeed) {
  xSpeed = lerp(xSpeed, turnSpeed, 0.03);
  zRot = lerp(zRot, 0.012 * turnSpeed, 0.035);
  //xSpeed = clamp(xSpeed, -0.01, 0.01);
  if (
    Math.abs(birdBody.position.x) > 1.7 && //1 is the boundary
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
      alpha: true,
      canvas: document.getElementById("canvas"),
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
  } catch (e) {
    document.body.innerHTML = "<b>Sorry, an error occurred:<br>" + e + "</b>";
    return;
  }
  createWorld();
  kinectron = new Kinectron();

  doFrame();
}
//#endregion
