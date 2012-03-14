describe 'Offline.Storage', ->
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
      @itemsStore = new Offline.Storage('items', [], autoSync: false, keys: {parent_id: @dreams})

    it 'initializes variable @allRecords', -> expect(@itemsStore.allRecords.values).toEqual(['2', '3'])
    it 'initializes variable @destroyRecords', -> expect(@itemsStore.destroyRecords.values).toEqual(['1', '4'])
    it 'initializes variable @keys by options', -> expect(@itemsStore.keys).toEqual(parent_id: @dreams)

    it 'sets default options', ->
      registerFakeAjax url: '/api/dreams', successData: {}
      storage = new Offline.Storage('dreams', @dreams)

      expect(storage.keys).toEqual({})

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
      @storage2 = new Offline.Storage('child-dreams', @childDreams, autoSync: false, keys: {parent_id: @dreams})
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
        expect(@storage2.colWrapper.get('100').get 'parent_id').toEqual(@dream.id)

      it 'replace local id to server on push', ->
        childDream = @childDreams.create(name: 'Live in Norvay', parent_id: '1')
        spyOn(Backbone, 'ajaxSync')
        @storage2.pushItem(childDream)
        expect(Backbone.ajaxSync.mostRecentCall.args[1].get 'parent_id').toEqual('1')

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
      expect(@storage.colWrapper.get '1').toBeDefined()

    it 'does not mark new item as dirty', ->
      @storage.createItem(name: 'New', id: '1')
      expect(@storage.colWrapper.get('1').get 'dirty').toBeFalsy()

    it 'does not create local deleted item', ->
      localStorage.setItem('dreams-destroy', '2')
      @storage.destroyRecords = new Offline.Records('dreams-destroy')
      @storage.createItem(name: 'Old item', id: '2')
      expect(@storage.colWrapper.get '2').toBeUndefined()
