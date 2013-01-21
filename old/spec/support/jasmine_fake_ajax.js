(function($, jasmine) {
  // Public interface.
  jasmine.FakeAjax = {
    realAjax: $.ajax,
    clearContext: clearContext,
    initContext: initContext,
    loadTestData: loadTestData,
    latestAjax: latestAjax,
    latestAjaxWithUrlMatching: latestAjaxWithUrlMatching,
    log: new Logger()
  }

  $.ajax = function(realOptions) {
    jasmine.FakeAjax.recordedSession.addRealOptions(realOptions)
    var allBypassableOptions = jasmine.FakeAjax.recordedSession.allBypassableOptions
    var allFakeOptions = jasmine.FakeAjax.recordedSession.allFakeOptions
    if (!_.isEmpty(findMatchingOptions(realOptions, allBypassableOptions))) {
      return jasmine.FakeAjax.realAjax(realOptions)
    } else if (!_.isEmpty(allFakeOptions)) {
      var fakeOptions = findMatchingOptions(realOptions, allFakeOptions)
      if (_.isEmpty(fakeOptions)) {
        jasmine.FakeAjax.log.warn(messageWithContextInfo("No matching fake ajax options was found", realOptions))
      } else {
        callAvailableCallbackHandlers(realOptions, fakeOptions)
      }
    } else {
      jasmine.FakeAjax.log.warn(messageWithContextInfo("There are no fake ajax options defined", realOptions))
    }
  }

  function RecordedSession() {
    // All registered fake ajax options.
    this.allFakeOptions = []
    // All registered ajax options that should be bypassed and delegated to real ajax.
    this.allBypassableOptions = []
    // All real ajax calls triggered by sut.
    this.allRealOptions = []

    this.registerFakeAjax = function(options) {
      this.allFakeOptions.push(options)
    }

    this.addBypassableOptions = function(options) {
      this.allBypassableOptions.push(options)
    }

    this.addRealOptions = function(options) {
      this.allRealOptions.push(options)
    }
  }

  function Logger() {
    this.error = function(message) {
      withFirebugConsole(function(c) {
        c.error(message)
      })
    }

    this.warn = function(message) {
      withFirebugConsole(function(c) {
        c.warn(message)
      })
    }

    function withFirebugConsole(callback) {
      if (window.console) {
        callback(window.console)
      }
    }
  }

  function clearContext() {
    jasmine.FakeAjax.recordedSession = new RecordedSession()
  }

  function initContext(options) {
    _.each(options.registrations, function(options) {
      jasmine.FakeAjax.recordedSession.registerFakeAjax(options)
    })
  }

  function loadTestData(selector, url) {
    var fixture
    jasmine.FakeAjax.realAjax({
      url: url,
      type: 'get',
      dataType: 'html',
      async: false,
      success: function(data) {
        fixture = data
      },
      error: function() {
        logAndThrow("Failed loading test data by url '" + url + "'.")
      }
    })
    var testDataContainer = $(fixture).find(selector)
    if (testDataContainer.length > 0) {
      return testDataContainer.html()
    } else {
      logAndThrow("Failed loading test data by selector '" + selector + "' from url '" + url + "'.")
    }
  }

  function latestAjax() {
    var allRealOptions = jasmine.FakeAjax.recordedSession.allRealOptions
    if (_.isEmpty(allRealOptions)) {
      logAndThrow("Ajax hasn't yet been called in spec '" + jasmine.getEnv().currentSpec.description + "'.")
    } else {
      return lastWithUrlDecoded(allRealOptions)
    }
  }

  function latestAjaxWithUrlMatching(partialUrl) {
    var matchingAjaxCalls = _.filter(jasmine.FakeAjax.recordedSession.allRealOptions, function(ajaxOptions) {
      return ajaxOptions.url.match(partialUrl)
    })
    if (_.isEmpty(matchingAjaxCalls)) {
      logAndThrow("Matching url was not found by partial url '" + partialUrl + "' in spec '" +
      jasmine.getEnv().currentSpec.description + "'.")
    } else {
      return lastWithUrlDecoded(matchingAjaxCalls)
    }
  }

  function lastWithUrlDecoded(ajaxOptions) {
    var last = _.last(ajaxOptions)
    last.url = $.URLDecode(last.url)
    return last
  }

  function logAndThrow(errorMessage) {
    jasmine.FakeAjax.log.error(errorMessage)
    throw errorMessage
  }

  function findMatchingOptions(realOptions, allOtherOptions) {
    var comparableFields = ['url', 'type', 'data', 'dataType', 'async']
    var allMatchingOptions = _.select(allOtherOptions, function(otherOptions) {
      var real = _.clone(realOptions)
      var other = _.clone(otherOptions)
      _.each([real, other], function(o) {
        o.type = (o.type || 'get').toLowerCase()
      })
      return _.all(comparableFields, function(field) {
        return _.isUndefined(other[field]) ? true : _.isEqual(other[field], real[field])
      })
    })
    if (allMatchingOptions.length > 1) {
      logAndThrow("Multiple matching ajax options found, not able to decide which callbacks to use " +
        "because the result was ambiguous. Real ajax options: " + JSON.stringify(realOptions) + ". " +
        "All matching (and thus conflicting) options: " +
        _.map(allMatchingOptions, function(options){ return JSON.stringify(options) }))
    }
    return _.first(allMatchingOptions)
  }

  function callAvailableCallbackHandlers(real, fake) {
    function checkPreCondition() {
      var possibleCallbackRules = ['success', 'successData', 'error', 'errorMessage']
      var registeredCallbackRules = _.reduce(possibleCallbackRules, function(all, current) {
        if (fake[current]) {
          all.push(current)
        }
        return all
      }, [])
      if (registeredCallbackRules.length === 0) {
        logAndThrow("Exactly one callback rule of [" + possibleCallbackRules.join(', ') + "] " +
          "must be defined for url '" + real.url + "'. There was none.")
      } else if (registeredCallbackRules.length > 1) {
        logAndThrow("Exactly one callback rule of [" + possibleCallbackRules.join(', ') + "] " +
          "must be defined for url '" + real.url + "'. There was " + registeredCallbackRules.length +
          ": [" + registeredCallbackRules.join(', ') + "].")
      } else if ((fake.success || fake.successData) && !real.success) {
        logAndThrow("Ajax success handler is not defined in system under test for url '" + real.url + "'.")
      } else if ((fake.error || fake.errorMessage) && !real.error) {
        logAndThrow("Ajax error handler is not defined in system under test for url '" + real.url + "'.")
      } else {
        return true
      }
    }

    function callAvailableHandlers() {
      function handleFunctionOrArrayCallbacks(property, callback) {
        if (_.isFunction(real[property])) {
          if (!_.isObject(fake[property]) || _.isArray(fake[property])) {
            logAndThrow("Fake " + property + " must be an (" + property + " arguments) object when real " +
              property + " is a function for url '" + real.url + "'.")
          }
          callback(real[property], fake[property])
        } else if (_.isArray(real[property])) {
          if (!_.isArray(fake[property])) {
            logAndThrow("Real " + property + " is an array but fake " + property + " is not for url '" + real.url + "'.")
          }
          if (!_.isEqual(fake[property].length, real[property].length)) {
            logAndThrow("Fake " + property + " has " + fake[property].length + " items but real " +
              property + " has " + real[property].length + " items for url '" + real.url + "'.")
          }
          _.each(_.zip(real[property], fake[property]), function(realAndFake) {
            callback(realAndFake[0], realAndFake[1])
          })
        } else {
          logAndThrow("Real " + property + " must be a function or an array of functions for url '" + real.url + "'.")
        }
      }

      if (real.beforeSend) {
        real.beforeSend()
      }

      if (fake.success) {
        handleFunctionOrArrayCallbacks('success', function(realSuccessCallback, fakeSuccess) {
          realSuccessCallback.call(real.context, fakeSuccess.data, fakeSuccess.status, fakeSuccess.xhr)
        })
      } else if (fake.successData) {
        real.success.call(real.context, fake.successData)
      } else if (fake.error) {
        handleFunctionOrArrayCallbacks('error', function(realErrorCallback, fakeError) {
          realErrorCallback.call(real.context, fakeError.xhr, fakeError.status, fakeError.error)
        })
      } else if (fake.errorMessage) {
        real.error.call(real.context, {responseText: fake.errorMessage})
      }

      if (real.complete) {
        real.complete.call(real.context)
      }
    }

    checkPreCondition()
    callAvailableHandlers()
  }

  function messageWithContextInfo(message, realOptions) {
    return message + ", spec: '" + jasmine.getEnv().currentSpec.description + "', real ajax url: '" + realOptions.url + "'."
  }
})(jQuery, jasmine)

// Some global convenience functions.
function realAjax(options) { jasmine.FakeAjax.realAjax(options) }
function fakeAjax(options) { jasmine.FakeAjax.initContext(options) }
function registerFakeAjax(options) { jasmine.FakeAjax.recordedSession.registerFakeAjax(options) }
function useRealAjaxFor(options) { jasmine.FakeAjax.recordedSession.addBypassableOptions(options) }
function loadTestData(selector, url) { return jasmine.FakeAjax.loadTestData(selector, url) }
function latestAjax() { return jasmine.FakeAjax.latestAjax() }
function latestAjaxWithUrlMatching(partialUrl) { return jasmine.FakeAjax.latestAjaxWithUrlMatching(partialUrl) }

beforeEach(jasmine.FakeAjax.clearContext)
