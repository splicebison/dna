/*jshint globalstrict:true, devel:true, newcap:false */
/*global require */

/**
 * Build CSS and JavaScript using `gulp`.
 *
 * Main targets are: `js`, `css`, `watch` and `server`.
 *
 * Run with `--production` to get minified sources.
 */

"use strict";

var argv            = require('yargs').argv,
    
    gulp            = require('gulp'),
    gutil           = require('gulp-util'),
    gulpif          = require('gulp-if'),
    notify          = require('gulp-notify'),
    connect         = require('gulp-connect'),

    source          = require('vinyl-source-stream'),
    buffer          = require('vinyl-buffer'),
    sourcemaps      = require('gulp-sourcemaps'),
    browserify      = require('browserify'),
    watchify        = require('watchify'),
    uglify          = require('gulp-uglify'),

    sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer');

// Directories and files
var baseDir = './',
    paths = {
    css: {
        src:  baseDir + 'scss/**/*.scss',
        dest: baseDir + 'css'
    },
    js: {
        src: baseDir + 'js/app.js',
        dest: baseDir + 'js',
        bundle: 'bundle.js'
    }
};

// Browserify bundler
var bundler = browserify({
    entries: [paths.js.src],
    debug: !argv.production,
    cache: {}, packageCache: {}, fullPaths: true
});

// Notify errors
function handleErrors(errorObject, callback) {
    notify.onError(errorObject.toString().split(': ').join(':\n')).apply(this, arguments);
    if (typeof this.emit === 'function') this.emit('end');
}

// Bundle JS files
function bundle() {
    return bundler
        .bundle()
        .pipe(source(paths.js.bundle))
        .pipe(buffer())
        .pipe(gulpif(!argv.production, sourcemaps.init({ loadMaps: true })))
        .pipe(gulpif(!argv.production, sourcemaps.write('./')))
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest(paths.js.dest))
        .pipe(notify({ message: 'JS task complete' }))
        .pipe(connect.reload());
}



/**
 * Scripts
 */
gulp.task('js', bundle);


/**
 * LiveReload server
 */
gulp.task('connect', function() {
    connect.server({
        livereload: true
    });
});




/**
 * Styles
 */
gulp.task('css', function () {
    return gulp.src([paths.css.src])
        .pipe(sass({
            outputStyle: argv.production ? 'compressed' : 'expanded',
            includePaths: require('node-neat').includePaths
        }))
        .on('error', handleErrors)
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(gulpif(!argv.production, sourcemaps.init({ loadMaps: true })))
        .pipe(gulpif(!argv.production, sourcemaps.write('./')))
        .pipe(gulp.dest(paths.css.dest))
        .pipe(notify({ message: 'CSS task complete' }))
        .pipe(connect.reload());
});



/**
 * Watchify
 */
gulp.task('watchify', function() {
    var watcher  = watchify(bundler);
    
    return watcher
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .on('update', bundle)
        .bundle()
        .pipe(source(paths.js.bundle))
        .pipe(gulp.dest(paths.js.dest))
        .pipe(connect.reload());
});


/**
 * Watch files
 */
gulp.task('css-watch', function () {
    gulp.watch([paths.css.src], ['css']);
});

gulp.task('watch', ['watchify', 'css-watch']);



/**
 * Spawn server or livereload
 */
gulp.task('serve', ['connect', 'watchify', 'css-watch']);




/**
 * Defaults
 */
gulp.task('default', ['js', 'css']);


