"option strict";
var EventEmitter = require('events').EventEmitter,
	publicEvents = new EventEmitter(),
	privateEvents = new EventEmitter();

module.exports.public = publicEvents;
module.exports.private = privateEvents;
