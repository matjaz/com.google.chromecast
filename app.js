'use strict'

exports.init = function () {
  Homey.manager('flow').on('action.castVideo', onFlowActionCastVideo)
}

function onFlowActionCastVideo (callback, args) {
  Homey
  	.manager('drivers')
  	.getDriver('chromecast')
  	.playVideo(args.chromecast.id, args.url, callback)
}
