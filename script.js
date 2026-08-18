// แก้ไขปัญหาหาภาพหมุดไม่พบ โดยกำหนดให้ดึงจาก CDN โดยตรง
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 1. สร้างแผนที่และกำหนดจุดเริ่มต้น (กรุงเทพฯ)
var map = L.map('map').setView([16.43211368, 102.8356812], 11);

// 2. ดึงแผนที่พื้นหลัง OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 3. ดึงข้อมูลพิกัดโรงเรียนจาก Google Apps Script API
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec'; 

fetch(GAS_URL)
  .then(response => response.json())
  .then(schools => {
    schools.forEach(school => {
      if (school.lat && school.lng) {
        L.marker([school.lat, school.lng]).addTo(map)
          .bindPopup(`<b>${school.name}</b><br>${school.address}`);
      }
    });
  })
  .catch(error => console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error));


L.marker([school.lat, school.lng]).addTo(map)
  .bindPopup(`
    <b>${school.name}</b><br>
    ${school.address}<br><br>
    <button onclick="analyzeSchool('${school.name}', '${school.address}')" 
            style="background: #4CAF50; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">
      🤖 วิเคราะห์ทำเล/ข้อมูลด้วย AI
    </button>
  `);
