(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  window.Dream = (function(_super) {

    __extends(Dream, _super);

    function Dream() {
      Dream.__super__.constructor.apply(this, arguments);
    }

    Dream.prototype.defaults = {
      name: 'Visit Iceland'
    };

    return Dream;

  })(Backbone.Model);

  window.Dreams = (function(_super) {

    __extends(Dreams, _super);

    function Dreams() {
      Dreams.__super__.constructor.apply(this, arguments);
    }

    Dreams.prototype.model = Dream;

    Dreams.prototype.url = '/api/dreams';

    Dreams.prototype.initialize = function() {
      return this.storage = new Offline.Storage('dreams', this);
    };

    return Dreams;

  })(Backbone.Collection);

}).call(this);
