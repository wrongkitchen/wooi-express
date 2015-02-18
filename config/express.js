var express = require('express');
var glob = require('glob');

var favicon = require('serve-favicon');
var session = require('express-session');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

module.exports = function(app, config) {
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');

	// app.use(favicon(config.root + '/public/img/favicon.ico'));
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(cookieParser());
	app.use(compress());
	app.use(session({ 
		store: new MongoStore({ mongooseConnection: mongoose.connection }),
		secret: 'p)wt{vshTcd`ft"+hw:}-&IC`Ou0~ap,|PJ/!qLm3"tiB1E{V#BF6T[Z0bvb;QE4',
		cookie: { maxAge: 2628000000 },
		saveUninitialized: false,
		resave: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.static(config.root + '/public'));
	app.use(methodOverride());
	app.use(function (req, res, next) {
		res.locals = {
			fbAppID: config.FACEBOOK_APP_ID,
			user: req.user || {},
			rootURL: process.env.appDoman || 'http://wooishui.herokuapp.com'
		};
		next();
	});
	passport.use(new FacebookStrategy({
			clientID: config.FACEBOOK_APP_ID,
			clientSecret: config.FACEBOOK_APP_SECRET,
			callbackURL: "/auth/facebook/callback"
		}, function(accessToken, refreshToken, profile, done) {
			User.find({ uid : profile.id }, function(err, data){
				if(err) done(err);
				if(data.length){
					done(null, data[0]);
				} else {
					var freshman = new User({
						uid: profile.id,
						facebook: profile._raw,
						accessToken: accessToken,
						refreshToken: refreshToken
					});
					freshman.save(function(err){
						done(null, freshman);
					});
				}
			});
		}
	));
	passport.serializeUser(function (pUser, pCallback) {
		pCallback(null, { id: pUser.uid, name: pUser.name });
	});
	passport.deserializeUser(function (pUser, pCallback) {  
		User.findOne({ uid : pUser.id }, function(err, data){
			pCallback(err, data);
		});
	});

	var controllers = glob.sync(config.root + '/app/controllers/*.js');
	controllers.forEach(function (controller) {
		require(controller)(app);
	});

	app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'user_friends'] }));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
		successRedirect: '/',
		failureRedirect: '/login' 
	}));
	app.all('/logout', function(req, res){ req.logout(); res.redirect('/'); });

	app.use(function (req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	if(app.get('env') === 'development'){
		app.use(function (err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err,
				title: 'error'
			});
		});
	}

	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {},
			title: 'error'
		});
	});

};
