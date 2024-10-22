const openweathermapapiKey = '';  // API from OpenWeatherMap
const WeatherAPIKey = '';  // API from weatherapi
const button =       document.getElementById('send_data');
const get_my =       document.getElementById('get_my');
const locationInput =document.getElementById('location');
const cityName =     document.getElementById('city-name');
const temp =         document.getElementById('temp');
const description =  document.getElementById('description');
const humidity =     document.getElementById('humidity');
const windSpeed =    document.getElementById('wind-speed');
window.onload = function() {
  getData('warszawa', 0, 0, 'metric');
};


let city;
button.addEventListener('click', () => {
  let temptype = document.querySelector('input[name="temptype"]:checked').value
    city = locationInput.value;
    if (city) {
      getData(city,0,0,temptype);
    } else {
      alert('Please enter a location');
    }
  });



get_my.addEventListener('click', () => {
  let temptype = document.querySelector('input[name="temptype"]:checked').value

    if (navigator.geolocation) {
      city = "Use my localization";
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;  // Szerokość geograficzna
        const lon = position.coords.longitude;  // Długość geograficzna

        getData(city,lat,lon,temptype)
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
});


async function getData(city,lat,lon,temptype){
  if(city!=="Use my localization"){
      urlget_my = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openweathermapapiKey}&units=${temptype}`;
    openweathermapData1 = await fastFetch(urlget_my)
    lat = openweathermapData1.coord.lat
    lon = openweathermapData1.coord.lon
  }else{
      urlget_my = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweathermapapiKey}&units=${temptype}`;
    openweathermapData1 = await fastFetch(urlget_my)
  }
  const urlget_my5 = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openweathermapapiKey}&units=${temptype}`;
openweathermapData2 = await fastFetch(urlget_my5)
getWeather(openweathermapData1,openweathermapData2,temptype)


  const WeatherAPI =`http://api.weatherapi.com/v1/forecast.json?key=${WeatherAPIKey}&q=${lat},${lon}&days=7&aqi=no&alerts=no`
dataWeatherAPI = await fastFetch(WeatherAPI)
console.log(temptype)
get24h(dataWeatherAPI,temptype)

 if(temptype=="metric")temptype="celsius"
  else temptype="fahrenheit"
