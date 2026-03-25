// Элементы DOM
const orderItems = document.getElementById('order-items');
const orderTotal = document.getElementById('order-total');
const checkoutForm = document.getElementById('checkout-form');

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализация базы данных
        await initDatabase();
        
        // Добавление тестовых данных
        await addTestData();
        
        // Загрузка данных корзины
        loadOrderSummary();
        
        // Настройка обработчиков событий
        setupCheckoutEventListeners();
        
        // Установка минимальной даты доставки (завтра)
        setMinDeliveryDate();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки данных. Пожалуйста, обновите страницу.', 'error');
    }
});

// Загрузка данных корзины
function loadOrderSummary() {
    orderItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        orderItems.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        // Если корзина пуста, перенаправляем в каталог
        setTimeout(() => {
            window.location.href = 'catalog.html';
        }, 2000);
    } else {
        cart.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            orderItem.innerHTML = `
                <span>${item.name} x ${item.quantity}</span>
                <span>${item.price * item.quantity} руб.</span>
            `;
            orderItems.appendChild(orderItem);
            
            total += item.price * item.quantity;
        });
    }
    
    orderTotal.textContent = `Итого: ${total} руб.`;
}

// Установка минимальной даты доставки (завтра)
function setMinDeliveryDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    const minDate = `${year}-${month}-${day}`;
    document.getElementById('delivery-date').setAttribute('min', minDate);
}

// Отправка формы заказа
async function submitOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const message = document.getElementById('message').value;
    
    // Валидация
    if (!name || !phone || !address) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
        // Сохраняем заказ в базе данных
        const orderId = await createOrder({
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            delivery_address: address,
            delivery_date: deliveryDate,
            delivery_time: deliveryTime,
            payment_method: paymentMethod,
            notes: message,
            total_amount: total
        }, cart);
        
        // Очищаем корзину
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Показываем сообщение об успехе
        showNotification(`Заказ #${orderId} оформлен успешно! С вами свяжутся для подтверждения.`, 'success');
        
        // Перенаправляем на главную страницу через 3 секунды
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showNotification('Произошла ошибка при оформлении заказа. Попробуйте еще раз.', 'error');
    }
}

// Настройка обработчиков событий
function setupCheckoutEventListeners() {
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', submitOrder);
    }
}

// Показ уведомления
function showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Добавляем стили
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.zIndex = '10000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    
    if (type === 'success') {
        notification.style.background = 'var(--primary)';
    } else {
        notification.style.background = '#ff4d4d';
    }
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Убираем через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}