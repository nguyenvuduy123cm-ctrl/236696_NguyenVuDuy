const { ObjectId } = require('mongodb');
const { getDB } = require('../models/db');

async function getStockHistory(req, res) {
  try {
    const db = getDB();
    const history = await db.collection('stockHistory')
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    res.json(history);
  } catch (error) {
    console.error('Loi doc lich su kho:', error);
    res.status(500).json({ message: 'Khong tai duoc lich su kho' });
  }
}

async function receiveStock(req, res) {
  try {
    const { foodMongoId, quantity, note } = req.body || {};

    if (
      typeof foodMongoId !== 'string' ||
      !ObjectId.isValid(foodMongoId)
    ) {
      return res.status(400).json({ message: 'Mon an khong hop le' });
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: 'So luong nhap phai la so nguyen lon hon 0'
      });
    }

    if (note !== undefined && typeof note !== 'string') {
      return res.status(400).json({ message: 'Ghi chu khong hop le' });
    }

    const db = getDB();
    const foods = db.collection('foods');
    const foodObjectId = new ObjectId(foodMongoId);

    const food = await foods.findOne({ _id: foodObjectId });

    if (!food) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    const quantityBefore = Number(food.quantity || 0);
    const quantityAfter = quantityBefore + quantity;

    if (!Number.isSafeInteger(quantityAfter)) {
      return res.status(400).json({ message: 'So luong sau khi nhap qua lon' });
    }

    // Chi cong them so luong, khong ghi de cac truong mon an khac.
    const updated = await foods.updateOne(
      { _id: foodObjectId },
      { $inc: { quantity }, $set: { updatedAt: new Date() } }
    );

    if (updated.matchedCount === 0) {
      return res.status(404).json({ message: 'Mon an khong con ton tai' });
    }

    const entry = {
      foodMongoId: foodObjectId,
      foodId: food.foodId || '',
      foodName: food.name || '',
      quantityAdded: quantity,
      quantityBefore,
      quantityAfter,
      note: (note || '').trim().slice(0, 500),
      createdAt: new Date()
    };

    try {
      const result = await db.collection('stockHistory').insertOne(entry);
      entry._id = result.insertedId;
    } catch (historyError) {
      // Neu ghi lich su that bai, thu hoan tac so luong de tranh lech du lieu.
      await foods.updateOne(
        { _id: foodObjectId },
        { $inc: { quantity: -quantity }, $set: { updatedAt: new Date() } }
      );
      throw historyError;
    }

    res.status(201).json({
      message: 'Nhap kho thanh cong',
      food: {
        _id: foodObjectId,
        foodId: food.foodId,
        name: food.name,
        quantity: quantityAfter
      },
      history: entry
    });
  } catch (error) {
    console.error('Loi nhap kho:', error);
    res.status(500).json({ message: 'Nhap kho that bai' });
  }
}

module.exports = { getStockHistory, receiveStock };
