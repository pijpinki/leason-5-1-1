const errorHandler = (e, req, res) => {
  console.error("INPUT", req.params, req.query, req.body);
  console.error("---------------------------------------");
  console.error(e);
  console.error("=======================================");

  res.status(500).send({ message: e.message });
};

module.exports = errorHandler;
