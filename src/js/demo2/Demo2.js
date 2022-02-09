import Controller from './controller/Controller';
import Model from './model/Model';
import View from './view/View';

export let model, view, controller;

export function Demo2() {
  model = new Model();
  view = new View();
  controller = new Controller();
}

window.Demo2 = Demo2;
