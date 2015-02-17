require(["FacebookHelper", "PopupFriendList", "DebtsCredits"], function(fbh, pfl, dc){
	
	// _.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };

	var $$ = Dom7;
	var _sgd = (window.sgd) ? window.sgd : {};
		_sgd.framework7 = new Framework7({
			pushState: false,
			swipeBackPage: false,
			router: false
		});
		var mainView = _sgd.framework7.addView('.view-main', {
			domCache: true
		});
		var route = Backbone.Router.extend({
			routes: {
				"detail/:query" : "detail",
				"home" : "home",
				"" : "home",
				"form" : "form"
			},
			detail: function(pQuery){
				mainView.router.load({ pageName: 'detail?uid='+pQuery });
			},
			home: function(){
				mainView.router.load({ pageName: 'home' });
			},
			form: function(){
				mainView.router.load({ pageName: 'form' });
			}
		});
		
		_sgd.route = new route();
		Backbone.history.start();

		_sgd.debtsCredits = new dc();

		_sgd.changeSection = function(pPath, pParam, pSkipHash){
			if(pPath == 'form-second'){
				if($('#otherUserID').val() === "" && $('#otherUserName').val() === ''){
					_sgd.framework7.alert('Please enter a name / select a wooishui user', ['Name missing']);
					return false;
				}
			} else if(pPath == 'home'){
				$('#otherUserID').val('');
				$('#otherUserName').val('');
				$('#debtForm')[0].reset();
				_sgd.debtsCredits.credits.fetch();
			}
			var path = pPath;
			if(Array.isArray(pParam)){
				$.each(pParam, function(pIndex, pVal){
					path += "/" + pVal;
				});
			}
			if(pSkipHash)
				mainView.router.load({ pageName: path });
			else
				window.location.hash = "#" + path;
		};

		_sgd.framework7.onPageAfterAnimation('*', function(page){
			if(page.name == "detail" || page.name == "form"){
				if(page.container.dataset.nav)
					$("#header").addClass(page.container.dataset.nav);
				else
					$("#header").removeClass();
			};
			if(page.name == "detail"){
				if(page.query.uid){
					_sgd.debtsCredits.loadDetailByUID(page.query.uid);
				} else {
					window.location.hash = "";
				}
			} else if(page.name == "home"){
				_sgd.debtsCredits.clearDetailDatas();
			}
		});
		_sgd.framework7.onPageBeforeAnimation('*', function(page){
			if(page.container.dataset.nav)
				$("#header").addClass(page.container.dataset.nav);
			else
				$("#header").removeClass();
			if(page.name == "form-second"){
				if($("#otherUserID").val()){
					$(".debtType .right").html("<img src=\"http://graph.facebook.com/" + $("#otherUserID").val() + "/picture\" alt=\"\" />");
				} else if($("#otherUserName").val()){
					$(".debtType .right").html('<span>' + $("#otherUserName").val() + '</span>');
				} else {
					_sgd.framework7.alert('Please enter a name / select a wooishui user', function(){
						_sgd.changeSection('form');
					});
				}
			}
		});
		$$("#homeDebts").on("refresh", function(e){
			_sgd.debtsCredits.credits.fetch({
				reset: true,
				complete: function(){
					sgd.framework7.pullToRefreshDone();
				}
			});
		});
		_sgd.popupFriendList = new pfl({
			wrapper: "#friendList",
			inviteTarget: "#nonRegFriend",
			friendTarget: "#regFriend",
			getFriendHandler: function(pCallback){
				_sgd.facebookHelper.getFriendList(pCallback);
			},
			getInvitableHandler: function(pCallback){
				_sgd.facebookHelper.getInvitableList(pCallback);
			}
		});
		_sgd.facebookHelper = new fbh(function(){
			_sgd.debtsCredits.credits.fetch();
		});
		_sgd.submitDebt = function(){
			var _q = {
				isCreatorDebt: $(".debtType .middle").hasClass('creatorDebt'),
				price: parseFloat($("#debtForm input[name=price]").val()) || 0,
				desc: $("#debtForm input[name=desc]").val(),
				otherUserID: $("#otherUserID").val(),
				otherUserName: $("#otherUserName").val()
			}
			if(_q.price != ''){
				$.ajax({
					url: '/api/debtsSubmit',
					type: 'post',
					data: _q,
					success: function (data) {
						if(data.status){
							_sgd.changeSection('home');
						}
					}
				});
			} else {
				sgd.framework7.alert('Please fill in an amount', ['Amount missing']);
			}
		};
	$$('.menu-link').on('click', function () {
    	var buttons = [
	        {
	            text: 'Sign Out',
	            onClick: function () {
	                window.location.href = "/logout";
	            }
	        }
	    ];
	    _sgd.framework7.actions(buttons);
	});   
	$(".debtType .left").on('click', function(){
		$(".debtType .middle").addClass('creatorDebt');
	});
	$(".debtType .right").on('click', function(){
		$(".debtType .middle").removeClass('creatorDebt');
	});
	$(".debtType .middle").on('click', function(){
		if($(this).hasClass('creatorDebt'))
			$(this).removeClass('creatorDebt');
		else 
			$(this).addClass('creatorDebt');
	});
	$('#menu a.internal').on('click', function(){
		_sgd.changeSection($(this).attr('href'));
		_sgd.framework7.closePanel();
		return false;
	});
	$('#friendList').on('opened', function () {
		_sgd.popupFriendList.startLoading();
	});
	$(".friendListSearch").on('input', function(){
		var curText = $(this).val();
		var target = $(this).data('target');
		if(curText != ""){
			var filtered = $(target + " .item-content").filter(function(pIndex, pEl){
				return $(pEl).find(".item-title").text().indexOf(curText) > -1;
			});
			$(target + " .item-content").hide();
			filtered.show();
		} else {
			$(target + " .item-content").show();
		}
	});
});