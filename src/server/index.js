'use strict'

/*
 * Configuration
 */
const config = require('server/config')
const constants = require('server/constants')
const _ = require('lodash')

/*
 * Wall structure.
 */
let wall = createInitialWall()

function createInitialWall () {
  let wall = ''
  for (let i = 0; i < 32; ++i) {
    const x = i % 8
    const y = Math.floor(i / 8)
    let mono = generateOneMono({
      x,
      y,
      foreground: constants.initialWall.foregroundColors[i],
      background: constants.initialWall.backgroundColors[i],
      letter: constants.initialWall.letters[i]
    })
    if (mono.length !== 15) {
      throw new Error(`Initial wall setup wrong for Mono ${i}: ${mono}`)
    }
    wall += mono
  }
  return wall
}

function internalWallToUtf8Ready () {
  let utf8 = ''
  for (let i = 0; i < 32; ++i) {
    const oneMono = wall.substr(i * 15, 15)
    utf8 += oneMono
    if (oneMono.codePointAt(14) < 0x7F) {
      utf8 += '='
    }
  }
  return utf8
}

function internalWallToDiscreteObjects () {
  let rows = []
  for (let y = 0; y < 4; ++y) {
    let columns = []
    for (let x = 0; x < 8; ++x) {
      columns.push({
        x: wall.substr(((y * 8) + x) * 15 + 0, 1),
        y: wall.substr(((y * 8) + x) * 15 + 1, 1),
        foreground: wall.substr(((y * 8) + x) * 15 + 2, 6),
        background: wall.substr(((y * 8) + x) * 15 + 8, 6),
        letter: wall.substr(((y * 8) + x) * 15 + 14, 1)
      })
    }
    rows.push(columns)
  }
  return rows
}

/*
 * Raw TCP endpoint.
 */
const net = require('net')

let clients = []

const rawTcpServer = net.createServer(client => {
  const clientIndex = clients.length
  console.log(`client ${clientIndex} connect`)
  clients.push(client)
  client.on('end', () => {
    const index = clients.indexOf(client)
    clients.splice(index, 1)
    console.log(`client ${index} disconnect`)
  })
  client.on('data', msg => {
    const index = clients.indexOf(client)
    console.log(`client ${index} sent:`)
    console.log(msg.toString())
  })
  client.write(internalWallToUtf8Ready())
})

function tellAllTcpClients () {
  clients.forEach(client => {
    client.write(internalWallToUtf8Ready())
  })
}

/*
 * Web server.
 */
const express = require('express')
const app = express()
const exphbs = require('express-handlebars')
var hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs'
})
app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')

/*
 * Securing headers.
 */
const helmet = require('helmet')
app.use(helmet())

/*
 * Form passing.
 */
const formidable = require('formidable')

/*
 * Administrative API
 */

app.get('/status', (req, res) => {
  res.json({
    siteversion: require('../package').version,
    apiversion: '1',
    hostname: req.hostname,
    address: req.ip,
    protocol: req.protocol
  })
})

app.get('/pid', (req, res) => {
  res.type('text/plain')
  res.send(process.pid.toString())
})

app.get('/crash', (req, res, next) => { // eslint-disable-line no-unused-vars
  if (config.server.environment !== 'production') {
    throw new Error('Deliberate water landing')
  }
  next()
})

/*
 * Static web pages.
 */
app.use(express.static('public'))

app.get('/wall', (req, res) => {
  res.render('wall', {rows: internalWallToDiscreteObjects()})
})

/*
 * API routes.
 */
app.post('/set', (req, res, next) => {
  const form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.log(`error: ${err}`)
      throw err
    }
    console.log(fields)
    const x = parseInt(fields.x, 10)
    const y = parseInt(fields.y, 10)
    const foreground = parseInt(fields.foreground.substr(1), 16)
    const background = parseInt(fields.background.substr(1), 16)
    const letter = fields.letter
    let errors = []
    if (_.isNaN(x) || x < 0 || x > 7) {
      errors.push(`Wrong X coordinate, expected number 0-7 but got ${fields.x}`)
    }
    if (_.isNaN(y) || y < 0 || y > 3) {
      errors.push(`Wrong Y coordinate, expected number 0-7 but got ${fields.y}`)
    }
    if (fields.foreground.charAt(0) !== '#' || _.isNaN(foreground) || foreground < 0 || foreground > 0xFFFFFF) {
      errors.push(`Wrong foreground color, expected RGB hex number but got ${fields.foreground}`)
    }
    if (fields.background.charAt(0) !== '#' || _.isNaN(background) || background < 0 || background > 0xFFFFFF) {
      errors.push(`Wrong background color, expected RGB hex number but got ${fields.background}`)
    }
    if ((letter < 'A' || letter > 'Z') && letter !== 'Æ' && letter !== 'Ø' &&
        letter !== 'Å' && letter !== '_' && letter !== '.' && letter !== '-') {
      errors.push(`Wrong letter, expected A-ZÆØÅ.-_ but got ${fields.letter}`)
    }
    if (errors.length > 0) {
      res.status(400)
      res.type('text/plain')
      res.send(_.join(errors, '\n'))
      return
    }
    updateMono({
      x,
      y,
      foreground: toPaddedHexString(foreground, 6),
      background: toPaddedHexString(background, 6),
      letter: (letter === '_') ? ' ' : letter
    })
    tellAllTcpClients()
    res.redirect('success.html')
  })
})

function updateMono (values) {
  console.log(values)
  const index = (values.y * 8 + values.x) * 15
  wall = wall.substring(0, index) + generateOneMono(values) + wall.substring(index + 15)
}

function generateOneMono (values) {
  let encoding =
    String.fromCharCode(48 + values.x) +
    String.fromCharCode(48 + values.y) +
    values.foreground +
    values.background +
    values.letter
  return encoding
}

function toPaddedHexString (num, len) {
  const str = num.toString(16).toUpperCase()
  return '0'.repeat(len - str.length) + str
}

app.get('/get', (req, res, next) => {
  res.type('text/plain')
  res.charset = 'utf-8'
  res.send(internalWallToUtf8Ready())
})

/*
 * Error handlers
 */

app.use((req, res, next) => {
  next({
    status: 404,
    title: 'Unknown endpoint',
    meta: {resource: req.path}
  })
})

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    next({
      status: err.status,
      title: 'Malformed body',
      detail: 'JSON syntax error',
      meta: {body: err.body}
    })
  } else {
    next(err)
  }
})

/*
 * General error handler.
 *
 * err properties supported (in accordance with http://jsonapi.org/format/#errors):
 * @param {status} HTTP status code to return.
 * @param {title} Stable identification of the error.
 * @param {detail} Detailed identification of the error.
 * @param {meta} Additional information.
 *
 * Additionally, in non-production mode, any stack trace and other properties
 * from err are included.
 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  err.status = err.status || 500
  let returnedError = {
    status: err.status,
    code: err.code || err.status.toString(),
    title: err.title || (err.message || 'Unknown error')
  }
  if (err.detail) {
    returnedError.detail = err.detail
  }
  if (err.meta) {
    returnedError.meta = err.meta
  }
  res.status(returnedError.status)
  if (config.server.environment !== 'production') {
    // More information for non-produciton.
    Object.assign(returnedError, err)
    if (err.stack) {
      returnedError.stack = err.stack
    }
  }
  if (returnedError.status >= 500) {
    console.log(returnedError)
  }
  res.json({errors: [returnedError]})
})

module.exports = {
  http: app,
  tcp: rawTcpServer
}
