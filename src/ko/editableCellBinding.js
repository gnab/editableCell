/* global $ */

"option strict";
var utils = require('./utils'),
    events = require('../events'),
    ko = require('./wrapper');

var editableCell = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var table = $(element).parents('table')[0],
            selection = utils.initializeSelection(table),
            valueBindingName = 'editableCell';

        selection.registerCell(element);

        if (allBindings.has('cellValue')) {
            valueBindingName = 'cellValue';
            valueAccessor = function () { return allBindings.get('cellValue'); };
        }

        element._cellTemplated = element.innerHTML.trim() !== '';
        element._cellValue = valueAccessor;
        element._cellContent = function () { return allBindings.get('cellHTML') || allBindings.get('cellText') || this._cellValue(); };
        element._cellText = function () { return allBindings.get('cellText'); };
        element._cellHTML = function () { return allBindings.get('cellHTML'); };
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindings.get('cellReadOnly')); };
        element._cellValueUpdater = function (newValue) {
            utils.updateBindingValue(element, valueBindingName, this._cellValue, allBindings, newValue);

            if (!ko.isObservable(this._cellValue())) {
                ko.bindingHandlers.editableCell.update(element, valueAccessor, allBindings, viewModel, bindingContext);
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

        element.initialBind = true;
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (element._cellTemplated) {
            var template = ko.utils.domData.get(element, 'editableCellTemplate');

            if (!template.savedNodes) {
                template.savedNodes = utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
            }
            else {
                ko.virtualElements.setDomNodeChildren(element, utils.cloneNodes(template.savedNodes));
            }

            ko.applyBindingsToDescendants(bindingContext.createChildContext(value), element);
        }
        else {
            if (element._cellHTML()) {
                element.innerHTML = ko.utils.unwrapObservable(element._cellHTML());
            }
            else {
                element.textContent = ko.utils.unwrapObservable(element._cellText() || element._cellValue());
            }
        }

        if (!element.initialBind) {
            events.private.emit('cellValueChanged', element);
        }

        if (element.initialBind) {
            element.initialBind = undefined;
        }
    }
};

module.exports = editableCell;
