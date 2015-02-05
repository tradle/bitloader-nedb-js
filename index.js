'use strict'
var Datastore = require('nedb')
var Q = require('q')
var dataTypes = ['long', 'boolean', 'biginteger', 'double', 'date', 'string']
var resourceDBs = {}
var verifiedModels = {}
var verifyingModels = {}

module.exports = function InsertUpdate(options, db) {
  if (!db)
    db = new Datastore({
      filename: 'path/models/models.db',
      autoload: true
    })
  if (options.constructor === Array) {
    mkModels(options, db)
    .then(function() {
      console.log('Successful models loading')
    })
    .catch(function(err) {
      throw new Error(err)
    })

    // for (var i = 0; i < options.length; i++) 
    //   mkModel(options[i], db)
  } else {
    if (options.type)
      mkModel(options, db)
    else
      mkResource(options, db)
  }
}

function series(tasks) {
  return tasks.reduce(function(last, cur) {
    return last.then(cur);
  }, Q());
}


module.exports.mkModel    = mkModel
module.exports.mkModels   = mkModels
module.exports.mkResource = mkResource

function mkModels(models, db) {
  return series(models.map(function(model) {
    return function() {
      return mkModel(model, db).then(function() {
        console.log(model.type)
      })  
    }
  }))
}
// MODEL
function mkModel(model, db) {
  return Q.ninvoke(db, 'find', {
      type: model.type
    })
    .then(function(docs) {
      if (!docs.length)
        return checkModel(model, db)
      else
        throw new Error('model "' + model.type + '" was not found')
    })
    .then(function() {
      return Q.ninvoke(db, 'insert', model)
    })
    .catch(function(err) {
      throw new Error(err)
    })
}

function checkModel(model, db) {
  var meta = model.properties
  var promisses = []

  for (var p in meta) {
    var range = meta[p].range || 'string'
    var idx = dataTypes.indexOf(range)

    // allow backlink properties with not yet defined models
    if (idx !== -1 || meta[p].backLink)
      continue

    if (!verifiedModels[range]  &&  !verifyingModels[range]) {
      verifyingModels[range] = range
      promisses.push(checkRange(range, promisses, db))
    }
  }
  return Q.all(promisses)
}

function checkRange(range, promisses, db) {
    return Q.ninvoke(db, 'find', {
        type: range
      })
      .then(function(docs) {
        verifyingModels[range] = null
        if (docs.length)
          verifiedModels[docs[0].type] = docs[0]
        else
          throw new Error('No collection ' + range + ' is found')
      })
  }
  // RESOURCE
function mkResource(resource, db) {
  var type = resource._type
  var verifiedResource = {}
  var promisses = []
  var model

  return Q.ninvoke(db, 'find', {
      type: type
    })
    .then(function(docs) {
      model = docs[0]
      if (!model)
        throw new Error('model "' + type + '" does not exist')
      checkModel(model, promisses, db)
      return Q.all(promisses)
    })
    .then(function() {
      checkResource(model, verifiedResource, resource)
      return updateResource(type, verifiedResource, db)
    })
    .catch(function(err) {
      throw new Error(err)
    })
}

function updateResource(type, verifiedResource, models) {
  if (!Object.keys(verifiedResource))
    return
  var fn = models.filename
  var path = fn.substring(0, fn.indexOf('/models/')) + '/resources/' + type.replace(/\./g, '_') + '.db'
  var db = resourceDBs[path]
  if (!db) {
    db = new Datastore({
      filename: path,
      autoload: true
    })
    resourceDBs[path] = db
  }
  return Q.ninvoke(db, 'update', verifiedResource, {
    $set: {
      type: type
    }
  }, {
    upsert: true
  })
}

function checkResource(model, verifiedResource, resource) {
  var meta = model.properties
  var err = ''

  for (var p in meta) {
    if (!resource[p]) {
      if (meta[p].required)
        return 'Property ' + p + ' is required'
      continue
    }
    var range = meta[p].range || 'string'
    var idx = dataTypes.indexOf(range)

    if (idx === -1) {
      // range of the property is another model
      verifyValue(resource, verifiedResource, p, verifiedModels[range])
      continue
    }

    switch (range) {
      case 'string':
        verifiedResource[p] = resource[p]
        break;
      case 'date':
        if (!new Date(resource[p]))
          err += 'Property ' + p + ' is not a valid date'
        else
          verifiedResource[p] = resource[p]
        break;
      case 'long':
        if (!parseInt(resource[p]))
          err += 'Property ' + p + ' is not a valid long'
        verifiedResource[p] = resource[p]
        break;
      case 'double':
        if (!parseFloat(resource[p]))
          err += 'Property ' + p + ' is not a valid double'
        verifiedResource[p] = resource[p]
        break;
      case 'boolean':
        if (resource[p] !== 'true' && resource[p] !== 'false')
          err += 'Property ' + p + ' is not a valid boolean'
        verifiedResource[p] = resource[p]
        break;
      default:
        verifiedResource[p] = resource[p]
        break;
    }
  }

  if (err) throw new Error(err)
}

function verifyValue(resource, verifiedResource, property, propertyModel) {
  var o = resource[property];
  if ((typeof o !== 'object')) //  &&  dataTypes.indexOf(model[0].properties[property]) != -1)
    verifiedResource[property] = resource[property]
  else
    checkResource(propertyModel, verifiedResource, o)
}
