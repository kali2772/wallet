const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const transectionSchema = new mongoose.Schema({
  sender: { type: Number, require: true },
  recever: { type: Number, require: true },
  amount: {
    type: Number,
    require: true,
  },
  date: { type: Date, default: Date.now },
});

mongoose.model("Transection", transectionSchema);
