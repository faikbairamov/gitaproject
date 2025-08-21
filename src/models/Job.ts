import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  userId: mongoose.Types.ObjectId;
  productModel: string;
  customSchema: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: 'pending' | 'completed' | 'failed';
  error: string | null;
  createdAt: Date;
}

const jobSchema = new Schema<IJob>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productModel: { type: String, required: true },
  customSchema: { type: Object, required: true },
  result: { type: Object, default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IJob>('Job', jobSchema);
