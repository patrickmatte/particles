import * as THREE from 'three';
import { InstancedMeshExtended } from './InstancedMeshExtended';
import RayCastMeshDepthMaterial from './RayCastMeshDepthMaterial';
import RayCastMeshMaterial from './RayCastMeshMaterial';

export default class RayCastMesh {
  constructor(simulation) {
    this.simulation = simulation;

    this.noiseUniforms = {
      noise0: { value: new THREE.Vector3(0.025, 0.8, 0.025) },
      noise1: { value: new THREE.Vector3(0.3, 0.5, 0.025) },
      time: { value: 0 },
    };

    const geometry = new THREE.IcosahedronBufferGeometry(0.25, 3);

    const colorRandomMultiplier = 0.25;
    const colors = [
      new THREE.Color(0xe4e9e3),
      new THREE.Color(0x8a77ab),
      new THREE.Color(0xdc8b37),
      new THREE.Color(0x4d8c76),
      new THREE.Color(0x6f9fc8),
      new THREE.Color(0xd7afa8),
    ];

    const instanceColor = [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1];
    const textureUV = [];
    const maxCount = this.simulation.width * this.simulation.height;
    let count = 0;
    for (let j = 0; j < this.simulation.height; j++) {
      for (let i = 0; i < this.simulation.width; i++) {
        const factor = count / (maxCount - 1);
        textureUV.push(i / (this.simulation.width - 1));
        textureUV.push(j / (this.simulation.height - 1));

        const colorIndex = Math.random();
        const color = colors[Math.floor(factor * (colors.length - 1))];

        // instanceColor.push(Math.random() * colorRandomMultiplier + (color.r - colorRandomMultiplier));
        // instanceColor.push(Math.random() * colorRandomMultiplier + (color.g - colorRandomMultiplier));
        // instanceColor.push(Math.random() * colorRandomMultiplier + (color.b - colorRandomMultiplier));

        count += 1;
      }
    }
    geometry.setAttribute('textureUV', new THREE.InstancedBufferAttribute(new Float32Array(textureUV), 2));
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColor), 3));

    const material = new RayCastMeshMaterial(
      {
        roughness: 0,
        metalness: 0,
        color: 0xff0000,
        transparent: true,
      },
      this.simulation,
      this.noiseUniforms
    );
    this.material = material;

    this.depthMat = new RayCastMeshDepthMaterial(this.simulation, this.noiseUniforms);

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
    // for (let i = 0; i < 2; i++) {
    //   const noiseFolder = gui.addFolder('noise' + i);
    //   noiseFolder
    //     .add(this.noiseUniforms['noise' + i].value, 'x', 0, 0.5, 0.001)
    //     .name('frequency')
    //     .onChange(this.render);
    //   noiseFolder
    //     .add(this.noiseUniforms['noise' + i].value, 'y', 0, 2, 0.001)
    //     .name('amplitude')
    //     .onChange(this.render);
    //   noiseFolder
    //     .add(this.noiseUniforms['noise' + i].value, 'z', 0, 1, 0.001)
    //     .name('speed')
    //     .onChange(this.render);
    // }
  }
}
