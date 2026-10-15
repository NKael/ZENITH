// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
    CART: "zenith_cart",
    USER: "zenith_user",
    ORDERS: "zenith_orders",
    SELECTED_SIZES: "zenith_selected_sizes",
    SHIPPING: "zenith_shipping_info"
};

// ===== MERCADO PAGO CONFIG (PREPARADO PARA PRODUCAO) =====
// Para ativar o Mercado Pago de verdade: 
// - Defina sua PUBLIC KEY (no checkout.html e/ou aqui)
// - Rode um backend que crie a Preference (ID) no Mercado Pago
//   e retorne { id: "PREFERENCE_ID" }
// OBS: Mesmo sem backend, o site continua funcionando (fallback simulado).
const MP_CONFIG = {
    PUBLIC_KEY: "", // opcional: preencha depois
    BACKEND_BASE_URL: "http://localhost:3000",
    CREATE_PREFERENCE_PATH: "/pagar"
};

// ===== GLOBAL STATE =====
let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null;
let selectedSizes = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_SIZES)) || {};
let shippingInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIPPING)) || null;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function () {
    initNavigation();
    updateCartCount();

    // Page-specific initialization
    if (document.querySelector(".cart")) renderCart();
    if (document.querySelector(".checkout")) renderCheckout();
    if (document.getElementById("product-name")) handleProductPage();
    if (document.querySelector(".profile-section")) loadProfile();

    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // Register form
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    // Edit profile form
    const editProfileForm = document.getElementById("editProfileForm");
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", handleEditProfile);
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
        // Evita pegar <select> ou outros elementos que usam a mesma classe
        if (!button.dataset || !button.dataset.filter) return;

        button.addEventListener("click", function () {
            const filter = this.dataset.filter;
            filterProducts(filter);

            filterButtons.forEach(btn => {
                if (btn.dataset && btn.dataset.filter) btn.classList.remove("active");
            });
            this.classList.add("active");
        });
    });

    // Size selectors
    initSizeSelectors();
    initShopSearchAndSort();

    // Checkout/Carrinho: mascaras, validacoes e calculo de frete
    initInputMasks();
    initShippingUI();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navElements = document.querySelectorAll("#mainNav");

    navElements.forEach(nav => {
        if (currentUser) {
            nav.innerHTML = `
                <a href="index.html">Início</a>
                <a href="loja.html">Loja</a>
                <a href="perfil.html">Perfil</a>
                <a href="#" onclick="logout()">Sair</a>
                <a href="cart.html" class="cart-btn" id="cart-link">
                    🛒 <span id="cart-count">0</span>
                </a>
            `;
        } else {
            nav.innerHTML = `
                <a href="index.html">Início</a>
                <a href="loja.html">Loja</a>
                <a href="login.html">Login</a>
                <a href="cart.html" class="cart-btn" id="cart-link">
                    🛒 <span id="cart-count">0</span>
                </a>
            `;
        }
    });

    updateCartCount();
}

// ===== SIZE SELECTORS =====
function initSizeSelectors() {
    // Size buttons in product cards (loja.html)
    document.querySelectorAll(".size-opt").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = this.dataset.product;
            const size = this.dataset.size;

            // Remove active from siblings
            const siblings = this.parentElement.querySelectorAll(".size-opt");
            siblings.forEach(s => s.classList.remove("active"));

            // Add active to clicked
            this.classList.add("active");

            // Store selection
            selectedSizes[productId] = size;
            localStorage.setItem(STORAGE_KEYS.SELECTED_SIZES, JSON.stringify(selectedSizes));
        });
    });

    // Size buttons in product page
    document.querySelectorAll(".size-btn").forEach(btn => {
        btn.addEventListener("click", function (e) {
            e.preventDefault();

            const size = this.dataset.size;

            // Remove active from siblings
            const siblings = this.parentElement.querySelectorAll(".size-btn");
            siblings.forEach(s => s.classList.remove("active"));

            // Add active to clicked
            this.classList.add("active");

            // Update selected size display
            const selectedSizeEl = document.getElementById("selectedSize");
            if (selectedSizeEl) selectedSizeEl.textContent = size;
        });
    });
}

