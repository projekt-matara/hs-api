/*
* Passport configuration happens here.
*/

const Promise = require('bluebird')
const passport = Promise.promisifyAll(require('koa-passport'))
const BasicStrategy = require('passport-http').BasicStrategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
const Client = require('../models/Client')

/*
* Authenticate a client using HTTP Basic Auth
*/
passport.use('clientBasic', new BasicStrategy((clientId, clientSecret, done) => {
	// find the client by their id
  Client.findOne({clientId: clientId}, (err, client) => {
		// handle errors
    if (err) return done(err)
    if (!client) return done(null, false)
        // make sure the client is TRUSTED
    if (!client.trustedClient) return done(null, false)
        // if the clientSecrets match, return done
    if (client.clientSecret == clientSecret) return done(null, client)
    else return done(null, false)
  })
}))

/*
* Authenticate a client using the Client/Password strategy and passing the
* login info in the request body.
*/
passport.use('clientPassword', new ClientPasswordStrategy((clientId, clientSecret, done) => {
  console.log('testing')
	// find the client by their id
  Client.findOne({clientId: clientId}, (err, client) => {
		// handle errors
    if (err) return done(err)
    if (!client) return done(null, false)
        // make sure the client is TRUSTED
    if (!client.trustedClient) return done(null, false)
        // if the clientSecrets match, return done
    if (client.clientSecret == clientSecret) return done(null, client)
    else return done(null, false)
  })
}))
