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
        element._cellText = function () { return ko.utils.unwrapObservable(allBindingsAccessor().cellText); }
        element._cellReadOnly = function () { return ko.utils.unwrapObservable(allBindingsAccessor().cellReadOnly); };
        element._cellValueUpdater = function (newValue) {
            if (ko.isWriteableObservable(element._cellValue())) {
                element._cellValue()(newValue);
                return;
            }

            var propertyWriters = allBindingsAccessor()._ko_property_writers;
            if (propertyWriters && propertyWriters.editableCell) {
                propertyWriters.editableCell(newValue);
            }

            if (!ko.isObservable(element._cellValue())) {
                allBindingsAccessor().editableCell = newValue;
                element.textContent = ko.utils.unwrapObservable(element._cellText() || element._cellValue());
            }
        };
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        element.textContent = ko.utils.unwrapObservable(element._cellText() || element._cellValue());
    },
    Selection: function (table) {
        var self = this;

        self.view = new ko.bindingHandlers.editableCell.SelectionView(table, self);
        self.range = new ko.bindingHandlers.editableCell.SelectionRange(self, self.view);

        self.focus = self.view.focus;

        self.registerCell = function (cell) {
            ko.utils.registerEventHandler(cell, "mousedown", function (event) {
                self.onCellMouseDown(cell, event.shiftKey);
                event.preventDefault();
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
        };
        self.cancelEditingCell = function (cell) {
            cell.contentEditable = false;
            self.restoreCellText(cell);
        };
        self.endEditingCell = function (cell) {
            cell.contentEditable = false;
            return self.updateCellValue(cell);
        };
        self.cellIsSelectable = function (cell) {
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

        table.appendChild(self.element);

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
        });
    },
    SelectionRange: function (selection, view) {
        var self = this;

        self.start = undefined;
        self.end = undefined;

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
            view.update(self.start, self.end);
        };
        self.setEnd = function (element) {
            if (element === self.end) {
                return;
            }
            self.start = self.start || element;

            var cellsInArea = self.getCellsInArea(self.start, element),
                allEditable = true;

            ko.utils.arrayForEach(cellsInArea, function (cell) {
                allEditable = allEditable && selection.cellIsSelectable(cell);
            });

            if (!allEditable) {
                return;
            }

            self.end = element;
            view.update(self.start, self.end);
        };
        self.getCellInDirection = function (originCell, direction) {
            var cellIndex = originCell.cellIndex,
                originRow = originCell.parentNode,
                rowIndex = originRow.rowIndex - self.getRowsOffset(originCell);

            if (direction === 'Left' && cellIndex > 0) {
                return originRow.children[cellIndex - 1];
            }
            if (direction === 'Up' && rowIndex > 0) {
                return originRow.parentNode.children[rowIndex - 1].children[cellIndex];
            }
            if (direction === 'Right' && cellIndex < originCell.parentNode.children.length - 1) {
                return originRow.children[cellIndex + 1];
            }
            if (direction === 'Down' && rowIndex < originCell.parentNode.parentNode.children.length - 1) {
                return originRow.parentNode.children[rowIndex + 1].children[cellIndex];
            }

            return originCell;
        };
        self.getSelectableCellInDirection = function (originCell, direction) {
            var lastCell,
                cell = originCell;

            while (cell !== lastCell) {
                lastCell = cell;
                cell = self.getCellInDirection(cell, direction);

                if (selection.cellIsSelectable(cell)) {
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
                cells = [];

            for (x = startX; x <= endX; ++x) {
                for (y = startY; y <= endY; ++y) {
                    cells.push(startCell.parentNode.parentNode.children[y - rowsOffset].children[x]);
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