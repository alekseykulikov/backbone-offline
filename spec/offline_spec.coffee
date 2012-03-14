describe 'Offline', ->
  describe 'localSync', ->
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

  describe 'sync', ->
    it 'delegates actions to Offline.localSync when storage attribute exists', ->
      localStorage.setItem('dreams', '')
      @dreams = new Dreams()
      spyOn(Offline, 'localSync')

      @dreams.fetch()
      expect(Offline.localSync).toHaveBeenCalled()

    it 'delegates actions to Backbone.ajaxSync for default behavior when storage attribute empty', ->
      @dreams = new Dreams()
      @dreams.storage = null
      spyOn(Backbone, 'ajaxSync')

      @dreams.fetch()
      expect(Backbone.ajaxSync).toHaveBeenCalled()
