(function() {

  describe('Offline.Collection', function() {
    beforeEach(function() {
      localStorage.setItem('dreams', '');
      this.dreams = new Dreams();
      return this.collection = new Offline.Collection(this.dreams);
    });
    afterEach(function() {
      return localStorage.clear();
    });
    describe('dirty', function() {
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
        return expect(this.collection.dirty().length).toEqual(1);
      });
    });
    describe('get', function() {
      return it('finds item in collection by sid attribute', function() {
        this.dreams.add([
          {
            name: 'first',
            sid: '1'
          }, {
            name: 'second',
            sid: '2'
          }
        ]);
        return expect(this.collection.get('2').get('name')).toEqual('second');
      });
    });
    describe('diff', function() {
      beforeEach(function() {
        this.dreams.create({
          name: 'item 1',
          sid: '1'
        });
        this.dreams.create({
          name: 'item 2',
          sid: '2'
        });
        return this.dreams.create({
          name: 'item 3',
          sid: '3'
        });
      });
      it('returns array of items to remove', function() {
        var response;
        response = [
          {
            name: 'item 1',
            id: '2'
          }
        ];
        return expect(this.collection.diff(response)).toEqual(['1', '3']);
      });
      return it('ignoring items with "new" sid', function() {
        var response;
        response = [
          {
            name: 'item 1',
            id: '1'
          }
        ];
        this.dreams.create({
          name: 'item 4',
          sid: 'new'
        });
        return expect(this.collection.diff(response)).toEqual(['2', '3']);
      });
    });
    describe('destroyDiff', function() {
      return it('destroy items by sid', function() {
        var response;
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
        response = [
          {
            name: 'item 1',
            id: '2'
          }
        ];
        this.collection.destroyDiff(response);
        return expect(this.collection.items.length).toEqual(1);
      });
    });
    return describe('fakeModel', function() {
      beforeEach(function() {
        return this.fakeModel = this.collection.fakeModel('4');
      });
      it('sets id', function() {
        return expect(this.fakeModel.id).toEqual('4');
      });
      return it('sets urlRoot', function() {
        return expect(this.fakeModel.urlRoot).toEqual('/api/dreams');
      });
    });
  });

}).call(this);
