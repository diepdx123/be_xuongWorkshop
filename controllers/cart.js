import { StatusCodes } from "http-status-codes";
import Cart from "../models/cart";
import {
  addItemToCartSchema,
  decreaseProductQuantitySchema,
  increaseProductQuantitySchema,
  userIdParamSchema,
} from "../utils/validation";
export const getCartByUserId = async (req, res) => {
  const { error } = userIdParamSchema.validate(req.params);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Cart not found" });
    }
    res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const addItemToCart = async (req, res) => {
  const { error } = addItemToCartSchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { userId, productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, products: [{ productId, quantity }] });
    } else {
      const productIndex = cart.products.findIndex(
        (product) => product.productId.toString() === productId
      );

      if (productIndex > -1) {
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ productId, quantity });
      }
    }

    await cart.save();
    res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const removeItemFromCart = async (req, res) => {
  const { userId, productId } = req.body;
  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Cart not found" });
    }
    cart.products = cart.products.filter(
      (product) =>
        product.productId && product.productId.toString() !== productId
    );

    await cart.save();
    res.status(StatusCodes.OK).json({ cart });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const increaseProductQuantity = async (req, res) => {
  const { error } = increaseProductQuantitySchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { userId, productId } = req.body;
  try {
    let cart = await Cart.findOneAndUpdate(
      { userId, "products.productId": productId },
      { $inc: { "products.$.quantity": 1 } },
      { new: true }
    );

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Cart or product not found" });
    }

    res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const decreaseProductQuantity = async (req, res) => {
  const { error } = decreaseProductQuantitySchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { userId, productId } = req.body;
  try {
    let cart = await Cart.findOneAndUpdate(
      {
        userId,
        "products.productId": productId,
        "products.quantity": { $gt: 1 },
      },
      { $inc: { "products.$.quantity": -1 } },
      { new: true }
    );

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({
          message: "Cart or product not found or quantity is already 1",
        });
    }

    res.status(StatusCodes.OK).json(cart);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
