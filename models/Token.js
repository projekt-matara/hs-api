// Load required packages
const mongoose = require('mongoose')

// Define our token schema
const TokenSchema   = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: String, required: true },
  clientId: { type: String, required: true },
  expirationDate: {type: String, required: true},
  scope: {type: String, required: false}
})

TokenSchema.plugin(require('mongoose-sanitizer'))

// Export the Mongoose model
module.exports = mongoose.model('Token', TokenSchema)