"option strict";
var koBindingHandlers = require('./ko'), //jshint ignore:line
    events = require('./events');

exports.selectCell = function (cell) {
    var table = cell.parentNode.parentNode.parentNode,
        selection = table._cellSelection;

    selection.setRange(cell, cell);
};

exports.getTableSelection = function (table) {
    var selection = table._cellSelection;

    return selection;
};

exports.setCellValue = function (cell, value) {
    var table = cell.parentNode.parentNode.parentNode,
        selection = table._cellSelection;

    selection.updateCellValue(cell, value);
};

// --------
// Eventing
// --------

exports.on = function (event, listener) {
    events.public.on(event, listener);
};

exports.removeListener = function () {
    events.public.removeListener.apply(events.public, arguments);
};

exports.removeAllListeners = function () {
    events.public.removeAllListeners.apply(events.public, arguments);
};

// Proxy internal events

var proxyEvents = ['cellValueChanged', 'beforeCopy'],
    eventName,
    i;

for (i = 0; i < proxyEvents.length; ++i) {
    eventName = proxyEvents[i];

    events.private.on(eventName, createProxy(eventName));
}

function createProxy (eventName) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(eventName);
        events.public.emit.apply(events.public, args);
    };
}
