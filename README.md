# bitloader-nedb-js
example for loading model and resources from the chain to a local nedb

Simple model:
```javascript
{
	"type": "base.ECPublicKey",
	"properties": {
		"x": {
			"required": true
		},
		"y": {}
	}
}
```
Simple resource for the above model:
```javascript
{
	"_type": "base.ECPublicKey",
	"_type_version": "...",
	"x": "a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd",
	"y": "5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235"
}
```
Model should be loaded first or resource won't be created. 
Some more complex models can have properties that have a type that corresponds to another model

For example:
```javascript
{
	"type": "base.Entity",
	"properties": {
		"public_key": {
			"range": "base.ECPublicKey",                // this model should be loaded first
			"version": "...ECPublicKey version hash..."
		}
	}
}
```
##Usage
```bash
node app
```

app will be listening on the port 3000. 

Type in your browser **URL** that is

``127.0.0.1:3000?json=model``

**Example** 
for a model above it is going to be

``127.0.0.1:3000?json={	"type": "base.ECPublicKey",	"properties": {"x": {"required": true}, "y": {}	}}``




