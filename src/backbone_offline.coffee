#    Backbone.offline allows your Backbone.js app to work offline
#    https://github.com/Ask11/backbone.offline
#
#    (c) 2012 - Aleksey Kulikov
#    May be freely distributed according to MIT license.

do (global = window, _, Backbone) ->
  global.Offline =
    VERSION: '0.4.3'

    # This is a method for CRUD operations with localStorage.
    # Delegates to 'Offline.Storage' and works as ‘Backbone.sync’ alternative
    localSync: (method, model, options, store) ->
      resp = switch(method)
        when 'read'
          if _.isUndefined(model.id) then store.findAll(options) else store.find(model, options)
        when 'create' then store.create(model, options)
        when 'update' then store.update(model, options)
        when 'delete' then store.destroy(model, options)

      if resp
        options.success(model, resp.attributes ? resp, options)
      else
        options.error?('Record not found')

    # Overrides default 'Backbone.sync'. It checks 'storage' property of the model or collection
    # and then delegates to 'Offline.localSync' when property exists else calls the default 'Backbone.sync' with received params.
    sync: (method, model, options) ->
      store = model.storage || model.collection?.storage
      if store and store?.support
        Offline.localSync(method, model, options, store)
      else
        Backbone.ajaxSync(method, model, options)

    onLine: ->
      navigator.onLine isnt false

  # Override 'Backbone.sync' to default to 'Offline.sync'
  # the original 'Backbone.sync' is available in 'Backbone.ajaxSync'
  Backbone.ajaxSync = Backbone.sync
  Backbone.sync = Offline.sync

  # This class is use as a wrapper for manipulations with localStorage
  # It's based on a great library https://github.com/jeromegn/Backbone.localStorage
  # with some specific methods.
  #
  # Create your collection of this type:
  #
  # class Dreams extends Backbone.Collection
  #   initialize: ->
  #     @storage = new Offline.Storage('dreams', this)
  #
  # After that your collection will work offline.
  #
  # Instance attributes:
  # @name - storage name
  # @sync - instance of Offline.Sync
  # @allIds - index of ids for the collection
  # @destroyIds - index for destroyed models
  class Offline.Storage

    # Name of storage and collection link are required params
    constructor: (@name, @collection, options = {}) ->
      @support = @isLocalStorageSupport()
      @allIds = new Offline.Index(@name, this)
      @destroyIds = new Offline.Index("#{@name}-destroy", this)
      @sync = new Offline.Sync(@collection, this)
      @keys = options.keys || {}
      @autoPush = options.autoPush || false

    # Test from modernizr: https://github.com/Modernizr/Modernizr/blob/master/modernizr.js
    # Normally, we could not test that directly and need to do a
    #   `('localStorage' in window) && ` test first because otherwise Firefox will
    #   throw bugzil.la/365772 if cookies are disabled
    #
    # Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    # will throw the exception:
    #   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    # Peculiarly, getItem and removeItem calls do not throw.
    isLocalStorageSupport: ->
      try
        localStorage.setItem('isLocalStorageSupport', '1')
        localStorage.removeItem('isLocalStorageSupport')
        true
      catch e
        false

    # Most implementations of HTML5 localStorage have a size limit of about 5MB.
    # When data starts exceeding this limit, setting a key value throws the QUOTA_EXCEEDED_ERROR.
    # in other cases localSync support will be stopped
    setItem: (key, value) ->
      try
        localStorage.setItem key, value
      catch e
        if e.name is 'QUOTA_EXCEEDED_ERR'
          @collection.trigger('quota_exceed')
        else
          @support = false

    # Wrappers for localStorage methods
    removeItem: (key) ->
      localStorage.removeItem(key)

    getItem: (key)->
      localStorage.getItem(key)

    # Add a model, giving it a unique GUID. Server id saving to "sid".
    # Set a sync's attributes updated_at, dirty and add
    create: (model, options = {}) ->
      options.regenerateId = true
      @save(model, options)

    # Update a model into the set. Set a sync's attributes update_at and dirty.
    update: (model, options = {}) ->
      @save(model, options)

    # Delete a model from the storage
    destroy: (model, options = {}) ->
      @destroyIds.add(sid) unless options.local or (sid = model.get('sid')) is 'new'
      @remove(model, options)

    find: (model, options = {}) ->
      JSON.parse @getItem("#{@name}-#{model.id}")

    # Returns the array of all models currently in the storage.
    # And refreshes the storage into background
    findAll: (options = {}) ->
      unless options.local
        if @isEmpty() then @sync.full(options) else @sync.incremental(options)
      JSON.parse(@getItem("#{@name}-#{id}")) for id in @allIds.values

    s4: ->
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)

    incrementId: 0x1000000
    localId1: ((1+ Math.random()) * 0x100000 | 0).toString(16).substring(1)
    localId2: ((1+ Math.random()) * 0x100000 | 0).toString(16).substring(1)

    mid: ->
       ((new Date).getTime()/1000 | 0).toString(16) + @localId1 + @localId2 + (++@incrementId).toString(16).substring(1)

    guid: ->
      @s4() + @s4() + '-' + @s4() + '-' + @s4() + '-' + @s4() + '-' + @s4() + @s4() + @s4()

    save: (item, options = {}) ->
      if options.regenerateId
        id = if options.id is 'mid' then @mid() else @guid()
        item.set(sid: item.attributes?.sid || item.attributes?.id || 'new', id: id)
      item.set(updated_at: (new Date()).toJSON(), dirty: true) unless options.local

      @replaceKeyFields(item, 'local')
      @setItem "#{@name}-#{item.id}", JSON.stringify(item)
      @allIds.add(item.id)

      @sync.pushItem(item) if @autoPush and !options.local
      item

    remove: (item, options = {}) ->
      @removeItem "#{@name}-#{item.id}"
      @allIds.remove(item.id)

      sid = item.get('sid')
      @sync.flushItem(sid) if @autoPush and sid isnt 'new' and !options.local

      item

    isEmpty: ->
      @getItem(@name) is null

    # Clears the current storage
    clear: ->
      keys = Object.keys(localStorage)
      collectionKeys = _.filter keys, (key) => (new RegExp @name).test(key)
      @removeItem(key) for key in collectionKeys
      record.reset() for record in [@allIds, @destroyIds]

    # Replaces local-keys to server-keys based on options.keys.
    replaceKeyFields: (item, method) ->
      if Offline.onLine()
        item = item.attributes if item.attributes

        for field, collection of @keys
          replacedField = item[field]

          if !/^\w{8}-\w{4}-\w{4}/.test(replacedField) or method isnt 'local'
            newValue = if method is 'local'
              wrapper = new Offline.Collection(collection)
              wrapper.get(replacedField)?.id
            else
              collection.get(replacedField)?.get('sid')
            item[field] = newValue unless _.isUndefined(newValue)
      item

  # Sync collection with a server. All server requests delegated to 'Backbone.sync'
  # It provides a backward-compability. If your application is working with 'Backbone.sync'
  # it'll be working with a 'Offline.sync'
  #
  # @storage = new Offline.Storage('dreams', this)
  # @storage.sync - access to class instance through Offline.Storage
  class Offline.Sync
    constructor: (collection, storage) ->
      @collection = new Offline.Collection(collection)
      @storage = storage

    ajax: (method, model, options) ->
      if Offline.onLine()
        @prepareOptions(options)
        Backbone.ajaxSync(method, model, options)
      else
        @storage.setItem('offline', 'true')

    # @storage.sync.full() - full storage synchronization
    # 1. clear collection and store
    # 2. load new data
    full: (options = {}) ->
      @ajax 'read', @collection.items, _.extend {}, options,
        success: (model, response, opts) =>
          @storage.clear()
          @collection.items.reset([], silent: true)
          @collection.items.create(item, silent: true, local: true, regenerateId: true) for item in response
          @collection.items.trigger('reset') unless options.silent
          options.success(model, response, opts) if options.success

    # @storage.sync.incremental() - incremental storage synchronization
    # 1. pull() - request data from server
    # 2. push() - send modified data to server
    incremental:(options = {}) ->
      @pull _.extend {}, options, success: => @push()

    # Runs incremental sync when storage was offline
    # after current request therefore don't duplicate requests
    prepareOptions: (options) ->
      if @storage.getItem('offline')
        @storage.removeItem('offline')
        success = options.success
        options.success = (model, response, opts) =>
          success(model, response, opts)
          @incremental()

    # Requests data from the server and merges it with a collection.
    # It's useful when you want to refresh your collection and don't want to reload it completely.
    # If response does not include any local ids they will be removed
    # Local data will be compared with a server's response using updated_at field and new objects will be created
    #
    # @storage.sync.pull()
    pull: (options = {}) ->
      @ajax 'read', @collection.items, _.extend {}, options,
        success: (model, response, opts) =>
          @collection.destroyDiff(response)
          @pullItem(item) for item in response
          options.success(model, response, opts) if options.success

    pullItem: (item) ->
      local = @collection.get(item.id)
      if local
        @updateItem(item, local)
      else
        @createItem(item)

    createItem: (item) ->
      unless _.include(@storage.destroyIds.values, item.id.toString())
        item.sid = item.id
        delete item.id
        @collection.items.create(item, local: true)

    updateItem: (item, model) ->
      if (new Date(model.get 'updated_at')) < (new Date(item.updated_at))
        delete item.id
        model.save(item, local: true)

    # Use to send modifyed data to the server
    # You can use it manually for sending changes
    #
    # @storage.sync.push()
    #
    # At first, method gets all dirty-objects (added or updated)
    # and sends every object to server using 'Backbone.sync' method
    # after that it sends deleted objects to the server
    push: ->
      @pushItem(item) for item in @collection.dirty()
      @flushItem(sid) for sid in @storage.destroyIds.values

    pushItem: (item) ->
      @storage.replaceKeyFields(item, 'server')
      localId = item.id
      delete item.attributes.id
      [method, item.id] = if item.get('sid') is 'new' then ['create', null] else ['update', item.attributes.sid]

      @ajax method, item, success: (model, response, opts) =>
        item.set(sid: response.id) if method is 'create'
        item.save {dirty: false}, {local: true}

      item.attributes.id = localId; item.id = localId

    flushItem: (sid) ->
      model = @collection.fakeModel(sid)
      @ajax 'delete', model, success: (model, response, opts) =>
        @storage.destroyIds.remove(sid)

  # Manage indexes storing to localStorage.
  # For example 1,2,3,4,5,6
  class Offline.Index

    # @name - index name
    # @storage.setItem 'dreams', '1,2,3,4'
    # records = new Offline.Index('dreams', @storage)
    # records.values - an array based on @storage data
    # => ['1', '2', '3', '4']
    constructor: (@name, @storage) ->
      store = @storage.getItem(@name)
      @values = (store && store.split(',')) || []

    # Add a new item to the end of list
    # records.add '5'
    # records.values
    # => ['1', '2', '3', '4', '5']
    add: (itemId) ->
      unless _.include(@values, itemId.toString())
        @values.push itemId.toString()
      @save()

    # Remove element from a list of values
    # records.remove '3'
    # records.values
    # => ['1', '2', '4', '5']
    remove: (itemId) ->
      @values = _.without @values, itemId.toString()
      @save()

    save: ->
      @storage.setItem @name, @values.join(',')

    reset: ->
      @values = []
      @storage.removeItem @name

  # Uses as wrapper for 'Backbone.Collection'
  class Offline.Collection

    # @items is an instance of 'Backbone.Collection'
    constructor: (@items) ->

    # Returns models marked as "dirty" - {dirty: true}
    # That is needy for synchronization with server
    dirty: ->
      @items.where dirty: true

    # Get a model from the set by sid.
    get: (sid) ->
      @items.find (item) -> item.get('sid') is sid

    # destory old models from the collection which have not marked as "new"
    destroyDiff: (response) ->
      diff = _.difference(_.without(@items.pluck('sid'), 'new'), _.pluck(response, 'id'))
      @get(sid)?.destroy(local: true) for sid in diff

    # Use to create a fake model for the set
    fakeModel: (sid) ->
      model = new Backbone.Model(id: sid)
      model.urlRoot = @items.url
      model
