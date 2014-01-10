describe('editableCell binding handler', function () {
    it('should be registered', function () {
        ko.bindingHandlers.should.have.property('editableCell');
    });
});

describe('editableCellSelection binding handler', function () {
    it('should be registered', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });
});