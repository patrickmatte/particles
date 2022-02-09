import Branch from '../../tsunami/Branch';
import Router from '../../tsunami/Router';
import { view } from '../Demo2';
import ExploreCategories from './ExploreCategories';
import Home from './Home';

export default class Controller extends Branch {
  constructor() {
    super();
    this.router = new Router(this);

    this.branches['home'] = new Home();
    this.branches['explore-categories'] = new ExploreCategories();
    this.defaultChild = 'home';

    this.router.start();
  }

  load() {
    return view.stage.load();
  }

  show() {}
}
