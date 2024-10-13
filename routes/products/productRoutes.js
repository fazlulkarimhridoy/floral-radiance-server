const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


// POST /api/products
router.post("/addProduct", async (req, res) => {
    console.log(req.body);
    // if (!req.body.product_name ||!req.body.description ||!req.body.price) {
    //     console.log(req.body);
    //     return res.status(400).json({ status: "fail", data: "Missing required fields: name, description, and price" });
    // }
    try {
        const productData = req.body;
        const result = await prisma.product.create({
            data: productData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/products
router.get("/", async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json({ status: "success", data: products });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Add more product routes here as needed

module.exports = router;
