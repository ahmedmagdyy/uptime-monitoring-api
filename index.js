const dbConnect = require('./db/connect')
const app = require('./server')

const port = process.env.PORT || 7000

dbConnect()
  .then(res => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port} ⚡⚡`)
    })
  })
  .catch(err => console.log(err))
