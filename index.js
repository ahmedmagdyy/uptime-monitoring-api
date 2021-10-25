const express = require('express')

const app = express()
const port = process.env.PORT || 7000

app.get('/healthz', (req, res) => {
  res.status(200).send('Ok!')
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
