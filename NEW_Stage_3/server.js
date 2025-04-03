import express from "express";
import storeRoutes from "./Routes/StoreRoute.js";
import productRoutes from "./Routes/ProductRoute.js";
import stockRoutes from "./Routes/StockRoute.js";
import { initRabbitMQ } from "./Services/rabbitMQ.js";
import { redisClient } from "./Config/redis.js";
import bodyParserMiddleware from "./Middleware/bodyParser.js";
import authMiddleware from "./Middleware/basicAuth.js";
import limiter from "./Middleware/rateLimit.js";

const app = express();
const PORT = 5000;

// Initialize RabbitMQ
initRabbitMQ();

// Middleware
app.use(bodyParserMiddleware);
app.use(authMiddleware);
app.use(limiter);

// Routes
app.use(storeRoutes);
app.use(productRoutes);
app.use(stockRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
