describe 'Offline.Collection', ->
  beforeEach ->
    localStorage.setItem('dreams', '')
    @dreams = new Dreams()
    @collection = new Offline.Collection(@dreams)

  afterEach ->
    localStorage.clear()

  describe 'dirty', ->
    it 'should return items where "dirty" attribute is equal true', ->
      @dreams.add [{id: 1, dirty: false}, {id: 2, dirty: true}, {id: 3, dirty: false}]
      expect(@collection.dirty().length).toEqual(1)

  describe 'get', ->
    it 'should find item by "sid" attribute in collection', ->
      @dreams.add [{name: 'first', sid: '1'}, {name: 'second', sid: '2'}]
      expect(@collection.get('2').get 'name').toEqual('second')

  describe 'destroyDiff', ->
    beforeEach ->
      @dreams.create(name: 'item 1', sid: '1')
      @dreams.create(name: 'item 2', sid: '2')
      @dreams.create(name: 'item 3', sid: '3')

    it 'should destroy items by "sid" which difference from response', ->
      response = [{name: 'item 1', id: '2'}]
      @collection.destroyDiff(response)

      expect(@collection.items.pluck 'sid').toEqual(['2'])

    it 'should ignore items which have "sid" attribute equal "new"', ->
      response = [{name: 'item 1', id: '1'}]
      @dreams.create(name: 'item 4', sid: 'new')
      @collection.destroyDiff(response)

      expect(@collection.items.pluck 'sid').toEqual(['1', 'new'])

  describe 'fakeModel', ->
    beforeEach ->
      @fakeModel = @collection.fakeModel('4')

    it 'sets id', -> expect(@fakeModel.id).toEqual('4')
    it 'sets urlRoot', -> expect(@fakeModel.urlRoot).toEqual('/api/dreams')
