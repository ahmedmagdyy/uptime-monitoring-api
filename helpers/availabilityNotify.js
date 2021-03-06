const { sendMail } = require('../mail')
const { usersModel } = require('../models')
const axios = require('axios').default

async function notifyUserAboutAvailabilityChange ({
  userId,
  siteAvailabilityStatus,
  url,
  webhookUrl,
  outages,
  threshold
}) {
  try {
    const user = await usersModel.findById(userId)

    if (siteAvailabilityStatus === 'Up' || outages === threshold) {
      const emailNotificationBody = `
        Alert For: ${url}
        Date: ${new Date().toLocaleString()}

        Website is ${
                siteAvailabilityStatus === 'Up'
                  ? 'up and accessible.'
                  : 'down and not accessible now. Back you website status to 200 HTTP status.'
              }
      `
      await sendMail({
        to: user.email,
        body: emailNotificationBody,
        emailSubject: 'Website Status Changed'
      })
    }

    if (webhookUrl) {
      await axios.post(webhookUrl, {
        data: {
          url,
          status: siteAvailabilityStatus,
          message: `Website is ${siteAvailabilityStatus}`
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = { notifyUserAboutAvailabilityChange }
