
import { useEffect, useState } from 'react';
import api from './api';
import './App.css';

const images = {
  'Pho bo': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=700&q=80',
  'Banh mi': 'https://images.unsplash.com/photo-1600454309261-3dc9b7597637?auto=format&fit=crop&w=700&q=80',
  'Com tam': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',
  default: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
};

const emptyFood = {
  foodId: '',
  name: '',
  category: '',
  cuisine: 'Viet Nam',
  ingredients: '',
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
};

function getImage(food) {
  if (food.imageUrl) return food.imageUrl;
  if (food.name?.toLowerCase().includes('pho')) return images['Pho bo'];
  if (food.name?.toLowerCase().includes('banh mi')) return images['Banh mi'];
  if (food.name?.toLowerCase().includes('com tam')) return images['Com tam'];
  return images.default;
}

function App() {
  const [foods, setFoods] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [activePage, setActivePage] = useState('foods');
  const [stockHistory, setStockHistory] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockFoodId, setStockFoodId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [stockNote, setStockNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyFood);
  const [saving, setSaving] = useState(false);

  async function loadFoods(search = '') {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/foods', {
        params: search.trim() ? { q: search.trim() } : {},
      });
      const data = response.data;
      setFoods(Array.isArray(data) ? data : data.foods || data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không tải được món ăn. Hãy kiểm tra backend và cấu hình API.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  useEffect(() => {
    if (activePage === 'stock') {
      loadStockHistory();
    }
  }, [activePage]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyFood);
    setShowForm(true);
    setNotice('');
  }

  function openEditForm(food) {
    setEditingId(food._id);
    setForm({
      ...emptyFood,
      ...food,
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(', ')
        : food.ingredients || '',
      price: String(food.price ?? ''),
      quantity: String(food.quantity ?? ''),
    });
    setShowForm(true);
    setNotice('');
  }

  function changeField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setNotice('');

      const payload = {
        ...form,
        foodId: form.foodId.trim(),
        name: form.name.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        ingredients: form.ingredients
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await api.put(`/foods/${editingId}`, payload);
        setNotice('Cập nhật món ăn thành công!');
      } else {
        await api.post('/foods', payload);
        setNotice('Thêm món ăn thành công!');
      }

      setShowForm(false);
      await loadFoods(keyword);
    } catch (err) {
      setNotice(
        err.response?.data?.message ||
        'Lưu món ăn thất bại. Vui lòng kiểm tra dữ liệu.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteFood(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${food.name}" không?`)) return;

    try {
      await api.delete(`/foods/${food._id}`);
      setNotice('Đã xóa món ăn thành công!');
      await loadFoods(keyword);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Xóa món ăn thất bại.');
    }
  }


  async function loadStockHistory() {
    try {
      setStockLoading(true);
      const response = await api.get('/stock/history');
      setStockHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Khong tai duoc lich su kho.');
    } finally {
      setStockLoading(false);
    }
  }

  async function submitStockEntry(event) {
    event.preventDefault();

    const amount = Number(stockQuantity);
    if (!stockFoodId) {
      setNotice('Vui long chon mon an.');
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setNotice('So luong nhap phai la so nguyen lon hon 0.');
      return;
    }

    try {
      setStockSaving(true);
      setNotice('');

      const response = await api.post('/stock/receive', {
        foodMongoId: stockFoodId,
        quantity: amount,
        note: stockNote.trim()
      });

      setNotice(
        `Nhap kho thanh cong: ${response.data.food.name}, ton kho moi ${response.data.food.quantity}.`
      );
      setStockQuantity('1');
      setStockNote('');

      await Promise.all([
        loadFoods(keyword),
        loadStockHistory()
      ]);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Nhap kho that bai.');
    } finally {
      setStockSaving(false);
    }
  }

  const totalQuantity = foods.reduce(
    (sum, food) => sum + Number(food.quantity || 0),
    0
  );

  const totalValue = foods.reduce(
    (sum, food) => sum + Number(food.price || 0) * Number(food.quantity || 0),
    0
  );

  const lowStockFoods = foods.filter(
    (food) => Number(food.quantity || 0) > 0 &&
      Number(food.quantity || 0) <= 5
  );

  const outOfStockFoods = foods.filter(
    (food) => Number(food.quantity || 0) <= 0
  );

  const displayedFoods = foods.filter((food) => {
    const quantity = Number(food.quantity || 0);

    if (stockFilter === 'low' && !(quantity > 0 && quantity <= 5)) {
      return false;
    }
    if (stockFilter === 'out' && quantity > 0) {
      return false;
    }
    if (categoryFilter !== 'all' && food.category !== categoryFilter) {
      return false;
    }
    if (cuisineFilter !== 'all' && food.cuisine !== cuisineFilter) {
      return false;
    }
    return true;
  });

  const categories = [
    ...new Set(foods.map((food) => food.category).filter(Boolean)),
  ];

  const cuisines = [
    ...new Set(foods.map((food) => food.cuisine).filter(Boolean)),
  ];

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('vi-VN') + ' đ';
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🍜</div>
          <div>
            <h2>Food<span>Hub</span></h2>
            <p>QUẢN LÝ MÓN ĂN</p>
          </div>
        </div>

        <div className="side-label">MENU CHÍNH</div>
        <button
          type="button"
          className={`side-item ${activePage === 'foods' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('foods');
            setStockFilter('all');
            document.querySelector('.menu-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ▦ <span>Quản lý món ăn</span>
        </button>

        <button
          type="button"
          className={`side-item ${activePage === 'stock' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('stock');
            setStockFilter('all');
            document.querySelector('.menu-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ◷ <span>Kho món ăn</span>
        </button>

        <button
          type="button"
          className={`side-item ${activePage === 'stats' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('stats');
            document.querySelector('.stats')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ▤ <span>Thống kê</span>
        </button>

        <div className="sidebar-bottom">
          <div className="chef-icon">👨‍🍳</div>
          <strong>FoodHub Admin</strong>
          <p>Hệ thống quản lý món ăn</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Trang chủ / Quản lý</p>
            <h1>{activePage === 'stock' ? 'Kho món ăn' : activePage === 'stats' ? 'Thống kê kho' : 'Quản lý món ăn'}</h1>
          </div>
          <div className="admin-badge">
            <span>●</span> Đang hoạt động
          </div>
        </header>

        <section className="welcome">
          <div className="welcome-content">
            <span className="welcome-tag">FOOD MANAGEMENT SYSTEM</span>
            <h2>Xin chào, quản trị viên! 👋</h2>
            <p>Quản lý thực đơn của bạn nhanh chóng và dễ dàng.</p>
            <button className="welcome-button" onClick={openAddForm}>
              + Thêm món ăn mới
            </button>
          </div>
          <div className="welcome-emoji">🍲</div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon orange">🍽️</div>
            <div><p>Tổng số món ăn</p><h3>{foods.length}</h3><small>Món ăn trong danh sách</small></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📦</div>
            <div><p>Tổng số lượng</p><h3>{totalQuantity}</h3><small>Sản phẩm hiện có</small></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">💰</div>
            <div><p>Giá trị tồn kho</p><h3>{formatMoney(totalValue)}</h3><small>Giá × số lượng</small></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stock-yellow">⚠️</div>
            <div><p>Sắp hết hàng</p><h3>{lowStockFoods.length}</h3><small>Còn từ 1 đến 5</small></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stock-red">🚨</div>
            <div><p>Hết hàng</p><h3>{outOfStockFoods.length}</h3><small>Số lượng bằng 0</small></div>
          </div>
        </section>


        {activePage === 'stock' && (
          <section className="stock-management">
            <div className="stock-panel">
              <div className="stock-panel-heading">
                <div>
                  <h2>📦 Nhập kho món ăn</h2>
                  <p>Nhập thêm số lượng vào tồn kho hiện tại.</p>
                </div>
              </div>

              {foods.length === 0 ? (
                <p>Chưa có món ăn. Hãy thêm món ăn trước khi nhập kho.</p>
              ) : (
                <form className="stock-form" onSubmit={submitStockEntry}>
                  <label>
                    Chọn món ăn
                    <select
                      value={stockFoodId}
                      onChange={(event) => setStockFoodId(event.target.value)}
                      required
                    >
                      <option value="">-- Chọn món ăn --</option>
                      {foods.map((food) => (
                        <option key={food._id} value={food._id}>
                          {food.foodId} - {food.name} (Tồn: {food.quantity ?? 0})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Số lượng nhập thêm
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={stockQuantity}
                      onChange={(event) => setStockQuantity(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Ghi chú
                    <input
                      type="text"
                      maxLength="500"
                      value={stockNote}
                      onChange={(event) => setStockNote(event.target.value)}
                      placeholder="Ví dụ: Nhập hàng từ nhà cung cấp"
                    />
                  </label>

                  <button className="primary-button" type="submit" disabled={stockSaving}>
                    {stockSaving ? 'Đang nhập kho...' : '+ Xác nhận nhập kho'}
                  </button>
                </form>
              )}
            </div>

            <div className="stock-panel">
              <div className="stock-panel-heading">
                <div>
                  <h2>🧾 Lịch sử nhập kho</h2>
                  <p>Tối đa 200 lần nhập gần nhất.</p>
                </div>
                <button
                  type="button"
                  className="reset-button"
                  onClick={loadStockHistory}
                  disabled={stockLoading}
                >
                  {stockLoading ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>

              {stockHistory.length === 0 ? (
                <div className="stock-empty">
                  {stockLoading ? 'Đang tải lịch sử...' : 'Chưa có lịch sử nhập kho.'}
                </div>
              ) : (
                <div className="stock-table-wrap">
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Mã món</th>
                        <th>Tên món</th>
                        <th>Trước nhập</th>
                        <th>Nhập thêm</th>
                        <th>Sau nhập</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHistory.map((item) => (
                        <tr key={item._id}>
                          <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</td>
                          <td>{item.foodId || '-'}</td>
                          <td>{item.foodName || '-'}</td>
                          <td>{item.quantityBefore}</td>
                          <td className="stock-added">+{item.quantityAdded}</td>
                          <td>{item.quantityAfter}</td>
                          <td>{item.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activePage !== 'stock' && (
        <section className="menu-section">
          <div className="section-heading">
            <div>
              <h2>{activePage === 'stock' ? 'Quản lý kho món ăn' : 'Danh sách món ăn'}</h2>
              <p>{activePage === 'stock' ? 'Theo dõi số lượng và trạng thái tồn kho.' : 'Thêm, tìm kiếm, cập nhật và xóa món ăn.'}</p>
            </div>
            <button className="primary-button" onClick={openAddForm}>
              + Thêm món ăn
            </button>
          </div>

          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault();
              loadFoods(keyword);
            }}
          >
            <span>⌕</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên hoặc mã món ăn..."
            />
            <button type="submit">Tìm kiếm</button>
            <button
              type="button"
              className="reset-button"
              onClick={() => {
                setKeyword('');
                loadFoods('');
              }}
            >
              Làm mới
            </button>
          </form>

          <div className="stock-filters">
            <label>
              Danh mục:
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Ẩm thực:
              <select
                value={cuisineFilter}
                onChange={(event) => setCuisineFilter(event.target.value)}
              >
                <option value="all">Tất cả ẩm thực</option>
                {cuisines.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="stock-filters">
            <span>Trạng thái kho:</span>
            <button type="button" className={stockFilter === 'all' ? 'selected' : ''} onClick={() => setStockFilter('all')}>
              Tất cả ({foods.length})
            </button>
            <button type="button" className={stockFilter === 'low' ? 'selected' : ''} onClick={() => setStockFilter('low')}>
              ⚠️ Sắp hết ({lowStockFoods.length})
            </button>
            <button type="button" className={stockFilter === 'out' ? 'selected' : ''} onClick={() => setStockFilter('out')}>
              🚨 Hết hàng ({outOfStockFoods.length})
            </button>
          </div>

          {notice && (
            <div className="notice">
              {notice}
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          {loading ? (
            <div className="empty-state"><div className="loader"></div><p>Đang tải món ăn...</p></div>
          ) : displayedFoods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🍽️</div>
              <h3>Chưa có món ăn nào</h3>
              <p>Hãy thêm món ăn mới hoặc thử từ khóa khác.</p>
              <button className="primary-button" onClick={openAddForm}>+ Thêm món ăn</button>
            </div>
          ) : (
            <div className="food-grid">
              {displayedFoods.map((food) => (
                <article className="food-card" key={food._id}>
                  <div className="food-image-wrap">
                    <img
                      src={getImage(food)}
                      alt={food.name}
                      className="food-image"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = images.default;
                      }}
                    />
                    <span className="food-category">{food.category || 'Món ăn'}</span>
                    <span className={`stock-badge ${
                      Number(food.quantity || 0) <= 0
                        ? 'out'
                        : Number(food.quantity || 0) <= 5
                          ? 'low'
                          : 'available'
                    }`}>
                      {Number(food.quantity || 0) <= 0
                        ? 'Hết hàng'
                        : Number(food.quantity || 0) <= 5
                          ? 'Sắp hết hàng'
                          : 'Còn hàng'}
                    </span>

                  </div>
                  <div className="food-info">
                    <div className="food-id">{food.foodId || 'Chưa có mã'}</div>
                    <h3>{food.name}</h3>
                    <p className="food-description">{food.description || 'Món ăn ngon, hấp dẫn.'}</p>
                    <div className="food-meta">
                      <span>📦 Còn {food.quantity ?? 0}</span>
                      <span>🌏 {food.cuisine || 'Khác'}</span>
                    </div>
                    <div className="food-card-bottom">
                      <strong>{formatMoney(food.price)}</strong>
                      <div className="card-actions">
                        <button title="Cập nhật số lượng kho" onClick={() => openEditForm(food)}>📦</button>
                        <button title="Sửa món ăn" onClick={() => openEditForm(food)}>✏️</button>
                        <button title="Xóa món ăn" onClick={() => deleteFood(food)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        )}

        <footer>© 2026 FoodHub · Hệ thống quản lý món ăn</footer>
      </main>

      {showForm && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowForm(false);
        }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>{editingId ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h2>
                <p>Nhập thông tin món ăn bên dưới.</p>
              </div>
              <button className="close-button" onClick={() => setShowForm(false)}>×</button>
            </div>

            <form className="food-form" onSubmit={submitForm}>
              <label>Mã món ăn *
                <input name="foodId" value={form.foodId} onChange={changeField} placeholder="Ví dụ: FOOD004" required />
              </label>
              <label>Tên món ăn *
                <input name="name" value={form.name} onChange={changeField} placeholder="Nhập tên món ăn" required />
              </label>
              <div className="form-row">
                <label>Danh mục
                  <input name="category" value={form.category} onChange={changeField} placeholder="Món chính" />
                </label>
                <label>Ẩm thực
                  <input name="cuisine" value={form.cuisine} onChange={changeField} placeholder="Việt Nam" />
                </label>
              </div>
              <div className="form-row">
                <label>Giá bán (VNĐ) *
                  <input name="price" type="number" min="0" value={form.price} onChange={changeField} required />
                </label>
                <label>Số lượng *
                  <input name="quantity" type="number" min="0" value={form.quantity} onChange={changeField} required />
                </label>
              </div>
              <label>Nguyên liệu
                <input name="ingredients" value={form.ingredients} onChange={changeField} placeholder="Bánh mì, thịt, rau..." />
                <small>Phân cách các nguyên liệu bằng dấu phẩy.</small>
              </label>
              <label>Đường dẫn ảnh (không bắt buộc)
                <input name="imageUrl" value={form.imageUrl} onChange={changeField} placeholder="https://..." />
              </label>
              <label>Mô tả
                <textarea name="description" value={form.description} onChange={changeField} rows="3" placeholder="Mô tả món ăn..." />
              </label>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
