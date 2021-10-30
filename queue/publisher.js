/* eslint-disable no-unused-vars */
const axios = require('axios').default
const { Queue, QueueScheduler, Worker } = require('bullmq')
const { generateAxiosConfig } = require('../helpers/generateAxiosConfig')
const {
  formatAndSaveCheckReport
} = require('../helpers/formatAndSaveCheckReport')
const { reportsModel, checksModel } = require('../models')

const queueName = process.env.NODE_ENV === 'Testing' ? 'test' : 'uptime'
const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}

const uptimeQueueScheduler = new QueueScheduler(queueName, {
  connection
})

const uptimeQueue = new Queue(queueName, {
  connection
})

const worker = new Worker(
  queueName,
  async job => {
    console.log('Received job:')
    console.dir({ job: job.data }, { depth: null })
    const jobData = job.data

    const check = await checksModel.findById(jobData._id)
    if (!check) {
      return deleteCheckJob(jobData)
    }

    const config = generateAxiosConfig(jobData)

    config.requestStartTime = Date.now()

    const checkUrl = await axios.get(jobData?.url, config)

    const resStatusCode = checkUrl.status
    const resTimeInSeconds =
      (Date.now() - checkUrl.config.requestStartTime) / 1000

    await formatAndSaveCheckReport({
      check,
      resStatusCode,
      resTimeInSeconds
    })
  },
  {
    connection
  }
)

const addCheckJob = async data => {
  try {
    const uniqueIdentifier = `${data.userId}_${data._id}`
    await uptimeQueue.add(uniqueIdentifier, data, {
      repeat: {
        cron: `*/${data.interval} * * * *`,
        tz: 'Africa/Cairo'
      },
      jobId: uniqueIdentifier
    })
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const deleteCheckJob = async data => {
  try {
    const repeatableJobs = await uptimeQueue.getRepeatableJobs()
    const job = repeatableJobs.find(
      job => job.name === `${data.userId}_${data._id}`
    )

    if (job) {
      await uptimeQueue.removeRepeatableByKey(job.key)
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

module.exports = { addCheckJob, deleteCheckJob }
