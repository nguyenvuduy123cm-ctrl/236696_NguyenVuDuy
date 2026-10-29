const { ObjectId } = require('mongodb');
const { getDB } = require('../models/db');

const validFields = [
  'foodId',
  'name',
  'category',
  'cuisine',
  'ingredients',
  'price',
  'quantity',
  'description',
  'imageUrl'
];

function validateFood(food, partial = false) {
  const errors = [];

  if (!partial || food.foodId !== undefined) {
    if (typeof food.foodId !== 'string' || !food.foodId.trim()) {
      errors.push('foodId la bat buoc');
    }
  }

  if (!partial || food.name !== undefined) {
    if (typeof food.name !== 'string' || !food.name.trim()) {
      errors.push('name la bat buoc');
    }
  }

  if (food.price !== undefined &&
      (!Number.isFinite(food.price) || food.price < 0)) {
    errors.push('price phai la so khong am');
  }

  if (food.quantity !== undefined &&
      (!Number.isInteger(food.quantity) || food.quantity < 0)) {
    errors.push('quantity phai la so nguyen khong am');
  }

  if (food.ingredients !== undefined && !Array.isArray(food.ingredients)) {
    errors.push('ingredients phai la mang');
  }

  return errors;
}

function cleanFood(food) {
  const result = {};

  for (const field of validFields) {
    if (food[field] !== undefined) {
      result[field] = food[field];
    }
  }

  if (typeof result.foodId === 'string') {
    result.foodId = result.foodId.trim();
  }

  if (typeof result.name === 'string') {
    result.name = result.name.trim();
  }

  return result;
}

function handleError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'foodId da ton tai'
    });
  }

  console.error(error);
  return res.status(500).json({
    message: 'Loi may chu'
  });
}

function parseId(id) {
  return typeof id === 'string' && ObjectId.isValid(id)
    ? new ObjectId(id)
    : null;
}

// GET /api/foods?q=pho
async function getFoods(req, res) {
  try {
    const db = getDB();
    const filter = {};
    const q = typeof req.query.q === 'string'
      ? req.query.q.trim()
      : '';

    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeQ, 'i');

      filter.$or = [
        { name: regex },
        { category: regex },
        { cuisine: regex },
        { foodId: regex }
      ];
    }

    const foods = await db.collection('foods')
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    res.json(foods);
  } catch (error) {
    handleError(res, error);
  }
}

// GET /api/foods/:id
async function getFood(req, res) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'ID khong hop le' });
    }

    const food = await getDB().collection('foods').findOne({ _id: id });

    if (!food) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    res.json(food);
  } catch (error) {
    handleError(res, error);
  }
}

// POST /api/foods
async function createFood(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Du lieu khong hop le' });
    }

    const food = cleanFood(req.body);
    const errors = validateFood(food);

    if (errors.length) {
      return res.status(400).json({ message: 'Du lieu khong hop le', errors });
    }

    if (food.price === undefined || food.quantity === undefined) {
      return res.status(400).json({
        message: 'price va quantity la bat buoc'
      });
    }

    const db = getDB();
    const result = await db.collection('foods').insertOne({
      ...food,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const created = await db.collection('foods')
      .findOne({ _id: result.insertedId });

    res.status(201).json(created);
  } catch (error) {
    handleError(res, error);
  }
}

// PUT /api/foods/:id
async function updateFood(req, res) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'ID khong hop le' });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Du lieu khong hop le' });
    }

    const food = cleanFood(req.body);
    const errors = validateFood(food, true);

    if (errors.length) {
      return res.status(400).json({ message: 'Du lieu khong hop le', errors });
    }

    if (Object.keys(food).length === 0) {
      return res.status(400).json({ message: 'Khong co truong nao de cap nhat' });
    }

    const db = getDB();
    const result = await db.collection('foods').updateOne(
      { _id: id },
      { $set: { ...food, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    const updated = await db.collection('foods').findOne({ _id: id });
    res.json(updated);
  } catch (error) {
    handleError(res, error);
  }
}

// DELETE /api/foods/:id
async function deleteFood(req, res) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'ID khong hop le' });
    }

    const result = await getDB().collection('foods').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Khong tim thay mon an' });
    }

    res.json({ message: 'Xoa mon an thanh cong' });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood
};
