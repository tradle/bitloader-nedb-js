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
        modelsDb = new Datastore({filename:'test/path/models/models.db', autoload:true})
        // modelsDb.loadDatabase()
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

    // // var promisses = []
    // // for (var i = 0; i < models.length; i++)
    // //   promisses.push(nedbLoader.mkModel(models[i], modelsDb))
    // // debugger;
    // series(models.map(function(model) {
    //   return function() {
    //     console.log('Starting ' + model.type);
    //     return nedbLoader.mkModel(model, modelsDb).then(function() {
    //       console.log('Finished ' + model.type);
    //     });
    //   }
    // }))
    // .then(function() {
    //   return done()
    // })
    // .catch(function (err) {
    //   return done(err)
    // })

    nedbLoader.mkModels(models, modelsDb)
    .finally(function(err) {
      return done()
    })
    // var t = [models]
    // series(t.map(function(tt) {
    //   return function() {
    //     return nedbLoader.mkModels(tt, modelsDb)
    //   }
    // }))

  })

})

function series(tasks) {
  return tasks.reduce(function(last, cur) {
    return last.then(cur);
  }, Q());
}