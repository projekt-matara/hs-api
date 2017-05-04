/*
  CONFIGURE PASSPORT AUTH STRATEGIES
*/

const passport = require('koa-passport'),
			BasicStrategy = require('passport-http').BasicStrategy,
      BearerStrategy = require('passport-http-bearer').Strategy,
			User = require('../models/User'),
      Token = require('../models/Token'),

// Passport Access Token Strategy
passport.use("accessToken", new BearerStrategy(
  function(accessToken, callback) {
    // encrypt the incoming access token
    const accessTokenHash = crypto.createHash('sha1').update(accessToken).digest('hex')
    // find the access token
    Token.findOne({value: accessToken }, function (err, token) {
      if (err) { return callback(err) }
      if (!token) { return callback(null, false); }
      // if date is expired, remove the access token from the database
      if (new Date() > token.expirationDate) {
          Token.findOneAndRemove({token: accessTokenHash}, err => {done(err)})
          done(null, false)
      } else {
          // find the user then return them
          User.findOne({username: token.userId}, (err, user) => {
            if (err) return done(err)
            if (!user) return done(null, false)
            // return user info
            done(null, user, info)
          })
      }
    })
  }
))

exports.isAuthenticated = passport.authenticate('accessToken', { session: false })