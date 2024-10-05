import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createMoon, updateMoon } from './moon.js';

import sunTexture from './src/img/sun.jpg';
import mercuryTexture from './src/img/mercury.jpg';
import venusTexture from './src/img/venus.jpg';
import earthTexture from './src/img/earth.jpg';
import marsTexture from './src/img/mars.jpg';
import jupiterTexture from './src/img/jupiter.jpg';
import saturnTexture from './src/img/saturn.jpg';
import saturnRingTexture from './src/img/saturn ring.png';
import uranusTexture from './src/img/uranus.jpg';
import uranusRingTexture from './src/img/uranus ring.png';
import neptuneTexture from './src/img/neptune.jpg';
import plutoTexture from './src/img/pluto.jpg';

// Scene == container
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

// Set renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Load the background of the space
const spaceTexture = new THREE.TextureLoader().load('./images/blackbg.avif');
scene.background = spaceTexture;

// Setting up orbit control
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(-90, 140, 140);
orbit.update();

// Setting up lights
const pointLight = new THREE.PointLight(0xffffff, 3, 300);
pointLight.position.set(20, 20, 20);
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(pointLight, ambientLight);

// Lights Helpers
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(lightHelper, gridHelper);

// Loading planets
const textureload = new THREE.TextureLoader();
// Sun
const sunGeo = new THREE.SphereGeometry(12, 25, 20);
const sunMat = new THREE.MeshBasicMaterial({
  map:textureload.load(sunTexture)
});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);
// Loading other planets
function createPlanet(size, texture, position, ring){
  const geometry = new THREE.SphereGeometry(size, 25, 20);
  const material = new THREE.MeshStandardMaterial({
    map:textureload.load(texture) ,
  });
  const planet = new THREE.Mesh(geometry, material);
  const planetObj = new THREE.Object3D;
  planetObj.add(planet);
  scene.add(planetObj);
  planet.position.x = position;

  if(ring){
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius, 
      ring.outerRadius, 30
    );
    const ringMat = new THREE.MeshStandardMaterial({
      map:textureload.load(ring.texture),
      side: THREE.DoubleSide
    });
    const Ring = new THREE.Mesh(ringGeo, ringMat);
    planetObj.add(Ring);

    Ring.position.x = position;
    Ring.rotation.x = -0.5 * Math.PI;
  }
  return {planet, planetObj};
}

const mercury = new createPlanet(4,mercuryTexture,20);
const venus = new createPlanet(5,venusTexture,40);
const earth = new createPlanet(5.56,earthTexture,60);
const mars = new createPlanet(5,marsTexture,80);
const jupiter = new createPlanet(6,jupiterTexture,100);
const saturn = new createPlanet(8,saturnTexture,150,{
  innerRadius: 10,
  outerRadius: 20,
  texture: saturnRingTexture
});
const uranus = new createPlanet(8.2,uranusTexture,200,{
  innerRadius: 10,
  outerRadius: 20,
  texture: uranusRingTexture
});
const neptune = new createPlanet(5,neptuneTexture,240);


// Function add Stars
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

// Texture mapping for fer
const ferTexture = new THREE.TextureLoader().load('./images/fer.jfif');
const fer = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshBasicMaterial({ map: ferTexture })
);
scene.add(fer);

// Create the moon using the moon module
const moon = createMoon();
scene.add(moon);

// Control the objects position
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  updateMoon(moon);

  fer.rotation.y += 0.01;
  fer.rotation.z += 0.01;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.position.y = t * -0.0002;
}
document.body.onscroll = moveCamera;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotation
  sun.rotation.y += 0.02;
  mercury.planet.rotateY(0.001);
  mercury.planetObj.rotateY(0.001);
  venus.planet.rotateY(0.0012);
  venus.planetObj.rotateY(0.0015);
  earth.planet.rotateY(0.012);
  earth.planetObj.rotateY(0.0012);
  mars.planet.rotateY(0.013);
  mars.planetObj.rotateY(0.0019);
  jupiter.planet.rotateY(0.04);
  jupiter.planetObj.rotateY(0.0023);
  saturn.planet.rotateY(0.01);
  saturn.planetObj.rotateY(0.0021);
  uranus.planet.rotateY(0.01);
  uranus.planetObj.rotateY(0.0015);
  neptune.planet.rotateY(0.01);
  neptune.planetObj.rotateY(0.001);

  orbit.update();
  renderer.render(scene, camera);
}

// Handle resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

animate();