// ===== LOGIN / LOGOUT / REGISTER =====
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email && password) {
        // Simulate login
        currentUser = {
            name: email.split("@")[0],
            email: email,
            joinDate: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        showNotification("Login realizado com sucesso! ⭐", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        showNotification("Por favor, preencha todos os campos.", "error");
    }
}

function showRegister() {
    document.getElementById("registerModal").style.display = "flex";
}

function closeRegister() {
    document.getElementById("registerModal").style.display = "none";
}

function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;

    if (password !== confirm) {
        showNotification("As senhas não coincidem!", "error");
        return;
    }

    if (password.length < 6) {
        showNotification("A senha deve ter no mínimo 6 caracteres!", "error");
        return;
    }

    // Create user
    currentUser = {
        name: name,
        email: email,
        joinDate: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    showNotification("Conta criada com sucesso! ⭐", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
}

function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    showNotification("Até logo! Continue buscando o topo! ⭐", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

// ===== PROFILE =====
function loadProfile() {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Load user info
    document.getElementById("userName").textContent = currentUser.name || "Elite ZENITH";
    document.getElementById("userEmail").textContent = currentUser.email;

    // Load initials
    const initials = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "⭐";
    document.getElementById("userInitials").textContent = initials;

    // Load orders
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    loadOrders(orders);
}

function loadOrders(orders) {
    const ordersList = document.getElementById("ordersList");
    const emptyOrders = document.getElementById("emptyOrders");

    if (orders.length === 0) {
        ordersList.style.display = "none";
        emptyOrders.style.display = "block";
        document.getElementById("totalOrders").textContent = "0";
        document.getElementById("totalSpent").textContent = "R$ 0,00";
        return;
    }

    ordersList.style.display = "flex";
    emptyOrders.style.display = "none";

    // Calculate stats
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById("totalOrders").textContent = orders.length;
    document.getElementById("totalSpent").textContent = `R$ ${totalSpent.toFixed(2)}`;

    // Render orders
    let html = "";
    orders.forEach(order => {
        html += `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">Pedido #${order.id}</span>
                    <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `${item.qty}x ${item.name}`).join(", ")}
                </div>
                <div class="order-total">Total: R$ ${order.total.toFixed(2)}</div>
                <div style="color: #666; font-size: 0.85rem; margin-top: 0.5rem;">
                    ${new Date(order.date).toLocaleDateString('pt-BR')}
                </div>
            </div>
        `;
    });

    ordersList.innerHTML = html;
}

function getStatusText(status) {
    const statusMap = {
        "processing": "Processando",
        "shipped": "Enviado",
        "delivered": "Entregue"
    };
    return statusMap[status] || status;
}

function filterOrders() {
    const filter = document.getElementById("orderFilter").value;
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];

    if (filter === "all") {
        loadOrders(orders);
    } else {
        const filtered = orders.filter(order => order.status === filter);
        loadOrders(filtered);
    }
}

function editProfile() {
    document.getElementById("editModal").style.display = "flex";

    // Pre-fill form
    document.getElementById("edit-name").value = currentUser.name || "";
    document.getElementById("edit-email").value = currentUser.email || "";
}

function closeEditProfile() {
    document.getElementById("editModal").style.display = "none";
}

function handleEditProfile(e) {
    e.preventDefault();

    currentUser.name = document.getElementById("edit-name").value;
    currentUser.email = document.getElementById("edit-email").value;

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    showNotification("Perfil atualizado com sucesso! ⭐", "success");

    closeEditProfile();
    loadProfile();
}

// ===== CART FUNCTIONS =====
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    document.querySelectorAll("#cart-count").forEach(el => {
        if (el) el.textContent = count;
    });
}

function addToCart(name, price, icon, size = "M") {
    const existing = cart.find(item => item.name === name && item.size === size);

    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({
            name,
            price,
            icon: icon || '⭐',
            size: size,
            qty: 1
        });
    }

    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartCount();
    showNotification(`Adicionado ao carrinho! (Tamanho: ${size}) ⭐`);
}

