'use strict'

const config = require('./config')
const server = require('./server')

const serverListener = server.http.listen(config.server.port, () => {
  console.log(JSON.stringify({
    status: 'Service up',
    pid: process.pid,
    port: serverListener.address().port
  }))
})

const rcpListener = server.tcp.listen(config.server.rawTcpPort, () => {
  console.log({
    status: 'Raw TCP up',
    port: rcpListener.address().port
  })
})
