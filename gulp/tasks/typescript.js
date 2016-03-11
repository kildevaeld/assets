'use strict';

const gulp = require('gulp'),
    fs = require('fs'),
    readdir = require('recursive-readdir'),
    tsc = require('gulp-typescript'),
    babel = require('gulp-babel'),
    merge = require('merge2');

const project = tsc.createProject('tsconfig.json')

gulp.task('typescript', () => {
    let result = project.src()
    .pipe(tsc(project))
    
    let js = result.js.pipe(babel({
        presets: ['es2015-without-regenerator']
    }))
    
    return merge([
        result.dts.pipe(gulp.dest('lib')),
        js.pipe(gulp.dest('lib'))
    ])
    .pipe(gulp.dest('lib'))
})

gulp.task('addfiles', (done) => {
  var tsconfig = require(process.cwd() + '/tsconfig.json');
  readdir(process.cwd() + '/src', function (e, files) {
    tsconfig.files = files.filter(function (file) {
      var len = file.length
      return file.substr(len - 3) === '.ts' && file.substr(len - 5) !== ".d.ts";
    }).map(function (file) {
      return file.replace(process.cwd() +'/', '')
    });

    fs.writeFile('./tsconfig.json', JSON.stringify(tsconfig,null,2), function () {
      console.log('%s files added',tsconfig.files.length);
      done();
    });
  })
})