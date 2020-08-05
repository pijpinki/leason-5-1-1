const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectID, ref: "User" }
});

module.exports = mongoose.model("Comment", CommentSchema);
