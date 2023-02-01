const mongoose = require("mongoose");

const connectDB = async () => {
  //  all passed fields will be saved, even if not specified in the model.
  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;
