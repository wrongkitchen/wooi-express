define([], function(){
	return Backbone.Model.extend({

		invitableFds: null,
		invitableView: null,

		regFds: null,
		regView: null,

		initialize: function(){
			var _this = this;

			var _regView = Backbone.View.extend({
				el: _this.get('friendTarget'),
				tmpl: _.template($("#regFriendList").html()),
				events: {
					'click .item-content' : 'recordUserID'
				},
				recordUserID: function(e){
					var userID = $(e.currentTarget).data('userid');
					if(userID)
						$("#otherUserID").val(userID);
					sgd.framework7.closeModal();
					sgd.changeSection('form-second', [], true);
				},
				initialize: function(options){
					var _view = this;
					_view.options = options;
					_view.listenTo(_view.options.collection, 'all', _view.render);
				},
				render: function(){
					var _view = this;
					_view.$el.empty();
					_view.options.collection.each(function(pColl){
						var obj = pColl.toJSON();
						_view.$el.append(_view.tmpl(obj));
					});
					$(_this.get("wrapper")).removeClass("preloading");
				}
			});
			_this.regFds = new Backbone.Collection();
			_this.regView = new _regView({ collection: _this.regFds });
		},

		startLoading: function(){
			var _this = this;
			
			$(_this.get("wrapper")).addClass("preloading");

			_this.get("getFriendHandler")(function(pRes){
				_this.regFds.reset();
				if(pRes.data.length){
					_this.regFds.add(pRes.data);
					_this.regView.$el.show();
				} else {
					_this.regView.$el.hide();
				}
			});
			
			// if(!_this.invitableFds){
			// 	_this.get("getInvitableHandler")(function(pRes){
			// 		if(pRes.data.length){
			// 			_this.invitableFds = new Backbone.Collection(pRes.data);
			// 			_this.fetchData($(_this.get("inviteTarget")), _this.invitableFds);
			// 			$(_this.get("inviteTarget")).show();
			// 		}
			// 		$(_this.get("wrapper")).removeClass("preloading");
			// 	});
			// }
		},

		fetchData: function(pTarget, pColl){
			var _this = this;
			var tmpl = _.template($(_this.get("templateID")).html());
			pTarget.show();
			_.each(pColl.toJSON(), function(pObj){
				pTarget.find("ul").append(tmpl(pObj));
			});
		}
	});
});