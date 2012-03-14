(function() {

  describe('Offline', function() {
    describe('localSync', function() {
      beforeEach(function() {
        localStorage.setItem('dreams', '');
        this.dreams = new Dreams();
        return this.storage = this.dreams.storage;
      });
      afterEach(function() {
        return window.localStorage.clear();
      });
      beforeEach(function() {
        registerFakeAjax({
          url: '/api/dreams',
          successData: {}
        });
        this.dreams.fetch();
        return this.dream = this.dreams.create();
      });
      it('calls findAll when read collection', function() {
        spyOn(this.storage, 'findAll');
        this.dreams.fetch();
        return expect(this.storage.findAll).toHaveBeenCalledWith();
      });
      it('calls find when read model', function() {
        spyOn(this.storage, 'find');
        this.dream.fetch();
        return expect(this.storage.find).toHaveBeenCalledWith(this.dream);
      });
      it('calls create when create model', function() {
        spyOn(this.storage, 'create');
        this.dreams.create({
          name: 'New dream'
        });
        return expect(this.storage.create).toHaveBeenCalled();
      });
      it('calls update when update model', function() {
        spyOn(this.storage, 'update');
        this.dream.save({
          name: 'New dream'
        });
        return expect(this.storage.update).toHaveBeenCalledWith(this.dream, jasmine.any(Object));
      });
      it('calls destroy when delete model', function() {
        spyOn(this.storage, 'destroy');
        this.dream.destroy();
        return expect(this.storage.destroy).toHaveBeenCalledWith(this.dream, jasmine.any(Object));
      });
      it('calls options.success when method response something', function() {
        var callback;
        callback = jasmine.createSpy('-Success Callback-');
        this.dream.save({
          name: 'New dream'
        }, {
          success: function(resp) {
            return callback(resp);
          }
        });
        return expect(callback).toHaveBeenCalledWith(this.dream);
      });
      return it('calls options.error when response is blank', function() {
        var errorCallback;
        errorCallback = jasmine.createSpy('-Error Callback-');
        spyOn(this.storage, 'update').andReturn(null);
        this.dream.save({
          name: ''
        }, {
          error: function(message) {
            return errorCallback(message);
          }
        });
        return expect(errorCallback).toHaveBeenCalled();
      });
    });
    return describe('sync', function() {
      it('delegates actions to Offline.localSync when storage attribute exists', function() {
        localStorage.setItem('dreams', '');
        this.dreams = new Dreams();
        spyOn(Offline, 'localSync');
        this.dreams.fetch();
        return expect(Offline.localSync).toHaveBeenCalled();
      });
      return it('delegates actions to Backbone.ajaxSync for default behavior when storage attribute empty', function() {
        this.dreams = new Dreams();
        this.dreams.storage = null;
        spyOn(Backbone, 'ajaxSync');
        this.dreams.fetch();
        return expect(Backbone.ajaxSync).toHaveBeenCalled();
      });
    });
  });

}).call(this);
