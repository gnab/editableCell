"option strict";
var polyfill = require('./polyfill'); // jshint ignore: line

module.exports = SelectionView;

SelectionView.prototype = {};

function SelectionView(table, selection) {
    this.table = table;
    this.selection = selection;

    this.element = undefined;
    this.inputElement = undefined;
    this.copyPasteElement = undefined;
    this.scrollHost = undefined; // Selection's setScrollHost sets this

    this.isDragging = false;
    this.canDrag = false;

    this.init();
}

SelectionView.prototype.init = function() {
    var tableParent = this.table.parentNode;

    this.element = createElement(document);
    this.inputElement = createInputElement(document);
    this.copyPasteElement = createCopyPasteElement(document);

    tableParent.insertBefore(this.element, this.table.nextSibling);
    tableParent.insertBefore(this.inputElement, this.table.nextSibling);
    this.table.appendChild(this.copyPasteElement);

    /* Bind functions, and then assign 'bound' functions to eventHandlers.
       This is neccessary because eventListeners are called with `this`
       set to window, so we need to bind the function. However, calling
       `bind(this)` creates a new reference, so we cannot remove the event
       listener by using the converse without keeping a reference.

       See http://stackoverflow.com/questions/11565471/removing-event-listener-which-was-added-with-bind
       for more info */

    this.onMouseDown = onMouseDown.bind(this);
    this.onDblClick = onDblClick.bind(this);
    this.onKeyPress = onKeyPress.bind(this);
    this.onKeyDown = onKeyDown.bind(this);

    this.element.addEventListener('mousedown', this.onMouseDown);
    this.element.addEventListener('dblclick', this.onDblClick);
    this.element.addEventListener('keypress', this.onKeyPress);
    this.element.addEventListener('keydown', this.onKeyDown);

    this.onInputKeydown = onInputKeydown.bind(this);
    this.onInputBlur = onInputBlur.bind(this);

    this.inputElement.addEventListener('keydown', this.onInputKeydown);
    this.inputElement.addEventListener('blur', this.onInputBlur);

    this.onMouseUp = onMouseUp.bind(this);
    //var html = window.document.getElementsByTagName('html')[0];
    //html.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener('mouseup', this.onMouseUp);
};

function createElement(document) {
    var elem = createElem(document, 'div', 'editable-cell-selection');

    elem.tabIndex = -1;
    elem.style.backgroundColor = 'rgba(245, 142, 00, 0.15)';
    elem.style.outline = '2px solid rgb(134, 186, 232)';

    return elem;
}

function createInputElement(document) {
    var elem = createElem(document, 'input', 'editable-cell-input');
    return elem;
}

function createCopyPasteElement(document){
    var elem = createElem(document, 'textarea');

    elem.style.opacity = '0.0';

    return elem;
}

function createElem(document, tag, className) {
    var elem = document.createElement(tag);
    return initElem(elem, className);
}

function initElem(elem, className){
    elem.className = className || '';
    elem.style.position = 'absolute';
    elem.style.display = 'none';
    return elem;
}

SelectionView.prototype.destroy = function () {
    this.element.removeEventListener('mousedown', this.onMouseDown);
    this.element.removeEventListener('dblclick', this.onDblClick);
    this.element.removeEventListener('keypress', this.onKeyPress);
    this.element.removeEventListener('keydown', this.onKeyDown);

    this.inputElement.removeEventListener('keydown', this.onInputKeydown);
    this.inputElement.removeEventListener('blur', this.onInputBlur);

    //var html = window.document.getElementsByTagName('html')[0];
    //html.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mouseup', this.onMouseUp);

    var tableParent = this.table.parentNode;
    tableParent.removeChild(this.element);
    tableParent.removeChild(this.inputElement);
    // if ko has re-created the element, it's possible that the copyPasteElement
    // has been re-parented
    if (this.table === this.copyPasteElement.parentNode) {
        this.table.removeChild(this.copyPasteElement);
    }

    this.element = null;
    this.inputElement = null;
    this.copyPasteElement = null;
    this.scrollHost = null;
    // note: this is *really* important because this is a circular reference
    this.selection = null;
};

SelectionView.prototype.show = function () {
    this.element.style.display = 'block';
    this.element.focus();

    var rect = this.selection.getRange().end.getBoundingClientRect(),
        horizontalMargin = rect.width,
        verticalMargin = rect.height,
        scrollHost = this.scrollHost || document.body,
        viewport = scrollHost.getBoundingClientRect(),
        viewportTop = Math.max(viewport.top, 0),
        viewportLeft = Math.max(viewport.left, 0),
        viewportBottom = Math.min(viewport.bottom, window.innerHeight),
        viewportRight = Math.min(viewport.right, window.innerWidth),
        topOffset = rect.top - verticalMargin - viewportTop,
        bottomOffset = viewportBottom - rect.bottom - verticalMargin,
        leftOffset = rect.left - horizontalMargin - viewportLeft,
        rightOffset = viewportRight - rect.right - horizontalMargin;

    if (topOffset < 0) {
        scrollHost.scrollTop += topOffset;
    }
    if (bottomOffset < 0) {
        scrollHost.scrollTop -= bottomOffset;
    }
    if (leftOffset < 0) {
        scrollHost.scrollLeft += leftOffset;
    }
    if (rightOffset < 0) {
        scrollHost.scrollLeft -= rightOffset;
    }
};

