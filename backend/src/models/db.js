require('dotenv').config();

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Thieu MONGODB_URI trong file .env');
}

const client = new MongoClient(uri);

let database;

async function connectDB() {
  if (database) return database;

  await client.connect();
  database = client.db('236696_NguyenVuDuy');

  await database.command({ ping: 1 });
  console.log('MongoDB Atlas da ket noi thanh cong!');

  return database;
}

function getDB() {
  if (!database) {
    throw new Error('MongoDB chua ket noi');
  }

  return database;
}

module.exports = { connectDB, getDB };
