var express = require('express')
var loader = require('./')
var app = express()

app.get('/', function(req, res) {
  if (req.param('json'))
    loader(JSON.parse(req.param('json')))
})

var server = app.listen(3000, function() {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
