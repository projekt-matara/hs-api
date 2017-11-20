/*
*
  Central configuration for the Halfstak API
*
*/
const Promise = require('bluebird')
const koa = require('koa')
const config = require('./config')
const convert = require('koa-convert')
const cors = require('kcors')
const helmet = convert(require('koa-helmet'))
const error = require('koa-json-error')
const logger = require('koa-logger')
const koaRes = require('koa-res')
const compress = require('koa-compress')
const router = require('koa-simple-router')
const bodyParser = require('koa-bodyparser')
const mongoose = require('mongoose')
const user = require('./controllers/user')
const passport = require('koa-passport')
const session = require('koa-generic-session')
const authController = require('./controllers/auth')
const clientController = require('./controllers/client')
const jwt = require('koa-jwt')
const authz = require('./services/authorization')
const auth = require('./controllers/auth')
const oauth = require('./controllers/oauth2')
const client = require('./controllers/clientAuth')

// create Koa server
const app = new koa()

/*
  MONGOOSE CONFIG
*/
mongoose.Promise = require('bluebird')
mongoose
.connect(config.mongo_url)
.then((response) => {
  console.log('connected to mongo :-)');
})
.catch((err) => {
  console.log("Error connecting to Mongo");
  console.log(err);
})

/*
  SERVER CONFIG
*/

// error handling
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (err.status === 401) {
      ctx.status = 500
      ctx.body = "There has been an error processing your request."
      ctx.app.emit('error', err, ctx)
    } 
    else if (err.status === 501) {
      console.log(err.message)
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    } else {
      ctx.status = err.status || 500
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    }
  }
})

// security headers
app.use(helmet())

// logging
app.use(logger())

// format response as JSON
app.use(convert(koaRes()))

// response time
app.use(async function (ctx, next) {
  const start = new Date()
  await next()
  const ms = new Date() - start
  ctx.set('X-Response-Time', `${ms}ms`)
})

// logger
app.use(async function (ctx, next) {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}`)
})

// compression
app.use(compress({
  filter: (content_type) => {
    return /text/i.test(content_type)
  },
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
}))

// body parser
app.use(bodyParser())

// session config
app.key = ['secret']
app.use(convert(session()))

// passport config
app.use(passport.initialize())

// cors
app.use(convert(cors()))

// unprotected router
app.use(router(_ => {
  _.post('/oauth/token',
    passport.authenticate(['clientBasic', 'clientPassword'], { session: false }),
    oauth.server.token(),
    oauth.server.errorHandler()),
  _.post('/user/new', user.createUser)
}))

// test jwt
app.use(jwt({ secret: config.secret }))

// protected router
app.use(router(_ => {
  _.put('/user/edit-email', authz.editUserEmail, user.editUserEmail),
  _.delete('/user/delete', user.deleteUser),
  _.put('/user/create-customer', user.createCustomer),
  _.put('/user/cancel-subscription', user.cancelSubscription),
  _.put('/user/edit-pay-email', user.editPayEmail),
  _.put('/user/change-card', user.changeCard),
  _.put('/user/change-password', user.changePassword),
  _.post('/user', user.getUser)
}))

// listen on a port NEED TO CHANGE TO LISTEN TO ENVIRONMENT PRODUCTION VARIABLE
app.listen(3000)