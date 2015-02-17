define([], function(){
	return Backbone.Model.extend({

		friendsCache: null,

		initialize: function(){
			var sgd = (window.sgd) ? window.sgd : {};
			if(sgd.fbAppID){
				window.fbAsyncInit = function() {
					FB.init({
						appId      : sgd.fbAppID,
						xfbml      : true,
						version    : 'v2.2'
					});
					FB.getLoginStatus();
				};

				(function(d, s, id){
					var js, fjs = d.getElementsByTagName(s)[0];
					if (d.getElementById(id)) {return;}
					js = d.createElement(s); js.id = id;
					js.src = "//connect.facebook.net/en_US/sdk.js";
					fjs.parentNode.insertBefore(js, fjs);
				}(document, 'script', 'facebook-jssdk'));
			}
		},

		getFriendList: function(pCallback, pReload){
			if(this.friendsCache == null || pReload == true){
				FB.api('/me/friends', function(response) {
					this.friendsCache = response;
	 				pCallback(response);
				});
			} else {
				return pCallback(this.friendsCache);
			}
		},
		getInvitableList: function(pCallback){
			FB.api('/me/taggable_friends', function(response) {
 				pCallback(response);
			});
		}
	});
});