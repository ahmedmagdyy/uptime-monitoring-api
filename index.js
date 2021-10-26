const express = require('express')
const routes = require('./routes')
const dbConnect = require('./db/connect')
const authMiddleware = require('./middlewares/authentication')

const port = process.env.PORT || 7000
const app = express()

app.use(express.json())
app.get('/healthz', (req, res) => {
  res.status(200).send('Ok!')
})

app.use(authMiddleware)
app.use('/', routes)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port} ⚡⚡`)
})

dbConnect()
