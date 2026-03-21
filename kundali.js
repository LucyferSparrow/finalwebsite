document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('kundali-form');
    const geocodeBtn = document.getElementById('btn-geocode');
    const placeInput = document.getElementById('place');
    const locationResult = document.getElementById('location-result');
    
    const latInp = document.getElementById('lat');
    const lonInp = document.getElementById('lon');
    const tzoneInp = document.getElementById('tzone');
    const latHidden = document.getElementById('lat-hidden');
    const lonHidden = document.getElementById('lon-hidden');
    const tzoneHidden = document.getElementById('tzone-hidden');
    const manualToggle = document.getElementById('manual-coords-toggle');
    const manualCoordsDiv = document.getElementById('manual-coords');

    // Toggle manual coordinates entry
    manualToggle.addEventListener('change', () => {
        const manual = manualToggle.checked;
        manualCoordsDiv.style.display = manual ? '' : 'none';
        // When switching to manual, pre-fill from geocoded values if available
        if (manual && latHidden.value) {
            latInp.value = latInp.value || latHidden.value;
            lonInp.value = lonInp.value || lonHidden.value;
            tzoneInp.value = tzoneInp.value || tzoneHidden.value;
        }
    });

    // Helper to get current lat/lon/tzone regardless of mode
    function getCoordinates() {
        if (manualToggle.checked) {
            return {
                lat: parseFloat(latInp.value),
                lon: parseFloat(lonInp.value),
                tzone: parseFloat(tzoneInp.value)
            };
        }
        return {
            lat: parseFloat(latHidden.value),
            lon: parseFloat(lonHidden.value),
            tzone: parseFloat(tzoneHidden.value)
        };
    }

    let locationTimezone = null; // IANA timezone name (e.g. "America/New_York")

    // Compute UTC offset (in hours) for a specific date in a given IANA timezone
    function getOffsetForDate(timeZone, date) {
        const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const local = new Date(date.toLocaleString('en-US', { timeZone }));
        return (local - utc) / 3600000; // hours, handles half-hours like +5:30
    }

    // Fetch IANA timezone for given coordinates
    async function fetchTimezone(lat, lon) {
        try {
            const res = await fetch(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`);
            const data = await res.json();
            if (data.timeZone) return data.timeZone;
        } catch (e) { /* fall through */ }
        return null;
    }
    
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
                latHidden.value = loc.lat;
                lonHidden.value = loc.lon;
                
                // Fetch actual timezone for the location
                locationResult.textContent = "Found location, detecting timezone...";
                const ianaTz = await fetchTimezone(loc.lat, loc.lon);
                if (ianaTz) {
                    locationTimezone = ianaTz;
                    const offset = getOffsetForDate(ianaTz, new Date());
                    tzoneHidden.value = offset;
                    locationResult.textContent = `Found: ${loc.display_name.split(',')[0]} (${parseFloat(loc.lat).toFixed(2)}, ${parseFloat(loc.lon).toFixed(2)}) · TZ: ${ianaTz}`;
                } else {
                    // Fallback: approximate from longitude
                    locationTimezone = null;
                    const approxOffset = Math.round(parseFloat(loc.lon) / 15);
                    tzoneHidden.value = approxOffset;
                    locationResult.textContent = `Found: ${loc.display_name.split(',')[0]} (${parseFloat(loc.lat).toFixed(2)}, ${parseFloat(loc.lon).toFixed(2)}) · TZ: ~UTC${approxOffset >= 0 ? '+' : ''}${approxOffset}`;
                }
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
    let lastBirthDetails = null; // birth details for export
    let dashaRoot = [];
    let dashaPath = [];

    const openPrashnaBtn = document.getElementById('open-prashna-btn');
    const prashnaSection = document.getElementById('prashna-section');
    const randomPrashnaTypeSelect = document.getElementById('random-prashna-type');
    const generatePrashnaBtn = document.getElementById('generate-prashna-btn');
    const prashnaOutput = document.getElementById('prashna-output');
    const prashnaSummary = document.getElementById('prashna-summary');
    const ashtakavargaOutput = document.getElementById('ashtakavarga-output');
    const ashtakavargaGrid = document.getElementById('ashtakavarga-grid');
    const kundliPrashnaOutput = document.getElementById('kundli-prashna-output');
    const kundliPrashnaValues = document.getElementById('kundli-prashna-values');
    const deviPrashnaOutput = document.getElementById('devi-prashna-output');
    const deviPrashnaDescription = document.getElementById('devi-prashna-description');
    const deviPrashnaUrl = document.getElementById('devi-prashna-url');
    const deviPrashnaImageWrap = document.getElementById('devi-prashna-image-wrap');
    const deviPrashnaImage = document.getElementById('devi-prashna-image');

    if (openPrashnaBtn && prashnaSection) {
        openPrashnaBtn.addEventListener('click', () => {
            prashnaSection.classList.toggle('hidden');
            prashnaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (generatePrashnaBtn) {
        generatePrashnaBtn.addEventListener('click', () => {
            if (!prashnaOutput) return;
            prashnaOutput.classList.remove('hidden');
            ashtakavargaOutput?.classList.add('hidden');
            kundliPrashnaOutput?.classList.add('hidden');
            deviPrashnaOutput?.classList.add('hidden');
            runRandomPrashna();
        });
    }

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
        
        const coords = getCoordinates();
        const lat = coords.lat;
        const lon = coords.lon;
        
        if(isNaN(lat) || isNaN(lon)) {
            alert(manualToggle.checked ? "Please enter valid coordinates." : "Please search for a valid location first.");
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
        
        // Compute timezone offset for the birth location + birth date (handles DST)
        let tzoneOffsetHours;
        if (manualToggle.checked && !isNaN(coords.tzone)) {
            // User entered timezone manually — use as-is
            tzoneOffsetHours = coords.tzone;
        } else if (locationTimezone) {
            const birthDate = new Date(year, month - 1, day, hour, minute);
            tzoneOffsetHours = getOffsetForDate(locationTimezone, birthDate);
        } else {
            tzoneOffsetHours = parseFloat(tzoneHidden.value);
            if (isNaN(tzoneOffsetHours)) {
                tzoneOffsetHours = -(new Date().getTimezoneOffset() / 60);
            }
        }

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
            // Save vargas data to state and render based on dropdowns
            currentVargasData = data.vargas_charts;
            renderAllSelectedCharts();
            
            renderTable(data.table);
            
            if (data.dasha) {
                renderDashaTable(data.dasha, data.dashaMeta || {});
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

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function resetKundliValuePanel(values) {
        if (!kundliPrashnaValues) return;
        kundliPrashnaValues.innerHTML = '';
        values.forEach(item => {
            const div = document.createElement('div');
            div.className = 'value-item';
            div.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
            kundliPrashnaValues.appendChild(div);
        });
    }

    function runRandomPrashna() {
        const randomType = randomPrashnaTypeSelect ? randomPrashnaTypeSelect.value : 'ashtakavarga';
        if (prashnaSummary) prashnaSummary.textContent = `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Prashna`;

        if (randomType === 'ashtakavarga') {
            ashtakavargaOutput?.classList.remove('hidden');
            if (!ashtakavargaGrid) return;
            ashtakavargaGrid.innerHTML = '';
            for (let i = 1; i <= 12; i++) {
                const score = getRandomInt(0, 7);
                const cell = document.createElement('div');
                cell.className = 'ashtakavarga-cell';
                cell.innerHTML = `<strong>House ${i}</strong><span>${score}</span>`;
                ashtakavargaGrid.appendChild(cell);
            }
            return;
        }

        if (randomType === 'kundli') {
            kundliPrashnaOutput?.classList.remove('hidden');
            const bhava = getRandomInt(1, 12);
            const rashi = getRandomInt(1, 12);
            const lord = getRandomInt(1, 12);
            const nakshatraPada = getRandomInt(1, 3);
            resetKundliValuePanel([
                { label: 'Bhava', value: bhava },
                { label: 'Rashi', value: rashi },
                { label: 'Lord', value: lord },
                { label: 'Nakshatra (Pada)', value: nakshatraPada }
            ]);
            return;
        }

        deviPrashnaOutput?.classList.remove('hidden');
        if (deviPrashnaDescription) {
            deviPrashnaDescription.textContent = 'Drawing...';
            if (deviPrashnaUrl) deviPrashnaUrl.innerHTML = '';
            if (deviPrashnaImageWrap) deviPrashnaImageWrap.classList.add('hidden');
            if (deviPrashnaImage) deviPrashnaImage.removeAttribute('src');
            fetch('/api/devi?random=1')
                .then(res => res.json())
                .then(data => {
                    const devi = data?.devi || null;
                    deviPrashnaDescription.textContent = devi?.name || 'No Devi available';
                    if (deviPrashnaUrl) {
                        if (devi?.url) {
                            const safeUrl = String(devi.url).replace(/"/g, '&quot;');
                            deviPrashnaUrl.innerHTML = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open image URL</a>`;
                            if (deviPrashnaImage && deviPrashnaImageWrap) {
                                deviPrashnaImage.src = safeUrl;
                                deviPrashnaImageWrap.classList.remove('hidden');
                                deviPrashnaImage.onerror = () => {
                                    deviPrashnaImageWrap.classList.add('hidden');
                                };
                            }
                        } else {
                            deviPrashnaUrl.innerHTML = '';
                            if (deviPrashnaImageWrap) deviPrashnaImageWrap.classList.add('hidden');
                        }
                    }
                })
                .catch(() => {
                    deviPrashnaDescription.textContent = 'Could not draw Devi';
                    if (deviPrashnaUrl) deviPrashnaUrl.innerHTML = '';
                    if (deviPrashnaImageWrap) deviPrashnaImageWrap.classList.add('hidden');
                });
        }
    }

    function parseDmy(dateStr) {
        const [d, m, y] = dateStr.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d));
    }

    function formatDmy(dateObj) {
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const y = dateObj.getUTCFullYear();
        return `${d}-${m}-${y}`;
    }

    function formatDmyHm(dateObj) {
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const y = dateObj.getUTCFullYear();
        const hh = String(dateObj.getUTCHours()).padStart(2, '0');
        const mm = String(dateObj.getUTCMinutes()).padStart(2, '0');
        return `${d}-${m}-${y} ${hh}:${mm}`;
    }

    function addFractionDays(dateObj, daysFloat) {
        return new Date(dateObj.getTime() + daysFloat * 86400000);
    }

    function calcAgeValue(periodStartUtc, birthDateUtc) {
        return ((periodStartUtc - birthDateUtc) / (365.25 * 86400000));
    }

    function renderDashaTable(dashaTimeline, dashaMeta) {
        const subtitle = document.getElementById('dasha-subtitle');
        const nav = document.getElementById('dasha-nav');
        const list = document.getElementById('dasha-list');
        if (!subtitle || !nav || !list) return;

        const ORDER = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Jp', 'Sa', 'Me'];
        const YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
        const CYCLE_YEARS = 120;
        const MAX_DASHA_LEVEL = 8;

        const birthDateStr = document.getElementById('date').value;
        const birthDateUtc = birthDateStr ? new Date(`${birthDateStr}T00:00:00Z`) : new Date();
        const childCache = new Map();
        dashaRoot = dashaTimeline.map((period) => {
            const startDateUtc = parseDmy(period.start);
            const endDateUtc = parseDmy(period.end);
            const lordIndex = ORDER.indexOf(period.planet);
            return {
                lord: period.planet,
                lordIndex,
                level: 1,
                start: period.start,
                end: period.end,
                startDateUtc,
                endDateUtc,
                age: Math.round(calcAgeValue(startDateUtc, birthDateUtc) * 10) / 10
            };
        });
        dashaPath = [];

        const startingTara = dashaMeta.startingTara || '';
        const startingNakshatra = dashaMeta.startingNakshatra || '';
        subtitle.textContent = startingTara && startingNakshatra
            ? `Starting Tara ${startingTara} (${startingNakshatra})`
            : '';

        function getCurrentDateUtc() {
            return new Date();
        }

        function isActivePeriod(start, end, nowUtc) {
            return nowUtc >= start && nowUtc <= end;
        }

        function cacheKey(node) {
            return `${node.level}|${node.lordIndex}|${node.startDateUtc.getTime()}|${node.endDateUtc.getTime()}`;
        }

        function buildChildren(node) {
            if (node.level >= MAX_DASHA_LEVEL) return [];
            const key = cacheKey(node);
            if (childCache.has(key)) return childCache.get(key);

            const children = [];
            const durationDays = (node.endDateUtc - node.startDateUtc) / 86400000;
            let childStart = node.startDateUtc;

            for (let step = 0; step < 9; step++) {
                const childLordIndex = (node.lordIndex + step) % 9;
                const childDays = (durationDays * YEARS[childLordIndex]) / CYCLE_YEARS;
                const childEnd = (step === 8) ? node.endDateUtc : addFractionDays(childStart, childDays);
                children.push({
                    lord: ORDER[childLordIndex],
                    lordIndex: childLordIndex,
                    level: node.level + 1,
                    start: formatDmy(childStart),
                    end: formatDmy(childEnd),
                    startDateUtc: childStart,
                    endDateUtc: childEnd,
                    age: Math.round(calcAgeValue(childStart, birthDateUtc) * 10) / 10
                });
                childStart = childEnd;
            }

            childCache.set(key, children);
            return children;
        }

        function getRowsAtPath(path) {
            if (path.length === 0) return dashaRoot;
            let node = dashaRoot[path[0]];
            for (let i = 1; i < path.length; i++) {
                const children = buildChildren(node);
                node = children[path[i]];
            }
            return buildChildren(node);
        }

        function getPathNodes(path) {
            if (path.length === 0) return [];
            const nodes = [];
            let node = dashaRoot[path[0]];
            nodes.push(node);
            for (let i = 1; i < path.length; i++) {
                node = buildChildren(node)[path[i]];
                nodes.push(node);
            }
            return nodes;
        }

        function renderNav(pathLabel, expanded, onToggle, onBack, onClear) {
            nav.innerHTML = '';
            if (!pathLabel) return;

            const left = document.createElement('div');
            left.className = 'dasha-nav-left';
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'dasha-toggle';
            toggleBtn.textContent = expanded ? '▼' : '▶';
            toggleBtn.addEventListener('click', onToggle);
            const path = document.createElement('span');
            path.className = 'dasha-nav-path';
            path.textContent = pathLabel;
            left.append(toggleBtn, path);

            const actions = document.createElement('div');
            actions.className = 'dasha-nav-actions';
            const back = document.createElement('span');
            back.className = 'dasha-action';
            back.textContent = 'Back';
            back.addEventListener('click', onBack);
            const clear = document.createElement('span');
            clear.className = 'dasha-action';
            clear.textContent = 'Clear';
            clear.addEventListener('click', onClear);
            actions.append(back, clear);

            nav.append(left, actions);
        }

        function renderRows(rows, onDateClick) {
            list.innerHTML = '';
            const nowUtc = getCurrentDateUtc();
            rows.forEach((row, index) => {
                const line = document.createElement('div');
                line.className = 'dasha-row';

                const lord = document.createElement('span');
                lord.className = 'dasha-lord';
                if (isActivePeriod(parseDmy(row.start), parseDmy(row.end), nowUtc)) {
                    lord.classList.add('dasha-active');
                }
                lord.textContent = row.lord;

                const age = document.createElement('span');
                age.className = 'dasha-age';
                age.textContent = row.age.toFixed(1);

                const date = document.createElement('span');
                date.className = 'dasha-date';
                const durationMs = row.endDateUtc - row.startDateUtc;
                const showTime = durationMs < (2 * 86400000) || row.level >= 5;
                const displayStart = showTime ? formatDmyHm(row.startDateUtc) : row.start;
                const displayEnd = showTime ? formatDmyHm(row.endDateUtc) : row.end;
                date.textContent = `${displayStart} to ${displayEnd}`;
                date.addEventListener('click', () => onDateClick(index));

                line.append(lord, age, date);
                list.appendChild(line);
            });
        }

        function renderCurrent() {
            const pathNodes = getPathNodes(dashaPath);
            const currentRows = getRowsAtPath(dashaPath);
            const canDrillDeeper = dashaPath.length < (MAX_DASHA_LEVEL - 1);

            if (dashaPath.length === 0) {
                nav.innerHTML = '';
            } else {
                const label = pathNodes.map(n => n.lord).join(' > ');
                renderNav(
                    label,
                    true,
                    () => {
                        dashaPath.pop();
                        renderCurrent();
                    },
                    () => {
                        dashaPath.pop();
                        renderCurrent();
                    },
                    () => {
                        dashaPath = [];
                        renderCurrent();
                    }
                );
            }

            renderRows(currentRows, (idx) => {
                if (!canDrillDeeper) return;
                dashaPath.push(idx);
                renderCurrent();
            });
        }

        renderCurrent();
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

    // ── Export Chart (plain text birth details) ──
    document.getElementById('export-btn').addEventListener('click', () => {
        if (!lastBirthDetails) {
            alert('Generate a chart first before exporting.');
            return;
        }
        const b = lastBirthDetails;
        const lines = [
            '── Jyotish Veda · Birth Details ──',
            '',
            `Name: ${b.name}`,
            `Date: ${b.date}`,
            `Time: ${String(b.hour).padStart(2,'0')}:${String(b.minute).padStart(2,'0')}`,
            `Place: ${b.place}`,
            `Latitude: ${b.lat}`,
            `Longitude: ${b.lon}`,
            `Timezone: ${b.tzone}`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (b.name || 'chart').replace(/[^a-zA-Z0-9]/g, '_');
        a.href = url;
        a.download = `${safeName}.arya`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Import Chart (parse txt back into form & auto-generate) ──
    document.getElementById('import-file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const get = (key) => {
                const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
                return m ? m[1].trim() : null;
            };
            const name = get('Name');
            const date = get('Date');
            const time = get('Time');
            const place = get('Place');
            const lat = get('Latitude');
            const lon = get('Longitude');
            const tzone = get('Timezone');

            if (!lat || !lon) {
                alert('Invalid file — could not find birth details.');
                return;
            }
            if (name) document.getElementById('name').value = name;
            if (date) document.getElementById('date').value = date;
            if (time) {
                const [h, m] = time.split(':');
                document.getElementById('time-hour').value = parseInt(h);
                document.getElementById('time-minute').value = parseInt(m);
            }
            if (place) document.getElementById('place').value = place;
            latHidden.value = lat;
            lonHidden.value = lon;
            if (tzone) tzoneHidden.value = tzone;
            // Clear manual mode so import uses these values
            manualToggle.checked = false;
            manualCoordsDiv.style.display = 'none';
            locationTimezone = null;

            locationResult.textContent = `Imported: ${place || 'Unknown'} (Lat: ${parseFloat(lat).toFixed(2)}, Lon: ${parseFloat(lon).toFixed(2)})`;
            locationResult.className = 'location-status';

            // Auto-submit to generate chart
            form.requestSubmit();
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to read file.');
        }
        e.target.value = '';
    });
});
