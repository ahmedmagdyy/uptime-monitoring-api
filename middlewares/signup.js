const validator = require('validator').default

function validateSignupInput (req, res, next) {
  const { email, password } = req.body
  if (!validator.isEmail(email) || validator.isEmpty(password)) {
    return res.status(400).send({ message: 'invalid email or password!' })
  }
  next()
}

module.exports = validateSignupInput
