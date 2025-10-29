// script.js – FINAL: View More/Less + Go to Cart + Amazon Images
const PHONE_NUMBER = '9545690700';
const API_BASE = '/api';
const CLOUDINARY_CLOUD = 'ddktvfhsb';
const CLOUDINARY_PRESET = 'itechsolution';

let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let isAdminAuthenticated = false;

// === ADMIN AUTH ===
async function loginAdmin(username, password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
        isAdminAuthenticated = true;
        showToast('Login successful!', 'success');
        checkAdminAuth();
    } else {
        showToast('Invalid credentials.', 'error');
    }
}

function checkAdminAuth() {
    const login = document.getElementById('admin-login');
    const panel = document.getElementById('admin-panel');
    if (!login || !panel) return;

    if (isAdminAuthenticated) {
        login.classList.add('d-none');
        panel.classList.remove('d-none');
        loadProducts();
    } else {
        login.classList.remove('d-none');
        panel.classList.add('d-none');
    }
}

// Login form
document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value;
    loginAdmin(u, p);
});

// Logout
document.getElementById('admin-logout')?.addEventListener('click', () => {
    isAdminAuthenticated = false;
    showToast('Logged out.', 'success');
    checkAdminAuth();
});

// === FETCH PRODUCTS ===
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to load');
        products = await res.json();
        renderAll();
    } catch (err) {
        showToast('Error loading products.', 'error');
        console.error(err);
    }
}

// === RENDER ALL VIEWS ===
function renderAll() {
    if (document.getElementById('featured-products')) {
        displayProducts(document.getElementById('featured-products'), products, false, true);
    }
    if (document.getElementById('product-list')) {
        displayProducts(document.getElementById('product-list'), products);
    }
    if (document.getElementById('admin-product-list') && isAdminAuthenticated) {
        displayProducts(document.getElementById('admin-product-list'), products, true);
    }
    if (document.getElementById('cart-items')) displayCart();
}

