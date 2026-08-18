// ดึงข้อมูลจาก Google Apps Script
fetch('https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec')
  .then(response => response.json())
  .then(schools => {
    schools.forEach(school => {
      // ปักหมุดลงแผนที่
      L.marker([school.lat, school.lng]).addTo(map)
        .bindPopup(`<b>${school.name}</b><br>${school.address}`);
    });
  });
