const path = require("path");
const multer = require("multer");

const fileSaver = multer({
  dest: path.join(process.cwd(), "src", "public", "tmp")
});

module.exports = fileSaver;
