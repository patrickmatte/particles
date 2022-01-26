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

    const pos = [];
    for (let i = 0; i < maxCount; i++) {
      pos.push(Math.random() * 2 - 1);
      pos.push(Math.random() * 2 - 1);
      pos.push(Math.random() * 2 - 1);
    }
    geometry.setAttribute('pos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));

    var positionsLength = maxCount * 3;
    var positions = new Float32Array(positionsLength);
    var randomSize = new Float32Array(maxCount);
    var p = 0;
    for (var j = 0; j < positionsLength; j += 3) {
      positions[j] = p;
      positions[j + 1] = p / 5;
      positions[j + 2] = p;
      randomSize[p] = 1;
      p++;
    }

    geometry.setAttribute('simPosition', new THREE.InstancedBufferAttribute(positions, 3));
    geometry.setAttribute('randomSize', new THREE.InstancedBufferAttribute(randomSize, 1));

    const material = new InstancedMeshFresnelMaterial(
      {
        roughness: 0.5,
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
