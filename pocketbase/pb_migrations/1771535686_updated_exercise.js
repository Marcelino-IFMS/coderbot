/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4002712837")

  // update collection data
  unmarshal({
    "name": "exercises"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4002712837")

  // update collection data
  unmarshal({
    "name": "exercise"
  }, collection)

  return app.save(collection)
})
