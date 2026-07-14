(function() {
  // ---------- DATA ----------
  let orders = [];
  let products = [];
  let customers = [];
  let activities = [];
  let nextId = 1001;
  let darkMode = false;

  // DOM refs
  const ordersTbody = document.getElementById('ordersTableBody');
  const productsTbody = document.getElementById('productsTableBody');
  const customersTbody = document.getElementById('customersTableBody');
  const dashRecent = document.getElementById('dashRecentOrders');
  const dashActivity = document.getElementById('dashActivity');

  // Stats elements
  const dashTotal = document.getElementById('dashTotalOrders');
  const dashImports = document.getElementById('dashImports');
  const dashExports = document.getElementById('dashExports');
  const dashInTransit = document.getElementById('dashInTransit');
  const dashCustomers = document.getElementById('dashCustomers');
  const dashRevenue = document.getElementById('dashRevenue');

  // Form
  const form = document.getElementById('addOrderForm');
  const productName = document.getElementById('productName');
  const productCategory = document.getElementById('productCategory');
  const productQty = document.getElementById('productQty');
  const productType = document.getElementById('productType');
  const productStatus = document.getElementById('productStatus');
  const productImage = document.getElementById('productImage');
  const customerName = document.getElementById('customerName');
  const customerEmail = document.getElementById('customerEmail');
  const customerPhone = document.getElementById('customerPhone');
  const customerAddress = document.getElementById('customerAddress');

  // Buttons
  const exportBtn = document.getElementById('exportCsvBtn');
  const sampleBtn = document.getElementById('sampleDataBtn');
  const resetBtn = document.getElementById('resetBtn');
  const addProductBtn = document.getElementById('addProductBtn');

  // ---------- HELPERS ----------
  function generateId() { return nextId++; }

  function generatePlaceholderImage(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    const colors = ['#1a2f3f','#2d6b4f','#b8962e','#8a6a4a','#5a4a3a','#6b4f3c'];
    const idx = (name||'A').length % colors.length;
    ctx.fillStyle = colors[idx];
    ctx.fillRect(0,0,80,80);
    ctx.fillStyle = '#f5efe8';
    ctx.font = 'bold 36px "Playfair Display", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((name||'?').charAt(0).toUpperCase(), 40, 42);
    return canvas.toDataURL('image/png');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function getStatusClass(status) {
    const map = { 'In Transit':'in-transit','Warehouse':'warehouse','Delivered':'delivered','Customs':'customs','Shipped':'shipped' };
    return map[status] || 'in-transit';
  }

  function formatTime(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return date.toLocaleDateString();
  }

  function addActivity(type, title, desc) {
    activities.unshift({ id: Date.now(), type, title, desc, time: new Date() });
    if (activities.length > 50) activities.pop();
    renderAll();
  }

  // ---------- RENDER ALL ----------
  function renderAll() {
    renderOrders();
    renderProducts();
    renderCustomers();
    renderDashboard();
  }

  function renderOrders() {
    if (orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#8a7a6a;">No orders</td></tr>`;
      return;
    }
    let html = '';
    orders.forEach(o => {
      const typeLabel = o.type === 'import' ? 'Import' : 'Export';
      const statusClass = getStatusClass(o.status);
      const img = o.image || generatePlaceholderImage(o.name);
      html += `
        <tr>
          <td><div style="display:flex; align-items:center; gap:10px;">
            <img src="${img}" style="width:36px; height:36px; border-radius:10px; object-fit:cover; background:#f0ebe6;">
            <div><div style="font-weight:600; color:#1a2f3f;">${escapeHtml(o.name)}</div><div style="font-size:0.7rem; color:#8a7a6a;">${escapeHtml(o.category)}</div></div>
          </div></td>
          <td><div style="font-weight:500;">${escapeHtml(o.customerName)}</div><div style="font-size:0.65rem; color:#8a7a6a;">${escapeHtml(o.customerEmail)}</div></td>
          <td><span class="type-badge ${o.type}">${typeLabel}</span></td>
          <td>${o.quantity}</td>
          <td><span class="status-badge ${statusClass}">${escapeHtml(o.status)}</span></td>
          <td><button class="btn btn-outline" style="padding:4px 12px; font-size:0.7rem;" data-action="delete" data-id="${o.id}"><i class="fas fa-trash"></i></button></td>
        </tr>
      `;
    });
    ordersTbody.innerHTML = html;
    // Attach delete events
    ordersTbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        deleteOrder(id);
      });
    });
  }

  function renderProducts() {
    // Derive products from orders (unique product names)
    const productMap = {};
    orders.forEach(o => {
      if (!productMap[o.name]) {
        productMap[o.name] = { name: o.name, category: o.category, type: o.type, totalQty: 0 };
      }
      productMap[o.name].totalQty += o.quantity;
    });
    products = Object.values(productMap);
    if (products.length === 0) {
      productsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#8a7a6a;">No products</td></tr>`;
      return;
    }
    let html = '';
    products.forEach(p => {
      html += `<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.category)}</td><td>${p.totalQty}</td><td><span class="type-badge ${p.type}">${p.type === 'import' ? 'Import' : 'Export'}</span></td></tr>`;
    });
    productsTbody.innerHTML = html;
  }

  function renderCustomers() {
    const custMap = {};
    orders.forEach(o => {
      if (!custMap[o.customerEmail]) {
        custMap[o.customerEmail] = { name: o.customerName, email: o.customerEmail, phone: o.customerPhone, orders: 0 };
      }
      custMap[o.customerEmail].orders++;
    });
    customers = Object.values(custMap);
    if (customers.length === 0) {
      customersTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#8a7a6a;">No customers</td></tr>`;
      return;
    }
    let html = '';
    customers.forEach(c => {
      html += `<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.phone)}</td><td>${c.orders}</td></tr>`;
    });
    customersTbody.innerHTML = html;
  }

  function renderDashboard() {
    const total = orders.length;
    const imports = orders.filter(o => o.type === 'import').length;
    const exports = orders.filter(o => o.type === 'export').length;
    const inTransit = orders.filter(o => ['In Transit','Shipped','Customs'].includes(o.status)).length;
    const uniqueCust = new Set(orders.map(o => o.customerEmail)).size;
    const revenue = orders.reduce((sum, o) => sum + (o.quantity * (o.type === 'import' ? 10 : 15)), 0); // mock

    dashTotal.textContent = total;
    dashImports.textContent = imports;
    dashExports.textContent = exports;
    dashInTransit.textContent = inTransit;
    dashCustomers.textContent = uniqueCust;
    dashRevenue.textContent = '$' + revenue.toLocaleString();

    // Recent orders (last 5)
    const recent = orders.slice(-5).reverse();
    if (recent.length === 0) {
      dashRecent.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#8a7a6a;">No orders</td></tr>`;
    } else {
      let html = '';
      recent.forEach(o => {
        html += `<tr><td>${escapeHtml(o.name)}</td><td>${escapeHtml(o.customerName)}</td><td><span class="status-badge ${getStatusClass(o.status)}">${escapeHtml(o.status)}</span></td></tr>`;
      });
      dashRecent.innerHTML = html;
    }

    // Activity feed
    if (activities.length === 0) {
      dashActivity.innerHTML = `<div style="text-align:center; padding:20px; color:#8a7a6a;">No activity</div>`;
    } else {
      let html = '';
      activities.slice(0, 8).forEach(a => {
        const icon = a.type === 'import' ? 'fa-arrow-down' : a.type === 'export' ? 'fa-arrow-up' : 'fa-bell';
        const cls = a.type === 'import' ? 'import' : a.type === 'export' ? 'export' : 'system';
        html += `
          <div style="display:flex; gap:12px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.03);">
            <div style="width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:${a.type === 'import' ? '#d4edda' : a.type === 'export' ? '#f5e6d3' : '#e3eef9'}; color:${a.type === 'import' ? '#1a5a3a' : a.type === 'export' ? '#8a5a3a' : '#2a5a7a'};">
              <i class="fas ${icon}"></i>
            </div>
            <div style="flex:1;"><div style="font-weight:500; font-size:0.85rem;">${escapeHtml(a.title)}</div><div style="font-size:0.75rem; color:#5a4a3a;">${escapeHtml(a.desc)}</div><div style="font-size:0.65rem; color:#aaa;">${formatTime(a.time)}</div></div>
          </div>
        `;
      });
      dashActivity.innerHTML = html;
    }
  }

  // ---------- CRUD ----------
  function addOrder(name, category, quantity, type, status, image, customer) {
    if (!name.trim() || !category.trim() || quantity <= 0) { alert('Fill product fields'); return false; }
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.address.trim()) { alert('Fill customer details'); return false; }
    const order = {
      id: generateId(),
      name: name.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      type: type || 'import',
      status: status || 'In Transit',
      image: image || null,
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim(),
      customerPhone: customer.phone.trim(),
      customerAddress: customer.address.trim(),
      createdAt: new Date()
    };
    orders.push(order);
    addActivity(type, `${type === 'import' ? 'Import' : 'Export'} Registered`, `${name} (${quantity}) for ${customer.name}`);
    renderAll();
    return true;
  }

  function deleteOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (confirm(`Remove order for ${order.name}?`)) {
      orders = orders.filter(o => o.id !== id);
      addActivity('system', 'Order Removed', `${order.name} (${order.customerName})`);
      renderAll();
    }
  }

  // ---------- SAMPLE DATA ----------
  function loadSampleData() {
    const sample = [
      { name: 'Organic Coffee', category: 'Food', qty: 500, type: 'import', status: 'In Transit', cust: { name: 'Emily Chen', email: 'emily@cafe.com', phone: '+1 555 123 456', address: '120 Roastery Ln, Seattle' } },
      { name: 'Olive Oil', category: 'Food', qty: 200, type: 'import', status: 'Warehouse', cust: { name: 'Marco Rossi', email: 'marco@italy.it', phone: '+39 333 987 654', address: 'Via Roma 12, Tuscany' } },
      { name: 'Smartphones', category: 'Electronics', qty: 150, type: 'export', status: 'Customs', cust: { name: 'David Kim', email: 'david@tech.kr', phone: '+82 10 1234 5678', address: 'Gangnam, Seoul' } },
      { name: 'Cotton Textiles', category: 'Textile', qty: 800, type: 'export', status: 'Delivered', cust: { name: 'Sarah Johnson', email: 'sarah@fashion.uk', phone: '+44 20 7946 0123', address: 'Oxford St 45, London' } },
      { name: 'Aluminum Sheets', category: 'Metals', qty: 1200, type: 'import', status: 'Shipped', cust: { name: 'Carlos Mendez', email: 'carlos@industrials.mx', phone: '+52 55 1234 5678', address: 'Monterrey, Mexico' } },
      { name: 'Medical Supplies', category: 'Healthcare', qty: 350, type: 'export', status: 'In Transit', cust: { name: 'Dr. Anita Singh', email: 'anita@health.in', phone: '+91 98765 43210', address: 'Mumbai, India' } },
    ];
    sample.forEach(s => {
      const img = generatePlaceholderImage(s.name);
      orders.push({
        id: generateId(),
        name: s.name,
        category: s.category,
        quantity: s.qty,
        type: s.type,
        status: s.status,
        image: img,
        customerName: s.cust.name,
        customerEmail: s.cust.email,
        customerPhone: s.cust.phone,
        customerAddress: s.cust.address,
        createdAt: new Date()
      });
      addActivity(s.type, `${s.type === 'import' ? 'Import' : 'Export'} Loaded`, `${s.name} (${s.qty}) for ${s.cust.name}`);
    });
    renderAll();
  }

  // ---------- EXPORT CSV ----------
  function exportCsv() {
    if (orders.length === 0) { alert('No data'); return; }
    const headers = ['ID','Product','Category','Qty','Type','Status','Customer','Email','Phone','Address','Date'];
    const rows = orders.map(o => [o.id, o.name, o.category, o.quantity, o.type, o.status, o.customerName, o.customerEmail, o.customerPhone, o.customerAddress, o.createdAt?.toLocaleDateString() || '']);
    let csv = headers.join(',') + '\n';
    rows.forEach(row => { csv += row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tradeflow_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    addActivity('system', 'Export', 'CSV exported');
  }

  // ---------- RESET ----------
  function resetSystem() {
    if (orders.length === 0 && activities.length === 0) return;
    if (confirm('Reset all data?')) {
      orders = []; activities = []; nextId = 1001;
      renderAll();
      addActivity('system', 'Reset', 'All data cleared');
    }
  }

  // ---------- NAVIGATION ----------
  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.nav-links a[data-page="${page}"]`)?.classList.add('active');
  }

  // ---------- SETTINGS TOGGLES ----------
  function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    toggle.classList.toggle('active');
    darkMode = !darkMode;
    document.body.style.background = darkMode ? '#1a1a1a' : '#f5f0eb';
    document.body.style.color = darkMode ? '#e0d6cc' : 'inherit';
    document.querySelectorAll('.panel, .stat-card, .navbar, .footer').forEach(el => {
      el.style.background = darkMode ? 'rgba(30,30,30,0.85)' : '';
      el.style.color = darkMode ? '#e0d6cc' : '';
    });
  }

  function toggleEmail() {
    document.getElementById('emailToggle').classList.toggle('active');
    addActivity('system', 'Notification', 'Email notifications ' + (document.getElementById('emailToggle').classList.contains('active') ? 'enabled' : 'disabled'));
  }

  // ---------- ADD PRODUCT (mock) ----------
  function addProduct() {
    const name = prompt('Product name:');
    if (!name) return;
    const cat = prompt('Category:');
    if (!cat) return;
    const type = confirm('Import? (Cancel for Export)') ? 'import' : 'export';
    alert(`Product "${name}" added to inventory (simulated). It will appear when orders are placed.`);
    renderAll();
  }

  // ---------- EVENT LISTENERS ----------
  // Navigation clicks
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigateTo(this.dataset.page);
    });
  });

  // Form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = productName.value;
    const category = productCategory.value;
    const qty = parseInt(productQty.value, 10);
    const type = productType.value;
    const status = productStatus.value;
    const customer = {
      name: customerName.value,
      email: customerEmail.value,
      phone: customerPhone.value,
      address: customerAddress.value
    };
    let image = null;
    if (productImage.files && productImage.files[0]) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        image = ev.target.result;
        const success = addOrder(name, category, qty, type, status, image, customer);
        if (success) { form.reset(); productImage.value = ''; }
      };
      reader.readAsDataURL(productImage.files[0]);
    } else {
      const success = addOrder(name, category, qty, type, status, null, customer);
      if (success) { form.reset(); productImage.value = ''; }
    }
  });

  exportBtn.addEventListener('click', exportCsv);
  sampleBtn.addEventListener('click', loadSampleData);
  resetBtn.addEventListener('click', resetSystem);
  addProductBtn.addEventListener('click', addProduct);

  // Initial load
  loadSampleData();

  // Expose to global for inline onclick
  window.navigateTo = navigateTo;
  window.toggleDarkMode = toggleDarkMode;
  window.toggleEmail = toggleEmail;
})();