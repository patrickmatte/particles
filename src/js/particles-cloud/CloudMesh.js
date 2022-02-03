import * as THREE from 'three';
import CloudMeshDepthMaterial from './CloudMeshDepthMaterial';
import CloudMeshMaterial from './CloudMeshMaterial';
import { InstancedMeshExtended } from './InstancedMeshExtended';

export default class CloudMesh {
  constructor(textureSource, envMap) {
    this.textureSource = { value: textureSource };

    const geometry = new THREE.IcosahedronBufferGeometry(0.25, 3);

    const colorRandomMultiplier = 0.25;

    const hexColors = [
      0x201923, 0xffffff, 0xfcff5d, 0x7dfc00, 0x0ec434, 0x228c68, 0x8ad8e8, 0x235b54, 0x29bdab, 0x3998f5, 0x37294f,
      0x277da7, 0x3750db, 0xf22020, 0x991919, 0xffcba5, 0xe68f66, 0xc56133, 0x96341c, 0x632819, 0xffc413, 0xf47a22,
      0x2f2aa0, 0xb732cc, 0x772b9d, 0xf07cab, 0xd30b94, 0xedeff3, 0xc3a5b4, 0x946aa2, 0x5d4c86,
    ];

    const colors = [];
    hexColors.forEach((hex) => {
      colors.push(new THREE.Color(hex).offsetHSL(0, -0.33, 0));
    });

    const width = this.textureSource.value.image.width;
    const height = this.textureSource.value.image.height;

    const instanceColor = [];
    const textureUV = [];
    const maxCount = width * height;
    let count = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const factor = count / (maxCount - 1);
        textureUV.push(i / (width - 1));
        textureUV.push(j / (height - 1));

        const colorIndex = Math.random();
        const color = colors[Math.floor(factor * (colors.length - 1))];

        instanceColor.push(Math.random() * colorRandomMultiplier + (color.r - colorRandomMultiplier));
        instanceColor.push(Math.random() * colorRandomMultiplier + (color.g - colorRandomMultiplier));
        instanceColor.push(Math.random() * colorRandomMultiplier + (color.b - colorRandomMultiplier));

        count += 1;
      }
    }
    geometry.setAttribute('textureUV', new THREE.InstancedBufferAttribute(new Float32Array(textureUV), 2));
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColor), 3));

    const material = new CloudMeshMaterial(
      {
        roughness: 0.4,
        metalness: 0,
        color: 0xff0000,
        envMap,
        envMapIntensity: 0.01,
      },
      this.textureSource
    );
    this.material = material;

    this.depthMat = new CloudMeshDepthMaterial(this.textureSource);

    const mesh = new InstancedMeshExtended(geometry, material, maxCount);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = maxCount;
    mesh.frustumCulled = false;
    mesh.customDepthMaterial = this.depthMat;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < maxCount; i++) {
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh = mesh;
  }

  GUI(gui) {
    gui.add(this.material, 'roughness', 0, 1, 0.001);
    gui.add(this.material, 'metalness', 0, 1, 0.001);
    gui.add(this.material, 'envMapIntensity', 0, 1, 0.001);
    gui.add(this.mesh, 'castShadow');
    gui.add(this.mesh, 'receiveShadow');
  }
}
