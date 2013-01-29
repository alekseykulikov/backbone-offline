(function ($, _, Backbone) {
  'use strict';

  /**
   * Models
   */

  var Model = Backbone.Model.extend({
    idAttribute: '_id',
    fetchNotes: function(cb) {
      this.fetch({
        success: function(model, response, options) { cb(null, new Notes(response)); },
        error:   function(model, xhr, options)      { cb(xhr, null); }
      });
    }
  });

  var Collection = Backbone.Collection.extend({
    model: Model,
    fetchAll: function(cb) {
      this.fetch({
        success: function(collection, response, options) { cb(null, collection); },
        error:   function(collection, xhr, options)      { cb(xhr, null); }
      });
    }
  });

  var Notes = Collection.extend({
    url: 'api/notes'
  });

  var Notebooks = Collection.extend({
    url: 'api/notebooks'
  });

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
    , menuTemplate      = getTemplate('menu_template')
    , menuItemTemplate  = getTemplate('menu_item_template')
    , tableTemplate     = getTemplate('table_template')
    , itemTemplate      = getTemplate('item_template');

  var NotesView = Backbone.View.extend({
    initialize: function(options) {
      this.activeId  = options.activeId;
      this.notebooks = options.notebooks;
      this.tags      = options.tags;
    },

    render: function() {
      this.$el.html(notesTemplate());
      this.renderMenu();
      this.renderTable();
      this.setActive();
      return this;
    },

    renderTable: function() {
      this.$('.span9').html(tableTemplate({
          caption : 'Notes'
        , name    : 'Note'
      }));
      this.addAll();
    },

    addAll: function() {
      var $table = this.$('table tbody');
      this.collection.forEach(function(note, index) {
        $table.append(itemTemplate({
            number : index + 1
          , value  : note.get('body')
        }));
      });
    },

    renderMenu: function() {
      this.$('.sidebar-wrapper').append(menuTemplate());
      var $ul = this.$('ul:last');
      $ul.append(menuItemTemplate({ href: 'all', title: 'All Notes' }));
      this.notebooks.forEach(function(notebook) {
        $ul.append(menuItemTemplate({ href: notebook.id, title: notebook.get('name') }));
      });

      this.$('.sidebar-wrapper').append(menuTemplate());
      $ul = this.$('ul:last');

      this.tags.forEach(function(tag) {
        $ul.append(menuItemTemplate({ href: tag.id, title: '#' + tag.get('name') }));
      });
    },

    setActive: function() {
      this.$('.sidebar-wrapper li a[href="#notes/' + this.activeId + '"]').parent().addClass('active');
    }
  });

  var NotebooksView = Backbone.View.extend({
    render: function() {
      this.$el.append(tableTemplate({
          caption : 'Notebooks'
        , name    : 'Notebook'
      }));
      this.addAll();
      return this;
    },

    addAll: function() {
      var $table = this.$('table tbody');
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
      this.$el.append(tableTemplate({
          caption : 'Tags'
        , name    : 'Tag'
      }));
      this.addAll();
      return this;
    },

    addAll: function() {
      var $table = this.$('table tbody');
      this.collection.forEach(function(tag, index) {
        $table.append(itemTemplate({
            number : index + 1
          , value  : tag.get('name')
        }));
      });
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
      function renderNotes(err, selectedNotes) {
        app.renderView('notes', NotesView, {
            collection: selectedNotes
          , activeId: id
          , tags: tags
          , notebooks: notebooks
        });
      }

      var prepareData = _.after(2, function() {
        if (id === 'all') {
          notes.fetchAll(renderNotes);
        } else {
          var item = notebooks.get(id) || tags.get(id);
          if (!item) return this.navigate('notes/all', { trigger: true });

          item.fetchNotes(renderNotes);
        }
      });

      notebooks.fetchAll(prepareData);
      tags.fetchAll(prepareData);
    },

    notebooks: function() {
      notebooks.fetchAll(function (err, notebooks) {
        app.renderView('notebooks', NotebooksView, { collection: notebooks });
      });
    },

    tags: function() {
      tags.fetchAll(function (err, tags) {
        app.renderView('tags', TagsView, { collection: tags });
      });
    },

    renderView: function(menu, View, options) {
      $('#nav li').removeClass('active');
      $('#nav li[data-menu="' + menu + '"]').addClass('active');

      if (this.view) this.view.remove();

      this.view = new View(options);
      $('#application').html(this.view.render().el);
    }
  });

  var app = new Router();
  Backbone.history.start();

})(jQuery, _, Backbone);