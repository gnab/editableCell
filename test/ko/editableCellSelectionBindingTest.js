/* globals describe, it, ko */
"use strict";

var editableCell = require('../../src/editableCell');
var utils = require('../utils');
require('should');

describe('editableCellSelection binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });

    describe('selection synchronization', function () {
        it('should be empty initially', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            selection().should.eql([]);
        });

        it('should contain cell when selected', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            editableCell.selectCell(cell);

            selection().should.eql([{
                cell: cell,
                value: 'value',
                content: 'value'
            }]);
        });

        it('should select cell when updated', function () {
            var cell = utils.createCell("editableCell: 'value'");
            var table = cell.parentNode.parentNode.parentNode;
            var selection = ko.observableArray();

            table.setAttribute('data-bind', 'editableCellSelection: selection');
            document.body.appendChild(table);
            ko.applyBindings({selection: selection}, table);

            selection([cell]);

            editableCell.getTableSelection(table).getCells().should.eql([cell]);
        });

        it('should not contain hidden cells', function () {
            var aCell = utils.createCell("editableCell: 'a'");
            var row = aCell.parentNode;
            var table = row.parentNode.parentNode;

            var bCell = utils.addCell(row, "editableCell: 'b'");
            var cCell = utils.addCell(row, "editableCell: 'c'");
            bCell.style.display = 'none';

            document.body.appendChild(table);

            var selection = ko.observableArray();
            table.setAttribute('data-bind', 'editableCellSelection: selection');
            ko.applyBindings({selection: selection}, table);

            selection([aCell, cCell]);

            selection().should.eql([{
                cell: aCell,
                value: 'a',
                content: 'a'
            }, {
                cell: cCell,
                value: 'c',
                content: 'c'
            }]);
        });
    });
});
