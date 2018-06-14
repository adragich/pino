'use strict'
var test = require('tape')
var fresh = require('fresh-require')
var pino = require('../browser')

levelTest('fatal')
levelTest('error')
levelTest('warn')
levelTest('info')
levelTest('debug')
levelTest('trace')

test('silent level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    level: 'silent',
    browser: {write: function (o) {
      fail()
    }}
  })
  instance.info('test')
  var child = instance.child({test: 'test'})
  child.info('msg-test')
  // use setTimeout because setImmediate isn't supported in most browsers
  setTimeout(function () {
    pass()
    end()
  }, 0)
})

test('enabled false', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    enabled: false,
    browser: {write: function (o) {
      fail()
    }}
  })
  instance.info('test')
  var child = instance.child({test: 'test'})
  child.info('msg-test')
  // use setTimeout because setImmediate isn't supported in most browsers
  setTimeout(function () {
    pass()
    end()
  }, 0)
})

test('throw if creating child without bindings', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  const instance = pino()
  throws(() => instance.child())
  end()
})

test('stubs write, flush and ee methods on instance', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino()

  ok(isFunc(instance.setMaxListeners))
  ok(isFunc(instance.getMaxListeners))
  ok(isFunc(instance.emit))
  ok(isFunc(instance.addListener))
  ok(isFunc(instance.on))
  ok(isFunc(instance.prependListener))
  ok(isFunc(instance.once))
  ok(isFunc(instance.prependOnceListener))
  ok(isFunc(instance.removeListener))
  ok(isFunc(instance.removeAllListeners))
  ok(isFunc(instance.listeners))
  ok(isFunc(instance.listenerCount))
  ok(isFunc(instance.eventNames))
  ok(isFunc(instance.write))
  ok(isFunc(instance.flush))

  is(instance.on(), undefined)

  end()
})

test('exposes levels object', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  same(pino.levels, {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    },
    labels: {
      '10': 'trace',
      '20': 'debug',
      '30': 'info',
      '40': 'warn',
      '50': 'error',
      '60': 'fatal'
    }
  })

  end()
})

test('exposes LOG_VERSION', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  is(pino.LOG_VERSION, 1)

  end()
})

test('exposes faux stdSerializers', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  ok(pino.stdSerializers)
  ok(pino.stdSerializers.req)
  ok(pino.stdSerializers.res)
  ok(pino.stdSerializers.err)
  same(pino.stdSerializers.req(), {})
  same(pino.stdSerializers.res(), {})

  end()
})

test('exposes err stdSerializer', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  ok(pino.stdSerializers)
  ok(pino.stdSerializers.req)
  ok(pino.stdSerializers.res)
  ok(pino.stdSerializers.err)
  ok(pino.stdSerializers.err(Error()))

  end()
})

consoleMethodTest('error')
consoleMethodTest('fatal', 'error')
consoleMethodTest('warn')
consoleMethodTest('info')
consoleMethodTest('debug')
consoleMethodTest('trace')
absentConsoleMethodTest('error', 'log')
absentConsoleMethodTest('warn', 'error')
absentConsoleMethodTest('info', 'log')
absentConsoleMethodTest('debug', 'log')
absentConsoleMethodTest('trace', 'log')

// do not run this with airtap
if (process.title !== 'browser') {
  test('in absence of console, log methods become noops', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var console = global.console
    delete global.console
    var instance = fresh('../browser', require)()
    global.console = console
    ok(fnName(instance.log).match(/noop/))
    ok(fnName(instance.fatal).match(/noop/))
    ok(fnName(instance.error).match(/noop/))
    ok(fnName(instance.warn).match(/noop/))
    ok(fnName(instance.info).match(/noop/))
    ok(fnName(instance.debug).match(/noop/))
    ok(fnName(instance.trace).match(/noop/))
    end()
  })
}

test('opts.browser.asObject logs pino-like object to console', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var info = console.info
  console.info = function (o) {
    is(o.level, 30)
    is(o.msg, 'test')
    ok(o.time)
    console.info = info
  }
  var instance = require('../browser')({
    browser: {
      asObject: true
    }
  })

  instance.info('test')
  end()
})

test('opts.browser.write func log single string', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.msg, 'test')
        ok(o.time)
      }
    }
  })
  instance.info('test')

  end()
})

test('opts.browser.write func string joining', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.msg, 'test test2 test3')
        ok(o.time)
      }
    }
  })
  instance.info('test', 'test2', 'test3')

  end()
})

test('opts.browser.write func string object joining', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.msg, 'test {"test":"test2"} {"test":"test3"}')
        ok(o.time)
      }
    }
  })
  instance.info('test', {test: 'test2'}, {test: 'test3'})

  end()
})

test('opts.browser.write func string interpolation', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.msg, 'test2 test ({"test":"test3"})')
        ok(o.time)
      }
    }
  })
  instance.info('%s test (%j)', 'test2', {test: 'test3'})

  end()
})

test('opts.browser.write func number', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.msg, 1)
        ok(o.time)
      }
    }
  })
  instance.info(1)

  end()
})

test('opts.browser.write func log single object', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: function (o) {
        is(o.level, 30)
        is(o.test, 'test')
        ok(o.time)
      }
    }
  })
  instance.info({test: 'test'})

  end()
})

