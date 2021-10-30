/* eslint-disable no-undef */
const chai = require('chai')
const chaiHttp = require('chai-http')

const app = require('../server')
const mongoose = require('mongoose')
process.env.NODE_ENV = 'Testing'

chai.should()
chai.use(chaiHttp)

before(done => {
  mongoose.connect(
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`,
    { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'jestdb' },
    () => done()
  )
})

after(done => {
  mongoose.connection.dropDatabase(() => {
    mongoose.connection.close(() => done())
  })
})

const mockCheck = {
  name: 'Instagram',
  url: 'https://www.Instagram.com/',
  protocol: 'HTTPS',
  tags: ['instagram', 'online', 'social', 'facebook', 'metaverse'],
  ignoreSSl: false,
  interval: 1,
  threshold: 5
}

// ============= User ROUTES TEST =============
describe('User Auth API', () => {
  describe('POST /signup', () => {
    it('register user and responds with a token', done => {
      chai
        .request(app)
        .post('/signup')
        .send({ email: 'test@test.com', password: '123' })
        .end((_err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('accessToken')
          res.body.accessToken.should.be.a('string')
          done()
        })
    })

    it('register another user for authorization check', done => {
      chai
        .request(app)
        .post('/signup')
        .send({ email: 'test2@test.com', password: '123' })
        .end((_err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('accessToken')
          res.body.accessToken.should.be.a('string')
          done()
        })
    })
  })

  describe('POST /signup', () => {
    it('return error message email already used', done => {
      chai
        .request(app)
        .post('/signup')
        .send({ email: 'test@test.com', password: '123' })
        .end((_err, res) => {
          res.should.have.status(400)
          res.body.should.have.property('message')
          res.body.message.should.be.a('string')
          res.body.message.should.equal('Email Already Used!')
          done()
        })
    })
  })

  describe('POST /signin', () => {
    it('responds with a token', done => {
      chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })
        .end((_err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('accessToken')
          res.body.accessToken.should.be.a('string')
          done()
        })
    })
  })

  describe('POST /signin', () => {
    it('invalid password', done => {
      chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '1233' })
        .end((_err, res) => {
          res.should.have.status(400)
          res.body.should.have.property('message')
          res.body.message.should.be.a('string')
          res.body.message.should.equal('Invalid Password!')
          done()
        })
    })
  })

  describe('POST /signin', () => {
    it('return error message user not found', done => {
      chai
        .request(app)
        .post('/signin')
        .send({ email: 'test1@test.com', password: '123' })
        .end((_err, res) => {
          res.should.have.status(404)
          res.body.should.have.property('message')
          res.body.message.should.equal('User Not Found!')
          done()
        })
    })
  })
})

// ============= CHECK ROUTES TEST =============
describe('Check API', async () => {
  describe('GET /checks', async () => {
    it('return empty array', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const getChecks = await chai
        .request(app)
        .get('/checks')
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)
      getChecks.should.have.status(200)
      getChecks.body.should.be.a('array')
      getChecks.body.should.have.lengthOf(0)
    })
  })

  describe('POST /checks', async () => {
    it('save check in database and return check object', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const addCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)
      addCheck.should.have.status(200)
      addCheck.body.should.be.an('object')
      addCheck.body.name.should.equal(mockCheck.name)
      addCheck.body.url.should.equal(mockCheck.url)
      addCheck.body.protocol.should.equal(mockCheck.protocol)
      addCheck.body.tags.should.be.a('array')
      addCheck.body.tags.should.have.lengthOf(mockCheck.tags.length)
      addCheck.body.status.should.be.a('string')
      addCheck.body.status.should.equal('Running')
      addCheck.body.interval.should.equal(mockCheck.interval)
      addCheck.body.threshold.should.equal(mockCheck.threshold)
    })
  })

  describe('GET /checks/:id', async () => {
    it('return check by id', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const getCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const getCheckById = await chai
        .request(app)
        .get(`/checks/${getCheck.body._id}`)
        .set({ authorization: `Bearer ${loginRes.body.accessToken}` })

      getCheckById.should.have.status(200)
      getCheckById.body.should.be.an('object')
      getCheckById.body.name.should.equal(mockCheck.name)
      getCheckById.body.url.should.equal(mockCheck.url)
      getCheckById.body.protocol.should.equal(mockCheck.protocol)
      getCheckById.body.tags.should.be.a('array')
      getCheckById.body.tags.should.have.lengthOf(mockCheck.tags.length)
      getCheckById.body.status.should.be.a('string')
      getCheckById.body.status.should.equal('Running')
      getCheckById.body.interval.should.equal(mockCheck.interval)
      getCheckById.body.threshold.should.equal(mockCheck.threshold)
    })

    it('authorization failed', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const getCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const secondUser = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test2@test.com', password: '123' })

      const getCheckById = await chai
        .request(app)
        .get(`/checks/${getCheck.body._id}`)
        .set({ authorization: `Bearer ${secondUser.body.accessToken}` })

      getCheckById.should.have.status(403)
      getCheckById.body.should.be.a('object')
      getCheckById.body.should.have.property('message')
      getCheckById.body.message.should.equal(
        "You're not the owner of this check!"
      )
    })
  })

  describe('GET /checks/:id/reports', async () => {
    it("return check's report", async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const getCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const checkReport = await chai
        .request(app)
        .get(`/checks/${getCheck.body._id}/reports`)
        .set({ authorization: `Bearer ${loginRes.body.accessToken}` })

      checkReport.should.have.status(200)
      checkReport.body.should.be.a('array')
      checkReport.body.should.have.lengthOf(0)
    })
  })

  describe('PATCH /checks/:id', async () => {
    it('update check property, returns updated version of check', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const addCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const updateCheck = await chai
        .request(app)
        .patch(`/checks/${addCheck.body._id}`)
        .send({
          interval: 5,
          threshold: 2,
          timeout: 10
        })
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      updateCheck.should.have.status(200)
      updateCheck.body.should.be.an('object')
      updateCheck.body.name.should.equal(mockCheck.name)
      updateCheck.body.url.should.equal(mockCheck.url)
      updateCheck.body.protocol.should.equal(mockCheck.protocol)
      updateCheck.body.tags.should.be.a('array')
      updateCheck.body.tags.should.have.lengthOf(mockCheck.tags.length)
      updateCheck.body.status.should.be.a('string')
      updateCheck.body.status.should.equal('Running')
      updateCheck.body.interval.should.equal(5)
      updateCheck.body.threshold.should.equal(2)
      updateCheck.body.timeout.should.equal(10)
    })
  })

  describe('DELETE /checks/:id', async () => {
    it('delete check', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      const addCheck = await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const updateCheck = await chai
        .request(app)
        .delete(`/checks/${addCheck.body._id}`)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      updateCheck.should.have.status(204)
    })
  })
})

// ============= Report ROUTES TEST =============
describe('Check API', async () => {
  describe('GET /reports', async () => {
    it('return empty array', async () => {
      const loginRes = await chai
        .request(app)
        .post('/signin')
        .send({ email: 'test@test.com', password: '123' })

      await chai
        .request(app)
        .post('/checks')
        .send(mockCheck)
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      const getReports = await chai
        .request(app)
        .get('/reports')
        .set('authorization', `Bearer ${loginRes.body.accessToken}`)

      getReports.should.have.status(200)
      getReports.body.should.be.a('array')
      getReports.body.should.have.lengthOf(0)
    })
  })
})
