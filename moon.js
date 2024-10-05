// moon.js
import * as THREE from 'three';

export function createMoon() {
  const moonTexture = new THREE.TextureLoader().load('./images/moon.jpg');
  const normalTexture = new THREE.TextureLoader().load('./images/normal.jpg');

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshStandardMaterial({
      map: moonTexture,
      normalMap: normalTexture,
    })
  );

  // Set initial position
  moon.position.z = 30;
  moon.position.x = -10;

  return moon;
}

export function updateMoon(moon) {
  moon.rotation.x += 0.05;
  moon.rotation.y += 0.075;
  moon.rotation.z += 0.05;
}
