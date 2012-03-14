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
    return describe('diff', function() {
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
        return expect(this.collection.diff(this.response)).toEqual(['2', '3']);
      });
      return it('ignoring items with "new" sid', function() {
        this.dreams.create({
          name: 'item 4',
          sid: 'new'
        });
        return expect(this.collection.diff(this.response)).toEqual(['2', '3']);
      });
    });
  });

}).call(this);
