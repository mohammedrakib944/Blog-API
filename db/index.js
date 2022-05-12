const mongoose = require("mongoose");

// connect to mongodb
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("DB connection Faild!", err));
