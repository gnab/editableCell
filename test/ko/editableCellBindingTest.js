/* globals describe, it, ko */
"use strict";

var editableCell = require('../../src/editableCell');
var utils = require('../utils');
require('should');

describe('editableCell binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCell');
    });

    describe('cell value initial assignment', function () {
        it('should assign constant value', function () {
            var cell = utils.createCell("editableCell: 'value'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should assign variable value', function () {
            var cell = utils.createCell("editableCell: variable");

            ko.applyBindings({variable: 'value'}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should assign observable value', function () {
            var cell = utils.createCell("editableCell: observable");

            ko.applyBindings({observable: ko.observable('value')}, cell);

            cell.innerHTML.should.equal('value');
        });

        it('should prefer cellText helper binding', function () {
            var cell = utils.createCell("editableCell: 'value', cellText: 'text'");

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal('text');
        });

        it('should prefer template', function () {
            var cell = utils.createCell("editableCell: 'value'");
            cell.appendChild(utils.createElement('span', "text: 'template'"));

            ko.applyBindings({}, cell);

            cell.innerHTML.should.equal(
                '<span data-bind="text: \'template\'">template</span>');
        });
    });

    describe('cell value synchronization', function () {
        it('should reassign cell value when observable value changes', function () {
            var cell = utils.createCell("editableCell: observable");
            var observable = ko.observable('value');

            ko.applyBindings({observable: observable}, cell);

            observable('updated value');
            cell.innerHTML.should.equal('updated value');
        });

        it('should update observable value when cell value changes', function () {
            var cell = utils.createCell("editableCell: observable") ;
            var observable = ko.observable('value');

            ko.applyBindings({observable: observable}, cell);

            editableCell.setCellValue(cell, 'updated value');

            observable().should.equal('updated value');
        });
    });
});
