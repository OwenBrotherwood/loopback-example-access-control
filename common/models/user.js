module.exports = function(User) {
	User.afterRemote('projects', function(ctx, affectedModelInstance, next) {
		if(ctx.result.id) {
			ctx.res.cookie('accessToken', ctx.result.id, { signed: true});
		}
		next();
	});
};
