(function ($, _, Backbone) {
  'use strict';

  // Note contains body, tags, createAt
  var Notes = Backbone.Collection.extend({
    url: 'api/notes'
  });

  // Notebook contains notes
  var Notebooks = Backbone.Collection.extend({
    url: 'api/notebooks'
  });

  // Tags are shared between different notebooks
  var Tags = Backbone.Collection.extend({
    url: 'api/tags'
  });
  
  var Router = Backbone.Router.extend({
    routes: {
      ''          : 'home',
      'home'      : 'home',
      'notebooks' : 'notebooks',
      'tags'      : 'tags'
    },
    
    home: function() {
      this.setTitle('home');
    },
    
    notebooks: function() {
      this.setTitle('notebooks');
    },
    
    tags: function() {
      this.setTitle('tags');
    },
    
    setTitle: function(title) {
      $('#nav li').removeClass('active');
      $('#nav li a[href="#' + title +'"]').parent().addClass('active');
    }
  })
  new Router();
  Backbone.history.start();
})(jQuery, _, Backbone);