/* eslint-disable no-unused-vars */
const { Queue, QueueScheduler } = require('bullmq')
const uptimeQueueScheduler = new QueueScheduler('uptime')
const uptimeQueue = new Queue('uptime', 'redis://localhost:6379')

const addCheckJob = async data => {
  try {
    const uniqueName = `${data.name}_${data._id}`
    await uptimeQueue.add(uniqueName, data, {
      repeat: {
        cron: `*/${data.interval} * * * *`
      },
      jobId: uniqueName
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
      job => job.name === `${data.name}_${data._id}`
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