const express = require("express");
const router = express.Router();

const orderRoutes = require("./order/orderRoutes");
const productRoutes = require("./product/productRoutes");
const categoryRoutes = require("./category/categoryRoutes");
const customerRoutes = require("./customer/customerRoutes");

router.use("/order", orderRoutes);
router.use("/product", productRoutes);
router.use("/category", categoryRoutes);
router.use("/customer", customerRoutes);

module.exports = router;
