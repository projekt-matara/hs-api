/*
  Authorization Center
  This is where you configure the Authorization roles.
*/

exports.editUserEmail = async (ctx, next) => {
  const reqBodyUser = ctx.request.body.email
  console.log(ctx)
  console.log(reqBodyUser)
  next()
}