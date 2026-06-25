const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const parallaxItems = document.querySelectorAll(".parallax");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

function watchReveal(item, index = 0) {
  item.style.transitionDelay = `${Math.min(index * 70, 360)}ms`;
  revealObserver.observe(item);
}

revealItems.forEach((item, index) => watchReveal(item, index));

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.7 }
);

counters.forEach((counter) => countObserver.observe(counter));

function animateCount(element) {
  const target = Number(element.dataset.count);
  const duration = 1500;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString("en-US");

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

let ticking = false;

function updateParallax() {
  const viewport = window.innerHeight || 1;

  parallaxItems.forEach((item) => {
    const speed = Number(item.dataset.speed || 0.08);
    const rect = item.getBoundingClientRect();
    const progress = (rect.top + rect.height * 0.5 - viewport * 0.5) / viewport;
    item.style.transform = `translate3d(0, ${progress * speed * 160}px, 0) scale(1.03)`;
  });

  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
  },
  { passive: true }
);

window.addEventListener("load", updateParallax);

const categoryLabels = {
  Beaute: "Beauté",
  Cuisine: "Cuisine",
  Eclairage: "Éclairage",
  Maison: "Maison",
  "Outils-Jardin": "Outils & Jardin",
  Rangement: "Rangement",
  "Sante-Bien-etre": "Santé & Bien-être",
  "Sport-Loisirs": "Sport & Loisirs",
};

const products = window.PRODUCTS || [];
const productGrid = document.querySelector("#productGrid");
const categoryFilters = document.querySelector("#categoryFilters");
const catalogCount = document.querySelector("#catalogCount");
const categoryEntryCards = document.querySelectorAll("[data-category-target]");
const catalogSearch = document.querySelector("#catalogSearch");
const productSearch = document.querySelector("#productSearch");
let activeCategory = "Rangement";
let activeQuery = "";

if (productGrid && categoryFilters && products.length) {
  const categories = orderCategories([...new Set(products.map((product) => product.category))]);

  renderCategoryFilters(categories);
  renderProducts(activeCategory);
  bindCategoryEntries();
  bindProductSearch();
}

function renderCategoryFilters(categories) {
  const filterItems = [...categories, "all"];

  categoryFilters.innerHTML = filterItems
    .map((category) => {
      const label = category === "all" ? "Tous" : getCategoryLabel(category);
      return `<button class="filter-pill${category === activeCategory ? " active" : ""}" type="button" data-category="${category}">${label}</button>`;
    })
    .join("");

  categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    categoryFilters.querySelectorAll(".filter-pill").forEach((item) => item.classList.remove("active"));
    setActiveCategory(button.dataset.category);
  });
}

function bindCategoryEntries() {
  categoryEntryCards.forEach((card) => {
    card.addEventListener("click", () => goToCategory(card.dataset.categoryTarget));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      goToCategory(card.dataset.categoryTarget);
    });
  });
}

function goToCategory(category) {
  setActiveCategory(category);
  history.pushState(null, "", "#products");
  document.querySelector("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveCategory(category) {
  const selectedCategory = products.some((product) => product.category === category) ? category : "all";
  activeCategory = selectedCategory;
  categoryFilters
    .querySelectorAll(".filter-pill")
    .forEach((item) => item.classList.toggle("active", item.dataset.category === selectedCategory));
  renderProducts(selectedCategory);
}

function renderProducts(category) {
  const normalizedQuery = normalizeSearch(activeQuery);
  const categoryProducts = category === "all" ? products : products.filter((product) => product.category === category);
  const visibleProducts = normalizedQuery
    ? categoryProducts.filter((product) => normalizeSearch(product.name).includes(normalizedQuery))
    : categoryProducts;

  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card reveal">
          <a class="product-image-link" href="${product.image}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(product.name)}">
            <div class="product-media">
              <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" />
            </div>
          </a>
            <div class="product-info">
              <h3>${escapeHtml(product.name)}</h3>
              <strong>${formatPrice(product.price)}</strong>
              <p class="product-availability"><b>En Gros / Détail</b><span>Disponible</span></p>
              <a class="product-whatsapp" href="${buildWhatsAppLink(product)}" target="_blank" rel="noreferrer">Commander sur WhatsApp</a>
            </div>
        </article>
      `
    )
    .join("");

  catalogCount.textContent = `${visibleProducts.length} produits`;
  productGrid.querySelectorAll(".reveal").forEach((item, index) => watchReveal(item, index % 8));
}

function bindProductSearch() {
  catalogSearch?.addEventListener("submit", (event) => {
    event.preventDefault();
    activeQuery = productSearch?.value || "";
    renderProducts(activeCategory);
  });

  productSearch?.addEventListener("input", () => {
    activeQuery = productSearch.value;
    renderProducts(activeCategory);
  });
}

function orderCategories(categories) {
  const preferred = ["Rangement", "Eclairage"];
  const late = ["Autres produits"];
  const rest = categories
    .filter((category) => !preferred.includes(category) && !late.includes(category))
    .sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), "fr"));
  return [
    ...preferred.filter((category) => categories.includes(category)),
    ...rest,
    ...late.filter((category) => categories.includes(category)),
  ];
}

function normalizeSearch(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCategoryLabel(category) {
  return categoryLabels[category] || category.replaceAll("-", " ");
}

function formatPrice(price) {
  if (!price) return "Prix sur demande";
  return `${Number(price).toLocaleString("fr-FR")} FCFA`;
}

function buildWhatsAppLink(product) {
  const message = `Bonjour, je suis intéressé par ce produit: ${product.name} - ${formatPrice(product.price)}`;
  return `https://wa.me/2250788038502?text=${encodeURIComponent(message)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

