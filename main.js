import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { emissive } from 'three/webgpu';

// Scene == container
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  100000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

// Set renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Load black background
const bg = new THREE.TextureLoader().load('./images/black.png');
scene.background =  bg;


// Setting up orbit control
const orbit = new OrbitControls(camera, renderer.domElement);
const cameraDefaultPos = new THREE.Vector3(0, 0, 20);

orbit.minDistance = 20;
orbit.maxDistance = 40;
orbit.enablePan = false; // Disable panning
camera.position.copy(cameraDefaultPos);

orbit.update();

const textureload = new THREE.TextureLoader();
const list = ['Earth', 'venus', 'mars'];


const starsArray = [];

Papa.parse('./src/data/stars_dummy.csv', {
    download: true,
    header: true, // Set to true to parse headers and skip them in the data
    
    complete: function(results) {
        const data = results.data; // Parsed data as an array of objects
        data.forEach((row, index) => {
            // Access each column from the row object by referring to its keys
            const X = row.X ;
            const Y = row.Y ;
            const Z = row.Z ;
            const luminosity = row['Normalized Luminosity']; // Use bracket notation for column names with spaces
            
            const radius = row['Normalized Radius'];
            
            const star = addStar(X,Y,Z, radius, luminosity);
            starsArray.push(star); // Push the star mesh to the array
        });
    }
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function changePlanetTexture(planet, texture, name){
    let texturePlanet 
    // List of textures available
    starsArray.forEach(star => {
        scene.remove(star); // Remove the star from the scene
    });
    starsArray.length = 0; // Clear the starsArray

    if (list.includes(name)) {
        texturePlanet = textureload.load('./src/img/'+name+'.jpg');
        
        Papa.parse('./src/data/stars_dummy.csv', {
            download: true,
            header: true, // Set to true to parse headers and skip them in the data
            
            complete: function(results) {
                const data = results.data; // Parsed data as an array of objects
                data.forEach((row, index) => {
                    // Access each column from the row object by referring to its keys
                    const X = row.X ;
                    const Y = row.Y ;
                    const Z = row.Z ;
                    const luminosity = row['Normalized Luminosity']; // Use bracket notation for column names with spaces
                    
                    const radius = row['Normalized Radius'];
                    
                    const star = addStar(X,Y,Z, radius, luminosity);
                    starsArray.push(star); // Push the star mesh to the array
                });
            }
        });
        
    } else {
        texturePlanet = textureload.load('./src/img/'+texture +'.png');

        Papa.parse('./src/data/stars_dummy.csv', {
            download: true,
            header: true, // Set to true to parse headers and skip them in the data
            
            complete: function(results) {
                const data = results.data; // Parsed data as an array of objects
                data.forEach((row, index) => {
                    // Access each column from the row object by referring to its keys
                    const X = row.X + 10 * texture;
                    const Y = row.Y - 10 * texture;
                    const Z = row.Z +5 * texture;
                    const luminosity = row['Normalized Luminosity']; // Use bracket notation for column names with spaces
                    
                    const radius = row['Normalized Radius'];
                    
                    const star = addStar(X, Y, Z, radius, luminosity);
                    starsArray.push(star); // Push the star mesh to the array
                });
            }
        });

        
    }

    planet.material.map = texturePlanet;
    planet.material.emissiveMap = texturePlanet;
    planet.material.needsUpdate = true;
    console.log(`Texture of ${planet.name} has been changed.`)

}

const directionalLight = new THREE.DirectionalLight(0xffddcc, 3); // Bright white light
directionalLight.position.set(4, 1, 4).normalize(); // Set the position and normalize
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffcc00, 0.2); // Soft white light
scene.add(ambientLight);

function createPlanet(size, texture, ring){
    let texturePlanet 
    // List of textures available

    if (list.includes(texture)) {
        texturePlanet = textureload.load('./src/img/'+texture+'.jpg');
    } else {
        texturePlanet = textureload.load('./src/img/default.jpg');
    }

  const geometry = new THREE.SphereGeometry(size, 50, 50);
  const material = new THREE.MeshStandardMaterial({
    map : texturePlanet,
    //emissive: new THREE.Color(0xcccccc),
    //emissiveMap : texturePlanet,
    //emissiveIntensity : 1,
    transparent: true, 
    opacity: 1 
  });
  const planet = new THREE.Mesh(geometry, material);
  const planetObj = new THREE.Object3D;
  
  planetObj.add(planet);
  planet.name = "Planet";
  scene.add(planetObj);
  planet.position.x = 0;
  planet.position.y = 0;
  planet.position.z = 0;

  return {planet, planetObj};
}

const earth = new createPlanet(5.56, "Earth", true);

// Control the objects position
function moveCamera() {
  const t = document.body.getBoundingClientRect().top;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.position.y = t * -0.0002;
}
document.body.onscroll = moveCamera;

// Animation loop
function animate() {
    earth.planet.rotateY(0.001);
    earth.planetObj.rotateY(0.001);
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
            tooltip.style.display = 'none';
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

let planetInfo =  `
<h3>Earth</h3><br>
<p><strong>Hostname:</strong> <br>The sun</p>
<p><strong>Right Ascension (RA):</strong> <br>4291.95</p>
<p><strong>Declination (Dec):</strong> <br>63.87</p>
<p><strong>Distance (sy_dist):</strong> <br>0.00000484</p>`;

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
              updateTooltip(planetInfo, event.clientX, event.clientY);
              break;
      
            default:
        }
         
    }
    else{
        tooltip.style.display = 'none';
    }
});



