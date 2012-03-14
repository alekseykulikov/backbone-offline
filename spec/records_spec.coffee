describe 'Offline.Records', ->
  beforeEach ->
    localStorage.setItem('ideas', '2,3')
    @records = new Offline.Records('ideas')

  it 'initializes @name', -> expect(@records.name).toEqual('ideas')
  it 'initializes @values', -> expect(@records.values).toEqual(['2', '3'])

  describe 'add', ->
    beforeEach -> @records.add('5')
    it 'pushes value to values', -> expect(@records.values).toEqual(['2', '3', '5'])
    it 'updates localStorage item', -> expect(localStorage.getItem 'ideas').toEqual('2,3,5')

    it 'does not include itemId to values twice', ->
      @records.add('5')
      expect(@records.values).toEqual(['2', '3', '5'])

  describe 'remove', ->
    beforeEach -> @records.remove('2')
    it 'remove value from values', -> expect(@records.values).toEqual(['3'])
    it 'updates localStorage item', -> expect(localStorage.getItem 'ideas').toEqual('3')
