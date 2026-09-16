/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_672729168")

  // remove field
  collection.fields.removeById("text1316268946")

  // remove field
  collection.fields.removeById("text1520624518")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number302230139",
    "max": null,
    "min": null,
    "name": "workload",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor1316268946",
    "maxSize": 0,
    "name": "syllabus",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor1520624518",
    "maxSize": 0,
    "name": "general_objective",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "json2914986218",
    "maxSize": 0,
    "name": "specific_objectives",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor2913988018",
    "maxSize": 0,
    "name": "methodology",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor4149362032",
    "maxSize": 0,
    "name": "assessment",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "json2129258850",
    "maxSize": 0,
    "name": "basic_references",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "json2157666737",
    "maxSize": 0,
    "name": "complementary_references",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number3206337475",
    "max": null,
    "min": null,
    "name": "version",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text724990059",
    "max": 0,
    "min": 0,
    "name": "discipline",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4274335913",
    "max": 0,
    "min": 0,
    "name": "course",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_672729168")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1316268946",
    "max": 0,
    "min": 0,
    "name": "syllabus",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1520624518",
    "max": 0,
    "min": 0,
    "name": "general_objective",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("number302230139")

  // remove field
  collection.fields.removeById("editor1316268946")

  // remove field
  collection.fields.removeById("editor1520624518")

  // remove field
  collection.fields.removeById("json2914986218")

  // remove field
  collection.fields.removeById("editor2913988018")

  // remove field
  collection.fields.removeById("editor4149362032")

  // remove field
  collection.fields.removeById("json2129258850")

  // remove field
  collection.fields.removeById("json2157666737")

  // remove field
  collection.fields.removeById("number3206337475")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text724990059",
    "max": 0,
    "min": 0,
    "name": "title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4274335913",
    "max": 0,
    "min": 0,
    "name": "content",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
