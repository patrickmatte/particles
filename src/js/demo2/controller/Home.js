import Branch from '../../tsunami/Branch';
import { view } from '../Demo2';

export default class Home extends Branch {
  constructor() {
    super();
  }

  load() {
    view.stage.camera.position.z = 48;
    view.stage.postprocessing.bokeh.uniforms['focus'].value = 35;
  }

  show() {
    console.log('Home.show');
    view.element.appendChild(view.homeView.element);
  }

  hide() {
    console.log('Home.hide');
    view.element.removeChild(view.homeView.element);
  }
}
