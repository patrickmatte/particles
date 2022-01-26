import * as THREE from 'three';
import { glsl } from '../tsunami/three/threeUtils';

export default class BallShadowMaterial extends THREE.ShaderMaterial {
  constructor() {
    let vertexShader = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_vert;
    let fragmentShader = '#define DEPTH_PACKING 3201\n' + THREE.ShaderChunk.depth_frag;
    const shader = {
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    };

    let token, insert;

    token = '#include <common>';
    insert = glsl`
      #include <common>
      varying vec3 vNN;
      varying vec3 vEye;
    `;
    shader.vertexShader = shader.vertexShader.replace(token, insert);
    shader.fragmentShader = shader.fragmentShader.replace(token, insert);

    token = '#include <begin_vertex>';
    insert = glsl`
	    #include <beginnormal_vertex>
      #include <begin_vertex>

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

    token = 'gl_FragColor = packDepthToRGBA( fragCoordZ );';
    insert = glsl`
      float fresnelTerm =  ( -min(dot(vEye, normalize(vNN) ), 0.0) );
      vec4 shad = packDepthToRGBA( fragCoordZ );
      gl_FragColor = shad;
    `;
    shader.fragmentShader = shader.fragmentShader.replace(token, insert);

    super(shader);
  }
}