// === DISPLAY PRODUCTS WITH VIEW MORE/LESS ===
function displayProducts(container, list, isAdmin = false, isFeatured = false) {
    if (!container) return;
    container.innerHTML = '';
    let displayList = isFeatured ? list.slice(0, 3) : list;

    if (displayList.length === 0) {
        container.innerHTML = '<div class="list-group-item text-muted text-center">No products available.</div>';
        return;
    }

    displayList.forEach(product => {
        const item = document.createElement('div');
        const images = product.images || [];
        const inCart = cart.find(i => i.id === product.id);
        const quantity = inCart ? inCart.quantity : 0;

        // Truncate description for preview (max 100 chars)
        const shortDesc = product.description.length > 100 
            ? product.description.substring(0, 100) + '...' 
            : product.description;

        if (isFeatured) {
            item.className = 'col';
            item.innerHTML = `
                <div class="product-card card h-100 border-0 shadow">
                    <div id="carousel-${product.id}" class="carousel slide" style="height:300px;">
                        <div class="carousel-inner h-100">
                            ${images.length > 0 ? images.map((img, i) => `
                                <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                                    <img src="${img}" alt="${product.name}" class="d-block w-100 h-100" style="object-fit:contain;background:#fff;padding:1rem;">
                                </div>
                            `).join('') : `<div class="carousel-item active h-100">
                                <img src="https://picsum.photos/300/300?random=${product.id}" alt="${product.name}" class="d-block w-100 h-100" style="object-fit:contain;background:#fff;padding:1rem;">
                            </div>`}
                        </div>
                        ${images.length > 1 ? `
                            <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="next">
                                <span class="carousel-control-next-icon"></span>
                            </button>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title mb-1">${product.name}</h5>
                        <p class="text-muted mb-1">Type: ${product.type.charAt(0).toUpperCase() + product.type.slice(1)}</p>
                        <p class="price mb-1">
                            ${product.discount 
                                ? `<strong class="text-success">${product.discount} Rs</strong> <del class="text-muted small">${product.price} Rs</del>`
                                : `<strong>${product.price} Rs</strong>`
                            }
                        </p>
                        <p class="text-muted mb-2 desc-text" style="font-size:0.9rem;">
                            <span class="short-desc">${shortDesc}</span>
                            ${product.description.length > 100 ? `
                                <span class="full-desc d-none">${product.description}</span>
                                <a href="#" class="text-primary view-more" style="font-size:0.8rem;">View More</a>
                            ` : ''}
                        </p>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-outline-primary flex-fill add-to-cart-btn" data-id="${product.id}">
                                ${quantity > 0 ? `Added (${quantity})` : 'Add to Cart'}
                            </button>
                            ${quantity > 0 ? `<a href="/cart.html" class="btn btn-primary flex-fill">Go to Cart</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            item.classList.add('product-card', 'list-group-item', 'd-flex', 'align-items-center', 'p-3');
            item.innerHTML = `
                <div class="image-container me-3">
                    <div id="carousel-${product.id}" class="carousel slide" style="width:120px;height:120px;border:1px solid #dee2e6;border-radius:0.5rem;overflow:hidden;">
                        <div class="carousel-inner h-100">
                            ${images.length > 0 ? images.map((img, i) => `
                                <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                                    <img src="${img}" alt="${product.name}" class="d-block w-100 h-100" style="object-fit:contain;background:#fff;padding:0.5rem;">
                                </div>
                            `).join('') : `<div class="carousel-item active h-100">
                                <img src="https://picsum.photos/120/120?random=${product.id}" alt="${product.name}" class="d-block w-100 h-100" style="object-fit:contain;background:#fff;padding:0.5rem;">
                            </div>`}
                        </div>
                        ${images.length > 1 ? `
                            <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="next">
                                <span class="carousel-control-next-icon"></span>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="flex-grow-1">
                    <h5 class="mb-1">${product.name}</h5>
                    <p class="text-muted mb-1">Type: ${product.type.charAt(0).toUpperCase() + product.type.slice(1)}</p>
                    <p class="price mb-1">
                        ${product.discount 
                            ? `<strong class="text-success">${product.discount} Rs</strong> <del class="text-muted small">${product.price} Rs</del>`
                            : `<strong>${product.price} Rs</strong>`
                        }
                    </p>
                    <p class="text-muted mb-0 desc-text" style="font-size:0.9rem;">
                        <span class="short-desc">${shortDesc}</span>
                        ${product.description.length > 100 ? `
                            <span class="full-desc d-none">${product.description}</span>
                            <a href="#" class="text-primary view-more" style="font-size:0.8rem;">View More</a>
                        ` : ''}
                    </p>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-outline-primary add-to-cart-btn" data-id="${product.id}">
                        ${quantity > 0 ? `Added (${quantity})` : 'Add'}
                    </button>
                    ${quantity > 0 ? `<a href="/cart.html" class="btn btn-primary">Go to Cart</a>` : ''}
                </div>
            `;

            if (isAdmin) {
                const actions = document.createElement('div');
                actions.className = 'd-flex gap-2 ms-3';
                const edit = document.createElement('button');
                edit.className = 'btn btn-outline-primary';
                edit.innerHTML = 'Edit';
                edit.onclick = () => editProduct(product.id);
                const del = document.createElement('button');
                del.className = 'btn btn-outline-danger';
                del.innerHTML = 'Delete';
                del.onclick = () => deleteProduct(product.id);
                actions.appendChild(edit);
                actions.appendChild(del);
                item.querySelector('.d-flex.gap-2').appendChild(actions);
            }
        }
        container.appendChild(item);
    });

    // === VIEW MORE / VIEW LESS TOGGLE ===
    document.querySelectorAll('.view-more').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const parent = link.parentElement;
            const short = parent.querySelector('.short-desc');
            const full = parent.querySelector('.full-desc');
            if (full.classList.contains('d-none')) {
                short.classList.add('d-none');
                full.classList.remove('d-none');
                link.textContent = 'View Less';
            } else {
                short.classList.remove('d-none');
                full.classList.add('d-none');
                link.textContent = 'View More';
            }
        };
    });

    // === ADD TO CART BUTTONS ===
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = () => addToCart(parseInt(btn.dataset.id));
    });
}

// === ADD TO CART (UPDATE BUTTON + SHOW GO TO CART) ===
function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p) return showToast('Product not found.', 'error');

    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ id, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`${p.name} added!`, 'success');

    // Update all "Add to Cart" buttons
    document.querySelectorAll(`.add-to-cart-btn[data-id="${id}"]`).forEach(btn => {
        const qty = cart.find(i => i.id === id).quantity;
        btn.textContent = `Added (${qty})`;
        btn.classList.replace('btn-outline-primary', 'btn-success');
        
        if (!btn.parentElement.querySelector('a[href="/cart.html"]')) {
            const goToCart = document.createElement('a');
            goToCart.href = '/cart.html';
            goToCart.className = 'btn btn-primary';
            goToCart.textContent = 'Go to Cart';
            btn.parentElement.appendChild(goToCart);
        }
    });

    if (document.getElementById('cart-items')) displayCart();
}

