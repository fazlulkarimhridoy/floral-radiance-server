const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/products
router.post("/add-product", async (req, res) => {
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
router.get("/all-products", async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                id: "desc",
            },
        });
        res.json({ status: "success", data: products });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Update a product route
router.patch("/update-product/:id", async (req, res) => {
    try {
        const productIdString = req.params.id;
        const productId = parseInt(productIdString);
        const productUpdateData = req.body;
        const result = await prisma.product.update({
            where: {
                id: productId,
            },
            data: productUpdateData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Get product details route
router.get("/details/:id", async (req, res) => {
    try {
        const productIdString = req.params.id;
        const productId = parseInt(productIdString);
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        });
        if (!product) {
            return res
                .status(404)
                .json({ status: "fail", data: "Product not found" });
        }
        res.json({ status: "success", data: product });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// get image by id
router.get("/images-and-name/:itemId", async (req, res) => {
    try {
        const productIdString = req.params.itemId;
        const productId = parseInt(productIdString);
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
            select: {
                product_name: true,
                images: true
            }
        });
        if (!product) {
            return res
                .status(404)
                .json({ status: "fail", data: "Product not found" });
        }
        res.json({ status: "success", data: product });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// delete a product route
router.delete("/delete-product/:id", async (req, res) => {
    try {
        const productIdString = req.params.id;
        const productId = parseInt(productIdString);
        const result = await prisma.product.delete({
            where: {
                id: productId,
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders/aggregate
router.get("/statistic", async (req, res) => {
    try {
        const result = await prisma.product.aggregate({
            _count: true,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

module.exports = router;
