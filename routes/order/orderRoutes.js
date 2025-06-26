const express = require("express");
const nodemailer = require("nodemailer");
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
            take: 10,
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

router.get("/statistic", async (req, res) => {
    try {
        // Group by status to get count and totalPrice sum for each
        const grouped = await prisma.order.groupBy({
            by: ["orderStatus"],
            _sum: {
                totalPrice: true,
            },
            _count: true,
        });

        // Overall total sum and count
        const overall = await prisma.order.aggregate({
            _sum: {
                totalPrice: true,
            },
            _count: true,
        });

        // Structure data
        const stats = {
            overall: {
                totalRevenue: overall._sum.totalPrice || 0,
                totalOrders: overall._count || 0,
            },
            pending: {
                count: grouped.find((g) => g.orderStatus === "PENDING")?._count || 0,
                amount: grouped.find((g) => g.orderStatus === "PENDING")?._sum.totalPrice || 0,
            },
            shipped: {
                count: grouped.find((g) => g.orderStatus === "SHIPPED")?._count || 0,
                amount: grouped.find((g) => g.orderStatus === "SHIPPED")?._sum.totalPrice || 0,
            },
            cancelled: {
                count: grouped.find((g) => g.orderStatus === "CANCELLED")?._count || 0,
                amount: grouped.find((g) => g.orderStatus === "CANCELLED")?._sum.totalPrice || 0,
            },
            delivered: {
                count: grouped.find((g) => g.orderStatus === "DELIVERED")?._count || 0,
                amount: grouped.find((g) => g.orderStatus === "DELIVERED")?._sum.totalPrice || 0,
            },
        };

        res.json({ status: "success", data: stats });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: "fail", error });
    }
});

// order notification send to admin gmail
router.post("/send-order-notification", async (req, res) => {
    const { name, phone, email, address, deliveryDate, deliveryTime, note, transactionId, cartData, totalPrice } =
        req.body;

    console.log(req.body);

    if (!name || !phone || !email || !address || !deliveryDate || !deliveryTime || !transactionId || !cartData) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Configure the Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail", // Example using Gmail
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email app password
            },
        });

        // Prepare the email content
        const emailContent = `
          <h1>New Order Placed</h1>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Delivery Address:</strong> ${address}</p>
          <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
          <p><strong>Delivery Time:</strong> ${deliveryTime}</p>
          <p><strong>Notes:</strong> ${note}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Total Price:</strong> ${totalPrice} BDT</p>
          <h3>Order Items:</h3>
          <ul>
            ${cartData.map((item) => `<li>${item.product_name} - ${item.price} BDT</li>`).join("")}
          </ul>
        `;

        // Send the email
        await transporter.sendMail({
            from: `"Flower Bouquet Store" <${process.env.EMAIL_USER}>`,
            to: "floralradiancee@gmail.com", // Admin's email address
            subject: "New Order Notification",
            html: emailContent,
        });

        res.status(200).json({
            message: "Order placed and email sent successfully!",
        });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Failed to send email", error });
    }
});

module.exports = router;
