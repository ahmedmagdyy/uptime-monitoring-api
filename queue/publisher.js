/* eslint-disable no-unused-vars */
const axios = require('axios').default
const { Queue, QueueScheduler, Worker } = require('bullmq')
const { generateAxiosConfig } = require('../helpers/generateAxiosConfig')
const {
  formatAndSaveCheckReport
} = require('../helpers/formatAndSaveCheckReport')
const { reportsModel } = require('../models')

const uptimeQueueScheduler = new QueueScheduler('uptime')
const uptimeQueue = new Queue('uptime', 'redis://localhost:6379')

const worker = new Worker('uptime', async job => {
  console.log('Received job:')
  console.dir({ job: job.data }, { depth: null })
  const jobData = job.data

  // build request config
  const config = generateAxiosConfig(jobData)

  // attach requestStartTime to help calculate
  // response time
  config.requestStartTime = Date.now()

  // send GET req to url
  const checkUrl = await axios.get(jobData?.url, config)

  // get response time of req
  const resStatusCode = checkUrl.status
  const resTimeInSeconds =
    (Date.now() - checkUrl.config.requestStartTime) / 1000

  // generate & save check report
  await formatAndSaveCheckReport({
    checkId: jobData._id,
    resStatusCode,
    resTimeInSeconds
  })
})

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
    // console.log('done publishing job', await uptimeQueue.getRepeatableJobs())
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
