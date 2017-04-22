const Promise = require('bluebird'),
			nodemailer = Promise.promisifyAll(require('nodemailer')),
			mailgun = Promise.promisifyAll(require('nodemailer-mailgun-transport')),
			config = require('../config'),
			auth = {
				auth: {
					api_key: config.mailgun.apiKey,
					domain: config.mailgun.domain
				}
			},
			jwt = Promise.promisifyAll(require('jsonwebtoken')),
			User = require('../models/User')

exports.emailConfig = () => {
	nodemailerMailgun = nodemailer.createTransport(mailgun(auth))
}

exports.generateJwt = async function(userId) {
 	const payload = {id: userId},
				opts = {expiresIn: '1h'}
 	return jwt.signAsync(payload, config.secret, opts)
}

exports.generateNewUser = (email, username, password) => {
	const newUser = {
		email: email,
		username: username,
		password: password,
		stripeId: '',
		cardId: '',
		stripeStatus: false,
		stripeEmail: '',
		stripeCountry: '',
		stripeDigits: '',
		stripeBrand: '',
		stripeExp: '',
		stripeExpMonth: null,
		stripeExpYear: null,
		numDevicesAllowed: 1,
		deviceIds: []
	}
	return newUser
}

exports.insertJwtUser = async function(user, token) {
	let jwtUser = await {
		idToken: token,
		id: user.id,
		email: user.email,
		username: user.username,
		stripeId: user.stripeId,
		cardId: user.cardId,
		stripeStatus: user.stripeStatus,
		stripeEmail: user.stripeEmail,
		stripeCountry: user.stripeCountry,
		stripeDigits: user.stripeDigits,
		stripeBrand: user.stripeBrand,
		stripeExp: user.stripeExp,
		stripeExpMonth: user.stripeExpMonth,
		stripeExpYear: user.stripeExpYear
	}
	return jwtUser
}

exports.sanitizeUser = async function (user) {
	const userTemplate = await {
		email: user.email,
		username: user.username,
		id: user.id,
		stripeId: user.stripeId,
		cardId: user.cardId,
		stripeStatus: user.stripeStatus,
		stripeEmail: user.stripeEmail,
		stripeCountry: user.stripeCountry,
		stripeDigits: user.stripeDigits,
		stripeBrand: user.stripeBrand,
		stripeExp: user.stripeExp,
		stripeExpMonth: user.stripeExpMonth,
		stripeExpYear: user.stripeExpYear,
		idToken: user.idToken
	}
	return userTemplate
}

exports.blankCustomerData = () => {
	return {
		stripeId: '',
		cardId: '',
		stripeStatus: false,
		stripeEmail: '',
		stripeCountry: '',
		stripeDigits: '',
		stripeBrand: '',
		stripeExp: '',
		stripeExpMonth: null,
		stripeExpYear: null
	}
}

exports.errorHandler = (e, ctx) => {
	ctx.status = 500
	ctx.body = e.message
	console.log(e)
}
