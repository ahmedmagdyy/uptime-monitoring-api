const nodemailer = require('nodemailer')

async function sendMail ({ to, body, emailSubject }) {
  const transporter = nodemailer.createTransport(
    {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_HOST_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
      // logger: true,
      // transactionLog: true
    },
    {
      from: 'Url Monitoring Platform <example@nodemailer.com>'
    }
  )

  const data = {
    to,
    subject: emailSubject,
    text: body
  }

  transporter.sendMail(data, (error, info) => {
    if (error) {
      console.log('Error occurred')
      console.log(error.message)
      return process.exit(1)
    }

    console.log('Email sent successfully!')
    console.log(nodemailer.getTestMessageUrl(info))
  })
}

module.exports = { sendMail }
