/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const request = require('supertest')
const constants = require('server/constants')

describe('wall of mono API', () => {
  const app = require('server')
  describe('/get', () => {
    it('should give a board with all letters initially', done => {
      request(app)
      .get('/get')
      .expect(200)
      .expect(res => {
        let base = 0
        for (let i = 0; i < 32; ++i) {
          let mono = res.text.substr(base, 16)
          // There is no just no way to avoid stupid UTF-16.
          if (mono[15] === '=') {
            mono = res.text.substr(base, 15)
            base += 1
          }
          base += 15
          expect(mono[0]).to.equal(String.fromCharCode(48 + (i % 8)))
          expect(mono[1]).to.equal(String.fromCharCode(48 + Math.floor(i / 8)))
          expect(mono.substr(2, 6)).to.equal(constants.initialWall.foregroundColors[i])
          expect(mono.substr(8, 6)).to.equal(constants.initialWall.backgroundColors[i])
          expect(mono.substr(14, 1)).to.equal(constants.initialWall.letters[i])
        }
      })
      .end(done)
    })
  })
  describe('/set', () => {
    it('should accept a form with coordinates, colors & letter', done => {
      request(app)
      .post('/set')
      .field('x', 1)
      .field('y', 2)
      .field('foreground', 'DEAD12')
      .field('background', 'DEAD12')
      .field('letter', 'Ø')
      .expect(201)
      .expect('Content-Type', /text/)
      .expect(/Success/)
      .end(done)
    })
  })
})
