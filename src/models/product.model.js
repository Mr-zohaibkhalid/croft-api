const mongoose = require('mongoose');
const {toJSON, paginate} = require("./plugins");

const ProductSchema = new mongoose.Schema({
  preferredSupplier: String,
  itemStatus: String,
  inventoryID: String,
  alternateID: { type: String, unique: true },
  itemClass: String,
  description: String,
  masterCTNQty: Number,
  masterBarcode: String,
  masterUOMLength: Number,
  masterUOMHeight: Number,
  masterUOMWidth: Number,
  masterVolumeCubicM: Number,
  masterWeightKG: Number,
  baseQTY: Number,
  baseUOMBarcode: String,
  baseUOMLength: Number,
  baseUOMHeight: Number,
  baseUOMWidth: Number,
  baseVolumeCubicM: Number,
  baseWeightKG: Number,
  baseUnit: String,
  salesUnit: String,
  purchaseUnit: String,
  lastCost: Number,
  defaultPrice: Number,
  lotSize: Number,
  serialClass: String,
  priceClass: String,
  taxCategory: String,
  brand: String,
  substitute: String,
  crossSell: String,
  upSell: String,
  movementClass: String,
  reorderPoint: Number,
  maximumSOH: Number,
  cost: Number,
  basePrice: Number,
  priceLevel1: Number,
  priceLevel2: Number,
  priceLevel3: Number,
  priceLevel4: Number,
  priceLevel5: Number,
  priceLevel6: Number, createdAt: { type: Date, default: Date.now }
},
);

const Product = mongoose.model('Product', ProductSchema);

// add plugin that converts mongoose to json
ProductSchema.plugin(toJSON);
ProductSchema.plugin(paginate);

module.exports = Product;
