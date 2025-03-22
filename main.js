import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background
scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6; // Average eye height

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x567d46, // Green grass
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create some objects in the world
function createBox(x, y, z, width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const box = new THREE.Mesh(geometry, material);
    box.position.set(x, y, z);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    return box;
}

// Add some boxes
const objects = [];
objects.push(createBox(5, 1, -5, 2, 2, 2, 0xff0000));
objects.push(createBox(-5, 1, 5, 2, 2, 2, 0x00ff00));
objects.push(createBox(-10, 1, -10, 2, 4, 2, 0x0000ff));
objects.push(createBox(10, 1, 10, 2, 1, 6, 0xffff00));

// Add trees
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    const leavesGeometry = new THREE.ConeGeometry(1, 3, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 3.5, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    scene.add(leaves);
    
    objects.push(trunk);
    objects.push(leaves);
}

// Create several trees
for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    createTree(x, z);
}

// Controls
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isRunning = false; // New flag to track if running

// Event listeners
document.addEventListener('click', () => {
    controls.lock();
});

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': 
        case 'ShiftRight': 
            isRunning = true; 
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': 
        case 'ShiftRight': 
            isRunning = false; 
            break;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Movement variables
const playerSpeed = 5.0; // Units per second
const playerRadius = 0.5; // For collision detection
const runMultiplier = 2.5; // Speed multiplier when running
let prevTime = performance.now();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000; // Convert to seconds
    
    // Apply friction to slow down
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    // Set direction based on controls
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    // Only normalize if we're actually moving to avoid NaN issues
    if (direction.x !== 0 || direction.z !== 0) {
        direction.normalize();
    }
    
    // Calculate current speed based on running state
    const currentSpeed = isRunning ? playerSpeed * runMultiplier : playerSpeed;
    
    // Apply movement with the correct speed
    if (moveForward || moveBackward) {
        velocity.z -= direction.z * currentSpeed * delta;
    }
    if (moveLeft || moveRight) {
        velocity.x -= direction.x * currentSpeed * delta;
    }
    
    // Apply the velocity
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    
    // Keep the player at eye height
    camera.position.y = 1.6;
    
    // Render the scene
    renderer.render(scene, camera);
    
    prevTime = time;
}

// Start the animation loop
animate();
