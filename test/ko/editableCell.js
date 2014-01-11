describe('editableCell binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCell');
    });

    describe('cell contents', function () {
        it('should be set from constant value', function () {
            var cell = createCell("editableCell: 'value'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should be set from variable value', function () {
            var cell = createCell("editableCell: variable");

            ko.applyBindings({variable: 'value'}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should be set from observable value', function () {
            var cell = createCell("editableCell: observable");

            ko.applyBindings({observable: ko.observable('value')}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should be updated from observable value', function () {
            var cell = createCell("editableCell: observable");
            var observable = ko.observable('value');

            ko.applyBindings({observable: observable}, cell);

            observable('updated value');
            cell.innerHTML.should.equal('updated value');
        });

        it('should be overridden by cellText helper binding', function () {
            var cell = createCell("editableCell: 'value', cellText: 'text'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('text');
        });

        it('should be overridden by template', function () {
            var cell = createCell("editableCell: 'value'");
            cell.appendChild(createElement('span', "text: 'template'"));

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal(
                '<span data-bind="text: \'template\'">template</span>');
        });
    });
});

describe('editableCellSelection binding handler', function () {
    it('should be registered', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });
});

function createCell (dataBind) {
    var container = document.createElement('div'),
        table = document.createElement('table'),
        tbody = document.createElement('tbody'),
        tr = document.createElement('tr'),
        td = createElement('td', dataBind);

    container.appendChild(table);
    table.appendChild(tbody);
    tbody.appendChild(tr);
    tr.appendChild(td);

    return td;
}

function createElement(tag, dataBind) {
    var element = document.createElement(tag);

    element.setAttribute('data-bind', dataBind);

    return element;
}