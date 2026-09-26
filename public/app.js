// หลักของหน้าเว็บ เช่น เมนูสินค้า, ตะกร้า, ปุ่มชำระเงิน, หน้า review/payment
const menuGrid = document.getElementById('menuGrid');
const cartItems = document.getElementById('cartItems');
const totalPrice = document.getElementById('totalPrice');
const reviewCartList = document.getElementById('reviewCartList');
const reviewTotal = document.getElementById('reviewTotal');
const paymentTotal = document.getElementById('paymentTotal');
const cashAmountInput = document.getElementById('cashAmount');
const cashWrap = document.getElementById('cashWrap');
const qrWrap = document.getElementById('qrWrap');
const messageBox = document.getElementById('messageBox');
const successOverlay = document.getElementById('successOverlay');
const purchaseBtn = document.getElementById('purchaseBtn');
const refundBtn = document.getElementById('refundBtn');
const paymentBlock = document.getElementById('paymentBlock');
const qrText = document.getElementById('qrText');
const qrPattern = document.getElementById('qrPattern');
const qrImage = document.getElementById('qrImage');
const promptpayText = document.getElementById('promptpayText');
const goReviewBtn = document.getElementById('goReviewBtn');
const goPaymentBtn = document.getElementById('goPaymentBtn');
const reviewBackBtn = document.getElementById('reviewBackBtn');
const reviewToPaymentBtn = document.getElementById('reviewToPaymentBtn');
const backToCatalogBtn = document.getElementById('backToCatalogBtn');
const paymentBackBtn = document.getElementById('paymentBackBtn');
const paymentReviewBtn = document.getElementById('paymentReviewBtn');
const catalogView = document.getElementById('catalogView');
const reviewView = document.getElementById('reviewView');
const paymentView = document.getElementById('paymentView');

// รูป
const productImages = {
  1: '/images/cookie_choc.png',
  2: '/images/cookie_green.png',
  3: '/images/cookie_white.png',
  9: '/images/water.png',
  5: '/images/tea_thai.png',
  6: '/images/lemon.png',
  7: '/images/orange.png',
  8: '/images/apple.png',
  4: '/images/cookie_butter.png',
  10: '/images/cookie_mix.png',
  11: '/images/cookie_berry.png',
  12: '/images/cookie_caramel.png'
};

const promptpayPhone = '0917048020';
const promptpayName = 'พิชญ์สินี แก้วจันทร์แดง';

let menuItems = [];
let activeCategory = 'all';
let cart = [];
let heldCashAmount = 0;

//  เพิ่มสินค้าเรียบร้อย / เงินไม่พอ / ลบสินค้าแล้ว
const setMessage = (type, text) => {
  messageBox.className = `message-box show ${type}`;
  messageBox.textContent = text;
};

//  “สั่งซื้อสำเร็จ” เป็นเวลา 2.2 วินาที
const showSuccessOverlay = () => {
  successOverlay.classList.remove('hidden');
  setTimeout(() => {
    successOverlay.classList.add('hidden');
  }, 2500);
};
//  
const showScreen = (screenName) => {
  catalogView.classList.toggle('active', screenName === 'catalog');
  reviewView.classList.toggle('active', screenName === 'review');
  paymentView.classList.toggle('active', screenName === 'payment');
  if (screenName === 'review') {
    renderReviewPage();
  }

  if (screenName === 'payment') {
    updatePaymentUI();
    paymentTotal.textContent = `${getCartTotal()} บาท`;
  }
};

//  QR 

const buildQrPattern = (total) => {
  const cells = [];
  for (let i = 0; i < 36; i += 1) {
    const cell = document.createElement('span');
    const seed = (i * 13 + total * 7) % 10;
    if (seed % 3 === 0 || (i % 6 === 0 && i % 12 !== 0) || (i + total) % 7 === 0) {
      cell.style.background = '#d07d3d';
    } else {
      cell.style.background = '#2a231f';
    }
    cells.push(cell);
  }
  qrPattern.innerHTML = '';
  cells.forEach((cell) => qrPattern.appendChild(cell));
};


