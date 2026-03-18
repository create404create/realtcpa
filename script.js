// ==================== CONFIGURATION ====================
const API_BASE_URL = "https://api.uspeoplesearch.site/tcpa/v1";
// CORS Proxy - Pehle isko activate karna hoga: https://cors-anywhere.herokuapp.com/
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

// Agar CORS proxy kaam na kare to ye alternate proxy use karein:
// const CORS_PROXY = "https://api.allorigins.win/raw?url=";

// ==================== DOM ELEMENTS ====================
const phoneInput = document.getElementById('phoneInput');
const searchBtn = document.getElementById('searchBtn');
const resultArea = document.getElementById('resultArea');

// ==================== EVENT LISTENERS ====================
searchBtn.addEventListener('click', performSearch);
phoneInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') performSearch();
});

// Input validation - sirf numbers allow karein
phoneInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// ==================== MAIN SEARCH FUNCTION ====================
async function performSearch() {
    const phone = phoneInput.value.trim();

    // Validation
    if(!phone || phone.length !== 10) {
        showError("❌ Please enter a valid 10-digit phone number (numbers only)");
        return;
    }

    // Disable button during search
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    
    // Show loading
    showLoading(phone);

    try {
        // CORS proxy ke saath API call
        const apiUrl = `${CORS_PROXY}${API_BASE_URL}?x=${phone}`;
        
        console.log('Fetching:', apiUrl); // Debugging ke liye
        
        const response = await fetch(apiUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest' // CORS proxy ke liye zaroori
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debugging ke liye
        
        displayResults(data, phone);

    } catch (error) {
        console.error('Fetch Error:', error);
        handleError(error);
    } finally {
        // Re-enable button
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

// ==================== DISPLAY RESULTS ====================
function displayResults(data, phone) {
    // Agar data empty hai to mock data show karein (for demonstration)
    const hasData = data && Object.keys(data).length > 0;
    
    let locationInfo = {
        zip: '87106',
        city: 'ALBUQUERQUE',
        county: 'BERNALILLO',
        state: 'NM'
    };

    // Agar API se location data milta hai to use karein
    if (hasData && data.location) {
        locationInfo = { ...locationInfo, ...data.location };
    }

    // Database statuses - API response ke hisaab se customize karein
    const dbStatuses = [
        { 
            name: 'Litigators DB', 
            found: hasData ? (data.litigator?.found || false) : false,
            foundText: 'Found',
            notFoundText: 'Not Found'
        },
        { 
            name: 'Blacklisted DB', 
            found: hasData ? (data.blacklist?.found || true) : true, // Default true for demo
            foundText: 'FOUND (Blocked)',
            notFoundText: 'Not Found'
        },
        { 
            name: 'DNC Suggests', 
            found: hasData ? (data.dnc?.found || true) : true,
            foundText: 'DO NOT CALL',
            notFoundText: 'Not Found'
        },
        { 
            name: 'Social Analytics', 
            found: hasData ? (data.social?.isGood || true) : true,
            foundText: 'Good',
            notFoundText: 'Caution'
        },
        { 
            name: 'Closers DNC', 
            found: hasData ? (data.closers?.found || false) : false,
            foundText: 'Found',
            notFoundText: 'Not found, Good to GO!'
        },
        { 
            name: 'Old Closers DNC', 
            found: hasData ? (data.oldClosers?.found || false) : false,
            foundText: 'Found',
            notFoundText: 'Not found, Good to Go!'
        },
        { 
            name: 'Invalid Phones', 
            found: hasData ? (data.invalid?.found || false) : false,
            foundText: 'Found',
            notFoundText: 'Not found, Good to GO!'
        },
        { 
            name: 'VOIP Blocked', 
            found: hasData ? (data.voip?.found || false) : false,
            foundText: 'Found',
            notFoundText: 'Not found, Good to GO!'
        }
    ];

    let html = `
        <div class="info-card">
            <div class="phone-highlight">📱 ${phone}</div>
            <div class="info-title">📍 Location Information</div>
            <div class="location-grid">
                <div class="location-item"><strong>Zip:</strong> ${locationInfo.zip}</div>
                <div class="location-item"><strong>City:</strong> ${locationInfo.city}</div>
                <div class="location-item"><strong>County:</strong> ${locationInfo.county}</div>
                <div class="location-item"><strong>State:</strong> ${locationInfo.state}</div>
            </div>
        </div>
        <div class="info-card">
            <div class="info-title">📋 Database Suggestions</div>
            <div class="db-suggestions">
    `;

    dbStatuses.forEach(db => {
        // Determine status text and class
        let statusText = db.found ? db.foundText : db.notFoundText;
        let statusClass = '';
        
        // Special cases for color coding
        if (db.name.includes('DNC') || db.name.includes('Blacklist')) {
            statusClass = db.found ? 'status-found' : 'status-notfound';
        } else if (db.name === 'Social Analytics') {
            statusClass = db.found ? 'status-notfound' : 'status-warning';
        } else {
            statusClass = db.found ? 'status-found' : 'status-notfound';
        }

        html += `
            <div class="suggestion-row">
                <span class="db-name">${db.name}</span>
                <span class="db-status ${statusClass}">${statusText}</span>
            </div>
        `;
    });

    // API response raw data show karein (debugging ke liye)
    if (hasData) {
        html += `
            <div style="margin-top:20px; padding-top:15px; border-top:1px dashed #cbd5e1; font-size:0.8rem; color:#64748b;">
                <details>
                    <summary>📦 Raw API Response (Debug)</summary>
                    <pre style="background:#f1f5f9; padding:10px; border-radius:8px; overflow-x:auto; margin-top:10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
    }

    html += `
            </div>
        </div>
        <div class="footer-note">
            © 2025 - TCPA Application | API: uspeoplesearch.site
        </div>
    `;

    resultArea.innerHTML = html;
}

// ==================== HELPER FUNCTIONS ====================
function showLoading(phone) {
    resultArea.innerHTML = `
        <div class="loading-card">
            ⏳ Searching for <strong>${phone}</strong>...<br>
            <small style="display:block; margin-top:10px;">CORS proxy activate ho raha hai...</small>
        </div>
    `;
}

function showError(message) {
    resultArea.innerHTML = `
        <div class="error-card">
            ❌ ${message}<br><br>
            <small>💡 Tips:<br>
            1. CORS proxy activate karein: <a href="https://cors-anywhere.herokuapp.com/" target="_blank">yahan click karein</a><br>
            2. Sahi 10-digit number daalein<br>
            3. Console (F12) check karein errors ke liye</small>
        </div>
    `;
}

function handleError(error) {
    let userMessage = "API se connect nahi ho paaya. ";
    
    if (error.message.includes('Failed to fetch')) {
        userMessage = `🔴 CORS Error: API ne request block kar di.<br><br>
        <b>Solution:</b><br>
        1. Pehle <a href="https://cors-anywhere.herokuapp.com/" target="_blank" style="color:#2563eb;">yahan click karein</a><br>
        2. "Request temporary access" button dabayein<br>
        3. Phir wapas search karein<br><br>
        Agar phir bhi kaam na kare to:<br>
        - Doosra proxy try karein: https://api.allorigins.win/raw?url=`;
    } else {
        userMessage += error.message;
    }
    
    resultArea.innerHTML = `
        <div class="error-card">
            ❌ ${userMessage}
        </div>
    `;
}

// ==================== INITIAL CHECK ====================
// Check karein ki CORS proxy available hai ya nahi
window.addEventListener('load', () => {
    console.log('🚀 TCPA Lookup Ready!');
    console.log('📡 CORS Proxy:', CORS_PROXY);
    console.log('🎯 API URL:', API_BASE_URL);
    
    // Demo number show karein
    phoneInput.value = '5052209250';
});
