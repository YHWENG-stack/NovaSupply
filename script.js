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
const tripodBadgeImages = new Set([
  "photos/Eclairage/001-Ring-light-14-pouces-7500.png",
  "photos/Eclairage/002-Ring-light-18-pouces-15000.png",
  "photos/Eclairage/003-Ring-light-LED-12-pouces-6000.png",
  "photos/Eclairage/004-Ring-light-RGB-14-pouces-7500.png",
  "photos/Eclairage/005-Ring-light-RGB-18-pouces-15000.png",
  "photos/Eclairage/006-Lampe-d-appoint-LED-professionnelle-9000.png",
  "photos/Eclairage/007-Lampe-d-eclairage-photo-et-direct-PL-48-13500.png",
  "photos/Eclairage/012-Eclairage-LED-rechargeable-23000.png",
  "photos/Eclairage/013-Eclairage-parfait-pour-creations-18000.png",
  "photos/Eclairage/016-Lampe-video-LED-RL-1800-13000.png",
  "photos/Eclairage/017-Lampe-video-LED-RL-900-10000.png",
  "photos/Eclairage/018-Lumiere-LED-RGB-studio-20000.png",
  "photos/Eclairage/019-Lumiere-spot-RGB-sans-filtre-15000.png",
]);
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
  bindProductLightbox();
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
          <button class="product-image-link" type="button" data-image="${escapeHtml(product.image)}" aria-label="${escapeHtml(product.name)}">
            <div class="product-media">
              ${getProductBadge(product)}
              <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" draggable="false" />
              <span class="image-save-guard" aria-hidden="true"></span>
            </div>
          </button>
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

function bindProductLightbox() {
  productGrid.addEventListener("click", (event) => {
    const link = event.target.closest(".product-image-link");
    if (!link) return;

    event.preventDefault();
    openProductLightbox(link.dataset.image, link.getAttribute("aria-label"));
  });

  document.addEventListener("contextmenu", (event) => {
    if (event.target.closest(".product-media, .product-lightbox-frame")) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target.closest(".product-media, .product-lightbox-frame")) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProductLightbox();
    }
  });
}

function ensureProductLightbox() {
  let lightbox = document.querySelector("#productLightbox");
  if (lightbox) return lightbox;

  lightbox = document.createElement("div");
  lightbox.className = "product-lightbox";
  lightbox.id = "productLightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-label", "Aperçu du produit");
  lightbox.innerHTML = `
    <button class="product-lightbox-close" type="button" aria-label="Fermer">&times;</button>
    <figure>
      <div class="product-lightbox-frame">
        <img alt="" draggable="false" />
        <span class="image-save-guard" aria-hidden="true"></span>
        <div class="lightbox-watermark" aria-hidden="true">
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
          <span>Nova Supply · +225 07 88 03 85 02</span>
        </div>
      </div>
      <div class="product-lightbox-contact" aria-hidden="true">
        <strong>Nova Supply</strong>
        <span>WhatsApp: +225 07 88 03 85 02</span>
      </div>
      <figcaption></figcaption>
    </figure>
  `;

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".product-lightbox-close")) {
      closeProductLightbox();
    }
  });

  document.body.appendChild(lightbox);
  return lightbox;
}

function openProductLightbox(image, name) {
  if (!image) return;

  const lightbox = ensureProductLightbox();
  const img = lightbox.querySelector("img");
  const caption = lightbox.querySelector("figcaption");

  img.src = image;
  img.alt = name || "Produit";
  caption.textContent = name || "";
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  requestAnimationFrame(() => lightbox.classList.add("open"));
}

function closeProductLightbox() {
  const lightbox = document.querySelector("#productLightbox");
  if (!lightbox) return;

  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
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

function getProductBadge(product) {
  return tripodBadgeImages.has(product.image) ? `<span class="product-badge">Avec trépied</span>` : "";
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

