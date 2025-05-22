import db from "./db.js"
import express from 'express'
import { ObjectId } from 'mongodb'
const app = express()
const port = 3000
import cors from 'cors'

app.use(cors())

app.get("/clients", async (req, res) => {
  let collection = await db.collection("clientes");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/clients/:id", async (req, res) => {
  let collection = await db.collection("clientes");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);
  res.send(result).status(200);
});

app.get("/accounts", async (req, res) => {
  let collection = await db.collection("cuentas");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/accounts/:curp", async (req, res) => {
  let collection = await db.collection("cuentas");
  let query = { cliente: req.params.curp };
  let result = await collection.find(query).toArray();
  console.log(result);
  res.send(result).status(200);
});

app.get("/transactions", async (req, res) => {
  let collection = await db.collection("cuentas");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/transactions/:account", async (req, res) => {
  let collection = db.collection("transacciones");
  var query = { cuenta: req.params.account };
  const acc = await collection.find(query).toArray();
  res.send(acc).status(200);
});

app.listen(port, () => {
  console.log(`HOT TO GO: ${port}`)
})
