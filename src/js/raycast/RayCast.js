import * as THREE from 'three';
import RayCastMesh from './RayCastMesh';
import RayCastSim from './RayCastSim';
import { getRect } from '../tsunami/window';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let renderer, scene, camera, controls, simulation, particles, gui, stats;
const raycaster = new THREE.Raycaster();

export function RayCast() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;

  const bgColor = new THREE.Color(0x847080);

  scene = new THREE.Scene();
  scene.background = bgColor;
  scene.fog = new THREE.Fog(bgColor, 0, 100);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight);
  camera.position.x = -20;
  camera.position.z = 20;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  simulation = new RayCastSim(renderer, 2, 2);
  simulation.addEventListener('change', () => {
    if (particles.material.uniforms) {
      particles.material.uniforms.sim.value = simulation.currentRenderTarget.texture;
      particles.depthMat.uniforms.sim.value = simulation.currentRenderTarget.texture;
    }
  });

  particles = new RayCastMesh(simulation);
  scene.add(particles.mesh);
  particles.mesh.raycastOffsetBuffer = new Float32Array(
    simulation.currentRenderTarget.width * simulation.currentRenderTarget.height * 4
  );

  const hemiLight = new THREE.HemisphereLight(0xffffff, bgColor, 0.33);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  // light.shadow.camera.far = 20;

  scene.add(dirLight);

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: bgColor, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -20;
  floor.receiveShadow = true;
  scene.add(floor);

  // gui
  gui = new GUI();
  const simulationFolder = gui.addFolder('Cloud');
  simulation.GUI(simulationFolder);
  const animationFolder = gui.addFolder('Animation');
  particles.GUI(animationFolder);
  const lightsFolder = gui.addFolder('lights');
  lightsFolder.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemi');
  lightsFolder.add(dirLight, 'intensity', 0, 1, 0.01).name('directional');

  window.addEventListener('resize', onWindowResize, false);

  onWindowResize();

  renderer.domElement.addEventListener('click', clickHandler);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  animate();
}

function onWindowResize() {
  const rect = getRect();

  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();

  renderer.setSize(rect.width, rect.height);
}

function clickHandler(event) {
  event.preventDefault();

  const mouse = new THREE.Vector2(0, 0);
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  renderer.readRenderTargetPixels(
    simulation.currentRenderTarget,
    0,
    0,
    simulation.currentRenderTarget.width,
    simulation.currentRenderTarget.height,
    particles.mesh.raycastOffsetBuffer
  );
  const intersection = raycaster.intersectObject(particles.mesh);
  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId;
    console.log('instanceId', instanceId);
  }
}

function animate(time) {
  particles.noiseUniforms.time.value = time / 1000;

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
  stats.update();
}

window.RayCast = RayCast;
