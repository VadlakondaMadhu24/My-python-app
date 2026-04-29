// DOM Elements
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const confirmationModal = document.getElementById('confirmationModal');
const continueBtn = document.getElementById('continueBtn');
const productsGrid = document.getElementById('productsGrid');
const categoryFilters = document.getElementById('categoryFilters');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.querySelector('.search-btn');

// Data
let medicines = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMedicines();
    loadCategories();
    updateCartDisplay();
    setupEventListeners();
});

// Load medicines from API
async function loadMedicines() {
    try {
        const response = await fetch('/api/medicines');
        medicines = await response.json();
        displayMedicines(medicines);
    } catch (error) {
        console.error('Error loading medicines:', error);
        displayMedicines([]);
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display medicines in grid
function displayMedicines(items) {
    productsGrid.innerHTML = '';
    
    if (items.length === 0) {
        productsGrid.innerHTML = '<p class="no-results">No medicines found</p>';
        return;
    }

    items.forEach((medicine, index) => {
        const medicineCard = document.createElement('div');
        medicineCard.className = 'product-card';
        medicineCard.style.animationDelay = `${index * 0.1}s`;
        
        // Use Unsplash images based on category
        const imageUrls = {
            'Pain Relief': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=400&h=200&fit=crop',
            'Cold & Cough': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=400&h=200&fit=crop',
            'Allergies': 'https://images.unsplash.com/photo-1516549655201-750a172e7d67?w=400&h=200&fit=crop',
            'Vitamins': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=200&fit=crop',
            'Digestive': 'https://images.unsplash.com/photo-1584308666744-24d5f400f628?w=400&h=200&fit=crop'
        };

        const imageUrl = imageUrls[medicine.category] || 'https://images.unsplash.com/photo-1587854692152-cbe660dbde0f?w=400&h=200&fit=crop';

        medicineCard.innerHTML = `
            <img src="${imageUrl}" alt="${medicine.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x200?text=${encodeURIComponent(medicine.name)}'">
            <div class="product-info">
                <div class="product-category">${medicine.category}</div>
                <div class="product-name">${medicine.name}</div>
                <div class="product-description">${medicine.description}</div>
                <div class="product-price">$${medicine.price.toFixed(2)}</div>
                <div class="product-stock">Stock: ${medicine.stock} available</div>
                <form class="add-to-cart-form" onsubmit="addToCart(event, ${medicine.id})">
                    <input type="number" class="quantity-input" value="1" min="1" max="${medicine.stock}" required>
                    <button type="submit" class="add-btn" ${medicine.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> ${medicine.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                </form>
            </div>
        `;
        productsGrid.appendChild(medicineCard);
    });
}

// Display categories
function displayCategories(cats) {
    categoryFilters.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'All Medicines';
    allBtn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        allBtn.classList.add('active');
        displayMedicines(medicines);
    };
    categoryFilters.appendChild(allBtn);

    cats.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = category;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterByCategory(category);
        };
        categoryFilters.appendChild(btn);
    });
}

// Filter medicines by category
function filterByCategory(category) {
    const filtered = medicines.filter(m => m.category === category);
    displayMedicines(filtered);
}

// Search medicines
function searchMedicines(query) {
    const filtered = medicines.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
    );
    displayMedicines(filtered);
}

// Add to cart
function addToCart(event, medicineId) {
    event.preventDefault();
    
    const form = event.target;
    const quantity = parseInt(form.querySelector('.quantity-input').value);
    const medicine = medicines.find(m => m.id === medicineId);
    
    if (!medicine) return;

    const existingItem = cart.find(item => item.id === medicineId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: medicine.id,
            name: medicine.name,
            price: medicine.price,
            quantity: quantity,
            category: medicine.category
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showNotification(`${medicine.name} added to cart!`);
}

// Update cart display
function updateCartDisplay() {
    cartBadge.textContent = cart.length;
    displayCartItems();
}

// Display cart items
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('checkoutBtn').disabled = true;
        document.getElementById('subtotal').textContent = '$0.00';
        document.getElementById('tax').textContent = '$0.00';
        document.getElementById('total').textContent = '$0.00';
        return;
    }

    document.getElementById('checkoutBtn').disabled = false;

    let subtotal = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">−</button>
                <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                <span style="margin: 0 10px; font-weight: bold;">$${itemTotal.toFixed(2)}</span>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
}

// Update quantity
function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Setup event listeners
function setupEventListeners() {
    cartBtn.addEventListener('click', () => {
        cartModal.classList.add('active');
    });

    closeCartBtn.addEventListener('click', () => {
        cartModal.classList.remove('active');
    });

    checkoutBtn.addEventListener('click', () => {
        cartModal.classList.remove('active');
        checkoutModal.classList.add('active');
    });

    closeCheckoutBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
    });

    checkoutForm.addEventListener('submit', handleCheckout);

    continueBtn.addEventListener('click', () => {
        confirmationModal.classList.remove('active');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        location.href = '#';
    });

    searchBtn.addEventListener('click', () => {
        searchMedicines(searchInput.value);
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchMedicines(searchInput.value);
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.classList.remove('active');
        if (e.target === checkoutModal) checkoutModal.classList.remove('active');
        if (e.target === confirmationModal) confirmationModal.classList.remove('active');
    });
}

// Handle checkout
async function handleCheckout(event) {
    event.preventDefault();

    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerAddress = document.getElementById('customerAddress').value;

    if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                address: customerAddress
            })
        });

        const order = await response.json();
        
        checkoutModal.classList.remove('active');
        displayOrderConfirmation(order);
        confirmationModal.classList.add('active');
    } catch (error) {
        console.error('Checkout error:', error);
        alert('An error occurred during checkout. Please try again.');
    }
}

// Display order confirmation
function displayOrderConfirmation(order) {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <div class="order-detail-row">
            <span class="order-detail-label">Order ID:</span>
            <span class="order-detail-value">${order.order_id}</span>
        </div>
        <div class="order-detail-row">
            <span class="order-detail-label">Customer:</span>
            <span class="order-detail-value">${order.customer_name}</span>
        </div>
        <div class="order-detail-row">
            <span class="order-detail-label">Email:</span>
            <span class="order-detail-value">${order.customer_email}</span>
        </div>
        <div class="order-detail-row">
            <span class="order-detail-label">Total Amount:</span>
            <span class="order-detail-value">$${order.total.toFixed(2)}</span>
        </div>
        <div class="order-detail-row">
            <span class="order-detail-label">Order Date:</span>
            <span class="order-detail-value">${order.date}</span>
        </div>
        <div class="order-detail-row">
            <span class="order-detail-label">Status:</span>
            <span class="order-detail-value" style="color: #27ae60; font-weight: bold;">${order.status}</span>
        </div>
    `;
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(90deg, #27ae60, #229954);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease;
        z-index: 3000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to { opacity: 0; transform: translateY(-20px); }
    }
    
    .empty-cart {
        text-align: center;
        color: #999;
        padding: 30px;
        font-size: 1.1rem;
    }
    
    .no-results {
        text-align: center;
        color: #999;
        padding: 40px;
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(style);