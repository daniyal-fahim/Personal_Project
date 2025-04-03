const express = require("express");
const bodyParser = require("body-parser");
const productRoutes = require("./Routes/ProductRoute.js");
const stockMovementRoutes = require("./Routes/StockMovementRoute.js");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register routes
app.use("/", productRoutes);
app.use("/", stockMovementRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
