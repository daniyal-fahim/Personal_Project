import express from "express";
import { addStore } from "../Controller/StoreController.js";

const router = express.Router();

router.post("/stores", addStore);

export default router;