// === CART DISPLAY ===
function displayCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';
    let subtotal = 0;

    cart = cart.filter(item => {
        const exists = products.find(p => p.id === item.id);
        if (!exists) return false;
        return true;
    });
    localStorage.setItem('cart', JSON.stringify(cart));

    cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        const img = (p.images?.[0]) || 'https://picsum.photos/100?random=0';
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item list-group-item d-flex align-items-center p-3';
        cartItem.innerHTML = `
            <img src="${img}" alt="${p.name}" style="width:90px;height:90px;object-fit:contain;background:#fff;border:1px solid #dee2e6;border-radius:0.5rem;padding:0.5rem;margin-right:1rem;">
            <div class="flex-grow-1">
                <h5 class="mb-1">${p.name}</h5>
                <p class="text-muted mb-1">
                    Price: 
                    ${p.discount 
                        ? `<strong class="text-success">${p.discount} Rs</strong> <del class="text-muted small">${p.price} Rs</del>`
                        : `<strong>${p.price} Rs</strong>`
                    }
                </p>
                <p class="text-muted mb-0">Qty: <input type="number" value="${item.quantity}" min="1" class="form-control d-inline-block w-auto"></p>
            </div>
            <button class="btn btn-outline-danger">Remove</button>
        `;
        cartItem.querySelector('input').onchange = e => updateQuantity(item.id, e.target.value);
        cartItem.querySelector('button').onclick = () => removeFromCart(item.id);
        container.appendChild(cartItem);
        subtotal += (p.discount || p.price) * item.quantity;
    });

    if (cart.length === 0) {
        container.innerHTML = '<div class="list-group-item text-muted text-center">Your cart is empty.</div>';
    }
    calculateTotal(subtotal);
}

// === UPDATE & REMOVE ===
function updateQuantity(id, qty) {
    qty = parseInt(qty);
    if (qty < 1) return showToast('Invalid quantity.', 'error');
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = qty;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        renderAll();
    }
}

function removeFromCart(id) {
    const p = products.find(x => x.id === id);
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`${p?.name || 'Item'} removed.`, 'success');
    displayCart();
    renderAll();
}

// === CALCULATE TOTAL ===
function calculateTotal(subtotal) {
    const state = document.getElementById('state')?.value;
    const pickup = document.getElementById('pickup')?.checked;
    const goa = document.getElementById('goa-pickup');
    const charge = document.getElementById('shipping-charge');
    const total = document.getElementById('total');
    if (!charge || !total) return;

    let shipping = 300;
    if (state === 'Goa') {
        goa?.classList.replace('d-none', 'd-block');
        shipping = pickup ? 0 : 200;
    } else {
        goa?.classList.replace('d-block', 'd-none');
        shipping = 300;
    }
    charge.textContent = shipping;
    total.textContent = subtotal + shipping;
}

// === ORDER BUTTONS ===
document.getElementById('order-call')?.addEventListener('click', () => {
    const addr = document.getElementById('address')?.value.trim();
    const state = document.getElementById('state')?.value;
    if (!addr || !state || cart.length === 0) return showToast('Fill details.', 'error');
    window.location.href = `tel:${PHONE_NUMBER}`;
});

document.getElementById('order-whatsapp')?.addEventListener('click', () => {
    const addr = document.getElementById('address')?.value.trim();
    const state = document.getElementById('state')?.value;
    if (!addr || !state || cart.length === 0) return showToast('Fill details.', 'error');
    const details = cart.map(i => {
        const p = products.find(x => x.id === i.id);
        return `${p.name} x ${i.quantity} (${(p.discount || p.price) * i.quantity} Rs)`;
    }).join('\n');
    const pickup = state === 'Goa' && document.getElementById('pickup')?.checked ? ' (Pickup)' : '';
    const msg = `Order:\n${details}\n\nAddress: ${addr}, ${state}${pickup}\nTotal: ${document.getElementById('total').textContent} Rs`;
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
});