// รวมราคา
const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// สร้าง URL QR code mock จากยอดรวมสินค้า
const buildQrImageUrl = (total) => {
  const payload = `VENDING|TOTAL|${total}|THB`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
};

// ===== ปรับ UI ตามวิธีชำระ =====
// cash = ให้กรอกจำนวนเงิน
// qr_code = แสดง QR Code
// promptpay = แสดงเลขพร้อมเพย์
const updatePaymentUI = () => {
  const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const total = getCartTotal();
  buildQrPattern(total);
  qrImage.src = buildQrImageUrl(total);

  if (refundBtn) {
    refundBtn.disabled = selectedMethod !== 'cash';
  }

  if (selectedMethod === 'cash') {
    cashWrap.classList.add('visible');
    qrWrap.classList.remove('visible');
    qrPattern.style.display = 'grid';
    qrText.textContent = `สแกน QR Code เพื่อชำระเงิน ${total} บาท`;
    qrImage.style.display = 'none';
    promptpayText.style.display = 'none';
  } else if (selectedMethod === 'promptpay') {
    cashWrap.classList.remove('visible');
    qrWrap.classList.add('visible');
    qrPattern.style.display = 'none';
    qrText.textContent = '';
    qrImage.style.display = 'none';
    promptpayText.innerHTML = `พร้อมเพย์: ${promptpayPhone}<br />${promptpayName}`;
    promptpayText.style.display = 'block';
  } else {
    cashWrap.classList.remove('visible');
    qrWrap.classList.add('visible');
    qrPattern.style.display = 'none';
    qrText.textContent = '';
    qrImage.style.display = 'block';
    promptpayText.style.display = 'none';
  }
};

// ===== หน้า review / ตรวจสอบสินค้า =====
// แสดงสินค้าที่เลือกไว้ พร้อมปุ่มลบ และยอดรวม
const renderReviewPage = () => {
  if (cart.length === 0) {
    reviewCartList.innerHTML = '<div class="review-item empty">ยังไม่มีสินค้าในตะกร้า</div>';
    reviewTotal.textContent = '0 บาท';
    return;
  }

  reviewCartList.innerHTML = cart.map((item) => `
    <div class="review-item">
      <div class="review-item-left">
        <img src="${productImages[item.id] || '/images/cookie_choc.svg'}" alt="${item.name}" class="product-thumb" />
        <div>
          <div class="review-name">${item.name}</div>
          <div class="review-meta">จำนวน ${item.quantity} ชิ้น • สต็อก ${item.stock || 10} ชิ้น</div>
        </div>
      </div>
      <div class="review-item-actions">
        <div class="review-price">${item.price * item.quantity} บาท</div>
        <button class="remove-btn" type="button" data-item-id="${item.id}">ลบ</button>
      </div>
    </div>
  `).join('');

  reviewTotal.textContent = `${getCartTotal()} บาท`;

  reviewCartList.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => {
      removeFromCart(Number(button.dataset.itemId));
    });
  });
};

// ===== ลบสินค้าออกจากตะกร้า =====
// เมื่อกดปุ่มลบ จะกรองสินค้าออกจาก cart และ refresh UI ใหม่
const removeFromCart = (itemId) => {
  cart = cart.filter((item) => item.id !== itemId);
  updateCartUI();
  renderReviewPage();
  setMessage('success', 'ลบสินค้าออกจากตะกร้าแล้ว');
};

