/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3479636413")

  // update collection data
  unmarshal({
    "name": "lessons"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3479636413")

  // update collection data
  unmarshal({
    "name": "lesson"
  }, collection)

  return app.save(collection)
})
