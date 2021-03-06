import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import BallMaterial from './BallMaterial';
import BallShadowMaterial from './BallShadowMaterial';

let camera, scene, renderer, stats, pmremGenerator, envMap, gui, mixer;
const clock = new THREE.Clock();

export default function Cloud() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  gui = new GUI();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(-100, 100, 300);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 200, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.update();

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  gui.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemiLight intensity');

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  gui.add(dirLight, 'intensity', 0, 1, 0.01).name('dirLight intensity');

  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x3b475f, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  const sphereGeo = new THREE.SphereBufferGeometry(25);

  const sphereMaterial = new BallMaterial({
    color: 0x0000ff,
    transparent: true,
    metalness: 0,
    roughness: 1,
  });

  // const sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
  // sphere.castShadow = true;
  // sphere.receiveShadow = true;
  // sphere.position.y = 50;
  // scene.add(sphere);

  const maxCount = 2;

  const mesh = new THREE.InstancedMesh(sphereGeo, sphereMaterial, maxCount);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.count = maxCount;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.customDepthMaterial = this.depthMat;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < maxCount; i++) {
    dummy.position.set(0, 50 * (i + 1), 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  scene.add(mesh);

  window.addEventListener('resize', onWindowResize);

  stats = new Stats();
  container.appendChild(stats.dom);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  renderer.render(scene, camera);

  stats.update();
}

window.Cloud = Cloud;
