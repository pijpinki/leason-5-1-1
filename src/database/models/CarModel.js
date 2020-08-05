const mongoose = require("mongoose");

const CarSchema = mongoose.Schema({
  model: { type: String },
  power: { type: Number },
  plate: { type: String },
  vin: { type: String, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Car", CarSchema);
