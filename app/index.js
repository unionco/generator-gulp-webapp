'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

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
    this.vendorScripts = [
      'jquery/dist/jquery.js',
      'modernizr/modernizr.js',
      'fastclick/lib/fastclick.js'
    ];
    this.randomGreetings = [
      '<span style="font-family:Courier New,Courier,monospace;">display: block;</span>',
      'Make it so.',
      'You have arrived.',
      'Many internet. Such wow.',
      'Are you feeling <strong>Sass</strong>y?',
      'It\'s UNION, not Union.'
    ];
  },

  prompting: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay("It's business time, UNION-style."));
    }

    var prompts = [
    {
      type: 'input',
      name: 'siteurl',
      message: "Enter the website URL (i.e. 'dev.union.co'):\n"
    },
    {
      type: 'input',
      name: 'templatepath',
      message: "Where will views be stored? Root-relative filepath (i.e. 'public'):\n"
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
    },

    views: function() {
      this.mkdir(this.templatePath);
      this.template('index.html', this.templatePath + '/index.html');
    },

    public: function () {
      this.mkdir('public');
      this.mkdir(this.srcAssetsPath);
      this.mkdir(this.srcAssetsPath + 'js');
      this.mkdir(this.srcAssetsPath + 'js/vendor');
      this.mkdir(this.srcAssetsPath + 'scss');
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
      chalk.yellow.bold('gulp') +
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
      var theEnd = 
      '\n==========\n' + chalk.white('We\'re done here.\n') + 
      chalk.white('If installation of Node modules and Bower ran successfully, make sure\n') +
      chalk.cyan(this.siteUrl) + chalk.white(' points to ') + chalk.magenta(this.rootFolder) + chalk.white(' in your virtual hosts\n') +
      chalk.white('and run ') + chalk.yellow.bold('gulp') + '\n==========\n';

      this.log(theEnd);

    }.bind(this));
  }
});
