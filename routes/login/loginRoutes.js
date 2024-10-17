const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/products
router.post("/admin-login", async (req, res) => {
    try {
        const loginData = req.body;
        const result = await prisma.category.create({
            data: productData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

module.exports = router;

