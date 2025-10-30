// script.js – FINAL: HOME SEARCH FULLY FIXED + ALL FEATURES WORKING
const PHONE_NUMBER = '9545690700';
const API_BASE = '/api';
const CLOUDINARY_CLOUD = 'ddktvfhsb';
const CLOUDINARY_PRESET = 'itechsolution';

let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let isAdminAuthenticated = false;
let searchTimer; // GLOBAL TIMER FOR LIVE SEARCH

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

document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('admin-username').value.trim();
    const p = document.getElementById('admin-password').value;
    loginAdmin(u, p);
});

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

// === DISPLAY PRODUCTS ===
function displayProducts(container, list, isAdmin = false, isFeatured = false) {
    if (!container) return;
    container.innerHTML = '';
    let displayList = isFeatured ? list.slice(0, 3) : list;

    if (displayList.length === 0) {
        const searchTerm = document.getElementById('search')?.value.trim() || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';
        let message = 'No products found.';

        if (searchTerm || typeFilter) {
            const suggestions = {
                laptop: ['Dell', 'HP', 'Lenovo', 'Asus'],
                mobile: ['iPhone', 'Samsung', 'OnePlus', 'Xiaomi'],
                printer: ['HP', 'Canon', 'Epson'],
                accessory: ['Charger', 'Case', 'Earphones']
            };

            const term = searchTerm.toLowerCase();
            const type = typeFilter || (term.includes('laptop') ? 'laptop' : term.includes('mobile') ? 'mobile' : term.includes('printer') ? 'printer' : 'accessory');
            const suggestionsList = suggestions[type] || suggestions.laptop;

            const randomSuggestions = suggestionsList.sort(() => 0.5 - Math.random()).slice(0, 3);
            message = `No ${typeFilter || 'results'} found for "<strong>${searchTerm || 'your search'}</strong>".<br>
                       Try: <strong>${randomSuggestions.join('</strong>, <strong>')}</strong>`;
        }

        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search display-1 text-muted mb-3"></i>
                <p class="lead text-muted">${message}</p>
                <a href="/products.html" class="btn btn-outline-primary btn-sm">Clear Filters</a>
            </div>
        `;
        return;
    }

    displayList.forEach(product => {
        const item = document.createElement('div');
        const images = product.images || [];
        const inCart = cart.find(i => i.id === product.id);
        const quantity = inCart ? inCart.quantity : 0;
        const shortDesc = product.description.length > 80 
            ? product.description.substring(0, 80) + '...' 
            : product.description;

        if (isFeatured) {
            item.className = 'col-12 col-sm-6 col-md-4';
            item.innerHTML = `
                <div class="featured-card card h-100" style="cursor: pointer;" onclick="window.location.href='/productview.html?id=${product.id}'">
                    <div class="product-image-wrapper position-relative bg-white rounded overflow-hidden" style="height:140px;">
                        ${images.length > 0 ? `
                            <img src="${images[0]}" alt="${product.name}" class="w-100 h-100 object-fit-contain p-2">
                            ${images.length > 1 ? `<span class="position-absolute top-0 end-0 bg-primary text-white small px-2 py-1 rounded-start">+${images.length - 1}</span>` : ''}
                        ` : `<div class="d-flex align-items-center justify-content-center h-100 text-muted"><i class="bi bi-image fs-1"></i></div>`}
                    </div>
                    <div class="card-body d-flex flex-column p-3">
                        <h5 class="card-title mb-1" style="font-size:0.85rem;font-weight:600;line-height:1.3;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden;">
                            ${product.name}
                        </h5>
                        <p class="text-muted mb-1" style="font-size:0.7rem;">Type: ${product.type.charAt(0).toUpperCase() + product.type.slice(1)}</p>
                        <p class="price mb-2" style="font-size:0.9rem;font-weight:700;color:#198754;">
                            ${product.discount 
                                ? `<strong>${product.discount} Rs</strong> <del style="color:#999;font-size:0.75rem;">${product.price} Rs</del>`
                                : `<strong>${product.price} Rs</strong>`
                            }
                        </p>
                        <p class="text-muted mb-2 desc-text" style="font-size:0.7rem;color:#666;line-height:1.3;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden;flex-grow:1;">
                            <span class="short-desc">${shortDesc}</span>
                            ${product.description.length > 80 ? `
                                <span class="full-desc d-none">${product.description}</span>
                                <a href="/productview.html?id=${product.id}" class="text-primary view-more" style="font-size:0.65rem;padding:0;" onclick="event.stopPropagation();">View More</a>
                            ` : ''}
                        </p>
                        <div class="mt-auto d-grid gap-2 d-md-flex" onclick="event.stopPropagation();">
                            <button class="btn btn-outline-primary btn-sm add-to-cart-btn flex-fill" data-id="${product.id}" style="font-size:0.7rem;padding:0.35rem 0.6rem;">
                                ${quantity > 0 ? `Added (${quantity})` : 'Add to Cart'}
                            </button>
                            ${quantity > 0 ? `<a href="/cart.html" class="btn btn-primary btn-sm flex-fill" style="font-size:0.75rem;">Go to Cart</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            item.className = 'list-group-item p-3 p-md-4';
            item.style.cursor = 'pointer';
            item.onclick = (e) => {
                if (!e.target.closest('button, a')) {
                    window.location.href = `/productview.html?id=${product.id}`;
                }
            };
            item.innerHTML = `
                <div class="row align-items-center g-3">
                    <div class="col-4 col-md-3 col-lg-2">
                        <div class="carousel slide" id="carousel-${product.id}" style="height:100px;">
                            <div class="carousel-inner h-100">
                                ${images.length > 0 ? images.map((img, i) => `
                                    <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                                        <img src="${img}" alt="${product.name}" class="d-block w-100 h-100 object-fit-contain p-2 bg-white rounded">
                                    </div>
                                `).join('') : `<div class="carousel-item active h-100">
                                    <img src="https://picsum.photos/120/120?random=${product.id}" alt="${product.name}" class="d-block w-100 h-100 object-fit-contain p-2 bg-white rounded">
                                </div>`}
                            </div>
                            ${images.length > 1 ? `
                                <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="prev" onclick="event.stopPropagation();">
                                    <span class="carousel-control-prev-icon"></span>
                                </button>
                                <button class="carousel-control-next" type="button" data-bs-target="#carousel-${product.id}" data-bs-slide="next" onclick="event.stopPropagation();">
                                    <span class="carousel-control-next-icon"></span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="col-8 col-md-9 col-lg-10">
                        <div class="d-flex flex-column h-100">
                            <h5 class="mb-1 fs-6">${product.name}</h5>
                            <p class="text-muted small mb-1">Type: ${product.type.charAt(0).toUpperCase() + product.type.slice(1)}</p>
                            <p class="price mb-1">
                                ${product.discount 
                                    ? `<strong class="text-success">${product.discount} Rs</strong> <del class="text-muted small">${product.price} Rs</del>`
                                    : `<strong>${product.price} Rs</strong>`
                                }
                            </p>
                            <p class="text-muted small mb-2 desc-text">
                                <span class="short-desc">${shortDesc}</span>
                                ${product.description.length > 80 ? `
                                    <span class="full-desc d-none">${product.description}</span>
                                    <a href="/productview.html?id=${product.id}" class="text-primary view-more fs-7" onclick="event.stopPropagation();">View More</a>
                                ` : ''}
                            </p>
                            <div class="mt-auto d-flex gap-2 flex-wrap" onclick="event.stopPropagation();">
                                <button class="btn btn-outline-primary btn-sm add-to-cart-btn" data-id="${product.id}">
                                    ${quantity > 0 ? `Added (${quantity})` : 'Add'}
                                </button>
                                ${quantity > 0 ? `<a href="/cart.html" class="btn btn-primary btn-sm">Go to Cart</a>` : ''}
                                ${isAdmin ? `
                                    <button class="btn btn-outline-primary btn-sm edit-btn" onclick="event.stopPropagation(); editProduct(${product.id})">Edit</button>
                                    <button class="btn btn-outline-danger btn-sm delete-btn" onclick="event.stopPropagation(); deleteProduct(${product.id})">Delete</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.appendChild(item);
    });

    document.querySelectorAll('.view-more').forEach(link => {
        if (link.href.includes('productview.html')) return;
        link.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
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

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            addToCart(parseInt(btn.dataset.id));
        };
    });
}

