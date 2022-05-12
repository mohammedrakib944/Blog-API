exports.parseData = (req, res, next) => {
  const { tags } = req.body;
  if (tags) {
    req.body.tags = JSON.parse(tags);
  }
  next();
};
