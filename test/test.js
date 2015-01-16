"use strict"
var fs = require('fs'),
    nedbLoader = require('..'),
    Q = require("q"),
    Datastore = require('nedb'),
	  modelsDb // = new Datastore("test/path/models/models.db")

function removeModels(docs) {
  // var promisses = []
  // docs.forEach(function(doc) {
  // 	promisses.push(Q.ninvoke(modelsDb, "remove", doc))
  // })
  var promisses = docs.map(function(doc) {
  	return Q.ninvoke(modelsDb, "remove", doc)
  })

  return Q.all(promisses)
}
describe('Creating Models', function(){
  before(function(done){
		fs.readdir('test/path/models', function(err, files) {
		  if (err)
			  return done(err)
		  else if (files.length == 0) {
	 	    modelsDb = new Datastore("test/path/models/models.db")
		    modelsDb.loadDatabase()
	  		return done()
		  }
	    var dfd = Q.defer() 
		  modelsDb = new Datastore("test/path/models/" + files[0])
		  modelsDb.loadDatabase()

		  Q.ninvoke(modelsDb, "find", {})
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
  it("Creating several models", function(done){
		var models = [ {
		  "type": "base.ECPublicKey",
		  "properties": {
				"x": {
					"required": true
				},
				"y": {}
			  }
	    },
	    {
		  "type": "base.currency.Money",
		  "properties": {
				"value": {
					"required": true,
					"range": "double"
				},
				"currency": {}
		  }
	    },    
	    {
			"type": "base.Entity",
			"properties": {
				"public_key": {
					"range": "base.ECPublicKey",
					"version": "...ECPublicKey version hash..."
				}
			}
		},
		{
			"type": "base.ECKey",
			"properties": {
				"curve": {
					"required": true,
				},
				"private_key": {
					"range": "biginteger"
				},
				"public_key": {
					"required": true,
					"range": "base.ECPublicKey",
					"version": "..."
				}
			}
		},
		{
		 	"type": "business.coffeeshop.Inventory",
		 	"properties": {
		 		"owner": {},
		 		"items": {
		 			"backLink": "inventory",
		 			"range": "business.coffeeshop.InventoryItem",
		 			"version": "..."
		 		}
		 	}
		},
		{
			"type": "business.coffeeshop.InventoryItem",
			"properties": {
				"name": {},
				"pricePerUnit": {
					"range": "base.currency.Money",
					"version": "..."
				},
				"inventory": {
					"range": "business.coffeeshop.Inventory",
					"version": "..."
				}
			}
		}			  
	  ]
	  var promisses = []
	  for (var i=0; i<models.length; i++) 
	    promisses.push(nedbLoader.mkModel(models[i], modelsDb))
    Q.all(promisses).then(function() {
      return done()	  	
	  }, function(err) {
	  	return done(err)
	  })
  })

})
