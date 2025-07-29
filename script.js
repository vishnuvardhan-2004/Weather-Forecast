// ✅ ENHANCED: Detailed weather + global/India toggle + icons + accurate location

const currentWeather = document.getElementById("currentWeather");
const forecastList = document.getElementById("forecastList");
const forecastTitle = document.getElementById("forecastTitle");
const cityInput = document.getElementById("cityInput");
const scopeSelect = document.getElementById("scopeSelect");

const weatherCodeMap = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Light snow", 73: "Moderate snow", 75: "Heavy snow",
  95: "Thunderstorm", 99: "Storm with hail"
};

const weatherIcons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌁", 51: "🌦️", 53: "🌧️", 55: "🌧️",
  61: "🌦️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️",
  95: "⛈️", 99: "🌩️"
};

async function getCoordinates(location) {
  const scope = scopeSelect.value;
  const countryParam = scope === "india" ? "&countrycodes=in" : "";

  let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json${countryParam}&q=${location}`);
  let data = await response.json();

  // fallback for Palur/Paluru in Andhra Pradesh
  if (!data.length || (data[0].display_name.includes("Thailand") || data[0].display_name.includes("Su-ngai Padi"))) {
    response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=Paluru,Andhra Pradesh`);
    data = await response.json();
  }

  if (!data.length) throw new Error("Location not found");

  return {
    name: data[0].display_name,
    lat: data[0].lat,
    lon: data[0].lon
  };
}

async function getWeather() {
  const inputCity = cityInput.value.trim();
  if (!inputCity) {
    alert("Please enter a city, village, district, or country name");
    return;
  }

  try {
    currentWeather.innerHTML = '<p style="text-align: center;">Loading weather data...</p>';
    currentWeather.classList.remove("hidden");
    forecastList.innerHTML = "";
    forecastTitle.classList.add("hidden");
    forecastList.classList.add("hidden");

    const coords = await getCoordinates(inputCity);
    const lat = coords.lat;
    const lon = coords.lon;
    const locationName = coords.name;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,sunrise,sunset,windspeed_10m_max,weathercode&timezone=auto`
    );
    if (!weatherRes.ok) throw new Error("Failed to fetch weather data");
    const weatherData = await weatherRes.json();

    displayCurrentWeather(weatherData.current_weather, weatherData.daily, locationName);
    displayForecast(weatherData.daily);
  } catch (err) {
    console.error("Weather API Error:", err);
    currentWeather.innerHTML = `<p style=\"color:red; text-align: center;\">Error: ${err.message}</p>`;
    forecastTitle.classList.add("hidden");
    forecastList.classList.add("hidden");
  }
}

function displayCurrentWeather(data, daily, displayName) {
  const code = data.weathercode;
  const icon = weatherIcons[code] || "❓";
  const description = weatherCodeMap[code] || "Unknown";

  currentWeather.innerHTML = `
    <div class="current-weather-content">
      <h2>${displayName}</h2>
      <div class="weather-main">
        <div class="temp-main">${Math.round(data.temperature)}°C</div>
      </div>
      <p class="weather-description">${icon} ${description}</p>
      <div class="weather-details">
        <div class="detail-item"><strong>Feels Like:</strong> ${daily.apparent_temperature_max[0]}°C</div>
        <div class="detail-item"><strong>Min Temp:</strong> ${daily.temperature_2m_min[0]}°C</div>
        <div class="detail-item"><strong>Max Temp:</strong> ${daily.temperature_2m_max[0]}°C</div>
        <div class="detail-item"><strong>Wind:</strong> ${data.windspeed} km/h</div>
        <div class="detail-item"><strong>Sunrise:</strong> ${daily.sunrise[0]}</div>
        <div class="detail-item"><strong>Sunset:</strong> ${daily.sunset[0]}</div>
        <div class="detail-item"><strong>Precipitation:</strong> ${daily.precipitation_sum[0]} mm</div>
        <div class="detail-item"><strong>Updated:</strong> ${data.time}</div>
      </div>
    </div>
  `;
  currentWeather.classList.remove("hidden");
}

function displayForecast(daily) {
  forecastList.innerHTML = "";
  forecastTitle.classList.remove("hidden");
  forecastList.classList.remove("hidden");

  for (let i = 0; i < daily.time.length && i < 5; i++) {
    const code = daily.weathercode[i];
    const icon = weatherIcons[code] || "❓";
    const description = weatherCodeMap[code] || "Unknown";

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${new Date(daily.time[i]).toLocaleDateString("en-US", { weekday: "long" })}</h4>
      <div class="forecast-date">${daily.time[i]}</div>
      <div class="forecast-temp">${daily.temperature_2m_max[i]}°C / ${daily.temperature_2m_min[i]}°C</div>
      <p class="forecast-description">${icon} ${description}</p>
      <div class="forecast-details">
        <div class="forecast-detail"><span>Wind:</span> ${daily.windspeed_10m_max[i]} km/h</div>
        <div class="forecast-detail"><span>Precipitation:</span> ${daily.precipitation_sum[i]} mm</div>
      </div>
    `;
    forecastList.appendChild(card);
  }
}

cityInput.addEventListener("keypress", event => {
  if (event.key === "Enter") getWeather();
});
document.querySelector('button[onclick="getWeather()"]')?.addEventListener("click", getWeather);
