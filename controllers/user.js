/*
	User Controller
*/

const request = require('request-promise'),
			Promise = require('bluebird'),
			User = require('../models/User'),
			bcrypt = Promise.promisifyAll(require('bcrypt-nodejs')),
			jwt = Promise.promisifyAll(require('jsonwebtoken')),
			config = require('../config')
			stripeHeader = {Authorization: "Bearer " + config.stripe.apiKey},
			$ = require('../services/utility')

/*
	LOGIN
*/
exports.login = async function(ctx, next) {
	// Find user by email
	const user = await User.findOne({email: ctx.request.body.email})
	// handle error
	if (!user) {
		throw new Error("Email not found.")
	} else {
		// check password, generate JWT, then insert them in the newly sanitized User
		const passwordResult = await bcrypt.compareAsync(ctx.request.body.password, user.password)
		const theJwt = await $.generateJwt(user.id)
		const newUser = await $.insertJwtUser(user, theJwt)
		// if the password is wrong, throw an error
		if (!passwordResult) {
			throw new Error('Incorrect password, please try again.')
		} else {
			// send the user information to the Client
			ctx.body = newUser
		}
	}
}


/*
	CREATE USER
*/
exports.createUser = async function(ctx, next) {
	// create new object formatted with new user's information
	const generateUser = $.generateNewUser(ctx.request.body.email, ctx.request.body.username, ctx.request.body.password)
	// save the new User to the database
	const newUser = await User.create(generateUser)
	// generate a JWT
	const theJwt = await $.generateJwt(newUser.id)
	// insert the JWT into the user and sanitize the User info
	const newUserWithJwt = await $.insertJwtUser(newUser, theJwt)
	// if there is a problem with the new user, throw an error
	if (!newUser) {
		throw new Error("User failed to create, please try again.")
	} else {
		// send user/jwt info to Client
		ctx.body = newUserWithJwt
	}
}


/*
	EDIT USER EMAIL
*/
exports.editUserEmail = async function(ctx, next) {
	// find the user by their id then update with the new email.
	const user = await User.findByIdAndUpdate(ctx.request.body.userId, {email: ctx.request.body.newEmail})
	// if user updates properly, send the new email up to the client
	if (user) {
		ctx.body = {email: ctx.request.body.newEmail}
	} else {
		// otherwise, throw an error
		throw new Error("User failed to update. Please try again.")
	}
}


/*
	DELETE USER
*/
exports.deleteUser = async function(ctx, next) {
	// if the User has not canceled their payment yet...
	if (ctx.request.body.stripeStatus === true){
		// simultaneously delete the User's Stripe info and the User info inside the database.
		let dc = request.delete({
			url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
			headers: stripeHeader
		})
		let uu = User.findByIdAndRemove(ctx.request.body.userId)
		const [deleteCall, userUpdate] = await Promise.all([dc, uu])
		// handle any errors if necessary
		if (deleteCall && userUpdate) {
			ctx.status = 200
		} else {
			throw new Error("An Error has occurred. Please try again.")
		}
		// else if user has already deleted their Stripe account info...
	} else {
		// delete the User info from the database
		const userUpdate = await User.findByIdAndRemove(ctx.request.body.userId)
		// handle any errors if necessary
		if (userUpdate) {
			ctx.status = 200
		} else {
			throw new Error("An Error has occurred. Please try again.")
		}
	}
}


/*
	CREATE CUSTOMER
*/
exports.createCustomer = async function(ctx, next) {
	// call Stripe API to create new customer account and subscribe them
	// to the standard Halfstak plan.
	const newCustomer = await request.post({
		url: 'https://api.stripe.com/v1/customers',
		headers: stripeHeader,
		form: {source: ctx.request.body.token, plan: "a_test_plan", email: ctx.request.body.email}
	})
	// if the new customer is created successfully at Stripe headquarters...
	if (newCustomer) {
		// parse the new customer info from Stripe
		// remember that you already have a JSON parser in your
		// middleware stack
		const cus = JSON.parse(newCustomer),
					// single out the individual card info
					card = cus.sources.data[0],
					// format the card data you need into an object
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
					// update the User's info in the database to include the new Customer info
					findUserAndUpdate = await User.findByIdAndUpdate(ctx.request.body.id, customerData),
					// grab the updated User
					updatedUser = await User.findById(ctx.request.body.id),
					// sanitize the User info of any passwords
					sanitizedUser = await $.sanitizeUser(updatedUser)
		// send the sanitized User info up to the Client
		ctx.body = sanitizedUser
		// if the new Customer fails to create on the Stripe side... throw an error.
	} else {
		throw new Error("There has been an error creating your account. Please try again.")
	}
}


