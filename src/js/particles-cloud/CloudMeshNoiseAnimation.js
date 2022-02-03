import * as THREE from 'three';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';
import { glsl } from '../tsunami/three/threeUtils';

export default class CloudMeshNoiseAnimation {
  constructor(renderer, textureSource) {
    this.render = this.render.bind(this);

    this.renderer = renderer;
    this.textureSource = textureSource;
    this.width = textureSource.image.width;
    this.height = textureSource.image.height;

    const maxCount = this.width * this.height;
    let count = 0;
    this.data = new Float32Array(maxCount * 4);

    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width; i++) {
        const factor = count / (maxCount - 1);
        this.data[i * 4] = 0;
        this.data[i * 4 + 1] = 0;
        this.data[i * 4 + 2] = 0;
        this.data[i * 4 + 3] = factor;
        count++;
      }
    }

    var isAppleDevice = navigator.userAgent.match(/iPhone|iPad|iPod/i);
    var floatType = isAppleDevice ? THREE.HalfFloatType : THREE.FloatType;

    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: floatType,
      stencilBuffer: false,
      depthBuffer: false,
    });

    this.shader = new THREE.ShaderMaterial({
      uniforms: {
        textureSource: { value: textureSource },
        noise0: { value: new THREE.Vector3(0.042, 1.712, 0.031) },
        noise1: { value: new THREE.Vector3(0.5, 0.089, 0.071) },
        time: { value: 0 },
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
    this.quad = new THREE.Mesh(geometry, this.shader);
    this.scene.add(this.quad);

    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
  }

  render(time) {
    this.shader.uniforms.time.value = time;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
  }

  GUI(gui) {
    for (let i = 0; i < 2; i++) {
      const noiseFolder = gui.addFolder('noise' + i);
      noiseFolder.add(this.shader.uniforms['noise' + i].value, 'x', 0, 0.5, 0.001).name('frequency');
      noiseFolder.add(this.shader.uniforms['noise' + i].value, 'y', 0, 2, 0.001).name('amplitude');
      noiseFolder.add(this.shader.uniforms['noise' + i].value, 'z', 0, 1, 0.001).name('speed');
    }
  }
}

export const vertexShader = glsl`

varying vec2 vUv;

void main() {
  vUv = vec2(uv.x, 1.0 - uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const fragmentShader = glsl`
${noise}
${curlNoise}


uniform sampler2D textureSource;
uniform float time;
uniform vec4 noise0;
uniform vec4 noise1;

varying vec2 vUv;

void main() {
  vec4 texturePos = texture2D( textureSource, vUv );
  vec3 transformed = texturePos.xyz;

  float frequency = noise0.x;
  float amplitude = noise0.y;
  float speed = noise0.z;
  transformed += snoiseVec3(transformed * frequency + time * speed) * amplitude;

  frequency = noise1.x;
  amplitude = noise1.y;
  speed = noise1.z;
  transformed += snoiseVec3(transformed * frequency + time * speed) * amplitude;

	gl_FragColor = vec4(transformed , texturePos.a );
}
`;
