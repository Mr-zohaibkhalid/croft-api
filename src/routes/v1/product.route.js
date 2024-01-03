const express = require('express');
const productController = require('../../controllers/product.controller');
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'),productController.upload);
router.get('/',productController.getProducts);
router.put('/update/:id',productController.updateProduct);
router.delete('/delete/:id',productController.deleteProduct);

module.exports = router;
