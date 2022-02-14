import * as THREE from 'three';
import { getRect } from '../tsunami/window';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from './BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import TreeBranch from './TreeBranch';

let renderer,
  composer,
  pmremGenerator,
  envMap,
  scene,
  camera,
  controls,
  particles,
  gui,
  stats,
  hemiLight,
  dirLight,
  branches;

const raycaster = new THREE.Raycaster();

const postprocessing = {
  enabled: false,
};
const effectController = {
  focus: 30.0,
  aperture: 100,
  maxblur: 0.02,
  autofocus: false,
  animationProgress: 0,
};

function matChanger() {
  postprocessing.bokeh.uniforms['focus'].value = effectController.focus;
  postprocessing.bokeh.uniforms['aperture'].value = effectController.aperture * 0.00001;
  postprocessing.bokeh.uniforms['maxblur'].value = effectController.maxblur;
}

export function Branches() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(window.devicePixelRatio);
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
  });

  const bgColor = new THREE.Color(0x847080);

  scene = new THREE.Scene();
  scene.background = bgColor;
  // scene.fog = new THREE.Fog(bgColor, 0, 125);

  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight);
  // camera.position.x = 30;
  camera.position.z = 40;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  hemiLight = new THREE.HemisphereLight(0xffffff, bgColor, 0.5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1);
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

  // // floor
  // const floor = new THREE.Mesh(
  //   new THREE.PlaneGeometry(500, 500),
  //   new THREE.MeshStandardMaterial({ color: bgColor, depthWrite: false })
  // );
  // floor.rotation.x = -Math.PI / 2;
  // floor.position.y = -20;
  // floor.receiveShadow = true;
  // scene.add(floor);

  renderer.domElement.addEventListener('click', clickHandler);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  // effectController.focus = camera.position.distanceTo(controls.target);

  branches = [];

  const hexColors = [
    0xfcff5d, 0x7dfc00, 0x0ec434, 0x228c68, 0x8ad8e8, 0x235b54, 0x29bdab, 0x3998f5, 0x37294f, 0x277da7, 0x3750db,
    0xf22020, 0x991919, 0xffcba5, 0xe68f66, 0xc56133, 0x96341c, 0x632819, 0xffc413, 0xf47a22, 0x2f2aa0, 0xb732cc,
    0x772b9d, 0xf07cab, 0xd30b94, 0xedeff3, 0xc3a5b4, 0x946aa2, 0x5d4c86,
  ];

  const maxBranches = 20;
  for (let i = 0; i < maxBranches; i++) {
    const color = new THREE.Color(hexColors[i]).offsetHSL(0, -0.33, 0);
    const rotationFactor = i / maxBranches;
    const direction = new THREE.Vector2((rotationFactor * Math.PI) / 2 - Math.PI / 4, Math.PI * 2 * rotationFactor);
    const branch = new TreeBranch(new THREE.Vector3(0, 0, 0), direction, Math.random() * 15 + 5, 5, null, color);
    branch.progress = 0;
    branches.push(branch);
    scene.add(branch);
    branch.show();
  }

  initPostprocessing();

  window.addEventListener('resize', onWindowResize, false);

  onWindowResize();

  animate();

  createGUI();
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
    }
    // particles.depthMat
  );

  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

  composer = new EffectComposer(renderer);
  composer.outputEncoding = THREE.sRGBEncoding;

  composer.addPass(renderPass);
  composer.addPass(gammaCorrectionPass);
  composer.addPass(bokehPass);

  postprocessing.composer = composer;
  postprocessing.bokeh = bokehPass;

  matChanger();
}

function createGUI() {
  gui = new GUI();
  // gui.close();

  // const materialFolder = gui.addFolder('Material');
  // particles.GUI(materialFolder);

  gui.add(effectController, 'animationProgress', 0, 1).onChange((value) => {
    branches.forEach((branch, i) => {
      branch.progress = value;
    });
  });
  // branches.forEach((branch, i) => {
  //   branch.GUI(gui.addFolder('branch' + i));
  // });

  const dofFolder = gui.addFolder('Depth of field');
  dofFolder.close();
  dofFolder.add(postprocessing, 'enabled').name('enabled');
  dofFolder.add(effectController, 'focus', 0, 100, 1).onChange(matChanger);
  dofFolder.add(effectController, 'aperture', 0, 200, 0.1).onChange(matChanger);
  dofFolder.add(effectController, 'maxblur', 0.0, 0.2, 0.0001).onChange(matChanger);
  dofFolder.add(effectController, 'autofocus', 0.0, 0.1, 0.001).name('Auto-focus');

  // const fogFolder = gui.addFolder('Fog');
  // fogFolder.close();
  // fogFolder.add(scene.fog, 'near', 0, 500, 0.01);
  // fogFolder.add(scene.fog, 'far', 0, 500, 0.01);

  const lightsFolder = gui.addFolder('lights');
  lightsFolder.close();
  lightsFolder.add(hemiLight, 'intensity', 0, 1, 0.01).name('hemi');
  lightsFolder.add(dirLight, 'intensity', 0, 1, 0.01).name('directional');
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

  const segments = [];
  branches.forEach((branch) => {
    branch.getSegments(segments);
  });
  const objects = [];
  segments.forEach((segment) => {
    if (segment.endingMesh) objects.push(segment.endingMesh);
  });

  const intersection = raycaster.intersectObjects(objects);
  if (intersection.length > 0) {
    console.log(intersection[0]);
    const selectedSegment = segments.find((segment) => {
      return segment.endingMesh == intersection[0].object;
    });
    console.log(selectedSegment);
    const newBranch = new TreeBranch(
      selectedSegment.start,
      selectedSegment.direction,
      10,
      5,
      selectedSegment,
      selectedSegment.parentBranch.color
    );
    selectedSegment.subBranches.push(newBranch);
    selectedSegment.parentBranch.add(newBranch);
    newBranch.show();

    // const instanceId = intersection[0].instanceId;
    // const selecteEntry = searchData.allEntries[instanceId];
    // const diff = intersection[0].point.subVectors(camera.position, intersection[0].point);
    // postprocessing.bokeh.uniforms['focus'].value = diff.z;
    // target.position.copy(intersection[0].point);
    // selectedCategoryId = instanceId;
  }
}

function animate(time) {
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

window.Branches = Branches;
