module.exports = SelectionRange;

// #### <a name="range"></a> `SelectionRange`
//
// The `SelectionRange` is used internally to hold the current selection, represented by a start and an end cell.
// In addition, it has functionality for moving and extending the selection inside the table.
function SelectionRange (getRowByIndex, getCellByIndex, cellIsSelectable, cellIsVisible) {
    var self = this;

    self.start = undefined;
    self.end = undefined;
    self.selection = ko.observableArray();

    // `moveInDirection` drops the current selection and makes the single cell in the specified `direction` the new selection.
    self.moveInDirection = function (direction) {
        var newStart = self.getSelectableCellInDirection(self.start, direction),
            startChanged = newStart !== self.start,
            belongingToOtherTable = newStart.parentNode.parentNode.parentNode !== self.start.parentNode.parentNode.parentNode;

        if (!belongingToOtherTable && (startChanged || self.start !== self.end)) {
            self.setStart(newStart);
        }

        if (startChanged) {
            return newStart;
        }
    };

    // `extendIndirection` keeps the current selection and extends it in the specified `direction`.
    self.extendInDirection = function (direction) {
        var newEnd = self.getCellInDirection(self.end, direction),
            endChanged = newEnd !== self.end;

        self.setEnd(newEnd);

        if (endChanged) {
            return newEnd;
        }
    };

    // `getCells` returnes the cells contained in the current selection.
    self.getCells = function () {
        return self.getCellsInArea(self.start, self.end);
    };

    // `clear` clears the current selection.
    self.clear = function () {
        self.start = undefined;
        self.end = undefined;
        self.selection([]);
    };

    self.setStart = function (element) {
        self.start = element;
        self.end = element;
        self.selection(self.getCells());
    };
    self.setEnd = function (element) {
        if (element === self.end) {
            return;
        }
        self.start = self.start || element;

        var cellsInArea = self.getCellsInArea(self.start, element),
            allEditable = true;

        ko.utils.arrayForEach(cellsInArea, function (cell) {
            allEditable = allEditable && cellIsSelectable(cell);
        });

        if (!allEditable) {
            return;
        }

        self.end = element;
        self.selection(self.getCells());
    };
    self.getCellInDirection = function (originCell, direction, rowIndex, cellIndex) {

        rowIndex = typeof rowIndex !== 'undefined' ? rowIndex : originCell.parentNode.rowIndex;
        cellIndex = typeof cellIndex !== 'undefined' ? cellIndex : getCellIndex(originCell);

        var row = getRowByIndex(rowIndex + getDirectionYDelta(direction), originCell.parentNode.parentNode.parentNode),
            cell = row && getCellByIndex(row, cellIndex + getDirectionXDelta(direction));

        if (direction === 'Left' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(originCell, direction, rowIndex, cellIndex - 1);
        }
        if (direction === 'Up' && row) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(originCell, direction, rowIndex - 1, cellIndex);
        }
        if (direction === 'Right' && cell) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(originCell, direction, rowIndex, cellIndex + 1);
        }
        if (direction === 'Down' && row) {
            return cellIsVisible(cell) && cell || self.getCellInDirection(originCell, direction, rowIndex + 1, cellIndex);
        }

        return originCell;
    };
    self.getSelectableCellInDirection = function (originCell, direction) {
        var lastCell,
            cell = originCell;

        while (cell !== lastCell) {
            lastCell = cell;
            cell = self.getCellInDirection(cell, direction);

            if (cellIsSelectable(cell)) {
                return cell;
            }
        }

        return originCell;
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
                cells.push(cell || {});
            }
        }

        return cells;
    };
    
    function getDirectionXDelta (direction) {
        if (direction === 'Left') {
            return -1;
        }

        if (direction === 'Right') {
            return 1;
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