const OpenMeteo = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${temptype}`;
dataOpenMeteo = await fastFetch(OpenMeteo)

getmoreWater(dataOpenMeteo,dataWeatherAPI,temptype)
}


function get24h(dataWeatherAPI,temptype){
  console.log(dataWeatherAPI)
  let currentTime = new Date();
  const year = currentTime.getFullYear(); 
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0'); // Miesiące są indeksowane od 0, więc dodajemy 1
  const day = currentTime.getDate().toString().padStart(2, '0');           // Dzień
  const hours = currentTime.getHours().toString().padStart(2, '0');       // Godzin
  currentTime = `${year}-${month}-${day} ${hours}:00`
 console.log(currentTime)
  let findTimeIndex;
  let data24=[];
  let labels24 = [];
 for(i=0;i<24;i++){
  if(dataWeatherAPI.forecast.forecastday[0].hour[i].time==currentTime){
    findTimeIndex=i
    break
  }
 }
 updateWeatherIcon(dataWeatherAPI, findTimeIndex)


 if(temptype=="metric"){
  for (let i = findTimeIndex; i < 24 + findTimeIndex; i++) {
    if (i < 24) {
      data24.push(dataWeatherAPI.forecast.forecastday[0].hour[i].temp_c);
      labels24.push(dataWeatherAPI.forecast.forecastday[0].hour[i].time.split(' ')[1]); 
    } else {
      const nextDayHourIndex = i - 24;
      data24.push(dataWeatherAPI.forecast.forecastday[1].hour[nextDayHourIndex].temp_c);
      labels24.push(dataWeatherAPI.forecast.forecastday[1].hour[nextDayHourIndex].time.split(' ')[1]);
    }
  }
} else {
  for (let i = findTimeIndex; i < 24 + findTimeIndex; i++) {
    if (i < 24) {
      data24.push(dataWeatherAPI.forecast.forecastday[0].hour[i].temp_f);
      labels24.push(dataWeatherAPI.forecast.forecastday[0].hour[i].time.split(' ')[1]);
    } else {
      const nextDayHourIndex = i - 24;
      data24.push(dataWeatherAPI.forecast.forecastday[1].hour[nextDayHourIndex].temp_f);
      labels24.push(dataWeatherAPI.forecast.forecastday[1].hour[nextDayHourIndex].time.split(' ')[1]); 
    }
  }
}
 console.log(labels24)
 create24hChart(data24, labels24, temptype);

 console.log(data24)
}








function getmoreWater(dataOpenMeteo, dataWeatherAPI,temptype) {
  console.log(dataOpenMeteo);
  console.log(dataWeatherAPI);


  const openMeteoMaxTemps = dataOpenMeteo.daily.temperature_2m_max.slice(0, 7);
  const openMeteoMinTemps = dataOpenMeteo.daily.temperature_2m_min.slice(0, 7); 
    let weatherAPIMaxTemps;
    let weatherAPIMinTemps;
  if(temptype=="celsius"){
    weatherAPIMaxTemps = dataWeatherAPI.forecast.forecastday.map(day => day.day.maxtemp_c); 
    weatherAPIMinTemps = dataWeatherAPI.forecast.forecastday.map(day => day.day.mintemp_c); 
    temptype="°C"
  }else{
    weatherAPIMaxTemps = dataWeatherAPI.forecast.forecastday.map(day => day.day.maxtemp_f);
    weatherAPIMinTemps = dataWeatherAPI.forecast.forecastday.map(day => day.day.mintemp_f);
    temptype='°F'
  }

  const openMeteoAvgTemps = [];
  const weatherAPIAvgTemps = [];
  const labels = dataWeatherAPI.forecast.forecastday.map(day => day.date); 

  for (let i = 0; i < 7; i++) {
    const openMeteoAvgTemp = Math.round((openMeteoMaxTemps[i] + openMeteoMinTemps[i]) / 2 * 100) / 100; 
    const weatherAPIAvgTemp = Math.round((weatherAPIMaxTemps[i] + weatherAPIMinTemps[i]) / 2 * 100) / 100; 
    
    openMeteoAvgTemps.push(openMeteoAvgTemp); 
    weatherAPIAvgTemps.push(weatherAPIAvgTemp); 
  }

  // Tworzymy dane do wykresu
  const chartData = {
    labels: labels,  
    datasets: [
      {
        name: `OpenMeteo (${temptype})`,  
        values: openMeteoAvgTemps,                   
        color: '#af7777'                             
      },
      {
        name: `WeatherAPI (${temptype})`, 
        values: weatherAPIAvgTemps,                
        color: '#ff000080'                            
      }
    ]
  };

 
  const chart2 = new frappe.Chart("#chart3", {
    title: "Comparison of Average Temperatures: OpenMeteo vs WeatherAPI over 7 Days",
    data: chartData,
    axisOptions: {
      xAxisMode: 'tick', 
      xIsSeries: true,   
    },
    type: 'line',   
    height: 250,    
    colors: ['#af7777', '#ff000080'] 
  });
}


async function getWeather(data,data2,temptype) {
 if(temptype=="metric")temptype="°C"
 else temptype='°F'

  if (data.cod === 200) {

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temp.textContent = `Temperature: ${data.main.temp}${temptype}`;
    description.textContent = `Weather: ${data.weather[0].description}`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} m/s`;
   
  } else {
    alert('City not found, please try again.');
  }

 const dailyData = {};

  data2.list.forEach(forecast => {
              const date = new Date(forecast.dt * 1000);
              const day = date.toISOString().split('T')[0];  // YYYY-MM-DD

              if (!dailyData[day]) {
                  dailyData[day] = {
                      maxTemp: forecast.main.temp_max,
                      minTemp: forecast.main.temp_min
                  };
              } else {
                  dailyData[day].maxTemp = Math.max(dailyData[day].maxTemp, forecast.main.temp_max);
                  dailyData[day].minTemp = Math.min(dailyData[day].minTemp, forecast.main.temp_min);
              }
          });
          const labels = Object.keys(dailyData); 
          const maxTemperatures = labels.map(day => dailyData[day].maxTemp);
          const minTemperatures = labels.map(day => dailyData[day].minTemp); 

          
          minTemperatures.push(newData(minTemperatures) ) ;
          minTemperatures.push(newData(minTemperatures) ) ;
          maxTemperatures.push(newData(maxTemperatures) ) ;
          maxTemperatures.push(newData(maxTemperatures) ) ;

          labels.push(newDay(labels));
          labels.push(newDay(labels));

          const chart = new frappe.Chart("#chart2", {
              title: `7-Day Temperature Forecast`,
              data: {
                  labels: labels,
                  datasets: [
                      {
                          name: `Max Temperature (${temptype})`, 
                          values: maxTemperatures
                      },
                      {
                          name: `Min Temperature (${temptype})`, 
                          values: minTemperatures
                      }
                  ]
              },
              axisOptions: {
                xAxisMode: 'tick',
                xIsSeries: true,  
              },
              type: 'line',  
              height: 250,
              colors: ['#ff4d4d', '#1c91f9']  
});
}



function newDay(labels) {
    let lastDate = labels[labels.length - 1];
    let date = new Date(lastDate);
  
    date.setDate(date.getDate() + 1);
    let newDate = date.toISOString().split('T')[0]; 
    return newDate;
}

function newData(maxmin) {
    let y =0;
    let x =maxmin.length-1;
  
    for(i=0; i<x; i++)y +=(maxmin[i+1]-maxmin[i])
    
    y/=x
    y+=maxmin[x]
    y=Math.round(y)
    return y;
}


async function fastFetch (url) {
  let response = await fetch(url);
  let weatherdata = await response.json();
  
  return weatherdata
}

function create24hChart(temperatureData, labels, temptype) {
  const unit = temptype === "metric" ? "°C" : "°F";

  const chartData = {
    labels: labels, 
    datasets: [
      {
        name: `Temperature (${unit})`,
        values: temperatureData 
      }
    ]
  };

  const chart = new frappe.Chart("#chart1", {
    title: `Temperature Forecast for Next 24 Hours (${unit})`,
    data: chartData,
    type: 'line', 
    height: 250,
    colors: ['#ff4d4d'], 
    axisOptions: {
      xAxisMode: 'tick', 
      xIsSeries: true, 
    },
    lineOptions: {
      dotSize: 6,        // Wielkość kropek na wykresie
    }
  });
}



function updateWeatherIcon(dataWeatherAPI, findTimeIndex) {
  const currentHourData = dataWeatherAPI.forecast.forecastday[0].hour[findTimeIndex];

  const iconUrl = currentHourData.condition.icon;
  const iconElement = document.getElementById("icon");
  const imgElement = document.createElement("img");
  imgElement.src = iconUrl;
  imgElement.alt = currentHourData.condition.text; 
  iconElement.innerHTML = ""; 
  iconElement.appendChild(imgElement);
}