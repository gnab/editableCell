require('shelljs/make');
require('shelljs/global');

// Targets

target.all = function () {
  target.lint();
  target.bundle();
  target.test();
  target.minify();
};

target.lint = function () {
  console.log('Linting...');
  run('jshint src', {silent: true});
};

target.bundle = function () {
  console.log('Bundling...');
  run('browserify -s editableCell src/editableCell.js', {silent: true}).output.to('out/editableCell.js');
};

target.minify = function () {
  console.log('Minifying...');
  run('uglifyjs out/editableCell.js', {silent: true}).output.to('out/editableCell.min.js');
};

target['test-bundle'] = function () {
  console.log('Bundling tests...');

  [
    "require('should');"
  ]
    .concat(find('./test')
      .filter(function(file) { return file.match(/\.js$/); })
      .map(function (file) { return "require('./" + file + "');" })
    )
      .join('\n')
      .to('_tests.js');

  run('browserify _tests.js', {silent: true}).output.to('out/tests.js');
  rm('_tests.js');
};

target.test = function () {
  target['test-bundle']();

  console.log('Running tests...');
  run('mocha-phantomjs test/runner.html');
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