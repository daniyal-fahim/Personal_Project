import express from "express";
import { addProduct } from "../Controller/ProductController.js";
const router = express.Router();

router.post("/products", addProduct);

export default router;
