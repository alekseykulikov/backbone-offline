;(function(_, Backbone) {
  'use strict';

  function Store(options) {

  }

  var Offline = Backbone.Offline = function() {
    this._initStore();
    this.initialize.apply(this, arguments);
  };

  _.extend(Offline.prototype, Backbone.Events, {
    // Default constructor by Backbone's convention
    initialize: function() {},

    // Parse store options and create internal sync rules
    _initStore: function() {
      if (!this.store) return;
    }
  });

  // Set up inheritance
  Offline.extend = Backbone.Model.extend;

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
