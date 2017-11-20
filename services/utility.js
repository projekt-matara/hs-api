const Promise = require('bluebird')
const nodemailer = Promise.promisifyAll(require('nodemailer'))
const mailgun = Promise.promisifyAll(require('nodemailer-mailgun-transport'))
const config = require('../config')
const auth = {
        auth: {
          api_key: config.mailgun.apiKey,
          domain: config.mailgun.domain
        }
      }
const jwt = Promise.promisifyAll(require('jsonwebtoken')
const User = require('../models/User')

exports.emailConfig = () => nodemailerMailgun = nodemailer.createTransport(mailgun(auth))


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

exports.insertJwtUser = (user, token) => {
  let jwtUser = {
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

exports.sanitizeUser = user => {
  const userTemplate = {
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
    stripeExpYear: user.stripeExpYear
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

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

exports.getRandomInt = getRandomInt

exports.generateJwt = (payloadInfo) => {
  const payload = payloadInfo,
        opts = {expiresIn: '1h'}
  return jwt.signAsync(payload, config.secret, opts)
}

exports.uid = (len) => {
  const buf = []
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charlen = chars.length

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)])
  }

  return buf.join('')
}