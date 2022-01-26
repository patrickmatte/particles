import * as THREE from 'three';
import InstancedMeshDepthMaterial from './InstancedMeshDepthMaterial';
import InstancedMeshFresnelMaterial from './InstancedMeshFresnelMaterial';
import InstancedMeshSandardMaterial from './InstancedMeshSandardMaterial';

export default class InstancedMeshWrapper {
  constructor(options) {
    this.simulation = options.simulation;

    const maxCount = this.simulation.width * this.simulation.height;

    const geometry = new THREE.IcosahedronBufferGeometry(0.5, 3);

    const instanceColors = [];
    for (let i = 0; i < maxCount; i++) {
      instanceColors.push(Math.random() * 0.5 + 0.5);
      instanceColors.push(Math.random() * 0.5 + 0.5);
      instanceColors.push(Math.random() * 0.5 + 0.5);
    }
    geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColors), 3));

    const textureUV = [];
    for (let j = 0; j < this.simulation.height; j++) {
      for (let i = 0; i < this.simulation.width; i++) {
        textureUV.push(i / (this.simulation.width - 1));
        textureUV.push(j / (this.simulation.height - 1));
      }
    }
    geometry.setAttribute('textureUV', new THREE.InstancedBufferAttribute(new Float32Array(textureUV), 2));

    const material = new InstancedMeshSandardMaterial(
      {
        roughness: 1,
        metalness: 0,
        color: 0xff0000,
        transparent: true,
      },
      this.simulation
    );
    this.material = material;

    this.depthMat = new InstancedMeshDepthMaterial({
      simulation: this.simulation,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    mesh.castShadow = mesh.receiveShadow = true;
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
}
