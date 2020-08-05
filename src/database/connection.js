const mongoose = require("mongoose");
const USERNAME = "editor";
const PASSWORD = "UqhtuwF3IGI6gOc3";
const DATABASE_NAME = "database";
const CONNECT_URL = `mongodb+srv://${USERNAME}:${PASSWORD}@cluster0.c8cdd.mongodb.net/${DATABASE_NAME}`;

class Connection {
  constructor() {
    this.connection = mongoose.connect(CONNECT_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
  }

  async init() {
    try {
      await this.connection;
      console.info("connected to database", CONNECT_URL);
    } catch (e) {
      console.error("Database connection error");
      console.error(e);
      process.exit(1);
    }
  }
}

module.exports = new Connection();
