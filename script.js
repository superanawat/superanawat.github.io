// ==========================================
// 1. แก้ไขปัญหาภาพหมุด Leaflet ไม่แสดงผล
// ==========================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ==========================================
// 2. ตั้งค่าแผนที่และ Layer Group
// ==========================================
var map = L.map('map').setView([16.4321, 102.8356], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const NGROK_URL = 'https://tipped-roast-tamale.ngrok-free.dev';
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec';

const schoolMarkers = L.layerGroup().addTo(map);

// ==========================================
// 3. ฟังก์ชันช่วยจัดรูปแบบข้อความ AI (Markdown -> HTML)
// ==========================================
function formatAiResponse(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // แปลง **ตัวหนา** เป็น <strong>
    .replace(/\n/g, '<br>'); // แปลง ขึ้นบรรทัดใหม่ เป็น <br>
}

// ==========================================
// 4. ดึงข้อมูลโรงเรียนและสร้าง Popup บนแผนที่
// ==========================================
fetch(GAS_URL)
  .then((response) => response.json())
  .then((schools) => {
    schools.forEach((school) => {
      if (school.lat && school.lng) {
        const popupContent = document.createElement('div');
        popupContent.style.padding = '4px';

        popupContent.innerHTML = `
          <div style="margin-bottom: 8px;">
            <b style="font-size: 14px; color: #0f172a;">${school.name}</b><br>
            <small style="color: #64748b;">${school.address}</small>
          </div>
          <button style="width: 100%; background: #2563eb; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600; transition: background 0.2s;">
            🤖 ให้ AI วิเคราะห์โรงเรียนนี้
          </button>
          <div class="ai-box" style="margin-top: 10px; font-size: 12px; color: #334155;"></div>
        `;

        const analyzeBtn = popupContent.querySelector('button');
        const aiBox = popupContent.querySelector('.ai-box');

        analyzeBtn.addEventListener('click', () => {
          // แสดงสถานะระหว่างรอคำตอบจาก AI
          aiBox.innerHTML =
            '<div style="padding: 8px; text-align: center; color: #2563eb;"><span class="hourglass-anim">⏳</span> กำลังให้ AI วิเคราะห์ข้อมูล...</div>';
          analyzeBtn.style.display = 'none';

          fetch(`${NGROK_URL}/analyze`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              name: school.name,
              address: school.address,
              lat: school.lat,
              lng: school.lng,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              const formattedResult = formatAiResponse(data.result);
              const score = data.risk_score || 3.4;
              const icons = data.risk_icons || '🔴🔴🔴⚪️⚪️⚪️⚪️⚪️⚪️⚪️';

              // แสดงผลวิเคราะห์ AI พร้อมการ์ดแสดงรายละเอียดการคำนวณคะแนนความเสี่ยง
              aiBox.innerHTML = `
              <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
                ${formattedResult}
              </div>

              <details class="calc-details" style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: 600; color: #1e293b; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                  🔍 ดูขั้นตอนการคำนวณคะแนน (${score}/10)
                </summary>
                <div class="calc-body" style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px;">
                  <table class="weight-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                      <tr style="border-bottom: 1px solid #cbd5e1; text-align: left;">
                        <th style="padding: 4px;">ปัจจัยความเสี่ยง</th>
                        <th style="padding: 4px;">น้ำหนัก</th>
                        <th style="padding: 4px;">คะแนน</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom: 1px dashed #e2e8f0;">
                        <td style="padding: 4px;">1. เด็กไม่ได้อยู่กับพ่อแม่<br><span style="color: #64748b;">(35.5% × 20%)</span></td>
                        <td style="padding: 4px;"><span class="value-pill">20%</span></td>
                        <td style="padding: 4px; color: #dc2626; font-weight: 600;">+7.1</td>
                      </tr>
                      <tr style="border-bottom: 1px dashed #e2e8f0;">
                        <td style="padding: 4px;">2. การค้นหาอาวุธปืน<br><span style="color: #64748b;">(36.0 × 40%)</span></td>
                        <td style="padding: 4px;"><span class="value-pill">40%</span></td>
                        <td style="padding: 4px; color: #dc2626; font-weight: 600;">+14.4</td>
                      </tr>
                      <tr style="border-bottom: 1px dashed #e2e8f0;">
                        <td style="padding: 4px;">3. การใช้อินเทอร์เน็ต<br><span style="color: #64748b;">(80.0% × 10%)</span></td>
                        <td style="padding: 4px;"><span class="value-pill">10%</span></td>
                        <td style="padding: 4px; color: #dc2626; font-weight: 600;">+8.0</td>
                      </tr>
                      <tr style="border-bottom: 1px dashed #e2e8f0;">
                        <td style="padding: 4px;">4. ความหนาแน่นประชากร<br><span style="color: #64748b;">(15.0% × 30%)</span></td>
                        <td style="padding: 4px;"><span class="value-pill">30%</span></td>
                        <td style="padding: 4px; color: #dc2626; font-weight: 600;">+4.5</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="total-box" style="margin-top: 8px; padding: 8px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; color: #991b1b; font-size: 11px;">
                    <strong>คะแนนรวม:</strong> 7.1 + 14.4 + 8.0 + 4.5 = <strong>34.0 / 100</strong><br>
                    แปลงเป็นสเกลเต็ม 10 = <strong>${score} / 10</strong> ${icons}
                  </div>
                </div>
              </details>
            `;
            })
            .catch((err) => {
              aiBox.innerHTML =
                '<div style="color: #dc2626; text-align: center;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI</div>';
              analyzeBtn.style.display = 'block';
              console.error(err);
            });
        });

        // สร้าง Marker บนแผนที่
        const marker = L.marker([school.lat, school.lng], {
          title: school.name,
        }).bindPopup(popupContent);

        marker.addTo(schoolMarkers);
      }
    });

    // ==========================================
    // 5. ระบบ ค้นหาชื่อโรงเรียน (Leaflet Search)
    // ==========================================
    map.addControl(
      new L.Control.Search({
        layer: schoolMarkers,
        initial: false,
        zoom: 16,
        marker: false,
        textPlaceholder: 'ค้นหาชื่อโรงเรียน...',
      })
    );
  })
  .catch((error) =>
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน:', error)
  );
