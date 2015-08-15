'use strict';

var gulp = require('gulp');
var gulp_if = require('gulp-if');
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var envify = require('envify/custom');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var ghPages = require('gulp-gh-pages');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var NODE_ENV = process.env.NODE_ENV || 'development';
var BROWSERSYNC_PORT = parseInt(process.env.BROWSERSYNC_PORT) || 3000;
var RELEASE = (NODE_ENV === 'production');
var DEST = './build';

gulp.task('clean', del.bind(null, [DEST]));

gulp.task('scripts', function() {
  var bundler = browserify({
    entries: ['./web/js/main.js'],
    debug: !RELEASE
  });

  return bundler
    .transform(envify({
      _: 'purge',
      NODE_ENV: NODE_ENV
    }), {global: true})
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulp_if(RELEASE, uglify()))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEST))
    .pipe(reload({stream: true}));
});

gulp.task('monitor-js', function() {
  gulp.src(['./web/memory-stats.js', './web/monitor.js'])
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('html', function() {
  gulp.src('./web/*.html')
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('styles', function() {
  gulp.src('./web/*.css')
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('serve', ['default'], function() {
  browserSync({
    open: false,
    port: 3000,
    notify: false,
    server: 'build'
  });

  gulp.watch('./web/js/**/*.js', ['scripts']);
  gulp.watch('./web/**/*.html', ['html']);
  gulp.watch(['./web/memory-stats.js', './web/monitor.js'], ['monitor-js']);
  gulp.watch('./web/*.css', ['styles']);
});

gulp.task('deploy', ['default'], function () {
  return gulp.src(DEST + '/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['scripts', 'monitor-js', 'styles', 'html']);