/*
	CANCEL SUBSCRIPTION
*/
exports.cancelSubscription = async function(ctx, next) {
	// call Stripe API to delete the User customer info
	const stripeDelete = await request.delete({
		url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
		headers: stripeHeader
	})
	// update the User info in the database
	const updatedUser = await User.findByIdAndUpdate(ctx.request.body.userId, $.blankCustomerData())
	// if either of the above fail out, throw an error
	if (!stripeDelete || !updatedUser) {
		throw new Error("There was an error in cancelling your subscription. Please try again or contact us for further assistance.")
	}
	// send a 200 status to the dashboard Client to let it know everything worked.
	ctx.status = 200
	ctx.body = 'All clear.'
}


/*
	EDIT PAY EMAIL
*/
exports.editPayEmail = async function(ctx, next) {
	// send new email to Stripe API
	const se = request.post({
		url: 'https://api.stripe.com/v1/customers/' + ctx.request.body.stripeId,
		headers: {'Authorization': "Bearer " + config.stripe.apiKey},
		form: {
			email: ctx.request.body.newEmail
		}
	})
	// check to see if someone is already using the new email
	const ue = User.findOne({stripeEmail: ctx.request.body.newEmail})
	// run the above operations simultaneously
	const [stripeEmail, userExists] = await Promise.all([se, ue])

	// if it turns out the user already exists, throw an error
	if(userExists){
		throw new Error('Someone else is already using this email, please try another one.')
	// otherwise if stripeEmail goes through okay...
	} else if (stripeEmail){
		// update the User's stripeEmail in the database.
		const userUpdated = await User.findByIdAndUpdate(ctx.request.body.userId, {stripeEmail: ctx.request.body.newEmail})
		ctx.body = {newPayEmail: ctx.request.body.newEmail}
	} else {
		throw new Error("An error has occurred. Please try again.")
	}
}


/*
	CHANGE CARD
*/
exports.changeCard = async function(ctx, next) {
	// grab token, email, cardId, userId, and stripeId from the request body
	const token = ctx.request.body.token
	const email = ctx.request.body.email
	const cardId = ctx.request.body.cardId
	const userId = ctx.request.body.id
	const stripeId = ctx.request.body.stripeId
	// set up the delete and create card urls for convenience sake
	const deleteCardUrl = 'https://api.stripe.com/v1/customers/' + stripeId + '/sources/' + cardId
	const createCardUrl = 'https://api.stripe.com/v1/customers/' + stripeId + '/sources'
	// call Stripe API to delete the old card. You find the card by using the cardId
	const rc = request.delete({
		url: deleteCardUrl,
		headers: {
			Authorization: 'Bearer ' + config.stripe.apiKey
		}
	})
	// call Stripe API again to create the new card.
	const anc = request.post({
			url: createCardUrl,
			headers: {
				Authorization: 'Bearer ' + config.stripe.apiKey
			},
			form: {
				source: token
			}
		})
	// run the operations simultaneously
	const [removeCard, newCreatedCard] = await Promise.all([rc, anc])
	// parse the new card info
	const theCard = JSON.parse(newCreatedCard)
	// format the card expiration month and year into a single string
	// this is for presentation sake in the dashboard
	const exp = theCard.exp_month + '/' + theCard.exp_year
	// format the needed card information into a single object
	const newCard = {
		stripeCountry: theCard.country,
		stripeDigits: theCard.last4,
		stripeBrand: theCard.brand,
		stripeExp: exp,
		stripeExpMonth: theCard.exp_month,
		stripeExpYear: theCard.exp_year,
		cardId: theCard.id
	}
	// update the User info in the database with the new card info. 
	// remember the User model is setup for only one card
	const updatedUser = await User.findByIdAndUpdate(userId, newCard)
	// if the removeCard, newCreatedCard, and updatedUser operations go well...
	if (removeCard && newCreatedCard && updatedUser) {
		// send the newCard info up to the Client
		ctx.body = newCard
	} else {
		throw new Error('There has been an error, please try again.')
	}
}


/*
	CHANGE PASSWORD
*/
exports.changePassword = async function(ctx, next) {
	// find the User by ID, check their password, then update the User info
	const user = await User.findById(ctx.request.body.userId),
				passwordResult = await bcrypt.compareAsync(ctx.request.body.oldPassword, user.password)

	// if user doesn't exist, throw error
	if (!user) {
		throw new Error('Error locating your user account. Please try again.')
	// if password is wrong, throw an error
	} else if (!passwordResult){
		throw new Error('The old password was incorrect. Please try again.')
	// else if they get everything right...
	} else {
		// find the User by ID then update their password.
		const updatedUser = await User.findByIdAndUpdate(ctx.request.body.userId, {password: ctx.request.body.newPassword})
		if (!updatedUser) {
			throw new Error('User failed to update, please try again.')
		} else {
			// send success message to Client
			ctx.body = {message: "Password change successful."}	
		}
	}
}


/*
	GET USER - FOR TESTING PURPOSES ONLY
*/
exports.getUser = async function(ctx, next) {
	const x = await User.findOne({email: ctx.request.body.email})
	if (x) {ctx.body = x} else {throw new Error("error")}
}