// === ADD TO CART ===
function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p) return showToast('Product not found.', 'error');

    const item = cart.find(i => i.id === id);
    if (item) item.quantity++;
    else cart.push({ id, quantity: 1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`${p.name} added!`, 'success');

    document.querySelectorAll(`.add-to-cart-btn[data-id="${id}"]`).forEach(btn => {
        const qty = cart.find(i => i.id === id).quantity;
        btn.textContent = `Added (${qty})`;
        btn.classList.replace('btn-outline-primary', 'btn-success');

        if (!btn.parentElement.querySelector('a[href="/cart.html"]')) {
            const goToCart = document.createElement('a');
            goToCart.href = '/cart.html';
            goToCart.className = 'btn btn-primary btn-sm';
            goToCart.textContent = 'Go to Cart';
            btn.parentElement.appendChild(goToCart);
        }
    });

    if (document.getElementById('cart-items')) displayCart();
}

// === CART DISPLAY + AUTO UPDATE ===
function displayCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';
    let subtotal = 0;

    cart = cart.filter(item => products.find(p => p.id === item.id));
    localStorage.setItem('cart', JSON.stringify(cart));

    if (cart.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">Your cart is empty.</div>';
        calculateTotal(0);
        return;
    }

    cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        const img = (p.images?.[0]) || 'https://picsum.photos/100?random=0';
        const cartItem = document.createElement('div');
        cartItem.className = 'list-group-item p-3 border-bottom';
        cartItem.innerHTML = `
            <div class="row align-items-center g-3">
                <div class="col-4 col-md-3 col-lg-2">
                    <img src="${img}" alt="${p.name}" class="img-fluid rounded" style="height:80px;object-fit:contain;background:#fff;border:1px solid #dee2e6;">
                </div>
                <div class="col-8 col-md-9 col-lg-10">
                    <h6 class="mb-1 fw-semibold">${p.name}</h6>
                    <p class="mb-1 small text-muted">
                        Price: ${p.discount ? `<strong class="text-success">${p.discount} Rs</strong> <del class="text-muted small">${p.price} Rs</del>` : `<strong>${p.price} Rs</strong>`}
                    </p>
                    <div class="d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-center">
                        <div class="d-flex align-items-center gap-2">
                            <label class="small text-muted mb-0">Qty:</label>
                            <input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm" style="width:60px;">
                        </div>
                        <button class="btn btn-outline-danger btn-sm remove-cart-btn">
                            <span class="d-none d-sm-inline">Remove</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        const input = cartItem.querySelector('input');
        const removeBtn = cartItem.querySelector('.remove-cart-btn');
        if (input) input.onchange = e => updateQuantity(item.id, e.target.value);
        if (removeBtn) removeBtn.onclick = () => removeFromCart(item.id);
        container.appendChild(cartItem);
        subtotal += (p.discount || p.price) * item.quantity;
    });

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
    const chargeEl = document.getElementById('shipping-charge');
    const noteEl = document.getElementById('shipping-note');
    const totalEl = document.getElementById('total');

    if (!chargeEl || !totalEl || !noteEl) return;

    let shipping = 300;
    let note = '(Rest of India)';

    if (state === 'Goa') {
        goa?.classList.replace('d-none', 'd-block');
        shipping = pickup ? 0 : 200;
        note = pickup ? '(Free Pickup)' : '(Goa Delivery)';
    } else {
        goa?.classList.replace('d-block', 'd-none');
        shipping = 300;
        note = '(Rest of India)';
    }

    chargeEl.textContent = shipping;
    noteEl.textContent = note;
    totalEl.textContent = subtotal + shipping;
}

// === ORDER VIA WHATSAPP ===
document.getElementById('order-whatsapp')?.addEventListener('click', () => {
    const name = document.getElementById('customer-name')?.value.trim();
    const addr = document.getElementById('address')?.value.trim();
    const state = document.getElementById('state')?.value;
    const pickup = state === 'Goa' && document.getElementById('pickup')?.checked;
    const total = document.getElementById('total')?.textContent;

    if (!name || !addr || !state || cart.length === 0) {
        showToast('Please fill Name, Address & State.', 'error');
        return;
    }

    const items = cart.map(item => {
        const p = products.find(x => x.id === item.id);
        const price = p.discount || p.price;
        return `• ${p.name} × ${item.quantity} = ${price * item.quantity} Rs`;
    }).join('\n');

    const shipping = document.getElementById('shipping-charge').textContent;
    const shippingNote = document.getElementById('shipping-note').textContent;

    const message = `
