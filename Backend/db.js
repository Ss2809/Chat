const mongoose = require("mongoose");


function db(){
mongoose
  .connect(
    process.env.db
  )
  .then(() => console.log("DataBase is Ready!!!"))
  .catch((err) => console.log({ err: err.message }));
}

module.exports = db;

