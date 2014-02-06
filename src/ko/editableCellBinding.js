var utils = require('./utils');

var editableCell = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var table = $(element).parents('table')[0],
            selection = utils.initializeSelection(table),
            valueBindingName = 'editableCell';

        selection.registerCell(element);

        if (allBindingsAccessor().cellValue) {
            valueBindingName = 'cellValue';
            valueAccessor = function () { return allBindingsAccessor().cellValue; };
        }

        element._cellTemplated = element.innerHTML.trim() !== '';
        element._cellValue = valueAccessor;
        element._cellContent = function () { return allBindingsAccessor().cellHTML || allBindingsAccessor().cellText || this._cellValue(); };
        element._cellText = function () { return allBindingsAccessor().cellText; };
        element._cellHTML = function () { return allBindingsAccessor().cellHTML; };
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindingsAccessor().cellReadOnly); };
        element._cellValueUpdater = function (newValue) {
            utils.updateBindingValue(valueBindingName, this._cellValue, allBindingsAccessor, newValue);

            if (!ko.isObservable(this._cellValue())) {
                ko.bindingHandlers.editableCell.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            }
        };

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            selection.unregisterCell(element);

            element._cellValue = null;
            element._cellContent = null;
            element._cellText = null;
            element._cellHTML = null;
            element._cellReadOnly = null;
            element._cellValueUpdater = null;
        });

        if (element._cellTemplated) {
            ko.utils.domData.set(element, 'editableCellTemplate', {});
            return { 'controlsDescendantBindings': true };
        }
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (element._cellTemplated) {
            var template = ko.utils.domData.get(element, 'editableCellTemplate');

            if (!template.savedNodes) {
                template.savedNodes = utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
            }
            else {
                ko.virtualElements.setDomNodeChildren(element, utils.cloneNodes(template.savedNodes));
            }

            ko.applyBindingsToDescendants(bindingContext.createChildContext(ko.utils.unwrapObservable(valueAccessor())), element);
        }
        else {
            if (element._cellHTML()) {
                element.innerHTML = ko.utils.unwrapObservable(element._cellHTML());
            }
            else {
                element.textContent = ko.utils.unwrapObservable(element._cellText() || element._cellValue());
            }
        }
    }
};

module.exports = editableCell;