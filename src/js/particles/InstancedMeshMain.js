import * as THREE from 'three';
import Simulation from './Simulation';
import { getRect } from '../tsunami/window';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import WrapperInstancedMesh from './InstancedMeshWrapper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

let renderer,
  pmremGenerator,
  envMap,
  params,
  scene,
  camera,
  controls,
  bounds,
  emitter,
  emitterSpeed,
  simulation,
  particles,
  gui,
  clock;

export function InstancedMeshMain() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;

  const isAppleDevice = navigator.userAgent.match(/iPhone|iPad|iPod/i);
  const floatType = isAppleDevice ? THREE.HalfFloatType : THREE.FloatType;

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  new RGBELoader().setDataType(floatType).load(`assets/b515_IBL.hdr`, (t) => {
    envMap = pmremGenerator.fromEquirectangular(t).texture;
    hdrLoaded();
  });
}

function hdrLoaded() {
  params = {
    factor: 0.33,
    evolution: 1.0,
    speed: 0.5,
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 75, 150);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight);
  camera.position.x = -15;
  camera.position.z = 15;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  bounds = new THREE.Vector3(10, 5, 10);
  emitter = new THREE.Vector3(0, 0, 0);
  emitter.x = Math.random() * bounds.x - bounds.x / 2;
  emitter.y = Math.random() * bounds.y - bounds.y / 2;
  emitter.z = Math.random() * bounds.z - bounds.z / 2;
  emitterSpeed = new THREE.Vector3(0.071, 0.078, 0.069);

  const simSize = 64;
  simulation = new Simulation(renderer, simSize, simSize);

  particles = new WrapperInstancedMesh({
    simulation,
    envMap,
  });

  scene.add(particles.mesh);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
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
    new THREE.MeshPhongMaterial({ color: 0x3b475f, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -12;
  floor.receiveShadow = true;
  scene.add(floor);

  // gui
  gui = new GUI();
  gui.add(params, 'factor', 0.1, 3).onChange((value) => {
    simulation.shader.uniforms.factor.value = value;
  });
  gui.add(params, 'evolution', 0, 1).onChange((value) => {
    simulation.shader.uniforms.evolution.value = value;
  });
  gui.add(params, 'speed', 0, 3).onChange((value) => {
    simulation.shader.uniforms.speed.value = value;
  });
  gui.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemiLight intensity');
  gui.add(dirLight, 'intensity', 0, 1, 0.01).name('dirLight intensity');

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
}

function animate() {
  emitter.x += emitterSpeed.x;
  emitter.y += emitterSpeed.y;
  emitter.z += emitterSpeed.z;

  if (emitter.x > bounds.x || emitter.x < -bounds.x) {
    emitterSpeed.x *= - 1;
  }
  if (emitter.y > bounds.y || emitter.y < -bounds.y) {
    emitterSpeed.y *= - 1;
  }
  if (emitter.z > bounds.z || emitter.z < -bounds.z) {
    emitterSpeed.z *= - 1;
  }

  const delta = clock.getDelta() * 10;
  const time = clock.elapsedTime;

  simulation.shader.uniforms.offset.value = emitter;
  simulation.render(time, delta);

  if (particles.material.uniforms) {
    particles.material.uniforms.sim.value = simulation.targets[simulation.targetPos].texture;
    particles.depthMat.uniforms.sim.value = simulation.targets[simulation.targetPos].texture;
  }

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

window.MainInstanced = InstancedMeshMain;
