var Selection = require('./selection');

// ### `editableCell` binding
//
// The `editableCell` binding turns regular table cells into selectable, editable Excel-like cells.
//
// #### Usage
//
// Bind a property to the table cell element:
//
//     <td data-bind="editableCell: name"></td>
//
// In addition, the following supporting bindings may be used for configuration:
//
// - `cellText` - Overrides the text displayed in the cell
//
//          editableCell: amount, cellText: '$' + amount()
//
// - `cellReadOnly` - Sets whether or not the cell can be edited
//
//          editableCell: amount, cellReadOnly: true
//
// Information on the currently cells in the table can be aquired using the
// [`editableCellSelection`](#editablecellselection) table binding.

// #### Documentation
ko.bindingHandlers.editableCell = {
    // Binding initialization makes sure the common selection is initialized, before initializing the cell in question
    // and registering it with the selection.
    //
    // Every instance of the `editableCell` binding share a per table [selection](#selection).
    // The first cell being initialized per table will do the one-time initialization of the common table selection.
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var table = $(element).parents('table')[0],
            selection = table._cellSelection,
            valueBindingName = 'editableCell';

        if (selection === undefined) {
            table._cellSelection = selection = new Selection(table, ko.bindingHandlers.editableCellSelection._selectionMappings);
        }

        selection.registerCell(element);

        if (allBindingsAccessor().cellValue) {
            valueBindingName = 'cellValue';
            valueAccessor = function () { return allBindingsAccessor().cellValue; };
        }

        element._cellTemplated = element.innerHTML.trim() !== '';
        element._cellValue = valueAccessor;
        element._cellText = function () { return allBindingsAccessor().cellText || this._cellValue(); };
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindingsAccessor().cellReadOnly); };
        element._cellValueUpdater = function (newValue) {
            updateBindingValue(valueBindingName, this._cellValue, allBindingsAccessor, newValue);

            if (!ko.isObservable(this._cellValue())) {
                ko.bindingHandlers.editableCell.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
            }
        };

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            selection.unregisterCell(element);

            element._cellValue = null;
            element._cellText = null;
            element._cellReadOnly = null;
            element._cellValueUpdater = null;
        });

        if (element._cellTemplated) {
            ko.utils.domData.set(element, 'editableCellTemplate', {});
            return { 'controlsDescendantBindings': true };
        }
    },
    // Binding update simply updates the text content of the table cell.
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (element._cellTemplated) {
            var template = ko.utils.domData.get(element, 'editableCellTemplate');

            if (!template.savedNodes) {
                template.savedNodes = cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
            }
            else {
                ko.virtualElements.setDomNodeChildren(element, cloneNodes(template.savedNodes));
            }

            ko.applyBindingsToDescendants(bindingContext.createChildContext(ko.utils.unwrapObservable(valueAccessor())), element);
        }
        else {
            element.textContent = ko.utils.unwrapObservable(element._cellText());
        }
    }
};

// ### <a name="editablecellselection"></a> `editableCellSelection` binding
//
// The `editableCellSelection` binding is a one-way binding that will reflect the currently selected cells in a table.
//
// #### Usage
//
// 1) Add a `selection` observable array to your view model:
//
//     viewModel.selection = ko.observableArray();
//
// 2) Bind the property to the table element using the `editableCellSelection` binding:
//
//     <table data-bind="editableCellSelection: selection" .. >
//
// Each element in the observable array will have the following properties:
//
// - `cell` - The table cell itself
// - `value` - The value of the `editableCell` binding
// - `text` - The value of the `cellText` binding, or same as `value`
//
// Using utility functions like `ko.dataFor` on the `cell` property, you can get hold of the row view model.

ko.bindingHandlers.editableCellSelection = {
    _selectionMappings: [],

    init: function (element, valueAccessor, allBindingsAccessor) {
        var table = element,
            selection = table._cellSelection;

        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellSelection binding can only be applied to tables');
        }

        if (selection === undefined) {
            table._cellSelection = selection = new Selection(table, ko.bindingHandlers.editableCellSelection._selectionMappings);
        }

        table._cellSelectionSubscriptions = table._cellSelectionSubscriptions || [];

        // Update supplied observable array when selection range changes
        table._cellSelectionSubscriptions.push(selection.range.selection.subscribe(function (newSelection) {
            newSelection = ko.utils.arrayMap(newSelection, function (cell) {
                return {
                    cell: cell,
                    value: cell._cellValue(),
                    text: cell._cellText()
                };
            });

            updateBindingValue('editableCellSelection', valueAccessor, allBindingsAccessor, newSelection);
        }));

        // Keep track of selections
        ko.bindingHandlers.editableCellSelection._selectionMappings.push([valueAccessor, table]);

        // Perform clean-up when table is removed from DOM
        ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
            // Detach selection from table
            table._cellSelection = null;

            // Remove selection from list
            var selectionIndex = ko.utils.arrayFirst(ko.bindingHandlers.editableCellSelection._selectionMappings, function (tuple) {
                return tuple[0] === valueAccessor;
            });
            ko.bindingHandlers.editableCellSelection._selectionMappings.splice(selectionIndex, 1);

            // Dispose subscriptions
            disposeSelectionSubscriptions(table);
        });
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var table = element,
            selection = table._cellSelection,
            newSelection = ko.utils.unwrapObservable(valueAccessor()) || [];

        // Empty selection, so simply clear it out
        if (newSelection.length === 0) {
            selection.range.clear();
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
        var belongingToOtherTable = start.parentNode && start.parentNode.parentNode.parentNode !== table;

        if (parentRowHidden || belongingToOtherTable) {
            // Selection cannot be cleared, since that will affect selection in other table
            selection.view.hide();
            return;
        }

        // Programmatic update of selection, i.e. selection([startCell, endCell]);
        if (isDirectUpdate) {
            selection.range.setStart(start);
            selection.range.setEnd(end);
        }
    }
};

ko.bindingHandlers.editableCellViewport = {
    init: function (element) {
        var table = element,
            selection = table._cellSelection;

        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellSelection binding can only be applied to tables');
        }

        if (selection === undefined) {
            table._cellSelection = selection = new Selection(table, ko.bindingHandlers.editableCellSelection._selectionMappings);
        }
    },
    update: function (element, valueAccessor) {
        var table = element,
            selection = table._cellSelection,
            viewport = ko.utils.unwrapObservable(valueAccessor());

        selection.setViewport(viewport);
    }
};

function disposeSelectionSubscriptions (element) {
    ko.utils.arrayForEach(element._cellSelectionSubscriptions, function (subscription) {
        subscription.dispose();
    });
    element._cellSelectionSubscriptions = null;
}

// `updateBindingValue` is a helper function borrowing private binding update functionality
// from Knockout.js for supporting updating of both observables and non-observables.
function updateBindingValue (bindingName, valueAccessor, allBindingsAccessor, newValue) {
    if (ko.isWriteableObservable(valueAccessor())) {
        valueAccessor()(newValue);
        return;
    }

    var propertyWriters = allBindingsAccessor()._ko_property_writers;
    if (propertyWriters && propertyWriters[bindingName]) {
        propertyWriters[bindingName](newValue);
    }

    if (!ko.isObservable(valueAccessor())) {
        allBindingsAccessor()[bindingName] = newValue;
    }
}

// Borrowed from Knockout.js
function cloneNodes (nodesArray, shouldCleanNodes) {
    for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
        var clonedNode = nodesArray[i].cloneNode(true);
        newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
    }
    return newNodesArray;
}