*NEW ORDER - iTech Solutions*

*Customer Details*
Name: ${name}
Address: ${addr}, ${state}
Delivery: ${pickup ? 'Pickup (Free)' : `Delivery - ${shippingNote}`}

*Order Items*
${items}

*Pricing*
Subtotal: ${total - shipping} Rs
Shipping: ${shipping} Rs ${shippingNote}
*Total: ${total} Rs*
`.trim();

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encoded}`, '_blank');
});

// === ORDER VIA CALL ===
document.getElementById('order-call')?.addEventListener('click', () => {
    const name = document.getElementById('customer-name')?.value.trim();
    const addr = document.getElementById('address')?.value.trim();
    const state = document.getElementById('state')?.value;
    const pickup = state === 'Goa' && document.getElementById('pickup')?.checked;
    const total = document.getElementById('total')?.textContent;

    if (!name || !addr || !state || cart.length === 0) {
        showToast('Please fill Name, Address & State.', 'error');
        return;
    }

    const items = cart.map(item => {
        const p = products.find(x => x.id === item.id);
        return `${p.name} x${item.quantity}`;
    }).join(', ');

    const script = `
NEW ORDER - iTech Solutions

Customer: ${name}
Address: ${addr}, ${state}
Delivery: ${pickup ? 'PICKUP (FREE)' : 'DELIVERY'}

Items: ${items}

Total: ${total} Rs

Please confirm stock and arrange delivery.
`.trim();

    navigator.clipboard.writeText(script).then(() => {
        showToast('Order script copied! Calling...', 'success');
        setTimeout(() => window.location.href = `tel:${PHONE_NUMBER}`, 800);
    }).catch(() => {
        showToast('Calling...', 'success');
        window.location.href = `tel:${PHONE_NUMBER}`;
    });
});

