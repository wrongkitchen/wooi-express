var express = require('express'),
	router = express.Router(),
	mongoose = require('mongoose'),
	uuid = require('node-uuid');
var Debt = mongoose.model('Debt');
var User = mongoose.model('User');

module.exports = function (app) {
	app.use('/api', router);
};


router.post('/connectUser', function (req, res, next) {
	var _q = req.body;
	var curUser = req.user;
	if(curUser){
		if(_q.from && _q.to){
			User.findOne({ uid:_q.to }).exec(function(err, data){
				if(err){
					res.json({ status: false, error: err });
				} else if(data){
					var userData = data;
					Debt.update({ creditorUID: _q.from, debtorsUID : curUser.uid }, 
								{ creditorUID: _q.to, creditorName: userData.name }, 
								{ multi: true }, 
					function(err, data){
						if(err){
							res.status(500).json({ error: err });
						} else {
							Debt.update({ debtorsUID: _q.from, creditorUID : curUser.uid }, 
								{ debtorsUID: _q.to, debtorsName: userData.name }, 
								{ multi: true },
							function(err, data){
								if(err)
									res.status(500).json({ error: err });
								else
									res.json({ status: true, message: "success" });
							});
						}
					});
				} else if(!data) {
					res.json({ status: false, error: "No such user" });
				}
			});
		}
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});
router.post('/debtsAccept', function (req, res, next) {
	var itemID = req.body.itemid;
	var curUser = req.user;
	if(curUser){
		if(itemID){
			Debt.where('_id', itemID)
			.or([{ creditorUID : curUser.uid }, { debtorsUID : curUser.uid }])
			.findOne(function(err, data){
				if(err){
					res.status(500).json({ error: err });
				} else if(data){
					data.reject = "";
					data.save(function(err, data){
						if(err)
							res.status(500).json({ error: err });
						else
							res.json({ status: true, message: "success" });
					});
				} else {
					res.status(500).json({ error: 'no such data' });
				}
			})
		}
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});
router.post('/debtsReject', function (req, res, next) {
	var itemID = req.body.itemid;
	var reason = req.body.reason;
	var curUser = req.user;
	if(curUser){
		if(itemID){
			Debt.where('_id', itemID)
			.or([{ creditorUID : curUser.uid }, { debtorsUID : curUser.uid }])
			.findOne(function(err, data){
				if(err){
					res.status(500).json({ error: err });
				} else if(data){
					data.reject = reason;
					data.save(function(err, data){
						if(err)
							res.status(500).json({ error: err });
						else
							res.json({ status: true, message: "success" });
					});
				} else {
					res.status(500).json({ error: 'no such data' });
				}
			})
		}
	} else {
		res.status(500).json({ error: 'Please login to our system' });
	}
});
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
		otherUserName = _q.otherUserName
		itemid = _q.itemid;

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
		if(itemid){
			Debt.where('_id', itemid)
				.or([{ creditorUID : curUser.uid }, { debtorsUID : curUser.uid }])
				.findOne()
			.exec(function(err, data){
				if(err){
					res.status(500).json({ error: err });
				} else {
					if(data){
						data.creditorUID = (isCreatorDebt) ? otherUserID : curUser.uid;
						data.creditorName = (isCreatorDebt) ? otherUserName : curUser.name;
						data.debtorsUID = (isCreatorDebt) ? curUser.uid : otherUserID;
						data.debtorsName = (isCreatorDebt) ? curUser.name : otherUserName;
						data.price = price;
						data.desc = desc;
						data.reject = "";
						data.save(function(err, data){
							if(err)
								res.status(500).json({ status: false, error:err });
							else
								res.json({ status: true });
						});
					} else {
						res.json({ status: false, error: 'no such data' });
					}
				}
			});
		} else if(otherUserID){
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
						insertData();
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