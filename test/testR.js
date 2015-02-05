'use strict'
var fs = require('fs')
var nedbLoader = require('../')
var Datastore = require('nedb')
var Q = require('q')
var resources = require('./resources')
var ecPubKey = require('./ecPubKey')
var modelsDb = new Datastore('test/path/models/models.db')

function removeResources(docs, rDb) {
  // var promisses = []
  // docs.forEach(function(doc) {
  //  promisses.push(Q.ninvoke(modelsDb, 'remove', doc))
  // })
  var promisses = docs.map(function(doc) {
    return Q.ninvoke(rDb, 'remove', doc)
  })

  return Q.all(promisses)
}

describe('Creating Resources', function() {
  //  this.timeout(10000)
  before(function(done) {
    modelsDb.loadDatabase()
    fs.readdir('test/path/resources', function(err, files) {
      //  if (err)
      // return done(err)
      if (!files || files.length === 0)
        return done()
      var fcnt = 0
      var dfd = Q.defer()
      files.forEach(function(filename) {
        var rDb = new Datastore({
            filename: 'test/path/resources/' + filename,
            autoload: true
          })
          // rDb.loadDatabase()

        Q.ninvoke(rDb, 'find', {})
          .then(function(docs) {
            fcnt++
            if (docs.length)
              return removeResources(docs, rDb)
          })
          .then(function() {
            if (fcnt === files.length)
              dfd.resolve()
          })
          .catch(function(err) {
            throw new Error(err)
          })
      })
      dfd.promise.then(function() {
        return done()
      }, function(err) {
        return done(err)
      })
    })
  })
  it('Creating resource of non-existing type', function(done) {
    var resources = ecPubKey;
    var promisses = []

    for (var i = 0; i < resources.length; i++)
      promisses.push(nedbLoader.mkResource(resources[i], modelsDb))
    Q.all(promisses)
      // .then(function() {
      //   return done()
      // })
      .catch(function(err) {
        // assert(err == null, err)
        return done()
          // return done(err)
      })
  })
  it('Creating new resources', function(done) {
    var promisses = []

    for (var i = 0; i < resources.length; i++)
      promisses.push(nedbLoader.mkResource(resources[i], modelsDb))
    Q.allSettled(promisses).then(function(results) {
      for (var i = 0; i < results.length; i++) {
        var r = results[i]
        if (r.reason)
          return done(r.reason)

      }
      return done()
    })
  })
})
