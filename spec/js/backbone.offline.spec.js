(function() {
  var Dream, Dreams,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Dream = (function(_super) {

    __extends(Dream, _super);

    function Dream() {
      Dream.__super__.constructor.apply(this, arguments);
    }

    Dream.prototype.defaults = {
      name: 'Visit Iceland'
    };

    return Dream;

  })(Backbone.Model);

  Dreams = (function(_super) {

    __extends(Dreams, _super);

    function Dreams() {
      Dreams.__super__.constructor.apply(this, arguments);
    }

    Dreams.prototype.model = Dream;

    Dreams.prototype.url = '/api/dreams';

    Dreams.prototype.initialize = function() {
      return this.storage = new Storage('dreams', this, {
        autoSync: false
      });
    };

    return Dreams;

  })(Backbone.Collection);

  describe('window.localStorageRecords', function() {
    beforeEach(function() {
      localStorage.setItem('ideas', '2,3');
      return this.records = new localStorageRecords('ideas');
    });
    it('initializes @name', function() {
      return expect(this.records.name).toEqual('ideas');
    });
    it('initializes @values', function() {
      return expect(this.records.values).toEqual(['2', '3']);
    });
    describe('add', function() {
      beforeEach(function() {
        return this.records.add('5');
      });
      it('pushes value to values', function() {
        return expect(this.records.values).toEqual(['2', '3', '5']);
      });
      it('updates localStorage item', function() {
        return expect(localStorage.getItem('ideas')).toEqual('2,3,5');
      });
      return it('does not include itemId to values twice', function() {
        this.records.add('5');
        return expect(this.records.values).toEqual(['2', '3', '5']);
      });
    });
    return describe('remove', function() {
      beforeEach(function() {
        return this.records.remove('2');
      });
      it('remove value from values', function() {
        return expect(this.records.values).toEqual(['3']);
      });
      return it('updates localStorage item', function() {
        return expect(localStorage.getItem('ideas')).toEqual('3');
      });
    });
  });

  describe('window.Storage', function() {
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
        return this.itemsStore = new Storage('items', [], {
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
      it('initializes variable @autoSync by options', function() {
        return expect(this.itemsStore.autoSync).toBeFalsy();
      });
      return it('sets default options', function() {
        var storage;
        registerFakeAjax({
          url: '/api/dreams',
          successData: {}
        });
        storage = new Storage('dreams', this.dreams);
        expect(storage.keys).toEqual({});
        return expect(storage.autoSync).toBeTruthy();
      });
    });
    describe('idAttribute manipulations', function() {
      beforeEach(function() {
        return this.storage.idAttribute = "_id";
      });
      it('saves correct sid on create', function() {
        var item;
        item = this.storage.create({
          name: 'New name',
          _id: '1'
        });
        return expect(item.sid).toEqual('1');
      });
      it('creates new record on pull', function() {
        this.storage.pullItem({
          _id: '5',
          name: 'New dream'
        });
        return expect(this.storage.findBySid('5').get('name')).toEqual('New dream');
      });
      it('finds correct record for update on pull', function() {
        var item;
        item = this.dreams.create({
          name: 'New name',
          _id: '1',
          updated_at: '2012-03-04T14:00:10Z'
        }, {
          local: true
        });
        this.storage.pullItem({
          _id: '1',
          name: 'Updated name',
          updated_at: '2012-03-04T15:00:10Z'
        });
        return expect(item.get('name')).toEqual('Updated name');
      });
      return it('replace "new" sid on push', function() {
        var item;
        item = this.dreams.create({
          name: 'New name'
        });
        registerFakeAjax({
          url: '/api/dreams',
          type: 'post',
          successData: {
            _id: '11'
          }
        });
        this.storage.pushItem(item);
        return expect(item.get('sid')).toEqual('11');
      });
    });
    describe('create', function() {
      beforeEach(function() {
        return this.dream = new Dream({
          name: 'Diving with scuba'
        });
      });
      it('returns model attributes', function() {
        return expect(this.storage.create(this.dream).name).toEqual('Diving with scuba');
      });
      it('generates local id for new model', function() {
        spyOn(this.storage, 'guid').andReturn('1');
        this.storage.create(this.dream);
        return expect(this.storage.guid).toHaveBeenCalled();
      });
      it('calls saveItem with new model', function() {
        spyOn(this.storage, 'saveItem');
        this.storage.create(this.dream);
        return expect(this.storage.saveItem).toHaveBeenCalledWith(jasmine.any(Object));
      });
      it('sets updated_at and dirty', function() {
        var createdModel;
        createdModel = this.storage.create(this.dream);
        expect(createdModel.dirty).toBeTruthy();
        return expect(createdModel.updated_at).toBeDefined();
      });
      it('does not set updated_at and dirty if local true', function() {
        var createdModel;
        createdModel = this.storage.create(this.dream, {
          local: true
        });
        expect(createdModel.dirty).toBeUndefined();
        return expect(createdModel.updated_at).toBeUndefined();
      });
      return describe('saves sid - server id', function() {
        it('model id', function() {
          return expect(this.storage.create({
            id: 1
          }).sid).toEqual(1);
        });
        it('"new" when model was create localy', function() {
          return expect(this.storage.create(this.dream).sid).toEqual('new');
        });
        return it('model sid attribute if model has it', function() {
          return expect(this.storage.create({
            sid: 'abcd'
          }).sid).toEqual('abcd');
        });
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
        this.storage2 = new Storage('child-dreams', this.childDreams, {
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
          return expect(this.storage2.findBySid('100').get('parent_id')).toEqual(this.dream.id);
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
    describe('getDirties', function() {
      return it('return items with dirty mark', function() {
        this.dreams.add([
          {
            id: 1,
            dirty: false
          }, {
            id: 2,
            dirty: true
          }, {
            id: 3,
            dirty: false
          }
        ]);
        return expect(this.storage.getDirties().length).toEqual(1);
      });
    });
    describe('prepareStorage', function() {
      it('runs fullSync when storage is Empty', function() {
        localStorage.removeItem('dreams');
        spyOn(this.storage, 'fullSync');
        this.storage.prepareStorage();
        return expect(this.storage.fullSync).toHaveBeenCalledWith();
      });
      return it('runs incrementalSync when storage exists and @autoSync=true', function() {
        this.storage.autoSync = true;
        spyOn(this.storage, 'incrementalSync');
        this.storage.prepareStorage();
        return expect(this.storage.incrementalSync).toHaveBeenCalledWith();
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
    describe('getRemovedIds', function() {
      beforeEach(function() {
        this.dreams.create({
          name: 'item 1',
          sid: '1'
        });
        this.dreams.create({
          name: 'item 2',
          sid: '2'
        });
        this.dreams.create({
          name: 'item 3',
          sid: '3'
        });
        return this.response = [
          {
            name: 'item 1',
            id: '1'
          }
        ];
      });
      it('returns array of items to remove', function() {
        return expect(this.storage.getRemovedIds(this.response)).toEqual(['2', '3']);
      });
      return it('ignoring items with "new" sid', function() {
        this.dreams.create({
          name: 'item 4',
          sid: 'new'
        });
        return expect(this.storage.getRemovedIds(this.response)).toEqual(['2', '3']);
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
    describe('findBySid', function() {
      it('finds item in collection by sid attribute', function() {
        this.dreams.add([
          {
            name: 'first',
            sid: '1'
          }, {
            name: 'second',
            sid: '2'
          }
        ]);
        return expect(this.storage.findBySid('2').get('name')).toEqual('second');
      });
      return it('finds in different collection in second parameter', function() {
        var childDreams, storage2;
        localStorage.setItem('child-dreams', '');
        childDreams = new Dreams();
        storage2 = new Storage('child-dreams', childDreams, {
          autoSync: false
        });
        childDreams.add([
          {
            name: 'first',
            sid: 'a'
          }, {
            name: 'second',
            sid: 'b'
          }
        ]);
        return expect(this.storage.findBySid('b', childDreams).get('name')).toEqual('second');
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
        return expect(this.storage.findBySid('1')).toBeDefined();
      });
      it('does not mark new item as dirty', function() {
        this.storage.createItem({
          name: 'New',
          id: '1'
        });
        return expect(this.storage.findBySid('1').get('dirty')).toBeFalsy();
      });
      return it('does not create local deleted item', function() {
        localStorage.setItem('dreams-destroy', '2');
        this.storage.destroyRecords = new localStorageRecords('dreams-destroy');
        this.storage.createItem({
          name: 'Old item',
          id: '2'
        });
        return expect(this.storage.findBySid('2')).toBeUndefined();
      });
    });
  });

  describe('Backbone.localSync', function() {
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

  describe('Backbone.offline', function() {
    it('delegates actions to Backbone.localSync when storage attribute exists', function() {
      localStorage.setItem('dreams', '');
      this.dreams = new Dreams();
      spyOn(Backbone, 'localSync');
      this.dreams.fetch();
      return expect(Backbone.localSync).toHaveBeenCalled();
    });
    return it('delegates actions to Backbone.ajaxSync for default behavior when storage attribute empty', function() {
      this.dreams = new Dreams();
      this.dreams.storage = null;
      spyOn(Backbone, 'ajaxSync');
      this.dreams.fetch();
      return expect(Backbone.ajaxSync).toHaveBeenCalled();
    });
  });

}).call(this);
