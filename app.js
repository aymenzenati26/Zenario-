// TMDB API Configuration
const API_KEY = '3c6ce1f55284598ba7f132908ec1b95e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';

// DOM Elements
const searchInput = document.getElementById('search_input');
const searchResults = document.querySelector('.search');
const cardsContainer = document.querySelector('.cards');

// Initialize with popular content
fetchPopularContent();

// Search functionality with debounce
let searchTimeout;
searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 2) {
        hideSearchResults();
        return;
    }
    
    searchTimeout = setTimeout(() => {
        searchContent(query);
    }, 500);
});

// Main search function (searches both movies and TV shows)
async function searchContent(query) {
    try {
        showLoading();
        
        const [moviesRes, tvRes] = await Promise.all([
            fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`),
            fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}`)
        ]);
        
        const movies = await moviesRes.json();
        const tvShows = await tvRes.json();
        
        // Combine results with media_type identification
        const combinedResults = [
            ...movies.results.map(item => ({ ...item, media_type: 'movie' })),
            ...tvShows.results.map(item => ({ ...item, media_type: 'tv' }))
        ].sort((a, b) => b.popularity - a.popularity);
        
        displaySearchResults(combinedResults);
    } catch (error) {
        console.error('Search error:', error);
        showError();
    }
}

// Display search results (both movies and TV shows)
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (!results || results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        showSearchResults();
        return;
    }
    
    results.slice(0, 8).forEach(item => {
        const card = createSearchCard(item);
        searchResults.appendChild(card);
    });
    
    showSearchResults();
}

// Create search result card (handles both movies and TV shows)
function createSearchCard(item) {
    const title = item.title || item.name || 'Untitled';
    const date = (item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A';
    const poster = item.poster_path 
        ? `${IMG_BASE_URL}w92${item.poster_path}`
        : 'img/placeholder.jpg';
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const mediaType = item.media_type === 'tv' ? 'TV Series' : 'Movie';
    const detailPage = item.media_type === 'tv' ? 'tv-series.html' : 'movie-player.html';

    const card = document.createElement('a');
    card.classList.add('card');
    card.href = `${detailPage}?tmdbId=${item.id}`; // Changed parameter name to tmdbId
    card.dataset.mediaType = item.media_type;
    card.innerHTML = `
        <img src="${poster}" alt="${title}">
        <div class="cont">
            <h3>${title}</h3>
            <p>${mediaType} • ${date} • <span>TMDB</span><i class="bi bi-star-fill"></i> ${rating}</p>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        e.preventDefault();
        if (item.media_type === 'tv') {
            window.location.href = `tv-series.html?id=${item.id}`;
        } else {
            window.location.href = `movie-player.html?tmdbId=${item.id}`; // Changed parameter name to tmdbId
        }
    });
    
    return card;
}

// Fetch popular content (movies and TV shows)
async function fetchPopularContent() {
    try {
        const [moviesRes, tvRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
            fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`)
        ]);
        
        const movies = await moviesRes.json();
        const tvShows = await tvRes.json();
        
        const combined = [
            ...movies.results.map(m => ({ ...m, media_type: 'movie' })),
            ...tvShows.results.map(t => ({ ...t, media_type: 'tv' }))
        ].sort((a, b) => b.popularity - a.popularity);
        
        displayPopularContent(combined);
    } catch (error) {
        console.error('Error loading popular content:', error);
        cardsContainer.innerHTML = '<p class="error">Failed to load content</p>';
    }
}

// Display popular content
function displayPopularContent(content) {
    cardsContainer.innerHTML = content.map(item => createContentCard(item)).join('');
}

// Create content card for popular section
function createContentCard(item) {
    const title = item.title || item.name || 'Untitled';
    const date = (item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A';
    const poster = item.poster_path 
        ? `${IMG_BASE_URL}w500${item.poster_path}`
        : 'img/placeholder.jpg';
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const mediaType = item.media_type === 'tv' ? 'TV Series' : 'Movie';
    const detailPage = item.media_type === 'tv' ? 'tv-series.html' : 'movie-player.html';

    return `
        <a href="${detailPage}?tmdbId=${item.id}" class="card" data-media-type="${item.media_type}"> <!-- Changed parameter name to tmdbId -->
            <img src="${poster}" alt="${title}" class="poster">
            <div class="rest_card">
                <img src="${poster}" alt="${title}">
                <div class="cont">
                    <h4>${title}</h4>
                    <div class="sub">
                        <p>${mediaType}, ${date}</p>
                        <h3><span>TMDB</span><i class="bi bi-star-fill"></i> ${rating}</h3>
                    </div>
                </div>
            </div>
        </a>
    `;
}

// UI Helper Functions
function showLoading() {
    searchResults.innerHTML = '<div class="loading-spinner"></div>';
    searchResults.style.display = 'block';
}

function showSearchResults() {
    searchResults.style.display = 'block';
    searchResults.style.visibility = 'visible';
    searchResults.style.opacity = '1';
}

function hideSearchResults() {
    searchResults.style.visibility = 'hidden';
    searchResults.style.opacity = '0';
    setTimeout(() => {
        searchResults.style.display = 'none';
    }, 300);
}

function showError() {
    searchResults.innerHTML = '<div class="error">Failed to load results</div>';
    showSearchResults();
}

// Close search when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search_user') && !e.target.closest('.search')) {
        hideSearchResults();
    }
});

// Show search when input is focused
searchInput.addEventListener('focus', function() {
    if (this.value.trim().length >= 2) {
        showSearchResults();
    }
});
