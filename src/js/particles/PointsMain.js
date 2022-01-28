import * as THREE from 'three';
import Simulation from './Simulation';
import PointsWrapper from './PointsWrapper';
import { getRect } from '../tsunami/window';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

let renderer, scene, camera, controls, bounds, emitter, emitterSpeed, simulation, particles, gui, clock;

export function PointsMain() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3b475f);
  scene.fog = new THREE.Fog(0x3b475f, 0, 100);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight);
  camera.position.x = -20;
  camera.position.z = 20;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  bounds = new THREE.Vector3(10, 5, 10);
  emitter = new THREE.Vector3(0, 0, 0);
  emitter.x = Math.random() * bounds.x - bounds.x / 2;
  emitter.y = Math.random() * bounds.y - bounds.y / 2;
  emitter.z = Math.random() * bounds.z - bounds.z / 2;
  emitterSpeed = new THREE.Vector3(0.071, 0.078, 0.125);

  const simSize = 128;
  simulation = new Simulation(renderer, emitter, simSize, simSize);

  const pointTexture = new THREE.TextureLoader().load('assets/particles/particle-color.png');

  particles = new PointsWrapper({
    simulation,
    pointTexture,
  });

  scene.add(particles.mesh);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3b475f, 0.33);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 40;
  dirLight.shadow.camera.bottom = -40;
  dirLight.shadow.camera.left = -40;
  dirLight.shadow.camera.right = 40;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  // light.shadow.camera.far = 20;

  scene.add(dirLight);

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x3b475f, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -12;
  floor.receiveShadow = true;
  scene.add(floor);

  // gui
  gui = new GUI();
  gui.add(simulation.shader.uniforms.factor, 'value', 0, 1, 0.001).name('life factor');
  const noiseFolder = gui.addFolder('curl noise');
  noiseFolder.add(simulation.shader.uniforms.frequency, 'value', 0.02, 0.3, 0.001).name('frequency');
  noiseFolder.add(simulation.shader.uniforms.amplitude, 'value', 0, 0.1, 0.001).name('amplitude');
  noiseFolder.add(simulation.shader.uniforms.speed, 'value', 0, 1, 0.001).name('speed');
  const lightsFolder = gui.addFolder('lights');
  lightsFolder.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemi');
  lightsFolder.add(dirLight, 'intensity', 0, 1, 0.01).name('directional');

  window.addEventListener('resize', onWindowResize, false);

  onWindowResize();

  clock = new THREE.Clock();

  animate();
}

function onWindowResize() {
  const rect = getRect();

  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();

  renderer.setSize(rect.width, rect.height);

  particles.material.uniforms['ratio'].value = rect.height;
}

function animate() {
  emitter.add(emitterSpeed);

  if (emitter.x > bounds.x || emitter.x < -bounds.x) {
    emitterSpeed.x *= emitterSpeed.x - 1;
  }
  if (emitter.y > bounds.y || emitter.y < -bounds.y) {
    emitterSpeed.y *= emitterSpeed.y - 1;
  }
  if (emitter.z > bounds.z || emitter.z < -bounds.z) {
    emitterSpeed.z *= emitterSpeed.z - 1;
  }

  const delta = clock.getDelta() * 10;
  const time = clock.elapsedTime;

  simulation.render(time, delta);

  if (particles.material.uniforms) {
    particles.material.uniforms.sim.value = simulation.targets[simulation.targetPos].texture;
  }

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

window.MainPoints = PointsMain;
