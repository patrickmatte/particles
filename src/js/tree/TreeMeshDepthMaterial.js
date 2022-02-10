import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';
import noise from '../tsunami/three/shaders/noise.glsl';
import curlNoise from '../tsunami/three/shaders/curlNoise.glsl';

export default class TreeMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(settings) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = glsl`
    #include <common>
    uniform float pointScale;
    uniform vec4 noise0;
    uniform vec4 noise1;

    attribute vec3 treePos;

    ${noise}
    ${curlNoise}

    `;

    const begin_vertex = glsl`
        vec3 transformed = treePos;
        float frequency = noise0.x;
        float amplitude = noise0.y;
        float speed = noise0.z;
        float time = 0.0;
        transformed += snoiseVec3(treePos * frequency + time * speed) * amplitude;

        // frequency = noise1.x;
        // amplitude = noise1.y;
        // speed = noise1.z;
        // transformed += snoiseVec3(treePos * frequency + time * speed) * amplitude;

        transformed += position * pointScale;
    `;

    depthVS = depthVS.replace('#include <common>', vertex_common);
    depthVS = depthVS.replace('#include <begin_vertex>', begin_vertex);

    super({
      vertexShader: depthVS,
      fragmentShader: depthFS,
    });
    this.uniforms.pointScale = settings.pointScale;
    this.uniforms.noise0 = settings.noise0;
    this.uniforms.noise1 = settings.noise1;
  }
}
