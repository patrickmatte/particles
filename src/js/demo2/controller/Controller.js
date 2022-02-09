import Branch from '../../tsunami/Branch';
import Router from '../../tsunami/Router';
import Home from './Home';

export default class Controller extends Branch {
  constructor() {
    super();
    this.router = new Router(this);

    this.branches.home = new Home();
    this.defaultChild = 'home';

    this.router.start();
  }

  load() {}

  show() {}
}
