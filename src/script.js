// API key is now stored in localStorage instead of being hardcoded
let API_KEY = "";
const API_BASE_URL = "https://api.weatherapi.com/v1";
const API_KEY_STORAGE_NAME = "weatherForMe_apiKey";

// DOM elements for API key input
const apiKeyContainer = document.getElementById("api-key-container");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeySubmit = document.getElementById("api-key-submit");
const apiKeyError = document.getElementById("api-key-error");
const weatherAppUI = document.getElementById("weather-app-ui");
const resetApiKey = document.getElementById("reset-api-key");

// Weather app DOM elements
const cityInput = document.getElementById("city-input");
const cityDropdown = document.getElementById("city-dropdown");
const searchButton = document.getElementById("search-button");
const weatherInfoGrid = document.getElementById("weather-info");
const errorMessageElement = document.getElementById("error-message");
const weatherInfoContainer = document.querySelector(".container-info");

const uiElements = {
    cityName: document.getElementById("city-name"),
    temperature: document.getElementById("temperature"),
    feelsLike: document.getElementById("feels-like"),
    perceptionChance: document.getElementById("perception-chance"),
    humidity: document.getElementById("humidity"),
    currentRain: document.getElementById("current-rain"),
    laterRain: document.getElementById("later-rain"),
};

const AUTOCOMPLETE_DELAY = 500;
const AUTOCOMPLETE_MIN_CHARS = 3;
const GLOW_DURATION = 1000;

let typingTimer;
let errorTimer;

// API Key handling functions
function saveApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE_NAME, key);
    API_KEY = key;
}

function getStoredApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_NAME);
}

function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE_NAME);
    API_KEY = "";
}

function showApiKeyError(message) {
    apiKeyError.textContent = message;
    apiKeyError.classList.add("show");
    setTimeout(() => {
        apiKeyError.classList.remove("show");
    }, 5000);
}

async function validateApiKey(key) {
    try {
        // Test API key with a simple request
        const testUrl = `${API_BASE_URL}/current.json?key=${key}&q=London`;
        const response = await fetch(testUrl);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Invalid API key. Please check and try again.");
            }
            throw new Error(`API Error: ${response.status}`);
        }
        
        // If we get here, the key is valid
        return true;
    } catch (error) {
        showApiKeyError(error.message);
        return false;
    }
}

function showWeatherApp() {
    apiKeyContainer.style.display = "none";
    weatherAppUI.style.display = "block";
}

function showApiKeyForm() {
    apiKeyContainer.style.display = "block";
    weatherAppUI.style.display = "none";
}

function displayError(message) {
    clearTimeout(errorTimer);
    errorMessageElement.textContent = message;
    errorMessageElement.classList.add("show");

    // Automatically hide the error after 5 seconds
    errorTimer = setTimeout(() => {
        clearError();
    }, 5000);
}

function clearError() {
    clearTimeout(errorTimer);
    errorMessageElement.classList.remove("show");
}

function updateUI(data) {
    clearError();

    uiElements.cityName.textContent = `${data.location.name}, ${data.location.country}`;
    uiElements.temperature.textContent = `Temp: ${Math.round(data.current.temp_c)}°C`;
    uiElements.feelsLike.textContent = `Feels Like: ${Math.round(data.current.feelslike_c)}°C`;
    uiElements.humidity.textContent = `Humidity: ${data.current.humidity}%`;

    const todayForecast = data.forecast.forecastday[0];
    uiElements.perceptionChance.textContent = `Rain Chance: ${todayForecast.day.daily_chance_of_rain}%`;

    const isRainingNow = data.current.precip_mm > 0 || data.current.condition.text.toLowerCase().includes("rain");
    uiElements.currentRain.textContent = isRainingNow ? "Raining Now" : "Not Raining Now";

    // Check for rain in the next few hours
    const currentHour = new Date(data.location.localtime).getHours();
    const hoursToCheck = 6;
    let willRainLater = false;
    for (let i = 1; i <= hoursToCheck; i++) {
        const checkHourIndex = (currentHour + i) % 24; // Handle day wrap-around
        if (todayForecast.hour[checkHourIndex] && todayForecast.hour[checkHourIndex].will_it_rain > 0) {
            willRainLater = true;
            break;
        }
    }
    uiElements.laterRain.textContent = willRainLater ? `Rain Expected Soon` : `No Rain Expected Soon`;

    // Show the container after populating, ensuring animation reveals new content
    if (!weatherInfoContainer.classList.contains('show')) {
        // Use a tiny timeout to allow browser paint before animation starts
        setTimeout(() => {
            weatherInfoContainer.classList.add('show');
        }, 10);
    }
}

