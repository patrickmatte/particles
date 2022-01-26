import * as THREE from 'three';
import parabola from '../tsunami/three/shaders/parabola.glsl';

export default class InstancedMeshSandardMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters, simulation) {
    super(parameters);

    this.simulation = simulation;
  }

  onBeforeCompile(shader) {
    shader.uniforms.sim = { value: this.simulation.texturePos.texture };

    const vertex_common = `
    #include <common>
    uniform sampler2D sim;
    attribute vec2 textureUV;
    attribute vec3 instanceColor;
    varying vec3 vInstanceColor;

    ${parabola}
    `;

    const begin_vertex = `
    vec4 texturePos = texture2D( sim, textureUV );
    float alpha = texturePos.a / 100.;
    float timeScale = parabola( 1.0 - alpha, 1.0 );
    
    vec3 transformed = position * timeScale + texturePos.xyz;
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
