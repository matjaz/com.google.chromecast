'use strict'
var ytdl = require('ytdl-core')
var ytdlUtil = require('ytdl-core/lib/util')
var ChromecastAPI = require('chromecast-api')
var devices = []
var devices_data

exports.init = function(devices, callback) {
	// Homey.log('init', devices)
	discoverChromecasts()
	devices_data = devices
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

function discoverChromecasts(resetList) {
	var browser = new ChromecastAPI.Browser()
	browser.on('deviceOn', function(device) {
		if (resetList) {
			devices.length = 0
			resetList = false
		}
		devices.push(device)
		device.on('status', function(status) {
			const tokens = {
				status: status.playerState
			}
			getDeviceData(device.config.name, function (device_data) {
				Homey.manager('flow').triggerDevice('chromecastStatusChanged', tokens, {}, device_data)
			})
		})
		// Homey.log('devices', devices)
	})
	// Homey.log('devices', devices)
	setTimeout(function() {
		// rediscover devices
		discoverChromecasts(true)
	}, 600000) // 10 min
}

exports.playVideo = function(deviceName, videoUrl, callback) {
		
	// Homey.log(deviceName, devices)
	getDevice(deviceName, function(device) {
		getVideoInfo(videoUrl, function(err, media) {
			if (err) {
				Homey.error(err)
				callback && callback(err)
				return
			}
			// Homey.log('media', media)
			device.play(media, 0, function() {
				// Homey.log('Playing on your chromecast')
				callback && callback(null, true)
			})
		})
	}, callback)
}

var deviceActions = [
	'stop',
	'pause',
	'unpause'
]
deviceActions.forEach(function(action) {
	exports[action] = function(deviceName, callback) {
		getDevice(deviceName, function(device) {
			// Homey.log(action)
			device[action](function(err, r) {
				callback(err, !err)
			})
		}, callback)
	}
})

deviceActions = [
	'seek',
	'seekTo',
	'setVolume'
]
deviceActions.forEach(function(action) {
	exports[action] = function(deviceName, value, callback) {
		getDevice(deviceName, function(device) {
			// Homey.log(action, value)
			switch (action) {
				case 'seekTo':
					value = parseTime(value)
					break
				case 'setVolume':
					value /= 100
			}
			device[action](value, function(err, r) {
				callback(err, !err)
			})
		}, callback)
	}
})

deviceActions = [
	'mute',
	'unmute'
]
deviceActions.forEach(function(action) {
	exports[action] = function(deviceName, callback) {
		getDevice(deviceName, function(device) {
			var muted = action === 'mute'
			// Homey.log(action, muted)
			device.setVolumeMuted(muted, function(err, r) {
				callback(err, !err)
			})
		}, callback)
	}
})

function getDevice(deviceName, success, error) {
	var device = devices.filter(function(device) {
		return device.config && device.config.name === deviceName
	})[0]
	if (device) {
		success(device)
	} else if (error) {
		error(new Error('Device ' + deviceName + 'not found'))
	}
}

function getDeviceData(deviceName, success, error) {
	var device = devices_data.filter(function(device) {
		return device.id === deviceName
	})[0]
	if (device) {
		success(device)
	} else if (error) {
		error(new Error('Device ' + deviceName + 'not found'))
	}
}

// convert 1:15 to seconds (75)
function parseTime(time) {
	var seconds = 0
	time.split(':').reverse().forEach(function(part, i) {
		seconds += parseInt(part, 10) * Math.pow(60, i)
	})
	return seconds
}

function getVideoInfo(url, callback) {
	if (isYoutubeVideo(url)) {
		var options = {
			filter: function(format) {
				return format.type && format.type.indexOf('video/mp4') === 0
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