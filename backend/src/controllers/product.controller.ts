import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  getProducts,
  getAutocomplete,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
} from '../services/product.service';
import { uploadToS3 } from '../utils/s3';

/** GET /api/products */
export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await getProducts(query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** GET /api/products/search/autocomplete */
export const autocomplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const results = await getAutocomplete(q);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

/** GET /api/products/:id */
export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/** GET /api/products/:id/related */
export const getRelated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await getRelatedProducts(req.params.id);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/** POST /api/products [ADMIN] */
export const createNewProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await createProduct(data);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/products/:id [ADMIN] */
export const updateExistingProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await updateProduct(req.params.id, data);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/products/:id [ADMIN] */
export const deleteExistingProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/products/:id/images [ADMIN] */
export const uploadProductImages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }

    const imageUrls = await Promise.all(
      files.map((file) =>
        uploadToS3(file.buffer, file.originalname, file.mimetype, 'products')
      )
    );

    const product = await addProductImages(req.params.id, imageUrls);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
