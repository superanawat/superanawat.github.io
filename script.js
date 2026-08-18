// แก้ไขปัญหาภาพหมุดไม่พบ โดยกำหนดให้ดึงจาก CDN โดยตรง
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 1. สร้างแผนที่และกำหนดจุดเริ่มต้น
var map = L.map('map').setView([16.43211368, 102.8356812], 11);

// 2. ดึงแผนที่พื้นหลัง
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ตั้งค่า URL
const NGROK_URL = 'https://tipped-roast-tamale.ngrok-free.dev';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec'; 

// 3. ดึงข้อมูลพิกัดโรงเรียน
fetch(GAS_URL)
  .then(response => response.json())
  .then(schools => {
    schools.forEach(school => {
      if (school.lat && school.lng) {
        // สร้างเนื้อหาใน Popup พร้อมปุ่มเรียก AI
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <b>${school.name}</b><br>
          <small>${school.address}</small><hr style="margin: 5px 0;">
          <button style="background: #2563eb; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-size: 12px;">
            🤖 ให้ AI วิเคราะห์โรงเรียนนี้
          </button>
          <p style="margin-top: 5px; font-size: 12px; color: #333;"></p>
        `;

        // ผูกอีเวนต์คลิกปุ่ม AI
        popupContent.querySelector('button').addEventListener('click', () => {
          const aiBox = popupContent.querySelector('p');
          aiBox.innerHTML = '⏳ กำลังให้ AI วิเคราะห์ข้อมูล...';

          fetch(`${NGROK_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: school.name, address: school.address })
          })
          .then(res => res.json())
          .then(data => {
            aiBox.innerHTML = `<b>AI แนะนำ:</b> ${data.result}`;
          })
          .catch(err => {
            aiBox.innerHTML = '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI (ตรวจสอบว่ารัน Python app.py อยู่ไหม)';
            console.error(err);
          });
        });

        // สร้างหมุดบนแผนที่
        L.marker([school.lat, school.lng]).addTo(map).bindPopup(popupContent);
      }
    });
  })
  .catch(error => console.error('Error fetching schools:', error));