// === AUTO UPDATE ON INPUTS ===
document.getElementById('customer-name')?.addEventListener('input', () => {
    const subtotal = cart.reduce((sum, item) => {
        const p = products.find(x => x.id === item.id);
        return sum + ((p?.discount || p?.price) * item.quantity);
    }, 0);
    calculateTotal(subtotal);
});
document.getElementById('address')?.addEventListener('input', displayCart);
document.getElementById('state')?.addEventListener('change', displayCart);
document.getElementById('pickup')?.addEventListener('change', displayCart);

// === ADMIN: IMAGE PREVIEW, SAVE, EDIT, DELETE ===
document.getElementById('images')?.addEventListener('change', e => {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
        if (file.size > 1048576) return showToast('Image too large.', 'error');
        const reader = new FileReader();
        reader.onload = ev => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            img.className = 'img-thumbnail';
            img.style.cssText = 'width:80px;height:80px;object-fit:contain;margin:4px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

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
            if (data.secure_url) images.push(data.secure_url);
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
        el.className = 'img-thumbnail';
        el.style.cssText = 'width:80px;height:80px;object-fit:contain;margin:4px;';
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

// === FILTERS & SEARCH (PRODUCTS PAGE) ===
if (document.getElementById('search')) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search') || '';
    const searchInput = document.getElementById('search');
    searchInput.value = urlSearch;

    const apply = () => {
        let list = products.filter(p => 
            p.name.toLowerCase().includes(searchInput.value.toLowerCase())
        );
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

// === HERO SEARCH (PRESS ENTER) ===
document.getElementById('hero-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('home-search')?.value.trim();
    if (query) {
        window.location.href = `/products.html?search=${encodeURIComponent(query)}`;
    } else {
        showToast('Please type something to search.', 'error');
    }
});

// === LIVE SEARCH FROM HOME (FIXED & DEBOUNCED) ===
document.getElementById('home-search')?.addEventListener('input', function() {
    const query = this.value.trim();
    clearTimeout(searchTimer);
    if (query.length >= 2) {
        searchTimer = setTimeout(() => {
            window.location.href = `/products.html?search=${encodeURIComponent(query)}`;
        }, 600);
    }
});

// === TOASTS ===
function createToastContainer() {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed; top: 1rem; right: 1rem; z-index: 9999;
            display: flex; flex-direction: column; gap: 0.5rem;
        `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'success') {
    const toastContainer = createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0 shadow-sm`;
    toast.role = 'alert';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
}

function showConfirmToast(message, onConfirm, onCancel) {
    const toastContainer = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center border-0 shadow-lg';
    toast.style.minWidth = '280px';
    toast.innerHTML = `
        <div class="toast-body p-3">
            <p class="mb-3 fw-semibold">${message}</p>
            <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-sm btn-outline-secondary confirm-no">No</button>
                <button class="btn btn-sm btn-danger confirm-yes">Yes, Delete</button>
            </div>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.querySelector('.confirm-yes').onclick = () => {
        bsToast.hide();
        setTimeout(() => { toast.remove(); onConfirm(); }, 400);
    };
    toast.querySelector('.confirm-no').onclick = () => {
        bsToast.hide();
        setTimeout(() => { toast.remove(); if (onCancel) onCancel(); }, 400);
    };
}

// === SERVICE BOOKING ===
document.getElementById('home-book-whatsapp')?.addEventListener('click', () => {
    const name = document.getElementById('home-name')?.value.trim();
    const address = document.getElementById('home-address')?.value.trim();
    const product = document.getElementById('home-product')?.value;
    const model = document.getElementById('home-model')?.value.trim();
    const issue = document.getElementById('home-issue')?.value.trim();

    if (!name || !address || !product || !issue) {
        showToast('Please fill all required fields.', 'error');
        return;
    }

    const modelLine = model ? `\nModel: ${model}` : '';

    const message = `
*SERVICE REQUEST - iTech Solutions*

*Customer Details*
Name: ${name}
Address: ${address}${modelLine}
Device: ${product}

*Problem Description*
${issue}

*Service Info*
• Free Diagnosis
• Fast Repair (Same Day if Possible)
• 30 Days Warranty
• Doorstep Service (Goa)

*Note:* Technician will call you within 1 hour.
`.trim();

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encoded}`, '_blank');
    showToast('Service request sent!', 'success');

    setTimeout(() => {
        document.getElementById('home-service-form').reset();
        document.getElementById('home-service-form').classList.remove('was-validated');
    }, 1000);
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        checkAdminAuth();
    } else {
        loadProducts();
        setTimeout(() => {
            if (document.getElementById('cart-items')) displayCart();
        }, 800);
    }
});