const express = require("express");
const router = express.Router();

const orderRoutes = require("./orders/orderRoutes");
const productRoutes = require("./products/productRoutes");

router.use("/orders", orderRoutes);
router.use("/products", productRoutes);

module.exports = router;
