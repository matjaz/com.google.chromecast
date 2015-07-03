"use strict";
  
function App() 
{
	this.chromecast = '';
}

module.exports = App;

App.prototype.init = function(){
	
	var mdns = Homey.module('mdns');
	
	// find chromecast using mdns
	var browser = mdns.createBrowser(mdns.tcp('googlecast'));
	
	browser.on('serviceUp', function(service) {
		Homey.log('chromecast found: `' + service.name + '` at ' + service.addresses[0] + ':' + service.port);		
		this.chromecast = service.addresses[0];
		browser.stop();
	}.bind(this));
	
	browser.start();
	
}

App.prototype.castYoutube = function( youtube_id ) {
	
	Homey.log('castYoutube: ' + youtube_id );
		
	var Client  = Homey.module('castv2-client').Client;
	var Youtube = Homey.module('castv2-youtube').Youtube;

	var client = new Client();
	client.connect( this.chromecast , function() {
		client.launch(Youtube, function(err, player) {
			player.load( youtube_id );
		});
	});
	
	client.on('error', function(err) {
		Homey.error('Error: ' + err.message);
		client.close();
	});


}

App.prototype.events = {}
App.prototype.events.flow = {}
App.prototype.events.flow.actions = {}
App.prototype.events.flow.actions.castYoutube = function( callback, args ){	
	this.castYoutube( args.youtube_id );
	if( typeof callback == 'function' ) callback.call();
};