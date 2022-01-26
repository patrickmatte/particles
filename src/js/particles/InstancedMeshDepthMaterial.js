import * as THREE from 'three';

export default class InstancedMeshDepthMaterial extends THREE.ShaderMaterial {
  constructor(parameters) {
    let depthVS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let depthFS = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;

    const vertex_common = `
    #include <common>
    attribute vec3 instanceColor;
    attribute vec3 pos;

    uniform float size;

    uniform float ratio;
    uniform sampler2D pointTexture;
    uniform sampler2D sim;
    attribute vec3 simPosition;
    uniform float width;
    uniform float height;
    attribute float randomSize;

    float parabola( float x, float k ) {
        return pow( 4.0 * x * ( 1.0 - x ), k );
    }
    `;

    const begin_vertex = `
    vec2 dimensions = vec2( width, height );
	float px = simPosition.y;
	float vi = simPosition.z;
	float x = mod( px, dimensions.x );
	float y = mod( floor( px / dimensions.x ), dimensions.y );
	vec2 uv = vec2( x, y ) / dimensions;

	vec4 cubePosition = texture2D( sim, uv );
	float alpha = cubePosition.a / 100.;
	float timeScale = parabola( 1.0 - alpha, 1.0 );

	vec3 modPos = cubePosition.xyz * 1.0;
    
    vec3 transformed = position * timeScale + modPos;
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
