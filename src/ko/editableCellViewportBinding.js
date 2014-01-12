var utils = require('./utils');

var editableCellViewport = {
    init: function (element) {
        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellViewport binding can only be applied to tables');
        }

        utils.initializeSelection(element);
    },
    update: function (element, valueAccessor) {
        var table = element,
            selection = table._cellSelection,
            viewport = ko.utils.unwrapObservable(valueAccessor());

        selection.setViewport(viewport);
    }
};

module.exports = editableCellViewport;