
let db = null;
const DB_NAME = 'FloraDreamDB';
const DB_VERSION = 2;

// Инициализация базы данных
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Ошибка открытия базы данных:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('База данных успешно открыта');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Создаем хранилище для товаров
            if (!database.objectStoreNames.contains('products')) {
                const productsStore = database.createObjectStore('products', { keyPath: 'id' });
                productsStore.createIndex('category_id', 'category_id', { unique: false });
                productsStore.createIndex('popularity', 'popularity', { unique: false });
            }
            
            // Создаем хранилище для категорий
            if (!database.objectStoreNames.contains('categories')) {
                const categoriesStore = database.createObjectStore('categories', { keyPath: 'id' });
            }
            
            // Создаем хранилище для заказов
            if (!database.objectStoreNames.contains('orders')) {
                const ordersStore = database.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
                ordersStore.createIndex('created_at', 'created_at', { unique: false });
            }
            
            // Создаем хранилище для элементов заказа
            if (!database.objectStoreNames.contains('order_items')) {
                const orderItemsStore = database.createObjectStore('order_items', { keyPath: 'id', autoIncrement: true });
                orderItemsStore.createIndex('order_id', 'order_id', { unique: false });
                orderItemsStore.createIndex('product_id', 'product_id', { unique: false });
            }
            
            console.log('Структура базы данных создана');
        };
    });
}

// Добавление тестовых данных
async function addTestData() {
    try {
        // Проверяем, есть ли уже данные
        const categoriesCount = await getCount('categories');
        
        if (categoriesCount === 0) {
            // Добавляем категории
            const categories = [
                {id: 1, name: 'Букеты', image_url: 'images/categories/buketi.jpg'},
                {id: 2, name: 'Розы', image_url: 'images/categories/rose.jpg'},
                {id: 3, name: 'Свадебные', image_url: 'images/categories/svadebnie.jpg'},
                {id: 4, name: 'Комнатные растения', image_url: 'images/categories/home.jpg'}
            ];
            
            for (const category of categories) {
                await addItem('categories', category);
            }
            
            // Добавляем товары
            const products = [
                {
                    id: 1,
                    name: "Букет розовых роз",
                    price: 3500,
                    image_url: "https://content2.flowwow-images.com/data/flowers/1000x1000/44/1649331863_66814544.jpg",
                    category_id: 1,
                    description: "Нежный букет из 25 розовых роз",
                    popularity: 15
                },
                {
                    id: 2,
                    name: "Букет красных тюльпанов",
                    price: 2500,
                    image_url: "https://avatars.mds.yandex.net/get-mpic/4866035/img_id92981539038390560.jpeg/orig",
                    category_id: 1,
                    description: "Яркий букет из 15 красных тюльпанов",
                    popularity: 12
                },
                {
                    id: 3,
                    name: "Свадебный букет невесты",
                    price: 5500,
                    image_url: "https://avatars.mds.yandex.net/i?id=6525eb09ba3e271346208d45ab9a0451_l-16466495-images-thumbs&n=13",
                    category_id: 3,
                    description: "Элегантный свадебный букет из белых роз и орхидей",
                    popularity: 8
                },
                {
                    id: 4,
                    name: "Букет полевых цветов",
                    price: 2800,
                    image_url: "https://ybis.ru/wp-content/uploads/2023/09/polevoi-buket-3-1.webp",
                    category_id: 1,
                    description: "Романтичный букет из полевых цветов",
                    popularity: 18
                },
                {
                    id: 5,
                    name: "Орхидея в горшке",
                    price: 3200,
                    image_url: "https://avatars.mds.yandex.net/get-mpic/12200529/2a0000018fca126d25cba3088ae7d4dc11ef/orig",
                    category_id: 4,
                    description: "Красивая орхидея фаленопсис в керамическом горшке",
                    popularity: 20
                },
                {
                    id: 6,
                    name: "Букет из 101 розы",
                    price: 10100,
                    image_url: "https://avatars.mds.yandex.net/get-mpic/3631580/img_id3599273571989257838.jpeg/orig",
                    category_id: 2,
                    description: "Роскошный букет из 101 красной розы",
                    popularity: 5
                },
                {
                    id: 7,
                    name: "Букет невесты с каллами",
                    price: 4800,
                    image_url: "https://i.pinimg.com/550x/5b/36/f6/5b36f60f70621297842930180b05b05b.jpg",
                    category_id: 3,
                    description: "Элегантный свадебный букет с белыми каллами",
                    popularity: 7
                },
                {
                    id: 8,
                    name: "Фикус Бенджамина",
                    price: 2200,
                    image_url: "https://avatars.mds.yandex.net/get-mpic/13448948/2a0000019267791b7c7bda5e165b7ced86d8/orig",
                    category_id: 4,
                    description: "Красивое комнатное растение для вашего интерьера",
                    popularity: 25
                }
            ];
            
            for (const product of products) {
                await addItem('products', product);
            }
            
            console.log('Тестовые данные добавлены');
        }
    } catch (error) {
        console.error('Ошибка добавления тестовых данных:', error);
    }
}

