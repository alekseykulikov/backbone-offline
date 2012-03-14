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

#
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

#
class Offline.Collection
  constructor: (@items) ->

  dirty: ->
    @items.filter (item) -> item.get('dirty')

  get: (sid) ->
    @items.find (item) -> item.get('sid') is sid

  diff: (response) ->
    _.difference _.without(@items.pluck('sid'), 'new'), _.pluck(response, 'id')

  destroyDiff: (response) ->
    this.get(sid)?.destroy(local: true) for sid in this.diff(response)

  fakeModel: (sid) ->
    model = new Backbone.Model()
    model.id = sid
    model.urlRoot = @items.url

    return model

#
class Offline.Storage
  constructor: (@name, collection, options = {}) ->
    @keys = options.keys || {}
    @allRecords = new Offline.Records(@name)
    @destroyRecords = new Offline.Records("#{@name}-destroy")
    @sync = new Offline.Sync(collection, this)

  create: (model, options = {}) ->
    model = model.attributes if model.attributes
    model.sid = model.sid || model.id || 'new'
    model.id = this.guid()

    unless options.local
      model.updated_at = (new Date).toString()
      model.dirty = true

    this.save(model)

  update: (model, options = {}) ->
    unless options.local
      model.set updated_at: (new Date).toString(), dirty: true

    this.save(model)

  destroy: (model, options = {}) ->
    unless options.local or (sid = model.get('sid')) is 'new'
      @destroyRecords.add(sid)

    this.remove(model)

  find: (model) ->
    JSON.parse localStorage.getItem("#{@name}-#{model.id}")

  findAll: ->
    if this.isEmpty() then @sync.full() else @sync.incremental()
    JSON.parse(localStorage.getItem("#{@name}-#{id}")) for id in @allRecords.values

  s4: ->
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

  guid: ->
    this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4()

  save: (item) ->
    this.replaceKeyFields(item, 'local')
    localStorage.setItem "#{@name}-#{item.id}", JSON.stringify(item)
    @allRecords.add(item.id)

    return item

  remove: (item) ->
    localStorage.removeItem "#{@name}-#{item.id}"
    @allRecords.remove(item.id)

    return item

  isEmpty: ->
    localStorage.getItem(@name) is null

  clear: ->
    keys = Object.keys(localStorage)
    collectionKeys = _.filter keys, (key) => (new RegExp @name).test(key)
    localStorage.removeItem(key) for key in collectionKeys
    localStorage.setItem(@name, '')
    record.reset() for record in [@allRecords, @destroyRecords]

  replaceKeyFields: (item, method) ->
    item = item.attributes if item.attributes

    for field, collection of @keys
      replacedField = item[field]
      newValue = if method is 'local'
        wrapper = new Offline.Collection(collection)
        wrapper.get(replacedField)?.id
      else
        collection.get(replacedField)?.get('sid')
      item[field] = newValue unless _.isUndefined(newValue)
    return item

#
class Offline.Sync
  constructor: (collection, storage) ->
    @collection = new Offline.Collection(collection)
    @storage = storage

  full: (options = {}) ->
    Backbone.ajaxSync 'read', @collection.items, success: (response, status, xhr) =>
      @storage.clear()
      @storage.create(item, local: true) for item in response
      @collection.items.reset(response)
      options.success(response) if options.success

  incremental: ->
    this.pull success: => this.push()

  pull: (options = {}) ->
    Backbone.ajaxSync 'read', @collection.items, success: (response, status, xhr) =>
      @collection.destroyDiff(response)
      this.pullItem(item) for item in response
      options.success() if options.success

  pullItem: (item) ->
    local = @collection.get(item.id)
    if local
      this.updateItem(item, local)
    else
      this.createItem(item)

  createItem: (item) ->
    unless _.include(@storage.destroyRecords.values, item.id.toString())
      item.sid = item.id
      delete item.id
      @collection.items.create(item, local: true)

  updateItem: (item, model) ->
    if (new Date(model.get 'updated_at')) < (new Date(item.updated_at))
      delete item.id
      model.save item, local: true

  push: ->
    this.pushItem(item) for item in @collection.dirty()
    this.destroyBySid(sid) for sid in @storage.destroyRecords.values

  pushItem: (item) ->
    @storage.replaceKeyFields(item, 'server')
    localId = item.id
    delete item.attributes.id
    [method, item.id] = if item.get('sid') is 'new' then ['create', null, null] else ['update', item.attributes.sid]

    Backbone.ajaxSync method, item, success: (response, status, xhr) =>
      item.attributes.id = localId
      item.id = localId
      item.set(sid: response.id) if method is 'create'
      item.save {dirty: false}, {local: true}

  destroyBySid: (sid) ->
    model = @collection.fakeModel(sid)
    Backbone.ajaxSync 'delete', model, success: (response, status, xhr) =>
      @storage.destroyRecords.remove(sid)
