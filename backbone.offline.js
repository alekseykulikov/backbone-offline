;(function(_, Backbone) {
  'use strict';

  Backbone.Offline = function(options) {
    this.initialize(options);
  };

  _.extend(Backbone.Offline.prototype, Backbone.Events, {
  });
})(_, Backbone);
