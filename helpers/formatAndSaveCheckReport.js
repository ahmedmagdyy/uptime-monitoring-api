const { reportsModel, checksModel } = require('../models')
const { notifyUserAboutAvailabilityChange } = require('./availabilityNotify')

async function formatAndSaveCheckReport ({
  checkId,
  resTimeInSeconds,
  resStatusCode
}) {
  try {
    const check = await checksModel.findById(checkId)
    const checkReport = await reportsModel.findOne({ checkId })

    const reportHistory = checkReport?.history || []
    const siteAvailabilityStatus =
      resStatusCode === (check.assert.statusCode || 200) ? 'Up' : 'Down'

    // console.log({
    //   checkReport,
    //   reportHistory,
    //   resTimeInSeconds,
    //   resStatusCode,
    //   siteAvailabilityStatus
    // })

    if (!checkReport) {
      const createdReport = await reportsModel.create({
        status: siteAvailabilityStatus, // up or down
        availability: siteAvailabilityStatus === 'Up' ? 100 : 0,
        responseTime: resTimeInSeconds,
        outages: siteAvailabilityStatus === 'Up' ? 0 : 1,
        downtime: siteAvailabilityStatus === 'Up' ? 0 : resTimeInSeconds,
        uptime: siteAvailabilityStatus === 'Up' ? resTimeInSeconds : 0,
        checkId,
        history: [
          {
            timestamp: new Date().toISOString(),
            websiteStatus: siteAvailabilityStatus,
            statusCode: resStatusCode,
            responseTime: resTimeInSeconds
          }
        ]
      })
      console.log({ createdReport })
    } else {
      const oldUrlStatus = checkReport.status

      // calculate uptime & downtime
      checkReport.status = siteAvailabilityStatus
      checkReport.outages += siteAvailabilityStatus === 'Up' ? 0 : 1

      checkReport.downtime +=
        siteAvailabilityStatus === 'Up' ? 0 : check.interval * 60

      checkReport.uptime +=
        siteAvailabilityStatus === 'Up' ? check.interval * 60 : 0

      // save log in history
      checkReport.history = [
        ...reportHistory,
        {
          timestamp: new Date().toISOString(),
          websiteStatus: siteAvailabilityStatus,
          statusCode: resStatusCode,
          responseTime: resTimeInSeconds
        }
      ]

      // get avg response time
      // TO Improve: get avg of specific period of time hours, day, week, month
      const responseTimeAggregate = await reportsModel.aggregate([
        { $match: { checkId } },
        {
          $unwind: '$history'
        },
        {
          $group: {
            _id: '$checkId',
            responseTimeSum: { $sum: '$history.responseTime' },
            historyCount: { $sum: 1 }
            // avgResTime: { $avg: '$history.responseTime' }
          }
        }
      ])

      console.log(responseTimeAggregate)

      // update avg response time
      const totalResponseTime =
        responseTimeAggregate[0].responseTimeSum + resTimeInSeconds
      checkReport.responseTime =
        totalResponseTime / (responseTimeAggregate[0].historyCount + 1)

      // calculate site availability percentage
      const successPollingRequests = await reportsModel.aggregate([
        {
          $match: {
            checkId
          }
        },
        {
          $unwind: '$history'
        },
        {
          $match: {
            'history.websiteStatus': 'Up'
          }
        },
        {
          $group: {
            _id: '$checkId',
            total: {
              $sum: 1
            }
          }
        }
      ])

      // add 1 for the current req log which is not saved yet
      successPollingRequests[0].total += siteAvailabilityStatus === 'Up' ? 1 : 0
      responseTimeAggregate[0].historyCount += 1
      // update availability percentage
      checkReport.availability =
        (successPollingRequests[0].total /
          responseTimeAggregate[0].historyCount) *
        100

      const updatedCheckData = await checkReport.save()
      console.log({ updatedCheckData })

      if (oldUrlStatus !== siteAvailabilityStatus) {
        await notifyUserAboutAvailabilityChange({
          url: check?.url,
          userId: check?.userId,
          webhookUrl: check?.webhookUrl,
          outages: updatedCheckData?.outages,
          threshold: check?.threshold,
          siteAvailabilityStatus
        })
      }
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = { formatAndSaveCheckReport }
