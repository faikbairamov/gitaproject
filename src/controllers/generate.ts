import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Job, { IJob } from '../models/Job';
import gemini from '../services/gemini';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const generate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productModel, customSchema } = req.body;

    if (!productModel) {
      res.status(400).json({ error: 'ValidationError', message: 'productModel is required' });
      return;
    }

    if (!customSchema) {
      res.status(400).json({ error: 'ValidationError', message: 'customSchema is required' });
      return;
    }

    const user: IUser | null = await User.findById(req.user?.id);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      return;
    }

    if (user.creditsUsed >= user.creditsLimit) {
      res.status(402).json({ error: 'InsufficientCredits', message: 'Credit limit reached' });
      return;
    }

    const job: IJob = await Job.create({
      userId: user._id,
      productModel,
      customSchema,
    });

    try {
      const result = await gemini.generate(productModel, customSchema);
      job.result = result;
      job.status = 'completed';
      await job.save();

      user.creditsUsed += 1;
      await user.save();

      res.json({ job });
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message;
      await job.save();
      res.status(500).json({ error: 'GenerationFailed', message: 'Gemini request failed' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};
