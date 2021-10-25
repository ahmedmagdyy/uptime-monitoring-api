const router = require('express').Router()
const jwt = require('jsonwebtoken')

const userModel = require('../../models/users')
const validateSignupMiddleware = require('../../middlewares/signup')
const { hashPassword } = require('../../helpers/encryptPassword')
const { comparePassword } = require('../../helpers/comparePassword')
const { usersModel } = require('../../models')
const { sendMail } = require('../../mail')
const { createAccessToken } = require('../../helpers/signAccessToken')

router.post('/signup', validateSignupMiddleware, async (req, res) => {
  const { email, password } = req.body
  try {
    const hasahedPassword = await hashPassword(password)

    const saveUser = await usersModel.create({
      email,
      password: hasahedPassword
    })

    if (!saveUser) {
      return res.status(400).json('Failed to save Use!')
    }

    const token = jwt.sign(
      {
        email
      },
      process.env.JWT_KEY,
      { expiresIn: '12h' }
    )

    const link = `${process.env.APP_URL}/verify?token=${token}`
    const emailBody = `Thanks for register to our service, to verify your email please follow the following link: ${link}`

    await sendMail({
      to: email,
      body: emailBody
    })

    return res.status(200).json(saveUser)
  } catch (error) {
    console.log({ error })
    if (error.toString().includes('E11000 duplicate key error collection')) {
      res.status(400).json({ message: 'Email Already Used!' })
    }
    return res.status(400).json('Signup Failed!')
  }
})

router.get('/verify', async (req, res) => {
  const token = req.query.token
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_KEY)
    const getUser = await usersModel.findOne({
      email: decodedToken.email
    })

    if (!getUser) {
      return res.status(400).json('User Not Found!')
    }

    getUser.isVerified = true

    const updateUser = await getUser.save()

    return res.status(200).json(updateUser)
  } catch (error) {
    console.log(error)
    return res.status(400).json('Verification Failed!')
  }
})

router.post('/signin', validateSignupMiddleware, async (req, res) => {
  const { email, password } = req.body
  try {
    const findUser = await userModel.findOne({
      email
    })

    if (!findUser) {
      return res.status(404).json({ message: 'User Not Found!' })
    }

    const isCorrectPassword = await comparePassword({
      hashedPass: findUser.password,
      originalPass: password
    })

    if (!isCorrectPassword) {
      return res.status(400).json({ message: 'Invalid Password!' })
    }

    const accessToken = createAccessToken({
      id: findUser._id,
      email: findUser.email
    })

    return res.status(200).json({ accessToken })
  } catch (error) {
    console.log(error)
    return res.status(400).json('Verification Failed!')
  }
})

module.exports = router
