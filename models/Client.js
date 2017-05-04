// Load required packages
const mongoose = require('mongoose')

// Define our client schema
let ClientSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  trustedClient: { type: Boolean, required: true }
})

// Export the Mongoose model
module.exports = mongoose.model('Client', ClientSchema)