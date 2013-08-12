require('shelljs/make');
require('shelljs/global');

// Targets

target.all = function () {
  target.lint();
  target.test();
  target.bundle();
  target.minify();
};

target.lint = function () {
  console.log('Linting...');
  run('jshint src', {silent: true});
};

target.test = function () {
  console.log('Running tests...');
  run('mocha --recursive test');
};

target.bundle = function () {
  console.log('Bundling...');
  run('browserify src/editableCell.js', {silent: true}).output.to('editableCell.js');
};

target.minify = function () {
  console.log('Minifying...');
  run('uglifyjs editableCell.js', {silent: true}).output.to('editableCell.min.js');
};

// Helper functions
var path = require('path');

function less (file) {
  return run('lessc -x ' + file, {silent: true}).output.replace(/\n/g, '');
}

function run (command, options) {
  var result = exec(path.join('node_modules/.bin/') + command, options);

  if (result.code !== 0) {
    if (!options || options.silent) {
      console.error(result.output);
    }
    exit(1);
  }

  return result;
}