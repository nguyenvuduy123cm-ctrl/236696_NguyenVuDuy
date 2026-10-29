require('dotenv').config();
const { MongoClient } = require('mongodb');

const foods = [
  { foodId: 'FOOD001', name: 'Pho bo', category: 'Mon nuoc', cuisine: 'Viet Nam', ingredients: ['Banh pho', 'Thit bo', 'Hanh'], price: 50000, quantity: 20, description: 'Pho bo truyen thong', imageUrl: '' },
  { foodId: 'FOOD002', name: 'Com tam', category: 'Mon chinh', cuisine: 'Viet Nam', ingredients: ['Com tam', 'Suon heo', 'Nuoc mam'], price: 45000, quantity: 15, description: 'Com tam suon nuong', imageUrl: '' },
  { foodId: 'FOOD003', name: 'Banh mi', category: 'Mon nhanh', cuisine: 'Viet Nam', ingredients: ['Banh mi', 'Thit', 'Rau'], price: 25000, quantity: 30, description: 'Banh mi Viet Nam', imageUrl: '' },
  { foodId: 'FOOD004', name: 'Bun bo Hue', category: 'Mon nuoc', cuisine: 'Viet Nam', ingredients: ['Bun', 'Thit bo', 'Sa te'], price: 45000, quantity: 18, description: 'Bun bo Hue dam da', imageUrl: '' },
  { foodId: 'FOOD005', name: 'Goi cuon', category: 'Mon khai vi', cuisine: 'Viet Nam', ingredients: ['Banh trang', 'Tom', 'Thit heo', 'Rau'], price: 30000, quantity: 25, description: 'Goi cuon tom thit', imageUrl: '' },
  { foodId: 'FOOD006', name: 'Mi xao bo', category: 'Mon chinh', cuisine: 'Viet Nam', ingredients: ['Mi', 'Thit bo', 'Rau cai'], price: 40000, quantity: 22, description: 'Mi xao bo rau cai', imageUrl: '' },
  { foodId: 'FOOD007', name: 'Com ga', category: 'Mon chinh', cuisine: 'Viet Nam', ingredients: ['Com', 'Thit ga', 'Rau'], price: 40000, quantity: 16, description: 'Com ga thom ngon', imageUrl: '' },
  { foodId: 'FOOD008', name: 'Banh xeo', category: 'Mon an vat', cuisine: 'Viet Nam', ingredients: ['Bot gao', 'Tom', 'Thit heo', 'Gia'], price: 35000, quantity: 12, description: 'Banh xeo gion', imageUrl: '' },
  { foodId: 'FOOD009', name: 'Pizza hai san', category: 'Mon nhanh', cuisine: 'Y', ingredients: ['Bot mi', 'Pho mai', 'Hai san'], price: 99000, quantity: 10, description: 'Pizza hai san pho mai', imageUrl: '' },
  { foodId: 'FOOD010', name: 'Ga ran', category: 'Mon nhanh', cuisine: 'Han Quoc', ingredients: ['Thit ga', 'Bot chien', 'Gia vi'], price: 55000, quantity: 14, description: 'Ga ran gion', imageUrl: '' }
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Khong tim thay MONGODB_URI trong file .env');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('236696_NguyenVuDuy');
    const collection = db.collection('foods');

    for (const food of foods) {
      await collection.updateOne(
        { foodId: food.foodId },
        { $set: food },
        { upsert: true }
      );
    }

    console.log('Da them/cap nhat 10 mon an mau thanh cong!');
    console.log('Tong so mon an trong collection:', await collection.countDocuments());
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error('Loi them mon an:', error.message);
  process.exitCode = 1;
});
