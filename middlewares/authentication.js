const jwt = require('jsonwebtoken')

function getUserFromToken (req, res, next) {
  if (req.headers.authorization) {
    const userToken = req.headers.authorization.split(' ')[1]
    const user = jwt.verify(userToken, process.env.ACCESS_TOKEN_JWT_SECRET)
    if (user) {
      req.user = user
    }
  }
  next()
}

module.exports = getUserFromToken
