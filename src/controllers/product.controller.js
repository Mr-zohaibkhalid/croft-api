const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require("../utils/ApiError");
const {Product} = require("../models");
const readXlsxFile = require("read-excel-file/node");
const csv = require("csvtojson");


const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No file uploaded');
  }
  const { file } = req;

  let products = [];
  const duplicateAlternateIDs = [];
  const importedProducts = [];

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
      } else {
        const product = new Product(productData);
        await product.save();
        importedProducts.push(product);
      }
    }

    if (duplicateAlternateIDs.length > 0) {
      throw new Error(`Duplicate Alternate IDs found: ${duplicateAlternateIDs.join(', ')}`);
    }

    res.status(httpStatus.CREATED).send({
      message: 'Products imported successfully',
      importedProducts,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Error importing products',
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
  } = req.query;

  const filter = {};

  if (req.query.itemStatus) {
    filter.itemStatus = req.query.itemStatus;
  }

  if (req.query.itemClass) {
    filter.itemClass = req.query.itemClass;
  }

  if (req.query.brand) {
    filter.brand = req.query.brand;
  }

  if (req.query.taxCategory) {
    filter.taxCategory = req.query.taxCategory;
  }

  const sort = {};
  sort[sortField] = sortOrder === 'asc' ? 1 : -1;

  try {
    const totalCount = await Product.countDocuments(filter);
    const products = await Product.find(filter)
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
      message: 'Error fetching products',
      error: error.message,
    });
  }
});


module.exports = {
  upload,
  getProducts
};
