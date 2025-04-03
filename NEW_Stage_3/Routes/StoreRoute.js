import express from "express";
import { addStore } from "../Controller/storeController.js";

const router = express.Router();

router.post("/add-store", addStore);

export default router;
