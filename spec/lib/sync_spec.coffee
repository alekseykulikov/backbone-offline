describe 'Offline.Sync', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    @storage = @dreams.storage
    @sync = @storage.sync
    spyOn(Offline, 'onLine').andReturn(true)

  afterEach ->
    localStorage.clear()

  describe 'ajax', ->
    describe 'when onLine', ->
      beforeEach ->
        spyOn(Backbone, 'ajaxSync')
        spyOn(@sync, 'prepareOptions')
        @sync.ajax('read', @dreams, {})

      it 'should calls Backbone.ajaxSync', ->
        expect(Backbone.ajaxSync).toHaveBeenCalledWith('read', @dreams, {})

      it 'should runs prepareOptions', ->
        expect(@sync.prepareOptions).toHaveBeenCalled()

    describe 'when offline', ->
      it 'should sets offline', ->
        Offline.onLine.andReturn(false)
        @sync.ajax('read', @dreams, {})
        expect(localStorage.getItem('offline')).toEqual('true')

  describe 'full', ->
    beforeEach ->
      @options = success: (resp) ->
      @response = [{id: '1', name: 'Dream 1'}, {id: '2', name: 'Dream 2'}, {id: '3', name: 'Dream 3'}]
      registerFakeAjax url: '/api/dreams', successData: @response

    it 'should clear storage', ->
      spyOn(@storage, 'clear')
      @sync.full(@options)
      expect(@storage.clear).toHaveBeenCalled()

    it 'should reset collection once', ->
      resetCallback = jasmine.createSpy('-Reset Callback-')
      @sync.collection.items.on('reset', resetCallback)
      @sync.full(@options)
      expect(resetCallback.callCount).toBe(1)

    it 'should not reset collection if silent is passed', ->
      resetCallback = jasmine.createSpy('-Reset Callback-')
      @sync.collection.items.on('reset', resetCallback)
      @options.silent = true
      @sync.full(@options)
      expect(resetCallback.callCount).toBe(0)

    it 'should not trigger "add" callbacks', ->
      addCallback = jasmine.createSpy('-Add Callback-')
      @sync.collection.items.on('add', addCallback)
      @sync.full(@options)
      expect(addCallback.callCount).toBe(0)

    it 'should request data from server', ->
      spyOn($, 'ajax')
      @sync.full(@options)
      expect($.ajax.mostRecentCall.args[0].url).toEqual '/api/dreams'

    it 'should store received data to localStorage', ->
      @sync.full(@options)
      collectionKeys = _.filter Object.keys(localStorage), (key) -> (new RegExp 'dreams-(?!destroy)').test(key)
      expect(collectionKeys.length).toEqual(3)

    it 'should generate new id and store received data locally', ->
      @sync.full(@options)
      expect(@dreams.pluck("sid")).toEqual ['1', '2', '3']
      expect(id).toMatch(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/) for id in @dreams.pluck("id")

    it 'should reload collection', ->
      @dreams.add [{id: '725261a0-4f59-2fe2-4827-f52315414d51', sid: '1', name: 'Dream 1'},
                   {id: 'b27a0bcb-eb05-1296-fe63-b2a06a7c7943', sid: '2', name: 'Dream 2'}]
      @sync.full(@options)
      expect(@dreams.length).toEqual(3)

    it 'does not mark loaded data as dirty', ->
      @sync.full(@options)
      dirties = @dreams.filter (dream) -> dream.get('dirty')
      expect(dirties.length).toEqual(0)

    it 'should call "options.success" with received data', ->
      callback = jasmine.createSpy('-Success Callback-')
      @options = success: (resp) -> callback(resp)
      @sync.full(@options)
      expect(callback).toHaveBeenCalledWith(@response)

  describe 'incremental', ->
    it 'should call "pull"', ->
      spyOn(@sync, 'pull')
      @sync.incremental()
      expect(@sync.pull).toHaveBeenCalledWith(success: jasmine.any(Function))

    it 'should call "push"', ->
      registerFakeAjax url: '/api/dreams', successData: {}
      spyOn(@sync, 'push')
      @sync.incremental()
      expect(@sync.push).toHaveBeenCalledWith()

  describe 'prepareOptions', ->
    beforeEach ->
      @storage.setItem('offline', 'true')

    it 'should clears oflline item', ->
      @sync.prepareOptions({})
      expect(@storage.getItem('offline')).toEqual(null)

    it 'should change success function added call of incremental sync', ->
      successCallback = jasmine.createSpy('-Success Callback-')
      spyOn(@sync, 'incremental')
      options = {success: successCallback}
      @sync.prepareOptions(options)
      options.success()

      expect(successCallback.callCount).toBe(1)
      expect(@sync.incremental).toHaveBeenCalled()

  describe 'pull', ->
    beforeEach ->
      @dreams.create(name: 'item 1', sid: '1')
      @dreams.create(name: 'item 2', sid: '2')

      @response = [{name: 'updated item 2', id: '2'}, {name: 'item 3', id: '3'}]
      registerFakeAjax url: '/api/dreams', successData: @response

    it 'should request data from server', ->
      spyOn($, 'ajax')
      @sync.pull()
      expect($.ajax.mostRecentCall.args[0].url).toEqual '/api/dreams'

    it 'should destroy old items', ->
      spyOn(@sync.collection, 'destroyDiff')
      @sync.pull()
      expect(@sync.collection.destroyDiff).toHaveBeenCalledWith(@response)

    it 'should call "pullItem" for changed items', ->
      spyOn(@sync, 'pullItem')
      @sync.pull()
      expect(@sync.pullItem.callCount).toBe(2)

  describe 'pullItem', ->
    beforeEach ->
      @dream = @dreams.create({name: 'simple item', updated_at: '2012-03-04T14:00:10Z', sid: '1'}, {local: true})

    it "should update local's item by sid", ->
      @sync.pullItem(id: '1', name: 'updated', updated_at: '2012-03-05T14:00:10Z')
      expect(@dream.get 'name').toEqual('updated')

    it "should create new item when local's item does not find", ->
      @sync.pullItem(id: '2', name: 'create item')
      expect(@sync.collection.get('2').get 'name').toEqual('create item')

  describe 'createItem', ->
    beforeEach ->
      @item = name: 'New', id: '1'
      @collection = @dreams.storage.sync.collection

    it 'should create new item to collection', ->
      spyOn(@dreams, 'create')
      @sync.createItem(@item)
      expect(@dreams.create).toHaveBeenCalledWith {name: 'New', sid: '1'}, {local: true}

    it 'should save item.id to item.sid', ->
      @sync.createItem(@item)
      expect(@collection.get '1').toBeDefined()

    it 'does not mark new item as dirty', ->
      @sync.createItem(@item)
      expect(@collection.get('1').get 'dirty').toBeFalsy()

    it 'does not create item which was deleted local', ->
      @storage.destroyIds.values = ['1']
      @sync.createItem(@item)
      expect(@collection.get '1').toBeUndefined()

  describe 'updateItem', ->
    beforeEach ->
      @dream = @dreams.create({updated_at: '2012-03-04T14:00:10Z', sid: '2'}, {local: true})
      @item = name: 'Updated name', updated_at: '2012-03-04T14:31:40Z', id: '2'

    it 'should update attributes when local updated_at < new updated_at', ->
      @sync.updateItem(@item, @dream)
      expect(@dream.get 'name').toEqual('Updated name')

    it 'does not save id', ->
      @sync.updateItem(@item, @dream)
      expect(@dream.get 'id').toNotEqual('1')

    it 'does nothing when local updated_at greater than new updated_at', ->
      callback = jasmine.createSpy('-Change Callback-')
      @dream.on('change', callback)
      @item.updated_at = '2012-03-04T12:10:10Z'
      @sync.updateItem(@item, @dream)
      expect(callback.callCount).toBe(0)

    it 'does not mark item as dirty', ->
      @sync.updateItem(@item, @dream)
      expect(@dream.get 'dirty').toBeFalsy()

  describe 'push', ->
    it 'should call "pushItem" for dirty items', ->
      @dreams.create()
      @dreams.create(id: '2', name: 'Diving with scuba')
      spyOn(@sync, 'pushItem')

      @sync.push()
      expect(@sync.pushItem.callCount).toBe(2)

    it 'should call "flushItem" for destroyed items', ->
      destroyedDream = @dreams.create({id: '3', name: 'Learning to play on sax', sid: '3'}, {local: true})
      destroyedDream.destroy()
      spyOn(@sync, 'flushItem')

      @sync.push()
      expect(@sync.flushItem.callCount).toBe(1)

  describe 'pushItem', ->
    describe 'when item is new', ->
      beforeEach ->
        @dream = @dreams.create()

      it 'should call ajax', ->
        spyOn(@sync, 'ajax')
        @sync.pushItem(@dream)
        expect(@sync.ajax).toHaveBeenCalledWith('create', jasmine.any(Object), {success: jasmine.any(Function)})

      it 'sets dirty to false and sets sid', ->
        registerFakeAjax url: '/api/dreams', type: 'post', successData: {id: '12'}
        localId = @dream.id
        @sync.pushItem(@dream)

        expect(@dream.get 'dirty').toBeFalsy()
        expect(@dream.get 'sid').toEqual('12')
        expect(@dream.id).toEqual(localId)

      it 'should call "replaceKeyFields"', ->
        spyOn(@storage, 'replaceKeyFields')
        spyOn(Backbone, 'ajaxSync')
        @sync.pushItem(@dream)
        expect(@storage.replaceKeyFields).toHaveBeenCalledWith(@dream, 'server')

    describe 'when item exists', ->
      beforeEach ->
        @dream = @dreams.create(sid: '101')

      it 'should call ajax', ->
        spyOn(@sync, 'ajax')
        @sync.pushItem(@dream)
        expect(@sync.ajax).toHaveBeenCalledWith('update', jasmine.any(Object), {success: jasmine.any(Function)})

      it 'sets dirty to false', ->
        registerFakeAjax url: "/api/dreams/101", type: 'put', successData: {}
        localId = @dream.id
        @sync.pushItem(@dream)

        expect(@dream.get 'dirty').toBeFalsy()
        expect(@dream.id).toEqual(localId)

  describe 'flushItem', ->
    beforeEach ->
      @sid = @dreams.create(sid: '3', local: true).get('sid')

    it 'should call ajax', ->
      spyOn(@sync, 'ajax')
      @sync.flushItem(@sid)
      expect(@sync.ajax).toHaveBeenCalledWith('delete', jasmine.any(Object), {success: jasmine.any(Function)})

    it 'should clear @destroyIds', ->
      registerFakeAjax url: "/api/dreams/#{@sid}", type: 'delete', successData: {}
      @sync.flushItem(@sid)
      expect(@storage.destroyIds.values).toEqual([])
