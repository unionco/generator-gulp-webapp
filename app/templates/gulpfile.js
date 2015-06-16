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
    bower_path: 'bower_components/',
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
 ** Initial file observers
 */
gulp.watch(config.js_src, ['js:dist']);
gulp.watch(config.sass_src, ['css:dist']);
gulp.watch(config.img_src, ['img:dist']);
gulp.watch(config.template_src, ['util:reload']);
/*
 ** UTIL: Start browser sync
 */
gulp.task('util:sync', function() {
  if(argv.sync !== 0) {
    browserSync({
      proxy: config.browserSync_proxy,
      host: config.browserSync_proxy,
      open: 'external'
    });
  }
});
/*
 ** UTIL: Reload browser sync
 */
gulp.task('util:reload', function() {
  browserSync.reload();
});
/*
 ** CSS: Clean destination folder before processing css
 */
gulp.task('css:clean', function() {
  del([config.css_clean_path], function(err,paths) {
      console.log("Cleaned CSS:\n", paths.join('\n'));
  });
});
/*
 ** CSS: Compile sass and add autoprefixer
 */
gulp.task('css:sass', function() {
  return gulp.src(config.sass_src)
  .pipe(sourcemaps.init())
  .pipe(sass({
    includePaths: [config.bower_path + 'normalize-scss/'],
    outputStyle: "expanded",
    errLogToConsole: false
  }))
  .pipe(prefixer({
    browsers: ['last 3 versions', 'ie > 8', 'ff > 14']
  }))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(config.css_dist));
});
/*
 ** CSS: Minify compiled css files
 */
gulp.task('css:dist', ['css:clean', 'css:sass'], function() {
  return gulp.src([config.css_dist + '*.css'])
  .pipe(minify({
    keepSpecialComments: 0
  }))
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(gulp.dest(config.css_dist))
  .pipe(browserSync.reload({
    stream: true
  }));
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
  return gulp.src([<%
    _.forEach(vendorScripts, function(filePath, n) { %>
      config.bower_path + '<%= filePath %>'<% if (n < (vendorScripts.length - 1)) { %>,<% } %><%
    }); %>
  ])
  .pipe(concat('vendor.js'))
  .pipe(gulp.dest(config.js_dist));
});
/*
 ** JS: Build main app files via browserify
 */
gulp.task('js:browserify', function() {
  var browserifyTrans = transform(function(file) {
    var browserified = browserify(file);
    return browserified.bundle();
  });

  return gulp.src([config.js_src[0]])
    .pipe(browserifyTrans)
    .pipe(gulp.dest(config.js_dist));
});
/*
 ** JS: Minify compiled js files
 */
gulp.task('js:dist', ['js:clean', 'js:vendor', 'js:browserify'], function() {
  return gulp.src([config.js_dist + '*.js']).pipe(uglify()).pipe(rename({
    suffix: '.min'
  }))
  .pipe(gulp.dest(config.js_dist))
  .pipe(browserSync.reload({
    stream: true
  }));
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
  .pipe(gulp.dest(config.img_dist))
  .pipe(browserSync.reload({
    stream: true
  }));
});
/*
 ** Default Task
 */
gulp.task('default', ['css:dist', 'js:dist', 'img:dist', 'util:sync']);
