import express from "express";
import { stockIn, getInventory } from "../Controller/stockController.js";

const router = express.Router();

router.post("/stock-in", stockIn);
router.get("/inventory/:store_id", getInventory);

export default router;
