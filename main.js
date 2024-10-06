import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earthTexture from './src/img/earth.jpg';

// Scene == container
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

// Set renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Load the background of the space
const spaceTexture = new THREE.TextureLoader().load('./images/black.png');
scene.background = spaceTexture;


// Setting up orbit control
const orbit = new OrbitControls(camera, renderer.domElement);
const cameraDefaultPos = new THREE.Vector3(0, 0, 20);

orbit.minDistance = 20;
orbit.maxDistance = 40;
orbit.enablePan = false;     // Disable panning
camera.position.copy(cameraDefaultPos);


orbit.update();

// Loading planets
const textureload = new THREE.TextureLoader();

// Loading other planets
function createPlanet(size, texture, position, name, ring){
  const geometry = new THREE.SphereGeometry(size, 50, 50);
  const material = new THREE.MeshStandardMaterial({
    map : textureload.load(texture) ,
    emissive: new THREE.Color(0xffffff),
    emissiveMap : textureload.load(texture), 
    emissiveIntensity : 1,
    transparent: true, 
    opacity: 1 
  });
  const planet = new THREE.Mesh(geometry, material);
  const planetObj = new THREE.Object3D;
  
  planetObj.add(planet);
  planet.name = "Planet";
  scene.add(planetObj);
  planet.position.x = position;
  planet.position.y = position;

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

const earth = new createPlanet(5.56,earthTexture,0, "Planet");
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); // radius, width segments, height segments
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xfff, emissive: new THREE.Color(0xffffff)}); 
const sphereMaterial1 = new THREE.MeshStandardMaterial({ color: 0x0ff, emissive: new THREE.Color(0x00ffff)});
const sphereMaterial2 = new THREE.MeshStandardMaterial({ color: 0xf0f, emissive: new THREE.Color(0xff00ff)});
const sphereMaterial3 = new THREE.MeshStandardMaterial({ color: 0xff0, emissive: new THREE.Color(0xffff00)});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial1);
const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial2);
const sphere3 = new THREE.Mesh(sphereGeometry, sphereMaterial3);

sphere.position.set(0, 30, 0);
sphere1.position.set(-30, 0, 0);
sphere2.position.set(30, 0, 0);
sphere3.position.set(0, -30, 0);

scene.add(sphere);
scene.add(sphere1);
scene.add(sphere2);
scene.add(sphere3);

// Control the objects position
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.position.y = t * -0.0002;
}
document.body.onscroll = moveCamera;

// // Animation loop
function animate() {
   requestAnimationFrame(animate);
   orbit.update(); 
   renderer.render(scene, camera);
}


function moveCameraSmooth(targetPosition, planet) {
    const initialPosition = camera.position.clone(); // Store initial position
    const distance = initialPosition.distanceTo(targetPosition);
    const framesPerSecond = 60;
    const zoomDuration = 1;
    const totalFrames = zoomDuration * framesPerSecond;
    const zoomSpeed = distance / totalFrames; // Calculate zoom speed
    // Save the initial camera quaternion (rotation)
    const initialQuaternion = camera.quaternion.clone();

    // Calculate the direction the camera should face (toward the target)
    const targetQuaternion = camera.quaternion.clone(); // Clone current rotation
    camera.lookAt(planet.position); // Temporarily rotate towards the planet
    targetQuaternion.copy(camera.quaternion); // Save the rotation toward the planet
    camera.quaternion.copy(initialQuaternion); // Reset camera to initial rotation


    let frameCount = 0;

    function animateZoom() {
        frameCount++;

        // Calculate the interpolation factor
        const t = frameCount / totalFrames;
        console.log(t)
        planet.material.opacity = 1-t;
        orbit.maxDistance = 40 - 10 * t;
        orbit.minDistance = 20 - 20 * t;
        // Interpolate camera rotation using quaternion slerp (smooth rotation)
        camera.quaternion.slerpQuaternions(initialQuaternion, targetQuaternion, t);

        // Update camera position using linear interpolation
        camera.position.lerp(initialPosition.clone().lerp(targetPosition, t), zoomSpeed);

        // Check if the animation should continue
        if (frameCount < totalFrames) {
            requestAnimationFrame(animateZoom);
        }else{
            orbit.maxDistance = 30;
            orbit.minDistance = 0;
        }
    }

    animateZoom(); // Start the zoom animation
    
}

function resetCamera(targetPosition, planet) {
    const framesPerSecond = 60;
    const zoomDuration = 1;
    const totalFrames = zoomDuration * framesPerSecond;
    

    let frameCount = 0;

    function animateTransparency() {
        frameCount++;

        const t = frameCount / totalFrames;

        planet.material.opacity = 0 + t;
        orbit.maxDistance = 30 + 10 * t;
        orbit.minDistance = 0 + 20 * t;

        // Check if the animation should continue
        if (frameCount < totalFrames) {
            requestAnimationFrame(animateTransparency);
        }else{
            planet.material.opacity = 1;
            orbit.maxDistance = 40;
            orbit.minDistance = 20;
        }
    }

    camera.position.copy(targetPosition)
    camera.lookAt(planet)
    animateTransparency()
}

// Handle resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Set up a raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Listen for mouse clicks
window.addEventListener('click', (event) => {
    // Convert the mouse position to normalized device coordinates (-1 to +1) for both axes
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    // Update the raycaster with the current camera and mouse position
    raycaster.setFromCamera(mouse, camera);
  
    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children);
  
    if (intersects.length > 0) {
      // `intersects[0]` is the first object the ray intersects with (the closest one)
      const objectClicked = intersects[0].object;
      
      switch (objectClicked.name) {
        case 'Planet':
            console.log('Planet clicked');
            
            moveCameraSmooth(objectClicked.position, objectClicked);
            break;
    
          default:
            console.log('An unknown object was clicked : ' + objectClicked.name);
            
      }
       
    }
  });

// Event listener for keydown events
window.addEventListener('keydown', (event) => {
    // Check if the pressed key is the Escape key
    if (event.key === 'Escape') {
        const planet = scene.getObjectByName("Planet");
        console.log('Escape key pressed');
        
        resetCamera(cameraDefaultPos, planet);
    }
});

const tooltip = document.getElementById('tooltip');

function updateTooltip(content, x, y) {
    tooltip.innerHTML = content; // Set the HTML content
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    //tooltip.innerText = text;
    tooltip.style.display = 'block';
  }

  const planetInfo = {
    name: "Earth",
    description: "The third planet from the Sun and the only astronomical object known to harbor life.",
    color: 0x0000ff, // blue
    texture: './src/img/earth.jpg'
}

/// Track mouse movement
window.addEventListener('mousemove', (event) => {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children)

   
    if (intersects.length > 0) {
        // `intersects[0]` is the first object the ray intersects with (the closest one)
        const objectHovered = intersects[0].object;
        
        switch (objectHovered.name) {
          case 'Planet':
              console.log('Planet hovered');
              updateTooltip(`${planetInfo.name}<br>${planetInfo.description}`, event.clientX, event.clientY);
              break;
      
            default:
        }
         
    }
    else{
        tooltip.style.display = 'none';
    }
});

animate();
