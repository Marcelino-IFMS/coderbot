/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1262591861")

  // remove field
  collection.fields.removeById("number3744569626")

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3482339971",
    "hidden": false,
    "id": "relation3744569626",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "submittedCount",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1262591861")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number3744569626",
    "max": null,
    "min": null,
    "name": "submittedCount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("relation3744569626")

  return app.save(collection)
})
