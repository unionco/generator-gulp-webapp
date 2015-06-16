var fs = require('fs'),
  argv = require('yargs').argv,
  browserify = require('browserify'),
  transform = require('vinyl-transform'),
  browserSync = require('browser-sync'),
  gulp = require('gulp'),
  del = require('del'),
  sass = require('gulp-sass'),
  prefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  minify = require('gulp-minify-css'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  config = {
    browserSync_proxy: '<%= siteUrl %>',
    bower_path: './bower_components/',
    template_src: ['<%= templatePath %>/*.html', '<%= templatePath %>/*.twig', '<%= templatePath %>/*.blade.php', '<%= templatePath %>/**/*.html', '<%= templatePath %>/**/*.twig', '<%= templatePath %>/**/*.blade.php'],
    js_src: ['<%= srcAssetsPath %>js/*.js', '<%= srcAssetsPath %>js/**/*.js'],
    sass_src: ['<%= srcAssetsPath %>scss/*.scss', '<%= srcAssetsPath %>scss/**/*.scss'],
    img_src: ['<%= srcAssetsPath %>img/**/*', '<%= srcAssetsPath %>img/*'],
    js_dist: '<%=distAssetsPath %>js/',
    js_clean_path: '<%=distAssetsPath %>js/**/*',
    css_dist: '<%=distAssetsPath %>css/',
    css_clean_path: '<%=distAssetsPath %>css/**/*',
    img_dist: '<%=distAssetsPath %>img/'
  };
/*
 ** Update bower component path if .bowerrc file exists
 */
if (fs.existsSync('.bowerrc')) {
  var bower_config = JSON.parse(fs.readFileSync('.bowerrc')),
    bower_dir = bower_config.directory;
  config.bower_path = (bower_dir.substr(bower_dir.length, -1) !== "/") ? bower_dir + "/" : bower_dir;
}
/*
** Start browser sync
*/
if(argv.sync !== 0) {
  browserSync({
    proxy: config.browserSync_proxy,
    host: config.browserSync_proxy,
    open: 'external'
  });
}
/*
 ** CSS: Clean destination folder before processing css
 */
gulp.task('css:clean', function() {
  del([config.css_clean_path], function(err,paths) {
      console.log("Cleaned CSS:\n", paths.join('\n'));
  });
});
/*
 ** CSS: Compile sass, add autoprefixer and minify
 */
gulp.task('css:dist', ['css:clean'], function() {
  return gulp.src(config.sass_src)
  .pipe(sourcemaps.init())
  .pipe(sass({
    includePaths: [config.bower_path + 'normalize-scss']
  }))
  .pipe(prefixer({
    browsers: ['last 2 versions']
  }))
  .pipe(minify({
    keepSpecialComments: 0
  }))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(config.css_dist));
});
/*
 ** JS: Clean js folder before processing scripts
 */
gulp.task('js:clean', function() {
  del([config.js_clean_path], function(err,paths) {
      console.log("Cleaned JS:\n", paths.join('\n'));
  });
});
/*
 ** JS: Combine vendor js files
 */
gulp.task('js:vendor', function() {
  return gulp.src([
      config.bower_path + 'jquery/dist/jquery.js',
      config.bower_path + 'modernizr/modernizr.js',
      config.bower_path + 'fastclick/lib/fastclick.js'
  ])
  .pipe(concat('vendor.js'))
  .pipe(uglify())
  .pipe(rename({
      suffix: '.min'
  }))
  .pipe(gulp.dest(config.js_dist));
});
/*
 ** JS: Build main app files via browserify
 */
gulp.task('js:dist', ['js:clean', 'js:vendor'], function() {
  var browserifyTrans = transform(function(file) {
    var browserified = browserify(file);
    return browserified.bundle();
  });

  return gulp.src([config.js_src[0]])
    .pipe(browserifyTrans)
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(config.js_dist));
});

/*
 ** IMG: Run imagemin on all images
 */
gulp.task('img:dist', function() {
  gulp.src(config.img_src).pipe(imagemin({
    optimizationLevel: 0,
    progressive: true,
    svgoPlugins: [{
      removeViewBox: false
    }, {
      removeEmptyAttrs: true
    }]
  }))
  .pipe(gulp.dest(config.img_dist));
});
/*
 ** Default Task
 */
gulp.task('default', ['css:dist', 'js:dist', 'img:dist'], function() {
  /*
  ** Initial file observers
  */
  gulp.watch(config.js_src, ['js:dist']);
  gulp.watch(config.sass_src, ['css:dist']);
  gulp.watch(config.img_src, ['img:dist']);
  gulp.watch([
    config.template_src,
    config.js_dist + '*.js',
    config.css_dist + '*.css'
  ]).on('change', browserSync.reload);
});
