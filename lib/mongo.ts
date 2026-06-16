import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectMongo() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI env var not set");
  }

  if (!global.mongooseConn) {
    global.mongooseConn = mongoose.connect(MONGODB_URI);
  }

  return global.mongooseConn;
}

export default connectMongo;
