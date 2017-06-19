const jose = require('node-jose'),
			config = require('../config')

/*
*   Configure JWK
*/
// create empty key store
let keystore = jose.JWK.createKeyStore()
// create properties for JWK
const keyProp = {
  kid: config.secret,
  alg: 'A256GCM',
  use: 'enc'
}
// generate key
keystore
.generate('oct', 256, keyProp)
.catch(err => {
    console.log(err)
})

exports.decryptJWE = async (ctx, next) => {
	await jose.
				JWE
				.createDecrypt(keystore)
				.decrypt(ctx.headers.authorization)
				.then(result => {
					console.log(result)
					next()
				})
				.catch(err => {
					console.log(err)
					ctx.body = err
				})
}