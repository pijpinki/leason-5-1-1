const express = require("express");
const CityModel = require("../../database/models/CityModel");

const router = express.Router();

router.get("/", async (req, res) => {
  const { skip = 0, limit = 100, density = 0 } = req.query;

  const [cities, count, testData] = await Promise.all([
    CityModel.aggregate([
      {
        $match: {
          size: { $ne: null }
        }
      },
      {
        $addFields: {
          density: { $divide: ["$population", "$size"] }
        }
      },
      {
        $match: {
          density: { $gte: Number(density) }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]),
    CityModel.find({}).countDocuments()
  ]);

  res.send({ cities, count, testData });
});

module.exports = router;
