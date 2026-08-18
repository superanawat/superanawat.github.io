// ดึงข้อมูลจาก Google Apps Script
fetch('https://script.google.com/macros/s/AKfycbzKjqKebNck4w5AOea_kZci5o7o-KVD5sbVa0pWf4PMZ3hAYWWYXOd6ltcRkwpzsYM85Q/exec')
  .then(response => response.json())
  .then(schools => {
    schools.forEach(school => {
      // ปักหมุดลงแผนที่
      L.marker([school.lat, school.lng]).addTo(map)
        .bindPopup(`<b>${school.name}</b><br>${school.address}`);
    });
  });
