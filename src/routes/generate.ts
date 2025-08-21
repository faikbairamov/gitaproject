import { Router } from 'express';
import { generate } from '../controllers/generate';
import auth from '../middleware/auth';
import rateLimit from '../middleware/rateLimit';

const router = Router();

router.post('/', auth, rateLimit, generate);

export default router;
