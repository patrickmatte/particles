import * as THREE from 'three';

const _instanceLocalMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _instanceWorldMatrix = /*@__PURE__*/ new THREE.Matrix4();

const _instanceIntersects = [];

const raycastPos = new THREE.Vector3();

const _mesh = /*@__PURE__*/ new THREE.Mesh();

export class InstancedMeshExtended extends THREE.InstancedMesh {
  raycast(raycaster, intersects) {
    const matrixWorld = this.matrixWorld;
    const raycastTimes = this.count;

    _mesh.geometry = this.geometry;
    _mesh.material = this.material;

    if (_mesh.material === undefined) return;

    for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {
      // calculate the world matrix for each instance

      this.getMatrixAt(instanceId, _instanceLocalMatrix);

      _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);

      // Add the raycastOffsetBuffer position
      if (this.raycastOffsetBuffer) {
        raycastPos.setFromMatrixPosition(_instanceWorldMatrix);
        raycastPos.x += this.raycastOffsetBuffer[instanceId * 4];
        raycastPos.y += this.raycastOffsetBuffer[instanceId * 4 + 1];
        raycastPos.z += this.raycastOffsetBuffer[instanceId * 4 + 2];
        _instanceWorldMatrix.setPosition(raycastPos);
        raycastPos.setFromMatrixPosition(_instanceWorldMatrix);
      }

      // the mesh represents this single instance

      _mesh.matrixWorld = _instanceWorldMatrix;

      _mesh.raycast(raycaster, _instanceIntersects);

      // process the result of raycast

      for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
        const intersect = _instanceIntersects[i];
        intersect.instanceId = instanceId;
        intersect.object = this;
        intersects.push(intersect);
      }

      _instanceIntersects.length = 0;
    }
  }
}
