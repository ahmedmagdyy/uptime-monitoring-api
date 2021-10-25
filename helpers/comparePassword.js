const bcrypt = require('bcrypt')

const comparePassword = async (hashedPass, originalPass) => {
  return bcrypt.compare(originalPass, hashedPass)
}

module.exports = { comparePassword }
