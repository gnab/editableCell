var Selection = require('../selection');

module.exports = {
    initializeSelection: initializeSelection,
    updateBindingValue: updateBindingValue,
    cloneNodes: cloneNodes
};

function initializeSelection (table) {
    var selection = table._cellSelection;

    if (selection === undefined) {
        table._cellSelection = selection = new Selection(table, ko.bindingHandlers.editableCellSelection._selectionMappings);

        ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
            table._cellSelection.destroy();
        });
    }

    return selection;
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