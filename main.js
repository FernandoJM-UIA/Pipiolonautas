import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { emissive } from 'three/webgpu';
import html2canvas from 'html2canvas';

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
  preserveDrawingBuffer: true
});

// Set renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Load black background
const bg = new THREE.TextureLoader().load('./images/black.png');
scene.background =  bg;


// Setting up orbit control
const controls = new OrbitControls(camera, renderer.domElement);
const cameraDefaultPos = new THREE.Vector3(0, 0, 20);

controls.minDistance = 20;
controls.maxDistance = 40;
controls.enablePan = false; // Disable panning
camera.position.copy(cameraDefaultPos);

controls.update();

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
   controls.update(); 
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
        controls.maxDistance = 40 - 10 * t;
        controls.minDistance = 20 - 20 * t;
        
        camera.quaternion.slerpQuaternions(initialQuaternion, targetQuaternion, t);

        // Update camera position using linear interpolation
        camera.position.lerp(initialPosition.clone().lerp(targetPosition, t), zoomSpeed);

        // Check if the animation should continue
        if (frameCount < totalFrames) {
            requestAnimationFrame(animateZoom);
        }else{
            controls.maxDistance = 30;
            controls.minDistance = 0;
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
        controls.maxDistance = 30 + 10 * t;
        controls.minDistance = 0 + 20 * t;

        // Check if the animation should continue
        if (frameCount < totalFrames) {
            requestAnimationFrame(animateTransparency);
        }else{
            planet.material.opacity = 1;
            controls.maxDistance = 40;
            controls.minDistance = 20;
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
    const geometry = new THREE.SphereGeometry(size*2.55, 6, 6);
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

  
// ========= END SCENE SETUP =========
const pencilIcon = document.getElementById('pencil-icon');
const checkbox = document.getElementById('toggle');
let cameraControlsActive = true; // Camera status
const selectedObjects = [];
const constSaved = [];

// Arrays to hold points for the line
const linePoints = [];
// Create new constelation
const constellations = [];
let line;
let iCons = 1;


desactiveButton();
document.addEventListener('mousedown', onMouseDown);

// Event listener for checkbox changes
checkbox.addEventListener('change', function() {
  if (this.checked) {
    showSaveForm();
    cameraControlsActive = false;
    toggleCameraControl();
    activeButton();
  }else{
    cameraControlsActive = true;
    toggleCameraControl();
    hideSaveForm();
    deleteDrawnLineTotal();
    desactiveButton();
    disableBackground();
  }
});


// Add the toggleCameraControl function
function toggleCameraControl() {
  // Enable or disable camera controls
  if (cameraControlsActive) {
      controls.enableRotate = true; // Allow camera rotation
      controls.enableZoom = true; // Allow camera zoom
      controls.enablePan = true; // Allow camera panning
      console.log("Camera controls enabled.");

      // Clear the line when camera controls are enabled
      if(line){
        scene.remove(line);
        line = null;
        linePoints.length = 0;
        console.log("Line cleared");
      }
  } else {
      controls.enableRotate = false; // Disable camera rotation
      controls.enableZoom = false; // Disable camera zoom
      controls.enablePan = false; // Disable camera panning
      console.log("Camera controls disabled.");
  }
}

// Function that allo the mouse interaction with the user
function onMouseDown(event) {
  // Only allow object selection if camera controls are disabled
  if (!cameraControlsActive) {
      const coords = new THREE.Vector2(
          (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
          -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
      );

      raycaster.setFromCamera(coords, camera);
      const intersections = raycaster.intersectObjects(scene.children, true);

      if (intersections.length > 0) {
        const selectedObject = intersections[0].object;
         // Ignore the line object in the selection process
        if (selectedObject.name === 'drawingLine') {
          console.log('Line was selected, ignoring it.');
          return; // Skip if the line itself is clicked
        }
        const index = selectedObjects.indexOf(selectedObject);
          if (index === -1) {
            selectedObjects.push(selectedObject);
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());
            selectedObject.material.color = color;
            console.log(`${selectedObject.name} was selected!`);
          } 
          const point = intersections[0].point; // Get clicked point
          console.log(`Clicked point coordinates: x=${point.x}, y=${point.y}, z=${point.z}`);
          linePoints.push(point);
          drawLine(true, 0xcdf0f1, 5);
          //drawLineSegments(0xcdf0f1, 5);
          console.log("Points" + linePoints);
      }
  } else {
      console.log("Camera controls are enabled. Object selection is disabled.");
  }
}

// Function to undo the last point
function undoLastPoint() {
  if (linePoints.length > 0) {
      linePoints.pop(); // Remove the last point from the array
      console.log('Last point undone.');
      console.log(linePoints);

      // Remove the current line before redrawing it with updated points
      const currentLine = scene.getObjectByName('constellationLine' + iCons);
      if (currentLine) {
          scene.remove(currentLine); // Remove the previous line
      }

      // Redraw the line with the updated points
      drawLine(false, 0xcdf0f1, 5); // Ensure removePrevious is false, so it doesn't remove the new line
  } else {
      console.log('No points to undo.');
  }
}

// Function to draw the line
function drawLine(removePrevious = true, lineColor = 0xcdf0f1, lineThickness = 5) {
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const material = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      linewidth: lineThickness 
  });

  const line = new THREE.Line(geometry, material);
  line.name = 'constellationLine' + iCons;
  console.log(line.name + " name of line");
  
  // Set raycast to null so the line itself cannot be selected
  line.raycast = () => {};

  // If removePrevious is true, remove the previous drawn line (if any)
  const existingLine = scene.getObjectByName('constellationLine' + iCons);
  if (removePrevious && existingLine) {
    scene.remove(existingLine);
  }
  
  // Add the new line to the scene
  scene.add(line);
}


