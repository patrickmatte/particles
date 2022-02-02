import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';
import { glsl } from '../tsunami/three/threeUtils';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';

export default class CloudMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(simulation, noiseUniforms) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = glsl`
    #include <common>
    uniform sampler2D sim;
    uniform vec3 noise0;
    uniform vec3 noise1;
    uniform float time;
    attribute vec2 textureUV;

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
    `;

    depthVS = depthVS.replace('#include <common>', vertex_common);
    depthVS = depthVS.replace('#include <begin_vertex>', begin_vertex);

    super({
      vertexShader: depthVS,
      fragmentShader: depthFS,
    });
    this.uniforms.sim = { value: simulation.texturePos.texture };
    for (let i in noiseUniforms) {
      this.uniforms[i] = noiseUniforms[i];
    }
  }
}
