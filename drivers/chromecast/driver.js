'use strict'
var ytdl = require('ytdl-core')
var ytdlUtil = require('ytdl-core/lib/util')
var ChromecastAPI = require('chromecast-api')
var devices = []
exports.init = function(devices, callback) {
	// Homey.log('init', devices)
	discoverChromecasts()
	callback()
}

exports.capabilities = {}
exports.pair = function(socket) {
	socket.on('list_devices', function(data, callback) {
		callback(null, devices.map(function(chromecast) {
			return {
				name: chromecast.config.name,
				data: {
					id: chromecast.config.name,
					ip: chromecast.host
				}
			}
		}))
	})
}
exports.playVideo = function(deviceName, videoUrl, callback) {
		
	// Homey.log(deviceName, devices)
	var device = devices.filter(function(device) {
		return device.config && device.config.name === deviceName
	})[0]
	// Homey.log('device', device)
	if (device) {
		getVideoInfo(videoUrl, function(err, media) {
			if (err) {
				Homey.error(err)
				callback && callback(err)
				return
			}
			// Homey.log('media', media)
			device.play(media, 0, function() {
				Homey.log('Playing on your chromecast')
				callback && callback(null, true)
			})
		})
	} else if (callback) {
		callback(new Error('Device ' + deviceName + 'not found'))
	}
}

function discoverChromecasts() {
	var browser = new ChromecastAPI.Browser()
	browser.on('deviceOn', function(device) {
		devices.push(device)
		// Homey.log('devices', devices)
	})
	// Homey.log('devices', devices)
}

function getVideoInfo(url, callback) {
	if (isYoutubeVideo(url)) {
		var options = {
			filter: function(format) {
				return format.type.indexOf('video/mp4') === 0
			}
		}
		getYTVideoInfo(url, options, function(err, info) {
			if (err) return callback(err)
			// Homey.log('YT info', info)
			callback(null, {
				url: info.url,
				cover: {
					title: info.title,
					url: info.iurlmaxres
				}
			})
		})
	} else {
		callback(null, {
			url: url
		})
	}
}

function isYoutubeVideo(url) {
	return /(?:youtu\.be)|(?:youtube\.com)/.test(url)
}

function getYTVideoInfo(url, options, callback) {
	ytdl.getInfo(url, function(err, info) {
		if (err) {
			callback(err)
			return
		}
		var format = ytdlUtil.chooseFormat(info.formats, options)
		if (format instanceof Error) {
			callback(format)
		} else {
			callback(null, format)
		}
	})
}