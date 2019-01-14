'use strict'

const Scope = require('../../src/scope/scope')

describe('ScopeManager', () => {
  let ScopeManager
  let scopeManager
  let asyncHooks

  beforeEach(() => {
    ScopeManager = require('../../src/scope/scope_manager')

    scopeManager = new ScopeManager()
  })

  it('should be a singleton', () => {
    expect(new ScopeManager()).to.equal(scopeManager)
  })

  it('should support activating a span', () => {
    const span = {}

    scopeManager.activate(span)

    expect(scopeManager.active()).to.not.be.undefined
    expect(scopeManager.active()).to.be.instanceof(Scope)
    expect(scopeManager.active().span()).to.equal(span)
  })

  it('should support closing a scope', () => {
    const previous = scopeManager.active()
    const span = {}
    const scope = scopeManager.activate(span)

    scope.close()

    expect(scopeManager.active()).to.equal(previous)
  })

  it('should support multiple simultaneous scopes', () => {
    const previous = scopeManager.active()
    const span1 = {}
    const span2 = {}
    const scope1 = scopeManager.activate(span1)

    expect(scopeManager.active()).to.equal(scope1)

    const scope2 = scopeManager.activate(span2)

    expect(scopeManager.active()).to.equal(scope2)

    scope2.close()

    expect(scopeManager.active()).to.equal(scope1)

    scope1.close()

    expect(scopeManager.active()).to.equal(previous)
  })

  it('should support automatically finishing the span on close', () => {
    const span = { finish: sinon.stub() }
    const scope = scopeManager.activate(span, true)

    scope.close()

    expect(span.finish).to.have.been.called
  })

  it('should automatically close pending scopes when the context exits', done => {
    const span = {}
    let scope

    setImmediate(() => {
      scope = scopeManager.activate(span)
      sinon.spy(scope, 'close')
    })

    setImmediate(() => {
      expect(scope.close).to.have.been.called
      done()
    })
  })

  it('should propagate parent context to children', done => {
    const span = {}
    const scope = scopeManager.activate(span)

    setImmediate(() => {
      expect(scopeManager.active()).to.equal(scope)

      setImmediate(() => {
        expect(scopeManager.active()).to.equal(scope)
        done()
      })
    })
  })

  it('should isolate asynchronous contexts', done => {
    const span1 = {}
    const span2 = {}

    const scope1 = scopeManager.activate(span1)

    setImmediate(() => {
      scopeManager.activate(span2)
    })

    setImmediate(() => {
      expect(scopeManager.active()).to.equal(scope1)
      done()
    })
  })

  it('should isolate reentering asynchronous contexts', done => {
    const span1 = {}
    const span2 = {}

    const scope1 = scopeManager.activate(span1)

    let finished = false

    const interval = setInterval(() => {
      if (!finished) {
        scopeManager.activate(span2)
        finished = true
      } else {
        clearInterval(interval)
        expect(scopeManager.active()).to.equal(scope1)
        done()
      }
    })
  })

  it('should allow deactivating a scope', () => {
    const span = {}

    scopeManager.activate(span)
    scopeManager.activate(null)

    expect(scopeManager.active()).to.be.null
  })
})
