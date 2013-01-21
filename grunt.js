module.exports = function(grunt) {
  grunt.initConfig({
    lint: {
      files: ['backbone.offline.js', 'grunt.js', 'test/*.js']
    },
    min: {
      dist: {
        src: ['backbone.offline.js'],
        dest: 'backbone.offline.min.js'
      }
    }
  });

  grunt.registerTask('default', 'lint min');
};
