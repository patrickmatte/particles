import * as THREE from 'three';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';
import rotationsGLSL from '../tsunami/three/shaders/sphere-point.glsl';
import { glsl } from '../tsunami/three/threeUtils';

export default class RayCastSim extends EventTarget {
  constructor(renderer, width, height) {
    super();
    this.render = this.render.bind(this);

    this.width = width;
    this.height = height;
    this.renderer = renderer;
    this.targetPos = 0;

    const maxCount = this.width * this.height;
    let count = 0;

    const randomRadius = [];
    const randomRotation = [];
    const index = [];
    this.data = new Float32Array(maxCount * 4);
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        const factor = count / (maxCount - 1);

        index.push(factor);

        randomRadius.push(Math.random());
        randomRotation.push(Math.random());

        this.data[count * 4] = count * 2;
        this.data[count * 4 + 1] = 0;
        this.data[count * 4 + 2] = 0;
        this.data[count * 4 + 3] = factor;

        count++;
      }
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
        // timer: { value: 0 },
        // noise0: { value: new THREE.Vector4(0.075, 6.204, 0.0, 1.0) },
        // noise1: { value: new THREE.Vector4(0.14, 1.624, 0.0, 1.0) },
        // noise2: { value: new THREE.Vector4(0.251, 1.231, 0.0, 1.0) },
        // radius: { value: 8 },
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

  render() {
    // this.shader.uniforms.timer.value = time;

    this.shader.uniforms.tPositions.value = this.targets[this.targetPos].texture;
    this.targetPos = 1 - this.targetPos;

    this.renderer.setRenderTarget(this.targets[this.targetPos]);

    this.renderer.render(this.scene, this.camera);
  }

  get currentRenderTarget() {
    return this.targets[this.targetPos];
  }

  GUI(gui) {
    //     gui.add(this.shader.uniforms.radius, 'value', 0, 10, 0.001).name('radius').onChange(this.render);
    //     for (let i = 0; i < 3; i++) {
    //       const noiseFolder = gui.addFolder('noise' + i);
    //       noiseFolder
    //         .add(this.shader.uniforms['noise' + i].value, 'x', 0, 0.5, 0.001)
    //         .name('frequency')
    //         .onChange(this.render);
    //       noiseFolder
    //         .add(this.shader.uniforms['noise' + i].value, 'y', 0, 10, 0.001)
    //         .name('amplitude')
    //         .onChange(this.render);
    //       noiseFolder
    //         .add(this.shader.uniforms['noise' + i].value, 'z', 0, 2, 0.001)
    //         .name('time')
    //         .onChange(this.render);
    //     }
    //     // noiseFolder.add(this.shader.uniforms.noise1.value, 'w', 0, 1, 0.001).name('speed').onChange(this.render);
  }
}

export const vertexShader = glsl`
// attribute float randomRadius;
// attribute float randomRotation;
// attribute float index;

varying vec2 vUv;
// varying float vrandomRadius;
// varying float vrandomRotation;
// varying float vindex;

void main() {
//   vrandomRadius = randomRadius;
//   vrandomRotation = randomRotation;
//   vindex = index;
  vUv = vec2(uv.x, 1.0 - uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const fragmentShader = glsl`

varying vec2 vUv;
// varying float vrandomRadius;
// varying float vrandomRotation;
// varying float vindex;

uniform sampler2D tPositions;
uniform sampler2D oPositions;
// uniform float radius;
// uniform float timer;
// uniform vec4 noise0;
// uniform vec4 noise1;
// uniform vec4 noise2;

void main() {
    vec4 c = texture2D( tPositions, vUv );
	// vec3 pos = c.xyz;
    // float index = c.a;

    // float PI = 3.14159265359;

    // vec3 circlePos = spherePoint(radius, vec2(vrandomRotation * PI - PI /2.0, vindex * PI * 2.0));

    // float frequency = noise0.x;
    // float amplitude = noise0.y;
    // float time = noise0.z;
    // float speed = noise0.w;
    // circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

    // frequency = noise1.x;
    // amplitude = noise1.y;
    // time = noise1.z;
    // speed = noise1.w;
    // circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

    // frequency = noise2.x;
    // amplitude = noise2.y;
    // time = noise2.z;
    // speed = noise2.w;
    // circlePos += curlNoise(circlePos * frequency + time * speed) * amplitude;

	gl_FragColor = c;
}
`;
