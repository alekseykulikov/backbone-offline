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

    it 'sets @allIds', -> expect(@itemsStore.allIds.values).toEqual(['2', '3'])
    it 'sets @destroyIds', -> expect(@itemsStore.destroyIds.values).toEqual(['1', '4'])
    it 'sets @keys by options.keys', -> expect(@itemsStore.keys).toEqual(parent_id: @dreams)

  describe 'create', ->
    beforeEach ->
      @dream = new Dream(name: 'Diving with scuba')

    it "should return model's attributes", ->
      expect(@storage.create(@dream).get 'name').toEqual('Diving with scuba')

    it 'should generate local id', ->
      spyOn(@storage, 'guid').andReturn('1')
      @storage.create(@dream)
      expect(@storage.guid).toHaveBeenCalled()

    it 'should call "save"', ->
      spyOn(@storage, 'save')
      @storage.create(@dream)
      expect(@storage.save).toHaveBeenCalledWith(jasmine.any(Object), {regenerateId: true})

    it 'sets updated_at and dirty attributes', ->
      createdModel = @storage.create(@dream)
      expect(createdModel.get 'dirty').toBeTruthy()
      expect(createdModel.get 'updated_at').toBeDefined()

    it 'does not set updated_at and dirty when options = {local: true}', ->
      createdModel = @storage.create(@dream, local: true)
      expect(createdModel.dirty).toBeUndefined()
      expect(createdModel.updated_at).toBeUndefined()

    it 'should save server id to "sid" attribute', ->
      expect(@storage.create(new Dream(id: 1)).get 'sid').toEqual(1)

    it 'should set "sid" attribute to "new" when model was create locally', ->
      expect(@storage.create(@dream).get 'sid').toEqual('new')

    it "should set model's \"sid\" attribute when model has it", ->
      expect(@storage.create(new Dream(sid: 'abcd')).get 'sid').toEqual('abcd')

  describe 'update', ->
    beforeEach ->
      @dream = @dreams.create()

    it 'sets updated_at and dirty', ->
      updatedModel = @storage.update(@dream)
      expect(updatedModel.get 'dirty').toBeTruthy()
      expect(updatedModel.get 'updated_at').toBeDefined()

    it 'does not set updated_at and dirty when options = {local: true}', ->
      updatedModel = @storage.update(@dream, local: true)
      expect(updatedModel.dirty).toBeUndefined()
      expect(updatedModel.updated_at).toBeUndefined()

    it 'should call "save"', ->
      spyOn(@storage, 'save')
      @storage.update(@dream)
      expect(@storage.save).toHaveBeenCalledWith(@dream, {})

  describe 'destroy', ->
    beforeEach ->
      @dream = @dreams.create()

    it 'should call "remove"', ->
      spyOn(@storage, 'remove')
      @storage.destroy(@dream)
      expect(@storage.remove).toHaveBeenCalledWith(@dream)

    it 'should change @destroyIds', ->
      @dream.set 'sid', '1'
      @storage.destroy(@dream)
      expect(@storage.destroyIds.values).toEqual(['1'])

  describe 'find', ->
    it 'should return specified item', ->
      dream = @dreams.create()
      expect(@storage.find(dream).id).toEqual(dream.id)

  describe 'findAll', ->
    beforeEach ->
      spyOn(@storage.sync, 'incremental')
      spyOn(@storage.sync, 'full')

    it "should return all collection's items", ->
      @dreams.create()
      expect(@storage.findAll().length).toEqual(1)

    it 'should call "incremental" sync', ->
      @storage.findAll()
      expect(@storage.sync.incremental).toHaveBeenCalled()

    it 'should call "full" sync when storage is empty', ->
      localStorage.clear()
      @storage.findAll()
      expect(@storage.sync.full).toHaveBeenCalled()

  describe 'save', ->
    beforeEach ->
      @dream = new Dream(id: 'abcd', name: 'New dream')

    it 'should save item to localStorage', ->
      @storage.save(@dream)
      expect(localStorage.getItem 'dreams-abcd').toEqual(JSON.stringify @dream)

    it 'should add item.id to @allIds', ->
      @storage.save(@dream)
      expect(_.include @storage.allIds.values, 'abcd').toBeTruthy()

    it 'should call "replaceKeyFields"', ->
      spyOn(@storage, 'replaceKeyFields')
      @storage.save(@dream)
      expect(@storage.replaceKeyFields).toHaveBeenCalledWith(@dream, 'local')

  describe 'remove', ->
    beforeEach ->
      @dream = @dreams.create(id: 'dcba')
      @storage.remove(@dream)

    it 'should remove item from localStorage', -> expect(localStorage.getItem 'dreams-dcba').toBeNull()
    it 'should remove item.id from @allIds', -> expect(_.include @storage.values, 'dcba').toBeFalsy()

  describe 'isEmpty', ->
    it "should return true when localStorage's key is null", ->
      localStorage.removeItem('dreams')
      expect(@storage.isEmpty()).toBeTruthy()

    it 'should return false when localStorage has necessary key', ->
      localStorage.setItem('dreams', '1,2,3')
      expect(@storage.isEmpty()).toBeFalsy()

  describe 'clear', ->
    beforeEach ->
      localStorage.setItem('dreams', '1234')
      localStorage.setItem('dreams-1234', 'id:0002')
      localStorage.setItem('other', '')

    it "should clear localStorage's items including collection-key", ->
      @storage.clear()
      expect(localStorage.getItem('dreams-1234')).toBeNull()

    it 'sets collection-key to ""', ->
      @storage.clear()
      expect(localStorage.getItem('dreams')).toEqual('')

    it 'does not clear other collections', ->
      @storage.clear()
      expect(localStorage.getItem('other')).toEqual('')

    it 'should reset @allIds and @destroyIds', ->
      spyOn(@storage.allIds, 'reset')
      spyOn(@storage.destroyIds, 'reset')
      @storage.clear()

      expect(@storage.allIds.reset).toHaveBeenCalled()
      expect(@storage.destroyIds.reset).toHaveBeenCalled()

  describe 'replaceKeyFields', ->
    beforeEach ->
      localStorage.setItem('child-dreams', '')
      @childDreams = new Dreams()
      @storage2 = new Offline.Storage('child-dreams', @childDreams, autoSync: false, keys: {parent_id: @dreams})
      @childDreams.storage = @storage2
      @dream = @dreams.create name: 'Visit Norway', sid: '1'

    describe 'when method is "local"', ->
      it 'should replace server ids to local', ->
        item = @storage2.replaceKeyFields({name: 'Live in Norvay', parent_id: '1'}, 'local')
        expect(item.parent_id).toEqual @dream.id

    describe 'when method is "server"', ->
      it 'should replace local ids to server', ->
        item = @storage2.replaceKeyFields({name: 'Live in Norvay', parent_id: @dream.id}, 'server')
        expect(item.parent_id).toEqual @dream.get 'sid'
