import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';

export default class CloudMeshMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters, textureSource) {
    super(parameters);

    this.textureSource = textureSource;
  }

  onBeforeCompile(shader) {
    this.shader = shader;
    shader.uniforms.textureSource = this.textureSource;

    const vertex_common = glsl`
    #include <common>
    uniform sampler2D textureSource;

    attribute vec2 textureUV;
    attribute vec3 instanceColor;
    varying vec3 vInstanceColor;
    `;

    const begin_vertex = glsl`
    vec4 texturePos = texture2D( textureSource, textureUV );
    vec3 transformed = texturePos.xyz + position;
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
