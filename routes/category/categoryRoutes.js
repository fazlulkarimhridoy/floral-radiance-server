const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/category
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

// GET /api/category
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

// Update a category route
router.patch("/update-category/:id", async (req, res) => {
    try {
        const categoryIdString = req.params.id;
        const categoryId = parseInt(categoryIdString);
        const categoryUpdateData = req.body;

        const result = await prisma.category.update({
            where: {
                id: categoryId,
            },
            data: categoryUpdateData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Get category details route
router.get("/details/:id", async (req, res) => {
    try {
        const categoryIdString = req.params.id;
        const categoryId = parseInt(categoryIdString);
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId,
            },
        });
        if (!category) {
            return res
                .status(404)
                .json({ status: "fail", data: "Category not found" });
        }
        res.json({ status: "success", data: category });
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
