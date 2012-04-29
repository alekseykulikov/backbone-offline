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
      it('sets @allIds', function() {
        return expect(this.itemsStore.allIds.values).toEqual(['2', '3']);
      });
      it('sets @destroyIds', function() {
        return expect(this.itemsStore.destroyIds.values).toEqual(['1', '4']);
      });
      return it('sets @keys by options.keys', function() {
        return expect(this.itemsStore.keys).toEqual({
          parent_id: this.dreams
        });
      });
    });
    describe('create', function() {
      beforeEach(function() {
        return this.dream = new Dream({
          name: 'Diving with scuba'
        });
      });
      it("should return model's attributes", function() {
        return expect(this.storage.create(this.dream).get('name')).toEqual('Diving with scuba');
      });
      it('should generate local id', function() {
        spyOn(this.storage, 'guid').andReturn('1');
        this.storage.create(this.dream);
        return expect(this.storage.guid).toHaveBeenCalled();
      });
      it('should call "save"', function() {
        spyOn(this.storage, 'save');
        this.storage.create(this.dream);
        return expect(this.storage.save).toHaveBeenCalledWith(jasmine.any(Object), {
          regenerateId: true
        });
      });
      it('sets updated_at and dirty attributes', function() {
        var createdModel;
        createdModel = this.storage.create(this.dream);
        expect(createdModel.get('dirty')).toBeTruthy();
        return expect(createdModel.get('updated_at')).toBeDefined();
      });
      it('does not set updated_at and dirty when options = {local: true}', function() {
        var createdModel;
        createdModel = this.storage.create(this.dream, {
          local: true
        });
        expect(createdModel.dirty).toBeUndefined();
        return expect(createdModel.updated_at).toBeUndefined();
      });
      it('should save server id to "sid" attribute', function() {
        return expect(this.storage.create(new Dream({
          id: 1
        })).get('sid')).toEqual(1);
      });
      it('should set "sid" attribute to "new" when model was create locally', function() {
        return expect(this.storage.create(this.dream).get('sid')).toEqual('new');
      });
      return it("should set model's \"sid\" attribute when model has it", function() {
        return expect(this.storage.create(new Dream({
          sid: 'abcd'
        })).get('sid')).toEqual('abcd');
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
      it('does not set updated_at and dirty when options = {local: true}', function() {
        var updatedModel;
        updatedModel = this.storage.update(this.dream, {
          local: true
        });
        expect(updatedModel.dirty).toBeUndefined();
        return expect(updatedModel.updated_at).toBeUndefined();
      });
      return it('should call "save"', function() {
        spyOn(this.storage, 'save');
        this.storage.update(this.dream);
        return expect(this.storage.save).toHaveBeenCalledWith(this.dream, {});
      });
    });
    describe('destroy', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create();
      });
      it('should call "remove"', function() {
        spyOn(this.storage, 'remove');
        this.storage.destroy(this.dream);
        return expect(this.storage.remove).toHaveBeenCalledWith(this.dream);
      });
      return it('should change @destroyIds', function() {
        this.dream.set('sid', '1');
        this.storage.destroy(this.dream);
        return expect(this.storage.destroyIds.values).toEqual(['1']);
      });
    });
    describe('find', function() {
      return it('should return specified item', function() {
        var dream;
        dream = this.dreams.create();
        return expect(this.storage.find(dream).id).toEqual(dream.id);
      });
    });
    describe('findAll', function() {
      beforeEach(function() {
        spyOn(this.storage.sync, 'incremental');
        return spyOn(this.storage.sync, 'full');
      });
      it("should return all collection's items", function() {
        this.dreams.create();
        return expect(this.storage.findAll().length).toEqual(1);
      });
      it('should call "incremental" sync', function() {
        this.storage.findAll();
        return expect(this.storage.sync.incremental).toHaveBeenCalled();
      });
      it('should call "full" sync when storage is empty', function() {
        localStorage.clear();
        this.storage.findAll();
        return expect(this.storage.sync.full).toHaveBeenCalled();
      });
      return it('should not call "full" or "incremental" if added option {local: true}', function() {
        this.dreams.fetch({
          local: true
        });
        expect(this.storage.sync.full.callCount).toBe(0);
        return expect(this.storage.sync.incremental.callCount).toBe(0);
      });
    });
    describe('save', function() {
      beforeEach(function() {
        return this.dream = new Dream({
          id: 'abcd',
          name: 'New dream'
        });
      });
      it('should save item to localStorage', function() {
        this.storage.save(this.dream);
        return expect(localStorage.getItem('dreams-abcd')).toEqual(JSON.stringify(this.dream));
      });
      it('should add item.id to @allIds', function() {
        this.storage.save(this.dream);
        return expect(_.include(this.storage.allIds.values, 'abcd')).toBeTruthy();
      });
      it('should call "replaceKeyFields"', function() {
        spyOn(this.storage, 'replaceKeyFields');
        this.storage.save(this.dream);
        return expect(this.storage.replaceKeyFields).toHaveBeenCalledWith(this.dream, 'local');
      });
      it("should push item if options.autoPush", function() {
        this.storage.autoPush = true;
        spyOn(this.storage.sync, 'pushItem');
        this.storage.create(this.dream);
        return expect(this.storage.sync.pushItem).toHaveBeenCalledWith(this.dream);
      });
      return it("should does not push item if local=true", function() {
        this.storage.autoPush = true;
        spyOn(this.storage.sync, 'pushItem');
        this.storage.create(this.dream, {
          local: true
        });
        return expect(this.storage.sync.pushItem.callCount).toBe(0);
      });
    });
    describe('remove', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create({
          id: 'dcba'
        }, {
          regenerateId: true
        });
      });
      it('should remove item from localStorage', function() {
        this.storage.remove(this.dream);
        return expect(localStorage.getItem('dreams-dcba')).toBeNull();
      });
      it('should remove item.id from @allIds', function() {
        this.storage.remove(this.dream);
        return expect(_.include(this.storage.values, 'dcba')).toBeFalsy();
      });
      return it("should flush item if options.autoPush", function() {
        this.storage.autoPush = true;
        spyOn(this.storage.sync, 'flushItem');
        this.storage.remove(this.dream);
        return expect(this.storage.sync.flushItem).toHaveBeenCalledWith('dcba');
      });
    });
    describe('isEmpty', function() {
      it("should return true when localStorage's key is null", function() {
        localStorage.removeItem('dreams');
        return expect(this.storage.isEmpty()).toBeTruthy();
      });
      return it('should return false when localStorage has necessary key', function() {
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
      it("should clear localStorage's items including collection-key", function() {
        this.storage.clear();
        return expect(localStorage.getItem('dreams-1234')).toBeNull();
      });
      it('sets collection-key to ""', function() {
        this.storage.clear();
        return expect(localStorage.getItem('dreams')).toEqual('');
      });
      it('does not clear other collections', function() {
        this.storage.clear();
        return expect(localStorage.getItem('other')).toEqual('');
      });
      return it('should reset @allIds and @destroyIds', function() {
        spyOn(this.storage.allIds, 'reset');
        spyOn(this.storage.destroyIds, 'reset');
        this.storage.clear();
        expect(this.storage.allIds.reset).toHaveBeenCalled();
        return expect(this.storage.destroyIds.reset).toHaveBeenCalled();
      });
    });
    return describe('replaceKeyFields', function() {
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
      describe('when method is "local"', function() {
        return it('should replace server ids to local', function() {
          var item;
          item = this.storage2.replaceKeyFields({
            name: 'Live in Norvay',
            parent_id: '1'
          }, 'local');
          return expect(item.parent_id).toEqual(this.dream.id);
        });
      });
      return describe('when method is "server"', function() {
        return it('should replace local ids to server', function() {
          var item;
          item = this.storage2.replaceKeyFields({
            name: 'Live in Norvay',
            parent_id: this.dream.id
          }, 'server');
          return expect(item.parent_id).toEqual(this.dream.get('sid'));
        });
      });
    });
  });

}).call(this);
