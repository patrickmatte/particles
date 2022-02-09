import Branch from '../../tsunami/Branch';

export default class Home extends Branch {
  constructor() {
    super();
  }

  load() {}

  show() {
    console.log('Home.show');
  }

  hide() {
    console.log('Home.hide');
  }
}