function addToCartWithSize(productId, name, price, icon) {
    const size = selectedSizes[productId] || "M";
    addToCart(name, price, icon, size);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartCount();
    renderCart();
}


// ✅ NOVO: alterar quantidade no carrinho (e-commerce real)
function changeCartQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
        cart.splice(index, 1);
    }
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function renderCart() {
    const emptyCart = document.getElementById("empty-cart");
    const cartContent = document.getElementById("cart-content");
    const cartItems = document.getElementById("cart-items");

    if (!cartItems) return;

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = "block";
        if (cartContent) cartContent.style.display = "none";
        return;
    }

    if (emptyCart) emptyCart.style.display = "none";
    if (cartContent) cartContent.style.display = "grid";

    let html = "";
    let total = 0;

    cart.forEach((item, i) => {
        const qty = item.qty || 1;
        const subtotal = item.price * qty;
        total += subtotal;

        html += `
            <div class="cart-item">
                <div class="cart-item-icon">${item.icon || '⭐'}</div>
                <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">
                    <span class="cart-item-size">Tam: ${item.size}</span>
                    <span class="cart-item-color">${item.color || 'Preto'}</span>
                </div>
                </div>
                <div class="cart-item-qty">
                <button class="qty-btn" onclick="changeCartQty(${i}, -1)">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" onclick="changeCartQty(${i}, 1)">+</button>
                </div>
                <div class="cart-item-price">R$ ${subtotal.toFixed(2)}</div>
                <button onclick="removeFromCart(${i})" class="cart-item-remove">Remover</button>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    updateCartSummary(total);
}

function updateCartSummary(total) {
    const freeShippingThreshold = 200;
    const ship = getEffectiveShipping(total, freeShippingThreshold);
    const shipping = ship.cost || 0;
    const finalTotal = total + shipping;

    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");
    const shippingMessageEl = document.getElementById("shipping-message");

    if (subtotalEl) subtotalEl.textContent = `R$ ${total.toFixed(2)}`;

    // Na sua função updateCartSummary, use:
    if (shippingEl) {
        shippingEl.textContent = ship.label; // Isso mostra "R$ 15.00"
        shippingEl.style.color = shipping === 0 ? "#4A90E2" : "";
    }

    if (totalEl) totalEl.textContent = `R$ ${finalTotal.toFixed(2)}`;

    if (shippingMessageEl) {
        if (total >= freeShippingThreshold) {
            shippingMessageEl.textContent = "🎉 Você ganhou frete grátis!";
            shippingMessageEl.style.color = "#4A90E2";
        } else {
            const remaining = freeShippingThreshold - total;
            const extra = ship.eta ? ` · Entrega estimada: ${ship.eta}` : "";
            shippingMessageEl.textContent = `Faltam R$ ${remaining.toFixed(2)} para frete grátis${extra}`;
            shippingMessageEl.style.color = "";
        }
    }
}

// ===== CHECKOUT =====
function renderCheckout() {
    const checkoutItems = document.getElementById("checkout-items");

    if (!checkoutItems || cart.length === 0) {
        window.location.href = "cart.html";
        return;
    }

    // Pre-fill with user data if logged in
    if (currentUser) {
        const nameField = document.getElementById("checkout-name");
        const emailField = document.getElementById("checkout-email");
        if (nameField) nameField.value = currentUser.name || "";
        if (emailField) emailField.value = currentUser.email || "";
    }

    let html = "";
    let subtotal = 0;

    cart.forEach(item => {
        const qty = item.qty || 1;
        const lineTotal = item.price * qty;
        subtotal += lineTotal;

        html += `
            <div class="checkout-item">
                <div class="checkout-item-icon">${item.icon || '⭐'}</div>
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name}</div>
                    <div class="checkout-item-details">
                        <span>Tamanho: ${item.size}</span>
                        <span>•</span>
                        <span>Qtd: ${qty}</span>
                    </div>
                </div>
                <div class="checkout-item-price">R$ ${lineTotal.toFixed(2)}</div>
            </div>
        `;
    });

    checkoutItems.innerHTML = html;

    // Shipping only "vale" no checkout (opcao B)
    const ship = getEffectiveShipping(subtotal);
    const total = subtotal + ship.cost;

    const subtotalEl = document.getElementById("checkout-subtotal");
    const shippingEl = document.getElementById("checkout-shipping");
    const totalEl = document.getElementById("checkout-total");
    const shippingMsg = document.getElementById("checkout-shipping-message");

    if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;

    if (shippingEl) {
        if (ship.cost === 0) {
            shippingEl.textContent = "Grátis";
            shippingEl.style.color = "#4A90E2";
        } else if (ship.cost > 0) {
            shippingEl.textContent = `R$ ${ship.cost.toFixed(2)}`;
            shippingEl.style.color = "";
        } else {
            // sem calculo ainda
            shippingEl.textContent = "Calcular";
            shippingEl.style.color = "";
        }
    }

    if (totalEl) {
        const shownTotal = ship.cost >= 0 ? total : subtotal;
        totalEl.textContent = `R$ ${shownTotal.toFixed(2)}`;
    }

    if (shippingMsg) {
        if (subtotal >= 200) {
            shippingMsg.textContent = "🎉 Você ganhou frete grátis!";
        } else if (ship.cost > 0) {
            shippingMsg.textContent = ship.eta ? `🚚 Frete calculado · Entrega estimada: ${ship.eta}` : "🚚 Frete calculado";
        } else {
            shippingMsg.textContent = "Digite o CEP e clique em “Calcular frete” para ver valor e prazo.";
        }
    }
}

async function pay() {
    // Valida checkout
    const ok = await validateCheckoutBeforePay();
    if (!ok) return;

    // Tenta Mercado Pago real (se backend estiver disponivel)
    const mpOk = await tryMercadoPagoCheckout();
    if (mpOk) return;

    // Fallback: confirma pedido local (simulado)
    finalizeOrder();
}


// ===== PRODUCT PAGE =====
function handleProductPage() {
    const params = new URLSearchParams(location.search);
    const productId = params.get("id");

    if (!productId) return;

    const products = {
        "1": {
            name: "Camiseta APEX",
            icon: "⭐",
            price: 89.90,
            desc: "Camiseta oversized premium com design minimalista. Representa o ponto mais alto de sua jornada.",
            gradient: "gradient-1",
            sizes: ["P", "M", "G", "GG"]
        },
        "2": {
            name: "Camiseta SUMMIT",
            icon: "🌟",
            price: 89.90,
            desc: "Design clean e sofisticado. Para quem já conquistou o cume e busca novos horizontes.",
            gradient: "gradient-2",
            sizes: ["P", "M", "G", "GG"]
        },
        "3": {
            name: "Moletom ELEVATION",
            icon: "🚀",
            price: 159.90,
            desc: "Moletom com capuz de alta performance. Conforto premium para sua ascensão diária.",
            gradient: "gradient-3",
            sizes: ["P", "M", "G", "GG"]
        },
        "4": {
            name: "Boné PEAK",
            icon: "💎",
            price: 69.90,
            desc: "Boné bordado premium com logo exclusivo ZENITH. O topo começa aqui.",
            gradient: "gradient-4",
            sizes: ["Único"]
        },
        "5": {
            name: "Ecobag ASCEND",
            icon: "✨",
            price: 49.90,
            desc: "Ecobag em canvas premium. Carregue seu sucesso com estilo.",
            gradient: "gradient-5",
            sizes: ["Único"]
        }
    };

    const product = products[productId];
    if (!product) return;

    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-desc").textContent = product.desc;
    document.getElementById("product-price").textContent = `R$ ${product.price.toFixed(2)}`;

    const imageEl = document.getElementById("product-image");
    imageEl.textContent = product.icon;
    imageEl.className = `${product.gradient} product-image-large`;

    // Update size options
    const sizeOptions = document.getElementById("sizeOptions");
    if (sizeOptions && product.sizes) {
        sizeOptions.innerHTML = product.sizes.map((size, index) =>
            `<button class="size-btn ${index === 2 ? 'active' : ''}" data-size="${size}">${size}</button>`
        ).join('');

        // Re-init size selectors
        initSizeSelectors();
    }

    window.currentProduct = product;
}

function addProductToCart() {
    if (!window.currentProduct) return;

    const product = window.currentProduct;
    const selectedSize = document.querySelector(".size-btn.active")?.dataset.size || "M";

    addToCart(product.name, product.price, product.icon, selectedSize);
}

function addProductAndCheckout() {
    if (!window.currentProduct) return;

    const product = window.currentProduct;
    const selectedSize = document.querySelector(".size-btn.active")?.dataset.size || "M";

    addToCart(product.name, product.price, product.icon, selectedSize);

    setTimeout(() => {
        window.location.href = "checkout.html";
    }, 800);
}

// ===== FILTER PRODUCTS =====
function filterProducts(category) {
    const products = document.querySelectorAll(".product-card");

    products.forEach(product => {
        const productCategory = product.dataset.category;

        if (category === "all" || productCategory === category) {
            product.style.display = "block";
        } else {
            product.style.display = "none";
        }
    });
}

// ===== NOTIFICATIONS =====
function showNotification(msg, type = "success") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = msg;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add("show"), 100);

    setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== SHOP SEARCH + SORT (NOVO) =====
function initShopSearchAndSort() {
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortProducts");
    const grid = document.getElementById("productsGrid");

    // BUSCA
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const q = (searchInput.value || "").trim().toLowerCase();
            document.querySelectorAll(".product-card").forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(q) ? "block" : "none";
            });
        });
    }

    // ORDENAÇÃO
    if (sortSelect && grid) {
        // salva ordem original
        Array.from(grid.querySelectorAll('.product-card')).forEach((c, idx) => {
            if (!c.getAttribute('data-original-index')) c.setAttribute('data-original-index', String(idx));
        });

        sortSelect.addEventListener("change", () => {
            const cards = Array.from(grid.querySelectorAll(".product-card"));

            const getPrice = (card) => {
                const dp = card.getAttribute('data-price');
                if (dp) {
                    const n = Number(dp);
                    if (!Number.isNaN(n)) return n;
                }
                const priceEl = card.querySelector('.price');
                if (priceEl) {
                    const raw = priceEl.textContent.replace('R$', '').trim().replace('.', '').replace(',', '.');
                    const n = Number(raw);
                    if (!Number.isNaN(n)) return n;
                }
                return 0;
            };

            if (sortSelect.value === 'price-asc') {
                cards.sort((a, b) => getPrice(a) - getPrice(b));
            } else if (sortSelect.value === 'price-desc') {
                cards.sort((a, b) => getPrice(b) - getPrice(a));
            } else {
                cards.sort((a, b) => Number(a.getAttribute('data-original-index') || 0) - Number(b.getAttribute('data-original-index') || 0));
            }

            cards.forEach(c => grid.appendChild(c));
        });
    }
}

// ===== PRODUCT TABS (NOVO) =====
function openTab(tabId, btn) {
    // Conteudos
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // Botoes (se existirem)
    if (btn) {
        const wrap = btn.parentElement;
        if (wrap) {
            wrap.querySelectorAll('.tab-btn, .filter-btn').forEach(b => b.classList.remove('active'));
        }
        btn.classList.add('active');
    }
}


// ===== MERCADO PAGO (PREPARADO) =====
// Se existir backend + PUBLIC_KEY, abre checkout. Caso contrário, cai no fluxo simulado.
async function tryMercadoPagoCheckout() {
    try {
        if (!cart || cart.length === 0) return false;

        const subtotal = cart.reduce((sum, p) => sum + (Number(p.price) * (p.qty || 1)), 0);
        const items = cart.map(p => ({
            title: `${p.name} (Tam: ${p.size})`,
            quantity: p.qty || 1,
            unit_price: Number(p.price)
        }));

        // Adiciona frete como item (quando aplicavel)
        if (subtotal < 200 && shippingInfo && typeof shippingInfo.cost === "number" && shippingInfo.cost > 0) {
            items.push({
                title: "Frete",
                quantity: 1,
                unit_price: Number(shippingInfo.cost)
            });
        }

        const url = `${MP_CONFIG.BACKEND_BASE_URL}${MP_CONFIG.CREATE_PREFERENCE_PATH}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        if (!res.ok) return false;

        const data = await res.json();
        if (!data || !data.id) return false;

        // Se SDK carregada e PUBLIC_KEY definida, abre checkout
        const pk = (MP_CONFIG.PUBLIC_KEY || window.MP_PUBLIC_KEY || '').trim();
        if (window.MercadoPago && pk) {
            const mp = new window.MercadoPago(pk, { locale: 'pt-BR' });
            mp.checkout({ preference: { id: data.id }, autoOpen: true });
            return true;
        }

        // Sem SDK/PK: ainda assim preference criada
        showNotification('Preference criada no Mercado Pago. Configure sua PUBLIC KEY para abrir o checkout.', 'success');
        return true;
    } catch (e) {
        return false;
    }
}


