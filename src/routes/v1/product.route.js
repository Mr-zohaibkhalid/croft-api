const express = require('express');
const productController = require('../../controllers/product.controller');
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'),productController.upload);
router.get('/',productController.getProducts);

module.exports = router;
