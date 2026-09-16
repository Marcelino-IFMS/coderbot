/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_672729168")

  // remove field
  collection.fields.removeById("relation3455582614")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_672729168")

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2920376115",
    "hidden": false,
    "id": "relation3455582614",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "lesson_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
