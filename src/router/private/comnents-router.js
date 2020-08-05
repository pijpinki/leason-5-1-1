const express = require("express");
const UserModel = require("../../database/models/UserModel");
const CommentModel = require("../../database/models/CommentModel");
const errorHandler = require("../../error-handler");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const comments = await CommentModel.find();

    res.send({ comments });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.post("/", async (req, res) => {
  try {
    const comment = await CommentModel.create({
      user: req.user._id,
      text: req.body.text
    });

    res.send({ comment });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await CommentModel.findOne({
      _id: commentId,
      user: req.user._id
    });

    if (!comment) {
      return res.status(403).send({ message: "It is not you comment" });
    }

    comment.remove();

    res.send();
  } catch (e) {
    errorHandler(e, req, res);
  }
});

module.exports = router;
