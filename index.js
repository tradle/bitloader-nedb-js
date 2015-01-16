"use strict"
var Datastore = require('nedb'),
    Q = require('q'),
    dataTypes = ['long', 'boolean', 'biginteger', 'double', 'date', 'string'],
    resourceDBs = {}

var print = function(err, options) {
  console.log(JSON.stringify(options, null, 2))
}

var models = new Datastore("path/models/models.db")
models.loadDatabase()
var verifiedModels = {}

var InsertUpdate = module.exports = function(options, db) {
  if (db)
    models = db
  if (options.constructor === Array) {
    for (var i=0; i<options.length; i++) 
      mkModel(options[i])
  } 
  else { 
    if (options.type) 
      mkModel(options)
    else
      mkResource(options)
  }
}

// MODEL
var mkModel = module.exports.mkModel = function (model, db) {
  var models = db ? db : models

  return Q.ninvoke(models, "find", {type: model.type})
        .then(function(docs) {
           if (!docs.length) 
             return checkModel(model, models)
           else 
             throw new Error("model '" + type + "' was not found")
        })
        .then(function() {
           return Q.ninvoke(models, "insert", model)
        })
        .catch(function(err) {
           return err
        }) 
}


function checkModel(model, db) {
  var meta = model['properties'],
      promisses = [] 

  for (var p in meta) {
    var range = meta[p].range || 'string'
    var idx = dataTypes.indexOf(range)

    // allow backlink properties with not yet defined models 
    if (idx != -1  ||  meta[p].backLink)
      continue
    promisses.push(checkRange(range, promisses, db))
  }
  return Q.all(promisses)
}
function checkRange(range, promisses, db) {
  return Q.ninvoke(db, "find", {type: range})
          .then(function(docs) {
            if (docs.length)
              verifiedModels[docs[0].type] = docs[0]
            else
              throw new Error('No collection ' + range + ' is found')
          }) 
}
// RESOURCE
var mkResource = module.exports.mkResource = function (resource, db) {
  var type = resource._type,
      verifiedResource = {},
      promisses = [],
      models = db ? db : models,
      model;

  return Q.ninvoke(models, 'find', {type: type})
    .then(function(docs) {
      model = docs[0]
      if (!model)
        throw new Error("model '" + type + '" does not exist')
      checkModel(model, promisses, models)
      return Q.all(promisses)
    })
    .then(function() {
      checkResource(model, verifiedResource, resource)
      return updateResource(type, verifiedResource, models)
    })    
    // .catch(function(err) {
    //   throw new Error(err)
    // })    
}
function updateResource(type, verifiedResource, models) {
  if (!Object.keys(verifiedResource)) 
    return
  var fn = models.filename
  var path = fn.substring(0, fn.indexOf('/models/')) +  "/resources/" + type.replace(/\./g, '_') + ".db"
  var db = resourceDBs[path]
  if (!db) {
     db = new Datastore({filename: path, autoload: true})
     resourceDBs[path] = db
  }
  return Q.ninvoke(db, "update", verifiedResource, {$set: {type: type}}, { upsert: true })
}


function checkResource(model, verifiedResource, resource) {
  var meta = model['properties'],
      err = ''

  for (var p in meta) {
    if (!resource[p]) {
      if (meta[p].required)
        return 'Property ' + p + ' is required'
      continue
    }
    var range = meta[p].range || 'string'
    var idx = dataTypes.indexOf(range)

    if (idx == -1) {
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
      if (!parseFloat(resource[p]))
        err += 'Property ' + p + ' is not a valid long'
      verifiedResource[p] = resource[p]
      break;
    case 'double':
      if (!parseDouble(resource[p]))
        err += 'Property ' + p + ' is not a valid long'
      verifiedResource[p] = resource[p]
      break;
    case 'boolean':
      if (resource[p] != 'true' &&  resource[p] != 'false') 
        err += 'Property ' + p + ' is not a valid boolean'
      verifiedResource[p] = resource[p]
      break;
    default:
      verifiedResource[p] = resource[p] 
    }
  }

  if (err) throw new Error(err)
}

function verifyValue(resource, verifiedResource, property, propertyModel) {
  var o = resource[property];
  if ((typeof o != 'object')) //  &&  dataTypes.indexOf(model[0].properties[property]) != -1)
    verifiedResource[property] = resource[property]
  else
    checkValue(propertyModel, verifiedResource, o)
}

