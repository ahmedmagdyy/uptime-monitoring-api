const validator = require('validator').default

function validateCreateCheckInput (req, res, next) {
  const { name, url, protocol } = req.body
  if (
    !validator.isURL(url) ||
    validator.isEmpty(name) ||
    !validator.isIn(protocol, ['HTTP', 'HTTPS', 'TCP'])
  ) {
    return res.status(400).send({ message: 'Invalid Parameters!' })
  }
  next()
}

module.exports = validateCreateCheckInput
