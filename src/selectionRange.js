module.exports = SelectionRange;

// #### <a name="range"></a> `SelectionRange`
//
// The `SelectionRange` is used internally to hold the current selection, represented by a start and an end cell.
// In addition, it has functionality for moving and extending the selection inside the table.
function SelectionRange (cellIsSelectable) {
    var self = this;

    self.start = undefined;
    self.end = undefined;
    self.selection = ko.observableArray();

    // `moveInDirection` drops the current selection and makes the single cell in the specified `direction` the new selection.
    self.moveInDirection = function (direction) {
        var newStart = self.getSelectableCellInDirection(self.start, direction),
            startChanged = newStart !== self.start;

        if (newStart !== self.start || self.start !== self.end) {
            self.setStart(newStart);
        }

        return startChanged;
    };

    // `extendIndirection` keeps the current selection and extends it in the specified `direction`.
    self.extendInDirection = function (direction) {
        var newEnd = self.getCellInDirection(self.end, direction),
            endChanged = newEnd !== self.end;

        self.setEnd(newEnd);

        return endChanged;
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
        var originRow = originCell.parentNode,
            cell;

        rowIndex = typeof rowIndex !== 'undefined' ? rowIndex : originRow.rowIndex - self.getRowsOffset(originCell);
        cellIndex = typeof cellIndex !== 'undefined' ? cellIndex : originCell.cellIndex;

        if (direction === 'Left' && cellIndex > 0) {
            return originRow.children[cellIndex - 1];
        }
        if (direction === 'Up' && rowIndex > 0) {
            cell = originRow.parentNode.children[rowIndex - 1].children[cellIndex];
            return cell || self.getCellInDirection(originCell, direction, rowIndex - 1, cellIndex);
        }
        if (direction === 'Right' && cellIndex < originCell.parentNode.children.length - 1) {
            return originRow.children[cellIndex + 1];
        }
        if (direction === 'Down' && rowIndex < originCell.parentNode.parentNode.children.length - 1) {
            cell = originRow.parentNode.children[rowIndex + 1].children[cellIndex];
            return cell || self.getCellInDirection(originCell, direction, rowIndex + 1, cellIndex);
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
        var startX = Math.min(startCell.cellIndex, endCell.cellIndex),
            startY = Math.min(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            endX = Math.max(startCell.cellIndex, endCell.cellIndex),
            endY = Math.max(startCell.parentNode.rowIndex, endCell.parentNode.rowIndex),
            x, y,
            rowsOffset = self.getRowsOffset(startCell),
            cell,
            cells = [];

        for (x = startX; x <= endX; ++x) {
            for (y = startY; y <= endY; ++y) {
                cell = startCell.parentNode.parentNode.children[y - rowsOffset].children[x];
                cells.push(cell || {});
            }
        }

        return cells;
    };
    self.getRowsOffset = function (cell) {
        var rows = cell.parentNode.parentNode.children;

        return rows[rows.length - 1].rowIndex + 1 - rows.length;
    };
}
