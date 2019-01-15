const ah = require('async_hooks')
const fs = require('fs')
const log = (msg) => fs.writeSync(2, `${msg}\n`)

const hook = ah.createHook({
  init: (asyncId) => {
    const eid = ah.executionAsyncId()
    log(`init ${asyncId} ${eid}`)
  },
  before: (asyncId) => {
    const eid = ah.executionAsyncId()
    log(`before ${asyncId} ${eid}`)
  },
  after: (asyncId) => {
    const eid = ah.executionAsyncId()
    log(`after ${asyncId} ${eid}`)
  },
  destroy: (asyncId) => {
    const eid = ah.executionAsyncId()
    log(`destroy ${asyncId} ${eid}`)
  },
  promiseResolve: (asyncId) => {
    const eid = ah.executionAsyncId()
    log(`promiseResolve ${asyncId} ${eid}`)
  }
})

hook.enable()

const promise = new Promise((resolve) => {
  setTimeout(() => resolve(), 200)
})

setTimeout(() => {
  // log('outside')
  // promise.then(() => {
  //   log('inside')
  // })

  console.log('start')

  promise
    .then(() => {})
    .then(() => {})
    .then(() => {})
}, 1500)
