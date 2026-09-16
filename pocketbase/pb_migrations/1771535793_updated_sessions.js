/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = teacherId",
    "deleteRule": "@request.auth.id = teacherId",
    "listRule": "@request.auth.id = teacherId",
    "updateRule": "@request.auth.id = teacherId",
    "viewRule": "@request.auth.id = teacherId"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3660498186")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
