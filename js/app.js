/**
 * ShoreSquad - Main JavaScript Application
 * Features: Geolocation, Weather API, LocalStorage, Animations
 */

// ============================================
// Configuration & State
// ============================================

const APP_CONFIG = {
    // Singapore NEA API endpoints
    weatherForecastUrl: 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast',
    weatherRealtimeUrl: 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',
    tempHumidityUrl: 'https://api.data.gov.sg/v1/environment/air-temperature',
    storageKey: 'shoresquad_data',
    animationDuration: 300
};

const appState = {
    userLocation: null,
    currentWeather: null,
    events: [],
    crewMembers: [],
    initialized: false
};

// ============================================
// Utility Functions
// ============================================

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * Save data to LocalStorage
 */
function saveToStorage(key, data) {
    try {
        const storageData = JSON.parse(localStorage.getItem(APP_CONFIG.storageKey)) || {};
        storageData[key] = data;
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(storageData));
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        return false;
    }
}

/**
 * Load data from LocalStorage
 */
function loadFromStorage(key) {
    try {
        const storageData = JSON.parse(localStorage.getItem(APP_CONFIG.storageKey)) || {};
        return storageData[key] || null;
    } catch (error) {
        console.error('Storage error:', error);
        return null;
    }
}

/**
 * Animate counter numbers
 */
function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

/**
 * Format date for display
 */
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// ============================================
// Geolocation Functions
// ============================================

/**
 * Get user's current location
 */
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                const location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                appState.userLocation = location;
                saveToStorage('userLocation', location);
                resolve(location);
            },
            error => {
                reject(error);
            }
        );
    });
}

// ============================================
// Weather API Functions - Singapore NEA
// ============================================

/**
 * Fetch 4-day weather forecast from NEA
 */
async function fetchWeatherForecast() {
    try {
        const response = await fetch(APP_CONFIG.weatherForecastUrl);
        
        if (!response.ok) {
            throw new Error('Weather forecast unavailable');
        }
        
        const data = await response.json();
        appState.currentWeather = data;
        saveToStorage('weatherForecast', data);
        return data;
    } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
    }
}

/**
 * Fetch real-time temperature and humidity
 */
async function fetchCurrentTemp() {
    try {
        const response = await fetch(APP_CONFIG.tempHumidityUrl);
        
        if (!response.ok) {
            throw new Error('Temperature data unavailable');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Temperature fetch error:', error);
        return null;
    }
}

/**
 * Get weather icon emoji based on forecast
 */
function getWeatherIcon(forecast) {
    const forecastLower = forecast.toLowerCase();
    
    if (forecastLower.includes('thunder')) return '⛈️';
    if (forecastLower.includes('rain') || forecastLower.includes('shower')) return '🌧️';
    if (forecastLower.includes('cloudy')) return '☁️';
    if (forecastLower.includes('partly cloudy')) return '⛅';
    if (forecastLower.includes('fair') || forecastLower.includes('sunny')) return '☀️';
    if (forecastLower.includes('hazy')) return '🌫️';
    
    return '🌤️';
}

/**
 * Display 4-day weather forecast
 */
async function displayWeather() {
    const weatherWidget = document.getElementById('weatherWidget');
    
    try {
        // Fetch forecast and temperature data
        const [forecastData, tempData] = await Promise.all([
            fetchWeatherForecast(),
            fetchCurrentTemp()
        ]);
        
        if (!forecastData || !forecastData.items || forecastData.items.length === 0) {
            throw new Error('No forecast data available');
        }
        
        const forecasts = forecastData.items[0].forecasts;
        const currentTemp = tempData && tempData.items && tempData.items[0].readings.length > 0 
            ? tempData.items[0].readings[0].value 
            : null;
        
        // Get general forecast for today
        const generalForecast = forecastData.items[0].general || {};
        
        // Build forecast cards HTML
        const forecastCards = forecasts.map((day, index) => {
            const date = new Date(day.date);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-SG', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
            const icon = getWeatherIcon(day.forecast);
            
            return `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-date">${dateStr}</div>
                    <div class="forecast-icon">${icon}</div>
                    <div class="forecast-temps">
                        <span class="temp-high">${day.temperature.high}°</span>
                        <span class="temp-low">${day.temperature.low}°</span>
                    </div>
                    <div class="forecast-desc">${day.forecast}</div>
                    <div class="forecast-humidity">💧 ${day.relative_humidity.high}%</div>
                </div>
            `;
        }).join('');
        
        weatherWidget.innerHTML = `
            <div class="weather-header">
                <h3>🌊 Singapore Weather Forecast</h3>
                ${currentTemp ? `<div class="current-temp">Current: ${Math.round(currentTemp)}°C</div>` : ''}
            </div>
            <div class="forecast-grid">
                ${forecastCards}
            </div>
            <div class="weather-footer">
                <p style="color: var(--success); font-weight: 600;">
                    ${getCleanupRecommendation(forecasts[0])}
                </p>
                ${generalForecast.forecast ? `<p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--gray-700);">${generalForecast.forecast}</p>` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Error displaying weather:', error);
        weatherWidget.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--gray-700); margin-bottom: 1rem;">Unable to load weather forecast</p>
                <button class="btn btn-primary" onclick="displayWeather()">Retry</button>
            </div>
        `;
    }
}

/**
 * Get cleanup recommendation based on forecast
 */
function getCleanupRecommendation(todayForecast) {
    const forecastLower = todayForecast.forecast.toLowerCase();
    const highTemp = todayForecast.temperature.high;
    
    if (forecastLower.includes('thunder') || forecastLower.includes('heavy rain')) {
        return '⚠️ Not ideal for cleanup today. Stay safe and check back tomorrow!';
    } else if (forecastLower.includes('shower') || forecastLower.includes('rain')) {
        return '🌧️ Possible rain expected. Bring waterproof gear!';
    } else if (highTemp > 32) {
        return '🌡️ Hot day ahead! Remember sunscreen, hat, and plenty of water.';
    } else if (forecastLower.includes('fair') || forecastLower.includes('sunny')) {
        return '✨ Perfect weather for a beach cleanup! Let\'s go! 🏖️';
    } else {
        return '👍 Good conditions for cleanup. See you at the beach!';
    }
}

// ============================================
// Events Functions
// ============================================

/**
 * Get mock events data
 */
function getMockEvents() {
    return [
        {
            id: 1,
            title: 'Sunset Beach Cleanup',
            date: '2025-12-05',
            time: '16:00',
            location: 'Bondi Beach, Sydney',
            attendees: 23,
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
        },
        {
            id: 2,
            title: 'Saturday Squad Session',
            date: '2025-12-07',
            time: '09:00',
            location: 'Venice Beach, LA',
            attendees: 45,
            image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'
        },
        {
            id: 3,
            title: 'Morning Coastal Care',
            date: '2025-12-08',
            time: '08:00',
            location: 'Miami Beach, FL',
            attendees: 31,
            image: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400'
        }
    ];
}

/**
 * Display events on the page
 */
function displayEvents(events) {
    const eventsGrid = document.getElementById('eventsGrid');
    
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <p style="font-size: 1.25rem; color: var(--gray-700);">No upcoming events found.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" id="createFirstEvent">Create First Event</button>
            </div>
        `;
        return;
    }
    
    eventsGrid.innerHTML = events.map(event => `
        <article class="event-card">
            <img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <span>📅</span>
                        <span>${formatDate(event.date)} at ${event.time}</span>
                    </div>
                    <div class="event-meta-item">
                        <span>📍</span>
                        <span>${event.location}</span>
                    </div>
                    <div class="event-meta-item">
                        <span>👥</span>
                        <span>${event.attendees} attending</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn btn-primary" data-event-id="${event.id}">Join Cleanup</button>
                    <button class="btn btn-text" data-event-id="${event.id}">Details</button>
                </div>
            </div>
        </article>
    `).join('');
    
    // Add event listeners to event cards
    eventsGrid.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', handleJoinEvent);
    });
}

