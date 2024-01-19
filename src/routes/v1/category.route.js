const express = require('express');
const categoryController = require('../../controllers/category.controller');
const router = express.Router();

router.get('/',categoryController.getCategories);
router.post('/add',categoryController.addCategory);
router.put('/update/:id',categoryController.updateCategory);
router.delete('/delete/:id',categoryController.deleteCategory);
router.post('/bulk-delete',categoryController.bulkDeleteCategories);

module.exports = router;