test('opts.browser.write obj writes to methods corresponding to level', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {
      write: {
        error: function (o) {
          is(o.level, 50)
          is(o.test, 'test')
          ok(o.time)
        }
      }
    }
  })
  instance.error({test: 'test'})

  end()
})

test('opts.browser.asObject/write supports child loggers', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {write: function (o) {
      is(o.level, 30)
      is(o.test, 'test')
      is(o.msg, 'msg-test')
      ok(o.time)
    }}
  })
  var child = instance.child({test: 'test'})
  child.info('msg-test')

  end()
})

test('opts.browser.asObject/write supports child child loggers', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {write: function (o) {
      is(o.level, 30)
      is(o.test, 'test')
      is(o.foo, 'bar')
      is(o.msg, 'msg-test')
      ok(o.time)
    }}
  })
  var child = instance.child({test: 'test'}).child({foo: 'bar'})
  child.info('msg-test')

  end()
})

test('opts.browser.asObject/write supports child child child loggers', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {write: function (o) {
      is(o.level, 30)
      is(o.test, 'test')
      is(o.foo, 'bar')
      is(o.baz, 'bop')
      is(o.msg, 'msg-test')
      ok(o.time)
    }}
  })
  var child = instance.child({test: 'test'}).child({foo: 'bar'}).child({baz: 'bop'})
  child.info('msg-test')

  end()
})

test('opts.browser.asObject defensively mitigates naughty numbers', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var instance = pino({
    browser: {asObject: true, write: function () {}}
  })
  var child = instance.child({test: 'test'})
  child._childLevel = -10
  child.info('test')
  pass() // if we reached here, there was no infinite loop, so, .. pass.

  end()
})

test('opts.browser.write obj falls back to console where a method is not supplied', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
  var info = console.info
  console.info = function (o) {
    is(o.level, 30)
    is(o.msg, 'test')
    ok(o.time)
    console.info = info
  }
  var instance = require('../browser')({
    browser: {
      write: {
        error: function (o) {
          is(o.level, 50)
          is(o.test, 'test')
          ok(o.time)
        }
      }
    }
  })
  instance.error({test: 'test'})
  instance.info('test')

  end()
})

function levelTest (name) {
  test(name + ' logs', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var msg = 'hello world'
    sink(name, function (args) {
      is(args[0], msg)
      end()
    })
    pino({level: name})[name](msg)
  })

  test('passing objects at level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var msg = { hello: 'world' }
    sink(name, function (args) {
      is(args[0], msg)
      end()
    })
    pino({level: name})[name](msg)
  })

  test('passing an object and a string at level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var a = { hello: 'world' }
    var b = 'a string'
    sink(name, function (args) {
      is(args[0], a)
      is(args[1], b)
      end()
    })
    pino({level: name})[name](a, b)
  })

  test('formatting logs as ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    sink(name, function (args) {
      is(args[0], 'hello %d')
      is(args[1], 42)
      end()
    })
    pino({level: name})[name]('hello %d', 42)
  })

  test('passing error at level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var err = new Error('myerror')
    sink(name, function (args) {
      is(args[0], err)
      end()
    })
    pino({level: name})[name](err)
  })

  test('passing error with a serializer at level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    // in browser - should have no effect (should not crash)
    var err = new Error('myerror')
    sink(name, function (args) {
      is(args[0].err, err)
      end()
    })
    var instance = pino({
      level: name,
      serializers: {
        err: pino.stdSerializers.err
      }
    })
    instance[name]({err: err})
  })

  test('child logger for level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var msg = 'hello world'
    var parent = { hello: 'world' }
    sink(name, function (args) {
      is(args[0], parent)
      is(args[1], msg)
      end()
    })
    var instance = pino({level: name})
    var child = instance.child(parent)
    child[name](msg)
  })

  test('child-child logger for level ' + name, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var msg = 'hello world'
    var grandParent = { hello: 'world' }
    var parent = { hello: 'you' }
    sink(name, function (args) {
      is(args[0], grandParent)
      is(args[1], parent)
      is(args[2], msg)
      end()
    })
    var instance = pino({level: name})
    var child = instance.child(grandParent).child(parent)
    child[name](msg)
  })
}

function consoleMethodTest (level, method) {
  if (!method) method = level
  test('pino().' + level + ' uses console.' + method, ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    sink(method, function (args) {
      is(args[0], 'test')
      end()
    })
    var instance = require('../browser')({level: level})
    instance[level]('test')
  })
}

function absentConsoleMethodTest (method, fallback) {
  test('in absence of console.' + method + ', console.' + fallback + ' is used', ({plan, end, ok, same, is, isNot, throws, doesNotThrow, fail, pass, error, notError}) => {
    var fn = console[method]
    console[method] = undefined
    sink(fallback, function (args) {
      is(args[0], 'test')
      end()
      console[method] = fn
    })
    var instance = require('../browser')({level: method})
    instance[method]('test')
  })
}

function isFunc (fn) { return typeof fn === 'function' }
function fnName (fn) {
  var rx = /^\s*function\s*([^(]*)/i
  var match = rx.exec(fn)
  return match && match[1]
}
function sink (method, fn) {
  if (method === 'fatal') method = 'error'
  var orig = console[method]
  console[method] = function () {
    console[method] = orig
    fn(Array.prototype.slice.call(arguments))
  }
}
