const mongoose = require("mongoose");

const SubscribesSchema = mongoose.Schema({
  channelName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Subscribe", SubscribesSchema);
