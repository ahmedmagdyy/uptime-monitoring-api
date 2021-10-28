const router = require('express').Router()
const protectedRoute = require('../../middlewares/protectedRoute')
const { reportsModel, checksModel } = require('../../models')

router.get('/reports', protectedRoute, async (req, res) => {
  const user = req.user
  const tags = req.body.tags
  try {
    const args = {
      userId: user.sub
    }
    if (tags?.length) {
      args.tags = {
        $in: tags
      }
    }

    const checks = await checksModel.find(args)
    const checkIds = checks.map(check => check._id)

    const allReports = await reportsModel.find({
      checkId: { $in: checkIds }
    })

    return res.status(200).json(allReports)
  } catch (error) {
    console.log({ error })
    return res.status(400).json('Failed to retrieve reports!')
  }
})

module.exports = router
