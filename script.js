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

const NGROK_URL = 'https://tipped-roast-tamale.ngrok-free.dev'; // ตรวจสอบว่า NGROK URL ยังใช้งานได้อยู่หรือไม่
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec';

const schoolMarkers = L.layerGroup().addTo(map);

// ==========================================
// ตัวแปรสำหรับระบบเปรียบเทียบ (เพิ่มใหม่)
// ==========================================
let schoolsToCompare = []; // เก็บอ็อบเจ็กต์ข้อมูลโรงเรียนสูงสุด 2 โรงเรียน
const compareBar = document.getElementById('compareBar');
const compareStatusText = document.getElementById('compareStatusText');
const btnCompareExec = document.getElementById('btnCompareExec');
const compareModalOverlay = document.getElementById('compareModalOverlay');
const compareResultContent = document.getElementById('compareResultContent');

// ==========================================
// 3. ฟังก์ชันช่วยจัดรูปแบบข้อความ AI (Markdown -> HTML)
// ==========================================
function formatAiResponse(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ==========================================
// ฟังก์ชันจัดการการเปรียบเทียบโรงเรียน (เพิ่มใหม่)
// ==========================================
function addSchoolToCompare(schoolData, buttonElement) {
    // เช็คว่าเลือกครบ 2 แล้วหรือยัง หรือเลือกซ้ำหรือไม่
    if (schoolsToCompare.length >= 2) {
        alert("คุณเลือกโรงเรียนครบ 2 แห่งแล้ว กรุณากด 'เปรียบเทียบเลย' หรือ 'ยกเลิก' ก่อนเริ่มใหม่");
        return;
    }
    
    const isAlreadyAdded = schoolsToCompare.some(s => s.name === schoolData.name);
    if (isAlreadyAdded) {
        alert("โรงเรียนนี้ถูกเลือกไว้แล้ว");
        return;
    }

    // เพิ่มเข้าอาร์เรย์
    schoolsToCompare.push(schoolData);
    
    // เปลี่ยนสไตล์ปุ่มเพื่อให้รู้ว่าถูกเลือกแล้ว
    buttonElement.innerText = "✅ เลือกเปรียบเทียบแล้ว";
    buttonElement.style.backgroundColor = "#10b981";
    buttonElement.disabled = true;

    // อัปเดตแถบ UI ด้านล่าง
    updateCompareUI();
}

function updateCompareUI() {
    if (schoolsToCompare.length === 1) {
        compareBar.classList.add('show');
        compareStatusText.innerText = `1/2: เลือก ${schoolsToCompare[0].name} แล้ว... (เลือกอีก 1 แห่ง)`;
        btnCompareExec.style.display = 'none';
    } else if (schoolsToCompare.length === 2) {
        compareBar.classList.add('show');
        compareStatusText.innerText = `2/2: พร้อมเปรียบเทียบ ${schoolsToCompare[0].name} vs ${schoolsToCompare[1].name}`;
        btnCompareExec.style.display = 'block';
    } else {
        compareBar.classList.remove('show');
    }
}

function cancelComparison() {
    schoolsToCompare = [];
    updateCompareUI();
    // ปิด Popup ทุกอัน เพื่อรีเซ็ตสถานะปุ่ม (Leaflet จะรีเซ็ต DOM ข้างในให้เมื่อเราเปิดใหม่)
    map.closePopup(); 
}

function closeModal() {
    compareModalOverlay.style.display = 'none';
    cancelComparison(); // เมื่อปิดแล้ว ให้เคลียร์คิวด้วย
}

function executeComparison() {
    if (schoolsToCompare.length !== 2) return;

    // เปิด Modal และแสดงสถานะกำลังโหลด
    compareModalOverlay.style.display = 'flex';
    compareResultContent.innerHTML = `<div class="loading-text">⏳ กำลังให้ AI (Ollama) วิเคราะห์เปรียบเทียบ...<br>อาจใช้เวลาประมาณ 10-30 วินาที</div>`;

    fetch(`${NGROK_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            school1: {
                name: schoolsToCompare[0].name,
                lat: schoolsToCompare[0].lat,
                lng: schoolsToCompare[0].lng
            },
            school2: {
                name: schoolsToCompare[1].name,
                lat: schoolsToCompare[1].lat,
                lng: schoolsToCompare[1].lng
            }
        })
    })
    .then(res => res.json())
    .then(data => {
        // ใช้ marked.js (ที่ประกาศใน index.html) แปลง Markdown เป็น HTML สวยๆ
        const htmlContent = marked.parse(data.result);
        compareResultContent.innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
    })
    .catch(err => {
        console.error("Error comparing:", err);
        compareResultContent.innerHTML = `<div class="loading-text" style="color:red;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI</div>`;
    });
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

        // เพิ่มปุ่ม "เปรียบเทียบ" เข้าไปใน Popup
        popupContent.innerHTML = `
          <div style="margin-bottom: 8px;">
            <b style="font-size: 14px; color: #0f172a;">${school.name}</b><br>
            <small style="color: #64748b;">${school.address}</small>
          </div>
          <button class="btn-analyze" style="width: 100%; background: #2563eb; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600; transition: background 0.2s;">
            🤖 ให้ AI วิเคราะห์โรงเรียนนี้
          </button>
          
          <button class="btn-compare-add">
            ⚖️ เลือกเปรียบเทียบ
          </button>

          <div class="ai-box" style="margin-top: 10px; font-size: 12px; color: #334155;"></div>
        `;

        const analyzeBtn = popupContent.querySelector('.btn-analyze');
        const compareBtn = popupContent.querySelector('.btn-compare-add');
        const aiBox = popupContent.querySelector('.ai-box');

        // จัดการเหตุการณ์เมื่อกดปุ่ม "เลือกเปรียบเทียบ"
        compareBtn.addEventListener('click', () => {
            const schoolData = {
                name: school.name,
                lat: school.lat,
                lng: school.lng
            };
            addSchoolToCompare(schoolData, compareBtn);
        });

        // จัดการเหตุการณ์เมื่อกดปุ่ม "ให้ AI วิเคราะห์โรงเรียนนี้" (โค้ดเดิมของคุณ)
        analyzeBtn.addEventListener('click', () => {
          aiBox.innerHTML = `
            <div style="padding: 10px; text-align: center; color: #4f46e5; font-weight: 500;">
              <svg class="gemini-sparkle" viewBox="0 0 24 24" width="20" height="20" fill="none" style="margin-right: 6px;">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#gemini-grad)"/>
                <defs>
                  <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4285F4" />
                    <stop offset="50%" stop-color="#9B72CB" />
                    <stop offset="100%" stop-color="#D96570" />
                  </linearGradient>
                </defs>
              </svg>
              กำลังให้ AI วิเคราะห์ข้อมูล...
            </div>
          `;
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

              let breakdownRowsHtml = '';
              let sumScore100 = 0;
              let scorePartsString = '';

              if (data.breakdown && data.breakdown.length > 0) {
                const scoresList = [];
                data.breakdown.forEach((item, index) => {
                  breakdownRowsHtml += `
                    <tr style="border-bottom: 1px dashed #e2e8f0;">
                      <td style="padding: 4px;">${index + 1}. ${item.title}<br><span style="color: #64748b;">${item.subtitle}</span></td>
                      <td style="padding: 4px;"><span class="value-pill">${item.weight_label}</span></td>
                      <td style="padding: 4px; color: #dc2626; font-weight: 600;">+${item.score_added}</td>
                    </tr>
                  `;
                  scoresList.push(item.score_added);
                  sumScore100 += item.score_added;
                });
                scorePartsString = scoresList.join(' + ');
              }

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
                      ${breakdownRowsHtml}
                    </tbody>
                  </table>
                  <div class="total-box" style="margin-top: 8px; padding: 8px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; color: #991b1b; font-size: 11px;">
                    <strong>คะแนนรวม:</strong> ${scorePartsString} = <strong>${sumScore100.toFixed(1)} / 100</strong><br>
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
