var u = require('./')

// var users = [{ firstName: 'Michael', lastName: 'K', age: 78, birthday: new Date('08/10/1936')  },
// 	         { firstName: 'Ellen', lastName: 'K', age: 52, birthday: new Date('09/20/1962') },
// 	         { firstName: 'Mark', lastName: 'V', age: 28, birthday: new Date('05/31/1986') },
// 	         { firstName: 'Alex', lastName: 'K', age: 58 }
// 	        ]

var argv = require('minimist')(process.argv.slice(2))

var model = JSON.parse(decodeURIComponent(argv.model).replace(/\\t|\\n|\\"/g, ''))
var resource = JSON.parse(decodeURIComponent(argv.resource).replace(/\\t|\\n|\\"/g, ''))

u(model, function() {

})              
u(resource, function() {

})              
