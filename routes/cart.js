import { Router } from "express";
import {
  getCartByUserId,
  addItemToCart,
  increaseProductQuantity,
  decreaseProductQuantity,
  removeItemFromCart,
} from "../controllers/cart";

const router = Router();

router.get("/cart/:userId", getCartByUserId);

router.post("/cart", addItemToCart);

router.put("/cart/increase", increaseProductQuantity);

router.put("/cart/decrease", decreaseProductQuantity);

router.delete("/cart", removeItemFromCart);

export default router;
