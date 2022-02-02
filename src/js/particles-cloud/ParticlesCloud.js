import * as THREE from 'three';
import Simulation from './Simulation';
import { getRect } from '../tsunami/window';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CloudMesh from './CloudMesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let renderer,
  pmremGenerator,
  envMap,
  scene,
  camera,
  controls,
  bounds,
  emitter,
  emitterSpeed,
  simulation,
  particles,
  gui,
  stats;
const raycaster = new THREE.Raycaster();

export function ParticlesCloud() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;

  const isAppleDevice = navigator.userAgent.match(/iPhone|iPad|iPod/i);
  const floatType = isAppleDevice ? THREE.HalfFloatType : THREE.FloatType;

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  new RGBELoader().setDataType(floatType).load(`assets/studio_small_03_1k.hdr`, (t) => {
    envMap = pmremGenerator.fromEquirectangular(t).texture;
    hdrLoaded();
  });
}

function hdrLoaded() {
  const bgColor = new THREE.Color(0x847080);

  scene = new THREE.Scene();
  scene.background = bgColor;
  scene.fog = new THREE.Fog(bgColor, 0, 100);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight);
  camera.position.x = -20;
  camera.position.z = 20;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const simSize = 96;
  simulation = new Simulation(renderer, simSize, simSize);
  simulation.addEventListener('change', () => {
    if (particles.material.uniforms) {
      particles.material.uniforms.sim.value = simulation.targets[simulation.targetPos].texture;
      particles.depthMat.uniforms.sim.value = simulation.targets[simulation.targetPos].texture;
    }
  });

  // simulation.targets.forEach((target, i) => {
  //   const plane = new THREE.Mesh(
  //     new THREE.PlaneGeometry(2, 2),
  //     new THREE.MeshBasicMaterial({ map: target.texture, side: THREE.DoubleSide })
  //   );
  //   plane.position.x = i * 6 - 3;
  //   scene.add(plane);
  // });

  particles = new CloudMesh({
    simulation,
    envMap,
  });

  scene.add(particles.mesh);

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
  // scene.add(floor);

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

  // console.log('geometry.attributes.position', particles.mesh.geometry.attributes.position);

  const mouse = new THREE.Vector2(0, 0);
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

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

window.ParticlesCloud = ParticlesCloud;
