import express from "express";
import bodyParser from "body-parser";
import storeRoutes from "./Routes/storeRoute.js";
import productRoutes from "./Routes/productRoute.js";
import stockMovementRoutes from "./Routes/stock_movementRoute.js";
import inventoryRoutes from "./Routes/inventoryRoute.js";
import rateLimiter from "./MiddleWares/rateLimiter.js";
import basicAuthMiddleware from "./MiddleWares/basicAuth.js";

// Setup Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(basicAuthMiddleware);

// Routes
app.use("/", storeRoutes);
app.use("/", productRoutes);
app.use("/", stockMovementRoutes);
app.use("/", inventoryRoutes);
app.use("/", stockMovementRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
