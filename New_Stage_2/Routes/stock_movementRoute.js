import express from "express";
import { stockIn,sellProduct,getInventorybystore } from "../Controller/Stock_MovementController.js";

const router = express.Router();

router.post("/stock-in", stockIn);
router.post("/sell", sellProduct);
router.post("/stock-movements/:store_id",getInventorybystore ); //also contain date fitering and store filtering
export default router;
