/**
 * ShoreSquad - Main JavaScript Application
 * Features: Geolocation, Weather API, LocalStorage, Animations
 */

// ============================================
// Configuration & State
// ============================================

const APP_CONFIG = {
    weatherAPIKey: 'YOUR_OPENWEATHERMAP_API_KEY', // Replace with actual API key
    weatherAPIUrl: 'https://api.openweathermap.org/data/2.5/weather',
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
// Weather API Functions
// ============================================

/**
 * Fetch weather data from OpenWeatherMap API
 */
async function fetchWeatherData(lat, lon) {
    try {
        const url = `${APP_CONFIG.weatherAPIUrl}?lat=${lat}&lon=${lon}&units=metric&appid=${APP_CONFIG.weatherAPIKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather data unavailable');
        }
        
        const data = await response.json();
        appState.currentWeather = data;
        saveToStorage('currentWeather', data);
        return data;
    } catch (error) {
        console.error('Weather fetch error:', error);
        // Return mock data if API fails
        return getMockWeatherData();
    }
}

/**
 * Mock weather data for development
 */
function getMockWeatherData() {
    return {
        name: 'Sample Beach',
        main: {
            temp: 24,
            feels_like: 23,
            humidity: 65
        },
        weather: [
            {
                main: 'Clear',
                description: 'clear sky',
                icon: '01d'
            }
        ],
        wind: {
            speed: 5.2
        },
        visibility: 10000
    };
}

/**
 * Display weather data
 */
function displayWeather(weatherData) {
    const weatherWidget = document.getElementById('weatherWidget');
    
    const weatherIcons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️'
    };
    
    const icon = weatherIcons[weatherData.weather[0].main] || '🌤️';
    const temp = Math.round(weatherData.main.temp);
    const feelsLike = Math.round(weatherData.main.feels_like);
    
    weatherWidget.innerHTML = `
        <div class="weather-content">
            <div class="weather-main">
                <span class="weather-icon">${icon}</span>
                <div>
                    <div class="weather-temp">${temp}°C</div>
                    <div style="color: var(--gray-700);">Feels like ${feelsLike}°C</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <span>📍</span>
                    <span>${weatherData.name}</span>
                </div>
                <div class="weather-detail">
                    <span>💨</span>
                    <span>Wind: ${weatherData.wind.speed} m/s</span>
                </div>
                <div class="weather-detail">
                    <span>💧</span>
                    <span>Humidity: ${weatherData.main.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span>👁️</span>
                    <span>Visibility: ${(weatherData.visibility / 1000).toFixed(1)} km</span>
                </div>
            </div>
        </div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
            <p style="color: var(--success); font-weight: 600;">
                ${getWeatherRecommendation(weatherData)}
            </p>
        </div>
    `;
}

/**
 * Get weather-based recommendation
 */
function getWeatherRecommendation(weatherData) {
    const condition = weatherData.weather[0].main;
    const temp = weatherData.main.temp;
    
    if (condition === 'Rain' || condition === 'Thunderstorm') {
        return '🌧️ Not ideal for cleanup today. Check back tomorrow!';
    } else if (temp > 30) {
        return '🌡️ Hot day! Remember sunscreen and hydration.';
    } else if (temp < 15) {
        return '🧥 Bit chilly! Bring a jacket for the cleanup.';
    } else {
        return '✨ Perfect weather for a beach cleanup!';
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
        
        // Fetch weather for the location
        const weather = await fetchWeatherData(location.lat, location.lon);
        displayWeather(weather);
        
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
    const savedWeather = loadFromStorage('currentWeather');
    
    // Display saved weather or fetch new data
    if (savedWeather) {
        displayWeather(savedWeather);
    }
    
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
