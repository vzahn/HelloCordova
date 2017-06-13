/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');

        console.log("Device ready event, installing geo locator ...");
        
        // get position after device is ready
        //navigator.geolocation.getCurrentPosition(onSuccess, onError);
        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 5000, timeout: 50000, enableHighAccuracy: true });

        // set send timer
        setInterval(sendData, 10000);
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

var contractId   = "232323";
var obuId        = "30343132343630303030303533";
var gpsPositions = [];

var Latitude = undefined;
var Longitude = undefined;
var lastUpdateTime, minFrequency = 2*1000;
var idCounter = 1;
var dummyData = {"id": idCounter,
                    "jsonrpc":"2.0",
                    "method":"sendPos",
                    "params":{"contractId":"232323","obuid":"30343132343630303030303533",
                    "pos":[
                        {"lat":50.892671397047,"lon":4.459888181512,"time":1469016000,"vel":2.53},
                        {"lat":50.892671397047,"lon":4.459888181512,"time":1469017000,"vel":2.53},
                        ]}
                };
               
//var urlObuGateway = "http://141.39.84.12:7580/gpsdata";
var urlObuGateway = "http://10.33.145.38:8080/gpsdata";
//var urlObuGateway = "http://127.0.0.1:8091/gpsdata";

// onSuccess Callback
// This method accepts a Position object, which contains the
// current GPS coordinates
//
var onSuccess = function(position) {
    
    var now = new Date();
    if (lastUpdateTime && now.getTime() - lastUpdateTime.getTime() < minFrequency){
        console.log("Ignoring position update");
        return;
    }
    lastUpdateTime = now;

    console.log('Latitude: '          + position.coords.latitude          + '\n' +
                'Longitude: '         + position.coords.longitude         + '\n' +
                'Altitude: '          + position.coords.altitude          + '\n' +
                'Accuracy: '          + position.coords.accuracy          + '\n' +
                'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                'Heading: '           + position.coords.heading           + '\n' +
                'Speed: '             + position.coords.speed             + '\n' +
                'Timestamp: '         + position.timestamp                + '\n');
    
    if (position.coords.latitude != null && position.coords.longitude && position.timestamp) {
        var pos = {};
        pos["lat"] = position.coords.latitude;
        pos["lon"] = position.coords.longitude;
        pos["time"] = position.timestamp;
        
        // include optional parameters, if available
        if (position.coords.heading != null) {
           pos["dir"] = position.coords.heading;
        }
        if (position.coords.speed != null) {
            pos["vel"] = position.coords.speed;
        }
        if (position.coords.accuracy != null) {
            pos["quality"] = position.coords.accuracy;
        }
        
        // store position in global stotage
        gpsPositions.push(pos);
    }

    console.log(JSON.stringify(gpsPositions));

    var statusElement = document.getElementById('geolocation');
    statusElement.innerHTML = 'Lat/Lon: '  + position.coords.latitude + ' ' + position.coords.longitude + '<br />';
    statusElement.setAttribute('style', 'background-color: green;');

    Latitude = position.coords.latitude;
    Longitude = position.coords.longitude;

    getMap(Latitude, Longitude);

};

// onError Callback receives a PositionError object
//
function onError(error) {
    alert('code: '    + error.code    + '\n' + 
          'message: ' + error.message + '\n');
}

function getMap(latitude, longitude) {

    var mapOptions = {
        center: new google.maps.LatLng(0, 0),
        zoom: 1,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map
    (document.getElementById("map"), mapOptions);


    var latLong = new google.maps.LatLng(latitude, longitude);

    var marker = new google.maps.Marker({
        position: latLong
    });

    marker.setMap(map);
    map.setZoom(15);
    map.setCenter(marker.getPosition());
}

//
// function to GPS send data, if new data is available
// 
function sendData() {

    if (gpsPositions.length > 0) {
        var jsonPositions = JSON.stringify(gpsPositions);

        idCounter += 1;
        var sendData = {
            "id": idCounter,
            "jsonrpc":"2.0",
            "method":"sendPos",
            "params":{
                "contractId":contractId,
                "obuid":obuId,
                "pos":jsonPositions
            }
        };

        var jsonData = JSON.stringify(sendData);
        console.log("Sending GPS data: " + jsonData);

        // Sending and receiving data in JSON format using POST mothod
        $.ajax({
            type       : "POST",
            url        : urlObuGateway,
            crossDomain: true,
            data       : jsonData,
            dataType   : "json",
            contentType: 'application/json; charset=utf-8',
            success    : sendDataSuccess,
            error      : sendDataError,
        });
    }
    else {
        console.log("Nothing to send");
    }
}

function sendDataSuccess(response) {
    console.log("sendData successfully returned %O", response);

    if ("error" in response) {
        console.log("ERROR " + response["error"]["code"] + " : " + response["error"]["message"]["message"]);
        var statusElement = document.getElementById('sendcounter');
        statusElement.innerHTML = 'Send count:' + idCounter;
        statusElement.setAttribute('style', 'background-color: red;');
    } else if ("result" in response) {
        console.log("got response code " + response["result"] + " for id " + response["id"]);
        if (response["id"] == idCounter && response["result"] == 0) {
            gpsPositions = [];
            
            var statusElement = document.getElementById('sendcounter');
            statusElement.innerHTML = 'Send count:' + idCounter;
            statusElement.setAttribute('style', 'background-color: green;');
        }
    } else {
        console.log("ERROR : invalid response, cannot parse response!")
        var statusElement = document.getElementById('sendcounter');
        statusElement.innerHTML = 'Send count:' + idCounter;
        statusElement.setAttribute('style', 'background-color: red;');
    }
}

function sendDataError(e) {
    var statusElement = document.getElementById('sendcounter');
    statusElement.innerHTML = 'Send count:' + idCounter;
    statusElement.setAttribute('style', 'background-color: red;');
    console.log(e);
}


app.initialize();
