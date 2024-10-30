const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const routes = require("./routes");
const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------middlewares-------------------------------------------
app.use(
    cors({
        origin: [
            "https://www.floralradiancebd.com",
            "floralradiancebd.com",
            "https://floralradiancebd.com",
            "http://floralradiancebd.com",
            "http://localhost:3001",
            "https://floral-radiance-client.netlify.app",
            "https://floral-radiance-client.vercel.app",
            "https://floral-radiance-server.vercel.app",
            "https://floral.mahim.xri.com.bd"
        ],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ------------------------------------parser-------------------------------------------
app.use(bodyParser.json({ limit: "100mb" }));

// ------------------------------------auth/jwt api-------------------------------------------
app.post("/login", (req, res) => {
    const user = req.body;
    if (
        user.email === process.env.EMAIL &&
        user.password === process.env.PASSWORD
    ) {
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h",
        });
        res.send({ success: true, token: token });
    } else {
        res.json({ status: "fail", message: "Invalid credentials" });
    }
});


// ------------------------------------user routes-------------------------------------------
app.use("/api", routes);

// ------------------------------------checking if server running and connected with db-------------------------------------------
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma
    .$connect()
    .then(() => {
        console.log("Connected to the database");
    })
    .catch((error) => {
        console.error("Error connecting to the database", error);
    });

// ------------------------------------checking server status-------------------------------------------
app.get("/", (req, res) => {
    res.send("Floral Radiance server is running");
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
