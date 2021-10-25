const bcrypt = require('bcryptjs')

const comparePassword = async ({ hashedPass, originalPass }) => {
  return bcrypt.compare(originalPass, hashedPass)
}

module.exports = { comparePassword }
