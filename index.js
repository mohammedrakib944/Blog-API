const express = require("express");
require("dotenv").config();
const PORT = process.env.PORT;
const app = express();

app.get("/",(req, res) => {
    res.send("Hi its working")
})

app.listen(PORT, () => {
    console.log(`App is runnig on http://localhost:${PORT}`);
}
)