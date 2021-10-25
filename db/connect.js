const mongoose = require('mongoose')

const {
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DB_NAME,
  MONGO_USER,
  MONGO_PASS
} = process.env

async function establishDatabaseConnection () {
  try {
    const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}`
    console.log({ mongoUrl })
    await mongoose.connect(mongoUrl, {
      dbName: MONGO_DB_NAME
    })
    console.log('Connected to database ✅')
  } catch (error) {
    console.log('Failed connecting to database ❌')
    console.log(error)
  }
}

module.exports = establishDatabaseConnection
