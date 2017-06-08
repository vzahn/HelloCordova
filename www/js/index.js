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

var Latitude = undefined;
var Longitude = undefined;
var lastUpdateTime, minFrequency = 2*1000;
var dummyData = {"id":"1",
                    "jsonrpc":"2.0",
                    "method":"sendPos",
                    "params":{"contractId":"232323","obuid":"30343132343630303030303533",
                    "pos":[
                        {"lat":50.892671397047,"lon":4.459888181512,"time":1469016000,"vel":2.53},
                        {"lat":50.892671397047,"lon":4.459888181512,"time":1469017000,"vel":2.53},
                        ]}
                };
               
var urlObuGateway = "http://141.39.84.12:7580/gpsdata";
//var urlObuGateway = "http://10.33.145.38:8080/gpsdata";
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
    
    var element = document.getElementById('geolocation');
    element.innerHTML = 'Lat/Lon: '  + position.coords.latitude + ' ' + position.coords.longitude + '<br />';

    Latitude = position.coords.latitude;
    Longitude = position.coords.longitude;

    getMap(Latitude, Longitude);

    var parsedData = JSON.stringify(dummyData);

    console.log("Sending GPS data: " + parsedData);

    // Sending and receiving data in JSON format using POST mothod
    $.ajax({
        type       : "POST",
        url        : urlObuGateway,
        crossDomain: true,
        data       : parsedData,
        dataType   : "json",
        contentType: 'application/json; charset=utf-8',
        success    : function(response) {
            console.log("Response: %O", response);
            console.log("Response: " + JSON.stringify(response));
        },
        error      : function() {
            alert('Not working!');                  
        }
    });

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

app.initialize();
