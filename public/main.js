import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import html2canvas from 'html2canvas';

// Scene == container
const scene = new THREE.Scene();

// Camera (field of view, aspect ratio, frustum)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  preserveDrawingBuffer: true
});

// Set renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

// Torus geometry, material, and mesh
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(20, 20, 20);

// Ambient Light 
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight );

const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);

//scene.add(lightHelper, gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

// Function add Stars
function addStar(){
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({color: 0xffffff});
  const star = new THREE.Mesh(geometry, material);

  // Set random position to the stars
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}
// Create an array with the number of stars
Array(200).fill().forEach(addStar);

// Load the background of the space
const spaceTexture = new THREE.TextureLoader().load('./blackbg.avif');
scene.background = spaceTexture;
// Texture maping to add texture to individual materials, also it's possible to create own texture and types of materials

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotation
  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;
  
  controls.update();

  // Render scene
  renderer.render(scene, camera);
}

// Handle resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

animate();




// ========= END SCENE SETUP =========
const pencilIcon = document.getElementById('pencil-icon');
let cameraControlsActive = true; // Camera status
const selectedObjects = [];
const raycaster = new THREE.Raycaster();
const constSaved = [];

// Arrays to hold points for the line
const linePoints = [];
// Create new constelation
const constellations = [];
let line;
let iCons = 1;

document.addEventListener('mousedown', onMouseDown);
pencilIcon.addEventListener('click', () => {
  toggleCameraControl();
  showSaveForm();
});


// Add the toggleCameraControl function
function toggleCameraControl() {
  cameraControlsActive = !cameraControlsActive; // Toggle state

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
          printSelectedObjects();
          console.log("Points" + linePoints);
      }
  } else {
      console.log("Camera controls are enabled. Object selection is disabled.");
  }
}

function drawLine(removePrevious = true, lineColor = 0xcdf0f1, lineThickness = 5) {
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const material = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      linewidth: lineThickness 
  });

  const line = new THREE.Line(geometry, material);
  line.name = 'constellationLine'+iCons;
  // Set raycast to null so the line itself cannot be selected
  line.raycast = () => {};

  // If removePrevious is true, remove the previous drawn line (if any)
  if (removePrevious && scene.getObjectByName(line.name)) {
    scene.remove(scene.getObjectByName(line.name));
  }
  scene.add(line); // Add the line to the scene
}

function drawLineSegments(lineColor = 0xcdf0f1, lineThickness = 1) {
  // Create a new BufferGeometry
  const geometry = new THREE.BufferGeometry();

  // Ensure linePoints contains pairs of points for segments
  const vertices = [];
  for (let i = 0; i < linePoints.length - 1; i++) {
    vertices.push(linePoints[i].x, linePoints[i].y, linePoints[i].z); // Start point
    vertices.push(linePoints[i + 1].x, linePoints[i + 1].y, linePoints[i + 1].z); // End point
  }

  // Set the vertices to the geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  // Create material with variable color
  const material = new THREE.LineBasicMaterial({
      color: lineColor
  });

  const lineSegments = new THREE.LineSegments(geometry, material);

  // Set raycast to null so the line itself cannot be selected
  lineSegments.raycast = () => {};

  // Remove the previous line if it exists
  const existingLine = scene.getObjectByName('drawingLine');
  if (existingLine) {
      scene.remove(existingLine);
  }

  lineSegments.name = 'drawingLine'; // Set a name for easy identification and removal later
  scene.add(lineSegments); // Add the line to the scene
}


function printSelectedObjects(){
  const selectedNames = selectedObjects.map(obj => obj.name);
  //console.log('Selected Objects', selectedNames);
}

function deleteDrawnLine() {
  // Use the correct name pattern for the last drawn constellation line
  const drawnLine = scene.getObjectByName('constellationLine'+iCons);
  if (drawnLine) {
      scene.remove(drawnLine); // Remove the line from the scene
      console.log('Drawn line was deleted!');
      linePoints.length = 0; // Clear the linePoints array
      iCons--;
      console.log("iCons" +iCons);
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
}

document.getElementById('deleteDrawn').addEventListener('click', deleteDrawnLine);
document.getElementById('delete').addEventListener('click', deleteDrawnLineTotal);

// Function to undo the last point
function undoLastPoint() {
  if (linePoints.length > 0) {
      linePoints.pop(); // Remove the last point from the array
      console.log('Last point undone.');
      console.log(linePoints);
      // Remove the current line before redrawing it with updated points
      const currentLine = scene.getObjectByName('constellationLine'+iCons);
      if (currentLine) {
          scene.remove(currentLine); // Remove the previous line
      }
      drawLine(); // Redraw the line with the updated points, without removing previous lines
  } else {
      console.log('No points to undo.');
  }
}

// Add an event listener to the Undo button
document.getElementById('undoBtn').addEventListener('click', undoLastPoint);


// Functio to create a new constelation
function createNewConstellation(){
  // Check if there are point to draw a line
  if(linePoints.length > 0){
    constellations.push([...linePoints]); // Copy the current line points
    console.log('New Constellation created with point', linePoints);
    drawLine(true);
    // Clear the points for the next line
    linePoints.length = 0;
    iCons++;
  }else{
    console.log('No points to create a constellation.');
  }
}

document.getElementById('newCons').addEventListener('click', function() {
  showSaveForm();
  createNewConstellation(); // Create a new constellation
});

function saveCanvasImage(){
  // Use html2canvas to take a screenshot of the entire body element
  html2canvas(document.body).then(function(canvas) {
    // Convert the canvas to a data URL
    const dataURL = canvas.toDataURL('image/png');

    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the download attribute with a file name
    link.download = 'page-screenshot.png'; // You can set any name for the saved file
    
    // Set the href attribute to the canvas data URL
    link.href = dataURL;
    
    // Programmatically click the link to trigger the download
    link.click();
  });
}

// Show the form to save constellation details
function showSaveForm() {
  document.getElementById('saveForm').style.display = 'flex';
}

// Cancel the save action
function cancelSave() {
  document.getElementById('saveForm').style.display = 'none';
  document.getElementById('constellationName').value = '';
  document.getElementById('constellationDesc').value = '';
}

document.getElementById('cancelSave').addEventListener('click', cancelSave);

// prefilled save Form
function preSave(event){
  const name = document.getElementById('constellationName').value.trim();
  const description = document.getElementById('constellationDesc').value.trim();

  event.preventDefault();
  if(!name || !description){
    alert("Please fill all fields");
    return;
  }

  // Store the name and description in the array
  constSaved.push({name, description});
  cancelSave(); 
  console.log(constSaved);
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
   a.download = `${name}.json`; // Use the constellation name for the file name
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url); // Clean up
   saveCanvasImage();
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
