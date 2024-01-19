const express = require('express');
const supplierController = require('../../controllers/supplier.controller');
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'),supplierController.upload);
router.get('/',supplierController.getSuppliers);
router.post('/add',supplierController.addSupplier);
router.put('/update/:id',supplierController.updateSupplier);
router.delete('/delete/:id',supplierController.deleteSupplier);
router.post('/bulk-delete',supplierController.bulkDeleteSupplier);

module.exports = router;
