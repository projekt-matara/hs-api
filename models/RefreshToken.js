// Load required packages
const mongoose = require('mongoose')

// Define refresh token schema
const RefreshTokenSchema   = new mongoose.Schema({
  refreshToken: { type: String, required: true },
  userId: { type: String, required: true },
  clientId: { type: String, required: true }
})

// set up refresh token plugins
RefreshTokenSchema.plugin(require('mongoose-sanitizer'))

// Export the Mongoose model
module.exports = mongoose.model('RefreshToken', RefreshTokenSchema)