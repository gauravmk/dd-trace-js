'use strict'

const Tracer = require('opentracing').Tracer
const Scope = require('./scope/new/base')

class NoopTracer extends Tracer {
  constructor (config) {
    super(config)

    let ScopeManager

    if (process.env.DD_CONTEXT_PROPAGATION === 'false') {
      ScopeManager = require('./scope/noop/scope_manager')
    } else {
      ScopeManager = require('./scope/scope_manager')
    }

    this._scopeManager = new ScopeManager()
    this._scope = new Scope()
  }

  trace (operationName, options, callback) {
    callback(this.startSpan())
  }

  scopeManager () {
    return this._scopeManager
  }

  scope () {
    return this._scope
  }

  currentSpan () {
    return null
  }
}

module.exports = NoopTracer
