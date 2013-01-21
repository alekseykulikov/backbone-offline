;(function(_, Backbone) {
  'use strict';

  Backbone.Offline = function() {
    this._initStore();
    this.initialize.apply(this, arguments);
  };

  _.extend(Backbone.Offline.prototype, Backbone.Events, {
    // Default constructor followed Backbone's convention
    initialize: function() {},

    // Parse store options and create internal sync rules
    _initStore: function() {
      if (!this.store) return;
    }
  });

  // Export Offline to Backbone's namespace
  var defaultSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var store = model.store || model.collection ? model.collection.store : undefined;

    // If model or collection has store attribute,
    // sync will handle by store
    if (store) {
      store.sync(method, model, options);
    } else {
      defaultSync(method, model, options);
    }
  };
})(_, Backbone);
