var polyfill = require('./polyfill');

module.exports = SelectionView;

SelectionView.prototype = {};

function SelectionView (table, selection) {
    var self = this,
        html = document.getElementsByTagName('html')[0];

    self.element = document.createElement('div');
    self.element.className = 'editable-cell-selection';
    self.element.style.position = 'absolute';
    self.element.style.display = 'none';
    self.element.tabIndex = -1;

    self.inputElement = document.createElement('input');
    self.inputElement.className = 'editable-cell-input';
    self.inputElement.style.position = 'absolute';
    self.inputElement.style.display = 'none';

    self.copyPasteElement = document.createElement('textarea');
    self.copyPasteElement.style.position = 'absolute';
    self.copyPasteElement.style.opacity = '0.0';
    self.copyPasteElement.style.display = 'none';

    table.parentNode.insertBefore(self.element, table.nextSibling);
    table.parentNode.insertBefore(self.inputElement, table.nextSibling);
    table.appendChild(self.copyPasteElement);

    self.destroy = function () {
        self.element.removeEventListener('mousedown', self.onMouseDown);
        self.element.removeEventListener('dblclick', self.onDblClick);
        self.element.removeEventListener('keypress', self.onKeyPress);
        self.element.removeEventListener('keydown', self.onKeyDown);

        self.inputElement.removeEventListener('keydown', self.onInputKeydown);
        self.inputElement.removeEventListener('blur', onInputBlur);

        html.removeEventListener('mouseup', self.onMouseUp);

        table.parentNode.removeChild(self.element);
        table.parentNode.removeChild(self.inputElement);
        table.removeChild(self.copyPasteElement);
        
        selection = null;
    };
    self.show = function () {
        self.element.style.display = 'block';
        self.element.focus();

        var margin = 10,
            scrollHost = self.scrollHost || document.body,
            viewport = scrollHost.getBoundingClientRect(),
            rect = selection.getRange().end.getBoundingClientRect(),
            topOffset = rect.top - margin - viewport.top,
            bottomOffset = viewport.bottom - rect.bottom - margin;

        if (topOffset < 0) {
            scrollHost.scrollTop += topOffset;
        }
        else if (bottomOffset < 0) {
            scrollHost.scrollTop -= bottomOffset;
        }
    };
    
    function resolve (value) {
        if (typeof value === 'function') {
            return value();
        }

        return value;
    }

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

        self.element.style.top = table.offsetTop + top + 1 + 'px';
        self.element.style.left = table.offsetLeft + left + 1 + 'px';
        self.element.style.height = bottom - top - 1 + 'px';
        self.element.style.width = right - left - 1 + 'px';
        self.element.style.backgroundColor = 'rgba(245, 142, 00, 0.15)';

        self.show();
    };
    self.beginDrag = function () {
        self.canDrag = true;
        self.element.addEventListener('mousemove', self.doBeginDrag);
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

    self.onMouseUp = function (event) {
        self.endDrag();
    };
    self.onMouseDown = function (event) {
        if (event.button !== 0) {
            return;
        }

        self.hide();

        var cell = event.view.document.elementFromPoint(event.clientX, event.clientY);
        selection.onCellMouseDown(cell, event.shiftKey);

        event.preventDefault();
    };
    self.onDblClick = function (event) {
        selection.startLockedEditing();
    };
    self.onKeyPress = function (event) {
        selection.startEditing();
    };
    self.onKeyDown = function (event) {
        if (event.keyCode === 13) {
            selection.onReturn(event);
        } else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) {
            selection.onArrows(event);
        } else if (event.keyCode === 86 && event.ctrlKey) {
            self.copyPasteElement.value = '';
            self.copyPasteElement.style.display = 'block';
            self.copyPasteElement.focus();
            setTimeout(function () {
                selection.onPaste(self.copyPasteElement.value);
                self.copyPasteElement.style.display = 'none';
                self.focus();
            }, 0);
        } else if (event.keyCode === 67 && event.ctrlKey) {
            self.copyPasteElement.value = selection.onCopy();
            self.copyPasteElement.style.display = 'block';
            self.copyPasteElement.focus();
            document.execCommand('selectAll', false, null);
            setTimeout(function () {
                self.copyPasteElement.style.display = 'none';
                self.focus();
            }, 0);
        } else if (event.keyCode === 9) {
            selection.onTab(event);
        }
    };
    self.onInputKeydown = function (event) {
        var cell = selection.getRange().start;

        if (event.keyCode === 13) { // Return
            var value = selection.endEditingCell(cell);

            if (event.ctrlKey) {
                selection.getCells().forEach(function (cellInSelection) {
                    if (cellInSelection !== cell) {
                        selection.updateCellValue(cellInSelection, value);
                    }
                });
            }

            selection.onReturn(event, event.ctrlKey);
            self.focus();
            event.preventDefault();
        }
        else if (event.keyCode === 27) { // Escape
            selection.cancelEditingCell(cell);
            self.focus();
        }
        else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) { // Arrows
            if(!self.isLockedToCell) {
                self.focus();
                selection.onArrows(event);
                event.preventDefault();
            }
        }
    };
    function onInputBlur (event) {
        if (!selection.isEditingCell()) {
            return;
        }
        selection.endEditingCell(selection.getRange().start);
    }

    self.element.addEventListener("mousedown", self.onMouseDown);
    self.element.addEventListener("dblclick", self.onDblClick);
    self.element.addEventListener("keypress", self.onKeyPress);
    self.element.addEventListener("keydown", self.onKeyDown);

    self.inputElement.addEventListener("keydown", self.onInputKeydown);
    self.inputElement.addEventListener("blur", onInputBlur);

    html.addEventListener("mouseup", self.onMouseUp);
}