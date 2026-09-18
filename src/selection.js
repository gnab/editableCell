"option strict";
var SelectionView = require('./selectionView'),
    SelectionRange = require('./selectionRange'),
    EventEmitter = require('events').EventEmitter,
    polyfill = require('./polyfill'), // jshint ignore: line
    events = require('./events'),
    ko = require('./ko/wrapper'),
    inherits = require('inherits');

module.exports = Selection;

inherits(Selection, EventEmitter);

function Selection(table, selectionMappings) {
    EventEmitter.call(this);

    this.table = table;
    this.selectionMappings = selectionMappings;

    this.range = new SelectionRange(this.getRowByIndex.bind(this), getCellByIndex, cellIsSelectable, cellIsVisible);
    this.view = new SelectionView(this.table, this);

    this.onSelectionChange = onSelectionChange.bind(this);
    this.onMouseDown = onMouseDown.bind(this);
    this.onMouseOver = onMouseOver.bind(this);
    this.onCellFocus = onCellFocus.bind(this);

    this.range.on('change', this.onSelectionChange);
}

Selection.prototype.setRange = function(start, end) {
    this.range.setStart(start);
    this.range.setEnd(end);
};

Selection.prototype.getRange = function() {
    return {
        start: this.range.start,
        end: this.range.end
    };
};

Selection.prototype.clear = function() {
    this.range.clear();
};

Selection.prototype.getCells = function() {
    return this.range.selection;
};

Selection.prototype.destroy = function() {
    this.view.destroy();
    this.view = null;

    this.range.destroy();
    this.range = null;

    this.removeAllListeners();

    this.table._cellSelection = null;
    this.table = null;
};

Selection.prototype.focus = function() {
    this.view.focus();
};

Selection.prototype.setScrollHost = function(scrollHost) {
    this.view.scrollHost = scrollHost;
};

Selection.prototype.registerCell = function(cell) {
    cell.addEventListener('mousedown', this.onMouseDown);
    cell.addEventListener('mouseover', this.onMouseOver);
    cell.addEventListener('focus', this.onCellFocus);
};

Selection.prototype.unregisterCell = function(cell) {
    /* note: we can be confident that we be cleaned up,
       because the call to registerCell is made only when initializing the binding,
       and unregisterCell is called by the binding's
       `ko.utils.domNodeDisposal.addDisposeCallback` */
    cell.removeEventListener('mousedown', this.onMouseDown);
    cell.removeEventListener('mouseover', this.onMouseOver);
    cell.removeEventListener('focus', this.onCellFocus);
};

Selection.prototype.onCellMouseDown = function(cell, shiftKey) {
    if (shiftKey) {
        this.range.setEnd(cell);
    } else {
        this.range.setStart(cell);
    }

    this.view.beginDrag();
    event.preventDefault();
};

Selection.prototype.updateCellValue = function(cell, newValue) {
    var value;

    if (!cellIsEditable(cell)) {
        return undefined;
    }

    if (newValue === undefined) {
        value = this.view.inputElement.value;
    } else {
        value = newValue;
    }

    cell._cellValueUpdater(value);

    return value;
};

Selection.prototype.startEditing = function() {
    this.startEditingCell(this.range.start);
};

Selection.prototype.startLockedEditing = function() {
    this.startEditingCell(this.range.start, true);
};

Selection.prototype.startEditingCell = function(cell, isLockedToCell) {
    if (!cellIsEditable(cell)) {
        return;
    }

    if (this.range.start !== cell) {
        this.range.setStart(cell);
    }

    this.view.inputElement.style.top = this.table.offsetTop + cell.offsetTop + 'px';
    this.view.inputElement.style.left = this.table.offsetLeft + cell.offsetLeft + 'px';
    this.view.inputElement.style.width = cell.offsetWidth + 'px';
    this.view.inputElement.style.height = cell.offsetHeight + 'px';
    this.view.inputElement.value = ko.utils.unwrapObservable(cell._cellValue());
    this.view.inputElement.style.display = 'block';
    this.view.inputElement.focus();
    this.view.isLockedToCell = isLockedToCell;

    document.execCommand('selectAll', false, null);
    this.view.element.style.pointerEvents = 'none';
};

Selection.prototype.isEditingCell = function(cell) {
    return this.view.inputElement.style.display === 'block';
};

Selection.prototype.cancelEditingCell = function(cell) {
    this.view.inputElement.style.display = 'none';
    this.view.element.style.pointerEvents = 'inherit';
};

Selection.prototype.endEditingCell = function(cell) {
    this.view.inputElement.style.display = 'none';
    this.view.element.style.pointerEvents = 'inherit';
    return this.updateCellValue(cell);
};

