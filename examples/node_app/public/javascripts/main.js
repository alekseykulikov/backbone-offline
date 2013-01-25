(function ($, _, Backbone) {
  'use strict';

  /**
   * Models
   */

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

  /**
   * Views
   */

  var NotesView = Backbone.View.extend({
    template: _.template($('#notes_template').html()),

    render: function() {
      this.$el.html(this.template());
      return this;
    }
  });

  var NotebooksView = Backbone.View.extend({
    template: _.template($('#notebooks_template').html()),

    render: function() {
      this.$el.html(this.template());
      return this;
    }
  });

  var TagsView = Backbone.View.extend({
    template: _.template($('#tags_template').html()),

    render: function() {
      this.$el.html(this.template());
      return this;
    }
  });

  /**
   * Application
   */

  var Router = Backbone.Router.extend({
    routes: {
      ''          : 'notes',
      'notes'      : 'notes',
      'notebooks' : 'notebooks',
      'tags'      : 'tags'
    },

    notes: function() {
      this.renderView('notes', NotesView);
    },

    notebooks: function() {
      this.renderView('notebooks', NotebooksView);
    },

    tags: function() {
      this.renderView('tags', TagsView);
    },

    renderView: function(menu, View, options) {
      this.changeMenu(menu);
      if (this.view) this.view.remove();

      this.view = new View(options);
      $('#application').html(this.view.render().el);
    },

    changeMenu: function(menu) {
      $('#nav li').removeClass('active');
      $('#nav li a[href="#' + menu +'"]').parent().addClass('active');
    }
  });

  var app = new Router();
  Backbone.history.start();
})(jQuery, _, Backbone);