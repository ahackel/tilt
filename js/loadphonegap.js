(function () {

	var isPhonegap = (window.location.protocol === "file:");

	if (isPhonegap) {
		loadScript("lib/cordova.js");
		loadScript("lib/testflight.js");
		loadScript("lib/GameCenterPlugin.js");
		loadScript("lib/SAiOSAdPlugin.js");
		loadScript("lib/InAppPurchaseManager.js");
	}

	function loadScript(url) {
		// synchronous load by @Sean Kinsey
		// http://stackoverflow.com/a/2880147/813951
		var xhrObj = new XMLHttpRequest();
		xhrObj.open('GET', url, false);
		xhrObj.send('');
		var se = document.createElement('script');
		se.text = xhrObj.responseText;
		document.getElementsByTagName('head')[0].appendChild(se);
	}
})();