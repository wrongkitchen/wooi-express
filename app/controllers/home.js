var express = require('express'),
	router = express.Router();


module.exports = function (app) {
	app.use('/', router);
};

router.all('/redirect', function (req, res, next) {
	res.render('redirect');
});
router.get('/', function (req, res, next) {
	if(req.user)
		res.render('main');
	else 
		res.render('index');
});