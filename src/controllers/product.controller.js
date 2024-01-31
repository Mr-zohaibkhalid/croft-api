const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require("../utils/ApiError");
const {Product, Supplier} = require("../models");
const readXlsxFile = require("read-excel-file/node");
const csv = require("csvtojson");
const Category = require("../models/category.model");


const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No file uploaded');
  }
  const { file } = req;

  let products = [];
  const duplicateAlternateIDs = [];
  const importedProducts = [];
  const failedProducts = [];

  console.log("file",file)

  if (file.originalname.endsWith('.xlsx')) {
    products = await readXlsxFile(`./uploads/${file.filename}`);
  } else if (file.originalname.endsWith('.csv')) {
    products = await csv().fromFile(`./uploads/${file.filename}`);
  } else {
    throw new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file format');
  }

  products.shift();
  try {
    for (const row of products) {
      const productData = {
        preferredSupplier: row[0],
        itemStatus: row[1],
        inventoryID: row[2],
        alternateID: row[3],
        itemClass: row[4],
        description: row[5],
        masterCTNQty: row[6],
        masterBarcode: row[7],
        masterUOMLength: row[8],
        masterUOMHeight: row[9],
        masterUOMWidth: row[10],
        masterVolumeCubicM: row[11],
        masterWeightKG: row[12],
        baseQTY: row[13],
        baseUOMBarcode: row[14],
        baseUOMLength: row[15],
        baseUOMHeight: row[16],
        baseUOMWidth: row[17],
        baseVolumeCubicM: row[18],
        baseWeightKG: row[19],
        baseUnit: row[20],
        salesUnit: row[21],
        purchaseUnit: row[22],
        lastCost: row[23],
        defaultPrice: row[24],
        lotSize: row[25],
        serialClass: row[26],
        priceClass: row[27],
        taxCategory: row[28],
        brand: row[29],
        substitute: row[30],
        crossSell: row[31],
        upSell: row[32],
        movementClass: row[33],
        reorderPoint: row[34],
        maximumSOH: row[35],
        cost: row[36],
        basePrice: row[37],
        priceLevel1: row[38],
        priceLevel2: row[39],
        priceLevel3: row[40],
        priceLevel4: row[41],
        priceLevel5: row[42],
        priceLevel6: row[43],
      };

      const existingProduct = await Product.findOne({ alternateID: productData.alternateID });

      if (existingProduct) {
        duplicateAlternateIDs.push(productData.alternateID);
        failedProducts.push(productData);
      } else {
        const product = new Product(productData);
        await product.save();
        importedProducts.push(product);
      }
    }

    if (duplicateAlternateIDs.length > 0) {
      res.status(httpStatus.CONFLICT).send({
        message: 'Some products could not be imported due to duplicate alternate IDs',
        importedProducts: importedProducts,
        duplicateAlternateIDs: duplicateAlternateIDs,
        failedProducts: failedProducts
      });
    } else {
      res.status(httpStatus.CREATED).send({
        message: 'All products imported successfully',
        importedProducts: importedProducts,
      });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error importing products',
      error: error.message,
      importedProducts: importedProducts,
      failedProducts: failedProducts
    });
  }
});

const addProduct = catchAsync(async (req, res) => {
  try {
    const update = req.body;

    const numberFields = [
      'masterCTNQty', 'masterUOMLength', 'masterUOMHeight', 'masterUOMWidth',
      'masterVolumeCubicM', 'masterWeightKG', 'baseQTY', 'baseUOMLength',
      'baseUOMHeight', 'baseUOMWidth', 'baseVolumeCubicM', 'baseWeightKG',
      'lastCost', 'defaultPrice', 'lotSize', 'reorderPoint', 'maximumSOH', 'cost',
      'basePrice', 'priceLevel1', 'priceLevel2', 'priceLevel3',
      'priceLevel4', 'priceLevel5', 'priceLevel6'
    ];

    numberFields.forEach(field => {
      if (field in update) {
        const value = parseFloat(update[field]);
        if (!isNaN(value)) {
          update[field] = value;
        }
      }
    });

    const existingProduct = await Product.findOne({ alternateID: update.alternateID });
    if (existingProduct) {
      return res.status(httpStatus.CONFLICT).send({
        message: 'Product with the same alternate ID already exists',
      });
    }

    const addedProduct = new Product(update);
    await addedProduct.save();

    res.status(httpStatus.CREATED).send({
      message: 'Product added successfully!',
      product: addedProduct,
    });
  } catch (error) {
    console.log("error",error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error adding product',
      error: error.message,
    });
  }
});



