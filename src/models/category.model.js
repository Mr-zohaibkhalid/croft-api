const mongoose = require('mongoose');
const {toJSON, paginate} = require("./plugins");

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  parentItemClass: String,
},
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', CategorySchema);

CategorySchema.plugin(toJSON);
CategorySchema.plugin(paginate);

module.exports = Category;
