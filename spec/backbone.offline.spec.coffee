class Dream extends Backbone.Model
  defaults:
    name : 'Visit Iceland'

class Dreams extends Backbone.Collection
  model: Dream
  url: '/api/dreams'

  initialize: ->
    @storage = new Storage('dreams', this, autoSync: false)


describe 'window.localStorageRecords', ->
  beforeEach ->
    localStorage.setItem('ideas', '2,3')
    @records = new localStorageRecords('ideas')

  it 'initializes @name', -> expect(@records.name).toEqual('ideas')
  it 'initializes @values', -> expect(@records.values).toEqual(['2', '3'])

  describe 'add', ->
    beforeEach -> @records.add('5')
    it 'pushes value to values', -> expect(@records.values).toEqual(['2', '3', '5'])
    it 'updates localStorage item', -> expect(localStorage.getItem 'ideas').toEqual('2,3,5')

    it 'does not include itemId to values twice', ->
      @records.add('5')
      expect(@records.values).toEqual(['2', '3', '5'])

  describe 'remove', ->
    beforeEach -> @records.remove('2')
    it 'remove value from values', -> expect(@records.values).toEqual(['3'])
    it 'updates localStorage item', -> expect(localStorage.getItem 'ideas').toEqual('3')


describe 'window.Storage', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    @storage = @dreams.storage

  afterEach ->
    localStorage.clear()

  describe 'constructor', ->
    beforeEach ->
      localStorage.setItem('items', '2,3')
      localStorage.setItem('items-destroy', '1,4')
      @itemsStore = new Storage('items', [], autoSync: false, keys: {parent_id: @dreams})

    it 'initializes variable @allRecords', -> expect(@itemsStore.allRecords.values).toEqual(['2', '3'])
    it 'initializes variable @destroyRecords', -> expect(@itemsStore.destroyRecords.values).toEqual(['1', '4'])
    it 'initializes variable @keys by options', -> expect(@itemsStore.keys).toEqual(parent_id: @dreams)
    it 'initializes variable @autoSync by options', -> expect(@itemsStore.autoSync).toBeFalsy()

    it 'sets default options', ->
      registerFakeAjax url: '/api/dreams', successData: {}
      storage = new Storage('dreams', @dreams)

      expect(storage.keys).toEqual({})
      expect(storage.autoSync).toBeTruthy()

  describe 'idAttribute manipulations', ->
    beforeEach ->
      @storage.idAttribute = "_id"

    it 'saves correct sid on create', ->
      item = @storage.create name: 'New name', _id: '1'
      expect(item.sid).toEqual '1'

    it 'creates new record on pull', ->
      @storage.pullItem(_id: '5', name: 'New dream')
      expect(@storage.findBySid('5').get 'name').toEqual('New dream')

    it 'finds correct record for update on pull', ->
      item = @dreams.create {name: 'New name', _id: '1', updated_at: '2012-03-04T14:00:10Z'}, {local: true}
      @storage.pullItem(_id: '1', name: 'Updated name', updated_at: '2012-03-04T15:00:10Z')
      expect(item.get 'name').toEqual('Updated name')

    it 'replace "new" sid on push', ->
      item = @dreams.create name: 'New name'
      registerFakeAjax url: '/api/dreams', type: 'post', successData: {_id: '11'}

      @storage.pushItem(item)
      expect(item.get 'sid').toEqual '11'

  describe 'create', ->
    beforeEach ->
      @dream = new Dream(name: 'Diving with scuba')

    it 'returns model attributes', ->
      expect(@storage.create(@dream).name).toEqual('Diving with scuba')

    it 'generates local id for new model', ->
      spyOn(@storage, 'guid').andReturn('1')
      @storage.create(@dream)
      expect(@storage.guid).toHaveBeenCalled()

    it 'calls saveItem with new model', ->
      spyOn(@storage, 'saveItem')
      @storage.create(@dream)
      expect(@storage.saveItem).toHaveBeenCalledWith(jasmine.any(Object))

    it 'sets updated_at and dirty', ->
      createdModel = @storage.create(@dream)
      expect(createdModel.dirty).toBeTruthy()
      expect(createdModel.updated_at).toBeDefined()

    it 'does not set updated_at and dirty if local true', ->
      createdModel = @storage.create(@dream, local: true)
      expect(createdModel.dirty).toBeUndefined()
      expect(createdModel.updated_at).toBeUndefined()

    describe 'saves sid - server id', ->
      it 'model id', -> expect(@storage.create(id: 1).sid).toEqual(1)
      it '"new" when model was create localy', -> expect(@storage.create(@dream).sid).toEqual('new')
      it 'model sid attribute if model has it', -> expect(@storage.create(sid: 'abcd').sid).toEqual('abcd')

  describe 'update', ->
    beforeEach ->
      @dream = @dreams.create()

    it 'sets updated_at and dirty', ->
      updatedModel = @storage.update(@dream)
      expect(updatedModel.get 'dirty').toBeTruthy()
      expect(updatedModel.get 'updated_at').toBeDefined()

    it 'does not set updated_at and dirty if local true', ->
      updatedModel = @storage.update(@dream, local: true)
      expect(updatedModel.dirty).toBeUndefined()
      expect(updatedModel.updated_at).toBeUndefined()

    it 'calls saveItem with model', ->
      spyOn(@storage, 'saveItem')
      @storage.update(@dream)
      expect(@storage.saveItem).toHaveBeenCalledWith(@dream)

  describe 'destroy', ->
    beforeEach ->
      @dream = @dreams.create()

    it 'calls removeItem', ->
      spyOn(@storage, 'removeItem')
      @storage.destroy(@dream)
      expect(@storage.removeItem).toHaveBeenCalledWith(@dream)

    it 'changes @destroyRecords', ->
      @dream.set 'sid', '1'
      @storage.destroy(@dream)
      expect(@storage.destroyRecords.values).toEqual(['1'])

  describe 'find', ->
    it 'returns specified item', ->
      dream = @dreams.create()
      expect(@storage.find(dream).id).toEqual(dream.id)

  describe 'findAll', ->
    it 'returns all items in collection', ->
      @dreams.create()
      @storage.findAll(@dreams)
      expect(@storage.findAll().length).toEqual(1)

  describe 'fullSync', ->
    beforeEach ->
      @options = success: (resp) ->
      @response = [{name: 'Dream 1'}, {name: 'Dream 2'}, {name: 'Dream 3'}]
      registerFakeAjax url: '/api/dreams', successData: @response

    it 'clears the collection', ->
      spyOn(@storage, 'clear')
      @storage.fullSync(@options)
      expect(@storage.clear).toHaveBeenCalled()

    it 'resets collection', ->
      spyOn(@dreams, 'reset')
      @storage.fullSync(@options)
      expect(@dreams.reset).toHaveBeenCalledWith([])

    it 'sets collection-name item', ->
      spyOn(localStorage, 'setItem')
      @storage.fullSync(@options)
      expect(localStorage.setItem).toHaveBeenCalledWith('dreams', '')

    it 'requests data from server', ->
      spyOn($, 'ajax')
      @storage.fullSync(@options)
      expect($.ajax).toHaveBeenCalledWith type: 'GET', dataType: 'json', url: '/api/dreams', success: jasmine.any(Function)

    it 'stores received data to localStorage', ->
      @storage.fullSync(@options)
      expect(localStorage.length).toEqual(4)

    it 'does not mark loaded data as dirty', ->
      @storage.fullSync(@options)
      dirties = @dreams.filter (dream) -> dream.get('dirty')
      expect(dirties.length).toEqual(0)

    it 'calls options.success with received data', ->
      callback = jasmine.createSpy('-Success Callback-')
      @options = success: (resp) -> callback(resp)
      @storage.fullSync(@options)
      expect(callback).toHaveBeenCalledWith(@response)

  describe 'incrementalSync', ->
    it 'calls pull method', ->
      spyOn(@storage, 'pull')
      @storage.incrementalSync()
      expect(@storage.pull).toHaveBeenCalledWith(success: jasmine.any(Function))

    it 'calls push method', ->
      registerFakeAjax url: '/api/dreams', successData: {}
      spyOn(@storage, 'push')
      @storage.incrementalSync()
      expect(@storage.push).toHaveBeenCalledWith()

  describe 'pull', ->
    beforeEach ->
      @dreams.create(name: 'item 1', sid: '1')
      @dreams.create(name: 'item 2', sid: '2')

      response = [{name: 'updated item 2', id: '2'}, {name: 'item 3', id: '3'}]
      registerFakeAjax url: '/api/dreams', successData: response

    it 'requests data from server', ->
      spyOn($, 'ajax')
      @storage.pull()
      expect($.ajax).toHaveBeenCalledWith type: 'GET', dataType: 'json', url: '/api/dreams', success: jasmine.any(Function)

    it 'calls removeBySid for old items', ->
      spyOn(@storage, 'removeBySid')
      @storage.pull()
      expect(@storage.removeBySid.callCount).toBe(1)

    it 'calls pullItem for changed items', ->
      spyOn(@storage, 'pullItem')
      @storage.pull()
      expect(@storage.pullItem.callCount).toBe(2)

  describe 'push', ->
    it 'calls pushItem for dirty items', ->
      @dreams.create()
      @dreams.create(id: '2', name: 'Diving with scuba')
      spyOn(@storage, 'pushItem')

      @storage.push()
      expect(@storage.pushItem.callCount).toBe(2)

    it 'calls destroyBySid for destroyed items', ->
      destroyedDream = @dreams.create({id: '3', name: 'Learning to play on sax', sid: '3'}, {local: true})
      destroyedDream.destroy()
      spyOn(@storage, 'destroyBySid')

      @storage.push()
      expect(@storage.destroyBySid.callCount).toBe(1)

  describe 'saveItem', ->
    beforeEach ->
      @dream = {id: 'abcd', name: 'New dream'}

    it 'saves item to localStorage', ->
      @storage.saveItem(@dream)
      expect(localStorage.getItem 'dreams-abcd').toEqual(JSON.stringify @dream)

    it 'adds to @allRecords when item has new id', ->
      @storage.saveItem(@dream)
      expect(_.include @storage.allRecords.values, 'abcd').toBeTruthy()

    it 'calls replaceKeyFields', ->
      spyOn(@storage, 'replaceKeyFields')
      @storage.saveItem(@dream)
      expect(@storage.replaceKeyFields).toHaveBeenCalledWith(@dream, 'local')

  describe 'removeItem', ->
    beforeEach ->
      @dream = @dreams.create(id: 'dcba')
      @storage.removeItem(@dream)

    it 'removes item from localStorage', -> expect(localStorage.getItem 'dreams-dcba').toBeNull()
    it 'removes item id from @allRecords', -> expect(_.include @storage.values, 'dcba').toBeFalsy()

  describe 'replaceKeyFields', ->
    beforeEach ->
      localStorage.setItem('child-dreams', '')
      @childDreams = new Dreams()
      @storage2 = new Storage('child-dreams', @childDreams, autoSync: false, keys: {parent_id: @dreams})
      @childDreams.storage = @storage2
      @dream = @dreams.create name: 'Visit Norway', sid: '1'

    it 'replaces server ids to local when method is local', ->
      item = @storage2.replaceKeyFields({name: 'Live in Norvay', parent_id: '1'}, 'local')
      expect(item.parent_id).toEqual @dream.id

    it 'replaces local id to server id', ->
      item = @storage2.replaceKeyFields({name: 'Live in Norvay', parent_id: @dream.id}, 'server')
      expect(item.parent_id).toEqual @dream.get 'sid'

    describe 'storage behavior when @keys exists', ->
      it 'replace server id to local on create', ->
        childDream = @childDreams.create(name: 'Live in Norvay', parent_id: '1')
        expect(childDream.get 'parent_id').toEqual @dream.id

      it 'replace server id to local on update', ->
        dream2 = @dreams.create(name: 'Visit Iceland', sid: '2')
        childDream = @childDreams.create(name: 'Live in Norvay', parent_id: '1')
        childDream.save(name: 'Live in Iceland', parent_id: '2')
        expect(childDream.get 'parent_id').toEqual dream2.id

      it 'replace server id to local on pull', ->
        @storage2.pullItem(name: 'Live in Norvay', parent_id: '1', id: '100')
        expect(@storage2.findBySid('100').get 'parent_id').toEqual(@dream.id)

      it 'replace local id to server on push', ->
        childDream = @childDreams.create(name: 'Live in Norvay', parent_id: '1')
        spyOn(Backbone, 'ajaxSync')
        @storage2.pushItem(childDream)
        expect(Backbone.ajaxSync.mostRecentCall.args[1].get 'parent_id').toEqual('1')

  describe 'getDirties', ->
    it 'return items with dirty mark', ->
      @dreams.add [{id: 1, dirty: false}, {id: 2, dirty: true}, {id: 3, dirty: false}]
      expect(@storage.getDirties().length).toEqual 1

  describe 'prepareStorage', ->
    it 'runs fullSync when storage is Empty', ->
      localStorage.removeItem('dreams')
      spyOn(@storage, 'fullSync')
      @storage.prepareStorage()
      expect(@storage.fullSync).toHaveBeenCalledWith()

    it 'runs incrementalSync when storage exists and @autoSync=true', ->
      @storage.autoSync = true
      spyOn(@storage, 'incrementalSync')
      @storage.prepareStorage()
      expect(@storage.incrementalSync).toHaveBeenCalledWith()

  describe 'pushItem', ->
    describe 'when item is new', ->
      beforeEach ->
        @dream = @dreams.create()

      it 'calls Backbone.ajaxSync', ->
        spyOn(Backbone, 'ajaxSync')
        @storage.pushItem(@dream)
        expect(Backbone.ajaxSync).toHaveBeenCalledWith('create', jasmine.any(Object), {success: jasmine.any(Function)})
        expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toBeNull()

      it 'sets dirty to false and sets sin', ->
        registerFakeAjax url: '/api/dreams', type: 'post', successData: {id: '12'}
        localId = @dream.id
        @storage.pushItem(@dream)

        expect(@dream.get 'dirty').toBeFalsy()
        expect(@dream.get 'sid').toEqual('12')
        expect(@dream.id).toEqual(localId)

      it 'calls replaceKeyFields', ->
        spyOn(@storage, 'replaceKeyFields')
        spyOn(Backbone, 'ajaxSync')
        @storage.pushItem(@dream)
        expect(@storage.replaceKeyFields).toHaveBeenCalledWith(@dream, 'server')

    describe 'when item exists', ->
      beforeEach ->
        @dream = @dreams.create(id: 'anything', sid: '101')

      it 'calls Backbone.ajaxSync', ->
        spyOn(Backbone, 'ajaxSync')
        @storage.pushItem(@dream)
        expect(Backbone.ajaxSync).toHaveBeenCalledWith('update', jasmine.any(Object), {success: jasmine.any(Function)})
        expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toEqual('101')

      it 'sets dirty to false', ->
        registerFakeAjax url: "/api/dreams/101", type: 'put', successData: {}
        localId = @dream.id
        @storage.pushItem(@dream)

        expect(@dream.get 'dirty').toBeFalsy()
        expect(@dream.id).toEqual(localId)

  describe 'destroyBySid', ->
    beforeEach ->
      @sid = @dreams.create(sid: '3', local: true).get('sid')

    it 'calls Backbone.ajaxSync', ->
      spyOn(Backbone, 'ajaxSync')
      @storage.destroyBySid(@sid)
      expect(Backbone.ajaxSync).toHaveBeenCalledWith('delete', jasmine.any(Object), {success: jasmine.any(Function)})
      expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toEqual('3')

    it 'clears @destroyRecords', ->
      registerFakeAjax url: "/api/dreams/#{@sid}", type: 'delete', successData: {}
      @storage.destroyBySid(@sid)
      expect(@storage.destroyRecords.values).toEqual([])

  describe 'isEmpty', ->
    it 'returns true when localStorage item is null', ->
      localStorage.removeItem('dreams')
      expect(@storage.isEmpty()).toBeTruthy()

    it 'returns false when localStorage has collection-name item', ->
      localStorage.setItem('dreams', '1,2,3')
      expect(@storage.isEmpty()).toBeFalsy()

  describe 'clear', ->
    beforeEach ->
      localStorage.setItem('dreams', '1234')
      localStorage.setItem('dreams-1234', 'id:0002')
      localStorage.setItem('other', '')

    it 'clears all localStorage items which include collection-name', ->
      @storage.clear()
      expect(localStorage.getItem('dreams')).toBeNull()
      expect(localStorage.getItem('dreams-1234')).toBeNull()

    it 'does not clear the other collections', ->
      @storage.clear()
      expect(localStorage.getItem('other')).toEqual('')

    it 'resets @allRecords and @destroyRecords', ->
      spyOn(@storage.allRecords, 'reset')
      spyOn(@storage.destroyRecords, 'reset')
      @storage.clear()

      expect(@storage.allRecords.reset).toHaveBeenCalled()
      expect(@storage.destroyRecords.reset).toHaveBeenCalled()

  describe 'getRemovedIds', ->
    beforeEach ->
      @dreams.create(name: 'item 1', sid: '1')
      @dreams.create(name: 'item 2', sid: '2')
      @dreams.create(name: 'item 3', sid: '3')

      @response = [{name: 'item 1', id: '1'}]

    it 'returns array of items to remove', ->
      expect(@storage.getRemovedIds(@response)).toEqual(['2', '3'])

    it 'ignoring items with "new" sid', ->
      @dreams.create(name: 'item 4', sid: 'new')
      expect(@storage.getRemovedIds(@response)).toEqual(['2', '3'])

  describe 'removeBySid', ->
    beforeEach ->
      @dream = @dreams.create(name: 'simple item', sid: '1')

    it 'destroy item by sid', ->
      spyOn(@dream, 'destroy')
      @storage.removeBySid('1')
      expect(@dream.destroy).toHaveBeenCalledWith(local: true)

    it 'does not set mark to localStorage', ->
      @storage.removeBySid('1')
      expect(localStorage.getItem('dreams-destroy')).toBeNull()

  describe 'findBySid', ->
    it 'finds item in collection by sid attribute', ->
      @dreams.add [{name: 'first', sid: '1'}, {name: 'second', sid: '2'}]
      expect(@storage.findBySid('2').get 'name').toEqual('second')

    it 'finds in different collection in second parameter', ->
      localStorage.setItem('child-dreams', '')
      childDreams = new Dreams()
      storage2 = new Storage('child-dreams', childDreams, autoSync: false)
      childDreams.add [{name: 'first', sid: 'a'}, {name: 'second', sid: 'b'}]
      expect(@storage.findBySid('b', childDreams).get 'name').toEqual('second')

  describe 'pullItem', ->
    beforeEach ->
      @dream = @dreams.create(name: 'simple item', updated_at: '2012-03-04T14:00:10Z', sid: '1')

    it 'updates local item by sid', ->
      spyOn(@storage, 'updateItem')
      @storage.pullItem({id: '1', name: 'updated'})
      expect(@storage.updateItem).toHaveBeenCalledWith(@dream, {id: '1', name: 'updated'})

    it 'creates new item when does not find', ->
      spyOn(@storage, 'createItem')
      @storage.pullItem(id: '2', name: 'create item')
      expect(@storage.createItem).toHaveBeenCalledWith(id: '2', name: 'create item')

  describe 'updateItem', ->
    beforeEach ->
      @dream = @dreams.create({updated_at: '2012-03-04T14:00:10Z'}, {local: true})

    it 'updates attributes when local updated_at < new updated_at', ->
      @storage.updateItem(@dream, name: 'Updated name', updated_at: '2012-03-04T14:31:40Z')
      expect(@dream.get 'name').toEqual('Updated name')

    it 'does not save id', ->
      @storage.updateItem(@dream, name: 'Updated name', id: '1', updated_at: '2012-03-04T15:3520Z')
      expect(@dream.get 'id').toNotEqual('1')

    it 'does nothing when local updated_at > new updated_at', ->
      callback = jasmine.createSpy('-Change Callback-')
      @dream.on('change', callback)
      @storage.updateItem(@dream, name: 'New name', updated_at: '2012-03-04T12:10:10Z')
      expect(callback.callCount).toBe(0)

    it 'does not mark item as dirty', ->
      @storage.updateItem(@dream, name: 'Updated name', id: '1', updated_at: '2012-03-04T15:3520Z')
      expect(@dream.get 'dirty').toBeFalsy()

  describe 'createItem', ->
    it 'creates new item to collection', ->
      spyOn(@dreams, 'create')
      @storage.createItem(name: 'New', id: '1')
      expect(@dreams.create).toHaveBeenCalledWith {name: 'New', sid: '1'}, {local: true}

    it 'saves item.id to item.sid', ->
      @storage.createItem(name: 'New', id: '1')
      expect(@storage.findBySid '1').toBeDefined()

    it 'does not mark new item as dirty', ->
      @storage.createItem(name: 'New', id: '1')
      expect(@storage.findBySid('1').get 'dirty').toBeFalsy()

    it 'does not create local deleted item', ->
      localStorage.setItem('dreams-destroy', '2')
      @storage.destroyRecords = new localStorageRecords('dreams-destroy')
      @storage.createItem(name: 'Old item', id: '2')
      expect(@storage.findBySid '2').toBeUndefined()


