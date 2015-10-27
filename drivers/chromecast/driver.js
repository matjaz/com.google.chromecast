"use strict";

var Client              = require('castv2-client').Client;
var Youtube             = require('castv2-youtube').Youtube;
var mdns				= require('multicast-dns');

var self = module.exports;

var chromecasts = global.chromecasts = [];

self.init = function( devices, callback ) {
	
	// scan for chromecasts
	findChromecasts();
	
	callback();
}

self.capabilities = {
	
}

self.pair = {
	
	list_devices: function( callback, emit, data ) {
		callback( chromecasts );
	}
	
}

self.playYoutube = function( host, video_id ) {

	var client = new Client();
	client.connect(host, function() {
		client.launch(Youtube, function(err, player) {
			if (err) return Homey.error(err)

			player.load( video_id );
		});
	});

	client.on('error', function(err) {
		Homey.error(err.message);
		client.close();
	});

}

function findChromecasts() {
	
	var opts = {
		service_name: '_googlecast._tcp.local',
		service_type: 'PTR',
		mdns: {}
	};
	
	var onResponse = function(response) {
		if( response.answers.length < 1 ) return;
				
		var answer = response.answers[0];
	
		if (answer.name !== opts.service_name ||
			answer.type !== opts.service_type) {
			return;
		}
		
		response.additionals = response.additionals.filter(function(entry){
			return entry.type === 'A'
		});
		
		response.additionals.forEach(function(chromecast){
			chromecasts.push({
				name: chromecast.name,
				data: {
					id: chromecast.name,
					ip: chromecast.data
				}
			})
		})
		
	};
	
	setTimeout(function(){
		browser.removeListener('response', onResponse);
		browser.destroy();		
	}, 60 * 1000);
	
	var browser = mdns(opts.mdns);
		
	browser.on('response', onResponse)
	
	browser.query({
		questions: [{
			name: opts.service_name,
			type: opts.service_type
		}]
	});
	
}