const apiKey = "dif5euUk1RcZXNfKAeuaRzaKlnQvNEZB";

const currentWeather = document.getElementById("currentWeather");
const forecastList   = document.getElementById("forecastList");
const forecastTitle  = document.getElementById("forecastTitle");
const cityInput      = document.getElementById("cityInput");

/* ---------- helpers ---------- */
const iconUrl = n => `https://developer.accuweather.com/sites/default/files/${(n < 10 ? "0" : "") + n}-s.png`;

/* ---------- geo lookup ---------- */
async function getLocationKey(city) {
  const res = await fetch(
    `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(city)}`
  );
  const data = await res.json();
  if (!data.length) throw new Error("City / village not found");
  return {
    key: data[0].Key,
    name: `${data[0].LocalizedName}, ${data[0].Country.LocalizedName}`
  };
}

/* ---------- main fetch & render ---------- */
async function getWeather() {
  const city = cityInput.value.trim();
  if (!city) return alert("Please enter a location");

  currentWeather.innerHTML = "🌀 Loading…";
  currentWeather.classList.remove("hidden");
  forecastList.innerHTML = "";
  forecastTitle.classList.add("hidden");
  forecastList.classList.add("hidden");

  try {
    const loc = await getLocationKey(city);

    const curRes = await fetch(
      `https://dataservice.accuweather.com/currentconditions/v1/${loc.key}?apikey=${apiKey}&details=true`
    );
    const foreRes = await fetch(
      `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${loc.key}?apikey=${apiKey}&details=true&metric=true`
    );

    if (!curRes.ok || !foreRes.ok) throw new Error("AccuWeather error");

    const currentData = await curRes.json();
    const forecastData = await foreRes.json();

    renderToday(currentData[0], forecastData.DailyForecasts[0], loc.name);
    renderForecast(forecastData.DailyForecasts);
  } catch (err) {
    currentWeather.innerHTML = `<p style="color:red;text-align:center;">❗ ${err.message}</p>`;
  }
}

/* ---------- render today ---------- */
function renderToday(current, day, placeName) {
  const sunrise = day.Sun?.Rise
    ? new Date(day.Sun.Rise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    : "N/A";
  const sunset = day.Sun?.Set
    ? new Date(day.Sun.Set).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    : "N/A";

  currentWeather.innerHTML = `
    <h2>📍 ${placeName}</h2>
    <div class="today-main">${Math.round(current.Temperature.Metric.Value)}°C</div>
    <img src="${iconUrl(current.WeatherIcon)}" alt="${current.WeatherText}" width="64">
    <p>${current.WeatherText}</p>
    <div style="margin-top:8px">
      <div>🌡️ Feels like: ${Math.round(current.RealFeelTemperature.Metric.Value)}°C</div>
      <div>💧 Humidity: ${current.RelativeHumidity}%</div>
      <div>💨 Wind: ${Math.round(current.Wind.Speed.Metric.Value)} km/h</div>
      <div>🌅 Sunrise: ${sunrise}</div>
      <div>🌇 Sunset: ${sunset}</div>
    </div>
  `;
}

/* ---------- render 5-day forecast ---------- */
function renderForecast(days) {
  forecastTitle.classList.remove("hidden");
  forecastList.classList.remove("hidden"); // ✅ ensure it's visible
  forecastList.innerHTML = "";

  days.slice(0, 5).forEach(d => {
    const date = new Date(d.Date);
    const weekday = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const sunrise = d.Sun?.Rise
      ? new Date(d.Sun.Rise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : "N/A";

    const sunset = d.Sun?.Set
      ? new Date(d.Sun.Set).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : "N/A";

    const iconPhrase = d.Day.IconPhrase;
    const iconCode = d.Day.Icon;
    const iconSrc = iconUrl(iconCode);

    const max = Math.round(d.Temperature.Maximum.Value);
    const min = Math.round(d.Temperature.Minimum.Value);
    const realFeelMax = Math.round(d.RealFeelTemperature.Maximum.Value);
    const realFeelMin = Math.round(d.RealFeelTemperature.Minimum.Value);

    const wind = d.Day.Wind?.Speed?.Value || 0;
    const precip = d.Day.PrecipitationProbability || 0;

    const card = document.createElement("div");
    card.className = "forecast-card card";
    card.innerHTML = `
      <h4>${weekday}</h4>
      <img src="${iconSrc}" alt="${iconPhrase}" width="48">
      <div><strong>${max}° / ${min}°</strong></div>
      <div>${iconPhrase}</div>
      <div>🌡️ RealFeel: ${realFeelMax}° / ${realFeelMin}°</div>
      <div>🌧️ Precip: ${precip}%</div>
      <div>💨 Wind: ${wind} km/h</div>
      <div>🌅 Sunrise: ${sunrise}</div>
      <div>🌇 Sunset: ${sunset}</div>
    `;
    forecastList.appendChild(card);
  });
}

/* ---------- event listener ---------- */
cityInput.addEventListener("keypress", e => {
  if (e.key === "Enter") getWeather();
});
