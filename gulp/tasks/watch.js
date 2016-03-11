
const gulp = require('gulp');

gulp.task('watch', () => {
    return gulp.watch('src/**/.ts', ['addfiles', 'typescript']);
})