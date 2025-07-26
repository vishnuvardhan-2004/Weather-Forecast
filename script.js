// script.js
const weatherAPIKey = "0e3f0c0af3f9ffd51d63141fddaf5fdc";
const geoAPIKey = "7e934112a76f5d18ac4e235954c53e5c";

const currentWeather = document.getElementById("currentWeather");
const forecastList = document.getElementById("forecastList");
const forecastTitle = document.getElementById("forecastTitle");
const cityInput = document.getElementById("cityInput");

async function getWeather() {
  const city = cityInput.value.trim();
  if (!city) {
    alert("Please enter a city name");
    return;
  }

  try {
    // Show loading state
    currentWeather.innerHTML = '<p style="text-align: center; font-size: 1.2rem;">Loading weather data...</p>';
    currentWeather.classList.remove("hidden");
    forecastList.innerHTML = '';
    forecastTitle.classList.add("hidden");
    forecastList.classList.add("hidden");

    // Get coordinates
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${geoAPIKey}`
    );
    
    if (!geoRes.ok) {
      throw new Error("Failed to fetch location data");
    }
    
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error("City not found");

    const { lat, lon, name, country } = geoData[0];
    
    // Get current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherAPIKey}`
    );
    
    if (!currentRes.ok) {
      throw new Error("Failed to fetch current weather data");
    }
    
    const currentData = await currentRes.json();

    // Get 5-day forecast
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherAPIKey}`
    );
    
    if (!weatherRes.ok) {
      throw new Error("Failed to fetch forecast data");
    }
    
    const weatherData = await weatherRes.json();

    displayCurrentWeather(currentData, name, country);
    displayForecast(weatherData.list);
  } catch (err) {
    console.error("Weather API Error:", err);
    currentWeather.innerHTML = `<p style="color:red; text-align: center;">Error: ${err.message}</p>`;
    currentWeather.classList.remove("hidden");
    forecastTitle.classList.add("hidden");
    forecastList.classList.add("hidden");
  }
}

function displayCurrentWeather(data, cityName, country) {
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  // Format the display name
  const displayName = country ? `${cityName}, ${country}` : cityName;
  
  currentWeather.innerHTML = `
    <div class="current-weather-content">
      <h2>${displayName}</h2>
      <div class="weather-main">
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather icon" />
        <div class="temp-main">${Math.round(data.main.temp)}°C</div>
      </div>
      <p class="weather-description">${data.weather[0].description}</p>
      <div class="weather-details">
        <div class="detail-item">
          <strong>Feels Like:</strong> ${Math.round(data.main.feels_like)}°C
        </div>
        <div class="detail-item">
          <strong>Humidity:</strong> ${data.main.humidity}%
        </div>
        <div class="detail-item">
          <strong>Wind:</strong> ${data.wind.speed} m/s
        </div>
        <div class="detail-item">
          <strong>Pressure:</strong> ${data.main.pressure} hPa
        </div>
        <div class="detail-item">
          <strong>Sunrise:</strong> ${sunrise}
        </div>
        <div class="detail-item">
          <strong>Sunset:</strong> ${sunset}
        </div>
        ${data.visibility ? `<div class="detail-item"><strong>Visibility:</strong> ${(data.visibility/1000).toFixed(1)} km</div>` : ''}
      </div>
    </div>
  `;
  currentWeather.classList.remove("hidden");
}

function displayForecast(list) {
  forecastList.innerHTML = "";
  forecastTitle.classList.remove("hidden");
  forecastList.classList.remove("hidden");

  // Group forecast data by date
  const dailyData = {};
  
  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    const hour = parseInt(item.dt_txt.split(" ")[1].split(":")[0]);
    
    // Prefer mid-day forecasts (around 12-15) for daily representation
    if (!dailyData[date] || (hour >= 12 && hour <= 15)) {
      dailyData[date] = item;
    }
  });

  // Convert to array and sort by date, then take first 5 days
  const sortedDates = Object.keys(dailyData).sort().slice(0, 5);
  
  sortedDates.forEach(date => {
    const item = dailyData[date];
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${dayName}</h4>
      <div class="forecast-date">${formattedDate}</div>
      <img src="${iconUrl}" alt="${item.weather[0].description}" />
      <p class="forecast-temp">${Math.round(item.main.temp)}°C</p>
      <p class="forecast-description">${item.weather[0].description}</p>
      <div class="forecast-details">
        <div class="forecast-detail">
          <span>Min:</span> ${Math.round(item.main.temp_min)}°C
        </div>
        <div class="forecast-detail">
          <span>Max:</span> ${Math.round(item.main.temp_max)}°C
        </div>
        <div class="forecast-detail">
          <span>Humidity:</span> ${item.main.humidity}%
        </div>
        <div class="forecast-detail">
          <span>Wind:</span> ${item.wind.speed} m/s
        </div>
      </div>
    `;
    forecastList.appendChild(card);
  });
}

// Add event listener for Enter key
cityInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    getWeather();
  }
});

// Add event listener for button click
document.querySelector('button[onclick="getWeather()"]').addEventListener("click", getWeather);

// Optional: Load weather for a default city on page load
// window.addEventListener('load', function() {
//   cityInput.value = "London";
//   getWeather();
// });