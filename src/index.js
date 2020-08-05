const express = require("express");
const path = require("path");
const connection = require("./database/connection");
const usersRouter = require("./router/public/users-router");
const commentsRouter = require("./router/private/comnents-router");
const citiesRotuer = require("./router/public/cities-router");
const imagesRouter = require("./router/public/images-router");
const auth = require("./middleware/auth");

const app = express();

async function main() {
  await connection.init();

  app.use("/app", express.static(path.join(__dirname, "public")));

  app.use(express.json());

  app.use("/users", usersRouter);
  app.use("/cities", citiesRotuer);
  app.use("/comments", auth, commentsRouter);
  app.use("/images", imagesRouter);

  app.listen(8080, err =>
    err ? console.error(err) : console.info("server started")
  );
}

main().catch(console.error);