// ===== INPUT MASKS + VALIDACOES (Checkout real) =====
function initInputMasks() {
    const cpf = document.getElementById("checkout-cpf");
    const cep = document.getElementById("checkout-cep");
    const phone = document.getElementById("checkout-phone");

    if (cpf) {
        cpf.addEventListener("input", () => {
            cpf.value = maskCPF(cpf.value);
        });
    }

    if (cep) {
        cep.addEventListener("input", () => {
            cep.value = maskCEP(cep.value);
        });
    }

    if (phone) {
        phone.addEventListener("input", () => {
            phone.value = maskPhoneBR(phone.value);
        });
    }
}

function initShippingUI() {
    const btn = document.getElementById("btnCalcShipping");
    const cep = document.getElementById("checkout-cep");

    // Somente no checkout (opcao B)
    if (!btn || !cep) return;

    btn.addEventListener("click", async () => {
        await calculateShippingAndAddress();
    });

    cep.addEventListener("blur", async () => {
        // se usuario digitou CEP completo, tenta calcular
        const digits = onlyDigits(cep.value);
        if (digits.length === 8) {
            await calculateShippingAndAddress(true);
        }
    });
}

async function calculateShippingAndAddress(silent = false) {
    const cepEl = document.getElementById("checkout-cep");
    const statusEl = document.getElementById("checkout-cep-status");
    if (!cepEl) return;

    const cepDigits = onlyDigits(cepEl.value);
    if (cepDigits.length !== 8) {
        if (!silent) showNotification("Digite um CEP válido (8 dígitos).", "error");
        if (statusEl) statusEl.textContent = "CEP inválido. Use 8 dígitos.";
        return;
    }

    if (statusEl) statusEl.textContent = "Consultando CEP...";

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = await res.json();

        if (data.erro) {
            if (statusEl) statusEl.textContent = "CEP não encontrado.";
            if (!silent) showNotification("CEP não encontrado.", "error");
            return;
        }

        // Preenche endereco automaticamente
        const street = document.getElementById("checkout-street");
        const neighborhood = document.getElementById("checkout-neighborhood");
        const city = document.getElementById("checkout-city");
        const state = document.getElementById("checkout-state");

        if (street && data.logradouro) street.value = data.logradouro;
        if (neighborhood && data.bairro) neighborhood.value = data.bairro;
        if (city && data.localidade) city.value = data.localidade;
        if (state && data.uf) state.value = data.uf;

        // Calcula frete (apenas checkout)
        const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
        let ship = { cost: 0, eta: "" };

        if (subtotal >= 200) {
            ship = { cost: 0, eta: estimateEtaByUF(data.uf) };
            // para frete gratis, salvamos eta apenas
        } else {
            ship = computeShippingByUF(data.uf);
        }

        shippingInfo = {
            cep: cepDigits,
            uf: data.uf,
            city: data.localidade,
            cost: ship.cost,
            eta: ship.eta,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.SHIPPING, JSON.stringify(shippingInfo));

        if (statusEl) {
            const costText = subtotal >= 200 ? "Frete grátis" : `Frete: R$ ${ship.cost.toFixed(2)}`;
            const etaText = ship.eta ? ` · Entrega estimada: ${ship.eta}` : "";
            statusEl.textContent = `CEP encontrado. ${costText}${etaText}`;
        }

        // Atualiza totais do checkout
        renderCheckout();
        if (!silent) showNotification("CEP confirmado e frete calculado!", "success");

    } catch (e) {
        if (statusEl) statusEl.textContent = "Erro ao consultar CEP. Tente novamente.";
        if (!silent) showNotification("Erro ao consultar CEP. Tente novamente.", "error");
    }
}

