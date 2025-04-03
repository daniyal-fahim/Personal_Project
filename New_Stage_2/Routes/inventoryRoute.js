import express from "express";
import { getInventory } from "../Controller/InventoryController.js";

const router = express.Router();

router.get("/inventory/:store_id", getInventory);

export default router;
