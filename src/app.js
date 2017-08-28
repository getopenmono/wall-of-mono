'use strict'

const config = require('./config')
const server = require('./server')

const serverListener = server.listen(config.server.port, () => {
  console.log(JSON.stringify({
    status: 'Service up',
    pid: process.pid,
    port: serverListener.address().port
  }))
})
