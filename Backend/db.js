const mongoose = require("mongoose");


function db(){
mongoose
  .connect(
    "mongodb+srv://sushilpawar2321_db_user:AAgfNRv6zjNNcrOS@cluster0.mmrzv8e.mongodb.net/chat",
  )
  .then(() => console.log("DataBase is Ready!!!"))
  .catch((err) => console.log({ err: err.message }));
}

module.exports = db;

