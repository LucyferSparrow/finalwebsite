document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('kundali-form');
    const geocodeBtn = document.getElementById('btn-geocode');
    const placeInput = document.getElementById('place');
    const locationResult = document.getElementById('location-result');
    
    const latInp = document.getElementById('lat');
    const lonInp = document.getElementById('lon');
    const tzoneInp = document.getElementById('tzone');
    
    // Auto-fill some default demo data
    document.getElementById('date').valueAsDate = new Date();
    const now = new Date();
    document.getElementById('time-hour').value = now.getHours();
    document.getElementById('time-minute').value = now.getMinutes();
    
    // Geocoding with OpenStreetMap Nominatim
    geocodeBtn.addEventListener('click', async () => {
        const query = placeInput.value.trim();
        if(!query) {
            locationResult.textContent = "Please enter a place first.";
            locationResult.className = "location-status error";
            return;
        }
        
        locationResult.textContent = "Searching location...";
        locationResult.className = "location-status";
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if(data && data.length > 0) {
                const loc = data[0];
                latInp.value = loc.lat;
                lonInp.value = loc.lon;
                
                // Get offset timezone (approximate from user location or standard logic)
                // In production, we'd use a Lat/Lon to TimeZone API. 
                // For now, we assume local timezone of the user's browser for simplicity, 
                // but let's try to get approximate longitude based timezone if it's far.
                // Or best: use the browser timezone offset
                const offset = -(new Date().getTimezoneOffset() / 60);
                tzoneInp.value = offset;
                
                locationResult.textContent = `Found: ${loc.display_name.split(',')[0]} (Lat: ${parseFloat(loc.lat).toFixed(2)}, Lon: ${parseFloat(loc.lon).toFixed(2)})`;
                locationResult.className = "location-status";
            } else {
                locationResult.textContent = "Location not found. Try 'City, Country'.";
                locationResult.className = "location-status error";
            }
        } catch(e) {
            locationResult.textContent = "Error fetching location.";
            locationResult.className = "location-status error";
        }
    });

    let currentVargasData = null;
    let lastChartResult = null;  // full API response for export
    let lastBirthDetails = null; // birth details for export

    // Listen for dropdown changes to update individual charts immediately
    document.querySelectorAll('.varga-select').forEach(select => {
        select.addEventListener('change', (e) => {
            if (!currentVargasData) return;
            const vargaKey = e.target.value;
            const containerId = e.target.dataset.container;
            if (currentVargasData[vargaKey]) {
                renderChart(currentVargasData[vargaKey], containerId);
            }
        });
    });

    function renderAllSelectedCharts() {
        if (!currentVargasData) return;
        document.querySelectorAll('.varga-select').forEach(select => {
            const vargaKey = select.value;
            const containerId = select.dataset.container;
            if (currentVargasData[vargaKey]) {
                renderChart(currentVargasData[vargaKey], containerId);
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const lat = parseFloat(document.getElementById('lat').value);
        const lon = parseFloat(document.getElementById('lon').value);
        
        if(isNaN(lat) || isNaN(lon)) {
            alert("Please search for a valid location first.");
            return;
        }

        const dateStr = document.getElementById('date').value;
        const hour = parseInt(document.getElementById('time-hour').value);
        const minute = parseInt(document.getElementById('time-minute').value);
        
        if(!dateStr || isNaN(hour) || isNaN(minute)) {
            alert("Please provide valid date and time.");
            return;
        }

        const [year, month, day] = dateStr.split('-').map(Number);
        
        // The Javascript timezone offset is in minutes (UTC - Local). So for IST (+5:30), it is -330
        const tzoneOffsetHours = -(new Date().getTimezoneOffset() / 60);

        const payload = {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute,
            lat: lat,
            lon: lon,
            tzone: tzoneOffsetHours
        };
        
        document.getElementById('loader').classList.remove('hidden');
        document.getElementById('results-section').classList.add('hidden');
        
        try {
            // Node.js API (served from same origin)
            const response = await fetch('/api/kundali', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if(!response.ok) throw new Error("API Error");
            
            const data = await response.json();
            
            // Store for export
            lastBirthDetails = {
                name: document.getElementById('name').value,
                date: dateStr,
                hour: hour,
                minute: minute,
                place: document.getElementById('place').value,
                lat: lat,
                lon: lon,
                tzone: tzoneOffsetHours
            };
            lastChartResult = data;

            // Save vargas data to state and render based on dropdowns
            currentVargasData = data.vargas_charts;
            renderAllSelectedCharts();
            
            renderTable(data.table);
            
            if (data.dasha) {
                renderDashaTable(data.dasha);
            }
            if (data.panchang) {
                renderPanchang(data.panchang);
            }
            
            document.getElementById('results-section').classList.remove('hidden');
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to connect to the backend API. Make sure the Node.js server is running on port 3001.");
        } finally {
            document.getElementById('loader').classList.add('hidden');
        }
    });
    
    function renderPanchang(panchangData) {
        const container = document.getElementById('panchang-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <strong style="color: var(--text-secondary);">Vaar (Day)</strong>
                <span>${panchangData.vaar}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <strong style="color: var(--text-secondary);">Tithi (Lunar Day)</strong>
                <span>${panchangData.tithi}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <strong style="color: var(--text-secondary);">Nakshatra</strong>
                <span>${panchangData.nakshatra}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <strong style="color: var(--text-secondary);">Yoga</strong>
                <span>${panchangData.yoga}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <strong style="color: var(--text-secondary);">Karana</strong>
                <span>${panchangData.karana}</span>
            </div>
        `;
    }

    function renderDashaTable(dashaTimeline) {
        const tbody = document.querySelector('#dasha-table tbody');
        tbody.innerHTML = '';
        
        dashaTimeline.forEach(period => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${period.planet}</strong></td>
                <td>${period.start}</td>
                <td>${period.end}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderTable(tableData) {
        const tbody = document.querySelector('#positions-table tbody');
        tbody.innerHTML = '';
        
        const rasiNames = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
        
        tableData.forEach(row => {
            const tr = document.createElement('tr');
            const signName = rasiNames[row.Sign - 1];
            const navamshaName = row.Navamsha ? rasiNames[row.Navamsha - 1] : "";
            
            tr.innerHTML = `
                <td><strong>${row.Body == 'As' ? 'Ascendant' : row.Body}</strong></td>
                <td>${row.Long}</td>
                <td>${row.Sign} - ${signName}</td>
                <td>${row.Nakshatra || '-'}</td>
                <td>${row.Pada || '-'}</td>
                <td>${row.Navamsha ? row.Navamsha + ' - ' + navamshaName : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderChart(chartData, containerId) {
        // Draw SVG North Indian Diamond Chart
        const svgHTML = `
            <svg viewBox="0 0 400 400" class="kundali-svg" xmlns="http://www.w3.org/2000/svg">
                <!-- Outer Square -->
                <rect x="10" y="10" width="380" height="380" fill="none" class="chart-line" />
                
                <!-- Inner Diagonals forming the Diamonds -->
                <line x1="10" y1="10" x2="390" y2="390" class="chart-line" />
                <line x1="10" y1="390" x2="390" y2="10" class="chart-line" />
                
                <!-- Inner Square -->
                <line x1="200" y1="10" x2="390" y2="200" class="chart-line" />
                <line x1="390" y1="200" x2="200" y2="390" class="chart-line" />
                <line x1="200" y1="390" x2="10" y2="200" class="chart-line" />
                <line x1="10" y1="200" x2="200" y2="10" class="chart-line" />

                <!-- Text Positions for 12 Houses -->
                <!-- H1 -->
                <text x="200" y="85" class="chart-text">${formatPlanets(chartData.H1.planets)}</text>
                <text x="200" y="115" class="chart-sign">${chartData.H1.sign}</text>

                <!-- H2 -->
                <text x="105" y="55" class="chart-text">${formatPlanets(chartData.H2.planets)}</text>
                <text x="105" y="85" class="chart-sign">${chartData.H2.sign}</text>

                <!-- H3 -->
                <text x="55" y="105" class="chart-text">${formatPlanets(chartData.H3.planets)}</text>
                <text x="55" y="135" class="chart-sign">${chartData.H3.sign}</text>

                <!-- H4 -->
                <text x="105" y="200" class="chart-text">${formatPlanets(chartData.H4.planets)}</text>
                <text x="105" y="230" class="chart-sign">${chartData.H4.sign}</text>

                <!-- H5 -->
                <text x="55" y="295" class="chart-text">${formatPlanets(chartData.H5.planets)}</text>
                <text x="55" y="325" class="chart-sign">${chartData.H5.sign}</text>

                <!-- H6 -->
                <text x="105" y="345" class="chart-text">${formatPlanets(chartData.H6.planets)}</text>
                <text x="105" y="375" class="chart-sign">${chartData.H6.sign}</text>

                <!-- H7 -->
                <text x="200" y="315" class="chart-text">${formatPlanets(chartData.H7.planets)}</text>
                <text x="200" y="345" class="chart-sign">${chartData.H7.sign}</text>

                <!-- H8 -->
                <text x="295" y="345" class="chart-text">${formatPlanets(chartData.H8.planets)}</text>
                <text x="295" y="375" class="chart-sign">${chartData.H8.sign}</text>

                <!-- H9 -->
                <text x="345" y="295" class="chart-text">${formatPlanets(chartData.H9.planets)}</text>
                <text x="345" y="325" class="chart-sign">${chartData.H9.sign}</text>

                <!-- H10 -->
                <text x="295" y="200" class="chart-text">${formatPlanets(chartData.H10.planets)}</text>
                <text x="295" y="230" class="chart-sign">${chartData.H10.sign}</text>

                <!-- H11 -->
                <text x="345" y="105" class="chart-text">${formatPlanets(chartData.H11.planets)}</text>
                <text x="345" y="135" class="chart-sign">${chartData.H11.sign}</text>

                <!-- H12 -->
                <text x="295" y="55" class="chart-text">${formatPlanets(chartData.H12.planets)}</text>
                <text x="295" y="85" class="chart-sign">${chartData.H12.sign}</text>
            </svg>
        `;
        document.getElementById(containerId).innerHTML = svgHTML;
    }
    
    function formatPlanets(pArr) {
        if(!pArr || pArr.length === 0) return "";
        return pArr.join(", ");
    }

    // ── Export Chart ──
    document.getElementById('export-btn').addEventListener('click', () => {
        if (!lastBirthDetails || !lastChartResult) {
            alert('Generate a chart first before exporting.');
            return;
        }
        const exportData = {
            format: 'jyotish-veda-chart',
            version: 1,
            birth: lastBirthDetails,
            chart: lastChartResult
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (lastBirthDetails.name || 'chart').replace(/[^a-zA-Z0-9]/g, '_');
        a.href = url;
        a.download = `${safeName}_kundali.jyotish`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Import Chart ──
    document.getElementById('import-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.birth) {
                alert('Invalid chart file — no birth details found.');
                return;
            }
            const b = data.birth;
            // Fill form fields
            if (b.name) document.getElementById('name').value = b.name;
            if (b.date) document.getElementById('date').value = b.date;
            if (b.hour != null) document.getElementById('time-hour').value = b.hour;
            if (b.minute != null) document.getElementById('time-minute').value = b.minute;
            if (b.place) document.getElementById('place').value = b.place;
            if (b.lat != null) latInp.value = b.lat;
            if (b.lon != null) lonInp.value = b.lon;
            if (b.tzone != null) tzoneInp.value = b.tzone;

            locationResult.textContent = `Imported: ${b.place || 'Unknown'} (Lat: ${parseFloat(b.lat).toFixed(2)}, Lon: ${parseFloat(b.lon).toFixed(2)})`;
            locationResult.className = 'location-status';

            // If file includes chart data, render it directly without API call
            if (data.chart && data.chart.vargas_charts) {
                lastBirthDetails = b;
                lastChartResult = data.chart;
                currentVargasData = data.chart.vargas_charts;
                renderAllSelectedCharts();
                renderTable(data.chart.table);
                if (data.chart.dasha) renderDashaTable(data.chart.dasha);
                if (data.chart.panchang) renderPanchang(data.chart.panchang);
                document.getElementById('results-section').classList.remove('hidden');
            } else {
                // Only birth details — auto-submit form to generate chart
                form.requestSubmit();
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to read chart file. Make sure it\'s a valid .jyotish file.');
        }
        // Reset file input so same file can be re-imported
        e.target.value = '';
    });
});
