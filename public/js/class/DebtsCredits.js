define(function(){
	var _ctrl = Backbone.Model.extend({

		credits: null,

		creditDetail: null,

		rejectedDetail: null,

		creditDetailView: null,

		rejectedView: null,

		userUID: sgd.userUID,

		initialize: function(){
			var _this = this;
			var creditModel = Backbone.Model.extend();
			var _credits = Backbone.Collection.extend({
				model: creditModel,
				url: '/api/debtsCredits'
			});

			_this.credits = new _credits();
			_this.credits.fetch();

			var _creditsDetail = Backbone.Collection.extend({
				model: creditModel
			});
			var creditsDetail = new _creditsDetail();
			_this.creditsDetail = creditsDetail;
			var rejectedDetail = new _creditsDetail();
			_this.rejectedDetail = rejectedDetail;

			var _creditView = Backbone.View.extend({
				el: '#dataList',
				mainListTemplate: _.template($("#mainListTmpl").html()),
				events: {
					'click .item-content' : 'showDetail'
				},
				initialize: function(options){
					this.options = options;
					this.listenTo(this.options.credits, 'all', this.render);
				},
				render: function(){
					var _view = this;
					var _credits = _view.options.credits;
					var allData = new Backbone.Collection();
					_view.$el.empty();
					if(_credits.length){
						_credits.each(function(credit){
							var obj = credit.toJSON();
							var checkDataModel = function(pObj, pIndexKey){
								var dataModel = allData.where(pObj);
								var _price = (pIndexKey == 'debtorsUID') ? obj.price : (obj.price * -1);
								if(dataModel.length<=0){
									var _name = (pIndexKey == 'debtorsUID') ? (obj.debtorsName) : (obj.creditorName);
									allData.add({ 
										id: obj[pIndexKey],
										name: _name,
										price: (obj.reject) ? 0 : _price,
										rejected: !!(obj.reject)
									});
								} else {
									var curPrice = dataModel[0].get('price');
									dataModel[0].set({ price: curPrice + ((obj.reject) ? 0 : _price) });
									if(obj.reject) dataModel[0].set({ rejected : true });
								}
							}
							if(obj.creditorUID == _this.userUID){
								checkDataModel({ id: obj.debtorsUID }, 'debtorsUID');
							} else {
								checkDataModel({ id: obj.creditorUID }, 'creditorUID');
							}
						});
						allData.each(function(pModel){
							var obj = pModel.toJSON();
							_view.$el.append(_view.mainListTemplate(obj));
						});
						$('#dataListError').hide();
						$('#dataListWrap').show()
					} else {
						$('#dataListError').show();
						$('#dataListWrap').hide();
					}
				},
				showDetail: function(e){
					var cid = $(e.currentTarget).find('.cid').val();
					sgd.changeSection('detail', [cid]);
				}
			});
			var _creditDetailView = Backbone.View.extend({
				el: '#dataListDetail',
				wrapper: '#dataListDetailWrap',
				detailTemplate: _.template($("#detailTmpl").html()),
				initialize: function(options){
					this.options = options;
					this.listenTo(this.options.credits, 'all', this.render);
				},
				events: {
					'click .removeBtn' : 'settleItem',
					'click .rejectBtn' : 'rejectItem'
				},
				render: function(){
					var _view = this;
					_view.$el.empty();
					if(_view.options.credits.length){
						$(_view.wrapper).show();
						_view.options.credits.each(function(credit){
							var obj = credit.toJSON();
							if(obj.creditorUID == _this.userUID){
								obj.creatorName = (obj.creatorUID == _this.userUID) ? obj.creditorName : obj.debtorsName;
							} else {
								obj.price *= -1;
								obj.creatorName = (obj.creatorUID == _this.userUID) ? obj.debtorsName : obj.creditorName;
							}
							obj.settlable = (obj.creatorUID == _this.userUID) ? true : false;
							_view.$el.append(_view.detailTemplate(obj));
						});
					} else {
						$(_view.wrapper).hide();
					}
				},
				settleItem: function(e){
					var itemID = $(e.currentTarget).data('itemid');
					var _view  = this;
					var _credits = _view.options.credits;
					$.ajax({
						url: '/api/debtsRemove',
						type: 'post',
						data: { itemid: itemID },
						success: function (data) {
							if(data.status){
								_credits.remove(_credits.where({ _id:itemID }));
								if(_credits.length <= 0)
									sgd.changeSection('home');
							}
						}
					});
				},
				rejectItem: function(e){
					var _view = this;
					var itemID = $(e.currentTarget).data('itemid');
					sgd.framework7.prompt('Why do u reject this debt?', 'Reject debt', function (value) {
						if(value != ""){
							$.ajax({
								url: '/api/debtsReject',
								type: 'post',
								data: { itemid: itemID, reason: value },
								success: function (data) {
									if(data.status){
										sgd.framework7.swipeoutDelete("#item_" + itemID, function(a,b,c){
											var _item = _view.options.credits.where({ _id : itemID });
											var _removed = _view.options.credits.remove(_item);
											_removed[0].set({ reject:value });
											rejectedDetail.add(_removed[0]);
										});
									}
								}
							});
						}
					});
				}
			});
			var _rejectedView = Backbone.View.extend({
				el: '#rejectListDetail',
				wrapper: '#rejectListDetailWrap',
				detailTemplate: _.template($("#rejectedTmpl").html()),
				initialize: function(options){
					this.options = options;
					this.listenTo(this.options.credits, 'all', this.render);
				},
				events: {
					'click .rebornBtn' : 'rebornItem',
					'click .acceptBtn' : 'acceptItem'
				},
				rebornItem: function(e){
					var itemID = $(e.currentTarget).data('itemid');
					var _view  = this;
					var _credits = _view.options.credits;
					var _reborn = _credits.where({ _id:itemID });
					var _r = _reborn[0].toJSON();
					var isCreatorDebt = (_r.creatorUID === _r.debtorsUID);
					if(isCreatorDebt)
						$(".debtType .middle").addClass('creatorDebt');
					else
						$(".debtType .middle").removeClass('creatorDebt');
					$("#debtForm input[name=price]").val(_r.price);
					$("#debtForm input[name=desc]").val(_r.desc);
					$("#otherUserID").val((isCreatorDebt) ? _r.creditorUID : _r.debtorsUID);
					$("#otherUserName").val((isCreatorDebt) ? _r.creditorName : _r.debtorsName);
					$("#debtForm input[name=itemid]").val(itemID);
					$("#debtForm input[name=callback]").val((isCreatorDebt) ? _r.creditorUID : _r.debtorsUID);
					sgd.changeSection('form-second', [], true);
				},
				acceptItem: function(e){
					var itemID = $(e.currentTarget).data('itemid');
					var _view  = this;
					var _credits = _view.options.credits;
					$.ajax({
						url: '/api/debtsAccept',
						type: 'post',
						data: { itemid: itemID },
						success: function (data) {
							if(data.status){
								var _remove = _credits.remove(_credits.where({ _id:itemID }));
									_remove[0].set({ reject : "" });
								creditsDetail.add(_remove[0]);
							}
						}
					});
				},
				render: function(){
					var _view = this;
					_view.$el.empty();
					if(_view.options.credits.length){
						_view.options.credits.each(function(credit){
							$(_view.wrapper).show();
							var obj = credit.toJSON();
							if(obj.creditorUID == _this.userUID){
								obj.creatorName = (obj.creatorUID == _this.userUID) ? obj.creditorName : obj.debtorsName;
							} else {
								obj.price *= -1;
								obj.creatorName = (obj.creatorUID == _this.userUID) ? obj.debtorsName : obj.creditorName;
							}
							obj.creator = (obj.creatorUID == _this.userUID) ? true : false;
							_view.$el.append(_view.detailTemplate(obj));
						});
					} else {
						$(_view.wrapper).hide();
					}
				}
			});




			var creditView = new _creditView({
				credits: _this.credits
			});
			creditView.comparator = 'createdAt';

			var creditDetailView = new _creditDetailView({
				credits: creditsDetail
			});
			creditDetailView.comparator = 'createdAt';
			_this.creditDetailView = creditDetailView;

			var rejectedView = new _rejectedView({
				credits: rejectedDetail
			});
			rejectedView.comparator = 'createdAt';
			_this.rejectedView = rejectedView;
		},

		loadDetailByUID: function(pUID){
			var _this = this;
			var modelCredits = _this.credits.where({ creditorUID : pUID });
			var modelDebts = _this.credits.where({ debtorsUID : pUID });
			var allModel = modelCredits.concat(modelDebts);
			
			_this.creditsDetail.reset();
			_this.rejectedDetail.reset();

			if(allModel.length <= 0){
				$(_this.creditDetailView.wrapper).hide();
				$(_this.rejectedView.wrapper).hide();
				$('#dataListDetailError').show();
			} else {
				var rejected = [];
				var normal = [];
				$.each(allModel, function(pIndex, pVal){
					if(pVal.get('reject'))
						rejected.push(pVal)
					else 
						normal.push(pVal);
				});
				if(normal.length){
					_this.creditsDetail.add(normal);
					$(_this.creditDetailView.wrapper).show();
				} else {
					$(_this.creditDetailView.wrapper).hide();
				}
				if(rejected.length){
					_this.rejectedDetail.add(rejected);
					$(_this.rejectedView.wrapper).show();
				} else {
					$(_this.rejectedView.wrapper).hide();
				}
			}
		},

		clearDetailDatas: function(){
			this.creditDetailView.$el.empty();
			this.rejectedView.$el.empty();
		}

	});

	return _ctrl;
});