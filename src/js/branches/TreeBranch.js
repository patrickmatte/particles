import * as THREE from 'three';
import Easing from '../tsunami/animation/Easing';
import Tween from '../tsunami/animation/Tween';
import TweenProperty from '../tsunami/animation/TweenProperty';
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from './THREE.MeshLine';
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from '../../../node_modules/three.meshline';
import Vector3D from '../tsunami/geom/Vector3D';
import { lerp } from '../tsunami/utils/number';

const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
  resolution.set(window.innerWidth, window.innerHeight);
});

const sphereGeo = new THREE.IcosahedronBufferGeometry(0.2, 1);

export default class TreeBranch extends THREE.Object3D {
  constructor(pos, direction, length, branchesTotal, parentBranch = null, color) {
    super();

    this.color = color;

    this.material = new MeshLineMaterial({
      useMap: false,
      color,
      opacity: 1,
      resolution,
      sizeAttenuation: true,
      lineWidth: 0.02,
      dashArray: 2,
      dashOffset: -1,
      dashRatio: 0.5,
      transparent: true,
    });

    this.pos = pos;
    this.direction = direction;
    this.branchesTotal = branchesTotal;
    this.length = length;
    this.parentBranch = parentBranch;

    let startPos = pos.clone();
    let endPos;

    this.segments = [];
    const points = [];

    points.push(startPos.clone());

    let previousRadius = 0;

    let distance = 0;

    this.knots = [];

    this.endingMaterial = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < branchesTotal; i++) {
      //   const baseRadius = length / branchesTotal;
      //   const radius = Math.random() * baseRadius * 0.9 + baseRadius * 0.1;
      const branchRadius = Easing.quad.easeOut(i + 1, 0, length, branchesTotal);
      const radius = branchRadius - previousRadius;
      previousRadius = branchRadius;
      endPos = new THREE.Vector3(radius, 0, 0);
      direction = direction.clone();
      direction.x += Math.random() - 0.5;
      direction.y += Math.random() - 0.5;
      endPos = Vector3D.spherePoint(radius, direction.x, direction.y);
      endPos.add(startPos);

      distance += Vector3D.distance(endPos, startPos);

      const segment = new TreeBranchSegment(startPos, endPos, parentBranch, this.endingMaterial, direction, this);
      this.segments.push(segment);
      this.add(segment.endingMesh);

      points.push(endPos.clone());

      let knotBranchesTotal = Math.ceil(Math.random() * 3);
      if (i == 0) {
        knotBranchesTotal = 0;
      }

      for (let j = 0; j < knotBranchesTotal; j++) {
        const branchDirection = direction.clone();
        branchDirection.x += (Math.random() - 0.5) * 2;
        branchDirection.y += (Math.random() - 0.5) * 2;
        const branchLength = branchesTotal - i;
        const branchSegmentsTotal = Math.max(branchesTotal - 1, 0);
        if (branchLength > 1 && branchSegmentsTotal > 0) {
          const subBranchRadius = Math.random() * radius * 0.5 + radius * 0.5;
          const subBranchColor = Math.random() * 255 * 255;
          const subBranch = new TreeBranch(
            startPos,
            branchDirection,
            subBranchRadius,
            Math.ceil(Math.random() * 2),
            segment,
            color
          );
          this.add(subBranch);
          segment.subBranches.push(subBranch);
        }
      }

      parentBranch = segment;
      startPos = endPos;
    }

    this._progress = 1;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new MeshLine();
    line.setGeometry(geometry);

    const mesh = new THREE.Mesh(line, this.material);
    this.add(mesh);
  }

  get progress() {
    return this._progress;
  }

  set progress(value) {
    this._progress = value;
    this.material.uniforms.dashOffset.value = 1 - value - 1;

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const lo = i / (this.segments.length + 1);
      const hi = (i + 1) / (this.segments.length + 1);
      const divider = hi - lo;
      const num = Math.max(value - lo, 0);
      const subProgress = Math.min(num / divider, 1);
      segment.progress = subProgress;
    }
  }

  GUI(gui) {
    gui.add(this, 'progress', 0, 1, 0.01);
  }

  show() {
    const tween = new Tween(
      0,
      3,
      [new TweenProperty(this, 'progress', 0, 1, Easing.linear.ease)],
      null,
      null,
      'test',
      true
    );
    return tween.start();
  }

  getSegments(array) {
    this.segments.forEach((segment) => {
      segment.getSegments(array);
    });
  }

  hide() {}
}

class TreeBranchSegment {
  constructor(start, end, parent, material, direction, parentBranch) {
    this.start = start;
    this.end = end;
    this.subBranches = [];
    this._progress = 0;
    this.parent = parent;
    this.direction = direction;
    this.parentBranch = parentBranch;

    this.endingMesh = new THREE.Mesh(sphereGeo, material);
    this.material = material;
    this.endingMesh.position.copy(this.end);
  }

  get progress() {
    return this._progress;
  }

  set progress(t) {
    this._progress = t;
    this.subBranches.forEach((branch) => {
      branch.progress = t;
    });

    this.endingMesh.position.x = lerp(this.start.x, this.end.x, t);
    this.endingMesh.position.y = lerp(this.start.y, this.end.y, t);
    this.endingMesh.position.z = lerp(this.start.z, this.end.z, t);

    this.endingMesh.scale.x = t;
    this.endingMesh.scale.y = t;
    this.endingMesh.scale.z = t;
  }

  getSegments(array) {
    array.push(this);
    this.subBranches.forEach((branch) => {
      branch.getSegments(array);
    });
  }
}
