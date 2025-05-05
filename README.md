# WeatherForMe

A simple web application to display current weather information for a searched city, built with HTML, CSS, and vanilla JavaScript.

## Features

*   Search for weather by city name.
*   Autocomplete suggestions for city names as you type.
*   Displays current temperature, "feels like" temperature, humidity, and chance of rain.
*   Indicates if it's currently raining or expected to rain soon.
*   Animated UI elements for a smoother user experience.
*   Responsive design for different screen sizes.

## Setup

1.  **Clone the repository (or download the files):**
    ```bash
    git clone <your-repository-url>
    cd WeatherForMe
    ```
2.  **Get a WeatherAPI.com API Key:**
    *   Sign up for a free API key at [https://www.weatherapi.com/](https://www.weatherapi.com/).
3.  **Add API Key:**
    *   Open the `src/script.js` file.
    *   Find the line `const API_KEY = "YOUR_API_KEY_HERE";` (or similar).
    *   Replace `"YOUR_API_KEY_HERE"` with the actual API key you obtained.

## How to Run

Simply open the `src/index.html` file in your web browser. No build step or local server is required for the basic functionality.

## API Used

*   [WeatherAPI.com](https://www.weatherapi.com/) - Provides weather data and city search functionality.

## Project Structure

```
WeatherForMe/
├── .gitignore         # Files ignored by Git
├── README.md          # This file
└── src/
    ├── index.html     # Main HTML structure
    ├── script.js      # JavaScript logic and API interaction
    ├── styles.css     # CSS styling
└── media/
	└── images/
		└── sunny_cloud_logo_text.png # Logo image
	└── fonts/
		└── Ultra-font.html # Font
```