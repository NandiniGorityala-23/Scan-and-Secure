import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
  uploadProductImage,
} from '../controllers/product.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { uploadCSV, uploadImage } from '../middleware/upload.middleware.js';
import { validateObjectIdParam } from '../middleware/validateParams.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', validateObjectIdParam('id'), updateProduct);
router.delete('/:id', validateObjectIdParam('id'), deleteProduct);
router.post('/import', uploadCSV.single('file'), importProducts);
router.post('/upload-image', uploadImage.single('image'), uploadProductImage);

export default router;
