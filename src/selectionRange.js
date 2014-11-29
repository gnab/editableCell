var EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill');

module.exports = SelectionRange;

SelectionRange.prototype = EventEmitter.prototype;

function SelectionRange (getRowByIndex, getCellByIndex, cellIsSelectable, cellIsVisible) {
    var self = this;

    self.start = undefined;
    self.end = undefined;
    self.selection = [];

    function setSelection (cells) {
        self.selection = cells;
        self.emit('change', cells);
    }

    self.moveInDirection = function (direction, toEnd) {
        var newStart = toEnd ? self.getLastSelectableCellInDirection(self.start, direction) : self.getSelectableCellInDirection(self.start, direction),
            startChanged = newStart !== self.start,
            belongingToOtherTable = newStart.parentNode.parentNode.parentNode !== self.start.parentNode.parentNode.parentNode;

        if (!belongingToOtherTable && (startChanged || self.start !== self.end)) {
            self.setStart(newStart);
        }

        if (startChanged) {
            return newStart;
        }
    };

    self.extendInDirection = function (direction, toEnd) {
        var newEnd = toEnd ? self.getLastSelectableCellInDirection(self.end, direction) : self.getCellInDirection(self.end, direction),
            endChanged = newEnd && newEnd !== self.end;

        if (newEnd) {
            self.setEnd(newEnd);
        }

        if (endChanged) {
            return newEnd;
        }
    };

    self.getCells = function () {
        return self.getCellsInArea(self.start, self.end);
    };

    self.clear = function () {
        self.start = undefined;
        self.end = undefined;
        setSelection([]);
    };

    self.destroy = function () {
        self.removeAllListeners('change');
        self.start = undefined;
        self.end = undefined;
        self.selection = null;
        self = null;
    };

    self.setStart = function (element) {
        self.start = element;
        self.end = element;
        setSelection(self.getCells());
    };
    self.setEnd = function (element) {
        if (element === self.end) {
            return;
        }
        self.start = self.start || element;

        var cellsInArea = self.getCellsInArea(self.start, element),
            allEditable = true;

        cellsInArea.forEach(function (cell) {
            allEditable = allEditable && cellIsSelectable(cell);
        });

        if (!allEditable) {
            return;
        }

        self.end = element;
        setSelection(self.getCells());
    };
    self.getCellInDirection = function (originCell, direction) {

        var rowIndex = originCell.parentNode.rowIndex;
        var cellIndex = getCellIndex(originCell);

        var table = originCell.parentNode.parentNode.parentNode,
            row = getRowByIndex(rowIndex + getDirectionYDelta(direction), table),
            cell = row && getCellByIndex(row, cellIndex + getDirectionXDelta(direction, originCell));

        if (direction === 'Left' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Up' && row && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Right' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }
        if (direction === 'Down' && row && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(cell, direction);
        }

        return undefined;
    };
    self.getSelectableCellInDirection = function (originCell, direction) {
        var lastCell,
            cell = originCell;

        while (cell) {
            cell = self.getCellInDirection(cell, direction);

            if (cell && cellIsSelectable(cell)) {
                return cell;
            }
        }

        return originCell;
    };
    self.getLastSelectableCellInDirection = function (originCell, direction) {
        var nextCell = originCell;
        do {
            cell = nextCell;
            nextCell = self.getSelectableCellInDirection(cell, direction);
        } while(nextCell !== cell);

        return cell;
    };
    self.getCellsInArea = function (startCell, endCell) {
        var startX = Math.min(getCellIndex(startCell), getCellIndex(endCell)),
            startY = Math.min(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            endX = Math.max(getCellIndex(startCell), getCellIndex(endCell)),
            endY = Math.max(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            x, y,
            cell,
            cells = [];

        for (x = startX; x <= endX; ++x) {
            for (y = startY; y <= endY; ++y) {
                cell = getCellByIndex(getRowByIndex(y), x);
                if(cellIsVisible(cell)) {
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
}
