// แก้ไขปัญหาภาพหมุดไม่พบ
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

var map = L.map('map').setView([16.4321, 102.8356], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// สร้าง Layer Group ไว้เก็บหมุด (สำคัญมากสำหรับการค้นหา)
const schoolMarkers = L.layerGroup().addTo(map);

const NGROK_URL = 'https://tipped-roast-tamale.ngrok-free.dev';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec'; 

fetch(GAS_URL)
  .then(response => response.json())
  .then(schools => {
    schools.forEach(school => {
      if (school.lat && school.lng) {
        
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <b>${school.name}</b><br>
          <small>${school.address}</small><hr style="margin: 5px 0;">
          <button style="background: #2563eb; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; font-size: 12px;">
            🤖 ให้ AI วิเคราะห์โรงเรียนนี้
          </button>
          <p style="margin-top: 5px; font-size: 12px; color: #333;"></p>
        `;

        popupContent.querySelector('button').addEventListener('click', () => {
          const aiBox = popupContent.querySelector('p');
          aiBox.innerHTML = '⏳ กำลังให้ AI วิเคราะห์ข้อมูล...';
          fetch(`${NGROK_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: school.name, address: school.address })
          })
          .then(res => res.json())
          .then(data => { aiBox.innerHTML = `<b>AI แนะนำ:</b> ${data.result}`; })
          .catch(err => { aiBox.innerHTML = '❌ เกิดข้อผิดพลาด'; console.error(err); });
        });

        // สร้างหมุดและเพิ่ม property 'name' ให้ Marker เพื่อให้ Search หาเจอ
        const marker = L.marker([school.lat, school.lng]).bindPopup(popupContent);
        marker.name = school.name; // กำหนดชื่อให้ Marker
        marker.addTo(schoolMarkers); // เพิ่มเข้า Layer Group แทน map
      }
    });

    // เพิ่มระบบ Search
    map.addControl(new L.Control.Search({
        layer: schoolMarkers,
        propertyName: 'name', // ค้นหาจาก property .name ที่เราตั้งไว้
        initial: false,
        zoom: 16,
        marker: false,
        textPlaceholder: 'ค้นหาชื่อโรงเรียน...'
    }));
  })
  .catch(error => console.error('Error:', error));
