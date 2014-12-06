/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */
 
/*
 TestFlight Plugin for Apache Cordova.
 Created by Shazron Abdullah
 
 1. Include the TestFlight SDK files in Xcode (follow their instructions)
 2. Add CDVTestFlight.h and .m in Xcode
 3. Add testflight.js to your www folder, and reference it in a script tag after your cordova.js
 4. In Cordova.plist, under the 'Plugins' key, add a new row: key is "TestFlightSDK" and the value is "CDVTestFlight"
 5. In Cordova.plist, under the 'ExternalHosts' key, add a new value "testflightapp.com"
 
 The plugin's JavaScript functions are called after getting the plugin object thus:
 
     var tf = cordova.require("cordova/plugin/testflightsdk");
     tf.takeoff(win, fail, "some_team_token");
 
 See the functions below (and the TestFlight SDK docs) for usage. Unfortunately all of TestFlight's SDK functions return void,
 and errors can only be gleaned from the run console, so check that for errors.
 */
cordova.define("cordova/plugin/testflightsdk", function(require, exports, module) {
 	var exec = require('cordova/exec');

	var TestFlight = function() {
	    this.serviceName = "TestFlightSDK";
	};

	/*
	 Add custom environment information
	 If you want to track a user name from your application you can add it here
 
	 @param successCallback function
	 @param failureCallback function
	 @param key string
	 @param information string
	 */
	TestFlight.prototype.addCustomEnvironmentInformation = function(successCallback, failureCallback, key, information) {
	    exec(successCallback, failureCallback, this.serviceName, "addCustomEnvironmentInformation", 
	                  [ key, information]);
	};

	/*
	 Starts a TestFlight session
 
	 @param successCallback function
	 @param failureCallback function
	 @param teamToken string
	 */
	TestFlight.prototype.takeOff = function(successCallback, failureCallback, teamToken) {
	    exec(successCallback, failureCallback, this.serviceName, "takeOff", [ teamToken ]);
	};

	/*
	 Sets custom options
 
	 @param successCallback function
	 @param failureCallback function
	 @param options object i.e { reinstallCrashHandlers : true }
	 */
	TestFlight.prototype.setOptions = function(successCallback, failureCallback, options) {
	    if (!(null !== options && 'object' == typeof(options))) {
	        options = {};
	    }
	    exec(successCallback, failureCallback, this.serviceName, "setOptions", [ options ]);
	};

	/*
	 Track when a user has passed a checkpoint after the flight has taken off. Eg. passed level 1, posted high score
 
	 @param successCallback function
	 @param failureCallback function
	 @param checkpointName string
	 */
	TestFlight.prototype.passCheckpoint = function(successCallback, failureCallback, checkpointName) {
	    exec(successCallback, failureCallback, this.serviceName, "passCheckpoint", [ checkpointName ]);
	};

	/*
	 Remote logging

	 @param successCallback function
	 @param failureCallback function
	 @param message string
	 */
	TestFlight.prototype.remoteLog = function(successCallback, failureCallback, message) {
	    exec(successCallback, failureCallback, this.serviceName, "remoteLog", [ message ]);
	};

	/*
	 Opens a feedback window that is not attached to a checkpoint
 
	 @param successCallback function
	 @param failureCallback function
	 */
	TestFlight.prototype.openFeedbackView = function(successCallback, failureCallback) {
	    exec(successCallback, failureCallback, this.serviceName, "openFeedbackView", []);
	};


    /*
      Submits custom feedback to the site. Sends the data in feedback to the site. 
      This is to be used as the method to submit feedback from custom feedback forms.
     
      @param feedback Your users feedback, method does nothing if feedback is nil
    */
	TestFlight.prototype.submitFeedback = function(successCallback, failureCallback, feedback) {
	    exec(successCallback, failureCallback, this.serviceName, "submitFeedback", [ feedback ]);
	};
	
	/*
     Sets the Device Identifier. 
     The SDK no longer obtains the device unique identifier. This method should only be
     used during testing so that you can identify a testers test data with them. 
     If you do not provide the identifier you will still see all session data, with
     checkpoints and logs, but the data will be anonymized.
     
      @param deviceIdentifer The current devices device identifier
    */
	TestFlight.prototype.setDeviceIdentifier = function(successCallback, failureCallback, deviceIdentifier) {
	    exec(successCallback, failureCallback, this.serviceName, "setDeviceIdentifier", [ deviceIdentifier ]);
	};
	
	/*
     If app is compiled on DEBUG, sets the Device Identifier from actual UUID. 

     Otherwise, does nothing
    */
	TestFlight.prototype.setDeviceIdentifierUUID = function(successCallback, failureCallback) {
	    exec(successCallback, failureCallback, this.serviceName, "setDeviceIdentifierUUID", [ ]);
	};

 	var testflight = new TestFlight();
 	module.exports = testflight;
	
 });
