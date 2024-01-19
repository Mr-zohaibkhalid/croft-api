const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const Category = require("../models/category.model");


const getCategories = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'name',
    sortOrder = 'asc',
    search = '',
  } = req.query;

  const filter = {};

  ['name', 'slug', 'description', 'parentItemClass'].forEach(param => {
    if (req.query[param]) {
      filter[param] = req.query[param];
    }
  });

  if (search) {
    const regexSearch = { $regex: search, $options: 'i' };

    filter.$or = [
      { name: regexSearch },
      { slug: regexSearch },
      { description: regexSearch },
      { parentItemClass: regexSearch },
    ];
  }

  const sort = {};
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  try {
    const totalCount = await Category.countDocuments(filter);
    const category = await Category.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    res.status(httpStatus.OK).send({
      data: category,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error fetching Categories',
      error: error.message,
    });
  }
});


const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const update = req.body;

  try {

    const category = await Category.findByIdAndUpdate(id, update, { new: true }).exec();

    if (!category) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Category not found',
      });
    }

    res.status(httpStatus.CREATED).send({
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error updating Category',
      error: error.message,
    });
  }
});



const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndDelete(id).exec();

    if (!category) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Category not found!',
      });
    }

    res.status(httpStatus.OK).send({
      message: 'Category deleted successfully!',
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error deleting Category',
      error: error.message,
    });
  }
});

const addCategory = catchAsync(async (req, res) => {
  try {
    const update = req.body;

    const newCategory = new Category(update);
    await newCategory.save();

    res.status(httpStatus.CREATED).send({
      message: 'Category added successfully!',
      supplier: newCategory,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error adding Category',
      error: error.message,
    });
  }
});

const bulkDeleteCategories = catchAsync(async (req, res) => {
  const { ids } = req.body;

  try {
    const result = await Category.deleteMany({ _id: { $in: ids } }).exec();

    if (result.deletedCount === 0) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'No categories found to delete!',
      });
    }

    res.status(httpStatus.OK).send({
      message: `${result.deletedCount} categories deleted successfully!`,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error deleting categories',
      error: error.message,
    });
  }
});


module.exports = {
  getCategories,
  updateCategory,
  deleteCategory,
  addCategory,bulkDeleteCategories
};
