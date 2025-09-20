import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI =process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('Mongo uri not found');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export { connectDB };