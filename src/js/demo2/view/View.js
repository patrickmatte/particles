import Stage from './Stage';
import { getRect } from '../../tsunami/window';

export default class View {
  constructor() {
    this.stage = new Stage();

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize, false);
    this.onWindowResize();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  onWindowResize() {
    const rect = getRect();
    this.stage.onWindowResize(rect);
  }

  animate(time) {
    this.stage.animate(time);
    window.requestAnimationFrame(this.animate);
  }
}
