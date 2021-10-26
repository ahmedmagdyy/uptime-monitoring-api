const router = require('express').Router()
const validateCreateCheckInput = require('../../middlewares/createCheck')
const { checksModel } = require('../../models')
const protectedRoute = require('../../middlewares/protectedRoute')
const { addCheckJob, deleteCheckJob } = require('../../queue/publisher.js')

router.post(
  '/checks',
  [validateCreateCheckInput, protectedRoute],
  async (req, res) => {
    const { name, url, protocol, tags, ignoreSSl, ...rest } = req.body
    const user = req.user
    try {
      const saveCheck = await checksModel.create({
        name: name.trim(),
        url,
        protocol,
        userId: user.sub,
        tags,
        ignoreSSl,
        ...rest
      })

      // TODO: create cron job to check URL
      const createJob = await addCheckJob(saveCheck)
      console.log({ createJob })

      return res.status(200).json(saveCheck)
    } catch (error) {
      console.log({ error })

      return res.status(400).json('Create Check Failed!')
    }
  }
)

router.get('/checks', protectedRoute, async (req, res) => {
  const user = req.user
  try {
    const allChecks = await checksModel.find({
      userId: user.sub
    })

    return res.status(200).json(allChecks)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed Fetching Checks!')
  }
})

router.get('/checks/:id', protectedRoute, async (req, res) => {
  const user = req.user

  const id = req.params.id
  try {
    const checkById = await checksModel.findById(id)
    if (!checkById) {
      return res.status(404).json({ message: 'Check not found!' })
    }

    if (checkById.userId !== user.sub) {
      return res
        .status(400)
        .json({ message: "you're not the owner of this check!" })
    }
    return res.status(200).json(checkById)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed Fetching Check!')
  }
})

router.patch('/checks/:id', protectedRoute, async (req, res) => {
  const user = req.user
  const id = req.params.id
  const data = req.body

  try {
    const checkById = await checksModel.findById(id)

    if (!checkById) {
      return res.status(404).json({ message: 'Check not found!' })
    }

    if (checkById.userId !== user.sub) {
      return res
        .status(400)
        .json({ message: "You're not the owner of this check!" })
    }

    const keys = Object.keys(data)

    for (let i = 0; i < keys.length; i++) {
      checkById[keys[i]] = data[keys[i]]
    }

    await checkById.save()

    await deleteCheckJob(checkById)
    await addCheckJob(checkById)
    const resultCheck = await checksModel.findById(id)

    return res.status(200).json(resultCheck)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed updating Checks!')
  }
})

router.delete('/checks/:id', protectedRoute, async (req, res) => {
  const user = req.user
  const id = req.params.id
  try {
    const checkExists = await checksModel.findById(id)
    if (!checkExists) {
      return res.status(404).json({ message: 'Check not found!' })
    }

    if (checkExists.userId !== user.sub) {
      return res
        .status(400)
        .json({ message: "You're not the owner of this check!" })
    }

    await checksModel.deleteOne({ id })
    await deleteCheckJob(checkExists)

    return res.status(204).json()
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed Deleting Check!')
  }
})

module.exports = router
