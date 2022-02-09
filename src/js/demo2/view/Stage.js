import * as THREE from 'three';
import Simulation from '../../demo2/view/Simulation';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CloudMesh from '../../demo2/view/CloudMesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import CloudMeshNoiseAnimation from '../../demo2/view/CloudMeshNoiseAnimation';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from '../../demo2/view/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { searchData } from '../../demo2/model/Data';

export default class Stage {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.postprocessing = {};

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.element = this.renderer.domElement;
    this.renderer.shadowMap.enabled = true;

    this.composer = new EffectComposer(this.renderer);
    this.composer.outputEncoding = THREE.sRGBEncoding;

    const bgColor = new THREE.Color(0x847080);

    this.scene = new THREE.Scene();
    this.scene.background = bgColor;
    this.scene.fog = new THREE.Fog(bgColor, 0, 125);

    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight);
    // this.camera.position.x = 30;
    this.camera.position.z = 48;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    const hemiLight = new THREE.HemisphereLight(0xffffff, bgColor, 0.5);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;

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
    this.dirLight = dirLight;
    this.scene.add(dirLight);

    this.effectController = {
      focus: 35,
      aperture: 0.001,
      maxblur: 0.02,
      autofocus: false,
      dof: true,
    };
    // this.effectController.focus = this.camera.position.distanceTo(this.controls.target);

    const simSize = Math.ceil(Math.sqrt(searchData.allEntries.length));
    // console.log(simSize);
    this.simulation = new Simulation(this.renderer, simSize, simSize);
    this.simulation.addEventListener('change', () => {
      this.cloudMeshNoiseAnimation.shader.uniforms.textureSource.value = this.simulation.currentRenderTarget.texture;
    });

    this.cloudMeshNoiseAnimation = new CloudMeshNoiseAnimation(
      this.renderer,
      this.simulation.currentRenderTarget.texture
    );

    this.particles = new CloudMesh(this.cloudMeshNoiseAnimation.renderTarget.texture);
    this.particles.mesh.raycastOffsetBuffer = new Float32Array(
      this.cloudMeshNoiseAnimation.renderTarget.width * this.cloudMeshNoiseAnimation.renderTarget.height * 4
    );
    this.scene.add(this.particles.mesh);

    // this.selectedCategory = new SelectedCategory(this.cloudMeshNoiseAnimation.renderTarget.texture);
    // this.selectedCategory.mesh.raycastOffsetBuffer = new Float32Array(
    //   this.cloudMeshNoiseAnimation.renderTarget.width * this.cloudMeshNoiseAnimation.renderTarget.height * 4
    // );
    // this.scene.add(this.selectedCategory.mesh);

    // floor
    // const floor = new THREE.Mesh(
    //   new THREE.PlaneGeometry(500, 500),
    //   new THREE.MeshStandardMaterial({ color: bgColor, depthWrite: false })
    // );
    // floor.rotation.x = -Math.PI / 2;
    // floor.position.y = -20;
    // floor.receiveShadow = true;
    // this.scene.add(floor);

    this.initPostprocessing();

    this.setGUI();

    this.clickHandler = this.clickHandler.bind(this);
    this.renderer.domElement.addEventListener('mousemove', this.clickHandler);

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.animate = this.animate.bind(this);

    this.animate();

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }

  load() {
    const isAppleDevice = navigator.userAgent.match(/iPhone|iPad|iPod/i);
    const floatType = isAppleDevice ? THREE.HalfFloatType : THREE.FloatType;

    return new Promise((success, reject) => {
      new RGBELoader().setDataType(floatType).load(`assets/studio_small_03_1k.hdr`, (t) => {
        this.envMap = this.pmremGenerator.fromEquirectangular(t).texture;
        success();
      });
    });
  }

  setGUI() {
    this.gui;
    this.gui = new GUI();
    this.gui.close();

    this.gui.add(this.camera.position, 'z', 0, 100, 1);

    const materialFolder = this.gui.addFolder('Material');
    this.particles.GUI(materialFolder);

    const dofFolder = this.gui.addFolder('Depth of field');
    dofFolder.add(this.effectController, 'dof').name('enabled');
    dofFolder.add(this.effectController, 'focus', 0, 100, 1).onChange(() => {
      this.postprocessing.bokeh.uniforms['focus'].value = this.effectController.focus;
    });
    dofFolder.add(this.effectController, 'aperture', 0, 0.002, 0.001).onChange(() => {
      this.postprocessing.bokeh.uniforms['aperture'].value = this.effectController.aperture;
    });
    dofFolder.add(this.effectController, 'maxblur', 0.0, 0.2, 0.0001).onChange(() => {
      this.postprocessing.bokeh.uniforms['maxblur'].value = this.effectController.maxblur;
    });
    dofFolder.add(this.effectController, 'autofocus', 0.0, 0.1, 0.001).name('Auto-focus');

    const simulationFolder = this.gui.addFolder('Cloud');
    simulationFolder.close();
    this.simulation.GUI(simulationFolder);

    const animationFolder = this.gui.addFolder('Animation');
    animationFolder.close();
    this.cloudMeshNoiseAnimation.GUI(animationFolder);

    const fogFolder = this.gui.addFolder('Fog');
    fogFolder.add(this.scene.fog, 'near', 0, 500, 0.01);
    fogFolder.add(this.scene.fog, 'far', 0, 500, 0.01);

    const lightsFolder = this.gui.addFolder('lights');
    lightsFolder.add(this.hemiLight, 'intensity', 0, 1, 0.01).name('hemi');
    lightsFolder.add(this.dirLight, 'intensity', 0, 1, 0.01).name('directional');
    lightsFolder.close();
  }

  initPostprocessing() {
    const renderPass = new RenderPass(this.scene, this.camera);

    const bokehPass = new BokehPass(
      this.scene,
      this.camera,
      {
        focus: this.effectController.focus,
        aperture: this.effectController.aperture,
        maxblur: this.effectController.maxblur,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      this.particles.depthMat
    );

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    this.composer.addPass(renderPass);
    this.composer.addPass(gammaCorrectionPass);
    this.composer.addPass(bokehPass);

    this.postprocessing.composer = this.composer;
    this.postprocessing.bokeh = bokehPass;
  }

  onWindowResize(rect) {
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(rect.width, rect.height);

    this.composer.setSize(rect.width, rect.height);
  }

  clickHandler(event) {
    event.preventDefault();

    const mouse = new THREE.Vector2(0, 0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.camera);

    const intersection = this.raycaster.intersectObject(this.particles.mesh);
    if (intersection.length > 0) {
      const instanceId = intersection[0].instanceId;
      const selecteEntry = searchData.allEntries[instanceId];
      // const diff = intersection[0].point.subVectors(camera.position, intersection[0].point);
      // postprocessing.bokeh.uniforms['focus'].value = diff.z;
      // target.position.copy(intersection[0].point);
      // selectedCategoryId = instanceId;
    }
  }

  animate(time) {
    this.cloudMeshNoiseAnimation.textureSource.value = this.simulation.currentRenderTarget.texture;
    this.cloudMeshNoiseAnimation.render(time / 1000);

    // renderer.setRenderTarget(null);
    // renderer.render(scene, camera);

    if (this.effectController.autofocus) {
      this.effectController.focus = this.camera.position.distanceTo(this.controls.target);
      this.postprocessing.bokeh.uniforms['focus'].value = this.effectController.focus;
    }

    this.renderer.setRenderTarget(null);
    if (this.effectController.dof) {
      this.postprocessing.composer.render(0.1);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.renderer.readRenderTargetPixels(
      this.cloudMeshNoiseAnimation.renderTarget,
      0,
      0,
      this.cloudMeshNoiseAnimation.renderTarget.width,
      this.cloudMeshNoiseAnimation.renderTarget.height,
      this.particles.mesh.raycastOffsetBuffer
    );

    this.stats.update();
  }
}