const getProducts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'inventoryID',
    sortOrder = 'asc',
    search = '',
    noLimit= false,
  } = req.query;

  const filter = {};

  ['itemStatus', 'itemClass', 'brand', 'taxCategory'].forEach(param => {
    if (req.query[param]) {
      filter[param] = req.query[param];
    }
  });

  if (search) {
    filter.$or = [
      { preferredSupplier: { $regex: search, $options: 'i' } },
      { itemStatus: { $regex: search, $options: 'i' } },
      { inventoryID: { $regex: search, $options: 'i' } },
      { alternateID: { $regex: search, $options: 'i' } },
      { itemClass: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { masterBarcode: { $regex: search, $options: 'i' } },
      { baseUOMBarcode: { $regex: search, $options: 'i' } },
      { baseUnit: { $regex: search, $options: 'i' } },
      { salesUnit: { $regex: search, $options: 'i' } },
      { purchaseUnit: { $regex: search, $options: 'i' } },
      { serialClass: { $regex: search, $options: 'i' } },
      { priceClass: { $regex: search, $options: 'i' } },
      { taxCategory: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { substitute: { $regex: search, $options: 'i' } },
      { crossSell: { $regex: search, $options: 'i' } },
      { upSell: { $regex: search, $options: 'i' } },
      { movementClass: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = {};
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  try {
    const totalCount = await Product.countDocuments(filter);
    const allProducts = await Product.find({}, '_id');
    const allProductIds = allProducts.map(product => product._id);
    const products =
      noLimit ? await Product.find().exec(): await Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .exec();

    const supplierIds = products.flatMap(p => p.alternateID);
    const categoryIds = products.flatMap(p => p.itemClass);

    const suppliers = await Supplier.find({ KUI: { $in: supplierIds } }).exec();
    const categories = await Category.find({ parentItemClass: { $in: categoryIds } }).exec();

    const enhancedProducts = products.map(product => {
      return {
        ...product.toJSON(),
        suppliers: suppliers.filter(supplier => product?.alternateID.includes(supplier?.KUI)),
        categories: categories.filter(category => product?.itemClass.includes(category?.parentItemClass))
      };
    });
    res.status(httpStatus.OK).send({
      data: enhancedProducts,
      page: parseInt(page),
      limit: parseInt(limit),
      totalCount,
      allProductIds
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error fetching products',
      error: error.message,
    });
  }
});


const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const update = req.body;

  const numberFields = ['masterCTNQty', 'masterUOMLength', 'masterUOMHeight', 'masterUOMWidth', 'masterVolumeCubicM', 'masterWeightKG',
    'baseQTY', 'baseUOMLength', 'baseUOMHeight', 'baseUOMWidth', 'baseVolumeCubicM', 'baseWeightKG', 'lastCost', 'defaultPrice', 'lotSize', 'reorderPoint',
  'maximumSOH','cost','basePrice','priceLevel1','priceLevel2','priceLevel3','priceLevel4','priceLevel5','priceLevel6'
  ];
  numberFields.forEach((field) => {
    if (field in update && update[field] && !isNaN(Number(update[field]))) {
      update[field] = Number(update[field]);
    }
  });

  try {
    const product = await Product.findByIdAndUpdate(id, update, { new: true }).exec();

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Product not found',
      });
    }

    res.status(httpStatus.CREATED).send({
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error updating product',
      error: error.message,
    });
  }
});


const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id).exec();

    if (!product) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'Product not found!',
      });
    }

    res.status(httpStatus.OK).send({
      message: 'Product deleted successfully!',
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'error deleting product',
      error: error.message,
    });
  }
});

const bulkDeleteProduct = catchAsync(async (req, res) => {
  const { ids } = req.body;

  try {
    const result = await Product.deleteMany({ _id: { $in: ids } }).exec();

    if (result.deletedCount === 0) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'No products found to delete!',
      });
    }

    res.status(httpStatus.OK).send({
      message: `${result.deletedCount} products deleted successfully!`,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error deleting products',
      error: error.message,
    });
  }
});

const bulkUpdateProductStatus = catchAsync(async (req, res) => {
  const { ids, newStatus } = req.body;
  console.log("erereererer")
  console.log(ids)
  console.log(newStatus)

  try {
    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { itemStatus: newStatus }
    ).exec();

    if (result.nModified === 0) {
      return res.status(httpStatus.NOT_FOUND).send({
        message: 'No products found to update status!',
      });
    }

    res.status(httpStatus.OK).send({
      message: `${result.nModified} products updated status successfully!`,
    });
  } catch (error) {
    console.log("error",error)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error updating product statuses',
      error: error.message,
    });
  }
});



module.exports = {
  upload,
  getProducts,
  updateProduct,
  deleteProduct,
  addProduct,
  bulkDeleteProduct,
  bulkUpdateProductStatus
};