SelectionView.prototype.hide = function () {
    this.element.style.display = 'none';
};

SelectionView.prototype.focus = function () {
    this.element.focus();
};

SelectionView.prototype.update = function (start, end) {
    var top = Math.min(start.offsetTop, end.offsetTop),
        left = Math.min(start.offsetLeft, end.offsetLeft),
        bottom = Math.max(start.offsetTop + start.offsetHeight, end.offsetTop + end.offsetHeight),
        right = Math.max(start.offsetLeft + start.offsetWidth, end.offsetLeft + end.offsetWidth);

    this.element.style.top = this.table.offsetTop + top + 1 + 'px';
    this.element.style.left = this.table.offsetLeft + left + 1 + 'px';
    this.element.style.height = bottom - top - 1 + 'px';
    this.element.style.width = right - left - 1 + 'px';

    this.show();
};

/* Begin event handlers */

SelectionView.prototype.beginDrag = function () {
    this.canDrag = true;

    this.doBeginDrag = doBeginDrag.bind(this);
    this.element.addEventListener('mousemove', this.doBeginDrag);
};

function doBeginDrag() {
    this.element.removeEventListener('mousemove', this.doBeginDrag);

    if (!this.canDrag) {
        return;
    }

    this.isDragging = true;
    this.element.style.pointerEvents = 'none';
}

SelectionView.prototype.endDrag = function () {
    this.element.removeEventListener('mousemove', this.doBeginDrag);

    this.isDragging = false;
    this.canDrag = false;
    this.element.style.pointerEvents = 'inherit';
};

function onMouseUp(event) {
    this.endDrag();
}

function onMouseDown(event) {
    if (event.button !== 0) {
        return;
    }

    this.hide();

    var cell = event.view.document.elementFromPoint(event.clientX, event.clientY);
    this.selection.onCellMouseDown(cell, event.shiftKey);

    event.preventDefault();
}

function onDblClick(event) {
    this.selection.startLockedEditing();
}

function onKeyPress(event) {
    this.selection.startEditing();
}

function onKeyDown(event) {
    var self = this;

    if (event.keyCode === 13) {
        // ENTER
        this.selection.onReturn(event);

    } else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) {
        // ARROWS
        this.selection.onArrows(event);

    } else if (event.keyCode === 86 && (event.ctrlKey || event.metaKey)) {
        // (CTRL|CMD) + V
        this.copyPasteElement.style.display = 'block';
        this.copyPasteElement.focus();

        setTimeout(function () {
            self.selection.onPaste(self.copyPasteElement.value);
            self.copyPasteElement.value = '';
            self.copyPasteElement.style.display = 'none';
            self.focus();
        }, 0);

    } else if (event.keyCode === 67 && (event.ctrlKey || event.metaKey)) {
        // (CTRL|CMD) + C
        this.copyPasteElement.value = this.selection.onCopy();
        this.copyPasteElement.style.display = 'block';
        this.copyPasteElement.focus();

        document.execCommand('selectAll', false, null);

        setTimeout(function () {
            self.copyPasteElement.style.display = 'none';
            self.focus();
        }, 0);

    } else if (event.keyCode === 9) {
        // TAB
        this.selection.onTab(event);

    } else if (event.keyCode === 46 || (event.keyCode === 8 && event.ctrlKey)) {
        // DELETE key || CTRL + BACKSPACE
        this.selection.getCells().forEach(function (cellInSelection) {
            // The following was an opt-in model for handling `null`
            // where you would be expected to put <td data-value-null="true" data-bind="..."
            // for each cell that could support handling null

            /*
            var value = 0;
            if (cellInSelection.hasAttribute('data-value-null') &&
                Boolean(cellInSelection.getAttribute('data-value-null') === true)){
                    value = null;
            } */
            self.selection.updateCellValue(cellInSelection, null /* value */);
        });
    }
}

function onInputKeydown(event) {
    var cell = this.selection.getRange().start;

    if (event.keyCode === 13) { // Return
        var value = this.selection.endEditingCell(cell);

        if (event.ctrlKey) {
            var self = this;
            this.selection.getCells().forEach(function (cellInSelection) {
                if (cellInSelection !== cell) {
                    self.selection.updateCellValue(cellInSelection, value);
                }
            });
        }

        this.selection.onReturn(event, event.ctrlKey);
        this.focus();
        event.preventDefault();
    }
    else if (event.keyCode === 27) { // Escape
        this.selection.cancelEditingCell(cell);
        this.focus();
    }
    else if ([37, 38, 39, 40].indexOf(event.keyCode) !== -1) { // Arrows
        if(!this.isLockedToCell) {
            this.focus();
            this.selection.onArrows(event);
            event.preventDefault();
        }
    }
}

function onInputBlur(event) {
    if (!this.selection.isEditingCell()) {
        return;
    }

    this.selection.endEditingCell(this.selection.getRange().start);
}
/* End event handlers */
