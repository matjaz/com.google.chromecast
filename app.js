'use strict'

var querystring = require('querystring');

exports.init = function() {

	getYouTubeApp(function() {})

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
	getYouTubeApp(function (err, youTubeApp) {
		if (!youTubeApp) {
			// no results
			callback(null, []);
			return;
		}
		var qs = querystring.stringify({
			q: args.query,
			type: 'video',
			part: 'id,snippet',
			maxResults: 5
		});
		youTubeApp.get(`/search?${qs}`, function(error, result) {
			if (error || !result || !result.items) {
				callback(error || new Error('Search did not return any results.'));
				return;
			}

			var videos = result.items.map(function(video) {
				return {
					id		: video.id.videoId,
					name	: video.snippet.title,
					image	: video.snippet.thumbnails.default.url
				};
			})

			callback( null, videos );
		});
	});
	
}

function onFlowActionCastVideo(callback, args) {
	Homey.manager('drivers')
		.getDriver('chromecast')
		.playVideo(args.chromecast.id, args.url, callback)
}

function getYouTubeApp(callback) {
	var api = Homey.manager('api');
	var app = new api.App('com.youtube');
	app.isInstalled(function(err, installed) {
		if (err) {
			// Homey.error(err);
			callback(err);
			return;
		}

		if (!installed) {
			// console.log("youtube app is not installed!");
			// TODO: remove (action) cards
			callback(null);
			return;
		}
		exports.youTubeApp = app;
		callback(null, app);
	});
}
