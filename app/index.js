'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install', {
      desc: 'Skips the installation of dependencies',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
    this.rootFolder = 'public/';
    this.srcAssetsPathPublic = 'src/';
    this.srcAssetsPath = this.rootFolder + 'src/';
    this.distAssetsPathPublic = 'dist/';
    this.distAssetsPath = this.rootFolder + 'dist/';
  },

  prompting: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay("It's business time. UNION-style."));
    }

    var prompts = [
    {
      type: 'input',
      name: 'siteurl',
      message: "Enter the website URL (i.e. 'union.co')"
    },
    {
      type: 'input',
      name: 'templatepath',
      message: "Where will views be stored? Root-relative filepath (i.e. 'craft/templates')"
    }
    ];

    this.prompt(prompts, function (answers) {

      this.siteUrl = answers.siteurl;
      this.templatePath = answers.templatepath;

      done();
    }.bind(this));
  },

  writing: {
    gulpfile: function () {
      this.template('gulpfile.js');
    },

    packageJSON: function () {
      this.template('_package.json', 'package.json');
    },

    git: function () {
      this.copy('gitignore', '.gitignore');
      this.copy('gitattributes', '.gitattributes');
    },

    bower: function () {
      var bower = {
        name: this._.slugify(this.appname),
        private: true,
        dependencies: {
          'jquery': '~2.1.1',
          'modernizr': '~2.8.1',
          'normalize-scss': '~3.0.2',
          'fastclick': '~1.0.3',
          'animate.css': '~3.2.1'
        }
      };

      this.copy('bowerrc', '.bowerrc');
      this.write('bower.json', JSON.stringify(bower, null, 2));
    },

    jshint: function () {
      this.copy('jshintrc', '.jshintrc');
    },

    editorConfig: function () {
      this.copy('editorconfig', '.editorconfig');
    },

    h5bp: function () {
      this.copy('favicon.ico', this.rootFolder + 'favicon.ico');
      this.copy('apple-touch-icon.png', this.rootFolder + 'apple-touch-icon.png');
      this.copy('robots.txt', this.rootFolder + 'robots.txt');
    },

    sass: function () {
      this.copy('screen.scss', this.srcAssetsPath + 'scss/screen.scss');
      this.copy('global.scss', this.srcAssetsPath + 'scss/_global.scss');
      this.copy('base.scss', this.srcAssetsPath + 'scss/common/_base.scss');
      this.copy('layout.scss', this.srcAssetsPath + 'scss/common/_layout.scss');
      this.copy('mixins.scss', this.srcAssetsPath + 'scss/common/_mixins.scss');
      this.copy('utilities.scss', this.srcAssetsPath + 'scss/common/_utilities.scss');
      this.copy('variables.scss', this.srcAssetsPath + 'scss/common/_variables.scss');
      this.copy('module.scss', this.srcAssetsPath + 'scss/modules/_module.scss');
      this.copy('home.scss', this.srcAssetsPath + 'scss/screens/_home.scss');
    },

    views: function() {
      this.mkdir(this.templatePath);
    },

    public: function () {
      this.mkdir('public');
      this.mkdir(this.srcAssetsPath);
      this.mkdir(this.srcAssetsPath + 'js');
      this.mkdir(this.srcAssetsPath + 'js/vendor');
      this.mkdir(this.srcAssetsPath + 'scss');
      this.mkdir(this.srcAssetsPath + 'scss/common');
      this.mkdir(this.srcAssetsPath + 'scss/modules');
      this.mkdir(this.srcAssetsPath + 'scss/screens');
      this.mkdir(this.srcAssetsPath + 'scss/vendor');
      this.mkdir(this.srcAssetsPath + 'img');
      this.mkdir(this.srcAssetsPath + 'fonts');
      this.mkdir(this.distAssetsPath);
      this.copy('app.js', this.srcAssetsPath + 'js/app.js');
    }
  },

  install: function () {
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('gulp wiredep') +
      '.';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });

    this.on('end', function () {
      var bowerJson = this.dest.readJSON('bower.json');

      // wire Bower packages to .html
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        ignorePath: /^(\.\.\/)*\.\./,
        src: 'app/index.html'
      });

      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        ignorePath: /^(\.\.\/)+/,
        src: this.srcAssetsPath + 'scss/*.scss'
      });

      // ideally we should use composeWith, but we're invoking it here
      // because generator-mocha is changing the working directory
      // https://github.com/yeoman/generator-mocha/issues/28
      this.invoke(this.options['test-framework'], {
        options: {
          'skip-message': this.options['skip-install-message'],
          'skip-install': this.options['skip-install']
        }
      });
    }.bind(this));
  }
});
