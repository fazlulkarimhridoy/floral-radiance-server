const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../../generated/prisma");
const prisma = new PrismaClient();

const fs = require("fs");
const path = require("path");

// Local upload storage: <projectRoot>/public/products
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const PRODUCT_IMAGES_DIR = path.join(PUBLIC_DIR, "products");
fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });

function inferExtension(mimeType) {
  if (!mimeType || typeof mimeType !== "string") return "jpg";
  const [, subtype] = mimeType.split("/");
  if (!subtype) return "jpg";
  const cleanSubtype = subtype.split("+")[0];
  if (cleanSubtype === "jpeg") return "jpg";
  return cleanSubtype;
}

function isAllowedImageExtension(ext) {
  // Keep this list tight: prevents writing unexpected file types.
  return ["jpg", "png", "webp", "gif", "svg"].includes(
    String(ext || "").toLowerCase(),
  );
}

async function storeImagesLocally(imagesList = []) {
  if (!Array.isArray(imagesList)) {
    throw new Error("Images must be an array of base64 data URL strings");
  }

  const images = [];

  for (const imagePayload of imagesList) {
    if (!imagePayload || typeof imagePayload !== "string") {
      throw new Error("Image payload must be a base64 data URL string");
    }

    const trimmed = imagePayload.trim();
    const match = trimmed.match(/^data:(.+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : trimmed;

    if (!mimeType.startsWith("image/")) {
      throw new Error("Only image uploads are supported");
    }

    const ext = inferExtension(mimeType);
    if (!isAllowedImageExtension(ext)) {
      throw new Error(`Unsupported image type: ${mimeType}`);
    }

    const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const absolutePath = path.join(PRODUCT_IMAGES_DIR, fileName);

    try {
      fs.writeFileSync(absolutePath, Buffer.from(base64Data, "base64"));
    } catch (error) {
      console.error("Error saving image locally:", error);
      throw new Error("Failed to save image");
    }

    // Persist a path that can be requested via /public/products/:fileName
    images.push(`/public/products/${fileName}`);
  }

  return images;
}

function toAbsoluteImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;

  const normalized = imagePath.replace(/\\/g, "/").trim();

  // Only allow deleting files we ourselves serve from /public
  if (!normalized.startsWith("/public/") && !normalized.startsWith("public/")) {
    return null;
  }

  const relativePath = normalized.replace(/^\/?public\//, "");
  const resolvedPublicDir = path.resolve(PUBLIC_DIR);
  const resolvedTarget = path.resolve(path.join(PUBLIC_DIR, relativePath));

  // Prevent path traversal (e.g. /public/../index.js)
  if (resolvedTarget === resolvedPublicDir) return null;
  if (!resolvedTarget.startsWith(resolvedPublicDir + path.sep)) return null;

  return resolvedTarget;
}

function removeImagesFromDisk(imagePaths = []) {
  if (!Array.isArray(imagePaths)) return;

  for (const imgPath of imagePaths) {
    const absolutePath = toAbsoluteImagePath(imgPath);
    if (!absolutePath) continue;
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      console.error(`Failed to delete image ${absolutePath}:`, err);
    }
  }
}

// POST /api/products
router.post("/add-product", async (req, res) => {
  try {
    const productData = { ...req.body };
    const imagesList = req.body.images || []; // base64 data URLs

    delete productData.images;

    if (!productData || Object.keys(productData).length === 0) {
      throw new Error("No product data received");
    }

    let uploadedImages = [];
    try {
      uploadedImages = await storeImagesLocally(imagesList);
    } catch (imageError) {
      return res.status(400).json({
        status: "fail",
        data: imageError.message || "Failed to upload product images",
      });
    }

    // Create the product with the updated images (stored as JSON string)
    let result;
    try {
      result = await prisma.product.create({
        data: { ...productData, images: JSON.stringify(uploadedImages) },
      });
    } catch (dbError) {
      // Avoid orphaned files if DB insert fails
      removeImagesFromDisk(uploadedImages);
      throw dbError;
    }

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

    if (isNaN(productId) || productId < 1) {
      return res
        .status(400)
        .json({ status: "fail", data: "Invalid product ID" });
    }

    const productUpdateData = { ...req.body };

    // Supported payloads:
    // 1) Legacy full replace: { images: [dataUrl,...] }
    // 2) Incremental: { addImages: [dataUrl,...], removeImages: ["/public/products/x.jpg", ...] }
    const imagesList = req.body.images;
    const addImages = Array.isArray(req.body.addImages)
      ? req.body.addImages
      : [];
    const removeImages = Array.isArray(req.body.removeImages)
      ? req.body.removeImages
      : [];

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (!existingProduct) {
      return res
        .status(404)
        .json({ status: "fail", data: "Product not found" });
    }

    // Parse images from DB (stored as JSON string)
    let parsedImages = [];
    try {
      parsedImages =
        typeof existingProduct.images === "string"
          ? JSON.parse(existingProduct.images)
          : Array.isArray(existingProduct.images)
            ? existingProduct.images
            : [];
    } catch (e) {
      parsedImages = [];
    }
    const currentImages = parsedImages;
    let nextImages = currentImages;
    let imagesToDelete = [];
    let newlyWrittenImages = [];

    const hasImagesProp = Object.prototype.hasOwnProperty.call(
      req.body,
      "images",
    );
    if (hasImagesProp) {
      // Full replace (including empty array = clear all images)
      try {
        const uploaded = await storeImagesLocally(imagesList || []);
        newlyWrittenImages = uploaded;
        nextImages = uploaded;
        imagesToDelete = currentImages;
      } catch (imageError) {
        return res.status(400).json({
          status: "fail",
          data: imageError.message || "Failed to upload product images",
        });
      }
    } else {
      // Incremental update
      if (removeImages.length > 0) {
        const removeSet = new Set(removeImages);
        imagesToDelete = currentImages.filter((img) => removeSet.has(img));
        nextImages = currentImages.filter((img) => !removeSet.has(img));
      }

      if (addImages.length > 0) {
        try {
          const uploaded = await storeImagesLocally(addImages);
          newlyWrittenImages = uploaded;
          nextImages = nextImages.concat(uploaded);
        } catch (imageError) {
          return res.status(400).json({
            status: "fail",
            data: imageError.message || "Failed to upload product images",
          });
        }
      }
    }

    // Only set images if something changed (stringify for DB storage)
    if (nextImages !== currentImages) {
      productUpdateData.images = JSON.stringify(nextImages);
    }

    // Don’t persist helper fields
    delete productUpdateData.addImages;
    delete productUpdateData.removeImages;

    let result;
    try {
      result = await prisma.product.update({
        where: { id: productId },
        data: productUpdateData,
      });
    } catch (dbError) {
      // DB failed: rollback newly written files
      if (newlyWrittenImages.length > 0) {
        removeImagesFromDisk(newlyWrittenImages);
      }
      throw dbError;
    }

    // DB succeeded: now delete old removed images
    if (imagesToDelete.length > 0) {
      removeImagesFromDisk(imagesToDelete);
    }

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("Error in /update-product route:", error);
    res.status(400).json({ status: "fail", data: error.message || error });
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

module.exports = router;
