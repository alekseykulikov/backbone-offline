#    Backbone.offline
#    (c) 2012 - Aleksey Kulikov
#    May be freely distributed according to MIT license.

window.Offline =
  localSync: (method, model, options, store) ->
    resp = switch(method)
      when 'read'
        if _.isUndefined(model.id) then store.findAll() else store.find(model)
      when 'create' then store.create(model, options)
      when 'update' then store.update(model, options)
      when 'delete' then store.destroy(model, options)

    if resp then options.success(resp) else options.error('Record not found')

  sync: (method, model, options) ->
    store = model.storage || model.collection?.storage
    if store
      Offline.localSync(method, model, options, store)
    else
      Backbone.ajaxSync(method, model, options)

# Override 'Backbone.sync' to default to 'Offline.sync'
# the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
Backbone.ajaxSync = Backbone.sync
Backbone.sync = Offline.sync


class Offline.Records
  constructor: (@name) ->
    store = localStorage.getItem(@name)
    @values = (store && store.split(',')) || []

  add: (itemId) ->
    unless _.include(@values, itemId.toString())
      @values.push itemId.toString()
    this.save()

  remove: (itemId) ->
    @values = _.without @values, itemId.toString()
    this.save()

  save: -> localStorage.setItem @name, @values.join(',')
  reset: -> @values = []


class Offline.Collection
  constructor: (@collection) ->

  dirty: ->
    @collection.filter (item) -> item.get('dirty')

  get: (sid) ->
    @collection.find (item) -> item.get('sid') is sid

  diff: (response) ->
    _.difference _.without(@collection.pluck('sid'), 'new'), _.pluck(response, 'id')


class Offline.Storage
  constructor: (@name, @collection, options = {}) ->
    @keys = options.keys || {}
    @allRecords = new Offline.Records(@name)
    @destroyRecords = new Offline.Records("#{@name}-destroy")
    @colWrapper = new Offline.Collection(@collection)

  create: (model, options = {}) ->
    model = model.attributes if model.attributes
    model.sid = model.sid || model.id || 'new'
    model.id = this.guid()

    unless options.local
      model.updated_at = (new Date).toString()
      model.dirty = true

    this.saveItem(model)

  update: (model, options = {}) ->
    unless options.local
      model.set updated_at: (new Date).toString(), dirty: true

    this.saveItem(model)

  destroy: (model, options = {}) ->
    unless options.local or (sid = model.get('sid')) is 'new'
      @destroyRecords.add(sid)

    this.removeItem(model)

  find: (model) ->
    JSON.parse localStorage.getItem("#{@name}-#{model.id}")

  findAll: ->
    JSON.parse(localStorage.getItem("#{@name}-#{id}")) for id in @allRecords.values

  prepare: ->
    if this.isEmpty()
      this.fullSync success: => @collection.fetch()
    else
      @collection.fetch success: => this.incrementalSync()

  fullSync: (options = {}) ->
    Backbone.ajaxSync 'read', @collection, success: (response, status, xhr) =>
      this.clear()
      localStorage.setItem(@name, '')
      @collection.reset []
      this.create(item, local: true) for item in response
      options.success(response) if options.success

  incrementalSync: ->
    this.pull success: => this.push()

  pull: (options = {}) ->
    Backbone.ajaxSync 'read', @collection, success: (response, status, xhr) =>
      this.removeBySid(sid) for sid in @colWrapper.diff(response)
      this.pullItem(item) for item in response
      options.success() if options.success

  push: ->
    this.pushItem(item) for item in @colWrapper.dirty()
    this.destroyBySid(sid) for sid in @destroyRecords.values

# Helpers

  s4: ->
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

  guid: ->
    this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4()

  saveItem: (item) ->
    this.replaceKeyFields(item, 'local')
    localStorage.setItem "#{@name}-#{item.id}", JSON.stringify(item)
    @allRecords.add(item.id)

    return item

  removeItem: (item) ->
    localStorage.removeItem "#{@name}-#{item.id}"
    @allRecords.remove(item.id)

    return item

  replaceKeyFields: (item, method) ->
    model = if item.attributes then item.attributes else item
    for field, collection of @keys
      replacedField = model[field]
      newValue = if method is 'local'
        wrapper = new Offline.Collection(collection)
        wrapper.get(replacedField).id
      else
        collection.get(replacedField).get('sid')
      model[field] = newValue
    return model

  pushItem: (item) ->
    this.replaceKeyFields(item, 'server')
    localId = item.id
    [method, item.id] = if item.get('sid') is 'new' then ['create', null] else ['update', item.get('sid')]

    Backbone.ajaxSync method, item, success: (response, status, xhr) =>
      item.id = localId
      item.set(sid: response.id) if method is 'create'
      item.save {dirty: false}, {local: true}

  destroyBySid: (sid) ->
    fakeModel = new Backbone.Model()
    fakeModel.id = sid
    fakeModel.urlRoot = @collection.url

    Backbone.ajaxSync 'delete', fakeModel, success: (response, status, xhr) =>
      @destroyRecords.remove(sid)

  isEmpty: ->
    localStorage.getItem(@name) is null

  clear: ->
    keys = Object.keys(localStorage)
    collectionKeys = _.filter keys, (key) => (new RegExp @name).test(key)
    localStorage.removeItem(key) for key in collectionKeys

    @allRecords.reset()
    @destroyRecords.reset()

  removeBySid: (sid) ->
    local = @colWrapper.get(sid)
    local.destroy(local: true)

  pullItem: (item) ->
    local = @colWrapper.get(item.id)
    if local
      this.updateItem(local, item)
    else
      this.createItem(item)

  updateItem: (local, item) ->
    if (new Date(local.get 'updated_at')) < (new Date(item.updated_at))
      delete item.id
      local.save item, local: true

  createItem: (item) ->
    unless _.include(@destroyRecords.values, item.id.toString())
      item.sid = item.id
      delete item.id # isNew() hack
      @collection.create(item, local: true)
