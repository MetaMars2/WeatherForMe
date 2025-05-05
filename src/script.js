const API_KEY = ""; // Replace with your key
const API_BASE_URL = "https://api.weatherapi.com/v1";

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

function init() {
    clearUIText();
    clearError();
    weatherInfoContainer.classList.remove('show');
}

document.addEventListener("DOMContentLoaded", init);