var koBindingHandlers = require('./ko');

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