const request = require('request-promise'),
			Promise = require('bluebird'),
			User = require('../models/User'),
			bcrypt = Promise.promisifyAll(require('bcrypt-nodejs')),
			jwt = Promise.promisifyAll(require('jsonwebtoken')),
			config = require('../config'),
			$ = require('../services/utility'),
			Client = require('../models/Client')

exports.postClients = async function(ctx, next) {
	try{
		// set client based on POST data
		let client = {
			name: ctx.request.body.name,
			clientId: ctx.request.body.clientId,
			clientSecret: ctx.request.body.clientSecret,
			trustedClient: true
		}

		// use data to create client
		const newClient = await Client.create(client)
		if (!newClient) {
			throw new Error("Client failed to create!")
		} else {
			ctx.body = {message: 'Client added to the locker!', data: client}
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.getClients = async function(ctx, next) {
	try {
		const clients = await Client.find({})
		if (!clients) {
			throw new Error("Client not found.")
		} else {
			ctx.body = clients
		}
	} catch (e) {
		$.errorHandler(e)
	}
}