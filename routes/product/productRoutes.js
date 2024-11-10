const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function storePhotoDataUrl(imagesList) {
    const images = [];

    for (const imageUrl of imagesList) {
        try {
            const formData = new FormData();
            // Add the image data to the FormData object
            formData.append("image", imageUrl); // Field name is 'image'

            const response = await fetch(
                "https://backend.floralradiancebd.com/api/store-photo-dataurl",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            images.push(data.photo_url);
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error; // Rethrow the error to stop processing
        }
    }

    return images;
}

// POST /api/products
router.post("/add-product", async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Request images:", req.body.images);

        const productData = req.body;
        const imagesList = req.body.images || []; // Default to empty array if no images

        if (!productData || Object.keys(productData).length === 0) {
            throw new Error("No product data received");
        }

        if (imagesList.length === 0) {
            console.warn("No images received");
        }

        const images = await storePhotoDataUrl(imagesList);

        // Update productData with the uploaded images
        productData.images = images;

        console.log("Updated product data:", productData);

        // Create the product with the updated images
        const result = await prisma.product.create({
            data: productData,
        });

        res.json({ status: "success", data: result });
    } catch (error) {
        console.error("Error in /add-product route:", error);
        res.status(400).json({
            status: "fail",
            data: error.message || "An unknown error occurred",
        });
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
        const imagesList = req.body.images || []; // Default to empty array if no images
        const images = await storePhotoDataUrl(imagesList);
        productUpdateData.images = images;

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
                images: true,
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
