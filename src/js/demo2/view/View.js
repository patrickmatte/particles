import Stage from './Stage';
import { getRect } from '../../tsunami/window';
import HomeView from './HomeView';

export default class View {
  constructor() {
    this.element = document.body;

    this.stage = new Stage();
    this.element.appendChild(this.stage.element);

    this.homeView = new HomeView();

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
