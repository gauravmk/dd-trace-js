'use strict'

const asyncHooks = require('./async_hooks')
const Scope = require('./scope')

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
    const eid = asyncHooks.executionAsyncId()
    const context = this._contexts.get(eid)

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
    const asyncId = asyncHooks.executionAsyncId()
    const context = this._contexts.get(asyncId) || []
    const scope = span ? new Scope(span, this, finishSpanOnClose) : null

    context.push(scope)

    this._contexts.set(asyncId, context)

    return scope
  }

  _init (asyncId) {
    const scope = this.active()

    if (scope) {
      this._scopes.set(asyncId, scope)
    }
  }

  _before (asyncId) {
    const scope = this._scopes.get(asyncId)
    this._contexts.set(asyncId, scope ? [scope] : [])
  }

  _after (asyncId) {
    const context = this._contexts.get(asyncId)

    if (context) {
      this._contexts.delete(asyncId)

      for (let i = 0, l = context.length; i < l; i++) {
        context[i] && context[i].close()
      }
    }
  }

  _destroy (asyncId) {
    this._scopes.delete(asyncId)
  }

  _close (scope) {
    const eid = asyncHooks.executionAsyncId()
    const context = this._contexts.get(eid)

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
