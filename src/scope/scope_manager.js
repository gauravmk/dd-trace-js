'use strict'

const asyncHooks = require('./async_hooks')
const Scope = require('./scope')

// const fs = require('fs')
// const log = msg => fs.writeSync(2, `${msg}\n`)

let singleton = null

/**
 * The Datadog Scope Manager. This is used for context propagation.
 *
 * @hideconstructor
 */
class ScopeManager {
  constructor () {
    if (singleton) {
      return singleton
    }

    singleton = this

    this._active = []
    this._stack = []
    this._scopes = new Map()
    this._contexts = new Map()

    this._hook = asyncHooks.createHook({
      init: this._init.bind(this),
      before: this._before.bind(this),
      after: this._after.bind(this),
      destroy: this._destroy.bind(this),
      promiseResolve: this._destroy.bind(this)
    })

    this._enable()

    return this
  }

  /**
   * Get the current active scope or null if there is none.
   *
   * @returns {Scope} The active scope.
   */
  active () {
    // const eid = asyncHooks.executionAsyncId()
    // log(`active ${this._currentId} ${eid}`)
    const context = this._active

    return (context && context[context.length - 1]) || null
  }

  /**
   * Activate a new scope wrapping the provided span.
   *
   * @param {external:"opentracing.Span"} span The span for which to activate the new scope.
   * @param {?Boolean} [finishSpanOnClose=false] Whether to automatically finish the span when the scope is closed.
   * @returns {Scope} The newly created and now active scope.
   */
  activate (span, finishSpanOnClose) {
    // const asyncId = asyncHooks.executionAsyncId()
    // log(`activate ${this._currentId} ${asyncId}`)
    const context = this._active
    const scope = span ? new Scope(span, this, finishSpanOnClose) : null

    context.push(scope)

    // this._contexts.set(asyncId, context)

    return scope
  }

  _init (asyncId) {
    // const eid = asyncHooks.executionAsyncId()
    // log(`active ${this._currentId} ${eid}`)
    // const context = this.active()
    // const scope = (context && context[context.length - 1]) || null

    const scope = this.active()

    if (scope) {
      this._scopes.set(asyncId, scope)
    }
  }

  _before (asyncId) {
    // this._currentId = asyncId
    // log(`active ${this._currentId} ${asyncHooks.executionAsyncId()}`)
    const scope = this._scopes.get(asyncId)
    const context = scope ? [scope] : []

    this._contexts.set(asyncId, context)
    this._stack.push(this._active)
    this._active = context
  }

  _after (asyncId) {
    const context = this._contexts.get(asyncId)

    if (context) {
      this._contexts.delete(asyncId)
      this._active = this._stack.pop()

      for (let i = 0, l = context.length; i < l; i++) {
        context[i] && context[i].close()
      }
    }
  }

  _destroy (asyncId) {
    this._scopes.delete(asyncId)
  }

  _close (scope) {
    // const eid = asyncHooks.executionAsyncId()
    // const context = this._contexts.get(eid)

    const context = this._active

    if (context) {
      const index = context.lastIndexOf(scope)

      if (~index) {
        context.splice(index, 1)
      }
    }
  }

  _enable () {
    this._hook.enable()
  }

  _disable () {
    this._hook.disable()
  }
}

module.exports = ScopeManager
