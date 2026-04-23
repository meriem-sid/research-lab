const mongoose = require("mongoose");

const connectDB = async (retries = 5, delay = 3000) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(` MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error("MongoDB: All connection retries exhausted. Exiting.");
        process.exit(1);
      }
      console.log(`MongoDB: Retrying connection in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
 