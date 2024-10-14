import { Router } from "express";
import {
  createProduct,
  getProductById,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/product";

const router = Router();

router.get("/products", getProducts);

router.get("/products/:id", getProductById);

router.post("/products", createProduct);

router.put("/products/:id", updateProduct);

router.delete("/products/:id", deleteProduct);

export default router;
