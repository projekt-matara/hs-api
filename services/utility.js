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
		role: 'user',
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

/**
 * Return a random int, used by `utils.uid()`
 * Meant for internal use within this library only.
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Return a random int, used by `utils.uid()`
 * Meant for external use for the rest of the app services
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

exports.getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/*
*	Return a JWT with necessary ID information
*
* @param {String} userId
* @return {String}
*/
exports.generateJwt = (payloadInfo) => {
 	const payload = payloadInfo,
   opts = {expiresIn: '1h'}
 	return jwt.signAsync(payload, config.secret, opts)
}

/**
 * Return a unique identifier with the given `len`.
 *
 * utils.uid(10);
 * // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
exports.uid = (len) => {
  const buf = [],
        	chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        	charlen = chars.length

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)])
  }

  return buf.join('')
}