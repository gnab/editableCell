"option strict";
var utils = require('./utils'),
    ko = require('./wrapper');

var editableCellSelection = {
    _selectionMappings: [],

    init: function (element, valueAccessor, allBindingsAccessor) {
        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellSelection binding can only be applied to tables');
        }

        var table = element,
            selection = utils.initializeSelection(table);

        // Update supplied observable array when selection range changes
        selection.on('change', rangeChanged);

        function rangeChanged (newSelection) {
            newSelection = ko.utils.arrayMap(newSelection, function (cell) {
                return {
                    cell: cell,
                    value: cell._cellValue(),
                    content: cell._cellContent()
                };
            });

            utils.updateBindingValue(element, 'editableCellSelection', valueAccessor, allBindingsAccessor, newSelection);
        }

        // Keep track of selections
        ko.bindingHandlers.editableCellSelection._selectionMappings.push([valueAccessor, table]);

        // Perform clean-up when table is removed from DOM
        ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
            // Remove selection from list
            var found = false,
                index = 0,
                selectionMappings = ko.bindingHandlers.editableCellSelection._selectionMappings;

            for (; index < selectionMappings.length; index++) {
                if (selectionMappings[index].length > 1 && selectionMappings[index][1] === table) {
                    found = true;
                    break;
                }
            }

            if (found) {
                ko.bindingHandlers.editableCellSelection._selectionMappings.splice(index, 1);
            } else {
                console.warn('[editableCell] Selection binding did not clean up a mapping. Likely leaked table');
            }

            // Remove event listener
            selection.removeListener('change', rangeChanged);
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var table = element,
            selection = table._cellSelection,
            newSelection = ko.utils.unwrapObservable(valueAccessor()) || [];

        // Empty selection, so simply clear it out
        if (newSelection.length === 0) {
            selection.clear();
            return;
        }

        var start = newSelection[0],
            end = newSelection[newSelection.length - 1];

        var isDirectUpdate = start.tagName === 'TD' || start.tagName === 'TH';

        // Notification of changed selection, either after programmatic
        // update or after changing current selection in user interface
        if (!isDirectUpdate) {
            start = start.cell;
            end = end.cell;
        }

        // Make sure selected cells belongs to current table, or else hide selection
        var parentRowHidden = !start.parentNode;
        var belongingToOtherTable = start.parentNode && // td
                                    start.parentNode.parentNode && // tr
                                    start.parentNode.parentNode.parentNode && //table
                                    start.parentNode.parentNode.parentNode !== table;

        if (parentRowHidden || belongingToOtherTable) {
            // Selection cannot be cleared, since that will affect selection in other table
            selection.view.hide();
            return;
        }

        // Programmatic update of selection, i.e. selection([startCell, endCell]);
        if (isDirectUpdate) {
            selection.setRange(start, end);
        }
    }
};

module.exports = editableCellSelection;
