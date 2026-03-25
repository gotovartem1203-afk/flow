// Элементы DOM
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.getElementById('cart-button');
const closeCart = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');
const orderForm = document.getElementById('order-form');
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
        
        // Загрузка featured продуктов на главной странице
        if (document.getElementById('featured-products')) {
            await loadFeaturedProducts();
        }
        
        // Загрузка категорий
        if (document.getElementById('categories-container')) {
            await loadCategories();
        }
        
        // Обновление корзины
        updateCart();
        
        // Обработчики событий
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки данных. Пожалуйста, обновите страницу.', 'error');
    }
});

// Загрузка избранных товаров
async function loadFeaturedProducts() {
    try {
        const products = await getAllProducts();
        const featuredContainer = document.getElementById('featured-products');
        
        // Показываем первые 6 товаров
        const featuredProducts = products.slice(0, 6);
        
        featuredContainer.innerHTML = '';
        featuredProducts.forEach(product => {
            const productElement = createProductElement(product);
            featuredContainer.appendChild(productElement);
        });
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        throw error;
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const categories = await getAllCategories();
        const categoriesContainer = document.getElementById('categories-container');
        
        categoriesContainer.innerHTML = '';
        categories.forEach(category => {
            const categoryElement = createCategoryElement(category);
            categoriesContainer.appendChild(categoryElement);
        });
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        throw error;
    }
}

// Создание элемента категории
function createCategoryElement(category) {
    const categoryElement = document.createElement('div');
    categoryElement.classList.add('category');
    categoryElement.innerHTML = `
        <img src="${category.image_url}" alt="${category.name}">
        <div class="category-content">
            <h3>${category.name}</h3>
            <a href="catalog.html?category=${category.id}" class="add-to-cart">Смотреть</a>
        </div>
    `;
    return categoryElement;
}

// Создание элемента товара
function createProductElement(product) {
    const productElement = document.createElement('div');
    productElement.classList.add('product');
    productElement.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}">
        <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <p class="product-price">${product.price} руб.</p>
            <button class="add-to-cart" data-id="${product.id}">В корзину</button>
        </div>
    `;
    
    // Добавляем обработчик события для кнопки "В корзину"
    const addButton = productElement.querySelector('.add-to-cart');
    addButton.addEventListener('click', () => {
        addToCart(product.id);
    });
    
    return productElement;
}

// Добавление товара в корзину
async function addToCart(productId) {
    try {
        const product = await getProductById(productId);
        if (!product) return;
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: 1
            });
        }
        
        // Сохраняем корзину в localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        updateCart();
        openCart();
        
        // Показываем уведомление
        showNotification(`Товар "${product.name}" добавлен в корзину`);
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        showNotification('Ошибка добавления товара в корзину', 'error');
    }
}

// Обновление корзины
function updateCart() {
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-price">${item.price} руб. x ${item.quantity}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}">&times;</button>
            `;
            cartItems.appendChild(cartItem);
            
            total += item.price * item.quantity;
            
            // Добавляем обработчики событий для кнопок в корзине
            const decreaseBtn = cartItem.querySelector('.decrease');
            const increaseBtn = cartItem.querySelector('.increase');
            const removeBtn = cartItem.querySelector('.remove-item');
            
            decreaseBtn.addEventListener('click', () => decreaseQuantity(item.id));
            increaseBtn.addEventListener('click', () => increaseQuantity(item.id));
            removeBtn.addEventListener('click', () => removeFromCart(item.id));
        });
    }
    
    cartTotal.textContent = `Итого: ${total} руб.`;
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Уменьшение количества товара
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        removeFromCart(productId);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Увеличение количества товара
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    item.quantity += 1;
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Удаление товара из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

// Открытие корзины
function openCart() {
    cartModal.classList.add('open');
}

// Закрытие корзины
function closeCartModal() {
    cartModal.classList.remove('open');
}

// Оформление заказа
function checkout() {
    if (cart.length === 0) {
        showNotification('Корзина пуста!', 'error');
        return;
    }
    
    closeCartModal();
    
    // Если на странице есть форма заказа, показываем её
    if (orderForm) {
        orderForm.style.display = 'block';
        orderForm.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Иначе перенаправляем на страницу оформления заказа
        window.location.href = 'checkout.html';
    }
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
        updateCart();
        
        // Сбрасываем форму
        if (checkoutForm) {
            checkoutForm.reset();
        }
        
        // Скрываем форму заказа
        if (orderForm) {
            orderForm.style.display = 'none';
        }
        
        // Показываем сообщение об успехе
        showNotification(`Заказ #${orderId} оформлен успешно! С вами свяжутся для подтверждения.`, 'success');
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        showNotification('Произошла ошибка при оформлении заказа. Попробуйте еще раз.', 'error');
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

// Настройка обработчиков событий
function setupEventListeners() {
    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', submitOrder);
    }
    
    // Закрытие корзины при клике вне ее области
    document.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
    
    // Обработка формы обратной связи на странице контактов
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Сообщение отправлено! Мы ответим вам в ближайшее время.');
            contactForm.reset();
        });
    }
    // js/main.js

// ... (остальной код остается без изменений)

// Создание элемента товара с обработкой ошибок загрузки изображений
function createProductElement(product) {
    const productElement = document.createElement('div');
    productElement.classList.add('product');
    productElement.innerHTML = `
        <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1487530811176-3780de880c2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
        <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <p class="product-price">${product.price} руб.</p>
            <button class="add-to-cart" data-id="${product.id}">В корзину</button>
        </div>
    `;
    
    // Добавляем обработчик события для кнопки "В корзину"
    const addButton = productElement.querySelector('.add-to-cart');
    addButton.addEventListener('click', () => {
        addToCart(product.id);
    });
    
    return productElement;
}

// Создание элемента категории с обработкой ошибок загрузки изображений
function createCategoryElement(category) {
    const categoryElement = document.createElement('div');
    categoryElement.classList.add('category');
    categoryElement.innerHTML = `
        <img src="${category.image_url}" alt="${category.name}" onerror="this.src='https://images.unsplash.com/photo-1487530811176-3780de880c2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
        <div class="category-content">
            <h3>${category.name}</h3>
            <a href="catalog.html?category=${category.id}" class="add-to-cart">Смотреть</a>
        </div>
    `;
    return categoryElement;
}

// Функция для инициализации корзины
function initCart() {
    updateCartCount();
}

// Вызов инициализации корзины при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initCart();
});
}
