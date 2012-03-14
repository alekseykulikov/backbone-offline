class window.Dream extends Backbone.Model
  defaults:
    name : 'Visit Iceland'

class window.Dreams extends Backbone.Collection
  model: Dream
  url: '/api/dreams'

  initialize: ->
    @storage = new Offline.Storage('dreams', this, autoSync: false)
