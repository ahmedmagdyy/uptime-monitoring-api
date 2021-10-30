const router = require('express').Router()
const validateCreateCheckInput = require('../../middlewares/createCheck')
const { checksModel, reportsModel } = require('../../models')
const protectedRoute = require('../../middlewares/protectedRoute')
const { addCheckJob, deleteCheckJob } = require('../../queue/publisher.js')

/**
 * @swagger
 * /checks:
 *   post:
 *     description: create new check
 *     tags: [Check]
 *     security:
 *      - BearerAuth: []
 *     produces:
 *       - application/json
 *     requestBody:
 *        description: Check information
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - url
 *                - name
 *                - protocol
 *              properties:
 *                name:
 *                  type: string
 *                url:
 *                  type: string
 *                protocol:
 *                  type: string
 *                  enum: [HTTP, HTTPS, TCP]
 *                status:
 *                  type: string
 *                  enum: [Paused, Running]
 *                  default: Running
 *                path:
 *                  type: string
 *                port:
 *                  type: number
 *                webhook:
 *                  type: string
 *                timeout:
 *                  type: number
 *                interval:
 *                  type: number
 *                threshold:
 *                  type: number
 *                authentication:
 *                  type: object
 *                  properties:
 *                    username:
 *                      type: string
 *                    password:
 *                      type: string
 *                httpHeaders:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      key:
 *                        type: string
 *                      value:
 *                        type: string
 *                assert:
 *                  type: object
 *                  properties:
 *                    statusCode:
 *                      type: number
 *                tags:
 *                  type: array
 *                  items:
 *                    type: string
 *                ignoreSSL:
 *                  type: boolean
 *     responses:
 *       200:
 *         description: Returns a check object.
 *       400:
 *         description: create check failed.
 *       401:
 *         description: unauthenticated.
 */
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

      const createJob = await addCheckJob(saveCheck)
      console.log({ createJob })

      return res.status(200).json(saveCheck)
    } catch (error) {
      console.log({ error })

      return res.status(400).json('Create Check Failed!')
    }
  }
)

/**
 * @swagger
 * /checks:
 *   get:
 *    description: return all checks
 *    tags: [Check]
 *    security:
 *     - BearerAuth: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: Returns array of check objects.
 *      400:
 *        description: Failed to get checks.
 */
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

/**
 * @swagger
 * /checks/:id:
 *   get:
 *    description: return all checks
 *    tags: [Check]
 *    security:
 *     - BearerAuth: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: query
 *        name: id
 *        type: string
 *        required: true
 *        description: id of check
 *    responses:
 *      200:
 *        description: Returns check objects.
 *      400:
 *        description: Failed to get check.
 *      404:
 *        description: check not found.
 *      403:
 *        description: unauthorized.
 */
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
        .status(403)
        .json({ message: "you're not the owner of this check!" })
    }
    return res.status(200).json(checkById)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed Fetching Check!')
  }
})

/**
 * @swagger
 * /checks/:id/reports:
 *   get:
 *    description: return check's report
 *    tags: [Check]
 *    security:
 *     - BearerAuth: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: query
 *        name: id
 *        type: string
 *        required: true
 *        description: id of check
 *    responses:
 *      200:
 *        description: Returns report objects.
 *      400:
 *        description: Failed to get report.
 *      404:
 *        description: check not found.
 *      403:
 *        description: unauthorized.
 */
router.get('/checks/:id/reports', protectedRoute, async (req, res) => {
  const user = req.user

  const id = req.params.id
  try {
    const checkById = await checksModel.findById(id)
    if (!checkById) {
      return res.status(404).json({ message: 'Check not found!' })
    }

    if (checkById.userId !== user.sub) {
      return res
        .status(403)
        .json({ message: "you're not the owner of this check!" })
    }

    const report = await reportsModel.find({ checkId: id })
    return res.status(200).json(report)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed Fetching Check!')
  }
})

/**
 * @swagger
 * /checks/:id:
 *  patch:
 *    description: update check information
 *    tags: [Check]
 *    security:
 *     - BearerAuth: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: query
 *        name: id
 *        type: string
 *        required: true
 *        description: id of check
 *    requestBody:
 *       description: Check information
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *               url:
 *                 type: string
 *                 required: true
 *               protocol:
 *                 type: string
 *                 enum: [HTTP, HTTPS, TCP]
 *                 required: true
 *               status:
 *                 type: string
 *                 enum: [Paused, Running]
 *               path:
 *                 type: string
 *               port:
 *                 type: number
 *               webhook:
 *                 type: string
 *               timeout:
 *                 type: number
 *               interval:
 *                 type: number
 *               threshold:
 *                 type: number
 *               authentication:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   password:
 *                     type: string
 *               httpHeaders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *               assert:
 *                 type: object
 *                 properties:
 *                   statusCode:
 *                     type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               ignoreSSL:
 *                 type: boolean
 *    responses:
 *      200:
 *        description: Returns a check object after update.
 *      400:
 *        description: update check failed.
 *      401:
 *        description: unauthenticated.
 *      403:
 *        description: unauthorized.
 */
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
        .status(403)
        .json({ message: "You're not the owner of this check!" })
    }

    const keys = Object.keys(data)

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'userId') continue
      checkById[keys[i]] = data[keys[i]]
    }

    await checkById.save()

    await deleteCheckJob(checkById)
    if (!keys.includes('status') || keys.status === 'Running') {
      await addCheckJob(checkById)
    }
    const resultCheck = await checksModel.findById(id)

    return res.status(200).json(resultCheck)
  } catch (error) {
    console.log({ error })

    return res.status(400).json('Failed updating Checks!')
  }
})

/**
 * @swagger
 * /checks/:id:
 *   delete:
 *    description: delete check
 *    tags: [Check]
 *    security:
 *     - BearerAuth: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - in: query
 *        name: id
 *        type: string
 *        required: true
 *        description: id of check
 *    responses:
 *      204:
 *        description: check deleted successfully.
 *      400:
 *        description: Failed to delete check.
 *      404:
 *        description: check not found.
 *      403:
 *        description: unauthorized.
 */
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
        .status(403)
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
