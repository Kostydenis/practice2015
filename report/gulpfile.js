var gulp = require('gulp');
var latex = require('gulp-latex');


gulp.task('preview', function() {
	gulp.src('main.tex')
		.pipe(latex())
		.pipe(gulp.dest('dist'));
});