function clearUIText() {
    Object.values(uiElements).forEach(el => {
        if (el) el.textContent = "";
    });
}

function triggerButtonGlow() {
    searchButton.classList.add('glow-effect');
    setTimeout(() => {
        searchButton.classList.remove('glow-effect');
    }, GLOW_DURATION);
}

async function fetchCitySuggestions(query) {
    if (!query || query.length < AUTOCOMPLETE_MIN_CHARS) {
        cityDropdown.innerHTML = "";
        cityDropdown.classList.remove("show");
        return;
    }

    try {
        const url = `${API_BASE_URL}/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const cities = await response.json();
        displayCitySuggestions(cities);
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
    }
}

async function getWeatherData() {
    const city = cityInput.value.trim();
    const transitionDuration = 500; // Match CSS transition duration

    if (!city) {
        displayError("Please enter a city name.");
        triggerButtonGlow();
        return;
    }

    // Hide existing results before fetching
    let hideCompleted = Promise.resolve();
    if (weatherInfoContainer.classList.contains('show')) {
        weatherInfoContainer.classList.remove('show');
        // Wait for hide animation to finish
        hideCompleted = new Promise(resolve => setTimeout(resolve, transitionDuration));
    }

    await hideCompleted;

    clearUIText();
    clearError();

    try {
        const url = `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=1`;
        const response = await fetch(url);

        if (!response.ok) {
            // Specific error for city not found
            if (response.status === 400) {
                 throw new Error(`City "${city}" not found. Please check the spelling or try the dropdown.`);
            } else {
                throw new Error(`API error! Status: ${response.status}`);
            }
        }

        const data = await response.json();
        updateUI(data);
        cityInput.value = "";

    } catch (error) {
        console.error("Error fetching weather data:", error);
        displayError(error.message || "Failed to fetch weather data. Please try again.");
        triggerButtonGlow();
        // Ensure container stays hidden if fetch fails after hide animation
        weatherInfoContainer.classList.remove('show');
    }
}

function displayCitySuggestions(cities) {
    cityDropdown.innerHTML = "";

    if (!cities || !cities.length) {
        cityDropdown.classList.remove("show");
        return;
    }

    cities.forEach(city => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.textContent = `${city.name}${city.region ? ', ' + city.region : ''}, ${city.country}`;

        item.addEventListener("click", () => {
            cityInput.value = `${city.name}, ${city.country}`;
            cityDropdown.classList.remove("show");
            getWeatherData();
        });

        cityDropdown.appendChild(item);
    });

    cityDropdown.classList.add("show");
}

cityInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        fetchCitySuggestions(cityInput.value.trim());
    }, AUTOCOMPLETE_DELAY);
});

searchButton.addEventListener("click", getWeatherData);

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        cityDropdown.classList.remove("show");
        getWeatherData();
    }
});

document.addEventListener("click", (e) => {
    // Hide dropdown if click is outside search input and dropdown itself
    if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
        cityDropdown.classList.remove("show");
    }
});

// Add event listener for API key submission
apiKeySubmit.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
        showApiKeyError("Please enter an API key");
        return;
    }
    
    const isValid = await validateApiKey(key);
    if (isValid) {
        saveApiKey(key);
        showWeatherApp();
    }
});

// Add event listener for reset API key
resetApiKey.addEventListener("click", (e) => {
    e.preventDefault();
    clearApiKey();
    apiKeyInput.value = "";
    showApiKeyForm();
});

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
    const storedApiKey = getStoredApiKey();
    if (storedApiKey) {
        API_KEY = storedApiKey;
        showWeatherApp();
    } else {
        showApiKeyForm();
    }
});