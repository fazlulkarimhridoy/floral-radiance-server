const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");

const app = express();

app.use(bodyParser.json());

// Use the routes
app.use("/api", routes);

const PORT = process.env.PORT || 3000;

//check if server running and connect to database
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

// server status
app.get("/", (req, res) => {
    res.send("Floral Radiance server is running");
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
