(function() {

  describe('Offline', function() {
    beforeEach(function() {
      localStorage.setItem('dreams', '');
      return this.dreams = new Dreams();
    });
    afterEach(function() {
      return window.localStorage.clear();
    });
    describe('onLine', function() {
      it('should returns true when onLine is undefined', function() {
        window.navigator = {};
        return expect(Offline.onLine()).toBeTruthy();
      });
      it('should returns true when onLine is true', function() {
        window.navigator = {
          onLine: true
        };
        return expect(Offline.onLine()).toBeTruthy();
      });
      return it('should returns false when onLine is false', function() {
        window.navigator = {
          onLine: false
        };
        return expect(Offline.onLine()).toBeFalsy();
      });
    });
    describe('localSync', function() {
      beforeEach(function() {
        this.storage = this.dreams.storage;
        this.dream = this.dreams.create();
        return registerFakeAjax({
          url: '/api/dreams',
          successData: {}
        });
      });
      it('should call "findAll" when reading collection', function() {
        spyOn(this.storage, 'findAll');
        this.dreams.fetch();
        return expect(this.storage.findAll).toHaveBeenCalledWith(jasmine.any(Object));
      });
      it('should call "find" when reading model', function() {
        spyOn(this.storage, 'find');
        this.dream.fetch();
        return expect(this.storage.find).toHaveBeenCalledWith(this.dream, jasmine.any(Object));
      });
      it('should call "create" when creating model', function() {
        spyOn(this.storage, 'create');
        this.dreams.create({
          name: 'New dream'
        });
        return expect(this.storage.create).toHaveBeenCalled();
      });
      it('should call "update" when update model', function() {
        spyOn(this.storage, 'update');
        this.dream.save({
          name: 'New dream'
        });
        return expect(this.storage.update).toHaveBeenCalledWith(this.dream, jasmine.any(Object));
      });
      it('should call "destroy" when delete model', function() {
        spyOn(this.storage, 'destroy');
        this.dream.destroy();
        return expect(this.storage.destroy).toHaveBeenCalledWith(this.dream, jasmine.any(Object));
      });
      it("should calls \"options.success\" when storage's method responses something", function() {
        var successCallback;
        successCallback = jasmine.createSpy('-Success Callback-');
        this.dream.save({
          name: 'New dream'
        }, {
          success: function(resp) {
            return successCallback(resp);
          }
        });
        return expect(successCallback).toHaveBeenCalledWith(this.dream);
      });
      return it('should call "options.error" when response is blank', function() {
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
      it('should delegate actions to Offline.localSync when @storage exists', function() {
        spyOn(Offline, 'localSync');
        this.dreams.fetch();
        return expect(Offline.localSync).toHaveBeenCalled();
      });
      return it('should delegate actions to Backbone.ajaxSync when @storage empty', function() {
        this.dreams.storage = null;
        spyOn(Backbone, 'ajaxSync');
        this.dreams.fetch();
        return expect(Backbone.ajaxSync).toHaveBeenCalled();
      });
    });
  });

}).call(this);
