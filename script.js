// --- Core Three.js Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xa1c4fd, 1.2);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// --- PointerLockControls (WASD + Mouse) ---
let controls;
function setupControls() {
  controls = new THREE.PointerLockControls(camera, document.body);
  document.body.addEventListener('click', () => controls.lock());
  // WASD movement
  const move = { forward: false, backward: false, left: false, right: false };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') move.forward = true;
    if (e.code === 'KeyS') move.backward = true;
    if (e.code === 'KeyA') move.left = true;
    if (e.code === 'KeyD') move.right = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') move.forward = false;
    if (e.code === 'KeyS') move.backward = false;
    if (e.code === 'KeyA') move.left = false;
    if (e.code === 'KeyD') move.right = false;
  });
  // Movement update
  controls.updateMovement = function(delta) {
    const speed = 3.5 * delta;
    if (move.forward) controls.moveForward(speed);
    if (move.backward) controls.moveForward(-speed);
    if (move.left) controls.moveRight(-speed);
    if (move.right) controls.moveRight(speed);
  };
}
setupControls();

// --- Journey3D System ---
class Journey3D {
  constructor() {
    this.currentScene = 0;
    this.scenes = [this.welcomeHub.bind(this)]; // Add more scenes here
    this.sceneObjects = [];
    this.interactiveObjects = [];
    this.raycaster = new THREE.Raycaster();
    this.createPointer();
    this.loadScene(0);
  }
  clearScene() {
    for (const obj of this.sceneObjects) scene.remove(obj);
    this.sceneObjects = [];
    this.interactiveObjects = [];
  }
  loadScene(index) {
    this.clearScene();
    this.currentScene = index;
    this.scenes[index]();
  }
  // --- 3D Pointer Tool ---
  createPointer() {
    const pointerGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const pointerMat = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffee00, emissiveIntensity: 0.7 });
    this.pointer = new THREE.Mesh(pointerGeo, pointerMat);
    this.pointer.visible = false;
    scene.add(this.pointer);
  }
  updatePointer() {
    // Raycast from camera center
    this.raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      this.pointer.position.copy(hit.point);
      this.pointer.visible = true;
      this.pointer.scale.set(1.2, 1.2, 1.2);
      this.pointer.material.color.set(0x00ff99);
      this.pointer.material.emissive.set(0x00ff99);
      this.pointer.userData.hovered = true;
    } else {
      this.pointer.visible = false;
      this.pointer.scale.set(1, 1, 1);
      this.pointer.material.color.set(0xffff00);
      this.pointer.material.emissive.set(0xffee00);
      this.pointer.userData.hovered = false;
    }
  }
  // --- Scene 1: Welcome Hub ---
  welcomeHub() {
    // 3D UCB Logo (Torus as placeholder)
    const logoGeo = new THREE.TorusGeometry(1, 0.18, 24, 100);
    const logoMat = new THREE.MeshPhysicalMaterial({
      color: 0x00cfff, metalness: 0.7, roughness: 0.2, clearcoat: 1,
      emissive: 0x00cfff, emissiveIntensity: 0.5
    });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(0, 2.2, 0);
    scene.add(logo);
    this.sceneObjects.push(logo);

    // Holographic Welcome Message (CanvasTexture on Plane)
    const message = this.createHoloText('Welcome to UCB Digital Academy', 0.5, 0x00cfff);
    message.position.set(0, 1.2, 0);
    scene.add(message);
    this.sceneObjects.push(message);

    // Portal (Torus)
    const portalGeo = new THREE.TorusGeometry(1.2, 0.07, 24, 100);
    const portalMat = new THREE.MeshPhysicalMaterial({
      color: 0x667eea, metalness: 0.8, roughness: 0.1, clearcoat: 1,
      emissive: 0x667eea, emissiveIntensity: 0.4
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 0, -2);
    portal.rotation.x = Math.PI / 2;
    scene.add(portal);
    this.sceneObjects.push(portal);
    // Make portal interactive
    portal.userData.interactive = true;
    this.interactiveObjects.push(portal);

    // Ambient Particles
    this.particles = this.createParticles(80);
    this.particles.forEach(p => scene.add(p));
    this.sceneObjects.push(...this.particles);

    // Animate logo and portal
    this.logo = logo;
    this.portal = portal;
    this.message = message;
  }
  createHoloText(text, size, color) {
    // Canvas-based holographic text
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 64px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00cfff';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#a1c4fd';
    ctx.fillText(text, 512, 128);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const geo = new THREE.PlaneGeometry(3.5, 0.9);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.material.opacity = 0.92;
    return mesh;
  }
  createParticles(count) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.06, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xa1c4fd, transparent: true, opacity: 0.5 + Math.random() * 0.5
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 6,
        0.5 + Math.random() * 3,
        (Math.random() - 0.5) * 6
      );
      particles.push(mesh);
    }
    return particles;
  }
  update(delta) {
    // Animate logo, portal, message, and particles
    if (this.logo) this.logo.rotation.y += delta * 0.3;
    if (this.portal) this.portal.rotation.z += delta * 0.5;
    if (this.message) this.message.material.opacity = 0.8 + 0.2 * Math.sin(Date.now() * 0.002);
    if (this.particles) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002;
        p.position.x += Math.cos(Date.now() * 0.0012 + i) * 0.001;
      }
    }
    this.updatePointer();
  }
}

