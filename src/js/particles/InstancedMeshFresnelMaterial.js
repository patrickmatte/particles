import * as THREE from 'three';
import InstancedMeshSandardMaterial from './InstancedMeshSandardMaterial';
import { glsl } from '../tsunami/three/threeUtils';
import easeSineIn from '../../../node_modules/three-bas/src/glsl/ease_sine_in.glsl';
import easeCircIn from '../../../node_modules/three-bas/src/glsl/ease_circ_in.glsl';

export default class InstancedMeshFresnelMaterial extends InstancedMeshSandardMaterial {
  constructor(parameters, simulation) {
    super(parameters, simulation);
    console.log(easeSineIn);
  }

  onBeforeCompile(shader) {
    super.onBeforeCompile(shader);

    let token, insert;

    token = '#include <common>';
    insert = glsl`
      #include <common>
      varying vec3 vNN;
      varying vec3 vEye;

      ${easeSineIn}
      ${easeCircIn}
    `;
    shader.vertexShader = shader.vertexShader.replace(token, insert);
    shader.fragmentShader = shader.fragmentShader.replace(token, insert);

    token = '#include <fog_vertex>';
    insert = glsl`
      #include <fog_vertex>

      mat4 LM = modelMatrix;
      LM[2][3] = 0.0;
      LM[3][0] = 0.0;
      LM[3][1] = 0.0;
      LM[3][2] = 0.0;

      vec4 GN = LM * vec4(objectNormal.xyz, 1.0);
      vNN = normalize(GN.xyz);
      vEye = normalize(GN.xyz-cameraPosition);
    `;
    shader.vertexShader = shader.vertexShader.replace(token, insert);

    token = '#include <dithering_fragment>';
    insert = glsl`
    #include <dithering_fragment>
    float fresnelTerm =  ( -min(dot(vEye, normalize(vNN) ), 0.0) );
    gl_FragColor.a = easeCircIn(fresnelTerm);
    `;
    shader.fragmentShader = shader.fragmentShader.replace(token, insert);
  }
}
