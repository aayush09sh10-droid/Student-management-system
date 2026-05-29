import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || '';
    
    // Check if the URI looks truncated
    if (connStr.endsWith('@cluster') || !connStr.includes('.')) {
      console.warn('\n================================================================');
      console.warn('⚠️  DATABASE WARNING: Your MONGO_URI in backend/.env seems to be');
      console.warn('   incomplete or truncated ("' + connStr + '").');
      console.warn('   Please open backend/.env and update it with your full cluster');
      console.warn('   URI (e.g. ending in .mongodb.net/dbname).');
      console.warn('================================================================\n');
    }

    const conn = await mongoose.connect(connStr);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    console.error('👉 Make sure your MongoDB service is running or check your connection string in backend/.env');
    // We don't force exit in development so the Express server can still run and return helpful errors
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
};

export default connectDB;
