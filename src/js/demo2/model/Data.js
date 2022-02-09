import csv from '../../../build/assets/dataset.csv';
import { shuffleArray } from '../../tsunami/utils/array';

const meaningFullCategories = [];
const data = { Categories: [] };
const allCategories = [];
const allEntries = [];

shuffleArray(csv);
// console.log(csv);
// const csvReduced = csv.slice(0, 890);
const csvReduced = csv;

csvReduced.forEach((entry) => {
  const pathSplit = entry.Category.split('/');
  const pathArray = [];
  pathSplit.forEach((slug) => {
    if (slug) pathArray.push(slug);
  });
  let parent = data;
  pathArray.forEach((slug) => {
    let categ = parent.Categories.find((cat) => {
      return cat.Name == slug;
    });
    if (!categ) {
      categ = { Name: slug, Categories: [], Parent: parent };
      parent.Categories.push(categ);
      allCategories.push(categ);
    }
    parent = categ;
  });
  if (!parent.Entries) parent.Entries = [];
  parent.Entries.push(entry);
  entry.CategoryRef = parent;
  if (meaningFullCategories.indexOf(parent) == -1) meaningFullCategories.push(parent);
});

let total = 0;
data.Categories.forEach((mainCat) => {
  mainCat.AllEntries = [];

  const recurseCat = (cat, array) => {
    if (cat.Entries) {
      cat.Entries.forEach((entry) => {
        array.push(entry);
        allEntries.push(entry);
      });
    }
    cat.Categories.forEach((childCat) => {
      recurseCat(childCat, array);
    });
  };

  recurseCat(mainCat, mainCat.AllEntries);
  total += mainCat.AllEntries.length;
});

// console.log('Total entries: ', allEntries.length);
// console.log('Total top categories: ', data.Categories.length);
// console.log('Total categories: ', allCategories.length);
// console.log('Total categories that have entries: ', meaningFullCategories.length);
// console.log(data.Categories);

export const searchData = { Categories: data.Categories, allCategories, allEntries, meaningFullCategories };
