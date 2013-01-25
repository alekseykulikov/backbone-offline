;(function(_, Backbone) {
  'use strict';

  function Store(options) {}

  Backbone.Offline = function(id, options) {
    if (!id) throw new Error('Setup storage id');
    if (!options) options = {};

    this._initStore(options.store);
  };

  _.extend(Backbone.Offline.prototype, Backbone.Events, {
    // Parse store options and create internal sync rules
    _initStore: function(store) {
      if (!store) return;
    }
  });

  // If model or collection has store attribute,
  // sync will handle by store
  // else calls default sync method
  var defaultSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var store = model.store || model.collection ? model.collection.store : undefined;

    if (store) {
      store.sync.call(store, method, model, options);
    } else {
      defaultSync(method, model, options);
    }
  };
})(_, Backbone);
