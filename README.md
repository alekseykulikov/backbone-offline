## About Backbone.offline

Adds ability to store the data to localStorage and sync data with a server. It is useful when you want to:

* let your app to work offline in combination with [cache manifest](http://www.w3.org/TR/html5/offline.html)
* not to bootstrap initial data every time you save it to the localStorage. You can refresh your collection when you need and load initial data dramatically faster.
* create standalone HTML5 app which periodically syncs data to the server.

This library was extracted from project [Saveidea](http://saveideanow.com) and you can check open source project [Dreamy](https://github.com/Ask11/dreamy) as an example.

## How to use

In order to start using `Backbone.offline` you need to add `js/backbone.offline.js` file to your project and add to initialize a line:

````
@storage = new Offline.Storage('dreams', this)
````

If you prefer amd style, you can use [backbone-offline-requirejs-template](https://github.com/maxfi/backbone-offline-requirejs-template).

Now your collection will save and process data to localStorage. First param is a name of storage, second is a link to collection. This code does not break behavior of other collections. When a collection has no `@storage` attribute, commands will be delegated to `Backbone.sync`. Example of modified collection:

````
class Dreams extends Backbone.Collection
  url: '/api/dreams'

  initialize: ->
      @storage = new Offline.Storage('dreams', this)
  # your code ...
````

In order to work successfully with `Backbone.offline`, your app should follow for 3 simple rules:

* support default REST API on server
* models should have `updated_at` field
* models should have `id` primary key. If you use MongoDB you should change response replaced `_id` to `id`

## How it works

Initially, the primary task for this library was to create web-app which can work standalone, therefore, initial requirements were as follows:

* full and incremental sync support;
* client’s local storage has own primary keys.

`Backbone.offline` replaces the module `Backbone.sync` to `Offline.sync` and does not add any additional logic to the app. At the same time, it does not add anything new to other Backbone modules.

### Offline.Storage

Used for working with localStorage and based on a great library [Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage). `Offline.sync` utilizes methods of class for all CRUD-operations.

It uses field `sid` in order to save server’s id. This field is used when request to server. When creating or changing data, model gets `dirty` attribute which initially equals _true_. The presence of this attribute is a signal for sync with a server, `updated_at` field changes too. This field is used for local comparison of versions with the server. Removed objects are added to special array of `sid` fields and they will be removed from sync with server.

````
@storage = new Offline.Storage('dreams', this, keys: {tag_id: @tags})
````

Optional parameter `keys` is used when your collection has a relation with other collections. In this example local `tag_id` will be changed to necessary primary key from `@tags` when sending data to the server.

Option `autoPush` allows to send request to the server on every save. It simply works like cache for your data.

````
@storage = new Offline.Storage('dreams', this, autoPush: true)
````

### Offline.Sync

This is an algorithm for syncing local storage with a server. For inspiration was used [Evernote EDAM](http://dev.evernote.com/media/pdf/edam-sync.pdf) algorithm, but later it has been changed significantly.
The default behavior: synchronization of data with a server occurs on the collection change by using `fetch()`. If you want to sync data with the server more often, you can use an instance methods:

* `full()` — full collection reload
* `incremental()` — request data from the server with `pull()` and then send changed data to the server with `push()`
* `pull()` - receive data from the server and merge with a current collection
* `push()` - send dirty-data to the server with an atomic operations create, update, destroy. This ensures the reliability of stored data.

If you don't want to request data from server on fetch you can use option `local: true`:  `dreams.fetch({local: true})`

Example:

````
dreams = new Dreams() # initialize collection
dreams.fetch() # GET /api/dreams

dreams.create(name: 'Visit Iceland') # add new dream to localStorage
dream = dreams.at(3)
dreams.save(name: 'Diving with scuba') # local save
dreams.storage.sync.push() # POST /api/dreams and PUT /api/dreams/:id
````

### How to contribute

* Clone repository from github: `git clone git@github.com:Ask11/backbone.offline.git` and switch to new branch `git checkout -b new-feature`
* Install [Bower](http://bower.io) if you haven't already, with `npm install -g bower` (you should also have nodejs installed)
* Run `bower install` to install dependencies
* Run `cake watch` for auto compilation files of CoffeeScript
* Make sure that specs are green `open /spec/spec_runner.html` and start development
* You can suggest a feature or report a bug on [github](https://github.com/Ask11/backbone.offline/issues)

### Examples

* [Saveidea](http://saveideanow.com/demo_app) is a web-app for storing ideas, that appear in your mind during the day. It uses this library to work offline in the browser.
* [Dreamy](http://dreamyapp.herokuapp.com/) is a super simple web-application which allows to write your dreams ([open source](https://github.com/Ask11/dreamy)).

### Special thanks

To Jerome Gravel-Niquet for [backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage) and Jeremy Ashkenas for [coffee-script](https://github.com/jashkenas/coffee-script) and [backbone.js](https://github.com/documentcloud/backbone)

### License

Licensed under MIT license. © 2012 Aleksey Kulikov, All Rights Reserved
[Full license text](https://github.com/Ask11/backbone.offline/blob/master/LICENSE)