// ===== อัปเดตตะกร้าและยอดรวม =====
// ดึงข้อมูลจาก cart แล้ว render กลับไปที่หน้าตะกร้าและหน้าตรวจสอบสินค้า
const updateCartUI = () => {
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-item"><div class="info"><div class="name">ยังไม่มีสินค้าในตะกร้า</div></div></div>';
    totalPrice.textContent = '0 บาท';
    reviewTotal.textContent = '0 บาท';
    paymentTotal.textContent = '0 บาท';
    goReviewBtn.disabled = true;
    goPaymentBtn.disabled = true;
    goPaymentBtn.style.display = 'none';
    paymentBlock.classList.remove('visible');
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="info">
        <img src="${productImages[item.id] || '/images/cookie_choc.svg'}" alt="${item.name}" class="product-thumb" />
        <div>
          <div class="name">${item.name}</div>
          <small>จำนวน ${item.quantity} ชิ้น</small>
        </div>
      </div>
      <div class="price">${item.price * item.quantity} บาท</div>
    </div>
  `).join('');

  const sum = getCartTotal();
  totalPrice.textContent = `${sum} บาท`;
  reviewTotal.textContent = `${sum} บาท`;
  paymentTotal.textContent = `${sum} บาท`;
  goReviewBtn.disabled = false;
  goPaymentBtn.disabled = true;
  goPaymentBtn.style.display = 'none';
  paymentBlock.classList.add('visible');
};

// ===== กรองเมนูตามประเภท =====
// all = ทั้งหมด, cookie = เบเกอรี่, drink = เครื่องดื่ม
const filterItems = () => {
  if (activeCategory === 'all') return menuItems;
  if (activeCategory === 'cookie') return menuItems.filter((item) => item.type === 'snack');
  return menuItems.filter((item) => item.type === 'drink');
};

// ===== Render เมนูสินค้า =====
// สร้างกล่องสินค้าในหน้า catalog และเพิ่ม event ให้ปุ่ม + เพิ่มลงตะกร้า
const renderMenu = () => {
  const visibleItems = filterItems();
  menuGrid.innerHTML = '';

  visibleItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const isOutOfStock = Number(item.stock || 0) <= 0;
    card.innerHTML = `
      <div class="type-tag">${item.type === 'drink' ? 'เครื่องดื่ม' : 'คุกกี้'}</div>
      <img src="${productImages[item.id] || '/images/cookie_choc.svg'}" alt="${item.name}" class="product-image" />
      <h3>${item.name}</h3>
      <div class="price-row">
        <span class="price">${item.price} บาท</span>
        <button class="add-btn" type="button" ${isOutOfStock ? 'disabled' : ''}>+</button>
      </div>
      <div class="stock-label ${isOutOfStock ? 'out' : ''}">
        ${isOutOfStock ? 'หมดแล้ว' : `เหลือ ${item.stock} ชิ้น`}
      </div>
    `;

    card.addEventListener('click', (event) => {
      if (event.target.closest('.add-btn')) {
        if (Number(item.stock || 0) <= 0) {
          setMessage('error', `${item.name} หมดแล้ว เหลือ 0 ชิ้น`);
          return;
        }

        if (cart.length > 0) {
          setMessage('error', 'สามารถซื้อได้ครั้งละ 1 ชิ้นเท่านั้น');
          return;
        }

        cart.push({ ...item, quantity: 1, stock: item.stock || 10 });
        updateCartUI();
        setMessage('success', `เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
      }
    });

    menuGrid.appendChild(card);
  });
};

// ===== โหลดสินค้า =====
// เรียก API /api/menu เพื่อเอารายการสินค้าเข้ามาแสดงบนหน้า
const fetchMenu = async () => {
  try {
    const response = await fetch('/api/menu');
    const data = await response.json();

    if (!data.success) {
      throw new Error('โหลดเมนูไม่สำเร็จ');
    }

    menuItems = data.items;
    renderMenu();
    updateCartUI();
  } catch (error) {
    console.error(error);
    setMessage('error', 'ไม่สามารถโหลดเมนูสินค้าได้');
  }
};

cashAmountInput.addEventListener('input', () => {
  const amount = Number(cashAmountInput.value || 0);
  if (amount > 0 && amount < getCartTotal()) {
    heldCashAmount = amount;
  } else if (amount <= 0) {
    heldCashAmount = 0;
  }
});

if (refundBtn) {
  refundBtn.addEventListener('click', () => {
    const refundAmount = Number(cashAmountInput.value || heldCashAmount || 0);
    if (refundAmount <= 0) {
      setMessage('error', 'ไม่มีเงินที่ต้องคืน');
      return;
    }

    cashAmountInput.value = '';
    heldCashAmount = 0;
    setMessage('success', `คืนเงิน ${refundAmount} บาท แล้ว`);
  });
}

// ===== Event listeners =====
// เมื่อกดแท็บประเภทสินค้า จะเปลี่ยน view และ render menu ใหม่
document.querySelectorAll('.filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach((btn) => btn.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    renderMenu();
  });
});

