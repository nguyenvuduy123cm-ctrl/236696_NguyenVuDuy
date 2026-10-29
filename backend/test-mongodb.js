require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const db = client.db('236696_NguyenVuDuy');
    await db.command({ ping: 1 });

    console.log('Ket noi MongoDB Atlas thanh cong!');

    const result = await db.collection('foods').insertMany([
      {
        foodId: 'FOOD001',
        name: 'Pho bo',
        category: 'Mon nuoc',
        cuisine: 'Viet Nam',
        ingredients: ['Banh pho', 'Thit bo', 'Hanh'],
        price: 50000,
        quantity: 20,
        description: 'Pho bo truyen thong',
        imageUrl: ''
      },
      {
        foodId: 'FOOD002',
        name: 'Com tam',
        category: 'Mon chinh',
        cuisine: 'Viet Nam',
        ingredients: ['Com tam', 'Suon heo', 'Nuoc mam'],
        price: 45000,
        quantity: 15,
        description: 'Com tam suon',
        imageUrl: ''
      },
      {
        foodId: 'FOOD003',
        name: 'Banh mi',
        category: 'Mon nhanh',
        cuisine: 'Viet Nam',
        ingredients: ['Banh mi', 'Thit', 'Rau'],
        price: 25000,
        quantity: 30,
        description: 'Banh mi Viet Nam',
        imageUrl: ''
      }
    ]);

    console.log('Da them 3 mon an. So ban ghi:', result.insertedCount);
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error('Loi:', error.message);
  process.exitCode = 1;
});
