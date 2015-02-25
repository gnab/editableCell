"option strict";
var EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill'), // jshint ignore:line
    inherits = require('inherits');

module.exports = SelectionRange;

inherits(SelectionRange, EventEmitter);

function SelectionRange(getRowByIndex, getCellByIndex, cellIsSelectable, cellIsVisible) {
    EventEmitter.call(this);

    this.start = undefined;
    this.end = undefined;
    this.selection = [];

    this.getRowByIndex = getRowByIndex;
    this.getCellByIndex = getCellByIndex;
    this.cellIsSelectable = cellIsSelectable;
    this.cellIsVisible = cellIsVisible;
}

SelectionRange.prototype.setSelection = function (cells) {
    this.selection = cells;
    this.emit('change', cells);
};

SelectionRange.prototype.moveInDirection = function (direction, toEnd) {
    var newStart = toEnd ? this.getLastSelectableCellInDirection(this.start, direction) : this.getSelectableCellInDirection(this.start, direction),
        startChanged = newStart !== this.start,
        belongingToOtherTable = newStart.parentNode.parentNode.parentNode !== this.start.parentNode.parentNode.parentNode;

    if (!belongingToOtherTable && (startChanged || this.start !== this.end)) {
        this.setStart(newStart);
    }

    if (startChanged) {
        return newStart;
    }
};

SelectionRange.prototype.extendInDirection = function (direction, toEnd) {
    var newEnd = toEnd ? this.getLastSelectableCellInDirection(this.end, direction) : this.getCellInDirection(this.end, direction),
    endChanged = newEnd && newEnd !== this.end;

    if (newEnd) {
        this.setEnd(newEnd);
    }

    if (endChanged) {
        return newEnd;
    }
};

SelectionRange.prototype.getCells = function () {
    return this.getCellsInArea(this.start, this.end);
};

SelectionRange.prototype.clear = function () {
    this.start = undefined;
    this.end = undefined;
    this.setSelection([]);
};

SelectionRange.prototype.destroy = function () {
    this.removeAllListeners('change');
    this.start = undefined;
    this.end = undefined;
    this.selection = null;

    this.getRowByIndex = undefined;
    this.getCellByIndex = undefined;
    this.cellIsSelectable = undefined;
    this.cellIsVisible = undefined;
};

SelectionRange.prototype.setStart = function (element) {
    this.start = element;
    this.end = element;
    this.setSelection(this.getCells());
};

SelectionRange.prototype.setEnd = function (element) {
    if (element === this.end) {
        return;
    }
    this.start = this.start || element;

    var cellsInArea = this.getCellsInArea(this.start, element),
        allEditable = true,
        self = this;

    cellsInArea.forEach(function (cell) {
        allEditable = allEditable && self.cellIsSelectable(cell);
    });

    if (!allEditable) {
        return;
    }

    this.end = element;
    this.setSelection(this.getCells());
};

SelectionRange.prototype.getCellInDirection = function (originCell, direction) {
    var rowIndex = originCell.parentNode.rowIndex,
        cellIndex = getCellIndex(originCell),
        table = originCell.parentNode.parentNode.parentNode,
        row = this.getRowByIndex(rowIndex + getDirectionYDelta(direction), table),
        cell = row && this.getCellByIndex(row, cellIndex + getDirectionXDelta(direction, originCell));

    if (direction === 'Left' && cell) {
        return this.cellIsVisible(cell) && cell || this.getCellInDirection(cell, direction);
    }
    if (direction === 'Up' && row && cell) {
        return this.cellIsVisible(cell) && cell || this.getCellInDirection(cell, direction);
    }
    if (direction === 'Right' && cell) {
        return this.cellIsVisible(cell) && cell || this.getCellInDirection(cell, direction);
    }
    if (direction === 'Down' && row && cell) {
        return this.cellIsVisible(cell) && cell || this.getCellInDirection(cell, direction);
    }

    return undefined;
};

SelectionRange.prototype.getSelectableCellInDirection = function (originCell, direction) {
    var cell = originCell;

    while (cell) {
        cell = this.getCellInDirection(cell, direction);

        if (cell && this.cellIsSelectable(cell)) {
            return cell;
        }
    }

    return originCell;
};

SelectionRange.prototype.getLastSelectableCellInDirection = function (originCell, direction) {
    var nextCell = originCell,
        cell = nextCell;

    do {
        cell = nextCell;
        nextCell = this.getSelectableCellInDirection(cell, direction);
    } while (nextCell !== cell);

    return cell;
};

SelectionRange.prototype.getCellsInArea = function (startCell, endCell) {
    var startX = Math.min(getCellIndex(startCell), getCellIndex(endCell)),
        startY = Math.min(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
        endX = Math.max(getCellIndex(startCell), getCellIndex(endCell)),
        endY = Math.max(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
        x, y,
        cell,
        cells = [];

    for (x = startX; x <= endX; ++x) {
        for (y = startY; y <= endY; ++y) {
            cell = this.getCellByIndex(this.getRowByIndex(y), x);
            if(this.cellIsVisible(cell)) {
                cells.push(cell || {});
            }
        }
    }

    return cells;
};

function getDirectionXDelta (direction, cell) {
    if (direction === 'Left') {
        return -1;
    }

    if (direction === 'Right') {
        return cell.colSpan;
    }

    return 0;
}

function getDirectionYDelta (direction) {
    if (direction === 'Up') {
        return -1;
    }

    if (direction === 'Down') {
        return 1;
    }

    return 0;
}

function getCellIndex (cell) {
    var row = cell.parentNode,
    colSpanSum = 0,
    i;

    for (i = 0; i < row.children.length; i++) {
        if (row.children[i] === cell) {
            break;
        }

        colSpanSum += row.children[i].colSpan;
    }

    return colSpanSum;
}
