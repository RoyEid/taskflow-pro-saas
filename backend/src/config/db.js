import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`[DB] Primary MongoDB connection failed (${error.message}). Trying local fallback...`);
        try {
            const localURI = "mongodb://127.0.0.1:27017/taskflow-pro";
            const conn = await mongoose.connect(localURI);
            console.log(`MongoDB Connected to Local Fallback: ${conn.connection.host}`);
        } catch (localError) {
            console.error(`[DB] Local fallback MongoDB connection also failed: ${localError.message}`);
            // Do not exit process so that the server can still run on port 5000 and serve requests/error statuses.
        }
    }
}
export default connectDB;