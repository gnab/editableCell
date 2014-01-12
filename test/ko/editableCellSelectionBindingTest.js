describe('editableCellSelection binding', function () {
    it('should be registered with Knockout', function () {
        ko.bindingHandlers.should.have.property('editableCellSelection');
    });
});