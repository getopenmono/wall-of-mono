'use strict'

const tcp = require('__/tcp')
const hostname = require('os').hostname

// This is the only place to read process.env settings.  The point is that the
// servive should use the configuration like
//
//     const config = require('server/config')
//
// and just extract needed configuration parts and pass them on to modules that
// need them, like
//
//     mymodule(config.logger)
//
// or alternatively
//
//     const port = require('server/config').server.port
//     mymodule(port)

function Defaults () {
  const environment = process.env.NODE_ENV || 'development'
  const port = tcp.normalizePort(process.env.PORT) || 3000
  const niceHostName = hostname().replace('.domain_not_set.invalid', '')
  return {
    environment,
    hostname: niceHostName,
    port
  }
}

const defaults = new Defaults()

/*
 * Configuration groups for various modules.
 */

exports.server = {
  environment: defaults.environment,
  port: defaults.port,
  hostname: 'service.example.com',
  testTimeoutMs: 20 * 1000
}
