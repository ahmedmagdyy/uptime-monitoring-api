const express = require('express')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const routes = require('./routes')
const authMiddleware = require('./middlewares/authentication')

const port = process.env.PORT || 7000

const app = express()

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Uptime Monitoring API',
      description: 'Monitor uptime and availability of websites.',
      contact: {
        name: 'Ahmed Magdy<ahmedmagdy2016@gmail.com>'
      },
      servers: [`http://localhost:${port}`]
    }
  },
  apis: ['./routes/*/*.js', './components.yaml']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use(express.json())
app.get('/healthz', (req, res) => {
  res.status(200).send('Ok!')
})

app.use(authMiddleware)
app.use('/', routes)

module.exports = app
