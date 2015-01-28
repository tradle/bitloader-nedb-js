'use strict'
var fs = require('fs')
var nedbLoader = require('../')
var Q = require('q')
var Datastore = require('nedb')
var models = require('./models')
var modelsDb // = new Datastore('test/path/models/models.db')

function removeModels(docs) {
  // var promisses = []
  // docs.forEach(function(doc) {
  // 	promisses.push(Q.ninvoke(modelsDb, 'remove', doc))
  // })
  var promisses = docs.map(function(doc) {
    return Q.ninvoke(modelsDb, 'remove', doc)
  })

  return Q.all(promisses)
}
describe('Creating Models', function() {
  before(function(done) {
    fs.readdir('test/path/models', function(err, files) {
      if (err)
        return done(err)
      else if (files.length === 0) {
        modelsDb = new Datastore('test/path/models/models.db')
        modelsDb.loadDatabase()
        return done()
      }

      modelsDb = new Datastore('test/path/models/' + files[0])
      modelsDb.loadDatabase()

      Q.ninvoke(modelsDb, 'find', {})
        .then(function(docs) {
          if (docs.length)
            return removeModels(docs)
        })
        .then(function() {
          done()
        })
        .catch(function(err) {
          done(err)
        })
    })
  })
  it('Creating several models', function(done) {
    var promisses = []
    for (var i = 0; i < models.length; i++)
      promisses.push(nedbLoader.mkModel(models[i], modelsDb))
    Q.all(promisses).then(function() {
      return done()
    }, function(err) {
      return done(err)
    })
  })

})