// === ADMIN: IMAGE PREVIEW ===
document.getElementById('images')?.addEventListener('change', e => {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
        if (file.size > 1048576) return showToast('Image too large.', 'error');
        const reader = new FileReader();
        reader.onload = ev => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.style.cssText = 'width:100px;height:100px;object-fit:contain;background:#fff;border:1px solid #dee2e6;border-radius:0.5rem;padding:0.5rem;margin:4px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// === ADMIN: SAVE PRODUCT ===
document.getElementById('save-product')?.addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('name').value.trim();
    const type = document.getElementById('type').value;
    const price = +document.getElementById('price').value;
    const discount = document.getElementById('discount').value ? +document.getElementById('discount').value : null;
    const description = document.getElementById('description').value.trim();
    const files = document.getElementById('images').files;
    const existingImages = document.getElementById('existing-images').value || '[]';

    if (!name || !type || !price || !description) {
        showToast('Fill all required fields', 'error');
        return;
    }

    let images = JSON.parse(existingImages);

    for (let file of files) {
        if (file.size > 1 * 1024 * 1024) {
            showToast('Image too large (max 1MB)', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                images.push(data.secure_url);
            }
        } catch (err) {
            showToast('Image upload failed', 'error');
            return;
        }
    }

    const product = { name, type, price, discount, description, images };
    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });

    if (res.ok) {
        showToast(id ? 'Updated!' : 'Added!', 'success');
        loadProducts();
        clearAdminForm();
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    } else {
        const err = await res.json();
        showToast(err.error || 'Save failed', 'error');
    }
});

function clearAdminForm() {
    ['edit-id', 'name', 'type', 'price', 'discount', 'description', 'images', 'existing-images'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('image-preview').innerHTML = '';
}

function editProduct(id) {
    const p = products.find(x => x.id === parseInt(id));
    if (!p) return;
    document.getElementById('edit-id').value = p.id;
    document.getElementById('name').value = p.name;
    document.getElementById('type').value = p.type;
    document.getElementById('price').value = p.price;
    document.getElementById('discount').value = p.discount || '';
    document.getElementById('description').value = p.description;
    document.getElementById('existing-images').value = JSON.stringify(p.images || []);
    document.getElementById('productModalLabel').textContent = 'Edit Product';

    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    (p.images || []).forEach(img => {
        const el = document.createElement('img');
        el.src = img;
        el.style.cssText = 'width:100px;height:100px;object-fit:contain;background:#fff;border:1px solid #dee2e6;border-radius:0.5rem;padding:0.5rem;margin:4px;';
        preview.appendChild(el);
    });
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function deleteProduct(id) {
    showConfirmToast('Delete product?', async () => {
        try {
            const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Deleted.', 'success');
                loadProducts();
            }
        } catch (err) {
            showToast('Delete failed.', 'error');
        }
    });
}

// === FILTERS & SEARCH ===
if (document.getElementById('search')) {
    const apply = () => {
        let list = products.filter(p => p.name.toLowerCase().includes(document.getElementById('search').value.toLowerCase()));
        if (document.getElementById('type-filter').value) {
            list = list.filter(p => p.type === document.getElementById('type-filter').value);
        }
        const sort = document.getElementById('sort').value;
        if (sort === 'price-asc') list.sort((a,b) => (a.discount||a.price) - (b.discount||b.price));
        else if (sort === 'price-desc') list.sort((a,b) => (b.discount||b.price) - (a.discount||a.price));
        else if (sort === 'name-asc') list.sort((a,b) => a.name.localeCompare(b.name));
        else if (sort === 'name-desc') list.sort((a,b) => b.name.localeCompare(b.name));
        displayProducts(document.getElementById('product-list'), list);
    };
    ['search', 'type-filter', 'sort'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', apply);
    });
    apply();
}

if (document.getElementById('home-search')) {
    document.getElementById('home-search').addEventListener('input', e => {
        window.location.href = `/products.html?search=${encodeURIComponent(e.target.value)}`;
    });
}

// === TOASTS ===
function createToastContainer() {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'success') {
    const toastContainer = createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function showConfirmToast(message, onConfirm, onCancel) {
    const toastContainer = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast confirm';
    toast.innerHTML = `
        <p>${message}</p>
        <div class="confirm-buttons">
            <button class="confirm-yes">Yes</button>
            <button class="confirm-no">No</button>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);

    toast.querySelector('.confirm-yes').onclick = () => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); onConfirm(); }, 400);
    };
    toast.querySelector('.confirm-no').onclick = () => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); if (onCancel) onCancel(); }, 400);
    };
}

// === INIT ===
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', checkAdminAuth);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        loadProducts();
        setTimeout(() => {
            document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.onclick = () => addToCart(parseInt(btn.dataset.id));
            });
        }, 500);
    });
}

if (document.getElementById('state')) {
    document.getElementById('state').onchange = displayCart;
    document.getElementById('pickup')?.addEventListener('change', displayCart);
}