describe 'Backbone.localSync', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    @storage = @dreams.storage

  afterEach ->
    window.localStorage.clear()

  beforeEach ->
    registerFakeAjax url: '/api/dreams', successData: {}
    @dreams.fetch()
    @dream = @dreams.create()

  it 'calls findAll when read collection', ->
    spyOn(@storage, 'findAll')
    @dreams.fetch()
    expect(@storage.findAll).toHaveBeenCalledWith()

  it 'calls find when read model', ->
    spyOn(@storage, 'find')
    @dream.fetch()
    expect(@storage.find).toHaveBeenCalledWith(@dream)

  it 'calls create when create model', ->
    spyOn(@storage, 'create')
    @dreams.create(name: 'New dream')
    expect(@storage.create).toHaveBeenCalled()

  it 'calls update when update model', ->
    spyOn(@storage, 'update')
    @dream.save(name: 'New dream')
    expect(@storage.update).toHaveBeenCalledWith(@dream, jasmine.any(Object))

  it 'calls destroy when delete model', ->
    spyOn(@storage, 'destroy')
    @dream.destroy()
    expect(@storage.destroy).toHaveBeenCalledWith(@dream, jasmine.any(Object))

  it 'calls options.success when method response something', ->
    callback = jasmine.createSpy('-Success Callback-')
    @dream.save({name: 'New dream'}, {success: (resp) -> callback(resp)})
    expect(callback).toHaveBeenCalledWith(@dream)

  it 'calls options.error when response is blank', ->
    errorCallback = jasmine.createSpy('-Error Callback-')
    spyOn(@storage, 'update').andReturn(null)
    @dream.save({name: ''}, {error: (message) -> errorCallback(message)})
    expect(errorCallback).toHaveBeenCalled()


describe 'Backbone.offline', ->
  it 'delegates actions to Backbone.localSync when storage attribute exists', ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    spyOn(Backbone, 'localSync')

    @dreams.fetch()
    expect(Backbone.localSync).toHaveBeenCalled()

  it 'delegates actions to Backbone.ajaxSync for default behavior when storage attribute empty', ->
    @dreams = new Dreams()
    @dreams.storage = null
    spyOn(Backbone, 'ajaxSync')

    @dreams.fetch()
    expect(Backbone.ajaxSync).toHaveBeenCalled()
