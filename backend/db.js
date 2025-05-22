import { MongoClient } from "mongodb";
const connectionString = "mongodb://0.0.0.0:27017";
const client = new MongoClient(connectionString);
let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}

let db = conn.db("banco_nexus");
// console.log(db);

export default db;
