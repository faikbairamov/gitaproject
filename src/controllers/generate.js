const User = require('../models/User');
const Job = require('../models/Job');
const gemini = require('../services/gemini');

exports.generate = async (req, res) => {
  try {
    const { productModel, customSchema } = req.body;
    if (!productModel) {
      return res.status(400).json({ error: 'ValidationError', message: 'productModel is required' });
    }
    if (!customSchema) {
      return res.status(400).json({ error: 'ValidationError', message: 'customSchema is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    if (user.creditsUsed >= user.creditsLimit) {
      return res.status(402).json({ error: 'InsufficientCredits', message: 'Credit limit reached' });
    }

    const job = await Job.create({
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
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      await job.save();
      res.status(500).json({ error: 'GenerationFailed', message: 'Gemini request failed' });
    }
  } catch (err) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};
