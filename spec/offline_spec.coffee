describe 'Offline', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()

  afterEach ->
    window.localStorage.clear()

  describe 'localSync', ->
    beforeEach ->
      @storage = @dreams.storage
      @dream = @dreams.create()
      registerFakeAjax url: '/api/dreams', successData: {}

    it 'should call "findAll" when reading collection', ->
      spyOn(@storage, 'findAll')
      @dreams.fetch()
      expect(@storage.findAll).toHaveBeenCalledWith(jasmine.any(Object))

    it 'should call "find" when reading model', ->
      spyOn(@storage, 'find')
      @dream.fetch()
      expect(@storage.find).toHaveBeenCalledWith(@dream, jasmine.any(Object))

    it 'should call "create" when creating model', ->
      spyOn(@storage, 'create')
      @dreams.create(name: 'New dream')
      expect(@storage.create).toHaveBeenCalled()

    it 'should call "update" when update model', ->
      spyOn(@storage, 'update')
      @dream.save(name: 'New dream')
      expect(@storage.update).toHaveBeenCalledWith(@dream, jasmine.any(Object))

    it 'should call "destroy" when delete model', ->
      spyOn(@storage, 'destroy')
      @dream.destroy()
      expect(@storage.destroy).toHaveBeenCalledWith(@dream, jasmine.any(Object))

    it "should calls \"options.success\" when storage's method responses something", ->
      successCallback = jasmine.createSpy('-Success Callback-')
      @dream.save({name: 'New dream'}, {success: (resp) -> successCallback(resp)})
      expect(successCallback).toHaveBeenCalledWith(@dream)

    it 'should call "options.error" when response is blank', ->
      errorCallback = jasmine.createSpy('-Error Callback-')
      spyOn(@storage, 'update').andReturn(null)
      @dream.save({name: ''}, {error: (message) -> errorCallback(message)})
      expect(errorCallback).toHaveBeenCalled()

  describe 'sync', ->
    it 'should delegate actions to Offline.localSync when @storage exists', ->
      spyOn(Offline, 'localSync')
      @dreams.fetch()

      expect(Offline.localSync).toHaveBeenCalled()

    it 'should delegate actions to Backbone.ajaxSync when @storage empty', ->
      @dreams.storage = null
      spyOn(Backbone, 'ajaxSync')
      @dreams.fetch()

      expect(Backbone.ajaxSync).toHaveBeenCalled()
