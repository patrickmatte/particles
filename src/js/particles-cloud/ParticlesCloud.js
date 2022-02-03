import * as THREE from 'three';
import Simulation from './Simulation';
import { getRect } from '../tsunami/window';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CloudMesh from './CloudMesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import CloudMeshNoiseAnimation from './CloudMeshNoiseAnimation';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from './BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

let renderer,
  composer,
  pmremGenerator,
  envMap,
  scene,
  bokehScene,
  camera,
  controls,
  simulation,
  cloudMeshNoiseAnimation,
  particles,
  gui,
  stats;
const raycaster = new THREE.Raycaster();

const postprocessing = {
  enabled: true,
};
const effectController = {
  focus: 18.0,
  aperture: 50,
  maxblur: 0.008,
  autofocus: false,
};

function matChanger() {
  postprocessing.bokeh.uniforms['focus'].value = effectController.focus;
  postprocessing.bokeh.uniforms['aperture'].value = effectController.aperture * 0.00001;
  postprocessing.bokeh.uniforms['maxblur'].value = effectController.maxblur;
}

export function ParticlesCloud() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  // renderer.outputEncoding = THREE.sRGBEncoding;
  // renderer.gammaFactor = 2.2;
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

  bokehScene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight);
  camera.position.x = 18;
  camera.position.z = 18;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const simSize = 80;
  simulation = new Simulation(renderer, simSize, simSize);
  simulation.addEventListener('change', () => {
    cloudMeshNoiseAnimation.shader.uniforms.textureSource.value = simulation.currentRenderTarget.texture;
  });

  cloudMeshNoiseAnimation = new CloudMeshNoiseAnimation(renderer, simulation.currentRenderTarget.texture);

  particles = new CloudMesh(cloudMeshNoiseAnimation.renderTarget.texture, envMap);
  particles.mesh.raycastOffsetBuffer = new Float32Array(
    cloudMeshNoiseAnimation.renderTarget.width * cloudMeshNoiseAnimation.renderTarget.height * 4
  );

  scene.add(particles.mesh);

  const hemiLight = new THREE.HemisphereLight(0xffffff, bgColor, 0.5);
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
  gui.add(postprocessing, 'enabled').name('Depth of field');

  gui.close();
  const simulationFolder = gui.addFolder('Cloud');
  simulation.GUI(simulationFolder);
  const materialFolder = gui.addFolder('Material');
  particles.GUI(materialFolder);
  const animationFolder = gui.addFolder('Animation');
  cloudMeshNoiseAnimation.GUI(animationFolder);
  const lightsFolder = gui.addFolder('lights');
  lightsFolder.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemi');
  lightsFolder.add(dirLight, 'intensity', 0, 1, 0.01).name('directional');
  lightsFolder.close();

  renderer.domElement.addEventListener('mousemove', clickHandler);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  // effectController.focus = camera.position.distanceTo(controls.target);

  initPostprocessing();

  window.addEventListener('resize', onWindowResize, false);

  onWindowResize();

  animate();
}

function initPostprocessing() {
  const renderPass = new RenderPass(scene, camera);

  const bokehPass = new BokehPass(
    scene,
    camera,
    {
      focus: effectController.focus,
      aperture: effectController.aperture,
      maxblur: effectController.maxblur,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    particles.depthMat
  );

  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

  composer = new EffectComposer(renderer);
  composer.outputEncoding = THREE.sRGBEncoding;

  composer.addPass(renderPass);
  composer.addPass(gammaCorrectionPass);
  composer.addPass(bokehPass);

  postprocessing.composer = composer;
  postprocessing.bokeh = bokehPass;

  const dofFolder = gui.addFolder('DOF');
  dofFolder.add(effectController, 'focus', 0, 100, 1).onChange(matChanger);
  dofFolder.add(effectController, 'aperture', 0, 200, 0.1).onChange(matChanger);
  dofFolder.add(effectController, 'maxblur', 0.0, 0.2, 0.0001).onChange(matChanger);
  dofFolder.add(effectController, 'autofocus', 0.0, 0.1, 0.001).name('Auto-focus');

  matChanger();
}

function onWindowResize() {
  const rect = getRect();

  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();

  renderer.setSize(rect.width, rect.height);

  composer.setSize(rect.width, rect.height);
}

function clickHandler(event) {
  event.preventDefault();

  const mouse = new THREE.Vector2(0, 0);
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  renderer.readRenderTargetPixels(
    cloudMeshNoiseAnimation.renderTarget,
    0,
    0,
    cloudMeshNoiseAnimation.renderTarget.width,
    cloudMeshNoiseAnimation.renderTarget.height,
    particles.mesh.raycastOffsetBuffer
  );
  const intersection = raycaster.intersectObject(particles.mesh);
  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId;
    // console.log('instanceId', instanceId);
  }
}

function animate(time) {
  cloudMeshNoiseAnimation.textureSource.value = simulation.currentRenderTarget.texture;
  cloudMeshNoiseAnimation.render(time / 1000);

  // renderer.setRenderTarget(null);
  // renderer.render(scene, camera);

  if (effectController.autofocus) {
    effectController.focus = camera.position.distanceTo(controls.target);
    postprocessing.bokeh.uniforms['focus'].value = effectController.focus;
  }

  renderer.setRenderTarget(null);
  if (postprocessing.enabled) {
    postprocessing.composer.render(0.1);
  } else {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
  stats.update();
}

window.ParticlesCloud = ParticlesCloud;
