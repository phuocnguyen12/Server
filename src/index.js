const express = require("express");
const routes = require("./routes");
const dotenv = require("dotenv");
const dbConnect = require("./config/dbconnect");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const port = process.env.PORT || 3515;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", "PUT", "GET", "DELETE"],
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

dbConnect();

routes(app);

app.listen(port, () => {
  console.log("Server running on port: " + port);
});
