const UserModel = require("../database/models/UserModel");
const errorHandler = require("../error-handler");

const auth = async (req, res, next) => {
  try {
    const { token } = { ...req.query, ...req.body };

    if (!token) {
      return res.status(400).send({ message: "Missed params" });
    }

    const user = await UserModel.findOne({ token });

    if (!user) {
      return res.status(400).send({ message: "Wrong token" });
    }

    if (!UserModel.isTokenValid(token)) {
      return res.status(403).send({ message: "Access denie" });
    }

    user.token.expires = +3600;

    await user.save();

    req.user = user;

    next();
  } catch (e) {
    errorHandler(e, req, res);
  }
};

module.exports = auth;
