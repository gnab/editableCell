ko.bindingHandlers.editableCell = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var table = $(element).parents('table')[0],
            selection = table._cellSelection,
            value = ko.utils.unwrapObservable(valueAccessor());

        if (selection === undefined) {
            table._cellSelection = selection = new ko.bindingHandlers.editableCell.Selection(table);
        }

        selection.registerCell(element);

        element._cellValue = valueAccessor;
        element._cellText = function () { return allBindingsAccessor().cellText || element._cellValue(); };
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindingsAccessor().cellReadOnly); };
        element._cellValueUpdater = function (newValue) {
            ko.bindingHandlers.editableCell.updateBindingValue('editableCell', element._cellValue, allBindingsAccessor, newValue);

            if (!ko.isObservable(element._cellValue())) {
                element.textContent = ko.utils.unwrapObservable(element._cellText());
            }
        };
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        element.textContent = ko.utils.unwrapObservable(element._cellText());
    },
    updateBindingValue: function (bindingName, valueAccessor, allBindingsAccessor, newValue) {
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
    },
    Selection: function (table) {
        var self = this;

        self.view = new ko.bindingHandlers.editableCell.SelectionView(table, self);
        self.range = new ko.bindingHandlers.editableCell.SelectionRange(cellIsSelectable);

        self.range.selection.subscribe(function (newSelection) {
            self.view.update(newSelection[0], newSelection[newSelection.length - 1]);
        });

        self.focus = self.view.focus;

        self.registerCell = function (cell) {
            ko.utils.registerEventHandler(cell, "mousedown", function (event) {
                if (self.isEditingCell(cell)) {
                    return;
                }

                self.onCellMouseDown(cell, event.shiftKey);
                event.preventDefault();
            });
            ko.utils.registerEventHandler(cell, "mouseup", function (event) {
                if (self.isEditingCell(cell)) {
                    event.stopPropagation();
                    return;
                }
            });
            ko.utils.registerEventHandler(cell, "mouseover", self.onCellMouseOver);
            ko.utils.registerEventHandler(cell, "blur", self.onCellBlur);
            ko.utils.registerEventHandler(cell, "keydown", self.onCellKeyDown);
        };

        self.updateCellValue = function (cell, newValue) {
            var value;

            if (!self.cellIsEditable(cell)) {
                return;
            }

            if (newValue === undefined) {
                value = cell.textContent;
                self.restoreCellText(cell);
            }
            else {
                value = newValue;
            }

            cell._cellValueUpdater(value);

            return value;
        };
        self.restoreCellText = function (cell) {
            cell.textContent = cell._oldTextContent;
        };

        self.startEditing = function () {
            self.startEditingCell(self.range.start);
        };
        self.startEditingCell = function (cell) {
            if (!self.cellIsEditable(cell)) {
                return;
            }

            if (self.range.start !== cell) {
                self.range.setStart(cell);
            }

            cell._oldTextContent = cell.textContent;
            cell.textContent = ko.utils.unwrapObservable(cell._cellValue());

            cell.contentEditable = true;
            cell.focus();
            document.execCommand('selectAll', false, null);
            self.view.element.style.pointerEvents = 'none';
        };
        self.isEditingCell = function (cell) {
            return cell.contentEditable === 'true';
        };
        self.cancelEditingCell = function (cell) {
            cell.contentEditable = false;
            self.restoreCellText(cell);
            self.view.element.style.pointerEvents = 'inherit';
        };
        self.endEditingCell = function (cell) {
            cell.contentEditable = false;
            self.view.element.style.pointerEvents = 'inherit';
            return self.updateCellValue(cell);
        };
        function cellIsSelectable (cell) {
            return cell._cellValue !== undefined;
        };
        self.cellIsEditable = function (cell) {
            return cell._cellReadOnly() !== true;
        }

        // <!-- Cell event handlers
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
        self.onCellKeyDown = function (event) {
            if (event.keyCode === 13) { // Return
                var value = self.endEditingCell(event.target);

                if (event.ctrlKey) {
                    ko.utils.arrayForEach(self.range.getCells(), function (cell) {
                        self.updateCellValue(cell, value);
                    });
                }

                self.onReturn(event, event.ctrlKey);
                self.focus();
                event.preventDefault();
            }
            else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) { // Arrows
                self.focus();
                self.onArrows(event);
                event.preventDefault();
            }
            else if (event.keyCode === 27) { // Escape
                self.cancelEditingCell(event.target);
                self.focus();
            }
        };
        self.onCellBlur = function (event) {
            if (event.target.contentEditable !== 'true') {
                return;
            }

            self.endEditingCell(event.target);
        };
        // Cell event handlers -->

        // <!-- Selection event handlers
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

                console.log(lineIndex + '-' + rowIndex);

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

            while (row-- > 1 && self.range.extendInDirection('Down')) { rows++ };
            while (col-- > 1 && self.range.extendInDirection('Right')) { cols++ };

            cells = self.range.getCells();

            for (col = 0; col < cols; col++) {
                for (row = 0; row < rows; row++) {
                    self.updateCellValue(cells[i], values[row][col]);
                    i++;
                }
            }
        };
        self.keyCodeIdentifier = {
            37: 'Left',
            38: 'Up',
            39: 'Right',
            40: 'Down'
        };
        // Selection event handlers -->
    },
    SelectionView: function (table, selection) {
        var self = this;

        self.element = document.createElement('div');
        self.element.style.position = 'absolute';
        self.element.style.display = 'none';
        self.element.tabIndex = -1;

        self.copyPasteElement = document.createElement('textarea');
        self.copyPasteElement.style.position = 'absolute';
        self.copyPasteElement.style.opacity = '0.0';
        self.copyPasteElement.style.display = 'none';

        table.appendChild(self.element);
        table.appendChild(self.copyPasteElement);

        self.show = function () {
            self.element.style.display = 'block';
            self.element.focus();
        };
        self.hide = function () {
            self.element.style.display = 'none';
        };
        self.focus = function () {
            self.element.focus();
        };
        self.update = function (start, end) {
            var top = Math.min(start.offsetTop, end.offsetTop),
                left = Math.min(start.offsetLeft, end.offsetLeft),
                bottom = Math.max(start.offsetTop + start.offsetHeight,
                                end.offsetTop + end.offsetHeight),
                right = Math.max(start.offsetLeft + start.offsetWidth,
                                end.offsetLeft + end.offsetWidth);

            self.element.style.top = top + 1 + 'px';
            self.element.style.left = left + 1 + 'px';
            self.element.style.height = bottom - top - 1 + 'px';
            self.element.style.width = right - left - 1 + 'px';
            self.element.style.backgroundColor = 'rgba(245, 142, 00, 0.15)';

            self.show();
        };
        self.beginDrag = function () {
            self.canDrag = true;
            ko.utils.registerEventHandler(self.element, 'mousemove', self.doBeginDrag);
        };
        self.doBeginDrag = function () {
            self.element.removeEventListener('mousemove', self.doBeginDrag);

            if (!self.canDrag) {
                return;
            }

            self.isDragging = true;
            self.element.style.pointerEvents = 'none';
        };
        self.endDrag = function () {
            self.element.removeEventListener('mousemove', self.doBeginDrag);
            self.isDragging = false;
            self.canDrag = false;
            self.element.style.pointerEvents = 'inherit';
        };

        ko.utils.registerEventHandler(document.getElementsByTagName('html')[0], "mouseup", function (event) {
            self.endDrag();
        });

        ko.utils.registerEventHandler(self.element, "mousedown", function (event) {
            self.hide();

            var cell = event.view.document.elementFromPoint(event.clientX, event.clientY);
            selection.onCellMouseDown(cell, event.shiftKey);

            event.preventDefault();
        });

        ko.utils.registerEventHandler(self.element, "dblclick", function (event) {
            selection.startEditing();
        });
        ko.utils.registerEventHandler(self.element, "keypress", function (event) {
            selection.startEditing();
        });

        ko.utils.registerEventHandler(self.element, "keydown", function (event) {
            if (event.keyCode === 13) { selection.onReturn(event); }
            else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) { selection.onArrows(event); }
            else if (event.keyCode === 86 && event.ctrlKey) {
                self.copyPasteElement.value = '';
                self.copyPasteElement.style.display = 'block';
                self.copyPasteElement.focus();
                setTimeout(function () {
                    selection.onPaste(self.copyPasteElement.value);
                    self.copyPasteElement.style.display = 'none';
                    self.focus();
                }, 0);
            }
            else if (event.keyCode === 67 && event.ctrlKey) {
                self.copyPasteElement.value = selection.onCopy();
                self.copyPasteElement.style.display = 'block';
                self.copyPasteElement.focus();
                document.execCommand('selectAll', false, null);
                setTimeout(function () {
                    self.copyPasteElement.style.display = 'none';
                    self.focus();
                }, 0);
            }
        });
    },
    SelectionRange: function (cellIsSelectable) {
        var self = this;

        self.start = undefined;
        self.end = undefined;
        self.selection = ko.observableArray();

        self.moveInDirection = function (direction) {
            var newStart = self.getSelectableCellInDirection(self.start, direction),
                startChanged = newStart !== self.start;

            if (newStart !== self.start || self.start !== self.end) {
                self.setStart(newStart);
            }

            return startChanged;
        };
        self.extendInDirection = function (direction) {
            var newEnd = self.getCellInDirection(self.end, direction),
                endChanged = newEnd !== self.end;

            self.setEnd(newEnd);

            return endChanged;
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

            rowIndex = typeof rowIndex !== 'undefined' ? rowIndex : originRow.rowIndex - self.getRowsOffset(originCell),
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
        self.getCells = function () {
            return self.getCellsInArea(self.start, self.end);
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
};
ko.bindingHandlers.editableCellSelection = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var table = element,
            selection = table._cellSelection;

        if (element.tagName !== 'TABLE') {
            throw new Error('editableCellSelection binding can only be applied to tables');
        }

        if (selection === undefined) {
            table._cellSelection = selection = new ko.bindingHandlers.editableCell.Selection(table);
        }

        selection.range.selection.subscribe(function (newSelection) {
            var selection = ko.utils.arrayMap(newSelection, function (cell) {
                return {
                    cell: cell,
                    value: cell._cellValue(),
                    text: cell._cellText()
                };
            });

            ko.bindingHandlers.editableCell.updateBindingValue('editableCellSelection', valueAccessor, allBindingsAccessor, selection);
        });
    }
};