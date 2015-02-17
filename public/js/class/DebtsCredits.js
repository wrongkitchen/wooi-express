define(function(){
	var _ctrl = Backbone.Model.extend({

		credits: null,

		creditDetail: null,

		creditDetailView: null,

		userUID: sgd.userUID,

		initialize: function(){
			var _this = this;
			var creditModel = Backbone.Model.extend();
			var credits = Backbone.Collection.extend({
				model: creditModel,
				url: '/api/debtsCredits'
			});

			_this.credits = new credits();
			_this.credits.fetch();

			var _creditsDetail = Backbone.Collection.extend({
				model: creditModel
			});
			var creditsDetail = new _creditsDetail();
			_this.creditsDetail = creditsDetail;

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
								if(dataModel.length<=0){
									var _name = (pIndexKey == 'debtorsUID') ? (obj.debtorsName) : (obj.creditorName);
									allData.add({ 
										id: obj[pIndexKey],
										name: _name,
										price: (pIndexKey == 'debtorsUID') ? obj.price : (obj.price * -1)
									});
								} else {
									var curPrice = dataModel[0].get('price');
									dataModel[0].set({ price: curPrice + ((pIndexKey == 'debtorsUID') ? obj.price : (obj.price * -1)) });
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
						$('#dataListWrap').hide()
					}
				},
				showDetail: function(e){
					var cid = $(e.currentTarget).find('.cid').val();
					sgd.changeSection('detail', [cid]);
				}
			});
			var _creditDetailView = Backbone.View.extend({
				el: '#dataListDetail',
				errEl: '#dataListDetailError',
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
											console.log(_removed);
										});
									}
								}
							});
						}
					});
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
		},

		loadDetailByUID: function(pUID){
			var _this = this;
			var modelCredits = _this.credits.where({ creditorUID : pUID });
			var modelDebts = _this.credits.where({ debtorsUID : pUID });
			_this.creditsDetail.reset();
			if(modelCredits.length || modelDebts.length){
				_this.creditsDetail.add(modelCredits.concat(modelDebts));
				$(_this.creditDetailView.wrapper).show();
				$(_this.creditDetailView.errEl).hide();
			} else {
				$(_this.creditDetailView.errEl).show();
				$(_this.creditDetailView.wrapper).hide();
			}
		},

		clearDetailDatas: function(){
			this.creditDetailView.$el.empty();
		}

	});

	return _ctrl;
});