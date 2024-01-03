const mongoose = require('mongoose');
const {toJSON, paginate} = require("./plugins");

const SupplierSchema = new mongoose.Schema({
  supplierName: String,
  email: String,
  companyName: String,
  contactNumber: Number,
  productName: String,
  minQuantity: Number,
  productPrice: Number,
  productWeight: Number,
  status: {type: String, default: 'Inactive'},
},
  {
    timestamps: true,
  }
);

const Supplier = mongoose.model('Supplier', SupplierSchema);

// add plugin that converts mongoose to json
SupplierSchema.plugin(toJSON);
SupplierSchema.plugin(paginate);

module.exports = Supplier;
