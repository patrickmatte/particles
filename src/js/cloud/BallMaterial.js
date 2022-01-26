import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';

export default class BallMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters) {
    super(parameters);
    this.onBeforeCompile = (shader) => {
      let token, insert;

      token = '#include <common>';
      insert = glsl`
      #include <common>
      varying vec3 vNN;
      varying vec3 vEye;
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

      const begin_vertex = `
      vec3 transformed = position + vec3(-10.0, 50.0, 0.0);
      `;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);

      token = '#include <dithering_fragment>';
      insert = glsl`
        #include <dithering_fragment>
        float fresnelTerm =  ( -min(dot(vEye, normalize(vNN) ), 0.0) );
        gl_FragColor.a = fresnelTerm;
      `;
      shader.fragmentShader = shader.fragmentShader.replace(token, insert);
    };
  }
}
