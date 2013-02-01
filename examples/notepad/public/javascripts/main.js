(function ($, _, Backbone) {
  'use strict';

  /**
   * Models
   */

  var Model      = Backbone.Model.extend({ idAttribute: '_id' })
    , Collection = Backbone.Collection.extend({ model: Model })
    , Notes      = Collection.extend({ url: 'api/notes' })
    , Notebooks  = Collection.extend({ url: 'api/notebooks' })
    , Tags       = Collection.extend({ url: 'api/tags' });

  /**
   * Helpers
   */

  function fetchNotes(model, cb) {
    model.fetch({
      success: function(model, response, options) { cb(null, new Notes(response)); },
      error:   function(model, xhr, options)      { cb(xhr, null); }
    });
  }

  function fetchAll(collection, cb) {
    collection.fetch({
      success: function(collection, response, options) { cb(null, collection); },
      error:   function(collection, xhr, options)      { cb(xhr, null); }
    });
  }

  function getTmpl(name) {
    return _.template($('#' + name).html());
  }

  function renderTable(collection, caption) {
    var tableTmpl = getTmpl('table_template')
      , itemTmpl  = getTmpl('item_template')
      , $table    = $($.trim(tableTmpl({ caption : caption })))
      , $tbody    = $table.find('tbody');

    collection.forEach(function(model, index) {
      $tbody.append(itemTmpl({
          number : index + 1
        , value  : model.get('name')
      }));
    });

    return $table;
  }

  /**
   * Views
   */

  var NotesView = Backbone.View.extend({
    initialize: function(options) {
      this.options = options;
    },

    render: function() {
      this.$el.html(getTmpl('notes_template')());
      this.$('.span9').html(renderTable(this.collection, 'Notes'));
      this.renderMenu();

      return this;
    },

    renderMenu: function() {
      var itemTmpl = getTmpl('menu_item_template')
        , $ul      = this.addMenuGroup();

      $ul.append(itemTmpl({ href: 'all', title: 'All Notes' }));
      this.options.notebooks.forEach(function(notebook) {
        $ul.append(itemTmpl({ href: notebook.id, title: notebook.get('name') }));
      });

      $ul = this.addMenuGroup();
      this.options.tags.forEach(function(tag) {
        $ul.append(itemTmpl({ href: tag.id, title: '#' + tag.get('name') }));
      });

      this.$('.sidebar-wrapper li a[href="#notes/' + this.options.activeId + '"]').parent().addClass('active');
    },

    addMenuGroup: function() {
      this.$('.sidebar-wrapper').append(getTmpl('menu_template')());
      return this.$('ul:last');
    }
  });

  var NotebooksView = Backbone.View.extend({
    render: function() {
      this.$el.html(renderTable(this.collection, 'Notebooks'));
      return this;
    }
  });

  var TagsView = Backbone.View.extend({
    render: function() {
      this.$el.html(renderTable(this.collection, 'Tags'));
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
          fetchAll(notes, renderNotes);
        } else {
          var item = notebooks.get(id) || tags.get(id);
          if (!item) return app.navigate('notes/all', { trigger: true });

          fetchNotes(item, renderNotes);
        }
      });

      fetchAll(notebooks, prepareData);
      fetchAll(tags, prepareData);
    },

    notebooks: function() {
      fetchAll(notebooks, function(err, notebooks) {
        app.renderView('notebooks', NotebooksView, { collection: notebooks });
      });
    },

    tags: function() {
      fetchAll(tags, function(err, tags) {
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
