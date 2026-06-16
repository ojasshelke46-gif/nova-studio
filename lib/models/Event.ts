import mongoose, { Schema, model, models } from "mongoose";

export interface IEvent {
  type: string;
  page?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  type: { type: String, required: true },
  page: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event as mongoose.Model<IEvent>;
