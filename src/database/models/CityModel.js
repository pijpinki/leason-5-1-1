const _ = require("lodash");
const mongoose = require("mongoose");
const casul = require("casual");

const CitySchema = mongoose.Schema({
  name: { type: String },
  population: { type: Number },
  size: { type: Number }
});

CitySchema.static("fillData", async function() {
  const cities = await this.find();

  await Promise.all(
    cities.map(city => {
      city.size = casul.integer(100, 1e3);

      return city.save();
    })
  );
});

CitySchema.static("getCities", async function({ minPopulate }) {
  const cities = await this.find()
    .select("name")
    .where("poplation")
    .gte(minPopulate)
    .limit(100);

  return cities;
});

module.exports = mongoose.model("City", CitySchema);
