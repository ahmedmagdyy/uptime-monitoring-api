const { Schema, model } = require('mongoose')

const reportSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['Up', 'Down'],
      required: true
    },
    availability: {
      type: Number,
      required: true
    },
    outages: {
      type: Number,
      default: 0
    },
    downtime: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number,
      default: 0
    },
    checkId: {
      type: String,
      required: true
    },
    history: [
      {
        timestamp: {
          type: Date,
          required: true
        },
        websiteStatus: {
          type: String,
          enum: ['Up', 'Down'],
          required: true
        },
        statusCode: {
          type: Number,
          required: true
        },
        responseTime: {
          type: Number,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
)

const reportModel = model('reports', reportSchema)

module.exports = reportModel
