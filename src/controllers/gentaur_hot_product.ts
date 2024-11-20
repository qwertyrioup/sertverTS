import { Request, Response } from 'express';
import HotProduct from '../models/Hot_gentaur_product';
import GentaurProduct from '../models/Gentaur_Product';

export const toggleHotProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    // Check if the product exists in GentaurProduct
    const product = await GentaurProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product is already marked as hot
    const existingHotProduct = await HotProduct.findOne({ productId });

    if (existingHotProduct) {
      // Unmark as hot
      await HotProduct.deleteOne({ productId });
      return res.status(200).json({ message: 'Product removed from hot products.' });
    } else {
      // Mark as hot
      const hotProduct = new HotProduct({ productId });
      await hotProduct.save();
      return res.status(200).json({ message: 'Product marked as hot.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling hot product status', error });
  }
};

export const toggleHotProductByCatalogNumber = async (req: Request, res: Response) => {
  try {
    const { catalogNumber } = req.params;

    // Find the product by catalog number
    const product = await GentaurProduct.findOne({ catalog_number: catalogNumber });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product is already marked as hot
    const existingHotProduct = await HotProduct.findOne({ productId: product._id });

    if (existingHotProduct) {
      // Unmark as hot
      await HotProduct.deleteOne({ productId: product._id });
      return res.status(200).json({ message: 'Product removed from hot products.' });
    } else {
      // Mark as hot
      const hotProduct = new HotProduct({ productId: product._id });
      await hotProduct.save();
      return res.status(200).json({ message: 'Product marked as hot.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling hot product status', error });
  }
};

export const getHotProducts = async (req: Request, res: Response) => {
  try {
    // Fetch hot products and populate their details from GentaurProduct
    const hotProducts = await HotProduct.find()
      .populate('productId') // Populates details from GentaurProduct
      .exec();

    res.status(200).json(hotProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hot products', error });
  }
};

export const deleteHotProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the hot product exists
    const hotProduct = await HotProduct.findById(id);
    if (!hotProduct) {
      return res.status(404).json({ message: 'Hot product not found' });
    }

    // Delete the hot product
    await HotProduct.deleteOne({ _id: id });

    res.status(200).json({ message: 'Hot product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting hot product', error });
  }
};
