import { importTemplate } from '../../tsunami/tsunami';
import { controller } from '../Demo2';

export default class HomeView {
  constructor() {
    const template = `
        <div class="home">
            <div class='title'>What the world is learning</div>
            <div class='subtitle'>Explore a 24-hour snapshot of the world’s collective learning.</div>
            <div class='button'><button>Dive In</button></div>
        </div>
    `;
    this.element = importTemplate(template);
    const button = this.element.querySelector('.button button');
    button.addEventListener('click', (event) => {
      controller.router.location = 'explore-categories';
    });
  }
}
