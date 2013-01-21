## Quick Example

```javascript
define('lib/offline', function(require, exports, module) {
  var Trees = require('collections/trees'),
      Cards = require('collections/cards'),
      Users = require('collections/users');

  var offline = new Backbone.Offline(app.currentUser.id, {
    'trees': {
      collection: Trees,
      resources: {
        'cards': {
          collection: Cards,
          syncUrl: 'api/cards'
        }
      }
    },
    'users': Users
  });

  offline.on('sync:start', startSync);
  offline.on('sync:end',   endSync);

  function startSync() { console.log('sync started'); }
  function endSync()   { console.log('sync ended'); }

  module.exports = offline;
});
```