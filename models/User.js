const Promise = require('bluebird')
const	validate = require('mongoose-validator')
const bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))
const mongoose = require('mongoose')
/*
	Validation setup
*/
const usernameValidator = [
	validate({
		validator: 'isLength',
		arguments: [1, 50],
		message: 'Username must be between 6 and 50 characters long.'
	})
]

const passwordValidator = [
	validate({
		validator: 'isLength',
		arguments: [8, 50],
		message: 'Password must be between 8 and 50 characters long.'
	})
]

const emailValidator = [
	validate({
		validator: 'isEmail',
		message: 'Email address that was provided was not valid. Please try again.'
	})
]

/*
	Schema config
*/
UserSchema =  mongoose.Schema({
	username: {type: String, required: true, unique: true},
	email: {type: String, required: true, unique: true},
	stripeId: String,
	cardId: String,
	stripeStatus: Boolean,
	stripeEmail: String,
	stripeCountry: String,
	stripeDigits: Number,
	stripeBrand: String,
	stripeExp: String,
	stripeExpMonth: Number,
	stripeExpYear: Number,
	role: {type: String, required: true},
	password: {type: String, required: true, bcrypt: true},
	numDevicesAllowed: Number,
	deviceIds: [String]
})

UserSchema.plugin(require('mongoose-bcrypt'))
UserSchema.plugin(require('mongoose-sanitizer'))
UserSchema.plugin(require('mongoose-unique-validator'))

/*
	Model set up and export
*/
module.exports = mongoose.model("User", UserSchema);