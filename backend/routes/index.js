// routes/cart.js
const express = require('express');
const cartRouter = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate, authorize } = require('../middleware/auth');

cartRouter.use(authenticate, authorize('user'));
cartRouter.get('/', getCart);
cartRouter.post('/add', addToCart);
cartRouter.put('/update', updateCartItem);
cartRouter.delete('/remove', removeFromCart);
cartRouter.delete('/clear', clearCart);

// routes/orders.js
const ordersRouter = express.Router();
const { placeOrder, getUserOrders, getAllOrders, updateOrderStatus, getOrderById, getAnalytics, rateDelivery } = require('../controllers/orderController');

ordersRouter.post('/', authenticate, authorize('user'), placeOrder);
ordersRouter.get('/user', authenticate, authorize('user'), getUserOrders);
ordersRouter.get('/', authenticate, authorize('admin'), getAllOrders);
ordersRouter.get('/analytics', authenticate, authorize('admin'), getAnalytics);
ordersRouter.get('/:id', authenticate, getOrderById);
ordersRouter.put('/:id/status', authenticate, authorize('admin', 'delivery'), updateOrderStatus);
ordersRouter.put('/:id/rate', authenticate, authorize('user'), rateDelivery);

// routes/delivery.js
const deliveryRouter = express.Router();
const { 
  getAssignedOrders, 
  getOrderById: getDeliveryOrderById,
  toggleOnlineStatus,
  updateLocation,
  updateDeliveryStatus, 
  verifyOTP,
  getEarnings,
  getOrderHistory,
  reportIssue,
  getProfile: getDeliveryProfile,
  getDeliveryPartners
} = require('../controllers/deliveryController');

deliveryRouter.get('/orders', authenticate, authorize('delivery'), getAssignedOrders);
deliveryRouter.get('/order/:id', authenticate, authorize('delivery'), getDeliveryOrderById);
deliveryRouter.put('/toggle-online', authenticate, authorize('delivery'), toggleOnlineStatus);
deliveryRouter.put('/update-location', authenticate, authorize('delivery'), updateLocation);
deliveryRouter.put('/update-status', authenticate, authorize('delivery'), updateDeliveryStatus);
deliveryRouter.post('/verify-otp', authenticate, authorize('delivery'), verifyOTP);
deliveryRouter.get('/earnings', authenticate, authorize('delivery'), getEarnings);
deliveryRouter.get('/history', authenticate, authorize('delivery'), getOrderHistory);
deliveryRouter.post('/report-issue', authenticate, authorize('delivery'), reportIssue);
deliveryRouter.get('/profile', authenticate, authorize('delivery'), getDeliveryProfile);
deliveryRouter.get('/partners', authenticate, authorize('admin'), getDeliveryPartners);

// routes/categories.js
const categoriesRouter = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

categoriesRouter.get('/', getCategories);
categoriesRouter.post('/', authenticate, authorize('admin'), createCategory);
categoriesRouter.put('/:id', authenticate, authorize('admin'), updateCategory);
categoriesRouter.delete('/:id', authenticate, authorize('admin'), deleteCategory);

// routes/users.js
const usersRouter = express.Router();
const { getAllUsers, createUser, deleteUser, getProfile, updateProfile } = require('../controllers/userController');

usersRouter.get('/profile', authenticate, getProfile);
usersRouter.put('/profile', authenticate, updateProfile);
usersRouter.get('/admin/all', authenticate, authorize('admin'), getAllUsers);
usersRouter.post('/admin/create', authenticate, authorize('admin'), createUser);
usersRouter.delete('/admin/:id', authenticate, authorize('admin'), deleteUser);

module.exports = { cartRouter, ordersRouter, deliveryRouter, categoriesRouter, usersRouter };
