import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';

export default class PointsWrapper {
  constructor(options) {
    this.simulation = options.simulation;
    this.pointTexture = options.pointTexture;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        size: { type: 'f', value: 1 },
        ratio: { type: 'f', value: 1 },
        pointTexture: { type: 't', value: this.pointTexture },
        sim: { type: 't', value: this.simulation.rtTexturePos },
      },
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const position = [];
    const instanceColor = [];
    const textureUV = [];
    for (let j = 0; j < this.simulation.height; j++) {
      for (let i = 0; i < this.simulation.width; i++) {
        textureUV.push(i / (this.simulation.width - 1));
        textureUV.push(j / (this.simulation.height - 1));

        instanceColor.push(Math.random() * 0.25 + 0.75);
        instanceColor.push(Math.random() * 0.25 + 0.05);
        instanceColor.push(Math.random() * 0.25 + 0.15);

        position.push(0);
        position.push(0);
        position.push(0);
      }
    }
    var geometry = new THREE.BufferGeometry();

    geometry.setAttribute('textureUV', new THREE.BufferAttribute(new Float32Array(textureUV), 2));
    geometry.setAttribute('instanceColor', new THREE.BufferAttribute(new Float32Array(instanceColor), 3));
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));

    this.mesh = new THREE.Points(geometry, this.material);
  }
}

export const pointsVertex = `
uniform float size;
uniform float ratio;
uniform sampler2D pointTexture;
uniform sampler2D sim;

attribute vec2 textureUV;
attribute vec3 instanceColor;
varying vec3 vInstanceColor;

${parabola}

void main() {
  vInstanceColor = instanceColor;

  vec4 texturePos = texture2D( sim, textureUV );
  float alpha = texturePos.a / 100.;
  float timeScale = parabola( 1.0 - alpha, 1.0 );

	vec4 mvPosition = modelViewMatrix * vec4(texturePos.xyz, 1.);
	gl_PointSize = size * timeScale * ( ratio / length( mvPosition.xyz ) ) * alpha;
	gl_Position = projectionMatrix * mvPosition;
}
`;

export const pointsFragment = `
uniform sampler2D pointTexture;
varying vec3 vInstanceColor;

void main() {
	vec4 color = texture2D( pointTexture, gl_PointCoord );
	gl_FragColor = vec4(color.rgb * vInstanceColor, color.a);
}
`;
