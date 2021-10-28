const { Schema, model } = require('mongoose')

const checkSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    protocol: {
      type: String,
      enum: ['HTTP', 'HTTPS', 'TCP'],
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Paused', 'Running'],
      default: 'Running'
    },
    path: {
      type: String
    },
    port: {
      type: Number
    },
    webhook: {
      type: String
    },
    timeout: {
      type: Number,
      default: 5
    },
    interval: {
      type: Number,
      default: 10
    },
    threshold: {
      type: Number,
      default: 1
    },
    authentication: {
      username: {
        type: String
      },
      password: {
        type: String
      }
    },
    httpHeaders: [
      {
        key: String,
        value: String
      }
    ],
    assert: {
      statusCode: {
        type: Number
      }
    },
    tags: {
      type: [String]
    },
    ignoreSSL: {
      type: Boolean
    }
  },
  {
    timestamps: true
  }
)

const checkModel = model('checks', checkSchema)

module.exports = checkModel