function deleteDrawnLine() {
  // Use the correct name pattern for the last drawn constellation line
  const drawnLine = scene.getObjectByName('constellationLine'+iCons);
  if (drawnLine) {
      scene.remove(drawnLine); // Remove the line from the scene
      console.log('Drawn line was deleted!');
      linePoints.length = 0; // Clear the linePoints array
      iCons--;
      console.log(linePoints + iCons);
      constSaved.pop();
  } else {
      console.log('No line to delete.');
  }
  
}

function deleteDrawnLineTotal() {
  console.log(iCons);
  let j;
  if (iCons >= 1) {
      for (j = iCons; j >= 0; j--) {
          deleteDrawnLine();
      }
  } else {
      console.log('No lines to delete.');
  }
  lockDraw();
}

document.getElementById('deleteOne').addEventListener('click', deleteDrawnLine);
document.getElementById('delete').addEventListener('click', deleteDrawnLineTotal);


// Add an event listener to the Undo button
document.getElementById('undoBtn').addEventListener('click', undoLastPoint);


// Function to create a new constellation
function createNewConstellation(){
  // Check if there are points to draw a line
  if(linePoints.length > 0){
    constellations.push([...linePoints]); // Copy the current line points
    console.log('New Constellation created with points', linePoints);

    // Clear the linePoints array for the next line
    linePoints.length = 0;
    
    // Draw the line without removing the previous ones
    drawLine(false); // Pass false so previous lines are not removed
    
    // Increment the index for the next constellation
    iCons++;
  } else {
    console.log('No points to create a constellation.');
  }
}

document.getElementById('newCons').addEventListener('click', function() {
  showSaveForm();
  // if(preSave === "complete")
    createNewConstellation();
});

function saveCanvasImage(){
  // Use html2canvas to take a screenshot of the entire body element
  html2canvas(document.body).then(function(canvas) {
    // Convert the canvas to a data URL
    const dataURL = canvas.toDataURL('image/png');

    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the download attribute with a file name
    link.download = 'Constellation.png'; // You can set any name for the saved file
    
    // Set the href attribute to the canvas data URL
    link.href = dataURL;
    
    // Programmatically click the link to trigger the download
    link.click();
  });
}

// Function to invert colors on the canvas
function invertColors(canvas) {
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Loop through each pixel in the image data and invert the colors
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];     // Invert Red
    data[i + 1] = 255 - data[i + 1]; // Invert Green
    data[i + 2] = 255 - data[i + 2]; // Invert Blue
    // data[i + 3] is the Alpha (transparency), leave it unchanged
  }

  // Put the modified image data back onto the canvas
  context.putImageData(imageData, 0, 0);
}


// Show the form to save constellation details
function showSaveForm() {
  document.getElementById('saveForm').style.display = 'flex';
}
function hideSaveForm(){
  document.getElementById('saveForm').style.display = 'none';
}

// Cancel the save action
function cancelSave() {
  document.getElementById('saveForm').style.display = 'none';
  document.getElementById('constellationName').value = '';
  document.getElementById('constellationDesc').value = '';
}

document.getElementById('cancelSave').addEventListener('click', function() {
  cancelSave(); 
  if(iCons <= 0){
    lockDraw();
  }
});

function lockDraw(){
  toggleCameraControl();
  checkbox.checked = false;
  desactiveButton();
  cameraControlsActive = true;
  toggleCameraControl();
}

