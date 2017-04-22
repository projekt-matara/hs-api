/*
	API Code meant specifically for account dashboard functionality.
*/

const request = require('request-promise'),
			Promise = require('bluebird'),
			User = require('../models/User'),
			bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))
			jwt = Promise.promisifyAll(require('jsonwebtoken')),
			config = require('../config')
			stripeHeader = {Authorization: "Bearer " + config.stripe.apiKey},
			$ = require('./utility')

// dashboard login
exports.login = async function(ctx, next) {
	try{
		const user = await User.findOne({email: ctx.request.body.email})		
		if (!user) {
			throw new Error("Email not found.")
		} else {
			const passwordResult = await bcrypt.compareAsync(ctx.request.body.password, user.password)
			const theJwt = await $.generateJwt(user.id)
			const newUser = await $.insertJwtUser(user, theJwt)
			if (!passwordResult) {
				throw new Error('Incorrect password, please try again.')
			} else {
				ctx.body = newUser
			}
		}
	} catch(e) {
		$.errorHandler(e, ctx)
	}
}

exports.createUser = async function(ctx, next) {
	try{
		const generateUser = $.generateNewUser(ctx.request.body.email, ctx.request.body.username, ctx.request.body.password)
		const newUser = await User.create(generateUser)
		const theJwt = await $.generateJwt(newUser.id)
		const newUserWithJwt = await $.insertJwtUser(newUser, theJwt)

		if (!newUser) {
			throw new Error("User failed to create, please try again.")
		} else {
			ctx.body = newUserWithJwt
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.editUserEmail = async function(ctx, next) {
	try{
		const user = await User.findByIdAndUpdate(ctx.request.body.userId, {email: ctx.request.body.newEmail})
		if (user) {
			ctx.body = {email: ctx.request.body.newEmail}
		} else {
			throw new Error("User failed to update. Please try again.")
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.deleteUser = async function(ctx, next) {
	try{
		if (ctx.request.body.stripeStatus === true){
			let dc = request.delete({
				url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
				headers: stripeHeader
			})
			let uu = User.findByIdAndRemove(ctx.request.body.userId)
			const [deleteCall, userUpdate] = await Promise.all([dc, uu])
			if (deleteCall && userUpdate) {ctx.status = 200} else {throw new Error("An Error has occurred. Please try again.")}
		} else {
			const userUpdate = await User.findByIdAndRemove(ctx.request.body.userId)
			if (userUpdate) {ctx.status = 200} else {throw new Error("An Error has occurred. Please try again.")}
		}

	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.createCustomer = async function(ctx, next) {
	try{
		const newCustomer = await request.post({
			url: 'https://api.stripe.com/v1/customers',
			headers: stripeHeader,
			form: {source: ctx.request.body.token, plan: "a_test_plan", email: ctx.request.body.email}
		})

		if (newCustomer) {
			const cus = JSON.parse(newCustomer),
						card = cus.sources.data[0],
						customerData = {
							stripeId: cus.id,
							cardId: card.id,
							stripeStatus: true,
							stripeEmail: cus.email,
							stripeCountry: card.country,
							stripeDigits: card.last4,
							stripeBrand: card.brand,
							stripeExp: card.exp_month + "/" + card.exp_year,
							stripeExpMonth: card.exp_month,
							stripeExpYear: card.exp_year
						},
						findUserAndUpdate = await User.findByIdAndUpdate(ctx.request.body.id, customerData),
						updatedUser = await User.findById(ctx.request.body.id),
						sanitizedUser = await $.sanitizeUser(updatedUser)
			ctx.body = sanitizedUser
		} else {
			throw new Error("There has been an error creating your account. Please try again.")
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.cancelSubscription = async function(ctx, next) {
	try{
		const stripeDelete = await request.delete({
			url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
			headers: stripeHeader
		})
		const updatedUser = await User.findByIdAndUpdate(ctx.request.body.userId, $.blankCustomerData())
		if (!stripeDelete || !updatedUser) {
			throw new Error("There was an error in cancelling your subscription. Please try again or contact us for further assistance.")
		}
		ctx.status = 200
		ctx.body = 'All clear.'
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.editPayEmail = async function(ctx, next) {
	try {
		const se = request.post({
			url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
			headers: {'Authorization': "Bearer " + config.stripe.apiKey},
			form: {
				email: ctx.request.body.newEmail
			}
		})
		const ue = User.findOne({stripeEmail: ctx.request.body.newEmail})
		const [stripeEmail, userExists] = await Promise.all([se, ue])

		if(userExists){
			throw new Error('Someone else is already using this email, please try another one.')
		} else if (stripeEmail){
			const userUpdated = await User.findByIdAndUpdate(ctx.request.body.userId, {stripeEmail: ctx.request.body.newEmail})
			ctx.body = {newPayEmail: ctx.request.body.newEmail}
		} else {
			throw new Error("An error has occurred. Please try again.")
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.changeCard = async function(ctx, next) {
	try {
		const token = ctx.request.body.token
		const email = ctx.request.body.email
		const cardId = ctx.request.body.cardId
		const userId = ctx.request.body.id
		const stripeId = ctx.request.body.stripeId
		const deleteCardUrl = 'https://api.stripe.com/v1/customers/' + stripeId + '/sources/' + cardId
		const createCardUrl = 'https://api.stripe.com/v1/customers/' + stripeId + '/sources'
		const rc = request.delete({
			url: deleteCardUrl,
			headers: {
				Authorization: 'Bearer ' + config.stripe.apiKey
			}
		})
		const anc = request.post({
				url: createCardUrl,
				headers: {
					Authorization: 'Bearer ' + config.stripe.apiKey
				},
				form: {
					source: token
				}
			})
		const [removeCard, newCreatedCard] = await Promise.all([rc, anc])
		
		const theCard = JSON.parse(newCreatedCard)
		const exp = theCard.exp_month + '/' + theCard.exp_year
		const newCard = {
			stripeCountry: theCard.country,
			stripeDigits: theCard.last4,
			stripeBrand: theCard.brand,
			stripeExp: exp,
			stripeExpMonth: theCard.exp_month,
			stripeExpYear: theCard.exp_year,
			cardId: theCard.id
		}
		const updatedUser = await User.findByIdAndUpdate(userId, newCard)
		if (removeCard && newCreatedCard && updatedUser) {
			ctx.body = newCard
		} else {
			throw new Error('There has been an error, please try again.')
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}

exports.changePassword = async function(ctx, next) {
	try{
		const user = await User.findById(ctx.request.body.userId),
					passwordResult = await bcrypt.compareAsync(ctx.request.body.oldPassword, user.password),
		      updatedUser = await User.findByIdAndUpdate(ctx.request.body.userId, {password: ctx.request.body.newPassword})

		if (!user || !updatedUser) {
			throw new Error('Error locating your user account. Please try again.')
		} else if (!passwordResult){
			throw new Error('The old password was incorrect. Please try again.')
		} else {
			ctx.body = {message: "Password change successful."}
		}
	} catch (e) {
		$.errorHandler(e, ctx)
	}
}






