import * as THREE from 'three';
import { searchData } from '../model/Data';
import { InstancedMeshExtended } from './InstancedMeshExtended';
import { getRandomInt } from '../../tsunami/utils/number';
import { glsl } from '../../tsunami/three/threeUtils';

export default class CategoryMesh {
  constructor(textureSource, textureUVArray) {
    const geometry = new THREE.PlaneBufferGeometry(2, 1);
    this.canvas = document.createElement('canvas');
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    const ctx = this.canvas.getContext('2d');

    this.categoriesTexture = new THREE.Texture(this.canvas);
    const names = [];

    let maxCount = 0;
    const textureUV = [];
    searchData.Categories.forEach((mainCat) => {
      names.push(mainCat.Name);
      const randomIndex = getRandomInt(mainCat.meshIndex.start, mainCat.meshIndex.end);
      textureUV.push(textureUVArray[randomIndex * 2], textureUVArray[randomIndex * 2 + 1]);
      //   mainCat.Categories.forEach((cat) => {
      //     maxCount++;
      //   });
      maxCount++;
    });
    geometry.setAttribute('textureUV', new THREE.InstancedBufferAttribute(new Float32Array(textureUV), 2));

    const namesUV = [];
    for (let y = 0; y < 2048; y++) {
      for (let x = 0; x < 2048; x++) {
        ctx.font = '30px Arial';
        ctx.fillText('Hello World', 10, 50);
        namesUV.push(x / 2048);
        namesUV.push(y / 2048);
        x += 256;
      }
      y += 128;
    }
    geometry.setAttribute('namesUV', new THREE.InstancedBufferAttribute(new Float32Array(namesUV), 2));

    this.material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.material.onBeforeCompile = (shader) => {
      this.material.shader = shader;
      shader.uniforms.textureSource = { value: textureSource };

      const vertex_common = glsl`
        #include <common>
        uniform sampler2D textureSource;

        attribute vec2 textureUV;
        `;

      const begin_vertex = glsl`
        vec4 texturePos = texture2D( textureSource, textureUV );
        vec3 transformed = texturePos.xyz + position;
        `;

      //   const fragment_common = glsl`
      //     uniform vec3 colorRandomMultiplier;
      //     varying vec3 vInstanceColor;
      //     varying vec3 vrandomColor;
      //     varying float vvisibility;
      //     #include <common>
      //     `;

      //   const instance_color = glsl`
      //     if(vvisibility == 0.0) discard;
      //     vec3 col = vrandomColor * colorRandomMultiplier + (vInstanceColor - colorRandomMultiplier);
      //     vec4 diffuseColor = vec4(col, vvisibility);
      //     `;

      shader.vertexShader = shader.vertexShader.replace('#include <common>', vertex_common);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);

      //   shader.fragmentShader = shader.fragmentShader.replace('#include <common>', fragment_common);
      //   shader.fragmentShader = shader.fragmentShader.replace(
      //     'vec4 diffuseColor = vec4( diffuse, opacity );',
      //     instance_color
      //   );
    };
    const mesh = new InstancedMeshExtended(geometry, this.material, maxCount);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.count = maxCount;
    mesh.frustumCulled = false;
    // mesh.customDepthMaterial = this.depthMat;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < maxCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh = mesh;
  }
}
