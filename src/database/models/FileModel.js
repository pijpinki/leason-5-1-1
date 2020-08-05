const mongoose = require("mongoose");

const FileSchema = mongoose.Schema({
  path: { type: String, required: true },
  minImagePath: { type: String },
  mimetype: { type: String, required: true },
  createAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", FileSchema);
