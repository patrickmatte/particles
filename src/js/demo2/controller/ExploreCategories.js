import Branch from '../../tsunami/Branch';
import Tween from '../../tsunami/animation/Tween';
import TweenProperty from '../../tsunami/animation/TweenProperty';
import Easing from '../../tsunami/animation/Easing';
import { view } from '../Demo2';

export default class ExploreCategories extends Branch {
  constructor() {
    super();
  }

  load() {}

  show() {
    const tween = new Tween(0, 3, [
      new TweenProperty(view.stage.camera.position, 'z', view.stage.camera.position.z, 31, Easing.cubic.easeInOut),
      new TweenProperty(
        view.stage.postprocessing.bokeh.uniforms['focus'],
        'value',
        view.stage.postprocessing.bokeh.uniforms['focus'].value,
        18,
        Easing.cubic.easeInOut
      ),
    ]);
    return tween.start();
  }

  hide() {
    console.log('ExploreCategories.hide');
  }
}
