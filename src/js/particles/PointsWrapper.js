import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';
import { glsl } from '../tsunami/three/threeUtils';

export default class PointsWrapper {
  constructor(options) {
    this.simulation = options.simulation;
    this.alphaMap = options.alphaMap;

    this.material = new THREE.PointsMaterial({
      transparent: true,
      size: devicePixelRatio * 0.5,
      sizeAttenuation: true,
      alphaMap: this.alphaMap,
      alphaTest: 0.5,
    });
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.ratio = { value: window.innerHeight };
      shader.uniforms.sim = { value: this.simulation.texturePos.texture };

      const common_vertex = glsl`
      #include <common>
      uniform float ratio;
      uniform sampler2D sim;

      attribute vec2 textureUV;
      attribute vec3 instanceColor;
      varying vec3 vInstanceColor;

      ${parabola}
      `;

      const begin_vertex = glsl`
        vec4 texturePos = texture2D( sim, textureUV );
        vec3 transformed = vec3( texturePos.xyz );
        float alpha = texturePos.a / 100.;
        float timeScale = parabola( 1.0 - alpha, 1.0 );
        vInstanceColor = instanceColor;
      `;

      const size_vertex = glsl`
        gl_PointSize = size;
      `;

      shader.vertexShader = shader.vertexShader.replace('#include <common>', common_vertex);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);
      shader.vertexShader = shader.vertexShader.replace('gl_PointSize = size;', size_vertex);

      const common_fragment = glsl`
      #include <common>
      varying vec3 vInstanceColor;
      `;

      const diffuse_fragment = `
        vec4 diffuseColor = vec4(diffuse * vInstanceColor, opacity);
      `;

      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', common_fragment);
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        diffuse_fragment
      );
    };

    const colorRandomMultiplier = 0.25;
    const colors = [
      new THREE.Color(0xe4e9e3),
      new THREE.Color(0x8a77ab),
      new THREE.Color(0xdc8b37),
      new THREE.Color(0x4d8c76),
      new THREE.Color(0x6f9fc8),
      new THREE.Color(0xd7afa8),
    ];

    const position = [];
    const instanceColor = [];
    const textureUV = [];
    const maxCount = this.simulation.width * this.simulation.height;
    let count = 0;
    for (let j = 0; j < this.simulation.height; j++) {
      for (let i = 0; i < this.simulation.width; i++) {
        const factor = count / (maxCount - 1);
        textureUV.push(i / (this.simulation.width - 1));
        textureUV.push(j / (this.simulation.height - 1));

        const colorIndex = Math.random();
        const color = colors[Math.floor(factor * (colors.length - 1))];

        instanceColor.push(Math.random() * colorRandomMultiplier + (color.r - colorRandomMultiplier));
        instanceColor.push(Math.random() * colorRandomMultiplier + (color.g - colorRandomMultiplier));
        instanceColor.push(Math.random() * colorRandomMultiplier + (color.b - colorRandomMultiplier));

        position.push(i);
        position.push(0);
        position.push(0);

        count += 1;
      }
    }
    var geometry = new THREE.BufferGeometry();

    geometry.setAttribute('textureUV', new THREE.BufferAttribute(new Float32Array(textureUV), 2));
    geometry.setAttribute('instanceColor', new THREE.BufferAttribute(new Float32Array(instanceColor), 3));
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));

    this.mesh = new THREE.Points(geometry, this.material);
  }
}
