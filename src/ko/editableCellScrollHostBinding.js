"option strict";
var utils = require('./utils'),
    ko = require('./wrapper');

var editableCellScrollHost = {
    init: function (element) {
        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellScrollHost binding can only be applied to tables');
        }

        utils.initializeSelection(element);
    },
    update: function (element, valueAccessor) {
        var table = element,
            selection = table._cellSelection,
            scrollHost = ko.utils.unwrapObservable(valueAccessor());

        selection.setScrollHost(scrollHost);
    }
};

module.exports = editableCellScrollHost;
