const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const menu = [
  { id: 1, name: 'คุกกี้ช็อกชิป', price: 30, type: 'snack', stock: 10 },
  { id: 2, name: 'คุกกี้ชาเขียว', price: 40, type: 'snack', stock: 3 },
  { id: 3, name: 'คุกกี้เรดเวลเวท', price: 45, type: 'snack', stock: 10 },
  { id: 4, name: 'คุกกี้เนย', price: 30, type: 'snack', stock: 10 },
  { id: 5, name: 'ชาไทย', price: 25, type: 'drink', stock: 10 },
  { id: 6, name: 'ชามะนาว', price: 30, type: 'drink', stock: 10 },
  { id: 7, name: 'น้ำส้ม', price: 35, type: 'drink', stock: 10 },
  { id: 8, name: 'น้ำแอปเปิล', price: 35, type: 'drink', stock: 10 },
  { id: 9, name: 'น้ำเปล่า', price: 10, type: 'drink', stock: 10 },
  { id: 10, name: 'คอนเฟลกลูกเกด', price: 40, type: 'snack', stock: 10 },
  { id: 11, name: 'คอนเฟลกคาราเมล', price: 45, type: 'snack', stock: 10 },
  { id: 12, name: 'คอนเฟลกช็อกโกแลต', price: 50, type: 'snack', stock: 10 }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/menu', (req, res) => {
  res.json({ success: true, items: menu });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.post('/api/purchase', (req, res) => {
  const { items, itemId, paymentMethod, cashAmount, quantity } = req.body || {};
  const selectedItems = Array.isArray(items) && items.length > 0
    ? items
    : [{ itemId, quantity: Number(quantity || 1) }];

  const validatedItems = selectedItems
    .map((entry) => {
      const item = menu.find((product) => product.id === Number(entry.itemId));
      if (!item) return null;
      const qty = Number(entry.quantity || 1);
      if (!Number.isFinite(qty) || qty <= 0) return null;
      if (qty > item.stock) {
        return null;
      }
      return { item, quantity: qty };
    })
    .filter(Boolean);

  if (validatedItems.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบสินค้าในรายการชำระเงินหรือสต็อกไม่เพียงพอ'
    });
  }

  if (validatedItems.length > 1 || validatedItems.some((entry) => entry.quantity > 1)) {
    return res.status(400).json({
      success: false,
      message: 'สามารถซื้อได้ครั้งละ 1 ชิ้นเท่านั้น'
    });
  }

  const totalAmount = validatedItems.reduce((sum, entry) => sum + (entry.item.price * entry.quantity), 0);
  const payment = (paymentMethod || 'cash').toString();

  validatedItems.forEach((entry) => {
    entry.item.stock -= entry.quantity;
  });

  const updatedStocks = menu.map((item) => ({
    itemId: item.id,
    remainingStock: item.stock
  }));

  if (payment === 'cash') {
    const amount = Number(cashAmount || 0);

    if (amount < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `จำนวนเงินไม่เพียงพอ ต้องชำระ ${totalAmount} บาท`,
        requiredAmount: totalAmount
      });
    }

    const change = amount - totalAmount;
    return res.json({
      success: true,
      items: validatedItems.map((entry) => ({
        ...entry.item,
        quantity: entry.quantity
      })),
      updatedStocks,
      paymentMethod: payment,
      paidAmount: amount,
      change,
      totalAmount,
      message: `ซื้อสินค้า ${validatedItems.map((entry) => entry.item.name).join(', ')} สำเร็จแล้ว รับเงินทอน ${change} บาท`
    });
  }
  if (payment === 'qr_code' || payment === 'promptpay') {
    return res.json({
      success: true,
      items: validatedItems.map((entry) => ({
        ...entry.item,
        quantity: entry.quantity
      })),
      updatedStocks,
      paymentMethod: payment,
      totalAmount,
      paidAmount: totalAmount,
      message: `ซื้อสินค้า ${validatedItems.map((entry) => entry.item.name).join(', ')} สำเร็จแล้ว ชำระด้วย ${payment === 'promptpay' ? 'พร้อมเพย์' : 'QR Code'}`
    });
  }
  return res.status(400).json({
    success: false,
    message: 'รูปแบบการชำระเงินไม่ถูกต้อง โปรดเลือกเงินสด QR Code หรือ พร้อมเพย์'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vending machine running on http://localhost:${PORT}`);
});