Selection.prototype.getRowByIndex = function(index, originTable) {
    if (isNaN(index)) { return null; }

    var targetTable = originTable || this.table;

    // Check if we're moving out of table
    if (index === -1 || index === targetTable.rows.length) {
        // Find selection mapping for table
        var selectionMapping = this.getSelectionMappingForTable(targetTable);

        // We can only proceed check if mapping exists, i.e. that editableCellSelection binding is used
        if (selectionMapping) {
            // Find all selection mappings for selection, excluding the one for the current table
            var tableMappings = this.selectionMappings.filter(function(tuple) {
                return tuple[0]() === selectionMapping[0]() && tuple[1] !== targetTable;
            });

            var tables = tableMappings.map(function(tuple) {
                return tuple[1];
            });

            var beforeTables = tables.filter(function(t) {
                return t.getBoundingClientRect().bottom <= targetTable.getBoundingClientRect().top;
            });

            var afterTables = tables.filter(function(t) {
                return t.getBoundingClientRect().top >= targetTable.getBoundingClientRect().bottom;
            });

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
};

Selection.prototype.getSelectionMappingForTable = function(table) {
    return this.selectionMappings.filter(function(tuple) {
        return tuple[1] === table;
    })[0];
};

Selection.prototype.updateSelectionMapping = function(newStartOrEnd) {
    var newTable = newStartOrEnd &&
                   newStartOrEnd.parentNode &&
                   newStartOrEnd.parentNode.parentNode &&
                   newStartOrEnd.parentNode.parentNode.parentNode;

    if (newTable !== this.table) {
        var mapping = this.getSelectionMappingForTable(newTable);
        if (mapping) {
            var selection = mapping[0]();
            selection([newStartOrEnd]);
        }
    }
};

Selection.prototype.onReturn = function(event, preventMove) {
    if (preventMove !== true) {
        this.range.moveInDirection('Down');
    }
    event.preventDefault();
};

Selection.prototype.onArrows = function(event) {
    var newStartOrEnd, newTable;

    if (event.shiftKey && !event.ctrlKey) {
        newStartOrEnd = this.range.extendInDirection(this.keyCodeIdentifier[event.keyCode]);
    } else if (!event.ctrlKey) {
        newStartOrEnd = this.range.moveInDirection(this.keyCodeIdentifier[event.keyCode]);
        newTable = newStartOrEnd && newStartOrEnd.parentNode && newStartOrEnd.parentNode.parentNode.parentNode;

        this.updateSelectionMapping(newStartOrEnd);
    } else if (event.ctrlKey) {
        if (event.shiftKey) {
            // Extend selection all the way to the end.
            newStartOrEnd = this.range.extendInDirection(this.keyCodeIdentifier[event.keyCode], true);
        } else {
            // Move selection all the way to the end.
            newStartOrEnd = this.range.moveInDirection(this.keyCodeIdentifier[event.keyCode], true);
            this.updateSelectionMapping(newStartOrEnd);
        }
    }

    if (newStartOrEnd) {
        event.preventDefault();
    }
};

Selection.prototype.onCopy = function() {
    var cells = this.range.getCells(),
        cols = cells[cells.length - 1].cellIndex - cells[0].cellIndex + 1,
        rows = cells.length / cols,
        lines = [],
        i = 0,
        copyEventData = {
            text: ''
        };

    cells.forEach(function(cell) {
        var lineIndex = i % rows,
            rowIndex = Math.floor(i / rows);

        lines[lineIndex] = lines[lineIndex] || [];
        lines[lineIndex][rowIndex] = ko.utils.unwrapObservable(cell._cellValue());

        i++;
    });

    copyEventData.text = lines.map(function(line) {
        return line.join('\t');
    }).join('\r\n');


    events.private.emit('beforeCopy', copyEventData);

    return copyEventData.text;
};

Selection.prototype.onPaste = function(text) {
    var selStart = this.range.getCells()[0],
        cells,
        values = text.trim().split(/\r?\n/).map(function(line) {
            return line.split('\t');
        }),
        row = values.length,
        col = values[0].length,
        rows = 1,
        cols = 1,
        i = 0;

    this.range.setStart(selStart);

    while (row-- > 1 && this.range.extendInDirection('Down')) {
        rows++;
    }
    while (col-- > 1 && this.range.extendInDirection('Right')) {
        cols++;
    }

    cells = this.range.getCells();

    for (col = 0; col < cols; col++) {
        for (row = 0; row < rows; row++) {
            this.updateCellValue(cells[i], values[row][col]);
            i++;
        }
    }
};

Selection.prototype.onTab = function(event) {
    this.range.start.focus();
};

Selection.prototype.keyCodeIdentifier = {
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down'
};

function onSelectionChange(newSelection) {
    this.emit('change', newSelection);
    if (newSelection.length === 0) {
        this.view.hide();
        return;
    }
    this.view.update(newSelection[0], newSelection[newSelection.length - 1]);
}

function onMouseDown(event) {
    var cell = event.target;
    if (this.isEditingCell(cell)) {
        return;
    }

    this.onCellMouseDown(cell, event.shiftKey);
    event.preventDefault();
}

function onMouseOver(event) {
    var cell = event.target;

    if (!this.view.isDragging) {
        return;
    }

    while (cell && !(cell.tagName === 'TD' || cell.tagName === 'TH')) {
        cell = cell.parentNode;
    }

    if (cell && cell !== this.range.end) {
        this.range.setEnd(cell);
    }
}

function onCellFocus(event) {
    var cell = event.target;

    if (cell === this.range.start) {
        return;
    }

    setTimeout(function() {
        this.range.setStart(cell);
    }, 0);
}

function cellIsSelectable(cell) {
    return cell._cellValue !== undefined;
}

function cellIsEditable(cell) {
    return cell && typeof cell._cellReadOnly === 'function' && cell._cellReadOnly() !== true;
}

function cellIsVisible(cell) {
    return cell && cell.offsetHeight !== 0;
}

function getCellByIndex(row, index) {
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
