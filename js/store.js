/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

tiltApp.factory('store', function($http, $rootScope, localize){

	var _items = {};

	var store = {

		isIdle: false,

		init: function() {
			store.updateItems();

			if (!(window.plugins && window.plugins.inAppPurchaseManager))
				return;

			window.plugins.inAppPurchaseManager.onPurchased = function(transactionIdentifier, productId, transactionReceipt) {
				//console.log("InAppPurchase: Purchased", productId);
				store.checkTransactionReceipt(transactionReceipt, function(){
					store.isIdle = false;
					store.set(productId, true);

					if (window.plugins && window.plugins.testFlight) {
						window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Bought full game');
					}
				});
			}

			window.plugins.inAppPurchaseManager.onRestored = function(originalTransactionIdentifier, productId, originalTransactionReceipt) {
				//console.log("InAppPurchase: Restored", productId);
				store.checkTransactionReceipt(originalTransactionReceipt, function(){
					store.isIdle = false;
					store.set(productId, true);

					if (window.plugins && window.plugins.testFlight) {
						window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Restored purchase');
					}
				});
			}

			window.plugins.inAppPurchaseManager.onFailed = function(errorCode, errorText){
				$rootScope.safeApply(function(){
					store.isIdle = false;
					console.log("InAppPurchase: Error", errorText);
					navigator.notification.alert(errorText, function(){}, localize.translate("Error"), localize.translate("Ok"));
				});
			};

			window.plugins.inAppPurchaseManager.onRestoreCompletedTransactionsFailed = function(){
				$rootScope.safeApply(function(){
					store.isIdle = false;
					console.log("InAppPurchase: Restore failed.");
				});
			};
		},

		updateItems: function(){
			_items = {};
			var itemString = localStorage['store'];
			if (itemString)
				_items = JSON.parse(itemString);
		},

		has: function(item){
			return _items[item] === true;
		},

		set: function(item, value){
			if (value)
				_items[item] = true;
			else
				delete _items.item;

			localStorage.setItem('store', JSON.stringify(_items));

			if (value && item === 'level_pack_1') {
				if (window.plugins && window.plugins.iAdPlugin)
					window.plugins.iAdPlugin.showAd(false);

				// unlock next level if player has completed all free levels:
				var currentLevelIndex = tilt.levels.getIndex(tilt.progress.currentLevel),
					progress = tilt.progress.getLevelProgress(tilt.progress.currentLevel);
				if (currentLevelIndex == 15 && progress && progress.stars > 0) {
					var nextLevelId = tilt.levels.get(16).id;
					tilt.progress.unlockLevel(nextLevelId);
					console.log('Unlocked first level of full version!')
				}
			}

			if (window.location.hash == "#/gameend")
				$rootScope.go('/levels');

			$rootScope.safeApply();
		},

		transactionReceiptFailed: function() {
			window.alert('Transaction receipt could not be verified.');
			store.isIdle = false;
			$rootScope.safeApply();
		},

		checkTransactionReceipt: function(receipt, successFn) {
			successFn();

			return;

			// TODO: enable validation:

			//console.log("IAP: checking transaction receipt...");

			/*$http({
				url: 'https://buy.itunes.apple.com/verifyReceipt',
				method: 'POST',
				data: {"receipt-data": receipt },
				cache: false,
				timeout: 1000
			})
			.success(function(data){
				if (data.status === 0) {
					console.log("IAP: Transaction receipt verified.");
					successFn();
				}
				else
					store.transactionReceiptFailed();

			})
			.error(function(){
				store.transactionReceiptFailed();
			});*/
		},


		buy: function(item) {
			if (window.plugins && window.plugins.inAppPurchaseManager) {
				store.isIdle = true;

				window.plugins.inAppPurchaseManager.requestProductData(item, function(result) {
					//		console.log("productId: " + result.id + " title: " + result.title + " description: " + result.description + " price: " + result.price);
					window.plugins.inAppPurchaseManager.makePurchase(result.id, 1);
				}, function(id) {
					store.isIdle = false;
					console.log("Invalid product id: " + result);
					$rootScope.safeApply();
				});
			}
			else {
				// HACK: get everything for free on PC:
				store.set('level_pack_1', true);
			}

		},

		restorePurchase: function() {
			//console.log('Restoring transactions...');
			if (window.plugins && window.plugins.inAppPurchaseManager) {
				store.isIdle = true;
				window.plugins.inAppPurchaseManager.restoreCompletedTransactions();
			}
			else {
			// HACK: get everything for free on PC:
				store.set('level_pack_1', true);
			}
		}
	};

	store.init();

	return store;
});