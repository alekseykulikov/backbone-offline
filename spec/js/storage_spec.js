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
      it('calls save with new model', function() {
        spyOn(this.storage, 'save');
        this.storage.create(this.dream);
        return expect(this.storage.save).toHaveBeenCalledWith(jasmine.any(Object));
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
      return it('calls save with model', function() {
        spyOn(this.storage, 'save');
        this.storage.update(this.dream);
        return expect(this.storage.save).toHaveBeenCalledWith(this.dream);
      });
    });
    describe('destroy', function() {
      beforeEach(function() {
        return this.dream = this.dreams.create();
      });
      it('calls remove', function() {
        spyOn(this.storage, 'remove');
        this.storage.destroy(this.dream);
        return expect(this.storage.remove).toHaveBeenCalledWith(this.dream);
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
      beforeEach(function() {
        spyOn(this.storage.sync, 'incremental');
        return spyOn(this.storage.sync, 'full');
      });
      it('returns all items in collection', function() {
        this.dreams.create();
        return expect(this.storage.findAll().length).toEqual(1);
      });
      it('calls incremental sync', function() {
        this.storage.findAll();
        return expect(this.storage.sync.incremental).toHaveBeenCalled();
      });
      return it('calls full sync when storage is empty', function() {
        localStorage.clear();
        this.storage.findAll();
        return expect(this.storage.sync.full).toHaveBeenCalled();
      });
    });
    describe('save', function() {
      beforeEach(function() {
        return this.dream = {
          id: 'abcd',
          name: 'New dream'
        };
      });
      it('saves item to localStorage', function() {
        this.storage.save(this.dream);
        return expect(localStorage.getItem('dreams-abcd')).toEqual(JSON.stringify(this.dream));
      });
      it('adds to @allRecords when item has new id', function() {
        this.storage.save(this.dream);
        return expect(_.include(this.storage.allRecords.values, 'abcd')).toBeTruthy();
      });
      return it('calls replaceKeyFields', function() {
        spyOn(this.storage, 'replaceKeyFields');
        this.storage.save(this.dream);
        return expect(this.storage.replaceKeyFields).toHaveBeenCalledWith(this.dream, 'local');
      });
    });
    describe('remove', function() {
      beforeEach(function() {
        this.dream = this.dreams.create({
          id: 'dcba'
        });
        return this.storage.remove(this.dream);
      });
      it('removes item from localStorage', function() {
        return expect(localStorage.getItem('dreams-dcba')).toBeNull();
      });
      return it('removes item id from @allRecords', function() {
        return expect(_.include(this.storage.values, 'dcba')).toBeFalsy();
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
        return expect(localStorage.getItem('dreams-1234')).toBeNull();
      });
      it('sets root record to ""', function() {
        this.storage.clear();
        return expect(localStorage.getItem('dreams')).toEqual('');
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
      it('replaces server ids to local when method is local', function() {
        var item;
        item = this.storage2.replaceKeyFields({
          name: 'Live in Norvay',
          parent_id: '1'
        }, 'local');
        return expect(item.parent_id).toEqual(this.dream.id);
      });
      return it('replaces local id to server id', function() {
        var item;
        item = this.storage2.replaceKeyFields({
          name: 'Live in Norvay',
          parent_id: this.dream.id
        }, 'server');
        return expect(item.parent_id).toEqual(this.dream.get('sid'));
      });
    });
  });

}).call(this);
