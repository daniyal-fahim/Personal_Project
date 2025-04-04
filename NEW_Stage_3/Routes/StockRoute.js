import express from "express";
import { stockIn, getInventory,sellproduct,getInventoryWithDate } from "../Controller/stockController.js";

const router = express.Router();

router.post("/stock-in", stockIn);
router.post("/sell", sellproduct);
router.get("/inventory/:store_id", getInventory);
router.get("/inventorybydate/:store_id",getInventoryWithDate);

export default router;
