var SelectionView = require('./selectionView'),
    SelectionRange = require('./selectionRange'),
    EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill'),
    events = require('./events'),
    ko = require('./ko/wrapper');

module.exports = Selection;

Selection.prototype = EventEmitter.prototype;

function Selection (table, selectionMappings) {
    var self = this,
        range = new SelectionRange(getRowByIndex, getCellByIndex, cellIsSelectable, cellIsVisible);

    self.view = new SelectionView(table, self);

    range.on('change', function (newSelection) {
        self.emit('change', newSelection);
        if (newSelection.length === 0) {
            self.view.hide();
            return;
        }
        self.view.update(newSelection[0], newSelection[newSelection.length - 1]);
    });

    self.setRange = function (start, end) {
        range.setStart(start);
        range.setEnd(end);
    };

    self.getRange = function () {
        return {
            start: range.start,
            end: range.end
        };
    };

    self.clear = range.clear;

    self.getCells = function () {
        return range.selection;
    };

    self.destroy = function () {
        self.view.destroy();
        self.view = null;
        range.destroy();
        range = null;

        self.removeAllListeners();

        table._cellSelection = null;
        table = null;
        self = null;
    };

    self.focus = function () {
        self.view.focus();
    };

    self.setScrollHost = function (scrollHost) {
        self.view.scrollHost = scrollHost;
    };

    self.registerCell = function (cell) {
        cell.addEventListener("mousedown", onMouseDown);
        cell.addEventListener("mouseover", onCellMouseOver);
        cell.addEventListener("focus", onCellFocus);
    };

    self.unregisterCell = function (cell) {
        cell.removeEventListener('mousedown', onMouseDown);
        cell.removeEventListener('mouseover', onCellMouseOver);
        cell.removeEventListener('focus', onCellFocus);
    };

    function onMouseDown (event) {
        if (self.isEditingCell()) {
            return;
        }

        self.onCellMouseDown(this, event.shiftKey);
        event.preventDefault();
    }

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
        self.startEditingCell(range.start);
    };

    self.startLockedEditing = function () {
        self.startEditingCell(range.start, true);
    };

    self.startEditingCell = function (cell, isLockedToCell) {
        if (!cellIsEditable(cell)) {
            return;
        }

        if (range.start !== cell) {
            range.setStart(cell);
        }

        self.view.inputElement.style.top = table.offsetTop + cell.offsetTop + 'px';
        self.view.inputElement.style.left = table.offsetLeft + cell.offsetLeft + 'px';
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
    function cellIsVisible (cell) {
        return cell && cell.offsetHeight !== 0;
    }
    function getRowByIndex (index, originTable) {
        var targetTable = originTable || table;

        // Check if we're moving out of table
        if (index === -1 || index === targetTable.rows.length) {
            // Find selection mapping for table
            var selectionMapping = getSelectionMappingForTable(targetTable);

            // We can only proceed check if mapping exists, i.e. that editableCellSelection binding is used
            if (selectionMapping) {
                // Find all selection mappings for selection, excluding the one for the current table
                var tableMappings = selectionMappings.filter(function (tuple) {
                    return tuple[0]() === selectionMapping[0]() && tuple[1] !== targetTable;
                });

                var tables = tableMappings.map(function (tuple) { return tuple[1]; });
                var beforeTables = tables.filter(function (t) { return t.getBoundingClientRect().bottom <= table.getBoundingClientRect().top; });
                var afterTables = tables.filter(function (t) { return t.getBoundingClientRect().top >= table.getBoundingClientRect().bottom; });

                // Moving upwards
                if (index === -1 && beforeTables.length) {
                    targetTable = beforeTables[beforeTables.length - 1];
                    index = targetTable.rows.length - 1;
                }
                // Moving downwards
                else if (index === targetTable.rows.length && afterTables.length) {
                    targetTable = afterTables[0];
                    index = 0;
                }
            }
        }

        return targetTable.rows[index];
    }
    function getCellByIndex (row, index) {
        var i, colSpanSum = 0;

        for (i = 0; i < row.children.length; i++) {
            if (index < colSpanSum) {
                return row.children[i - 1];
            }
            if (index === colSpanSum) {
                return row.children[i];
            }

            colSpanSum += row.children[i].colSpan;
        }
    }
    function getSelectionMappingForTable (table) {
        return selectionMappings.filter(function (tuple) {
                return tuple[1] === table;
        })[0];
    }
    function updateSelectionMapping(newStartOrEnd) {
        var newTable = newStartOrEnd && newStartOrEnd.parentNode && newStartOrEnd.parentNode.parentNode.parentNode;

        if (newTable !== table) {
            var mapping = getSelectionMappingForTable(newTable);
            if (mapping) {
                var selection = mapping[0]();
                selection([newStartOrEnd]);
            }
        }
    }
    self.onCellMouseDown = function (cell, shiftKey) {
        if (shiftKey) {
            range.setEnd(cell);
        }
        else {
            range.setStart(cell);
        }

        self.view.beginDrag();
        event.preventDefault();
    };
    function onCellMouseOver (event) {
        var cell = event.target;

        if (!self.view.isDragging) {
            return;
        }

        while (cell && !(cell.tagName === 'TD' || cell.tagName === 'TH')) {
            cell = cell.parentNode;
        }

        if (cell && cell !== range.end) {
            range.setEnd(cell);
        }
    }
    function onCellFocus (event) {
        if (event.target === range.start) {
            return;
        }

        setTimeout(function () {
            range.setStart(event.target);
        }, 0);
    }
    self.onReturn = function (event, preventMove) {
        if (preventMove !== true) {
            range.moveInDirection('Down');
        }
        event.preventDefault();
    };
    self.onArrows = function (event) {
        var newStartOrEnd, newTable;

        if (event.shiftKey && !event.ctrlKey) {
            newStartOrEnd = range.extendInDirection(self.keyCodeIdentifier[event.keyCode]);
        }
        else if (!event.ctrlKey) {
            newStartOrEnd = range.moveInDirection(self.keyCodeIdentifier[event.keyCode]);
            newTable = newStartOrEnd && newStartOrEnd.parentNode && newStartOrEnd.parentNode.parentNode.parentNode;

            updateSelectionMapping(newStartOrEnd);
        } else if(event.ctrlKey) {
            if(event.shiftKey){
                // Extend selection all the way to the end.
                newStartOrEnd = range.extendInDirection(self.keyCodeIdentifier[event.keyCode], true);
            }
            else {
                // Move selection all the way to the end.
                newStartOrEnd = range.moveInDirection(self.keyCodeIdentifier[event.keyCode], true);
                updateSelectionMapping(newStartOrEnd);
            }
        }

        if (newStartOrEnd) {
            event.preventDefault();
        }
    };
    self.onCopy = function () {
        var cells = range.getCells(),
            cols = cells[cells.length - 1].cellIndex - cells[0].cellIndex + 1,
            rows = cells.length / cols,
            lines = [],
            i = 0,
            copyEventData = {text: ''};

        cells.forEach(function (cell) {
            var lineIndex = i % rows,
                rowIndex = Math.floor(i / rows);

            lines[lineIndex] = lines[lineIndex] || [];
            lines[lineIndex][rowIndex] = ko.utils.unwrapObservable(cell._cellValue());

            i++;
        });

        copyEventData.text = lines.map(function (line) {
            return line.join('\t');
        }).join('\r\n');


        events.private.emit('beforeCopy', copyEventData);

        return copyEventData.text;
    };
    self.onPaste = function (text) {
        var selStart = range.getCells()[0],
            cells,
            values = text.trim().split(/\r?\n/).map(function (line) { return line.split('\t'); }),
            row = values.length,
            col = values[0].length,
            rows = 1,
            cols = 1,
            i = 0;

        range.setStart(selStart);

        while (row-- > 1 && range.extendInDirection('Down')) { rows++; }
        while (col-- > 1 && range.extendInDirection('Right')) { cols++; }

        cells = range.getCells();

        for (col = 0; col < cols; col++) {
            for (row = 0; row < rows; row++) {
                self.updateCellValue(cells[i], values[row][col]);
                i++;
            }
        }
    };
    self.onTab = function (event) {
        range.start.focus();
    };
    self.keyCodeIdentifier = {
        37: 'Left',
        38: 'Up',
        39: 'Right',
        40: 'Down'
    };
}
