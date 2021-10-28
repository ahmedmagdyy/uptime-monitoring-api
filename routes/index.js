const router = require('express').Router()
const userRoutes = require('./users')
const checkRoutes = require('./checks')
const reportRoutes = require('./reports')

router.use('/', userRoutes)
router.use('/', checkRoutes)
router.use('/', reportRoutes)

module.exports = router
