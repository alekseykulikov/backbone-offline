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

  describe 'create', ->
    beforeEach ->
      @dream = new Dream(name: 'Diving with scuba')

    it 'returns model attributes', ->
      expect(@storage.create(@dream).name).toEqual('Diving with scuba')

    it 'generates local id for new model', ->
      spyOn(@storage, 'guid').andReturn('1')
      @storage.create(@dream)
      expect(@storage.guid).toHaveBeenCalled()

    it 'calls save with new model', ->
      spyOn(@storage, 'save')
      @storage.create(@dream)
      expect(@storage.save).toHaveBeenCalledWith(jasmine.any(Object))

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

    it 'calls save with model', ->
      spyOn(@storage, 'save')
      @storage.update(@dream)
      expect(@storage.save).toHaveBeenCalledWith(@dream)

  describe 'destroy', ->
    beforeEach ->
      @dream = @dreams.create()

    it 'calls remove', ->
      spyOn(@storage, 'remove')
      @storage.destroy(@dream)
      expect(@storage.remove).toHaveBeenCalledWith(@dream)

    it 'changes @destroyRecords', ->
      @dream.set 'sid', '1'
      @storage.destroy(@dream)
      expect(@storage.destroyRecords.values).toEqual(['1'])

  describe 'find', ->
    it 'returns specified item', ->
      dream = @dreams.create()
      expect(@storage.find(dream).id).toEqual(dream.id)

  describe 'findAll', ->
    beforeEach ->
      spyOn(@storage.sync, 'incremental')
      spyOn(@storage.sync, 'full')

    it 'returns all items in collection', ->
      @dreams.create()
      expect(@storage.findAll().length).toEqual(1)

    it 'calls incremental sync', ->
      @storage.findAll()
      expect(@storage.sync.incremental).toHaveBeenCalled()

    it 'calls full sync when storage is empty', ->
      localStorage.clear()
      @storage.findAll()
      expect(@storage.sync.full).toHaveBeenCalled()

  describe 'save', ->
    beforeEach ->
      @dream = {id: 'abcd', name: 'New dream'}

    it 'saves item to localStorage', ->
      @storage.save(@dream)
      expect(localStorage.getItem 'dreams-abcd').toEqual(JSON.stringify @dream)

    it 'adds to @allRecords when item has new id', ->
      @storage.save(@dream)
      expect(_.include @storage.allRecords.values, 'abcd').toBeTruthy()

    it 'calls replaceKeyFields', ->
      spyOn(@storage, 'replaceKeyFields')
      @storage.save(@dream)
      expect(@storage.replaceKeyFields).toHaveBeenCalledWith(@dream, 'local')

  describe 'remove', ->
    beforeEach ->
      @dream = @dreams.create(id: 'dcba')
      @storage.remove(@dream)

    it 'removes item from localStorage', -> expect(localStorage.getItem 'dreams-dcba').toBeNull()
    it 'removes item id from @allRecords', -> expect(_.include @storage.values, 'dcba').toBeFalsy()

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
      expect(localStorage.getItem('dreams-1234')).toBeNull()

    it 'sets root record to ""', ->
      @storage.clear()
      expect(localStorage.getItem('dreams')).toEqual('')

    it 'does not clear the other collections', ->
      @storage.clear()
      expect(localStorage.getItem('other')).toEqual('')

    it 'resets @allRecords and @destroyRecords', ->
      spyOn(@storage.allRecords, 'reset')
      spyOn(@storage.destroyRecords, 'reset')
      @storage.clear()

      expect(@storage.allRecords.reset).toHaveBeenCalled()
      expect(@storage.destroyRecords.reset).toHaveBeenCalled()

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
