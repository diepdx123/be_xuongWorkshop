import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SMTPClient } from "emailjs";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { signinSchema, signupSchema } from "../utils/validators/auth";
import { comparePassword, hashPassword } from "../utils/passwordUtils";

export const signup = async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }

    const { username, email, password } = req.body;

    const hashedPassword = await hashPassword(password);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(StatusCodes.CREATED).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { error } = signinSchema.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Email không tồn tại" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Mật khẩu không đúng" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const sanitizedUser = {
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.status(StatusCodes.OK).json({ token, user: sanitizedUser });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Người dùng không tồn tại" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 600000;
    await user.save();

    const client = new SMTPClient({
      user: import.meta.env.VITE_EMAIL_USER,
      password: import.meta.env.VITE_EMAIL_PASS,
      host: "smtp.gmail.com",
      ssl: true,
    });

    const message = {
      text: `Thông báo đặt lại mật khẩu.\n\n
             vui lòng nhập vào đường link sau để hoàn thành:\n\n
             http://${req.headers.host}/reset/${token}\n\n`,
      from: "admin@gmail.com",
      to: user.email,
      subject: "Password Reset",
    };

    client.send(message, (err, message) => {
      if (err) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: err.message });
      }
      res
        .status(StatusCodes.OK)
        .json({ message: "Email đặt lại mật khẩu đã được gui!" });
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// dat lai mat khau
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(StatusCodes.OK)
      .json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

//lay thpong tin nguoi dung hein tai
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Không có quyền truy cập" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Người dùng không tồn tại" });
    }
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Đã xảy ra lỗi trong quá trình lấy thông tin người dùng",
    });
  }
};
