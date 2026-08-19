// ==========================================
// 1. แก้ไขปัญหาภาพหมุด Leaflet ไม่แสดงผล
// ==========================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ==========================================
// 2. ตั้งค่าแผนที่และ Layer Group
// ==========================================
var map = L.map('map').setView([16.4321, 102.8356], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const NGROK_URL = 'https://tipped-roast-tamale.ngrok-free.dev'; 
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz9hjgjQPYlVYKMrvae0gDfqzoDsea8IRZRsSdSjv1IkgN6kF0i_LarNBYLyHn-DHaLUQ/exec';

const schoolMarkers = L.layerGroup().addTo(map);

// ==========================================
// ย้ายระบบค้นหามาไว้ตรงนี้ (เพื่อให้โหลดทันทีโดยไม่ต้องรอ Fetch)
// ==========================================
map.addControl(
  new L.Control.Search({
    layer: schoolMarkers,
    initial: false,
    zoom: 16,
    marker: false,
    textPlaceholder: 'ค้นหาชื่อโรงเรียน...',
    position: 'topright'
  })
);

// ==========================================
// ตัวแปรสำหรับระบบเปรียบเทียบ
// ==========================================
let schoolsToCompare = []; 
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
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a;">$1</strong>')
    .replace(/\n/g, '<br>');
}

// ==========================================
// ฟังก์ชันจัดการการเปรียบเทียบโรงเรียน
// ==========================================
function addSchoolToCompare(schoolData, buttonElement) {
    if (schoolsToCompare.length >= 2) {
        alert("คุณเลือกโรงเรียนครบ 2 แห่งแล้ว กรุณากด 'เปรียบเทียบเลย' หรือ 'ยกเลิก' ก่อนเริ่มใหม่");
        return;
    }
    
    const isAlreadyAdded = schoolsToCompare.some(s => s.name === schoolData.name);
    if (isAlreadyAdded) {
        alert("โรงเรียนนี้ถูกเลือกไว้แล้ว");
        return;
    }

    schoolsToCompare.push(schoolData);
    
    buttonElement.innerText = "✅ เลือกเปรียบเทียบแล้ว";
    buttonElement.style.backgroundColor = "#10b981";
    buttonElement.disabled = true;

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
    map.closePopup(); 

    document.querySelectorAll('.btn-compare-add').forEach(btn => {
        btn.innerText = "⚖️ เลือกเปรียบเทียบ";
        btn.style.backgroundColor = "";
        btn.disabled = false;
    });
}

function closeModal() {
    compareModalOverlay.style.display = 'none';
    cancelComparison();
}

function clearSelectedSchools() {
    schoolsToCompare = [];
    updateCompareUI();
    map.closePopup();

    document.querySelectorAll('.btn-compare-add').forEach(btn => {
        btn.innerText = "⚖️ เลือกเปรียบเทียบ";
        btn.style.backgroundColor = "";
        btn.disabled = false;
    });

    console.log("ล้างข้อมูลโรงเรียนที่เลือกเรียบร้อยแล้ว พร้อมเลือกใหม่");
}

