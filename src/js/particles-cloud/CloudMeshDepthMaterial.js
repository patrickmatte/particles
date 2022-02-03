import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';

export default class CloudMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(textureSource) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = glsl`
    #include <common>
    uniform sampler2D textureSource;
    attribute vec2 textureUV;
    `;

    const begin_vertex = glsl`
    vec4 texturePos = texture2D( textureSource, textureUV );
    vec3 transformed = texturePos.xyz + position;
    `;

    depthVS = depthVS.replace('#include <common>', vertex_common);
    depthVS = depthVS.replace('#include <begin_vertex>', begin_vertex);

    super({
      vertexShader: depthVS,
      fragmentShader: depthFS,
    });
    this.uniforms.textureSource = textureSource;
  }
}
