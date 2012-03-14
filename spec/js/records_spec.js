(function() {

  describe('Offline.Records', function() {
    beforeEach(function() {
      localStorage.setItem('ideas', '2,3');
      return this.records = new Offline.Records('ideas');
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

}).call(this);
