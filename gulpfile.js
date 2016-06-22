'use strict';
var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var codeclimate = require('gulp-codeclimate-reporter');

gulp.task('static', function () {
    return gulp.src('**/*.js')
        .pipe(excludeGitignore())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
    nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
    return gulp.src('lib/**/*.js')
        .pipe(istanbul({
            includeUntested: true
        }))
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
    var mochaErr;

    process.env.OP_TEST = 1;

    gulp.src('test/**/*.js')
        .pipe(plumber())
        .pipe(mocha({reporter: 'spec'}))
        .on('error', function (err) {
            mochaErr = err;
        })
        .pipe(istanbul.writeReports())
        .on('end', function () {
            cb(mochaErr);
        });
});

gulp.task('coveralls', ['test'], function () {
    if (!process.env.CI) {
        return;
    }

    return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(coveralls());
});

gulp.task('codeclimate', ['test'], function () {
    if (!process.env.CODECLIMATE_REPO_TOKEN) {
        return;
    }

    return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(codeclimate({
            token: process.env.CODECLIMATE_REPO_TOKEN
        }));
});

gulp.task('prepublish', ['nsp']);
gulp.task('default', ['static', 'test', 'coveralls', 'codeclimate']);
