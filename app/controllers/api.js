var express = require('express'),
	router = express.Router(),
	mongoose = require('mongoose'),
	uuid = require('node-uuid');
var Debt = mongoose.model('Debt');
var User = mongoose.model('User');

module.exports = function (app) {
	app.use('/api', router);
};


router.post('/debtsRemove', function (req, res, next) {
	var itemID = req.body.itemid;
	var curUser = req.user;
	if(curUser){
		if(itemID){
			Debt.where('_id', itemID)
			.where('hidden', false)
			.where('creatorUID', curUser.uid)
			.findOne()
			.exec(function(err, data){
				if(err){
					res.status(500).json({ error: err });
				} else {
					if(data){
						data.hidden = true;
						data.save();
						res.json({ status: true });
					} else {
						res.json({ status: false, error: 'no such data' });
					}
				}
			});
		} else {
			res.status(500).json({ error: 'api error' });
		}
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});

router.post('/debtsSubmit', function (req, res, next) {
	var _q = req.body;
	var isCreatorDebt  = (_q.isCreatorDebt == 'true'),
		price = parseFloat(_q.price) || 0,
		desc = _q.desc,
		otherUserID = _q.otherUserID,
		otherUserName = _q.otherUserName;
	var curUser = req.user;

	var insertData = function(){
		if(price > 0){
			var newDebt = new Debt({
				creatorUID: curUser.uid,
				creditorUID: (isCreatorDebt) ? otherUserID : curUser.uid,
				creditorName: (isCreatorDebt) ? otherUserName : curUser.name,
				debtorsUID: (isCreatorDebt) ? curUser.uid : otherUserID,
				debtorsName: (isCreatorDebt) ? curUser.name : otherUserName,
				price: price,
				desc: desc
			});
			newDebt.save(function(err) {
				if(err){
					res.json({ status:false, error: err });
				} else {
					res.json({ status: true, message: "success" });
				}
			});
		} else {
			res.json({ status:true });
		}
	};

	if(curUser){
		if(otherUserID){
			User
			.where({ 'uid' : otherUserID })
			.findOne()
			.exec(function(err, user){
				if(err){
					res.status(500).json({ status:false, error: err });
				} else {
					if(user){
						otherUserName = user.name;
						insertData();
					} else {
						res.json({ status: true });
					}
				}
			});
		} else {
			otherUserID = uuid.v1();
			insertData();
		}
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});


router.get('/debtsCredits', function (req, res, next) {
	if(req.user){
		var uid = req.user.uid;
		Debt.find().where({ hidden : false })
		.or([{ creditorUID : uid }, { debtorsUID : uid }])
		.exec(function(err, data){
			if(err)
				res.status(500).json({ error: err });
			else
				res.json(data);
		});
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});