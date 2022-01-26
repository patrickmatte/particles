import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';

export default class InstancedMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = `
    #include <common>
    uniform sampler2D sim;
    attribute vec2 textureUV;

    ${parabola}
    `;

    const begin_vertex = `
    vec4 texturePos = texture2D( sim, textureUV );
    float alpha = texturePos.a / 100.;
    float timeScale = parabola( 1.0 - alpha, 1.0 );
    
    vec3 transformed = position * timeScale + texturePos.xyz;
    `;

    depthVS = depthVS.replace('#include <common>', vertex_common);
    depthVS = depthVS.replace('#include <begin_vertex>', begin_vertex);

    super({
      vertexShader: depthVS,
      fragmentShader: depthFS,
    });
    this.uniforms.sim = { value: parameters.simulation.texturePos.texture };
  }
}
