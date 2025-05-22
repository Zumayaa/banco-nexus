import db from "./db.js"
import express from 'express'
import { ObjectId } from 'mongodb'
const app = express()
const port = 3000

app.get("/users", async (req, res) => {
  let collection = await db.collection("clientes");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/users/:id", async (req, res) => {
  let collection = await db.collection("clientes");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);
  res.send(result).status(200);
});


app.listen(port, () => {
  console.log(`HOT TO GO: ${port}`)
})
