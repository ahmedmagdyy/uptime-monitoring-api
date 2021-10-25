const nodemailer = require('nodemailer')

async function sendMail ({ to, body }) {
  // mail created by nodemailer for testing purposes
  const account = {
    user: 'hwlbxov4jx6i2ud2@ethereal.email',
    pass: 'EPD3MHAzf2PcHrcys2',
    smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
    imap: { host: 'imap.ethereal.email', port: 993, secure: true },
    pop3: { host: 'pop3.ethereal.email', port: 995, secure: true },
    web: 'https://ethereal.email'
  }

  const transporter = nodemailer.createTransport(
    {
      host: process.env.MAIL_HOST || account.smtp.host,
      port: process.env.MAIL_HOST_PORT || account.smtp.port,
      secure: process.env.MAIL_HOST_SECURE || account.smtp.secure,
      auth: {
        user: process.env.MAIL_USER || account.user,
        pass: process.env.MAIL_PASS || account.pass
      },
      logger: true,
      transactionLog: true
    },
    {
      from: 'Url Monitoring Platform <example@nodemailer.com>'
    }
  )

  const data = {
    to,
    subject: 'Email Verification',
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

/**
 * {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_HOST_PORT,
      secure: process.env.MAIL_HOST_SECURE,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      logger: true,
      transactionLog: true
    },
    {
      from: 'Nodemailer <example@nodemailer.com>'
    }
 */
