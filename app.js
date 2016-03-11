'use strict'

var YouTube = require('youtube-node');
var youTube;

exports.init = function() {
	
	youTube = new YouTube();
	youTube.setKey( Homey.env.YOUTUBE_KEY );
	youTube.addParam('type', 'video');
		
	Homey.manager('flow').on('action.castYouTube', onFlowActionCastYouTube)
	Homey.manager('flow').on('action.castYouTube.youtube_id.autocomplete', onFlowActionCastYouTubeAutocomplete);
	Homey.manager('flow').on('action.castVideo', onFlowActionCastVideo)

	var deviceActions = [
		'stop',
		'pause',
		'unpause',
		'mute',
		'unmute'
	]
	deviceActions.forEach(function (action) {
		Homey.manager('flow').on('action.' + action + 'Video', function onFlowActionCastVideo(callback, args) {
			// Homey.log(action, args)
			Homey.manager('drivers')
				.getDriver('chromecast')
				[action](args.chromecast.id, callback)
		})
	})
	deviceActions = [
		'seek',
		'seekTo'
	]
	deviceActions.forEach(function (action) {
		Homey.manager('flow').on('action.' + action + 'Video', function onFlowActionCastVideo(callback, args) {
			// Homey.log(action, args)
			Homey.manager('drivers')
				.getDriver('chromecast')
				[action](args.chromecast.id, args.time, callback)
		})
	})
	Homey.manager('flow').on('action.setVolumeVideo', function onFlowActionCastVideo(callback, args) {
		// Homey.log('volume', args)
		Homey.manager('drivers')
			.getDriver('chromecast')
			.setVolume(args.chromecast.id, args.level, callback)
	})
}

function onFlowActionCastYouTube(callback, args) {
	Homey.manager('drivers')
		.getDriver('chromecast')
		.playVideo(args.chromecast.id, 'https://www.youtube.com/watch?v=' + args.youtube_id.id, callback)
}

function onFlowActionCastYouTubeAutocomplete( callback, args ){
	youTube.search(args.query, 5, function(error, result) {
		if (error) return;
		
		var videos = [];
		result.items.forEach(function(video){
			videos.push({
				id		: video.id.videoId,
				name	: video.snippet.title,
				image	: video.snippet.thumbnails.default.url
			})
		})
					
		callback( null, videos );
	});
	
}

function onFlowActionCastVideo(callback, args) {
	Homey.manager('drivers')
		.getDriver('chromecast')
		.playVideo(args.chromecast.id, args.url, callback)
}