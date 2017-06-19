/*
*
	Central configuration for the Halfstak API
*
*/

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
  filter: function (content_type) {
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
	_.post('/authtest', async ctx => {
		console.log('testing one two')
		console.log(ctx.headers)
		ctx.body = ctx.headers.authorization
	})
}))

// test jwt
app.use(jwt({ secret: config.secret }))

// protected router
app.use(router(_ => {
	_.post('/login', user.login),
	_.post('/createuser', user.createUser),
	_.put('/edit_email', user.editUserEmail),
	_.put('/deleteuser', user.deleteUser),
	_.put('/stripe/createcustomer', user.createCustomer),
	_.put('/stripe/cancelsubscription', user.cancelSubscription),
	_.put('/stripe/editpayemail', user.editPayEmail),
	_.put('/stripe/changecard', user.changeCard),
	_.put('/changepassword', user.changePassword),
	_.post('/user', user.getUser),
	_.post('/protectedroute', async ctx => {
		ctx.body = "protected resource"
	})
}))

// listen on a port NEED TO CHANGE TO LISTEN TO ENVIRONMENT PRODUCTION VARIABLE
app.listen(3000)





