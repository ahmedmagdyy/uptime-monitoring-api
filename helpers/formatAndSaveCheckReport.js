const { reportsModel } = require('../models')
const { notifyUserAboutAvailabilityChange } = require('./availabilityNotify')

async function formatAndSaveCheckReport ({
  check,
  resTimeInSeconds,
  resStatusCode
}) {
  try {
    const checkId = check?._id.toString()
    const checkReport = await reportsModel.findOne({ checkId })

    const reportHistory = checkReport?.history || []
    const siteAvailabilityStatus =
      resStatusCode === (check?.assert?.statusCode || 200) ? 'Up' : 'Down'

    if (!checkReport) {
      await reportsModel.create({
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
    } else {
      const oldUrlStatus = checkReport.status

      checkReport.status = siteAvailabilityStatus
      checkReport.outages += siteAvailabilityStatus === 'Up' ? 0 : 1

      checkReport.downtime +=
        siteAvailabilityStatus === 'Up' ? 0 : check?.interval * 60

      checkReport.uptime +=
        siteAvailabilityStatus === 'Up' ? check?.interval * 60 : 0

      checkReport.history = [
        ...reportHistory,
        {
          timestamp: new Date().toISOString(),
          websiteStatus: siteAvailabilityStatus,
          statusCode: resStatusCode,
          responseTime: resTimeInSeconds
        }
      ]

      const {
        historyCount,
        newAvgResponseTime
      } = await calculateAvgResponseTime({
        checkId,
        requestResponseTime: resTimeInSeconds
      })
      checkReport.responseTime = newAvgResponseTime

      checkReport.availability = await calculateSiteAvailabilityPercentage({
        checkId,
        historyCount,
        siteAvailabilityStatus
      })

      const updatedCheckData = await checkReport.save()

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

async function calculateAvgResponseTime ({ checkId, requestResponseTime }) {
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
      }
    }
  ])
  const totalResponseTime =
    responseTimeAggregate?.[0].responseTimeSum + requestResponseTime

  // add 1 for the current request which is not saved
  const newHistoryCount = responseTimeAggregate?.[0]?.historyCount + 1
  const newAvgResponseTime = totalResponseTime / newHistoryCount

  return {
    newAvgResponseTime,
    historyCount: newHistoryCount
  }
}

async function calculateSiteAvailabilityPercentage ({
  checkId,
  siteAvailabilityStatus,
  historyCount
}) {
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

  successPollingRequests[0].total += siteAvailabilityStatus === 'Up' ? 1 : 0

  const newAvailabilityPercentage =
    (successPollingRequests[0].total / historyCount) * 100

  return newAvailabilityPercentage
}

module.exports = { formatAndSaveCheckReport }