// เมื่อเปลี่ยนวิธีชำระเงิน ให้แสดง UI ที่ตรงกับการชำระนั้นๆ
document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
  radio.addEventListener('change', updatePaymentUI);
});

// ===== ปุ่มนำทางขั้นตอน =====
// เรียก showScreen เพื่อไปหน้าตรวจสอบ หรือหน้าชำระเงินตาม step ที่เลือก
if (goReviewBtn) {
  goReviewBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      setMessage('error', 'กรุณาเลือกสินค้าให้เรียบร้อยก่อน');
      return;
    }
    showScreen('review');
  });
}

if (goPaymentBtn) {
  goPaymentBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      setMessage('error', 'กรุณาเลือกสินค้าให้เรียบร้อยก่อน');
      return;
    }
    showScreen('payment');
  });
}

if (reviewBackBtn) reviewBackBtn.addEventListener('click', () => showScreen('catalog'));
if (reviewToPaymentBtn) reviewToPaymentBtn.addEventListener('click', () => showScreen('payment'));
if (backToCatalogBtn) backToCatalogBtn.addEventListener('click', () => showScreen('catalog'));
if (paymentBackBtn) paymentBackBtn.addEventListener('click', () => showScreen('review'));
if (paymentReviewBtn) paymentReviewBtn.addEventListener('click', () => showScreen('review'));

// ===== ส่งคำสั่งชำระเงิน =====
// ส่ง cart + วิธีชำระ + จำนวนเงินที่กรอก ไปที่ API /api/purchase
purchaseBtn.addEventListener('click', async () => {
  if (cart.length === 0) {
    setMessage('error', 'กรุณาเลือกสินค้าให้เรียบร้อยก่อนชำระเงิน');
    return;
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const requestBody = {
    items: cart.map((item) => ({ itemId: item.id, quantity: item.quantity })),
    paymentMethod,
    cashAmount: paymentMethod === 'cash' ? Number(cashAmountInput.value || 0) : getCartTotal()
  };

  try {
    const amountEntered = Number(cashAmountInput.value || 0);
    if (paymentMethod === 'cash' && amountEntered > 0 && amountEntered < getCartTotal()) {
      heldCashAmount = amountEntered;
      setMessage('error', `จำนวนเงินไม่เพียงพอ กำลังเก็บเงินไว้ กรุณากดคืนเงิน รับเงินคืน ${heldCashAmount} บาท`);
      return;
    }

    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!result.success) {
      if (paymentMethod === 'cash') {
        heldCashAmount = Number(cashAmountInput.value || 0);
      }
      setMessage('error', result.message || 'การสั่งซื้อไม่สำเร็จ');
      return;
    }

    const itemNames = cart.map((item) => item.name).join(', ');
    const paymentText = paymentMethod === 'cash'
      ? `ซื้อสินค้า ${itemNames} สำเร็จแล้ว | เงินสด ${result.paidAmount} บาท | เงินทอน ${result.change} บาท`
      : paymentMethod === 'promptpay'
        ? `ซื้อสินค้า ${itemNames} สำเร็จแล้ว | ชำระด้วยพร้อมเพย์ ${promptpayPhone} (${promptpayName}) สำเร็จ`
        : `ซื้อสินค้า ${itemNames} สำเร็จแล้ว | ชำระด้วย QR Code สำหรับ ${result.totalAmount} บาท สำเร็จ`;

    if (Array.isArray(result.updatedStocks)) {
      menuItems = menuItems.map((item) => {
        const updated = result.updatedStocks.find((stockItem) => Number(stockItem.itemId) === Number(item.id));
        if (!updated) return item;
        return { ...item, stock: Number(updated.remainingStock) };
      });
    }

    setMessage('success', paymentText);
    cart = [];
    updateCartUI();
    renderMenu();
    cashAmountInput.value = '';
    showScreen('catalog');
    showSuccessOverlay();
  } catch (error) {
    console.error(error);
    setMessage('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
});

updateCartUI();
updatePaymentUI();
showScreen('catalog');
fetchMenu();
