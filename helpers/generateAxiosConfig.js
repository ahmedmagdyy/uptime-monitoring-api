const https = require('https')

function generateAxiosConfig (check) {
  const axiosConfig = {
    url: check.path || '',
    timeout: check.timeout * 1000
  }
  if (check?.port) axiosConfig.port = check.port

  // https agent to check ssl
  if (check?.protocol === 'https') {
    const ignoreSSlAgent = https.Agent({
      rejectUnauthorized: !check?.ignoreSSL
    })
    axiosConfig.httpsAgent = ignoreSSlAgent
  }

  // check if url require basic authentication
  if (check?.authentication?.username && check?.authentication?.password) {
    axiosConfig.auth = {
      username: check.authorization.username,
      password: check.authorization.password
    }
  }

  // construct headers key:value pairs
  if (check?.httpHeaders?.length) {
    const headers = check.httpHeaders.reduce((prev, next) => {
      prev[next.key] = next.value
      return prev
    }, {})
    console.log({ headers })
  }

  return axiosConfig
}

module.exports = { generateAxiosConfig }