const journey = new Journey3D();

// Hide loading screen after initialization
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.classList.add('hidden');
}, 2000);

// --- Scroll-Driven Panel Reveal System ---
const sections = Array.from(document.querySelectorAll('.section'));
let currentSection = 0;
function showSection(index) {
  sections.forEach((sec, i) => {
    sec.classList.toggle('active', i === index);
  });
  journey.loadScene(index); // Sync 3D scene
}
showSection(currentSection);

window.addEventListener('wheel', (e) => {
  if (e.deltaY > 0 && currentSection < sections.length - 1) {
    currentSection++;
    showSection(currentSection);
  } else if (e.deltaY < 0 && currentSection > 0) {
    currentSection--;
    showSection(currentSection);
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
    currentSection++;
    showSection(currentSection);
  } else if (e.key === 'ArrowUp' && currentSection > 0) {
    currentSection--;
    showSection(currentSection);
  }
});

// --- Mobile Touch Controls ---
let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let joystick = null, joystickKnob = null, joystickActive = false, joystickStart = {x:0, y:0};
let joystickDir = {x:0, y:0};
let lastTouchX = 0, lastTouchY = 0;

function createJoystick() {
  if (!isTouch) return;
  joystick = document.createElement('div');
  joystick.className = 'touch-joystick';
  joystickKnob = document.createElement('div');
  joystickKnob.className = 'touch-joystick-knob';
  joystick.appendChild(joystickKnob);
  document.body.appendChild(joystick);

  joystick.addEventListener('touchstart', e => {
    joystickActive = true;
    const t = e.touches[0];
    joystickStart.x = t.clientX;
    joystickStart.y = t.clientY;
    joystickDir.x = 0; joystickDir.y = 0;
  });
  joystick.addEventListener('touchmove', e => {
    if (!joystickActive) return;
    const t = e.touches[0];
    let dx = t.clientX - joystickStart.x;
    let dy = t.clientY - joystickStart.y;
    const maxDist = 40;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) {
      dx = dx * maxDist / dist;
      dy = dy * maxDist / dist;
    }
    joystickKnob.style.transform = `translate(${dx}px,${dy}px)`;
    joystickDir.x = dx / maxDist;
    joystickDir.y = dy / maxDist;
  });
  joystick.addEventListener('touchend', e => {
    joystickActive = false;
    joystickKnob.style.transform = '';
    joystickDir.x = 0; joystickDir.y = 0;
  });
}
createJoystick();

// Touch swipe for camera look
if (isTouch) {
  let lookActive = false;
  let lastLookX = 0, lastLookY = 0;
  document.body.addEventListener('touchstart', e => {
    if (e.target.closest('.touch-joystick')) return;
    lookActive = true;
    lastLookX = e.touches[0].clientX;
    lastLookY = e.touches[0].clientY;
  });
  document.body.addEventListener('touchmove', e => {
    if (!lookActive) return;
    const t = e.touches[0];
    const dx = t.clientX - lastLookX;
    const dy = t.clientY - lastLookY;
    lastLookX = t.clientX;
    lastLookY = t.clientY;
    // Adjust camera rotation (yaw/pitch)
    camera.rotation.y -= dx * 0.005;
    camera.rotation.x -= dy * 0.005;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  });
  document.body.addEventListener('touchend', e => {
    lookActive = false;
  });
}

// --- Animation Loop ---
let lastTime = performance.now();
function animate() {
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  // Desktop controls
  if (controls && controls.updateMovement && !isTouch) controls.updateMovement(delta);
  // Mobile joystick movement
  if (isTouch && joystick) {
    // Forward/backward: y, Left/right: x
    const speed = 2.5 * delta;
    const forward = -joystickDir.y;
    const right = joystickDir.x;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const rightVec = new THREE.Vector3().crossVectors(camera.up, dir).normalize();
    camera.position.addScaledVector(dir, speed * forward);
    camera.position.addScaledVector(rightVec, speed * right);
  }
  journey.update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- Responsive ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Click Handler for Pointer Feedback ---
window.addEventListener('click', () => {
  if (journey.pointer && journey.pointer.userData.hovered) {
    journey.pointer.material.color.set(0x00ff00);
    journey.pointer.material.emissive.set(0x00ff00);
    setTimeout(() => {
      journey.pointer.material.color.set(0xffff00);
      journey.pointer.material.emissive.set(0xffee00);
    }, 200);
  }
});
