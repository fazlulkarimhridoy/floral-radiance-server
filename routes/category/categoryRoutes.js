const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/products
router.post("/add-category", async (req, res) => {
    try {
        const categoryData = req.body;
        const result = await prisma.category.create({
            data: categoryData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/products
router.get("/all-category", async (req, res) => {
    
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "desc",
            },
        });
        res.json({ status: "success", data: categories });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});


// delete a category route
router.delete("/delete-category/:id", async (req, res) => {
    try {
        const categoryIdString = req.params.id;
        const categoryId = parseInt(categoryIdString);
        const result = await prisma.category.delete({
            where: {
                id: categoryId,
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Add more product routes here as needed

module.exports = router;
