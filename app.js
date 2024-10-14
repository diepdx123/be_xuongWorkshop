import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import productRouter from "./routes/product";
import cartRouter from "./routes/cart";
import authRouter from "./routes/auth";
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(`/api`, authRouter);
app.use(`/api`, productRouter);
app.use(`/api`, cartRouter);

mongoose.connect("mongodb://127.0.0.1:27017/xuongWorkshop");

export const viteNodeApp = app;