// prefilled save Form
function preSave(event){
  event.preventDefault();
  const name = document.getElementById('constellationName').value.trim();
  const description = document.getElementById('constellationDesc').value.trim();

  if(!name || !description){
    alert("Please fill all fields");
    return;
  }

  // Store the name and description in the array
  constSaved.push({name, description});
  cancelSave(); 
  console.log(constSaved);
  return "complete";
}
document.getElementById('saveForm').addEventListener('submit', preSave);

// Function to save the points
function save(){
  if(linePoints.length > 0){
    constellations.push([...linePoints]); // Copy the current line points
    console.log('Point saved', linePoints);
    drawLine(true);
    linePoints.length = 0;
  }
  // Prepare the data to be daved
  const constellationData = {
    exoplanet: "Not Define yet",
    name: constSaved[0].name,
    description: constSaved[0].description,
    points: constellations[0],
  };
  console.log(constellationData);

   // Convert to JSON format
   const dataStr = JSON.stringify(constellationData, null, 2);

   // Create a blob and a link to download the file
   const blob = new Blob([dataStr], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = constellationData.name+".json"; // Use the constellation name for the file name
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url); // Clean up
   saveCanvasImage();
   invertColors();
}
document.getElementById('saveCons').addEventListener('click', save);

function openUploadFiles(){
  document.getElementById('uploadContainer').style.display = 'flex';
}

function closeUploadFiles(){
  document.getElementById('uploadContainer').style.display = 'none';
}

document.getElementById('uploadButton').addEventListener('click', openUploadFiles);
document.getElementById('cancelUpload').addEventListener('click', closeUploadFiles);

// Listen for file upload
document.getElementById('file').addEventListener('change', function(event) {
  const file = event.target.files[0]; // Get the uploaded file
  if (file) {
    const reader = new FileReader();

    // When the file is read
    reader.onload = function(e) {
      try {
        // Parse the JSON data
        const data = JSON.parse(e.target.result);
        console.log("Loaded Data:", data);

        // Extract points from the data and draw the constellation
        if (data.points && data.points.length > 0) {
          const linePoints = data.points.map(point => new THREE.Vector3(point.x, point.y, point.z));

          // Call drawLine to draw the figure
          drawLineFromData(linePoints);
        } else {
          console.error("No points data found in the uploaded file.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    // Read the file as text
    reader.readAsText(file);
  }
  closeUploadFiles();
});

// Function to draw the constellation based on uploaded data points
function drawLineFromData(linePoints, removePrevious = true, lineColor = 0xcdf0f1, lineThickness = 5) {
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const material = new THREE.LineBasicMaterial({
    color: lineColor,
    linewidth: lineThickness
  });

  const line = new THREE.Line(geometry, material);
  line.name = 'constellationLine'+iCons;
  line.raycast = () => {}; // Prevent raycasting

  // If removePrevious is true, remove the previous drawn line (if any)
  if (removePrevious && scene.getObjectByName(line.name)) {
    scene.remove(scene.getObjectByName(line.name));
  }

  scene.add(line); // Add the line to the scene
}

function desactiveButton(){
  const deleteOne = document.getElementById('deleteOne');
  const deleteAll = document.getElementById('delete');
  const undo = document.getElementById('undoBtn');
  const newCons = document.getElementById('newCons');
  const saveCons = document.getElementById('saveCons');

  deleteOne.classList.add('unableButton');
  deleteAll.classList.add('unableButton');
  undo.classList.add('unableButton');
  newCons.classList.add('unableButton');
  saveCons.classList.add('unableButton');
}

function activeButton(){
  const deleteOne = document.getElementById('deleteOne');
  const deleteAll = document.getElementById('delete');
  const undo = document.getElementById('undoBtn');
  const newCons = document.getElementById('newCons');
  const saveCons = document.getElementById('saveCons');

  if (deleteOne.classList.contains('unableButton')) {
    deleteOne.classList.remove('unableButton');
  }
  if (deleteAll.classList.contains('unableButton')) {
    deleteAll.classList.remove('unableButton');
  }
  if (undo.classList.contains('unableButton')) {
    undo.classList.remove('unableButton');
  }
  if (newCons.classList.contains('unableButton')) {
    newCons.classList.remove('unableButton');
  }
  if (saveCons.classList.contains('unableButton')) {
    saveCons.classList.remove('unableButton');
  }
}

function enableBackground(){
  const background = document.getElementById('backgroundBlur');
  const header = document.getElementById('header');
  header.style.zIndex = 98;
  background.classList.add('active');
}

function disableBackground(){
  const background = document.getElementById('backgroundBlur');
  if(background.classList.contains('active')){
    background.classList.remove('active'); 
  }
}


animate();
