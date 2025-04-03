import express from "express";
import { addProduct } from "../Controller/ProductController.js";

const router = express.Router();

router.post("/add-product", addProduct);

export default router;