function validateCheckoutForm() {
    const form = document.getElementById("checkoutForm");
    if (!form) return true; // nao esta no checkout

    const name = getVal("checkout-name");
    const email = getVal("checkout-email");
    const cpf = getVal("checkout-cpf");
    const phone = getVal("checkout-phone");

    const cep = getVal("checkout-cep");
    const street = getVal("checkout-street");
    const number = getVal("checkout-number");
    const neighborhood = getVal("checkout-neighborhood");
    const city = getVal("checkout-city");
    const state = getVal("checkout-state");

    const consent = document.getElementById("checkout-consent");

    if (!name || name.length < 3) {
        showNotification("Informe seu nome completo.", "error");
        return false;
    }

    if (!email || !email.includes("@")) {
        showNotification("Informe um email válido.", "error");
        return false;
    }

    if (!validateCPF(cpf)) {
        showNotification("CPF inválido. Verifique e tente novamente.", "error");
        return false;
    }

    if (onlyDigits(phone).length < 10) {
        showNotification("Telefone inválido.", "error");
        return false;
    }

    if (onlyDigits(cep).length != 8) {
        showNotification("CEP inválido.", "error");
        return false;
    }

    if (!street || !number || !neighborhood || !city || !state) {
        showNotification("Preencha o endereço completo.", "error");
        return false;
    }

    if (!consent || !consent.checked) {
        showNotification("Você precisa aceitar os Termos e a Política de Privacidade.", "error");
        return false;
    }

    return true;
}


