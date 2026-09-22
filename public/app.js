const menuGrid = document.getElementById('menuGrid');
const cartItems = document.getElementById('cartItems');
const totalPrice = document.getElementById('totalPrice');
const cashAmountInput = document.getElementById('cashAmount');
const cashWrap = document.getElementById('cashWrap');
const qrWrap = document.getElementById('qrWrap');
const messageBox = document.getElementById('messageBox');
const successOverlay = document.getElementById('successOverlay');
const purchaseBtn = document.getElementById('purchaseBtn');
const paymentBlock = document.getElementById('paymentBlock');
const qrText = document.getElementById('qrText');
const qrPattern = document.getElementById('qrPattern');
const qrImage = document.getElementById('qrImage');
const promptpayText = document.getElementById('promptpayText');

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

const setMessage = (type, text) => {
  messageBox.className = `message-box show ${type}`;
  messageBox.textContent = text;
};

const showSuccessOverlay = () => {
  successOverlay.classList.remove('hidden');
  setTimeout(() => {
    successOverlay.classList.add('hidden');
  }, 2200);
};

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

const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

const buildQrImageUrl = (total) => {
  const payload = `VENDING|TOTAL|${total}|THB`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
};

const updatePaymentUI = () => {
  const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const total = getCartTotal();
  buildQrPattern(total);
  qrImage.src = buildQrImageUrl(total);

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

const updateCartUI = () => {
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-item"><div class="info"><div class="name">ยังไม่มีสินค้าในตะกร้า</div></div></div>';
    totalPrice.textContent = '0 บาท';
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

  totalPrice.textContent = `${getCartTotal()} บาท`;
  paymentBlock.classList.add('visible');
};

const filterItems = () => {
  if (activeCategory === 'all') return menuItems;
  if (activeCategory === 'cookie') return menuItems.filter((item) => item.type === 'snack');
  return menuItems.filter((item) => item.type === 'drink');
};

const renderMenu = () => {
  const visibleItems = filterItems();
  menuGrid.innerHTML = '';

  visibleItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="type-tag">${item.type === 'drink' ? 'เครื่องดื่ม' : 'คุกกี้'}</div>
      <img src="${productImages[item.id] || '/images/cookie_choc.svg'}" alt="${item.name}" class="product-image" />
      <h3>${item.name}</h3>
      <div class="price-row">
        <span class="price">${item.price} บาท</span>
        <button class="add-btn" type="button">+</button>
      </div>
    `;

    card.addEventListener('click', (event) => {
      if (event.target.closest('.add-btn')) {
        if (cart.length > 0) {
          setMessage('error', 'สามารถซื้อได้ครั้งละ 1 ชิ้นเท่านั้น');
          return;
        }

        const existing = cart.find((entry) => entry.id === item.id);

        if (existing) {
          setMessage('error', 'สามารถซื้อได้ครั้งละ 1 ชิ้นเท่านั้น');
          return;
        }

        cart.push({ ...item, quantity: 1 });
        updateCartUI();
        setMessage('success', `เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
      }
    });

    menuGrid.appendChild(card);
  });
};

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

document.querySelectorAll('.filter-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach((btn) => btn.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    renderMenu();
  });
});

document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
  radio.addEventListener('change', updatePaymentUI);
});

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
    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!result.success) {
      setMessage('error', result.message || 'การสั่งซื้อไม่สำเร็จ');
      return;
    }

    const paymentText = paymentMethod === 'cash'
      ? `เงินสด ${result.paidAmount} บาท | เงินทอน ${result.change} บาท`
      : paymentMethod === 'promptpay'
        ? `ชำระด้วยพร้อมเพย์ ${promptpayPhone} (${promptpayName}) สำเร็จ`
        : `ชำระด้วย QR Code สำหรับ ${result.totalAmount} บาท สำเร็จ`;

    setMessage('success', `${result.message} | ${paymentText}`);
    cart = [];
    updateCartUI();
    cashAmountInput.value = '';
    showSuccessOverlay();
  } catch (error) {
    console.error(error);
    setMessage('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
});

updatePaymentUI();
fetchMenu();
