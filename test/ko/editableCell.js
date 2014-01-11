describe('editableCell binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCell');
    });

    describe('cell content', function () {
        it('should be set from constant', function () {
            var cell = createCell();
            cell.setAttribute('data-bind', "editableCell: 'some text'");

            ko.applyBindings({}, cell);

            cell.innerText.should.equal('some text');
        });

        it('should be set from variable', function () {
            var cell = createCell();
            cell.setAttribute('data-bind', "editableCell: variable");

            ko.applyBindings({variable: 'some text'}, cell);

            cell.innerText.should.equal('some text');
        });

        it('should be set from observable', function () {
            var cell = createCell();
            cell.setAttribute('data-bind', "editableCell: observable");

            ko.applyBindings({observable: ko.observable('some text')}, cell);

            cell.innerText.should.equal('some text');
        });

        it('should be updated from observable', function () {
            var cell = createCell();
            cell.setAttribute('data-bind', "editableCell: observable");

            var observable = ko.observable('some text');

            ko.applyBindings({observable: observable}, cell);

            observable('some more text');
            cell.innerText.should.equal('some more text');
        });
    });
});

describe('editableCellSelection binding handler', function () {
    it('should be registered', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });
});

function createCell () {
    var container = document.createElement('div'),
        table = document.createElement('table'),
        tbody = document.createElement('tbody'),
        tr = document.createElement('tr'),
        td = document.createElement('td');

    container.appendChild(table);
    table.appendChild(tbody);
    tbody.appendChild(tr);
    tr.appendChild(td);

    return td;
}