import * as THREE from 'three';
import noise from '../../tsunami/three/shaders/noise.glsl';
import curlNoise from '../../tsunami/three/shaders/curlNoise.glsl';
import rotationsGLSL from '../../tsunami/three/shaders/sphere-point.glsl';
import { glsl } from '../../tsunami/three/threeUtils';
// import { searchData } from './Data';

export default class Simulation extends EventTarget {
  constructor(renderer, width, height) {
    super();
    this.render = this.render.bind(this);

    this.width = width;
    this.height = height;
    this.renderer = renderer;
    this.targetPos = 0;

    const maxCount = this.width * this.height;
    let count = 0;

    // const icosahedronFaces = [
    //   { faces: 20 },
    //   { faces: 80 },
    //   { faces: 180 },
    //   { faces: 320 },
    //   { faces: 500 },
    //   { faces: 720 },
    //   { faces: 980 },
    //   { faces: 1280 },
    // ];
    // let faces = 0;
    // let loop = 0;
    // let detailIndex;
    // console.log('searchData.meaningFullCategories.length', searchData.meaningFullCategories.length);
    // while (searchData.meaningFullCategories.length > faces) {
    //   detailIndex = icosahedronFaces[loop];
    //   detailIndex.detail = loop;
    //   faces = detailIndex.faces;
    //   loop++;
    // }
    // console.log('detailIndex', detailIndex);

    // const guideGeometry = new THREE.IcosahedronBufferGeometry(5, detailIndex.detail);
    // const vertices = [];
    // for (let i = 0; i < guideGeometry.attributes.position.array.length; i += 3) {
    //   const x = guideGeometry.attributes.position.array[i];
    //   const y = guideGeometry.attributes.position.array[i + 1];
    //   const z = guideGeometry.attributes.position.array[i + 2];
    //   vertices.push(new THREE.Vector3(x, y, z));
    // }
    // const triangles = [];
    // for (let i = 0; i < vertices.length; i += 3) {
    //   const a = vertices[i];
    //   const b = vertices[i + 1];
    //   const c = vertices[i + 2];
    //   triangles.push(new THREE.Triangle(a, b, c));
    // }
    // console.log(triangles[0]);

    // console.log('geometry', geometry);
    // const faces = geometry.getIndex();
    // console.log('faces', faces);
    // console.log('vertices', geometry.attributes.position.array.length / 3);
    // console.log('faces??', geometry.attributes.position.array.length / 3 / 3);
    // const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ wireframe: false }));
    // scene.add(mesh);

    const randomRadius = [];
    const randomRotation = [];
    const index = [];
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        const factor = count / (maxCount - 1);
        index.push(factor);
        randomRadius.push(Math.random());
        randomRotation.push(Math.random());
        count++;
      }
    }

    this.data = new Float32Array(maxCount * 4);
    for (var i = 0; i < maxCount; i++) {
      this.data[i * 4] = 0;
      this.data[i * 4 + 1] = 0;
      this.data[i * 4 + 2] = 0;
      this.data[i * 4 + 3] = i / (maxCount - 1);
    }

    var isAppleDevice = navigator.userAgent.match(/iPhone|iPad|iPod/i);
    var floatType = isAppleDevice ? THREE.HalfFloatType : THREE.FloatType;

    this.texture = new THREE.DataTexture(
      this.data,
      this.width,
      this.height,
      THREE.RGBAFormat,
      floatType,
      THREE.Texture.DEFAULT_MAPPING,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter,
      1,
      THREE.LinearEncoding
    );
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.needsUpdate = true;

    this.texturePos = new THREE.WebGLRenderTarget(this.width, this.height, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: floatType,
      stencilBuffer: false,
      depthBuffer: false,
    });

    this.targets = [this.texturePos, this.texturePos.clone()];

    this.shader = new THREE.ShaderMaterial({
      uniforms: {
        oPositions: { value: this.texture },
        tPositions: { value: this.texture },
        timer: { value: 0 },
        noise0: { value: new THREE.Vector4(0.075, 6.75, 1.738, 1.0) },
        noise1: { value: new THREE.Vector4(0.14, 1.362, 0.0, 1.0) },
        noise2: { value: new THREE.Vector4(0.251, 0.708, 0.0, 1.0) },
        // noise0: { value: new THREE.Vector4(0.075, 0, 1.738, 1.0) },
        // noise1: { value: new THREE.Vector4(0.14, 0, 0.0, 1.0) },
        // noise2: { value: new THREE.Vector4(0.251, 0, 0.0, 1.0) },
        radius: { value: 8 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      -this.height / 2,
      this.height / 2,
      -500,
      1000
    );

    const geometry = new THREE.PlaneBufferGeometry(this.width, this.height, this.width - 1, this.height - 1);
    geometry.setAttribute('randomRadius', new THREE.BufferAttribute(new Float32Array(randomRadius), 1));
    geometry.setAttribute('randomRotation', new THREE.BufferAttribute(new Float32Array(randomRotation), 1));
    geometry.setAttribute('index', new THREE.BufferAttribute(new Float32Array(index), 1));
    this.quad = new THREE.Mesh(geometry, this.shader);
    this.scene.add(this.quad);

    this.renderer.setRenderTarget(this.texturePos);

    this.renderer.render(this.scene, this.camera);
  }

  get currentRenderTarget() {
    return this.targets[this.targetPos];
  }

  render() {
    // this.shader.uniforms.timer.value = time;

    this.shader.uniforms.tPositions.value = this.targets[this.targetPos].texture;
    this.targetPos = 1 - this.targetPos;

    this.renderer.setRenderTarget(this.targets[this.targetPos]);

    this.renderer.render(this.scene, this.camera);
  }

  GUI(gui) {
    gui.add(this.shader.uniforms.radius, 'value', 0, 20, 0.001).name('radius').onChange(this.render);
    for (let i = 0; i < 3; i++) {
      const noiseFolder = gui.addFolder('noise' + i);
      noiseFolder
        .add(this.shader.uniforms['noise' + i].value, 'x', 0, 0.5, 0.001)
        .name('frequency')
        .onChange(this.render);
      noiseFolder
        .add(this.shader.uniforms['noise' + i].value, 'y', 0, 10, 0.001)
        .name('amplitude')
        .onChange(this.render);
      noiseFolder
        .add(this.shader.uniforms['noise' + i].value, 'z', 0, 2, 0.001)
        .name('time')
        .onChange(this.render);
    }
  }

  addDebugPlanes(scene) {
    this.targets.forEach((target, i) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: target.texture, side: THREE.DoubleSide })
      );
      plane.position.x = i * 6 - 3;
      scene.add(plane);
    });
  }
}