function getEffectiveShipping(subtotal, freeShippingThreshold = 200) {
    // Frete gratis
    if (subtotal >= freeShippingThreshold) {
        return {
            cost: 0,
            label: "Grátis",
            message: "🎉 Você ganhou frete grátis!",
            eta: "3-5 dias úteis"
        };
    }

    // Se estiver no checkout, exige calculo por CEP
    const isCheckout = !!document.getElementById("checkoutForm");
    if (isCheckout) {
        if (shippingInfo && typeof shippingInfo.cost === "number" && shippingInfo.cost >= 0) {
            return {
                cost: shippingInfo.cost,
                label: shippingInfo.cost === 0 ? "Grátis" : `R$ ${shippingInfo.cost.toFixed(2)}`,
                message: "",
                eta: shippingInfo.eta || ""
            };
        }
        // ainda nao calculado
        return { cost: -1, label: "Calcular", message: "", eta: "" };
    }

    // Fora do checkout: mantem regra fixa
    const shippingCost = 15.00;
    const eta = (shippingInfo && shippingInfo.eta) ? shippingInfo.eta : "5-8 dias úteis";

    return {
        cost: shippingCost,
        label: `R$ ${shippingCost.toFixed(2)}`,
        message: `Faltam R$ ${(freeShippingThreshold - subtotal).toFixed(2)} para frete grátis`,
        eta: eta
    };
}

