import * as THREE from 'three';

export default class InstancedMeshSandardMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters, simulation) {
    super(parameters);

    this.simulation = simulation;
  }

  onBeforeCompile(shader) {
    console.log('InstancedMeshSandardMaterial.onBeforeCompile');

    shader.uniforms.sim = { value: this.simulation.texturePos.texture };
    shader.uniforms.width = { value: this.simulation.width };
    shader.uniforms.height = { value: this.simulation.height };

    const vertex_common = `
    #include <common>
    attribute vec3 instanceColor;
    attribute vec3 pos;
    varying vec3 vInstanceColor;
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

    vec4 pos = texture2D( sim, uv );
    float alpha = pos.a / 100.;
    float timeScale = parabola( 1.0 - alpha, 1.0 );

    vec3 modPos = pos.xyz * 1.0;
    
    vec3 transformed = position * timeScale + modPos;
    vInstanceColor = instanceColor;
    `;

    const fragment_common = `
    varying vec3 vInstanceColor;
    #include <common>
    `;

    const instance_color = `
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
