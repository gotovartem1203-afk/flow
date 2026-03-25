// js/catalog.js

// Элементы DOM
const productsContainer = document.getElementById('products-container');
const categoryFilter = document.getElementById('category-filter');
const priceFilter = document.getElementById('price-filter');
const sortSelect = document.getElementById('sort');
const paginationContainer = document.getElementById('pagination');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.getElementById('cart-button');
const closeCart = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');

// Параметры фильтрации и пагинации
let currentCategory = 'all';
let currentPriceRange = 'all';
let currentSort = 'name';
let currentPage = 1;
const productsPerPage = 6;

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация каталога
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализация базы данных
        await initDatabase();
        
        // Добавление тестовых данных
        await addTestData();
        
        // Загрузка категорий для фильтра
        await loadCategoriesForFilter();
        
        // Загрузка и отображение товаров
        await loadProducts();
        
        // Инициализация корзины
        initCart();
        
        // Настройка обработчиков событий
        setupCatalogEventListeners();
        
        // Обработка параметров URL
        processUrlParams();
    } catch (error) {
        console.error('Ошибка инициализации каталога:', error);
    }
});

// Загрузка категорий для фильтра
async function loadCategoriesForFilter() {
    try {
        const categories = await getAllCategories();
        const categoryFilter = document.getElementById('category-filter');
        
        // Добавляем категории в фильтр
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

// Загрузка товаров
async function loadProducts() {
    try {
        let products = [];
        
        if (currentCategory === 'all') {
            products = await getAllProducts();
        } else {
            products = await getProductsByCategory(parseInt(currentCategory));
        }
        
        // Фильтрация по цене
        if (currentPriceRange !== 'all') {
            products = filterProductsByPrice(products, currentPriceRange);
        }
        
        // Сортировка
        products = sortProducts(products, currentSort);
        
        // Отображение товаров с пагинацией
        displayProductsWithPagination(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

// Фильтрация товаров по цене
function filterProductsByPrice(products, priceRange) {
    switch (priceRange) {
        case '0-2000':
            return products.filter(p => p.price < 2000);
        case '2000-5000':
            return products.filter(p => p.price >= 2000 && p.price < 5000);
        case '5000-10000':
            return products.filter(p => p.price >= 5000 && p.price < 10000);
        case '10000+':
            return products.filter(p => p.price >= 10000);
        default:
            return products;
    }
}

// Сортировка товаров
function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'name':
            return products.sort((a, b) => a.name.localeCompare(b.name));
        case 'price-asc':
            return products.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return products.sort((a, b) => b.price - a.price);
        case 'popular':
            return products.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        default:
            return products;
    }
}

// Отображение товаров с пагинацией
function displayProductsWithPagination(products) {
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    // Проверка текущей страницы
    if (currentPage > totalPages) {
        currentPage = 1;
    }
    
    // Получаем товары для текущей страницы
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = products.slice(startIndex, endIndex);
    
    // Очищаем контейнер
    productsContainer.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">Товары не найдены</p>';
    } else {
        // Отображаем товары
        productsToShow.forEach(product => {
            const productElement = createProductElement(product);
            productsContainer.appendChild(productElement);
        });
    }
    
    // Отображаем пагинацию
    displayPagination(totalPages);
}

// Отображение пагинации
function displayPagination(totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Кнопка "Назад"
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.addEventListener('click', () => {
            currentPage--;
            loadProducts();
        });
        paginationContainer.appendChild(prevButton);
    }
    
    // Нумерация страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            loadProducts();
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.addEventListener('click', () => {
            currentPage++;
            loadProducts();
        });
        paginationContainer.appendChild(nextButton);
    }
}

// Обработка параметров URL
function processUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category && categoryFilter) {
        categoryFilter.value = category;
        currentCategory = category;
    }
    
    // Обновляем товары с учетом параметров
    loadProducts();
}

// Настройка обработчиков событий для каталога
function setupCatalogEventListeners() {
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            updateUrl();
            loadProducts();
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', (e) => {
            currentPriceRange = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            loadProducts();
        });
    }
    
    // Обработчики для корзины
    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    // Закрытие корзины при клике вне ее области
    document.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
}

// Обновление URL с параметрами
function updateUrl() {
    const url = new URL(window.location);
    
    if (currentCategory !== 'all') {
        url.searchParams.set('category', currentCategory);
    } else {
        url.searchParams.delete('category');
    }
    
    window.history.replaceState({}, '', url);
}

// Создание элемента товара
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

// Добавление товара в корзину
async function addToCart(productId) {
    try {
        const product = await getProductById(productId);
        if (!product) {
            showNotification('Товар не найден', 'error');
            return;
        }
        
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
        
        // Обновляем корзину
        updateCart();
        
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
                <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1487530811176-3780de880c2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
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
    updateCartCount();
}

// Обновление счетчика корзины
function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Обновляем все элементы с классом .cart-count на странице
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = totalCount;
    });
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
    window.location.href = 'checkout.html';
}

// Инициализация корзины
function initCart() {
    updateCartCount();
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