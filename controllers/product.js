import { StatusCodes } from "http-status-codes";
import Attribute from "../models/attribute";
import Product from "../models/product";
import { productSchema } from "../utils/validators/product";
import slugify from "slugify";
export const createProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }

    const { name } = value;

    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Sản phẩm với tên này đã tồn tại" });
    }

    // tao slug()giong id
    const slug = slugify(name, { lower: true });

    const product = await Product.create({ ...value, slug });
    res.status(StatusCodes.CREATED).json(product);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { _embed } = req.query;

    const product = await Product.findById(id).populate(
      _embed ? _embed.split(",") : []
    );
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Sản phẩm không tồn tại" });
    }

    res.status(StatusCodes.OK).json(product);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { _page = 1, _limit = 10, _embed } = req.query;
    const options = {
      page: parseInt(_page, 10),
      limit: parseInt(_limit, 10),
    };

    let query = Product.find();

    if (_embed) {
      const embeds = _embed.split(",");
      embeds.forEach((embed) => {
        query = query.populate(embed);
      });
    }

    const result = await Product.paginate(query, options);
    const { docs, ...paginationData } = result;

    return res.status(StatusCodes.OK).json({
      products: docs,
      ...paginationData,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.details[0].message });
    }

    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, value, {
      new: true,
    });
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Không tìm thấy sản phẩm nào" });
    }
    res.status(StatusCodes.OK).json(product);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Không tìm thấy sản phẩm nào" });
    }
    res.status(StatusCodes.OK).json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
