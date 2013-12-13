var SelectionView = require('./selectionView'),
    SelectionRange = require('./selectionRange');

module.exports = Selection;

// #### <a name="selection"></a> `Selection`
//
// The `Selection` is used internally to represent the selection for a single table,
// comprising a [view](#view) and a [range](#range), as well as functionality for handling table cell
// operations like selecting, editing and copy and paste.
function Selection (table) {
    var self = this,
        selectionSubscription;

    self.view = new SelectionView(table, self);
    self.range = new SelectionRange(cellIsSelectable);

    selectionSubscription = self.range.selection.subscribe(function (newSelection) {
        if (newSelection.length === 0) {
            self.view.hide();
            return;
        }
        self.view.update(newSelection[0], newSelection[newSelection.length - 1]);
    });

    ko.utils.domNodeDisposal.addDisposeCallback(table, function () {
        selectionSubscription.dispose();

        self.view.destroy();
        self.range.clear();

        table._cellSelection = null;
    });

    self.focus = self.view.focus;

    self.registerCell = function (cell) {
        ko.utils.registerEventHandler(cell, "mousedown", self.onMouseDown);
        ko.utils.registerEventHandler(cell, "mouseover", self.onCellMouseOver);
        ko.utils.registerEventHandler(cell, "focus", self.onCellFocus);
    };

    self.unregisterCell = function (cell) {
        cell.removeEventListener('mousedown', self.onMouseDown);
        cell.removeEventListener('mouseover', self.onCellMouseOver);
        cell.removeEventListener('focus', self.onCellFocus);
    };

    self.onMouseDown = function (event) {
        if (self.isEditingCell()) {
            return;
        }

        self.onCellMouseDown(this, event.shiftKey);
        event.preventDefault();
    };

    self.updateCellValue = function (cell, newValue) {
        var value;

        if (!cellIsEditable(cell)) {
            return undefined;
        }

        if (newValue === undefined) {
            value = self.view.inputElement.value;
        }
        else {
            value = newValue;
        }

        cell._cellValueUpdater(value);

        return value;
    };

    self.startEditing = function () {
        self.startEditingCell(self.range.start);
    };

    self.startLockedEditing = function () {
        self.startEditingCell(self.range.start, true);
    };

    self.startEditingCell = function (cell, isLockedToCell) {
        if (!cellIsEditable(cell)) {
            return;
        }

        if (self.range.start !== cell) {
            self.range.setStart(cell);
        }

        self.view.inputElement.style.top = cell.offsetTop + 'px';
        self.view.inputElement.style.left = cell.offsetLeft + 'px';
        self.view.inputElement.style.width = cell.offsetWidth + 'px';
        self.view.inputElement.style.height = cell.offsetHeight + 'px';
        self.view.inputElement.value = ko.utils.unwrapObservable(cell._cellValue());
        self.view.inputElement.style.display = 'block';
        self.view.inputElement.focus();
        self.view.isLockedToCell = isLockedToCell;

        document.execCommand('selectAll', false, null);
        self.view.element.style.pointerEvents = 'none';
    };
    self.isEditingCell = function (cell) {
        return self.view.inputElement.style.display === 'block';
    };
    self.cancelEditingCell = function (cell) {
        self.view.inputElement.style.display = 'none';
        self.view.element.style.pointerEvents = 'inherit';
    };
    self.endEditingCell = function (cell) {
        self.view.inputElement.style.display = 'none';
        self.view.element.style.pointerEvents = 'inherit';
        return self.updateCellValue(cell);
    };
    function cellIsSelectable(cell) {
        return cell._cellValue !== undefined;
    }
    function cellIsEditable(cell) {
        return cell._cellReadOnly() !== true;
    }
    self.onCellMouseDown = function (cell, shiftKey) {
        if (shiftKey) {
            self.range.setEnd(cell);
        }
        else {
            self.range.setStart(cell);
        }

        self.view.beginDrag();
        event.preventDefault();
    };
    self.onCellMouseOver = function (event) {
        if (self.view.isDragging && event.target !== self.range.end) {
            self.range.setEnd(event.target);
        }
    };
    self.onCellFocus = function (event) {
        if (event.target === self.range.start) {
            return;
        }

        setTimeout(function () {
            self.range.setStart(event.target);
        }, 0);
    };
    self.onReturn = function (event, preventMove) {
        if (preventMove !== true) {
            self.range.moveInDirection('Down');
        }
        event.preventDefault();
    };
    self.onArrows = function (event) {
        var preventDefault;

        if (event.shiftKey && !event.ctrlKey) {
            preventDefault = self.range.extendInDirection(self.keyCodeIdentifier[event.keyCode]);
        }
        else if (!event.ctrlKey) {
            preventDefault = self.range.moveInDirection(self.keyCodeIdentifier[event.keyCode]);
        }

        if (preventDefault) {
            event.preventDefault();
        }
    };
    self.onCopy = function () {
        var cells = self.range.getCells(),
            cols = cells[cells.length - 1].cellIndex - cells[0].cellIndex + 1,
            rows = cells.length / cols,
            lines = [],
            i = 0;

        ko.utils.arrayForEach(cells, function (cell) {
            var lineIndex = i % rows,
                rowIndex = Math.floor(i / rows);

            lines[lineIndex] = lines[lineIndex] || [];
            lines[lineIndex][rowIndex] = ko.utils.unwrapObservable(cell._cellValue());

            i++;
        });

        return ko.utils.arrayMap(lines, function (line) {
            return line.join('\t');
        }).join('\r\n');
    };
    self.onPaste = function (text) {
        var selStart = self.range.getCells()[0],
            cells,
            values = ko.utils.arrayMap(text.trim().split(/\r?\n/), function (line) { return line.split('\t'); }),
            row = values.length,
            col = values[0].length,
            rows = 1,
            cols = 1,
            i = 0;

        self.range.setStart(selStart);

        while (row-- > 1 && self.range.extendInDirection('Down')) { rows++; }
        while (col-- > 1 && self.range.extendInDirection('Right')) { cols++; }

        cells = self.range.getCells();

        for (col = 0; col < cols; col++) {
            for (row = 0; row < rows; row++) {
                self.updateCellValue(cells[i], values[row][col]);
                i++;
            }
        }
    };
    self.onTab = function (event) {
        self.range.start.focus();
    };
    self.keyCodeIdentifier = {
        37: 'Left',
        38: 'Up',
        39: 'Right',
        40: 'Down'
    };
}
