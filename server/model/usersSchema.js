const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  imgpath: {
    type: String,
    require: true,
  },
  date: {
    date: { type: Date, default: Date.now }, // ✅ Use `Date` instead of `date`
  },
});

const users = new mongoose.model("users", usersSchema);

module.exports = users;