async function validateCheckoutBeforePay() {
    if (!validateCheckoutForm()) return false;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

    // Se nao for frete gratis, exige calculo por CEP antes de pagar
    if (subtotal < 200) {
        const cepDigits = onlyDigits(getVal("checkout-cep"));

        const valid = shippingInfo && shippingInfo.cep === cepDigits && typeof shippingInfo.cost === "number" && shippingInfo.cost > 0;
        if (!valid) {
            // tenta calcular automaticamente para nao travar a compra
            await calculateShippingAndAddress(true);
        }

        const valid2 = shippingInfo && shippingInfo.cep === cepDigits && typeof shippingInfo.cost === "number" && shippingInfo.cost > 0;
        if (!valid2) {
            showNotification("Calcule o frete pelo CEP antes de pagar.", "error");
            return false;
        }
    }

    return true;
}

// ===== HELPERS =====
function getVal(id) {
    const el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
}

function onlyDigits(v) {
    return String(v || "").replace(/\D/g, "");
}

function maskCPF(value) {
    const v = onlyDigits(value).slice(0, 11);
    const p1 = v.slice(0, 3);
    const p2 = v.slice(3, 6);
    const p3 = v.slice(6, 9);
    const p4 = v.slice(9, 11);
    let out = p1;
    if (p2) out += "." + p2;
    if (p3) out += "." + p3;
    if (p4) out += "-" + p4;
    return out;
}

