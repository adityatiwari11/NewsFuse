// CONFIGURATION
const CONFIG = {
    DEFAULT_CATEGORY: 'general',
    PAGE_SIZE: 20,
    BASE_URL: '/api/news' // our Vercel serverless function
};

// GLOBAL STATE
let currentCategory = CONFIG.DEFAULT_CATEGORY;

// ===== DOM ELEMENTS =====
const DOM = {
    newsGrid: null,
    loading: null,
    categoryBtn: null,
    categoryDropdown: null,
    dropdownArrow: null,
    categoryItems: null
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', function () {
    initializeDOM();
    fetchNews(currentCategory);
    setupNavigation();
    setupDropdown();
});

/**
 * Cache DOM elements for better performance
 */
function initializeDOM() {
    DOM.newsGrid = document.getElementById('newsGrid');
    DOM.loading = document.getElementById('loading');
    DOM.categoryBtn = document.querySelector('.category-btn');
    DOM.categoryDropdown = document.getElementById('categoryDropdown');
    DOM.dropdownArrow = document.getElementById('dropdownArrow');
    DOM.categoryItems = document.querySelectorAll('.category-item');
}

// DROPDOWN MANAGEMENT
function toggleDropdown() {
    DOM.categoryDropdown.classList.toggle('show');
    DOM.dropdownArrow.classList.toggle('rotate');
}

function selectCategory(category) {
    DOM.categoryItems.forEach(item => item.classList.remove('active'));

    const selectedItem = document.querySelector(`[data-category="${category}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }

    currentCategory = category;
    fetchNews(category);

    DOM.categoryDropdown.classList.remove('show');
    DOM.dropdownArrow.classList.remove('rotate');

    const categoryName = selectedItem ? selectedItem.textContent : 'Categories';
    DOM.categoryBtn.innerHTML = `${categoryName} <span class="dropdown-arrow" id="dropdownArrow">▼</span>`;
}

function setupDropdown() {
    const defaultItem = document.querySelector('[data-category="general"]');
    if (defaultItem) {
        defaultItem.classList.add('active');
    }

    DOM.categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const category = this.dataset.category;
            selectCategory(category);
        });
    });

    document.addEventListener('click', function (event) {
        const categorySelector = document.querySelector('.category-selector');
        if (!categorySelector.contains(event.target)) {
            DOM.categoryDropdown.classList.remove('show');
            DOM.dropdownArrow.classList.remove('rotate');
        }
    });
}

// NAVIGATION MANAGEMENT
function setupNavigation() {
    document.querySelector('.logo').addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// API MANAGEMENT
function buildApiUrl(category) {
    return `${CONFIG.BASE_URL}?category=${category}`;
}

async function fetchNews(category = CONFIG.DEFAULT_CATEGORY) {
    showLoading();

    try {
        const url = buildApiUrl(category);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            displayNews(data.articles);
        } else {
            showError('No news articles found for this category.');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        handleFetchError(error);
    }
}

function handleFetchError(error) {
    let message = 'Failed to load news. Please try again later.';

    if (!navigator.onLine) {
        message = 'No internet connection. Please check your connection and try again.';
    } else if (error.message.includes('429')) {
        message = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('401')) {
        message = 'API key issue. Please check the configuration.';
    }

    showError(message);
}

// UI MANAGEMENT
function displayNews(articles) {
    hideLoading();
    DOM.newsGrid.innerHTML = '';

    const validArticles = articles.filter(article =>
        article.title && article.title !== '[Removed]'
    );

    if (validArticles.length === 0) {
        showError('No valid articles found.');
        return;
    }

    validArticles.forEach(article => {
        const newsCard = createNewsCard(article);
        DOM.newsGrid.appendChild(newsCard);
    });

    DOM.newsGrid.style.display = 'grid';
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';

    const publishedDate = formatDate(article.publishedAt);
    const imageElement = createImageElement(article);
    const safeTitle = sanitizeText(article.title);
    const safeDescription = sanitizeText(article.description || 'No description available.');
    const safeSource = sanitizeText(article.source.name);

    card.innerHTML = `
        <div class="card-inner">
            ${imageElement}
            <h3 class="card-title">${safeTitle}</h3>
            <p class="card-description">${safeDescription}</p>
            <div class="card-meta">
                <span class="card-source">${safeSource}</span>
                <span class="card-date">${publishedDate}</span>
            </div>
            <button class="read-more" onclick="openArticle('${encodeURIComponent(article.url)}')">
                Read Full Article
            </button>
        </div>
    `;

    return card;
}

function createImageElement(article) {
    if (article.urlToImage) {
        return `
            <img src="${article.urlToImage}" 
                 alt="${sanitizeText(article.title)}" 
                 class="card-image" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none;">📰</div>
        `;
    }
    return `<div class="placeholder-image">📰</div>`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openArticle(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);

    if (url && url !== 'null' && url !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        alert('Article URL is not available.');
    }
}

// LOADING STATE MANAGEMENT
function showLoading() {
    DOM.loading.style.display = 'flex';
    DOM.newsGrid.style.display = 'none';
}

function hideLoading() {
    DOM.loading.style.display = 'none';
}

function showError(message) {
    hideLoading();
    DOM.newsGrid.innerHTML = `<div class="error">${message}</div>`;
    DOM.newsGrid.style.display = 'grid';
}

// UTILITY
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchNews,
        createNewsCard,
        formatDate,
        sanitizeText,
        toggleDropdown,
        selectCategory
    };
}
