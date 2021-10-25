const jwt = require('jsonwebtoken')

function createAccessToken ({ id, email }) {
  const tokenContents = {
    sub: id,
    email
  }

  return jwt.sign(tokenContents, process.env.ACCESS_TOKEN_JWT_SECRET, {
    expiresIn: process.env.NODE_ENV === 'development' ? '1h' : '15m'
  })
}

module.exports = { createAccessToken }