// ==========================================
// ฟังก์ชันเปรียบเทียบโรงเรียนพร้อมแสดงกราฟ (Chart.js)
// ==========================================
function executeComparison() {
        if (schoolsToCompare.length !== 2) return;
    
        compareModalOverlay.style.display = 'flex';
        compareResultContent.innerHTML = `
            <div class="loading-text" style="text-align: center; padding: 30px;">
                ⏳ กำลังให้ AI (Ollama) วิเคราะห์และประมวลผลกราฟเปรียบเทียบ...<br>อาจใช้เวลาประมาณ 10-30 วินาที
            </div>
        `;
    
        fetch(`${NGROK_URL}/compare`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
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
            if (data && data.comparison_result) {
                const htmlContent = marked.parse(data.comparison_result);
                const school1Name = schoolsToCompare[0].name;
                const school2Name = schoolsToCompare[1].name;
    
                compareResultContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 20px; max-height: 75vh; overflow-y: auto; padding: 10px;">
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; font-size: 15px; color: #1e293b; text-align: center; margin-bottom: 10px;">📊 กราฟเปรียบเทียบคะแนนความเสี่ยง</h3>
                            <div style="position: relative; height: 280px; width: 100%;">
                                <canvas id="schoolCompareChart"></canvas>
                            </div>
                        </div>
                        <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; font-size: 15px; color: #1e293b; margin-bottom: 10px;">📝 บทวิเคราะห์เชิงลึก</h3>
                            <div class="markdown-content" style="font-size: 13px; color: #334155; line-height: 1.6;">
                                ${htmlContent}
                            </div>
                        </div>
                    </div>
                `;
    
                const ctx = document.getElementById('schoolCompareChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['ความเสี่ยงภาพรวม', 'ด้านครอบครัว', 'ด้านสิ่งแวดล้อม/ยาเสพติด', 'ด้านพฤติกรรม', 'ด้านความปลอดภัยออนไลน์'],
                        datasets: [
                            {
                                label: school1Name,
                                data: [7.5, 6.0, 8.0, 5.5, 6.5],
                                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                                borderColor: 'rgba(37, 99, 235, 1)',
                                borderWidth: 1
                            },
                            {
                                label: school2Name,
                                data: [4.5, 5.0, 3.0, 6.0, 4.0],
                                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                borderColor: 'rgba(16, 185, 129, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, max: 10, ticks: { font: { size: 11 } } },
                            x: { ticks: { font: { size: 11 } } }
                        },
                        plugins: {
                            legend: { position: 'top', labels: { font: { size: 12 } } }
                        }
                    }
                });
    
            } else {
                compareResultContent.innerHTML = `<div class="loading-text" style="color:red; text-align:center; padding: 20px;">❌ ไม่พบข้อมูลการเปรียบเทียบจากเซิร์ฟเวอร์</div>`;
            }
        })
        .catch(err => {
            console.error("Error comparing:", err);
            compareResultContent.innerHTML = `<div class="loading-text" style="color:red; text-align:center; padding: 20px;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI</div>`;
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

        popupContent.innerHTML = `
          <div style="margin-bottom: 8px;">
            <b style="font-size: 14px; color: #0f172a;">${school.name}</b><br>
            <small style="color: #64748b;">${school.address}</small>
          </div>
          <button class="btn-analyze" style="width: 100%; background: #2563eb; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600; transition: background 0.2s; margin-bottom: 6px;">
            🤖 ให้ AI วิเคราะห์โรงเรียนนี้
          </button>
          <button class="btn-compare-add" style="width: 100%; background: #475569; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600;">
            ⚖️ เลือกเปรียบเทียบ
          </button>
          <div class="ai-box" style="margin-top: 10px; font-size: 12px; color: #334155;"></div>
        `;

        const analyzeBtn = popupContent.querySelector('.btn-analyze');
        const compareBtn = popupContent.querySelector('.btn-compare-add');
        const aiBox = popupContent.querySelector('.ai-box');

        compareBtn.addEventListener('click', () => {
            const schoolData = { name: school.name, lat: school.lat, lng: school.lng };
            addSchoolToCompare(schoolData, compareBtn);
        });

        analyzeBtn.addEventListener('click', () => {
          aiBox.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #4f46e5; font-weight: 500;">
              <svg class="gemini-sparkle" viewBox="0 0 24 24" width="20" height="20" fill="none" style="margin-right: 6px; vertical-align: middle;">
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
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
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
                      <td style="padding: 6px 4px;">${index + 1}. ${item.title}<br><span style="color: #64748b; font-size: 10px;">${item.subtitle}</span></td>
                      <td style="padding: 6px 4px; text-align: center;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${item.weight_label}</span></td>
                      <td style="padding: 6px 4px; color: #dc2626; font-weight: 600; text-align: right;">+${item.score_added}</td>
                    </tr>
                  `;
                  scoresList.push(item.score_added);
                  sumScore100 += item.score_added;
                });
                scorePartsString = scoresList.join(' + ');
              }
        
              aiBox.innerHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 10px;">
                  <div style="flex: 1 1 260px; min-width: 0; font-size: 11.5px; color: #334155; line-height: 1.6;">
                    ${formattedResult}
                  </div>
                  <div style="flex: 1 1 220px; min-width: 0;">
                    <details class="calc-details" open style="margin-top: 0;">
                      <summary style="cursor: pointer; font-weight: 600; color: #1e293b; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11px;">
                        🔍 รายละเอียดคะแนน (${score}/10)
                      </summary>
                      <div class="calc-body" style="padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px;">
                        <table class="weight-table" style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                          <thead>
                            <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; color: #475569;">
                              <th style="padding: 4px;">ปัจจัย</th>
                              <th style="padding: 4px; text-align: center;">น้ำหนัก</th>
                              <th style="padding: 4px; text-align: right;">คะแนน</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${breakdownRowsHtml}
                          </tbody>
                        </table>
                        <div class="total-box" style="margin-top: 8px; padding: 8px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; color: #991b1b; font-size: 10.5px; line-height: 1.4;">
                          <strong>รวม:</strong> ${scorePartsString} = <strong>${sumScore100.toFixed(1)} / 100</strong><br>
                          สเกล 10 = <strong>${score} / 10</strong> ${icons}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              `;
            })
            .catch((err) => {
              aiBox.innerHTML = '<div style="color: #dc2626; text-align: center; padding: 10px;">❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI</div>';
              analyzeBtn.style.display = 'block';
              console.error(err);
            });
        });

        const marker = L.marker([school.lat, school.lng], { title: school.name }).bindPopup(popupContent);
        marker.addTo(schoolMarkers);
      }
    });

    if (schoolMarkers.getLayers().length > 0) {
      map.fitBounds(schoolMarkers.getBounds(), { padding: [50, 50] });
    }
  })
  .catch((error) => console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโรงเรียน:', error));
