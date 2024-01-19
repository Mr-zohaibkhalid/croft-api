const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require("../utils/ApiError");
const {Product, Supplier} = require("../models");
const readXlsxFile = require("read-excel-file/node");
const csv = require("csvtojson");


const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No file uploaded');
  }
  const { file } = req;

  let suppliers = [];
  let importedSuppliers = [];

  if (file.originalname.endsWith('.xlsx')) {
    suppliers = await readXlsxFile(`./uploads/${file.filename}`);
  } else if (file.originalname.endsWith('.csv')) {
    suppliers = await csv().fromFile(`./uploads/${file.filename}`);
  } else {
    throw new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file format');
  }
  suppliers.shift();

  try {
    for (const row of suppliers) {
      const supplierData = {
        status: row[0],
        supplierName:  row[1],
        email: row[2],
        companyName: row[3],
        contactNumber: row[4],
        productName: row[5],
        minQuantity: row[6],
        productPrice: row[7],
        productWeight: row[8],

      };

      // const existingProduct = await Supplier.findOne({ alternateID: productData.alternateID });

      // if (existingProduct) {
      //   duplicateAlternateIDs.push(productData.alternateID);
      //   failedProducts.push(productData);
      // } else {
        const supplier = new Supplier(supplierData);
        await supplier.save();
      importedSuppliers.push(supplier)
      }
    // }

    console.log("importedSuppliers",importedSuppliers)


      res.status(httpStatus.CREATED).send({
        message: 'All products imported successfully',
        importedSuppliers: importedSuppliers,
      });
  } catch (error) {
    console.log("errorerrorerror",error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error importing products',
      error: error.message,

    });
  }
});


const getSuppliers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'supplierName',
    sortOrder = 'asc',
    search = '',
  } = req.query;

  const filter = {};

  ['supplierName', 'email', 'companyName', 'contactNumber', 'productName', 'minQuantity', 'productPrice', 'productWeight', 'status'].forEach(param => {
    if (req.query[param]) {
      filter[param] = req.query[param];
    }
  });

  if (search) {
    const regexSearch = { $regex: search, $options: 'i' };
    const numberSearch = isNaN(search) ? null : Number(search);

    filter.$or = [
      { supplierName: regexSearch },
      { email: regexSearch },
      { companyName: regexSearch },
      { productName: regexSearch },
      { KUI: regexSearch },
      { status: regexSearch }
    ];

    if (numberSearch !== null) {
      filter.$or.push({ contactNumber: numberSearch });
      filter.$or.push({ minQuantity: numberSearch });
      filter.$or.push({ productPrice: numberSearch });
      filter.$or.push({ productWeight: numberSearch });
    }
  }

  const sort = {};
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  try {
    const totalCount = await Supplier.countDocuments(filter);
    const products = await Supplier.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    res.status(httpStatus.OK).send({
      data: products,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error fetching products',
      error: error.message,
    });
  }
});


const updateSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const numberFields = ['contactNumber', 'minQuantity', 'productWeight', 'productPrice'];

  try {
    numberFields.forEach((field) => {
      if (field in update && update[field] && !isNaN(Number(update[field]))) {
        update[field] = Number(update[field]);
      }
    });

    if (update.KUI) {
      const existingSupplier = await Supplier.findOne({ KUI: update.KUI }).exec();
      if (existingSupplier && existingSupplier._id.toString() !== id) {
        return res.status(httpStatus.CONFLICT).send({
          message: 'Supplier with this inventory stock code already exists',
        });
      }
    }

    const product = await Supplier.findByIdAndUpdate(id, update, { new: true }).exec();

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Supplier not found',
      });
    }

    res.status(httpStatus.CREATED).send({
      message: 'Supplier updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error updating supplier',
      error: error.message,
    });
  }
});



const deleteSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Supplier.findByIdAndDelete(id).exec();

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Supplier not found!',
      });
    }

    res.status(httpStatus.OK).send({
      message: 'Supplier deleted successfully!',
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error deleting supplier',
      error: error.message,
    });
  }
});

const addSupplier = catchAsync(async (req, res) => {
  try {
    const update = req.body;
    const numberFields = ['contactNumber', 'minQuantity', 'productWeight', 'productPrice'];

    numberFields.forEach((field) => {
      if (field in update && update[field] && !isNaN(Number(update[field]))) {
        update[field] = Number(update[field]);
      }
    });

    if (update.KUI) {
      const existingSupplier = await Supplier.findOne({ KUI: update.KUI }).exec();
      if (existingSupplier) {
        return res.status(httpStatus.CONFLICT).send({
          message: 'Supplier with this inventory stock code already exists',
        });
      }
    }

    const newSupplier = new Supplier(update);
    await newSupplier.save();

    res.status(httpStatus.CREATED).send({
      message: 'Supplier added successfully!',
      supplier: newSupplier,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error adding supplier',
      error: error.message,
    });
  }
});

const bulkDeleteSupplier = catchAsync(async (req, res) => {
  const { ids } = req.body;

  try {
    const result = await Supplier.deleteMany({ _id: { $in: ids } }).exec();

    if (result.deletedCount === 0) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'No suppliers found to delete!',
      });
    }

    res.status(httpStatus.OK).send({
      message: `${result.deletedCount} suppliers deleted successfully!`,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error deleting suppliers',
      error: error.message,
    });
  }
});


module.exports = {
  upload,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  addSupplier,bulkDeleteSupplier
};
