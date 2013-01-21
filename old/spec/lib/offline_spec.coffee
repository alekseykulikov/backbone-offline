describe 'Offline', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()

  afterEach ->
    window.localStorage.clear()

  describe 'onLine', ->
    it 'should returns true when onLine is undefined', ->
      window.navigator = {}
      expect(Offline.onLine()).toBeTruthy()

    it 'should returns true when onLine is true', ->
      window.navigator = {onLine: true}
      expect(Offline.onLine()).toBeTruthy()

    it 'should returns false when onLine is false', ->
      window.navigator = {onLine: false}
      expect(Offline.onLine()).toBeFalsy()

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
    beforeEach ->
      spyOn(Offline, 'localSync')
      spyOn(Backbone, 'ajaxSync')

    describe 'when @storage exists', ->
      it 'should delegates actions to Offline.localSync if @support equal true', ->
        @dreams.fetch()
        expect(Offline.localSync).toHaveBeenCalled()

      it 'should delegates actions to Backbone.ajaxSync if @support equal false', ->
        @dreams.storage.support = false
        @dreams.fetch()
        expect(Backbone.ajaxSync).toHaveBeenCalled()

    describe 'when @storage empty', ->
      it 'should delegate actions to Backbone.ajaxSync', ->
        @dreams.storage = null
        @dreams.fetch()
        expect(Backbone.ajaxSync).toHaveBeenCalled()
