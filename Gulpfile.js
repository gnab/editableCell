'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    util = require('gulp-util'),
    runSequence = require('run-sequence').use(gulp),
    del = require('del');

var config = {
    source: ['./src/editableCell.js'],
    target: './out',
    externals: ['knockout', 'jquery']
};

gulp.task('default', function(done) {
    return runSequence('clean', 'bundle', 'lint', 'test', done);
});

gulp.task('clean', function(done) {
    del(config.target, {
        force: true
    }, done);
});

gulp.task('lint', function() {
    return gulp.src(['./src/**/*.+(js)', './Gulpfile.js'])
        .pipe($.jshint('.jshintrc'))
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('bundle', function() {
    browserify(config.source, {
            debug: false,
            standalone: 'editableCell',
            silent: true
        })
        .external(config.externals)
        .on('log', function(msg) {
            util.log(util.colors.yellow('[Browserify]', msg));
        })
        .on('error', function(err) {
            util.log(util.colors.red('[Browserify]', err));
        })
        .bundle()
        .pipe(source('editableCell.js'))
        .pipe($.replace('define(e);', 'define([\'knockout\'],e);'))
        .pipe(buffer())
        .pipe(gulp.dest(config.target))
        .pipe($.sourcemaps.init({
            loadMaps: true
        }))
        .pipe($.uglify())
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.target));
});

gulp.task('_bundle_tests', function(done) {
    browserify('./test/index.js', {
            silent: true,
            baseDir: './'
        })
        .on('error', function(err) {
            util.log(util.colors.red('[Browserify]', err));
        })
        .bundle()
        .pipe(source('tests.js'))
        .pipe(buffer())
        .pipe(gulp.dest(config.target));

    done();
});

gulp.task('_test', function(done) {
    var stream = $.mochaPhantomjs();
    stream.on('phantomjsExit', function() {
        done();
    });

    return gulp.src(['./test/*.html'])
        .pipe(stream)
        .on('error', function(err) {
            util.log(util.colors.red('[Err]', err));
            this.emit('end');
        });
});

gulp.task('test', function(done) {
    return runSequence('_bundle_tests', ['_test'], done);
});
