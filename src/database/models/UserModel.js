const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../../config");

const UserSchema = mongoose.Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  email: { type: String },
  token: { type: String },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  googleId: { type: String }
});

UserSchema.static("initUserFromGoogle", async function(email, name, googleId) {
  const user = await this.findOne({ googleId });

  if (user) return user;

  return new this({
    email,
    login: name.replace(/\s/gim, "_").toLowerCase(),
    googleId
  });
});

UserSchema.method("generateToken", function() {
  const data = new Date();

  data.setHours(data.getHours() + 1);

  return jwt.sign({ _id: this._id, expiresIn: data }, config.secret_key, {
    expiresIn: "1h"
  });
});

UserSchema.static("isTokenValid", function(token) {
  try {
    jwt.verify(token, config.secret_key);

    return true;
  } catch (e) {
    console.warn("Token validation error", e);
    return false;
  }
});

UserSchema.method("isPasswordValid", async function(password) {
  return bcrypt.compare(password, this.password);
});

UserSchema.pre("save", async function(next) {
  if (!this.isNew) {
    return next();
  }

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 5);
  }

  return next();
});

module.exports = mongoose.model("User", UserSchema);
