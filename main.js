import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js';

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

// Enable WebXR
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Add VR button
document.body.appendChild(VRButton.createButton(renderer));

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

// XR Controllers setup
const controllerModelFactory = new XRControllerModelFactory();

// Controller 1
const controller1 = renderer.xr.getController(0);
scene.add(controller1);

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
scene.add(controllerGrip1);

// Controller 2
const controller2 = renderer.xr.getController(1);
scene.add(controller2);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
scene.add(controllerGrip2);

// Add a line for controller ray visualization
const geometryLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1)
]);
const materialLine = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
});

const line = new THREE.Line(geometryLine, materialLine);
line.scale.z = 5;
controller1.add(line.clone());
controller2.add(line.clone());

// Controls for desktop mode
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isRunning = false; // New flag to track if running

// Add a user cameraGroup to move in VR
const cameraGroup = new THREE.Group();
cameraGroup.position.set(0, 0, 0);
cameraGroup.add(camera);
scene.add(cameraGroup);

// Event listeners for desktop mode
document.addEventListener('click', () => {
    if (!renderer.xr.isPresenting) {
        controls.lock();
    }
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

// Controller event handlers for VR
controller1.addEventListener('selectstart', onSelectStart);
controller1.addEventListener('selectend', onSelectEnd);
controller2.addEventListener('selectstart', onSelectStart);
controller2.addEventListener('selectend', onSelectEnd);

// Handle VR controller input
let vrMoving = false;

function onSelectStart() {
    vrMoving = true;
}

function onSelectEnd() {
    vrMoving = false;
}

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
const vrSpeed = 3.0; // Speed in VR mode
let prevTime = performance.now();

// Animation loop for standard non-VR mode
function animate() {
    renderer.setAnimationLoop(render);
}

// Render function that handles both VR and non-VR
function render() {
    const time = performance.now();
    const delta = (time - prevTime) / 1000; // Convert to seconds
    
    if (renderer.xr.isPresenting) {
        // VR mode movement
        handleVRMovement(delta);
    } else {
        // Desktop mode movement
        handleDesktopMovement(delta);
    }
    
    // Render the scene
    renderer.render(scene, camera);
    
    prevTime = time;
}

// Handle desktop movement with keyboard
function handleDesktopMovement(delta) {
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
}

// Handle VR movement with controllers
function handleVRMovement(delta) {
    if (vrMoving) {
        // Get the direction the controller is pointing
        const controller = renderer.xr.getController(0); // Primary controller
        
        // Use controller orientation to determine direction
        const controllerDirection = new THREE.Vector3(0, 0, -1);
        controllerDirection.applyQuaternion(controller.quaternion);
        controllerDirection.y = 0; // Keep movement on the horizontal plane
        controllerDirection.normalize();
        
        // Move in the direction the controller is pointing
        cameraGroup.position.addScaledVector(controllerDirection, -vrSpeed * delta);
    }
}

// Start the animation loop
animate();