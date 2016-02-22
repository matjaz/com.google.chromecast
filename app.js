'use strict'

var YouTube				= require('youtube-node');
var youTube;

exports.init = function() {
	
	youTube = new YouTube();
	youTube.setKey( Homey.env.YOUTUBE_KEY );
		
	Homey.manager('flow').on('action.castYouTube', onFlowActionCastYouTube)
	Homey.manager('flow').on('action.castYouTube.youtube_id.autocomplete', onFlowActionCastYouTubeAutocomplete);
	Homey.manager('flow').on('action.castVideo', onFlowActionCastVideo)
}

function onFlowActionCastYouTube(callback, args) {
	console.log(args)
	Homey.manager('drivers')
		.getDriver('chromecast')
		.playVideo(args.chromecast.id, 'https://www.youtube.com/watch?v=' + args.youtube_id.id, callback)
}

function onFlowActionCastYouTubeAutocomplete( callback, args ){
				
	youTube.addParam('type', 'video');
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