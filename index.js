const express = require("express");
require("dotenv").config();
require("express-async-errors");
const morgan = require("morgan");
const postRouter = require("./routers/post.route");
const app = express();
const PORT = process.env.PORT;

// database connection
require("./db");
// allow app to use JSON file
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/post", postRouter);

// error handler
app.use((err, req, res, next) => {
  if (err) {
    res.status(500).json({ error: "Server error - " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`App is runnig on http://localhost:${PORT}`);
});