// Общие функции для работы с IndexedDB

// Получить количество записей в хранилище
function getCount(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Добавить элемент в хранилище
function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Получить все элементы из хранилища
function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Получить элемент по ID
function getItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Обновить элемент в хранилище
function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Удалить элемент из хранилище
function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Специфические функции для приложения

// Получение всех товаров
async function getAllProducts() {
    try {
        const products = await getAllItems('products');
        const categories = await getAllItems('categories');
        
        // Добавляем названия категорий к товарам
        return products.map(product => {
            const category = categories.find(c => c.id === product.category_id);
            return {
                ...product,
                category_name: category ? category.name : 'Неизвестно'
            };
        });
    } catch (error) {
        console.error('Ошибка получения товаров:', error);
        throw error;
    }
}

// Получение товаров по категории
async function getProductsByCategory(categoryId) {
    try {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const index = store.index('category_id');
        const request = index.getAll(categoryId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = async () => {
                const products = request.result;
                const categories = await getAllItems('categories');
                
                // Добавляем названия категорий к товарам
                const result = products.map(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    return {
                        ...product,
                        category_name: category ? category.name : 'Неизвестно'
                    };
                });
                
                resolve(result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Ошибка получения товаров по категории:', error);
        throw error;
    }
}

// Получение товара по ID
async function getProductById(id) {
    try {
        const product = await getItem('products', id);
        if (!product) return null;
        
        const categories = await getAllItems('categories');
        const category = categories.find(c => c.id === product.category_id);
        
        return {
            ...product,
            category_name: category ? category.name : 'Неизвестно'
        };
    } catch (error) {
        console.error('Ошибка получения товара:', error);
        throw error;
    }
}

// Получение всех категорий
function getAllCategories() {
    return getAllItems('categories');
}

// Создание заказа
async function createOrder(orderData, items) {
    try {
        // Создаем заказ
        const order = {
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            customer_email: orderData.customer_email,
            delivery_address: orderData.delivery_address,
            delivery_date: orderData.delivery_date,
            delivery_time: orderData.delivery_time,
            payment_method: orderData.payment_method,
            notes: orderData.notes,
            total_amount: orderData.total_amount,
            status: 'new',
            created_at: new Date()
        };
        
        const orderId = await addItem('orders', order);
        
        // Добавляем элементы заказа
        for (const item of items) {
            const orderItem = {
                order_id: orderId,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            };
            
            await addItem('order_items', orderItem);
            
            // Увеличиваем популярность товара
            const product = await getItem('products', item.id);
            if (product) {
                product.popularity = (product.popularity || 0) + 1;
                await updateItem('products', product);
            }
        }
        
        return orderId;
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        throw error;
    }
}

// Получение заказов
function getOrders() {
    return getAllItems('orders');
}