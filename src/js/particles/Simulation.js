import * as THREE from 'three';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';

export default class Simulation {
  constructor(renderer, offset, width, height) {
    this.width = width;
    this.height = height;
    this.renderer = renderer;
    this.targetPos = 0;

    const maxCount = this.width * this.height;

    this.data = new Float32Array(maxCount * 4);

    for (var i = 0; i < maxCount; i++) {
      var phi = Math.random() * 2 * Math.PI;
      var costheta = Math.random() * 2 - 1;
      var theta = Math.acos(costheta);
      const r = 0.75 + 0.75 * Math.random();

      this.data[i * 4] = r * Math.sin(theta) * Math.cos(phi);
      this.data[i * 4 + 1] = r * Math.sin(theta) * Math.sin(phi);
      this.data[i * 4 + 2] = r * Math.cos(theta);
      this.data[i * 4 + 3] = (i / (maxCount - 1)) * 100; // frames life
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
        oPositions: { type: 't', value: this.texture },
        tPositions: { type: 't', value: this.texture },
        timer: { type: 'f', value: 0 },
        delta: { type: 'f', value: 0 },
        offset: { type: 'v3', value: offset },
        factor: { type: 'f', value: 0.2 },
        frequency: { type: 'f', value: 0.185 },
        amplitude: { type: 'f', value: 0.01 },
        speed: { type: 'f', value: 0.1 },
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

    const geometry = new THREE.PlaneBufferGeometry(this.width, this.height);
    this.quad = new THREE.Mesh(geometry, this.shader);
    this.scene.add(this.quad);

    this.renderer.setRenderTarget(this.texturePos);

    this.renderer.render(this.scene, this.camera);
  }

  render(time, delta) {
    this.shader.uniforms.timer.value = time;
    this.shader.uniforms.delta.value = delta;

    this.shader.uniforms.tPositions.value = this.targets[this.targetPos].texture;
    this.targetPos = 1 - this.targetPos;

    this.renderer.setRenderTarget(this.targets[this.targetPos]);

    this.renderer.render(this.scene, this.camera);
  }
}

export const vertexShader = `
	varying vec2 vUv;

	void main() {
		vUv = vec2(uv.x, 1.0 - uv.y);
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

export const fragmentShader = `
${noise}
${curlNoise}

varying vec2 vUv;

uniform sampler2D tPositions;
uniform sampler2D oPositions;
uniform vec3 offset;

uniform float timer;
uniform float delta;
uniform float speed;
uniform float factor;
uniform float amplitude;
uniform float frequency;

void main() {
	vec4 c = texture2D( tPositions, vUv );
	vec3 pos = c.xyz;
	float life = c.a;

	float s = vUv.x * life / 100.0;

  vec3 v = curlNoise(pos * frequency + timer * speed) * amplitude;
	// vec3 v = factor * delta * speed * ( curlNoise( 0.2 * pos + factor * frequency * 0.1 * timer ) );
	pos += v;
	life -= factor;

	bool isDead = (life <= 0.0);

	if ( isDead ) {
		pos = ( texture2D( oPositions, vUv ) ).xyz + offset;
		life = 100.0;
	}

	gl_FragColor = vec4( pos, life );
}
`;
