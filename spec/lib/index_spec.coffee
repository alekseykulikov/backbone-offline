describe 'Offline.Index', ->
  beforeEach ->
    localStorage.setItem('dreams', '2,3')
    @dreams = new Dreams()
    @storage = @dreams.storage
    @records = new Offline.Index('dreams', @storage)

  describe 'constructor', ->
    it 'sets @name', -> expect(@records.name).toEqual('dreams')
    it 'sets @values', -> expect(@records.values).toEqual(['2', '3'])

  describe 'add', ->
    beforeEach -> @records.add('5')
    it 'should add value in to the end of array', -> expect(@records.values).toEqual(['2', '3', '5'])
    it "should rewrite localStorage's item", -> expect(localStorage.getItem 'dreams').toEqual('2,3,5')

    it 'does not duplicate values', ->
      @records.add('5')
      expect(@records.values).toEqual(['2', '3', '5'])

  describe 'remove', ->
    beforeEach -> @records.remove('2')
    it 'should remove value from array', -> expect(@records.values).toEqual(['3'])
    it "should rewrite localStorage's item", -> expect(localStorage.getItem 'dreams').toEqual('3')
