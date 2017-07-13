/*
* OAuth2orize token exchanges are defined here.
* In this case, you are using the Password Exchange Flow
* and the Refresh Token Exchange Flow
*/

// load modules
const Promise = require('bluebird')
const oauth2orize = require('oauth2orize-koa')
const Client = Promise.promisifyAll(require('../models/Client'))
const Token = Promise.promisifyAll(require('../models/Token'))
const RefreshToken = Promise.promisifyAll(require('../models/RefreshToken'))
const User = Promise.promisifyAll(require('../models/User'))
const jwt = Promise.promisifyAll(require('jsonwebtoken'))
const crypto = require('crypto')
const fs = require('fs')
const passport = require('koa-passport')
const bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))
const utility = require('../services/utility')
const config = require('../config')

/*
*   Config OAuth2orize
*/
// create OAuth 2.0 server
const server = oauth2orize.createServer()

// Password exchange flow
server.exchange(oauth2orize.exchange.password(async (client, username, password, scope) => {
  // generate refresh token
  const refreshToken = await utility.uid(256)
  // encrypt the refresh token
  const refreshTokenHash = await crypto.createHash('sha1').update(refreshToken).digest('hex')
  if (!refreshTokenHash) {return false}
  // Find user by email
  const user = await User.findOneAsync({email: username})
  if (!user) {return false}
  // password check
  const passwordCompareResult = await bcrypt.compareAsync(password, user.password)
  if (!passwordCompareResult) {return false}
  // format the jwt data
  const payload = {
    name: user.username,
    userId: user.id,
    sub: user.email,
    aud: 'www.halfstak.com',
    issuer: 'www.halfstak.com',
    role: user.role,
    clientId: client.clientId
  }
  // create jwt
  const token = await jwt.signAsync(payload, config.secret, {expiresIn: '1h'})
  if (!token) {return false} 
  // if Halfstak Native, create, save, and return a refreshtoken, otherwise, just return the jwt
  if (client.name === 'Halfstak Native') {
    const refreshTokenData = {
      refreshToken: refreshTokenHash,
      clientId: client.clientId,
      userId: user.id
    } 
    const newRefreshToken = await RefreshToken.createAsync(refreshTokenData)
    if (!newRefreshToken) {return false}
    return {jwt: token, refresh: refreshToken}
  } else {
    return token
  }
}))

// Refresh Token exchange flow
server.exchange(oauth2orize.exchange.refreshToken(async (client, refreshToken, scope) => {
    // encrypt the refresh token
  const refreshTokenHash = await crypto.createHash('sha1').update(refreshToken).digest('hex')
  if (!refreshTokenHash) {return false}
  // Locate refresh token in the database
  const token = await RefreshToken.findOneAsync({refreshToken: refreshTokenHash})
  if (!token) {return false}
  if (client.clientId !== token.clientId) {return false}
  // locate user via the userId in the refresh token
  const user = await User.findOneAsync({id: refreshToken.userId})
  if (!user) {return false}
  // format jwt data
  const payload = {
    name: user.username,
    userId: user.id,
    sub: user.email,
    aud: 'www.halfstak.com',
    issuer: 'www.halfstak.com',
    role: user.role,
    clientId: client.clientId
  }
  // create jwt
  const theJwt = await jwt.signAsync(payload, config.secret, {expiresIn: '1h'})
  if (!theJwt) {return false}
  // send the jwt and old refresh token to the user
  return {jwt: theJwt, refresh: refreshToken}
}))

// token endpoint
exports.token = [
  passport.authenticate(['clientBasic', 'clientPassword'], { session: false }),
  server.token(),
  server.errorHandler()
]

exports.server = server
