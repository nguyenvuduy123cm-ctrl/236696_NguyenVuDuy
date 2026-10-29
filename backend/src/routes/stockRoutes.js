const express = require('express');
const router = express.Router();

const {
  getStockHistory,
  receiveStock
} = require('../controllers/stockController');

router.get('/history', getStockHistory);
router.post('/receive', receiveStock);

module.exports = router;
