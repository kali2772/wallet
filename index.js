const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const PORT = process.env.PORT;
const MONGOURI = process.env.MONGOURI;
app.use(cors());
mongoose.connect(MONGOURI);

mongoose.connection.on("connected", () => console.log("ohhh yehhh"));
mongoose.connection.on("error", (err) => console.log("err connecting", err));

require("./model/user");
require("./model/transection");

app.use(express.json());
app.use(require("./routes/auth"));
app.use(require("./routes/user"));

// comment out
const path = require("path");
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("api is running");
  });
}

app.listen(PORT, () => console.log("server is running on", PORT));
