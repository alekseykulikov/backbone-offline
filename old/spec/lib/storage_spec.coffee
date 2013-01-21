describe 'Offline.Storage', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    @storage = @dreams.storage
    spyOn(Offline, 'onLine').andReturn(true)

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

  describe 'isLocalStorageSupport', ->
    it 'should returns false when raised error', ->
      spyOn(localStorage, 'setItem').andThrow('QUOTA_EXCEEDED_ERR')
      expect(@storage.isLocalStorageSupport()).toBeFalsy()

    it 'should returns true for modern browsers which support localStorage', ->
      expect(@storage.isLocalStorageSupport()).toBeTruthy()

  describe 'setItem', ->
    it 'should sets item to localStorage', ->
      @storage.setItem('key', 'value')
      expect(@storage.getItem 'key').toEqual('value')

    describe 'when localStorage has errors', ->
      it "should calls 'quota_exceed' when item exceeding browser quota", ->
        quotaCallback = jasmine.createSpy('-Quota Exceeded Error-')
        spyOn(localStorage, 'setItem').andThrow(name: 'QUOTA_EXCEEDED_ERR')

        @storage.collection.on('quota_exceed', quotaCallback)
        @storage.setItem('key', 'value')
        expect(quotaCallback.callCount).toBe(1)

      it 'should sets @support to false in other cases', ->
        spyOn(localStorage, 'setItem').andThrow('UNKNOWN_ERR')
        @storage.setItem('key', 'value')
        expect(@storage.support).toBeFalsy()

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
      expect(@storage.remove).toHaveBeenCalledWith(@dream, {})

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

    it 'should not call "full" or "incremental" if added option {local: true}', ->
      @dreams.fetch(local: true)
      expect(@storage.sync.full.callCount).toBe(0)
      expect(@storage.sync.incremental.callCount).toBe(0)

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

    it "should push item if options.autoPush", ->
      @storage.autoPush = true
      spyOn(@storage.sync, 'pushItem')
      @storage.create(@dream)
      expect(@storage.sync.pushItem).toHaveBeenCalledWith(@dream)

    it "should does not push item if local=true", ->
      @storage.autoPush = true
      spyOn(@storage.sync, 'pushItem')
      @storage.create(@dream, local: true)
      expect(@storage.sync.pushItem.callCount).toBe(0)

  describe 'remove', ->
    beforeEach ->
      @dream = @dreams.create({id: 'dcba'}, {regenerateId: true})

    it 'should remove item from localStorage', ->
      @storage.remove(@dream)
      expect(localStorage.getItem 'dreams-dcba').toBeNull()

    it 'should remove item.id from @allIds', ->
      @storage.remove(@dream)
      expect(_.include @storage.values, 'dcba').toBeFalsy()

    it "should flush item if options.autoPush", ->
      @storage.autoPush = true
      spyOn(@storage.sync, 'flushItem')
      @storage.remove(@dream)
      expect(@storage.sync.flushItem).toHaveBeenCalledWith('dcba')

  describe 'isEmpty', ->
    it "should return true when localStorage's key is null", ->
      localStorage.removeItem('dreams')
      expect(@storage.isEmpty()).toBeTruthy()

    it 'should return false when localStorage has necessary key', ->
      localStorage.setItem('dreams', '1,2,3')
      expect(@storage.isEmpty()).toBeFalsy()

  describe 'mid', ->
    it "should return 24 hex digits", ->
      expect(@storage.mid()).toMatch /[a-f,0-9]{24}/

  describe 'clear', ->
    beforeEach ->
      localStorage.setItem('dreams', '1234')
      localStorage.setItem('dreams-1234', 'id:0002')
      localStorage.setItem('other', '')

    it "should clear localStorage's items including collection-key", ->
      @storage.clear()
      expect(localStorage.getItem('dreams-1234')).toBeNull()

    it 'storage should be empty', ->
      @storage.clear()
      expect(@storage.isEmpty()).toBeTruthy()

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
