import * as THREE from 'three';

export const geometry = new THREE.IcosahedronBufferGeometry(0.25, 1);
export const material = new THREE.MeshBasicMaterial();

export default class TreeKnot extends THREE.Object3D {
  constructor(pos, direction, strength) {
    super();

    this.pos = pos;
    this.direction = direction;
    this.strength = strength;

    this.mesh = new THREE.Mesh(geometry, material);
    this.add(this.mesh);

    // this.branches = [];
    // for (let i = 0; i < 5; i++) {
    //   const branch = new TreeBranch(pos, direction, strength);
    //   this.branches.push(branch);
    //   this.add(branch);
    // }
  }

  createBranches() {}

  show() {
    this.branches.show();
  }

  hide() {
    this.branches.hide();
  }
}
