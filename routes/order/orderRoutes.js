const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/orders
router.post("/add-order", async (req, res) => {
    try {
        const orderData = req.body;
        const result = await prisma.order.create({
            data: orderData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders
router.get("/all-order", async (req, res) => {
    try {
        const result = await prisma.order.findMany({
            include: {
                customer: true,
            },
            orderBy: {
                id: "desc",
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders
router.get("/recent-order", async (req, res) => {
    try {
        const result = await prisma.order.findMany({
            take: 8,
            include: {
                customer: true,
            },
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
router.get("/order-details/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await prisma.order.findUnique({
            where: {
                id: id,
            },
            include: {
                customer: true,
            },
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// Update a order route
router.patch("/update-order/:id", async (req, res) => {
    try {
        const orderIdString = req.params.id;
        const productId = parseInt(orderIdString);
        const orderUpdateData = req.body;
        const result = await prisma.order.update({
            where: {
                id: productId,
            },
            data: orderUpdateData,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

// GET /api/orders/aggregate
router.get("/statistic", async (req, res) => {
    try {
        const result = await prisma.order.aggregate({
            _sum: {
                totalPrice: true,
            },
            _count: true,
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(400).json({ status: "fail", data: error });
    }
});

module.exports = router;
