'use strict'

describe('Scope', () => {
  let Scope
  let scope
  let span
  let manager

  beforeEach(() => {
    span = {
      finish: sinon.spy()
    }

    manager = {
      _close: sinon.spy()
    }

    Scope = require('../../src/scope/scope')
  })

  it('should expose its span', () => {
    scope = new Scope(span, manager)

    expect(scope.span()).to.equal(span)
  })

  it('should remove itself from the context on close', () => {
    scope = new Scope(span, manager)

    scope.close()

    expect(manager._close).to.have.been.calledWith(scope)
  })

  it('should not finish the span on close by default', () => {
    scope = new Scope(span, manager)

    scope.close()

    expect(span.finish).to.not.have.been.called
  })

  it('should support enabling to finish the span on close', () => {
    scope = new Scope(span, manager, true)

    scope.close()

    expect(span.finish).to.have.been.called
  })
})