document.getElementById('searchBar').addEventListener('input', function (event) {
    const searchTerm = event.target.value.toLowerCase();
    const dropdown = document.getElementById('dropdown');
    dropdown.innerHTML = ''; // Clear previous results

    // Load and parse the CSV file
    Papa.parse('./src/data/exoplanetsCleaned.csv', {
        download: true,
        header: true,
        complete: function (results) {
            const data = results.data;

            // Filter the data based on the search term
            const filtered = data.filter(row => row.pl_name.toLowerCase().includes(searchTerm));

            // Limit the display to the first 5 results
            const displayLimit = 5;
            const planetsToDisplay = filtered.slice(0, displayLimit);

            // Display the first 5 planets in the dropdown
            planetsToDisplay.forEach(planet => {
                const planetElement = document.createElement('div');
                planetElement.classList.add('dropdown-item');
                planetElement.textContent = planet.pl_name;
                
                // Add click event to each planet
                planetElement.addEventListener('click', function () {
                    // Do something when a planet is clicked, for example:
                    console.log(`Planet clicked: ${planet.pl_name}, ${planet.hostname}`);
                    const current = scene.getObjectByName("Planet");
                    changePlanetTexture(current,`${planet.random_value}`, `${planet.pl_name}`);


                    

                    // You can also call a function here to display more info about the planet
                    displayPlanetInfo(planet);
                });
                
                dropdown.appendChild(planetElement);
            });

            // If more than 5 results are found, add a message indicating there are more
            if (filtered.length > displayLimit) {
                const moreResultsElement = document.createElement('div');
                moreResultsElement.classList.add('dropdown-item');
                moreResultsElement.textContent = `+ ${filtered.length - displayLimit} more results found...`;
                dropdown.appendChild(moreResultsElement);
            }

            // Show the dropdown only if there are results
            dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
        }
    });
});

// Function to display additional information about the selected planet
function displayPlanetInfo(planet) {
    // Here you can define what happens when the planet is clicked
    // For example, you could display the planet details in a separate div
    if (list.includes(planet.pl_name)) {
        planetInfo = `
        <h3>${planet.pl_name}</h3><br>
        <p><strong>Hostname:</strong> <br>${planet.hostname}</p>
        <p><strong>Right Ascension (RA):</strong> <br>${planet.ra}</p>
        <p><strong>Declination (Dec):</strong> <br>${planet.dec}</p>
        <p><strong>Distance (sy_dist):</strong> <br>${planet.sy_dist}</p>`;
    } else {
        planetInfo = `
        <h3>${planet.pl_name}</h3><br>
        <p><strong>Hostname:</strong> <br>${planet.hostname}</p>
        <p><strong>Right Ascension (RA):</strong> <br>${planet.ra}</p>
        <p><strong>Declination (Dec):</strong> <br>${planet.dec}</p>
        <p><strong>Distance (sy_dist):</strong> <br>${planet.sy_dist}</p>
        <p style="font-size:10px">Random texture applied</p>`;
    }

    
    
}

function addStar(x, y, z, size, brightness) {
    const geometry = new THREE.SphereGeometry(size*2, 6, 6);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(brightness, brightness, brightness),
        emissive : 0xffffff,
        emissiveIntensity : brightness
    });
    const star = new THREE.Mesh(geometry, material);

    star.position.set(x, y, z);
    scene.add(star);
    return star;
  }
  
  


animate();
