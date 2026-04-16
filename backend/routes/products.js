const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getAllProductsAdmin } = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/admin/all', authenticate, authorize('admin'), getAllProductsAdmin);
router.get('/:id', getProduct);

router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty(),
  body('price').isNumeric(),
], createProduct);

router.put('/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

module.exports = router;
