var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	env = process.env.NODE_ENV || 'development';


var config = {
	development: {
		root: rootPath,
		redirectURL: process.env.REDIRECT_URL || 'http://www.wooishui.com',
		app: {
			name: 'wooishui-express'
		},
		port: 5000,
		db: 'mongodb://localhost/wooishui-express-development',
		FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '1504759193104269',
		FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '4713e199a1b83206ee3338bff6d73bf9'
	},

	test: {
		root: rootPath,
		redirectURL: process.env.REDIRECT_URL || 'http://www.wooishui.com',
		app: {
			name: 'wooishui-express'
		},
		port: 5000,
		db: 'mongodb://localhost/wooishui-express-test',
		FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '1504759193104269',
		FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '4713e199a1b83206ee3338bff6d73bf9'
	},

	production: {
		root: rootPath,
		redirectURL: process.env.REDIRECT_URL || 'http://www.wooishui.com',
		app: {
			name: 'wooishui'
		},
		port: process.env.PORT,
		db: process.env.MONGOLAB_URI,
		FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
		FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET
	}
};

module.exports = config[env];
