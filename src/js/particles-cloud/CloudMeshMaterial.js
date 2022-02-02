import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';
import { glsl } from '../tsunami/three/threeUtils';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';

export default class CloudMeshMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters, simulation, noiseUniforms) {
    super(parameters);

    this.simulation = simulation;
    this.noiseUniforms = noiseUniforms;
  }

  onBeforeCompile(shader) {
    this.shader = shader;
    shader.uniforms.sim = { value: this.simulation.texturePos.texture };
    for (let i in this.noiseUniforms) {
      shader.uniforms[i] = this.noiseUniforms[i];
    }

    const vertex_common = glsl`
    #include <common>
    uniform sampler2D sim;
    uniform vec3 noise0;
    uniform vec3 noise1;
    uniform float time;

    attribute vec2 textureUV;
    attribute vec3 instanceColor;
    varying vec3 vInstanceColor;

    ${parabola}
    ${noise}
    ${curlNoise}
    `;

    const begin_vertex = glsl`
    vec4 texturePos = texture2D( sim, textureUV );
    vec3 transformed = texturePos.xyz;

    float frequency = noise0.x;
    float amplitude = noise0.y;
    float speed = noise0.z;
    transformed += snoiseVec3(transformed * frequency + time * speed) * amplitude;

    frequency = noise1.x;
    amplitude = noise1.y;
    speed = noise1.z;
    transformed += snoiseVec3(transformed * frequency + time * speed) * amplitude;

    transformed += position;

    vInstanceColor = instanceColor;
    `;

    const fragment_common = glsl`
    varying vec3 vInstanceColor;
    #include <common>
    `;

    const instance_color = glsl`
    vec4 diffuseColor = vec4(vInstanceColor, 1.0);
    `;

    shader.vertexShader = shader.vertexShader.replace('#include <common>', vertex_common);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);

    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', fragment_common);
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      instance_color
    );
  }
}