function maskCEP(value) {
    const v = onlyDigits(value).slice(0, 8);
    const p1 = v.slice(0, 5);
    const p2 = v.slice(5, 8);
    return p2 ? `${p1}-${p2}` : p1;
}

function maskPhoneBR(value) {
    const v = onlyDigits(value).slice(0, 11);
    const ddd = v.slice(0, 2);
    const part1 = v.length <= 10 ? v.slice(2, 6) : v.slice(2, 7);
    const part2 = v.length <= 10 ? v.slice(6, 10) : v.slice(7, 11);

    if (!ddd) return v;
    if (!part1) return `(${ddd})`;
    if (!part2) return `(${ddd}) ${part1}`;
    return `(${ddd}) ${part1}-${part2}`;
}

function validateCPF(cpfMasked) {
    const cpf = onlyDigits(cpfMasked);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    let d1 = (sum * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    let d2 = (sum * 10) % 11;
    if (d2 === 10) d2 = 0;
    if (d2 !== parseInt(cpf.charAt(10), 10)) return false;

    return true;
}

function computeShippingByUF(uf) {
    const U = String(uf || "").toUpperCase();

    const sudeste = new Set(["SP", "RJ", "MG", "ES"]);
    const sul = new Set(["PR", "SC", "RS"]);
    const centro = new Set(["DF", "GO", "MT", "MS"]);
    const nordeste = new Set(["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"]);
    const norte = new Set(["AM", "RR", "AP", "PA", "TO", "RO", "AC"]);

    if (sudeste.has(U)) return { cost: 15, eta: "3 a 5 dias úteis" };
    if (sul.has(U)) return { cost: 18, eta: "4 a 7 dias úteis" };
    if (centro.has(U)) return { cost: 20, eta: "5 a 8 dias úteis" };
    if (nordeste.has(U)) return { cost: 25, eta: "6 a 10 dias úteis" };
    if (norte.has(U)) return { cost: 30, eta: "8 a 14 dias úteis" };

    return { cost: 25, eta: "6 a 10 dias úteis" };
}

function estimateEtaByUF(uf) {
    const U = String(uf || "").toUpperCase();
    const sudeste = new Set(["SP", "RJ", "MG", "ES"]);
    const sul = new Set(["PR", "SC", "RS"]);
    const centro = new Set(["DF", "GO", "MT", "MS"]);
    const nordeste = new Set(["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"]);
    const norte = new Set(["AM", "RR", "AP", "PA", "TO", "RO", "AC"]);

    if (sudeste.has(U)) return "3 a 5 dias úteis";
    if (sul.has(U)) return "4 a 7 dias úteis";
    if (centro.has(U)) return "5 a 8 dias úteis";
    if (nordeste.has(U)) return "6 a 10 dias úteis";
    if (norte.has(U)) return "8 a 14 dias úteis";
    return "6 a 10 dias úteis";
}