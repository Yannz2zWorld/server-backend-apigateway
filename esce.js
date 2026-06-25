/* ============================================================
   YannMarket — script.js
   Full Featured: Cart, Wishlist, Checkout, Payment, Invoice
   ============================================================ */
(function () {
  'use strict';

  /* ════════════════════════════════
     CONFIG
  ════════════════════════════════ */
  const WA_NUMBER = '6285282426298';
  const PAYMENT_ACCOUNTS = {
    pakasir:     { label: 'QRIS GATEWAY', number: '', logo: '' },
    qris_backup: { label: 'QRIS BIASA',  number: 'QRIS', logo: '', img: 'https://img2.pixhost.to/images/8805/741958354_yannganteng-1782136284044.png' },
    dana:        { label: 'Dana',         number: '6285282426298', logo: '' },
  };

  /* Pakasir Payment Gateway config */
  /* Pakasir API key tidak lagi disimpan di sini — sudah dipindah
     ke server (lihat /api/pakasir-create.js & /api/pakasir-status.js)
     supaya tidak terekspos di browser. */

  /* ════════════════════════════════
     PRODUCTS DATA
  ════════════════════════════════ */
  const products = [

    {
      id: 'bot-001',
      name: 'Script Bot WA Premium',
      cat: 'bot', catLabel: 'Script Bot WA',
      price: 75000,
      icon: '',
      img: 'image/1.png',
      file: 'file/script-bot-wa-premium.zip',
      desc: 'Script bot WA premium dengan fitur AI, download media, dan 1700+ fitur premium + free update selamanya.',
      stock: 'unlimited',
      badge: 'trend',
    },
    {
      id: 'bot-002',
      name: 'Script Bot WA Jpm x Puskontak',
      cat: 'bot', catLabel: 'Script Bot WA',
      price: 10000,
      icon: '',
      img: 'image/m.png',
      file: 'file/script-bot-jpm-puskontak.zip',
      desc: 'Script bot WA Jpm x Puskontak.',
      stock: 'unlimited',
      badge: 'trend',
    },
    {
      id: 'bot-003',
      name: 'Script Auto Order Tele',
      cat: 'bot', catLabel: 'Script Bot WA',
      price: 7000,
      icon: '',
      img: 'image/8282.png',
      file: 'file/script-auto-order.zip',
      desc: 'Script Auto Order Tele.',
      stock: 'unlimited',
      badge: 'new',
    },
    {
      id: 'sewa-001',
      name: 'Pricelist Sewa Bot',
      cat: 'sewa', catLabel: 'Sewa Bot',
      price: 10000,
      icon: '',
      img: 'image/2.png',
      desc: 'Sewa bot WhatsApp siap pakai. Tanpa setting, langsung aktif.',
      stock: 'unlimited',
      badge: 'recommend',
    },
            {
      id: 'rename-001',
      name: 'Jasa Rename Sc',
      cat: 'rename', catLabel: 'SourceCode',
      price: 5000,
      icon: '',
      img: 'image/rename.png',
      desc: 'Rename esce.',
      stock: 'unlimited',
      badge: 'new',
    },
            {
      id: 'design-001',
      name: 'Jasa Design',
      cat: 'design', catLabel: 'SourceCode',
      price: 5000,
      icon: '',
      img: 'https://img2.pixhost.to/images/8796/741811549_yannganteng-1782101950062.jpg',
      desc: 'Jasa Design.',
      stock: 'unlimited',
      badge: 'new',
    },
                {
      id: 'nokos-001',
      name: 'Nokos/Nomer Kosong',
      cat: 'nokos', catLabel: 'Nomor Kosong',
      price: 5000,
      icon: '',
      img: 'https://img2.pixhost.to/images/8796/741811549_yannganteng-1782101950062.jpg',
      desc: 'Nokos adalah nomer kosong dengan otp,otp juga bisa dibilang (one time password) jadi hanya bisa dipakai 1x.',
      stock: '1234',
      badge: 'new',
    },
  ];

  /* ════════════════════════════════
     STATE
  ════════════════════════════════ */
  let cart     = JSON.parse(localStorage.getItem('ym_cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('ym_wishlist') || '[]');
  let activeFilter = 'all';
  let activeSort   = 'default';
  let searchQuery  = '';
  let checkoutData = {};
  let countdownInterval = null;
  let pendingOrder  = JSON.parse(localStorage.getItem('ym_pending') || 'null');
  let users         = JSON.parse(localStorage.getItem('ym_users') || '[]');
  let currentUser   = JSON.parse(localStorage.getItem('ym_session') || 'null');

  /* ════════════════════════════════
     HELPERS
  ════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const fmt = n => 'Rp ' + n.toLocaleString('id-ID');
  const genOrderId = () => {
  const chars = '0123456789';
  let id = 'YM';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};
  const genDate = () => new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

  function saveCart()     { localStorage.setItem('ym_cart', JSON.stringify(cart)); }
  function saveWishlist() { localStorage.setItem('ym_wishlist', JSON.stringify(wishlist)); }
  function savePending()  { localStorage.setItem('ym_pending', JSON.stringify(pendingOrder)); }
  function saveUsers()    { localStorage.setItem('ym_users', JSON.stringify(users)); }
  function saveSession()  { localStorage.setItem('ym_session', JSON.stringify(currentUser)); }

  function showToast(icon, msg, dur = 3000) {
    const tc = $('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    tc.appendChild(t);
    setTimeout(() => {
      t.classList.add('removing');
      setTimeout(() => t.remove(), 300);
    }, dur);
  }

  function openOverlay(html) {
    const ov = $('overlay');
    $('modalWrap').innerHTML = html;
    ov.classList.add('active');
    ov.onclick = e => { if (e.target === ov) closeOverlay(); };
  }
  function closeOverlay() {
    $('overlay').classList.remove('active');
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  }

  function openWA(msg) { window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank'); }

  /* ════════════════════════════════
     AUTH — LOGIN & DAFTAR (username/password)
     Disimpan di localStorage browser (tanpa backend).
  ════════════════════════════════ */
  function updateAccountUI() {
    const label = $('accountNavLabel');
    if (!label) return;
    if (currentUser) {
      label.style.display = 'inline';
      label.textContent = currentUser.username;
    } else {
      label.style.display = 'none';
      label.textContent = '';
    }
  }

  function showAuthModal(mode = 'login') {
    function buildHTML(activeMode) {
      return `
        <div class="checkout-modal" id="authModal">
          <div class="checkout-header">
            <h3>👤 Akun YannMarket</h3>
            <button class="modal-close-btn" id="authClose">✕</button>
          </div>
          <div class="checkout-body">
            <div style="display:flex;gap:8px;margin-bottom:4px">
              <button class="btn ${activeMode === 'login' ? 'btn-primary' : 'btn-outline'} btn-full" id="tabLogin">Login</button>
              <button class="btn ${activeMode === 'daftar' ? 'btn-primary' : 'btn-outline'} btn-full" id="tabDaftar">Daftar</button>
            </div>
            <div>
              <label style="font-size:12px;color:var(--muted2);display:block;margin-bottom:6px">Username</label>
              <input type="text" class="buyer-input" id="authUsername" placeholder="Masukkan username" autocomplete="username">
            </div>
            <div>
              <label style="font-size:12px;color:var(--muted2);display:block;margin-bottom:6px">Password</label>
              <input type="password" class="buyer-input" id="authPassword" placeholder="Masukkan password" autocomplete="${activeMode === 'login' ? 'current-password' : 'new-password'}">
            </div>
            <button class="btn btn-primary btn-full" id="authSubmit">${activeMode === 'login' ? 'Login' : 'Daftar'}</button>
          </div>
        </div>
      `;
    }

    function render(activeMode) {
      openOverlay(buildHTML(activeMode));
      $('authClose').onclick = closeOverlay;
      $('tabLogin').onclick = () => render('login');
      $('tabDaftar').onclick = () => render('daftar');

      $('authSubmit').onclick = () => {
        const username = $('authUsername').value.trim();
        const password = $('authPassword').value;

        if (!username || !password) {
          showToast('⚠️', 'Username & password wajib diisi!');
          return;
        }

        if (activeMode === 'daftar') {
          const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
          if (exists) {
            showToast('⚠️', 'Username sudah dipakai, pilih yang lain.');
            return;
          }
          if (password.length < 4) {
            showToast('⚠️', 'Password minimal 4 karakter.');
            return;
          }
          users.push({ username, password });
          saveUsers();
          currentUser = { username };
          saveSession();
          updateAccountUI();
          showToast('✅', `Berhasil daftar! Selamat datang, ${username}.`);
          closeOverlay();
        } else {
          const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
          if (!found) {
            showToast('⚠️', 'Username atau password salah.');
            return;
          }
          currentUser = { username: found.username };
          saveSession();
          updateAccountUI();
          showToast('✅', `Selamat datang kembali, ${found.username}!`);
          closeOverlay();
        }
      };
    }

    render(mode);
  }

  function showAccountModal() {
    openOverlay(`
      <div class="checkout-modal">
        <div class="checkout-header">
          <h3>👤 ${currentUser.username}</h3>
          <button class="modal-close-btn" id="authClose">✕</button>
        </div>
        <div class="checkout-body">
          <p style="font-size:13px;color:var(--muted2)">Kamu login sebagai <b style="color:var(--white)">${currentUser.username}</b>.</p>
          <button class="btn btn-outline btn-full" id="logoutBtn">Logout</button>
        </div>
      </div>
    `);
    $('authClose').onclick = closeOverlay;
    $('logoutBtn').onclick = () => {
      currentUser = null;
      saveSession();
      updateAccountUI();
      showToast('👋', 'Berhasil logout.');
      closeOverlay();
    };
  }

  function openAccount() {
    if (currentUser) showAccountModal();
    else showAuthModal('login');
  }

  /* ════════════════════════════════
     LOADER
  ════════════════════════════════ */
  window.addEventListener('load', () => {
    setTimeout(() => $('loader').classList.add('hide'), 900);
  });

  /* ════════════════════════════════
     NAVBAR SCROLL & HAMBURGER
  ════════════════════════════════ */
  const navbar = $('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    $('backTop').classList.toggle('visible', window.scrollY > 400);
  });

  $('hamburger').addEventListener('click', function () {
    this.classList.toggle('open');
    $('navLinks').classList.toggle('open');
  });

  /* Nav links */
  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.scroll;
      if (id === 'hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else {
        const sec = document.getElementById(id);
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      $('hamburger').classList.remove('open');
      $('navLinks').classList.remove('open');
    });
  });

  $('backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ════════════════════════════════
     WA BUTTONS
  ════════════════════════════════ */
  const defaultWaMsg = 'Halo Admin YannMarket! Saya ingin tanya-tanya tentang produk yang tersedia.';
  $('heroWaBtn').onclick   = () => openWA(defaultWaMsg);
  $('kontakWaBtn').onclick = () => openWA(defaultWaMsg);
  $('floatWa').onclick     = () => openWA(defaultWaMsg);
  $('footerWa').onclick    = () => openWA(defaultWaMsg);

  /* Category links in footer */
  document.querySelectorAll('[data-cat-link]').forEach(el => {
    el.addEventListener('click', () => {
      const cat = el.dataset.catLink;
      activeFilter = cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
      renderProducts();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ════════════════════════════════
     PRODUCT GRID
  ════════════════════════════════ */
  function getFiltered() {
    let list = [...products];
    if (activeFilter !== 'all') list = list.filter(p => p.cat === activeFilter);
    if (searchQuery) list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.desc.toLowerCase().includes(searchQuery) ||
      p.catLabel.toLowerCase().includes(searchQuery)
    );
    if (activeSort === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (activeSort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (activeSort === 'name-asc')   list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderProducts() {
    const grid = $('productGrid');
    const list = getFiltered();
    $('noResults').style.display = list.length === 0 ? 'block' : 'none';
    grid.innerHTML = '';
    list.forEach((p, i) => {
      const inWish = wishlist.includes(p.id);
      const stockClass = p.stock === 'unlimited' ? '' : p.stock < 5 ? 'out' : p.stock < 20 ? 'low' : '';
const stockText  = p.stock === 'unlimited' ? 'Stok: ∞' : p.stock < 5 ? '⚠ Hampir habis' : p.stock < 20 ? `Sisa ${p.stock}` : `Stok: ${p.stock}`;
      const card = document.createElement('div');
      card.className = 'product-card reveal-up';
      card.style.transitionDelay = (i * 0.04) + 's';
      card.innerHTML = `
        <div class="card-badge-wrap">
          ${p.badge === 'hot'       ? '<span class="card-badge badge-hot">Hot</span>'             : ''}
${p.badge === 'new'       ? '<span class="card-badge badge-new">New</span>'             : ''}
${p.badge === 'trend'     ? '<span class="card-badge badge-trend">Trend</span>'         : ''}
${p.badge === 'recommend' ? '<span class="card-badge badge-recommend">Recommend</span>' : ''}
</div>

        <button class="card-wishlist ${inWish ? 'active' : ''}" data-id="${p.id}" title="Wishlist">
          <svg viewBox="0 0 24 24" fill="${inWish ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <div class="card-img-wrap">
          ${p.img
            ? `<img src="${p.img}" alt="${p.name}" class="card-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
            : ''}
          <div class="card-emoji" ${p.img ? 'style="display:none"' : ''}>${p.icon}</div>
        </div>
        <div class="card-body">
          <div class="card-cat">${p.catLabel}</div>
          <div class="card-name">${p.name}</div>
          <div class="card-desc">${p.desc}</div>
        </div>
        <div class="card-footer">
          <div class="card-price-row">
            <div class="card-price">${fmt(p.price)}</div>
            <div class="card-stock ${stockClass}">${stockText}</div>
          </div>
          <button class="btn btn-primary btn-sm btn-full card-buy" data-id="${p.id}">Beli</button>
        </div>
      `;
      card.addEventListener('click', e => {
        if (!e.target.closest('.card-buy') && !e.target.closest('.card-wishlist')) {
          showProductDetail(p);
        }
      });
      card.querySelector('.card-buy').addEventListener('click', e => {
        e.stopPropagation();
        showCheckout(p);
      });
      card.querySelector('.card-wishlist').addEventListener('click', e => {
        e.stopPropagation();
        toggleWishlist(p.id, card.querySelector('.card-wishlist'));
      });
      grid.appendChild(card);
    });
    observeReveal();
  }

  /* ════════════════════════════════
     PRODUCT DETAIL MODAL
  ════════════════════════════════ */
  function showProductDetail(p) {
    const inWish = wishlist.includes(p.id);
    openOverlay(`
      <div class="modal">
        <div class="modal-img-wrap">
          ${p.img
            ? `<img src="${p.img}" alt="${p.name}" class="modal-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
            : ''}
          <div class="modal-emoji" ${p.img ? 'style="display:none"' : ''}>${p.icon}</div>
        </div>
        <div class="modal-body">
          <div class="modal-cat">${p.catLabel}</div>
          <div class="modal-name">${p.name}</div>
          <div class="modal-desc">${p.desc}</div>
          <div class="modal-price">${fmt(p.price)}</div>
          <span class="modal-stock"> Stok: ${p.stock === 'unlimited' ? '\u221e tersedia' : p.stock + ' tersedia'}</span>
          <div class="modal-btns">
            <button class="btn btn-primary" id="mdBuy">Beli Sekarang</button>
            <button class="btn btn-ghost" id="mdCart">+ Keranjang</button>
            <button class="btn btn-outline" id="mdWish">${inWish ? '♥ Tersimpan' : '♡ Wishlist'}</button>
          </div>
          <button class="btn btn-outline btn-full" id="mdClose" style="margin-top:4px">Tutup</button>
        </div>
      </div>
    `);
    $('mdClose').onclick = closeOverlay;
    $('mdBuy').onclick = () => { closeOverlay(); showCheckout(p); };
    $('mdCart').onclick = () => { addToCart(p, 1); closeOverlay(); };
    $('mdWish').onclick = () => {
      toggleWishlist(p.id);
      $('mdWish').textContent = wishlist.includes(p.id) ? ' Tersimpan' : '♡ Wishlist';
    };
  }

  /* ════════════════════════════════
     WISHLIST
  ════════════════════════════════ */
  function toggleWishlist(id, btn) {
    const idx = wishlist.indexOf(id);
    if (idx === -1) {
      wishlist.push(id);
      showToast('♥', 'Ditambahkan ke wishlist');
    } else {
      wishlist.splice(idx, 1);
      showToast('♡', 'Dihapus dari wishlist');
    }
    saveWishlist();
    updateWishlistBadge();
    if (btn) {
      const inWish = wishlist.includes(id);
      btn.classList.toggle('active', inWish);
      btn.querySelector('svg').setAttribute('fill', inWish ? 'currentColor' : 'none');
    }
    renderWishlistSidebar();
  }

  function updateWishlistBadge() {
    $('wishlistBadge').textContent = wishlist.length;
  }

  function renderWishlistSidebar() {
    const container = $('wishlistItems');
    if (wishlist.length === 0) {
      container.innerHTML = '<div class="cart-empty"><div class="empty-icon"></div><p>Wishlist kamu masih kosong</p></div>';
      return;
    }
    container.innerHTML = '';
    wishlist.forEach(id => {
      const p = products.find(x => x.id === id);
      if (!p) return;
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="cart-item-emoji">${p.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${fmt(p.price)}</div>
        </div>
        <button class="btn btn-primary btn-sm" style="flex-shrink:0;padding:0 12px" data-wish-buy="${p.id}">Beli</button>
        <button class="cart-item-remove" data-wish-rm="${p.id}">✕</button>
      `;
      item.querySelector('[data-wish-buy]').onclick = () => { closeWishlist(); showCheckout(p); };
      item.querySelector('[data-wish-rm]').onclick = () => toggleWishlist(id);
      container.appendChild(item);
    });
  }

  $('accountNavBtn').addEventListener('click', openAccount);
  updateAccountUI();
  $('wishlistNavBtn').addEventListener('click', openWishlist);
  $('wishlistClose').addEventListener('click', closeWishlist);

  function openWishlist() {
    renderWishlistSidebar();
    $('wishlistSidebar').classList.add('open');
    $('sidebarOverlay').classList.add('active');
  }
  function closeWishlist() {
    $('wishlistSidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('active');
  }

  /* ════════════════════════════════
     CART
  ════════════════════════════════ */
  function addToCart(p, qty = 1) {
    const existing = cart.find(i => i.id === p.id);
    if (existing) { existing.qty += qty; }
    else { cart.push({ id: p.id, qty }); }
    saveCart();
    updateCartBadge();
    renderCartSidebar();
    showToast('', `${p.name} ditambahkan ke keranjang`);
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCartSidebar();
  }

  function getCartTotal() {
    return cart.reduce((sum, i) => {
      const p = products.find(x => x.id === i.id);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    $('cartBadge').textContent = total;
  }

  function renderCartSidebar() {
    const container = $('cartItems');
    const footer    = $('cartFooter');
    if (cart.length === 0) {
      container.innerHTML = '<div class="cart-empty"><div class="empty-icon"></div><p>Keranjang masih kosong</p></div>';
      footer.innerHTML = '';
      return;
    }
    container.innerHTML = '';
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-emoji">${p.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${fmt(p.price)}</div>
          <div class="cart-item-qty">x${item.qty} = ${fmt(p.price * item.qty)}</div>
        </div>
        <button class="cart-item-remove" data-rm="${item.id}">✕</button>
      `;
      el.querySelector('[data-rm]').onclick = () => removeFromCart(item.id);
      container.appendChild(el);
    });
    footer.innerHTML = `
      <div class="cart-total"><span>Total:</span><strong>${fmt(getCartTotal())}</strong></div>
      <button class="btn btn-primary btn-full" id="cartCheckoutBtn">Checkout Semua</button>
    `;
    $('cartCheckoutBtn').onclick = () => {
      closeCart();
      showCartCheckout();
    };
  }

  $('cartNavBtn').addEventListener('click', openCart);
  $('cartClose').addEventListener('click', closeCart);
  $('sidebarOverlay').addEventListener('click', () => { closeCart(); closeWishlist(); });

  function openCart() {
    renderCartSidebar();
    $('cartSidebar').classList.add('open');
    $('sidebarOverlay').classList.add('active');
  }
  function closeCart() {
    $('cartSidebar').classList.remove('open');
    if (!$('wishlistSidebar').classList.contains('open')) {
      $('sidebarOverlay').classList.remove('active');
    }
  }

  /* ════════════════════════════════
     CHECKOUT — SINGLE PRODUCT
  ════════════════════════════════ */
  function showCheckout(p) {
    let qty = 1;
    let selectedMethod = '';

    function buildHTML() {
      const total = p.price * qty;
      return `
        <div class="checkout-modal">
          <div class="checkout-header">
            <h3>Checkout</h3>
            <button class="modal-close-btn" id="ckClose">✕</button>
          </div>
          <div class="checkout-body">
            <!-- Order Summary -->
            <div class="order-summary">
              <div class="os-emoji">${p.icon}</div>
              <div class="os-info">
                <div class="os-name">${p.name}</div>
                <div style="font-size:12px;color:var(--muted2)">${p.catLabel}</div>
                <div class="os-price">${fmt(p.price)}</div>
              </div>
            </div>
            <!-- Jumlah -->
            <div class="qty-row">
              <span class="qty-label">Jumlah</span>
              <div class="qty-ctrl">
                <button class="qty-btn" id="qtyMinus">−</button>
                <span class="qty-val" id="qtyVal">${qty}</span>
                <button class="qty-btn" id="qtyPlus">+</button>
              </div>
            </div>
            <!-- Total -->
            <div class="total-row">
              <span class="total-label">Total Pembayaran</span>
              <span class="total-value" id="ckTotal">${fmt(total)}</span>
            </div>
            <!-- Nama Pembeli -->
            <div>
              <label class="input-label">Nama Pembeli</label>
              <input type="text" class="buyer-input" id="buyerName" placeholder="Masukkan nama kamu..." value="${checkoutData.name || ''}">
            </div>
            <!-- Metode Pembayaran -->
            <div class="pay-section">
              <label>Metode Pembayaran</label>
              <div class="pay-methods">
                ${Object.entries(PAYMENT_ACCOUNTS).map(([key, m]) => `
                  <div class="pay-method ${selectedMethod === key ? 'active' : ''}" data-method="${key}">
                    <div class="pay-logo">${m.logo}</div>
                    <span>${m.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <button class="btn btn-primary btn-full" id="ckProceed">Lanjut Pembayaran →</button>
          </div>
        </div>
      `;
    }

    function render() {
      $('modalWrap').innerHTML = buildHTML();
      $('ckClose').onclick = closeOverlay;

      $('qtyMinus').onclick = () => { if (qty > 1) { qty--; updateQty(); } };
      $('qtyPlus').onclick  = () => { qty++; updateQty(); };

      document.querySelectorAll('.pay-method').forEach(el => {
        el.addEventListener('click', () => {
          selectedMethod = el.dataset.method;
          document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
          el.classList.add('active');
        });
      });

      $('ckProceed').onclick = () => {
        const name = $('buyerName').value.trim();
 if (!name) { showToast('⚠️', 'Masukkan nama pembeli dulu ya!'); return; }
        if (!selectedMethod) { showToast('⚠️', 'Pilih metode pembayaran dulu!'); return; }
        checkoutData = { name, method: selectedMethod };
        const orderId = genOrderId();
        if (selectedMethod === 'pakasir') {
          closeOverlay();
          showPakasirPayment(p, qty, name, orderId, false);
        } else {
          showPaymentScreen(p, qty, selectedMethod, name, orderId);
        }
      };
    }

    function updateQty() {
      $('qtyVal').textContent = qty;
      $('ckTotal').textContent = fmt(p.price * qty);
    }

    openOverlay(buildHTML());
    $('overlay').onclick = e => { if (e.target === $('overlay')) closeOverlay(); };
    render();
  }

  /* ════════════════════════════════
     CHECKOUT — CART
  ════════════════════════════════ */
  function showCartCheckout() {
    if (cart.length === 0) { showToast('⚠️', 'Keranjang kosong!'); return; }
    const total = getCartTotal();
    let selectedMethod = '';

    const buildHTML = () => `
      <div class="checkout-modal">
        <div class="checkout-header">
          <h3>Checkout Keranjang</h3>
          <button class="modal-close-btn" id="ckClose">✕</button>
        </div>
        <div class="checkout-body">
          ${cart.map(item => {
            const p = products.find(x => x.id === item.id);
            return p ? `
              <div class="order-summary" style="gap:8px;padding:12px">
                <span style="font-size:28px">${p.icon}</span>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:13px">${p.name}</div>
                  <div style="font-size:12px;color:var(--muted2)">x${item.qty} = ${fmt(p.price * item.qty)}</div>
                </div>
              </div>` : '';
          }).join('')}
          <div class="total-row">
            <span class="total-label">Total Semua</span>
            <span class="total-value">${fmt(total)}</span>
          </div>
          <div>
            <label class="input-label">Nama Pembeli</label>
            <input type="text" class="buyer-input" id="buyerName" placeholder="Masukkan nama kamu..." value="${checkoutData.name || ''}">
          </div>
          <div class="pay-section">
            <label>Metode Pembayaran</label>
            <div class="pay-methods">
              ${Object.entries(PAYMENT_ACCOUNTS).map(([key, m]) => `
                <div class="pay-method" data-method="${key}">
                  <div class="pay-logo">${m.logo}</div>
                  <span>${m.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <button class="btn btn-primary btn-full" id="ckProceed">Lanjut Pembayaran →</button>
        </div>
      </div>
    `;

    openOverlay(buildHTML());
    $('ckClose').onclick = closeOverlay;
    document.querySelectorAll('.pay-method').forEach(el => {
      el.addEventListener('click', () => {
        selectedMethod = el.dataset.method;
        document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('active'));
        el.classList.add('active');
      });
    });
    $('ckProceed').onclick = () => {
      const name = $('buyerName').value.trim();
      if (!name) { showToast('⚠️', 'Masukkan nama pembeli dulu ya!'); return; }
      if (!selectedMethod) { showToast('⚠️', 'Pilih metode pembayaran dulu!'); return; }
      checkoutData = { name, method: selectedMethod };
      const orderId = genOrderId();
      const fakeProduct = { name: `${cart.length} produk`, icon: '🛒', price: total };
      if (selectedMethod === 'pakasir') {
        closeOverlay();
        showPakasirPayment(fakeProduct, 1, name, orderId, true);
      } else {
        showPaymentScreen(fakeProduct, 1, selectedMethod, name, orderId, true);
      }
    };
  }

  /* ════════════════════════════════
     PAYMENT SCREEN
  ════════════════════════════════ */
  function showPaymentScreen(p, qty, methodKey, buyerName, orderId, isCart = false) {
    const method  = PAYMENT_ACCOUNTS[methodKey];
    const total   = p.price * qty;
    let timeLeft  = 30 * 60; // 30 minutes
    let uploadedFile = null;
    let uploadedDataURL = null;

    pendingOrder = { orderId, product: p.name, qty, total, method: method.label, buyer: buyerName, date: genDate() };
    savePending();

    function buildHTML() {
      return `
        <div class="checkout-modal" id="payModal">
          <div class="checkout-header">
            <h3>${method.logo} Pembayaran ${method.label}</h3>
            <button class="modal-close-btn" id="payClose">✕</button>
          </div>
          <div class="checkout-body">
            <!-- Order ID -->
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted2)">
              <span>Order ID</span><span style="font-weight:700;color:var(--white)">#${orderId}</span>
            </div>
            <!-- QR / Nomor -->
            <div class="qr-wrap">
              ${method.img
                ? `<img src="${method.img}" alt="${method.label}" style="width:200px;height:200px;object-fit:contain;">`
                : `<div class="qr-placeholder"><div class="qr-icon">${method.logo}</div><p>Transfer ke ${method.label}</p></div>`
              }
            </div>
            <!-- Nomor Pembayaran -->
            ${method.img ? '' : `
            <div class="pay-number-wrap">
              <div>
                <div style="font-size:11px;color:var(--muted2);margin-bottom:4px">Nomor ${method.label}</div>
                <div class="pay-number" id="payNum">${method.number}</div>
              </div>
              <button class="btn btn-outline btn-sm" id="copyNum">Salin</button>
            </div>
            `}
            <!-- Total -->
            <div class="total-row">
              <span class="total-label">Total Transfer</span>
              <span class="total-value">${fmt(total)}</span>
            </div>
            <!-- Countdown -->
            <div class="countdown-wrap" id="cdWrap">
              ⏱ Bayar dalam: <span id="countdown">30:00</span>
            </div>
            <!-- Upload Bukti -->
            <div>
              <label class="input-label">Upload Bukti Transfer</label>
              <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📤</div>
                <p>Klik atau drag foto bukti transfer di sini</p>
                <input type="file" id="proofFile" accept="image/*">
                <img class="upload-preview" id="uploadPreview" alt="preview">
              </div>
            </div>
            <div id="afterUpload" style="display:none">
              <div class="status-waiting">
                <div class="pulse"></div>
                Bukti transfer sudah diupload — Menunggu Verifikasi
              </div>
            </div>
            <button class="btn btn-green btn-full" id="chatVerify" style="display:none">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat Owner untuk Verifikasi
            </button>
            <button class="btn btn-outline btn-full" id="viewInvoice">Lihat Invoice</button>
          </div>
        </div>
      `;
    }

    openOverlay(buildHTML());
    $('payClose').onclick = () => { if (countdownInterval) clearInterval(countdownInterval); closeOverlay(); };

    // Countdown
    function updateCountdown() {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      const el = $('countdown');
      if (!el) { clearInterval(countdownInterval); return; }
      el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      $('cdWrap').classList.toggle('urgent', timeLeft < 300);
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        showToast('⏱', 'Waktu pembayaran habis. Silakan checkout ulang.');
        closeOverlay();
      }
      timeLeft--;
    }
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Copy Number
    if ($('copyNum')) {
      $('copyNum').onclick = () => {
        navigator.clipboard.writeText(method.number).catch(() => {});
        showToast('📋', 'Nomor pembayaran disalin!');
      };
    }

    // File Upload
    $('proofFile').addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      uploadedFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        uploadedDataURL = e.target.result;
        const preview = $('uploadPreview');
        preview.src = uploadedDataURL;
        preview.style.display = 'block';
        $('uploadArea').classList.add('has-file');
        $('afterUpload').style.display = 'block';
        showToast('⏳', 'Mengupload bukti transfer...');

        // Kirim ke Formspree
        const formData = new FormData();
        formData.append('order_id', orderId);
        formData.append('nama', buyerName);
        formData.append('produk', p.name + (qty > 1 ? ` x${qty}` : ''));
        formData.append('total', fmt(total));
        formData.append('metode', method.label);
        formData.append('tanggal', genDate());
        formData.append('bukti_transfer', file, file.name);

        fetch('https://formspree.io/f/xpqezovy', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
        .then(res => {
          if (res.ok) {
            showToast('✅', 'Bukti transfer berhasil dikirim ke email!');
            $('chatVerify').style.display = 'flex';
          } else {
            showToast('❌', 'Gagal kirim bukti, coba via WA ya!');
            $('chatVerify').style.display = 'flex';
          }
        })
        .catch(() => {
          showToast('❌', 'Gagal kirim bukti, coba via WA ya!');
          $('chatVerify').style.display = 'flex';
        });
      };
      reader.readAsDataURL(file);
    });

    // Chat Verify
    $('chatVerify').onclick = () => {
      const msg = `Halo Admin YannMarket! 👋\n\nSaya sudah melakukan pembayaran.\n\n📋 *Order ID:* #${orderId}\n👤 *Nama:* ${buyerName}\n📦 *Produk:* ${p.name}${qty > 1 ? ` (x${qty})` : ''}\n💰 *Total:* ${fmt(total)}\n💳 *Metode:* ${method.label}\n📅 *Tanggal:* ${genDate()}\n\n✅ *Status: Sudah Transfer*\n\nMohon verifikasi pembayaran saya.\nTerima kasih! 🙏`;
      openWA(msg);
    };

    // Invoice
    $('viewInvoice').onclick = () => showInvoice(p, qty, methodKey, buyerName, orderId, total);
  }

  /* ════════════════════════════════
     PAKASIR — AUTOMATIC QRIS PAYMENT
     Alur: pilih produk → checkout → ringkasan & total →
     tekan bayar → tampil QRIS dinamis → sistem cek status
     otomatis ke API Pakasir → jika lunas, pesanan diproses.
  ════════════════════════════════ */
  /* ════════════════════════════════
     PAKASIR — AUTOMATIC QRIS PAYMENT
     Alur: pilih produk → checkout → ringkasan & total →
     tekan bayar → sistem panggil API sendiri (/api/pakasir-create)
     yang generate QR bersih dari server → tampil QR →
     polling /api/pakasir-status → jika lunas, pesanan diproses.
  ════════════════════════════════ */
  const PAKASIR_API = {
    create: '/api/pakasir-create',
    status: '/api/pakasir-status'
  };

  function pakasirCreateTransaction(orderId, amount) {
    return fetch(PAKASIR_API.create, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, amount })
    }).then(r => r.json());
  }

  function pakasirCheckStatus(orderId, amount) {
    return fetch(`${PAKASIR_API.status}?order_id=${encodeURIComponent(orderId)}&amount=${amount}`)
      .then(r => r.json());
  }

  function showPakasirPayment(p, qty, buyerName, orderId, isCart = false) {
    const total = p.price * qty;
    let timeLeft = 30 * 60; // 30 menit
    let pollTimer = null;
    let paid = false;

    pendingOrder = { orderId, product: p.name, qty, total, method: 'QRIS Otomatis (Pakasir)', buyer: buyerName, date: genDate() };
    savePending();

    function buildLoadingHTML() {
      return `
        <div class="checkout-modal" id="pakasirModal">
          <div class="checkout-header">
            <h3>⚡ Pembayaran Otomatis (Pakasir)</h3>
            <button class="modal-close-btn" id="payClose">✕</button>
          </div>
          <div class="checkout-body">
            <div style="text-align:center;padding:40px 0">
              <div class="pulse" style="margin:0 auto 12px;width:14px;height:14px"></div>
              <p style="font-size:13px;color:var(--muted2)">Menyiapkan kode QRIS...</p>
            </div>
          </div>
        </div>
      `;
    }

    function buildQrHTML(qrImgSrc) {
      return `
        <div class="checkout-modal" id="pakasirModal">
          <div class="checkout-header">
            <h3>⚡ Pembayaran Otomatis (Pakasir)</h3>
            <button class="modal-close-btn" id="payClose">✕</button>
          </div>
          <div class="checkout-body">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted2)">
              <span>Order ID</span><span style="font-weight:700;color:var(--white)">#${orderId}</span>
            </div>
            <div class="qr-wrap">
              <img src="${qrImgSrc}" alt="QRIS Pakasir" style="width:220px;height:220px;object-fit:contain;">
            </div>
            <div class="total-row">
              <span class="total-label">Total Pembayaran</span>
              <span class="total-value">${fmt(total)}</span>
            </div>
            <div class="countdown-wrap" id="cdWrap">
              ⏱ Bayar dalam: <span id="countdown">30:00</span>
            </div>
            <div id="pakasirStatus" class="status-waiting">
              <div class="pulse"></div>
              Menunggu pembayaran — scan kode QRIS di atas
            </div>
            <button class="btn btn-outline btn-full" id="pakasirRefresh">🔄 Cek Status Pembayaran</button>
          </div>
        </div>
      `;
    }

    function buildErrorHTML(message) {
      return `
        <div class="checkout-modal" id="pakasirModal">
          <div class="checkout-header">
            <h3>⚡ Pembayaran Otomatis (Pakasir)</h3>
            <button class="modal-close-btn" id="payClose">✕</button>
          </div>
          <div class="checkout-body">
            <div style="text-align:center;padding:24px 0">
              <div style="font-size:40px">⚠️</div>
              <p style="font-weight:700;margin-top:8px">Gagal memuat QRIS</p>
              <p style="font-size:13px;color:var(--muted2)">${message}</p>
            </div>
            <button class="btn btn-outline btn-full" id="pakasirRetry">🔄 Coba Lagi</button>
          </div>
        </div>
      `;
    }

    function cleanup() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    }

    function updateCountdown() {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      const el = $('countdown');
      if (!el) { cleanup(); return; }
      el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      $('cdWrap').classList.toggle('urgent', timeLeft < 300);
      if (timeLeft <= 0) {
        cleanup();
        if (!paid) {
          showToast('⏱', 'Waktu pembayaran habis. Silakan checkout ulang.');
          closeOverlay();
        }
        return;
      }
      timeLeft--;
    }

    function poll() {
      pakasirCheckStatus(orderId, total).then(data => {
        if (data && data.status === 'completed' && !paid) {
          paid = true;
          cleanup();
          if (isCart) { cart = []; saveCart(); updateCartBadge(); renderCartSidebar(); }
          pendingOrder.status = 'paid';
          savePending();
          showPakasirSuccess(p, qty, buyerName, orderId, total);
        }
      }).catch(() => { /* abaikan error sementara, tetap polling */ });
    }

    function start(qrImgSrc, expiredAt) {
      if (expiredAt) {
        const secs = Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000);
        if (secs > 0) timeLeft = secs;
      }
      openOverlay(buildQrHTML(qrImgSrc));
      $('payClose').onclick = () => { cleanup(); closeOverlay(); };
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
      pollTimer = setInterval(poll, 5000);
      poll();
      $('pakasirRefresh').onclick = () => { showToast('🔄', 'Mengecek status pembayaran...'); poll(); };
    }

    function load() {
      pakasirCreateTransaction(orderId, total).then(data => {
        if (data && data.qr_image) {
          start(data.qr_image, data.expired_at);
        } else {
          openOverlay(buildErrorHTML('Respons tidak sesuai. Silakan coba lagi atau pilih metode lain.'));
          $('payClose').onclick = closeOverlay;
          $('pakasirRetry').onclick = load;
        }
      }).catch(() => {
        openOverlay(buildErrorHTML('Tidak bisa terhubung ke server pembayaran. Cek koneksi internet lalu coba lagi.'));
        $('payClose').onclick = closeOverlay;
        $('pakasirRetry').onclick = load;
      });
    }

    openOverlay(buildLoadingHTML());
    $('payClose').onclick = closeOverlay;
    load();
  }

  function showPakasirSuccess(p, qty, buyerName, orderId, total) {
    openOverlay(`
      <div class="checkout-modal">
        <div class="checkout-header">
          <h3>✅ Pembayaran Berhasil</h3>
          <button class="modal-close-btn" id="payClose">✕</button>
        </div>
        <div class="checkout-body">
          <div style="text-align:center;padding:12px 0">
            <div style="font-size:48px">✅</div>
            <p style="font-weight:700;margin-top:8px">Terima kasih, ${buyerName}!</p>
            <p style="font-size:13px;color:var(--muted2)">Pembayaran untuk #${orderId} telah terverifikasi otomatis oleh Pakasir.</p>
          </div>
          <div class="total-row"><span class="total-label">Total Dibayar</span><span class="total-value">${fmt(total)}</span></div>
          ${p.file ? `
          <a href="${p.file}" download class="btn btn-primary btn-full" id="downloadFile" style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px">
            ⬇️ Download Produk Sekarang
          </a>
          ` : ''}
          <button class="btn btn-green btn-full" id="chatVerify">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ${p.file ? 'Konfirmasi via WA' : 'Konfirmasi & Ambil Layanan via WA'}
          </button>
          <button class="btn btn-outline btn-full" id="viewInvoice">Lihat Invoice</button>
        </div>
      </div>
    `);
    $('payClose').onclick = closeOverlay;
    $('chatVerify').onclick = () => {
      const msg = p.file
        ? `Halo Admin YannMarket! 👋\n\nPembayaran via Pakasir (QRIS) sudah *BERHASIL* otomatis, dan file produk sudah saya download dari halaman sukses.\n\n📋 *Order ID:* #${orderId}\n👤 *Nama:* ${buyerName}\n📦 *Produk:* ${p.name}${qty > 1 ? ` (x${qty})` : ''}\n💰 *Total:* ${fmt(total)}\n💳 *Metode:* QRIS Otomatis (Pakasir)\n📅 *Tanggal:* ${genDate()}\n\n✅ *Status: Terverifikasi & File Terdownload*\n\nKalau ada kendala buka file/aktivasi, mohon dibantu ya. Terima kasih! 🙏`
        : `Halo Admin YannMarket! 👋\n\nPembayaran via Pakasir (QRIS) sudah *BERHASIL* secara otomatis.\n\n📋 *Order ID:* #${orderId}\n👤 *Nama:* ${buyerName}\n📦 *Produk:* ${p.name}${qty > 1 ? ` (x${qty})` : ''}\n💰 *Total:* ${fmt(total)}\n💳 *Metode:* QRIS Otomatis (Pakasir)\n📅 *Tanggal:* ${genDate()}\n\n✅ *Status: Sudah Terverifikasi Sistem*\n\nMohon proses/aktivasi layanan saya. Terima kasih! 🙏`;
      openWA(msg);
    };
    $('viewInvoice').onclick = () => showPakasirInvoice(p, qty, buyerName, orderId, total);
  }

  function showPakasirInvoice(p, qty, buyerName, orderId, total) {
    openOverlay(`
      <div class="invoice-modal">
        <div class="invoice-header">
          <h3>YannMarket</h3>
          <p>Invoice Pembelian</p>
        </div>
        <div class="invoice-body">
          <div class="invoice-row"><span>Order ID</span><span>#${orderId}</span></div>
          <div class="invoice-row"><span>Tanggal</span><span>${genDate()}</span></div>
          <div class="invoice-row"><span>Pembeli</span><span>${buyerName}</span></div>
          <div class="invoice-row"><span>Produk</span><span>${p.name}</span></div>
          <div class="invoice-row"><span>Harga</span><span>${fmt(p.price)}</span></div>
          <div class="invoice-row"><span>Jumlah</span><span>x${qty}</span></div>
          <div class="invoice-row"><span>Metode</span><span>⚡ QRIS Otomatis (Pakasir)</span></div>
          <div class="invoice-row"><span>Status</span><span style="color:#22c55e;font-weight:700">Lunas</span></div>
          <div class="invoice-total invoice-row"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
        <div style="padding:0 24px 24px;display:flex;gap:10px">
          <button class="btn btn-primary btn-full" id="invShare">💬 Kirim ke WA</button>
          <button class="btn btn-outline" id="invClose" style="flex:0 0 auto;padding:0 20px">✕</button>
        </div>
      </div>
    `);
    $('invClose').onclick = () => showPakasirSuccess(p, qty, buyerName, orderId, total);
    $('invShare').onclick = () => {
      const msg = `*INVOICE YANNMARKET*\n\n#${orderId}\n${genDate()}\n\n👤 Pembeli: ${buyerName}\n📦 Produk: ${p.name}${qty > 1 ? ` x${qty}` : ''}\n💳 Metode: QRIS Otomatis (Pakasir)\n💰 Total: ${fmt(total)}\n✅ Status: Lunas\n\nTerima kasih sudah berbelanja di YannMarket!`;
      openWA(msg);
    };
  }

  /* ════════════════════════════════
     INVOICE
  ════════════════════════════════ */
  function showInvoice(p, qty, methodKey, buyerName, orderId, total) {
    const method = PAYMENT_ACCOUNTS[methodKey];
    openOverlay(`
      <div class="invoice-modal">
        <div class="invoice-header">
          <h3>YannMarket</h3>
          <p>Invoice Pembelian</p>
        </div>
        <div class="invoice-body">
          <div class="invoice-row"><span>Order ID</span><span>#${orderId}</span></div>
          <div class="invoice-row"><span>Tanggal</span><span>${genDate()}</span></div>
          <div class="invoice-row"><span>Pembeli</span><span>${buyerName}</span></div>
          <div class="invoice-row"><span>Produk</span><span>${p.name}</span></div>
          <div class="invoice-row"><span>Harga</span><span>${fmt(p.price)}</span></div>
          <div class="invoice-row"><span>Jumlah</span><span>x${qty}</span></div>
          <div class="invoice-row"><span>Metode</span><span>${method.logo} ${method.label}</span></div>
          <div class="invoice-total invoice-row"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
        <div style="padding:0 24px 24px;display:flex;gap:10px">
          <button class="btn btn-primary btn-full" id="invShare">💬 Kirim ke WA</button>
          <button class="btn btn-outline" id="invClose" style="flex:0 0 auto;padding:0 20px">✕</button>
        </div>
      </div>
    `);
    $('invClose').onclick = () => { if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; } showPaymentScreen(p, qty, methodKey, buyerName, orderId); };
    $('invShare').onclick = () => {
      const msg = ` *INVOICE YANNMARKET*\n\n#${orderId}\n${genDate()}\n\n👤 Pembeli: ${buyerName}\n📦 Produk: ${p.name}${qty > 1 ? ` x${qty}` : ''}\n💳 Metode: ${method.label}\n💰 Total: ${fmt(total)}\n\nTerima kasih sudah berbelanja di YannMarket! `;
      openWA(msg);
    };
  }

  /* ════════════════════════════════
     FILTER & SORT
  ════════════════════════════════ */
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });

  $('searchInput').addEventListener('input', function () {
    searchQuery = this.value.toLowerCase().trim();
    renderProducts();
  });

  // Sort dropdown custom (sortBtn / sortMenu)
  const sortBtn  = $('sortBtn');
  const sortMenu = $('sortMenu');
  sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sortBtn.classList.toggle('open');
    sortMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    sortBtn.classList.remove('open');
    sortMenu.classList.remove('open');
  });
  document.querySelectorAll('.sort-option').forEach(opt => {
    opt.addEventListener('click', () => {
      activeSort = opt.dataset.val;
      $('sortLabel').textContent = opt.textContent;
      document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      sortBtn.classList.remove('open');
      sortMenu.classList.remove('open');
      renderProducts();
    });
  });

  /* ════════════════════════════════
     FAQ ACCORDION
  ════════════════════════════════ */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ════════════════════════════════
     SCROLL REVEAL
  ════════════════════════════════ */
  function observeReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal-up:not(.visible)').forEach(el => io.observe(el));
  }

  /* ════════════════════════════════
     ACTIVE NAV
  ════════════════════════════════ */
  const sections = ['hero','products','cara-beli','testimoni','faq','kontak'];
  window.addEventListener('scroll', () => {
    let current = 'hero';
    sections.forEach(id => {
      const sec = document.getElementById(id);
      if (sec && window.scrollY >= sec.offsetTop - 120) current = id;
    });
    document.querySelectorAll('.nav-a').forEach(a => {
      a.classList.toggle('active', a.dataset.scroll === current);
    });
  });

  /* ════════════════════════════════
     INIT
  ════════════════════════════════ */
  renderProducts();
  updateCartBadge();
  updateWishlistBadge();
  observeReveal();

})();