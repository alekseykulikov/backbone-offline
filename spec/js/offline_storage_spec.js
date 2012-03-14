(function() {

  describe('Offline.Storage', function() {
    beforeEach(function() {
      localStorage.setItem('dreams', '');
      this.dreams = new Dreams();
      return this.storage = this.dreams.storage;
    });
    afterEach(function() {
      return localStorage.clear();
    });
    describe('constructor', function() {
      beforeEach(function() {
        localStorage.setItem('items', '2,3');
        localStorage.setItem('items-destroy', '1,4');
        return this.itemsStore = new Offline.Storage('items', [], {
          autoSync: false,
          keys: {
            parent_id: this.dreams
          }
        });
      });
      it('initializes variable @allRecords', function() {
        return expect(this.itemsStore.allRecords.values).toEqual(['2', '3']);
      });
      it('initializes variable @destroyRecords', function() {
        return expect(this.itemsStore.destroyRecords.values).toEqual(['1', '4']);
      });
      it('initializes variable @keys by options', function() {
        return expect(this.itemsStore.keys).toEqual({
          parent_id: this.dreams
        });
      });
      return it('sets default options', function() {
        var storage;
        registerFakeAjax({
          url: '/api/dreams',
          successData: {}
        });
        storage = new Offline.Storage('dreams', this.dreams);
        return expect(storage.keys).toEqual({});
      });
    });
    describe('update', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create();
      });
      it('sets updated_at and dirty', function() {
        var updatedModel;
        updatedModel = this.storage.update(this.dream);
        expect(updatedModel.get('dirty')).toBeTruthy();
        return expect(updatedModel.get('updated_at')).toBeDefined();
      });
      it('does not set updated_at and dirty if local true', function() {
        var updatedModel;
        updatedModel = this.storage.update(this.dream, {
          local: true
        });
        expect(updatedModel.dirty).toBeUndefined();
        return expect(updatedModel.updated_at).toBeUndefined();
      });
      return it('calls saveItem with model', function() {
        spyOn(this.storage, 'saveItem');
        this.storage.update(this.dream);
        return expect(this.storage.saveItem).toHaveBeenCalledWith(this.dream);
      });
    });
    describe('destroy', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create();
      });
      it('calls removeItem', function() {
        spyOn(this.storage, 'removeItem');
        this.storage.destroy(this.dream);
        return expect(this.storage.removeItem).toHaveBeenCalledWith(this.dream);
      });
      return it('changes @destroyRecords', function() {
        this.dream.set('sid', '1');
        this.storage.destroy(this.dream);
        return expect(this.storage.destroyRecords.values).toEqual(['1']);
      });
    });
    describe('find', function() {
      return it('returns specified item', function() {
        var dream;
        dream = this.dreams.create();
        return expect(this.storage.find(dream).id).toEqual(dream.id);
      });
    });
    describe('findAll', function() {
      return it('returns all items in collection', function() {
        this.dreams.create();
        this.storage.findAll(this.dreams);
        return expect(this.storage.findAll().length).toEqual(1);
      });
    });
    describe('fullSync', function() {
      beforeEach(function() {
        this.options = {
          success: function(resp) {}
        };
        this.response = [
          {
            name: 'Dream 1'
          }, {
            name: 'Dream 2'
          }, {
            name: 'Dream 3'
          }
        ];
        return registerFakeAjax({
          url: '/api/dreams',
          successData: this.response
        });
      });
      it('clears the collection', function() {
        spyOn(this.storage, 'clear');
        this.storage.fullSync(this.options);
        return expect(this.storage.clear).toHaveBeenCalled();
      });
      it('resets collection', function() {
        spyOn(this.dreams, 'reset');
        this.storage.fullSync(this.options);
        return expect(this.dreams.reset).toHaveBeenCalledWith([]);
      });
      it('sets collection-name item', function() {
        spyOn(localStorage, 'setItem');
        this.storage.fullSync(this.options);
        return expect(localStorage.setItem).toHaveBeenCalledWith('dreams', '');
      });
      it('requests data from server', function() {
        spyOn($, 'ajax');
        this.storage.fullSync(this.options);
        return expect($.ajax).toHaveBeenCalledWith({
          type: 'GET',
          dataType: 'json',
          url: '/api/dreams',
          success: jasmine.any(Function)
        });
      });
      it('stores received data to localStorage', function() {
        this.storage.fullSync(this.options);
        return expect(localStorage.length).toEqual(4);
      });
      it('does not mark loaded data as dirty', function() {
        var dirties;
        this.storage.fullSync(this.options);
        dirties = this.dreams.filter(function(dream) {
          return dream.get('dirty');
        });
        return expect(dirties.length).toEqual(0);
      });
      return it('calls options.success with received data', function() {
        var callback;
        callback = jasmine.createSpy('-Success Callback-');
        this.options = {
          success: function(resp) {
            return callback(resp);
          }
        };
        this.storage.fullSync(this.options);
        return expect(callback).toHaveBeenCalledWith(this.response);
      });
    });
    describe('incrementalSync', function() {
      it('calls pull method', function() {
        spyOn(this.storage, 'pull');
        this.storage.incrementalSync();
        return expect(this.storage.pull).toHaveBeenCalledWith({
          success: jasmine.any(Function)
        });
      });
      return it('calls push method', function() {
        registerFakeAjax({
          url: '/api/dreams',
          successData: {}
        });
        spyOn(this.storage, 'push');
        this.storage.incrementalSync();
        return expect(this.storage.push).toHaveBeenCalledWith();
      });
    });
    describe('pull', function() {
      beforeEach(function() {
        var response;
        this.dreams.create({
          name: 'item 1',
          sid: '1'
        });
        this.dreams.create({
          name: 'item 2',
          sid: '2'
        });
        response = [
          {
            name: 'updated item 2',
            id: '2'
          }, {
            name: 'item 3',
            id: '3'
          }
        ];
        return registerFakeAjax({
          url: '/api/dreams',
          successData: response
        });
      });
      it('requests data from server', function() {
        spyOn($, 'ajax');
        this.storage.pull();
        return expect($.ajax).toHaveBeenCalledWith({
          type: 'GET',
          dataType: 'json',
          url: '/api/dreams',
          success: jasmine.any(Function)
        });
      });
      it('calls removeBySid for old items', function() {
        spyOn(this.storage, 'removeBySid');
        this.storage.pull();
        return expect(this.storage.removeBySid.callCount).toBe(1);
      });
      return it('calls pullItem for changed items', function() {
        spyOn(this.storage, 'pullItem');
        this.storage.pull();
        return expect(this.storage.pullItem.callCount).toBe(2);
      });
    });
    describe('push', function() {
      it('calls pushItem for dirty items', function() {
        this.dreams.create();
        this.dreams.create({
          id: '2',
          name: 'Diving with scuba'
        });
        spyOn(this.storage, 'pushItem');
        this.storage.push();
        return expect(this.storage.pushItem.callCount).toBe(2);
      });
      return it('calls destroyBySid for destroyed items', function() {
        var destroyedDream;
        destroyedDream = this.dreams.create({
          id: '3',
          name: 'Learning to play on sax',
          sid: '3'
        }, {
          local: true
        });
        destroyedDream.destroy();
        spyOn(this.storage, 'destroyBySid');
        this.storage.push();
        return expect(this.storage.destroyBySid.callCount).toBe(1);
      });
    });
    describe('saveItem', function() {
      beforeEach(function() {
        return this.dream = {
          id: 'abcd',
          name: 'New dream'
        };
      });
      it('saves item to localStorage', function() {
        this.storage.saveItem(this.dream);
        return expect(localStorage.getItem('dreams-abcd')).toEqual(JSON.stringify(this.dream));
      });
      it('adds to @allRecords when item has new id', function() {
        this.storage.saveItem(this.dream);
        return expect(_.include(this.storage.allRecords.values, 'abcd')).toBeTruthy();
      });
      return it('calls replaceKeyFields', function() {
        spyOn(this.storage, 'replaceKeyFields');
        this.storage.saveItem(this.dream);
        return expect(this.storage.replaceKeyFields).toHaveBeenCalledWith(this.dream, 'local');
      });
    });
    describe('removeItem', function() {
      beforeEach(function() {
        this.dream = this.dreams.create({
          id: 'dcba'
        });
        return this.storage.removeItem(this.dream);
      });
      it('removes item from localStorage', function() {
        return expect(localStorage.getItem('dreams-dcba')).toBeNull();
      });
      return it('removes item id from @allRecords', function() {
        return expect(_.include(this.storage.values, 'dcba')).toBeFalsy();
      });
    });
    describe('replaceKeyFields', function() {
      beforeEach(function() {
        localStorage.setItem('child-dreams', '');
        this.childDreams = new Dreams();
        this.storage2 = new Offline.Storage('child-dreams', this.childDreams, {
          autoSync: false,
          keys: {
            parent_id: this.dreams
          }
        });
        this.childDreams.storage = this.storage2;
        return this.dream = this.dreams.create({
          name: 'Visit Norway',
          sid: '1'
        });
      });
      it('replaces server ids to local when method is local', function() {
        var item;
        item = this.storage2.replaceKeyFields({
          name: 'Live in Norvay',
          parent_id: '1'
        }, 'local');
        return expect(item.parent_id).toEqual(this.dream.id);
      });
      it('replaces local id to server id', function() {
        var item;
        item = this.storage2.replaceKeyFields({
          name: 'Live in Norvay',
          parent_id: this.dream.id
        }, 'server');
        return expect(item.parent_id).toEqual(this.dream.get('sid'));
      });
      return describe('storage behavior when @keys exists', function() {
        it('replace server id to local on create', function() {
          var childDream;
          childDream = this.childDreams.create({
            name: 'Live in Norvay',
            parent_id: '1'
          });
          return expect(childDream.get('parent_id')).toEqual(this.dream.id);
        });
        it('replace server id to local on update', function() {
          var childDream, dream2;
          dream2 = this.dreams.create({
            name: 'Visit Iceland',
            sid: '2'
          });
          childDream = this.childDreams.create({
            name: 'Live in Norvay',
            parent_id: '1'
          });
          childDream.save({
            name: 'Live in Iceland',
            parent_id: '2'
          });
          return expect(childDream.get('parent_id')).toEqual(dream2.id);
        });
        it('replace server id to local on pull', function() {
          this.storage2.pullItem({
            name: 'Live in Norvay',
            parent_id: '1',
            id: '100'
          });
          return expect(this.storage2.colWrapper.get('100').get('parent_id')).toEqual(this.dream.id);
        });
        return it('replace local id to server on push', function() {
          var childDream;
          childDream = this.childDreams.create({
            name: 'Live in Norvay',
            parent_id: '1'
          });
          spyOn(Backbone, 'ajaxSync');
          this.storage2.pushItem(childDream);
          return expect(Backbone.ajaxSync.mostRecentCall.args[1].get('parent_id')).toEqual('1');
        });
      });
    });
    describe('pushItem', function() {
      describe('when item is new', function() {
        beforeEach(function() {
          return this.dream = this.dreams.create();
        });
        it('calls Backbone.ajaxSync', function() {
          spyOn(Backbone, 'ajaxSync');
          this.storage.pushItem(this.dream);
          expect(Backbone.ajaxSync).toHaveBeenCalledWith('create', jasmine.any(Object), {
            success: jasmine.any(Function)
          });
          return expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toBeNull();
        });
        it('sets dirty to false and sets sin', function() {
          var localId;
          registerFakeAjax({
            url: '/api/dreams',
            type: 'post',
            successData: {
              id: '12'
            }
          });
          localId = this.dream.id;
          this.storage.pushItem(this.dream);
          expect(this.dream.get('dirty')).toBeFalsy();
          expect(this.dream.get('sid')).toEqual('12');
          return expect(this.dream.id).toEqual(localId);
        });
        return it('calls replaceKeyFields', function() {
          spyOn(this.storage, 'replaceKeyFields');
          spyOn(Backbone, 'ajaxSync');
          this.storage.pushItem(this.dream);
          return expect(this.storage.replaceKeyFields).toHaveBeenCalledWith(this.dream, 'server');
        });
      });
      return describe('when item exists', function() {
        beforeEach(function() {
          return this.dream = this.dreams.create({
            id: 'anything',
            sid: '101'
          });
        });
        it('calls Backbone.ajaxSync', function() {
          spyOn(Backbone, 'ajaxSync');
          this.storage.pushItem(this.dream);
          expect(Backbone.ajaxSync).toHaveBeenCalledWith('update', jasmine.any(Object), {
            success: jasmine.any(Function)
          });
          return expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toEqual('101');
        });
        return it('sets dirty to false', function() {
          var localId;
          registerFakeAjax({
            url: "/api/dreams/101",
            type: 'put',
            successData: {}
          });
          localId = this.dream.id;
          this.storage.pushItem(this.dream);
          expect(this.dream.get('dirty')).toBeFalsy();
          return expect(this.dream.id).toEqual(localId);
        });
      });
    });
    describe('destroyBySid', function() {
      beforeEach(function() {
        return this.sid = this.dreams.create({
          sid: '3',
          local: true
        }).get('sid');
      });
      it('calls Backbone.ajaxSync', function() {
        spyOn(Backbone, 'ajaxSync');
        this.storage.destroyBySid(this.sid);
        expect(Backbone.ajaxSync).toHaveBeenCalledWith('delete', jasmine.any(Object), {
          success: jasmine.any(Function)
        });
        return expect(Backbone.ajaxSync.mostRecentCall.args[1].id).toEqual('3');
      });
      return it('clears @destroyRecords', function() {
        registerFakeAjax({
          url: "/api/dreams/" + this.sid,
          type: 'delete',
          successData: {}
        });
        this.storage.destroyBySid(this.sid);
        return expect(this.storage.destroyRecords.values).toEqual([]);
      });
    });
    describe('isEmpty', function() {
      it('returns true when localStorage item is null', function() {
        localStorage.removeItem('dreams');
        return expect(this.storage.isEmpty()).toBeTruthy();
      });
      return it('returns false when localStorage has collection-name item', function() {
        localStorage.setItem('dreams', '1,2,3');
        return expect(this.storage.isEmpty()).toBeFalsy();
      });
    });
    describe('clear', function() {
      beforeEach(function() {
        localStorage.setItem('dreams', '1234');
        localStorage.setItem('dreams-1234', 'id:0002');
        return localStorage.setItem('other', '');
      });
      it('clears all localStorage items which include collection-name', function() {
        this.storage.clear();
        expect(localStorage.getItem('dreams')).toBeNull();
        return expect(localStorage.getItem('dreams-1234')).toBeNull();
      });
      it('does not clear the other collections', function() {
        this.storage.clear();
        return expect(localStorage.getItem('other')).toEqual('');
      });
      return it('resets @allRecords and @destroyRecords', function() {
        spyOn(this.storage.allRecords, 'reset');
        spyOn(this.storage.destroyRecords, 'reset');
        this.storage.clear();
        expect(this.storage.allRecords.reset).toHaveBeenCalled();
        return expect(this.storage.destroyRecords.reset).toHaveBeenCalled();
      });
    });
    describe('removeBySid', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create({
          name: 'simple item',
          sid: '1'
        });
      });
      it('destroy item by sid', function() {
        spyOn(this.dream, 'destroy');
        this.storage.removeBySid('1');
        return expect(this.dream.destroy).toHaveBeenCalledWith({
          local: true
        });
      });
      return it('does not set mark to localStorage', function() {
        this.storage.removeBySid('1');
        return expect(localStorage.getItem('dreams-destroy')).toBeNull();
      });
    });
    describe('pullItem', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create({
          name: 'simple item',
          updated_at: '2012-03-04T14:00:10Z',
          sid: '1'
        });
      });
      it('updates local item by sid', function() {
        spyOn(this.storage, 'updateItem');
        this.storage.pullItem({
          id: '1',
          name: 'updated'
        });
        return expect(this.storage.updateItem).toHaveBeenCalledWith(this.dream, {
          id: '1',
          name: 'updated'
        });
      });
      return it('creates new item when does not find', function() {
        spyOn(this.storage, 'createItem');
        this.storage.pullItem({
          id: '2',
          name: 'create item'
        });
        return expect(this.storage.createItem).toHaveBeenCalledWith({
          id: '2',
          name: 'create item'
        });
      });
    });
    describe('updateItem', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create({
          updated_at: '2012-03-04T14:00:10Z'
        }, {
          local: true
        });
      });
      it('updates attributes when local updated_at < new updated_at', function() {
        this.storage.updateItem(this.dream, {
          name: 'Updated name',
          updated_at: '2012-03-04T14:31:40Z'
        });
        return expect(this.dream.get('name')).toEqual('Updated name');
      });
      it('does not save id', function() {
        this.storage.updateItem(this.dream, {
          name: 'Updated name',
          id: '1',
          updated_at: '2012-03-04T15:3520Z'
        });
        return expect(this.dream.get('id')).toNotEqual('1');
      });
      it('does nothing when local updated_at > new updated_at', function() {
        var callback;
        callback = jasmine.createSpy('-Change Callback-');
        this.dream.on('change', callback);
        this.storage.updateItem(this.dream, {
          name: 'New name',
          updated_at: '2012-03-04T12:10:10Z'
        });
        return expect(callback.callCount).toBe(0);
      });
      return it('does not mark item as dirty', function() {
        this.storage.updateItem(this.dream, {
          name: 'Updated name',
          id: '1',
          updated_at: '2012-03-04T15:3520Z'
        });
        return expect(this.dream.get('dirty')).toBeFalsy();
      });
    });
    return describe('createItem', function() {
      it('creates new item to collection', function() {
        spyOn(this.dreams, 'create');
        this.storage.createItem({
          name: 'New',
          id: '1'
        });
        return expect(this.dreams.create).toHaveBeenCalledWith({
          name: 'New',
          sid: '1'
        }, {
          local: true
        });
      });
      it('saves item.id to item.sid', function() {
        this.storage.createItem({
          name: 'New',
          id: '1'
        });
        return expect(this.storage.colWrapper.get('1')).toBeDefined();
      });
      it('does not mark new item as dirty', function() {
        this.storage.createItem({
          name: 'New',
          id: '1'
        });
        return expect(this.storage.colWrapper.get('1').get('dirty')).toBeFalsy();
      });
      return it('does not create local deleted item', function() {
        localStorage.setItem('dreams-destroy', '2');
        this.storage.destroyRecords = new Offline.Records('dreams-destroy');
        this.storage.createItem({
          name: 'Old item',
          id: '2'
        });
        return expect(this.storage.colWrapper.get('2')).toBeUndefined();
      });
    });
  });

}).call(this);
