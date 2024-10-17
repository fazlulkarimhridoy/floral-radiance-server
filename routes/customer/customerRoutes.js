const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/orders
router.post("/add-customer", async (req, res) => {
    try {
        const customerData = req.body;
        const result = await prisma.customer.create({
            data: customerData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders
router.get("/all-customer", async (req, res) => {
    try {
        const result = await prisma.customer.findMany({
            orderBy: {
                id: "desc",
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders/:id
router.get("/customer-details/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await prisma.customer.findUnique({
            where: {
                id: id,
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// delete a customer route
router.delete("/delete-customer/:id", async (req, res) => {
    try {
        const customerIdString = req.params.id;
        const customertId = parseInt(customerIdString);
        const result = await prisma.product.delete({
            where: {
                id: customertId,
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
        const result = await prisma.customer.aggregate({
            _count: true,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

module.exports = router;
