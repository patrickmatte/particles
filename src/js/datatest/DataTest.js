import csv from '../../../build/assets/dataset.csv';

export function DataTest() {
  const meaningFullCategories = [];
  const data = { Categories: [] };
  const allCategories = [];
  const allEntries = [];

  csv.forEach((entry) => {
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
    allEntries.push(entry);
    if (meaningFullCategories.indexOf(parent) == -1) meaningFullCategories.push(parent);
  });
  console.log('Total entries: ', allEntries.length);
  console.log('Total top categories: ', data.Categories.length);
  console.log('Total categories: ', allCategories.length);
  console.log('Total categories that have entries: ', meaningFullCategories.length);
  console.log(data.Categories);
}

window.DataTest = DataTest;
