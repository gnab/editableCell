/* global ko */
if (typeof ko !== 'undefined') {
  module.exports = ko;
}
else {
  module.exports = window.require('knockout');
}
