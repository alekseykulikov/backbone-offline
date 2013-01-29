(function ($, _, Backbone) {
  'use strict';

  /**
   * Models
   */

  var Collection = Backbone.Collection.extend({
    findAll: function(cb) {
      this.fetch({
        success: function(collection, response, options) { cb(null, collection); },
        error:   function(collection, xhr, options)      { cb(xhr, collection);  }
      });
    }
  });

  // Note contains body, tags, createdAt
  var Notes = Collection.extend({
    url: 'api/notes'
  });

  // Notebook contains notes
  var Notebooks = Collection.extend({
    url: 'api/notebooks'
  });

  // Tags are shared between different notebooks
  var Tags = Collection.extend({
    url: 'api/tags'
  });

  /**
   * Views
   */

  function getTemplate(name) {
    return _.template($('#' + name).html());
  }

  var notesTemplate     = getTemplate('notes_template')
    , tagsTemplate      = getTemplate('tags_template')
    , tableTemplate     = getTemplate('table_template')
    , itemTemplate      = getTemplate('item_template');

  var NotesView = Backbone.View.extend({
    render: function() {
      this.$el.html(notesTemplate());
      return this;
    }
  });

  var NotebooksView = Backbone.View.extend({
    render: function() {
      this.$el.append(tableTemplate({
          caption : 'Notebooks'
        , title   : 'Name'
        , name    : 'Notebook'
      }));
      this.addAll();
      return this;
    },

    addAll: function() {
      var $table = this.$('table');
      this.collection.forEach(function(notebook, index) {
        $table.append(itemTemplate({
            number : index + 1
          , value  : notebook.get('name')
        }));
      });
    }
  });

  var TagsView = Backbone.View.extend({
    render: function() {
      this.$el.html(tagsTemplate());
      return this;
    }
  });

  /**
   * Application
   */

  var notebooks = new Notebooks()
    , tags      = new Tags()
    , notes     = new Notes();

  var Router = Backbone.Router.extend({
    routes: {
      ''          : 'home',
      'notes/:id' : 'notes',
      'notebooks' : 'notebooks',
      'tags'      : 'tags'
    },

    home: function() {
      this.navigate('notes/all', { trigger: true });
    },

    notes: function(id) {
      var renderNotes = _.after(3, function() {
        app.renderView('notes', NotesView, {
            collection: notes
          , tags: tags
          , notebooks: notebooks
        });
      });

      notebooks.findAll(renderNotes);
      tags.findAll(renderNotes);
      notes.findAll(renderNotes);
    },

    notebooks: function() {
      notebooks.findAll(function (err, notebooks) {
        app.renderView('notebooks', NotebooksView, { collection: notebooks });
      });
    },

    tags: function() {
      tags.findAll(function (err, tags) {
        app.renderView('tags', TagsView, { collection: tags });
      });
    },

    renderView: function(menu, View, options) {
      $('#nav li').removeClass('active');
      $('#nav li a[href="#' + menu +'"]').parent().addClass('active');

      if (this.view) this.view.remove();

      this.view = new View(options);
      $('#application').html(this.view.render().el);
    }
  });

  var app = new Router();
  Backbone.history.start();

})(jQuery, _, Backbone);