/**
 * Handle joining an event
 */
function handleJoinEvent(e) {
    const eventId = e.target.dataset.eventId;
    showToast('🎉 Successfully joined the cleanup event!');
    
    // Here you would typically make an API call to join the event
    console.log('Joining event:', eventId);
}

// ============================================
// Navigation Functions
// ============================================

/**
 * Handle navigation toggle (mobile)
 */
function setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            const isExpanded = navList.classList.contains('active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Handle nav link clicks
    const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.currentTarget.classList.add('active');
            // Close mobile menu
            if (navList) {
                navList.classList.remove('active');
            }
        });
    });
}

/**
 * Handle smooth scrolling with offset for fixed header
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Intersection Observer for Animations
// ============================================

/**
 * Setup intersection observer for scroll animations
 */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate counters when hero section is visible
                if (entry.target.classList.contains('hero-stats')) {
                    const counters = entry.target.querySelectorAll('.stat-value');
                    counters.forEach(animateCounter);
                }
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe sections for animation
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// ============================================
// Button Event Handlers
// ============================================

/**
 * Handle "Find Cleanups Near Me" button
 */
async function handleFindCleanups() {
    try {
        showToast('📍 Getting your location...');
        const location = await getUserLocation();
        showToast('✅ Location acquired! Loading cleanups...');
        
        // Scroll to map section
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Location error:', error);
        showToast('❌ Unable to access location. Please enable location services.');
    }
}

/**
 * Handle "Create Event" button
 */
function handleCreateEvent() {
    showToast('🚀 Event creation coming soon!');
    // This would open a modal or navigate to event creation page
    console.log('Create event clicked');
}

/**
 * Setup button event listeners
 */
function setupButtonHandlers() {
    const findCleanupBtn = document.getElementById('findCleanupBtn');
    const createEventBtn = document.getElementById('createEventBtn');
    const viewAllEventsBtn = document.getElementById('viewAllEventsBtn');
    const toastClose = document.querySelector('.toast-close');
    
    if (findCleanupBtn) {
        findCleanupBtn.addEventListener('click', handleFindCleanups);
    }
    
    if (createEventBtn) {
        createEventBtn.addEventListener('click', handleCreateEvent);
    }
    
    if (viewAllEventsBtn) {
        viewAllEventsBtn.addEventListener('click', () => {
            showToast('📋 Showing all events...');
        });
    }
    
    if (toastClose) {
        toastClose.addEventListener('click', () => {
            document.getElementById('toast').classList.remove('show');
        });
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🌊 ShoreSquad initializing...');
    
    // Setup navigation and interactions
    setupNavigation();
    setupSmoothScroll();
    setupButtonHandlers();
    setupScrollAnimations();
    
    // Load saved data from localStorage
    const savedLocation = loadFromStorage('userLocation');
    
    // Fetch and display weather forecast
    displayWeather();
    
    // Load and display mock events
    const events = getMockEvents();
    appState.events = events;
    setTimeout(() => {
        displayEvents(events);
    }, 1000); // Simulate loading delay
    
    // Mark as initialized
    appState.initialized = true;
    
    console.log('✅ ShoreSquad ready!');
    showToast('🌊 Welcome to ShoreSquad!', 2000);
}

// ============================================
// Start Application
// ============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ============================================
// Service Worker Registration (PWA)
// ============================================

/**
 * Register service worker for PWA functionality
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// ============================================
// Export for testing (if needed)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appState,
        getUserLocation,
        fetchWeatherData,
        displayWeather,
        displayEvents
    };
}
