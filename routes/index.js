const router = require('express').Router()
const userRoutes = require('./users')
const checkRoutes = require('./checks')

router.use('/', userRoutes)
router.use('/', checkRoutes)

module.exports = router
