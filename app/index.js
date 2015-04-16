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
  },

  prompting: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('It\'s business time. UNION-style.'));
    }

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: true
      }]
    },{
      type: 'input',
      name: 'siteurl',
      message: 'Enter the website URL for this project (omit protocols and \'dev.\', please)',
      validate: function(input) {
        setTimeout(function() {
          if (typeof input !== "string" || input.length === 0) {
            done("Please enter the website URL, omitting protocols and 'dev.' (i.e. 'union.co').");
            return;
          }
          done(true);
        }, 3000);
      }
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      var hasFeature = function (feat) {
        return features.indexOf(feat) !== -1;
      };

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeModernizr = hasFeature('includeModernizr');
      this.siteUrl = answers.siteurl;

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
        dependencies: {}
      };

      bower.dependencies.jquery = '~2.1.1';

      if (this.includeModernizr) {
        bower.dependencies.modernizr = '~2.8.1';
      }

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
      this.copy('favicon.ico', 'public/favicon.ico');
      this.copy('apple-touch-icon.png', 'public/apple-touch-icon.png');
      this.copy('robots.txt', 'public/robots.txt');
    },

    mainStylesheet: function () {
      var css = 'screen.scss';

      this.copy(css, 'public/src/scss/' + css);
    },

    writeIndex: function () {
      this.indexFile = this.src.read('index.html');
      this.indexFile = this.engine(this.indexFile, this);

      this.indexFile = this.appendFiles({
        html: this.indexFile,
        fileType: 'js',
        optimizedPath: 'dist/js/app.js',
        sourceFileList: ['src/js/app.js']
      });

      this.write('app/index.html', this.indexFile);
    },

    public: function () {
      this.mkdir('public');
      this.mkdir('public/src');
      this.mkdir('public/src/js');
      this.mkdir('public/src/js/vendor');
      this.mkdir('public/src/scss');
      this.mkdir('public/src/scss/common');
      this.mkdir('public/src/scss/modules');
      this.mkdir('public/src/scss/screens');
      this.mkdir('public/src/scss/vendor');
      this.mkdir('public/src/img');
      this.mkdir('public/src/fonts');
      this.mkdir('public/dist');
      this.copy('app.js', 'public/src/js/app.js');
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
        src: 'public/src/scss/*.scss'
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
