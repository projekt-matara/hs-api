const koa = require('koa'),
			config = require('./config'),
			convert = require('koa-convert'),
			cors = require('kcors'),
			helmet = convert(require('koa-helmet'))
			error = require('koa-json-error'),
			logger = require('koa-logger'),
			koaRes = require('koa-res'),
			compress = require('koa-compress'),
			router = require('koa-simple-router'),
			bodyParser = require('koa-bodyparser'),
			mongoose = require('mongoose'),
			user = require('./controllers/user'),
			passport = require('koa-passport'),
			session = require('koa-generic-session'),
			authController = require('./controllers/auth')
			app = new koa()

// security headers
app.use(helmet())

// logging
app.use(logger())

// 

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
app.use(passport.session())

// cors
app.use(convert(cors()))

// mongoose config
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

// router
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
	_.post('/user', authController.isAuthenticated, user.getUser)
}))

app.listen(3000)





