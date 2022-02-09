export default class SelectedCategory {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;

    this.texture = new THREE.Texture(this.canvas);

    this.material = new THREE.MeshBasicMaterial({ transparent: true, map: this.texture });

    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  }
}
