const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const db = await mongoose
      .connect(process.env.MONGO_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Connect DB success!");
      });
  } catch (e) {
    console.log("DB connection fail!");
  }
};

module.exports = dbConnect;