export const vertexShader = glsl`
attribute float randomRadius;
attribute float randomRotation;
attribute float index;

varying vec2 vUv;
// varying float vrandomRadius;
varying float vrandomRotation;
varying float vindex;

void main() {
  // vrandomRadius = randomRadius;
  vrandomRotation = randomRotation;
  vindex = index;
  vUv = vec2(uv.x, 1.0 - uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const fragmentShader = glsl`
${noise}
${curlNoise}
${rotationsGLSL}

varying vec2 vUv;
// varying float vrandomRadius;
varying float vrandomRotation;
varying float vindex;

uniform sampler2D tPositions;
uniform sampler2D oPositions;
uniform float radius;
uniform float timer;
uniform vec4 noise0;
uniform vec4 noise1;
uniform vec4 noise2;

void main() {
	vec4 c = texture2D( tPositions, vUv );
	vec3 pos = c.xyz;
  float index = c.a;

  float PI = 3.14159265359;

  float radiusGap = 0.9;
  vec3 circlePos = spherePoint( radius , vec2(vrandomRotation * PI - PI * 0.5, vindex * PI * 2.0));

  float frequency = noise0.x;
  float amplitude = noise0.y;
  float time = noise0.z;
  float speed = noise0.w;
  circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

   frequency = noise1.x;
   amplitude = noise1.y;
   time = noise1.z;
   speed = noise1.w;
  circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

   frequency = noise2.x;
   amplitude = noise2.y;
   time = noise2.z;
   speed = noise2.w;
  circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

	gl_FragColor = vec4(circlePos , c.a );
}
`;
