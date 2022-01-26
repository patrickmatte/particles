import * as THREE from 'three';

export default class InstancedMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = `
    #include <common>
    attribute vec3 instanceColor;
    attribute vec2 textureUV;
    uniform float ratio;
    uniform sampler2D pointTexture;
    uniform sampler2D sim;

    float parabola( float x, float k ) {
        return pow( 4.0 * x * ( 1.0 - x ), k );
    }
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
    this.uniforms.width = { value: parameters.simulation.width };
    this.uniforms.height = { value: parameters.simulation.height };
  }
}
