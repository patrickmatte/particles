import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';

export default class FresnelMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters) {
    super();
    this.parameters = parameters;

    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.common,
      THREE.UniformsLib.envmap,
      THREE.UniformsLib.aomap,
      THREE.UniformsLib.lightmap,
      THREE.UniformsLib.emissivemap,
      THREE.UniformsLib.bumpmap,
      THREE.UniformsLib.normalmap,
      THREE.UniformsLib.displacementmap,
      THREE.UniformsLib.roughnessmap,
      THREE.UniformsLib.metalnessmap,
      THREE.UniformsLib.fog,
      THREE.UniformsLib.lights,
      {
        emissive: { value: new THREE.Color(0x000000) },
        roughness: { value: 1.0 },
        metalness: { value: 0.0 },
        envMapIntensity: { value: 1 }, // temporary
      },
    ]);

    this.type = 'FresnelMaterial';

    this.vertexShader = THREE.ShaderChunk.meshphysical_vert;
    this.fragmentShader = THREE.ShaderChunk.meshphysical_frag;

    this.init(parameters);
  }

  init(parameters) {
    this.setShaders(parameters);

    this.setValues(parameters);
  }

  get baseUniforms() {
    return glsl`
            uniform float timestamp;
            uniform vec3 offsetPos;
        `;
  }

  setShaders(parameters) {
    this.uniforms.timestamp = { value: 0 };
    this.uniforms.offsetPos = { value: new THREE.Vector3(0, 0, 0) };

    let token, insert;

    token = '#include <common>';
    insert = glsl`
        #include <common>
        ${this.baseUniforms}
    `;
    this.vertexShader = this.vertexShader.replace(token, insert);

    token = '#include <begin_vertex>';
    insert = glsl`
        vec3 transformed = vec3( position + offsetPos );
    `;
    this.vertexShader = this.vertexShader.replace(token, insert);

    token = 'vec4 diffuseColor = vec4( diffuse, opacity );';
    insert = glsl`
        vec4 diffuseColor = vec4( diffuse, opacity );
    `;
    this.fragmentShader = this.fragmentShader.replace(token, insert);
  }
}
