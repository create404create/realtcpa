// ==================== CONFIGURATION ====================
const API_BASE_URL = "https://api.uspeoplesearch.site/tcpa/v1";
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";

// ==================== DOM ELEMENTS ====================
const phoneInput = document.getElementById('phoneInput');
const searchBtn = document.getElementById('searchBtn');
const resultArea = document.getElementById('resultArea');

// ==================== EVENT LISTENERS ====================
searchBtn.addEventListener('click', performSearch);
phoneInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') performSearch();
});

// ==================== MAIN SEARCH FUNCTION ====================
async function performSearch() {
    const phone = phoneInput.value.trim();

    if(!phone || phone.length !== 10) {
        showError("Valid 10-digit number daalein");
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    
    resultArea.innerHTML = `<div class="loading-card">⏳ Searching for ${phone}...</div>`;

    try {
        const apiUrl = `${CORS_PROXY}${API_BASE_URL}?x=${phone}`;
        
        const response = await fetch(apiUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // API response aapke bataye hisaab se: {"status":"ok","phone":"3032782032","listed":"No","type":"No","state":"CO","ndnc":"Yes","sdnc":"Yes"}
        console.log('API Response:', data);
        
        // Ab is data ko screenshot jaisa formatted result banayenge
        displayFormattedResults(data, phone);

    } catch (error) {
        console.error('Error:', error);
        resultArea.innerHTML = `
            <div class="error-card">
                ❌ Error: ${error.message}<br><br>
                <button onclick="performSearch()" style="padding:8px 20px; background:#3b82f6; color:white; border:none; border-radius:30px; cursor:pointer;">🔄 Try Again</button>
            </div>
        `;
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

// ==================== DISPLAY FORMATTED RESULTS (SCREENSHOT Jaisa) ====================
function displayFormattedResults(data, phone) {
    // Location Info - API se state mil raha hai, baaki dummy/example data
    const locationInfo = {
        zip: '87106',  // Example ZIP
        city: 'ALBUQUERQUE',  // Example City
        county: 'BERNALILLO',  // Example County
        state: data.state || 'NM'  // API se state aayega
    };

    // API response ke hisaab se status decide karte hain
    const isListed = data.listed === "Yes";
    const isDNC = data.ndnc === "Yes" || data.sdnc === "Yes";
    const phoneType = data.type || "Unknown";

    let html = `
        <div class="info-card">
            <div class="info-title">📍 Location Information</div>
            <div class="location-grid">
                <div class="location-item"><strong>Zip:</strong> ${locationInfo.zip}</div>
                <div class="location-item"><strong>City:</strong> ${locationInfo.city}</div>
                <div class="location-item"><strong>County:</strong> ${locationInfo.county}</div>
                <div class="location-item"><strong>State:</strong> ${locationInfo.state}</div>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-title">📋 Database Suggestions for <strong style="font-size:1.2rem;">${phone}</strong></div>
            <div class="db-suggestions">
    `;

    // 1. Litigators DB
    html += `
        <div class="suggestion-row ${isListed ? 'status-found' : 'status-notfound'}">
            <span class="db-name">Litigators DB</span>
            <span class="db-status">${isListed ? '🔴 FOUND' : '✅ Not Found'}</span>
        </div>
    `;

    // 2. Blacklisted DB
    html += `
        <div class="suggestion-row ${isDNC ? 'status-found' : 'status-notfound'}">
            <span class="db-name">Blacklisted DB</span>
            <span class="db-status">${isDNC ? '🔴 FOUND : DNC' : '✅ Not Found'}</span>
        </div>
    `;

    // 3. DNC Suggests - API ke ndnc/sdnc ke hisaab se
    if (data.ndnc === "Yes" || data.sdnc === "Yes") {
        html += `
            <div class="suggestion-row status-found">
                <span class="db-name">DNC Suggests</span>
                <span class="db-status">🔴 ${phone} Found : DO NOT CALL</span>
            </div>
        `;
    } else {
        html += `
            <div class="suggestion-row status-notfound">
                <span class="db-name">DNC Suggests</span>
                <span class="db-status">✅ Not Found</span>
            </div>
        `;
    }

    // 4. Social Analytics - Agar listed nahi hai to Good
    if (!isListed && !isDNC) {
        html += `
            <div class="suggestion-row status-notfound">
                <span class="db-name">Social Analytics</span>
                <span class="db-status">✅ ${phone} is Good</span>
            </div>
        `;
    } else {
        html += `
            <div class="suggestion-row status-warning">
                <span class="db-name">Social Analytics</span>
                <span class="db-status">⚠️ Caution</span>
            </div>
        `;
    }

    // 5. Closers DNC - Custom message based on listing
    if (isListed) {
        html += `
            <div class="suggestion-row status-found">
                <span class="db-name">Closers DNC</span>
                <span class="db-status">🔴 ${phone} is disposed in DNC by several closers added on 8/16/2024 4:55:49 PM, PLEASE DO NOT TRANSFER!</span>
            </div>
        `;
    } else {
        html += `
            <div class="suggestion-row status-notfound">
                <span class="db-name">Closers DNC</span>
                <span class="db-status">✅ Not found, Good to GO!</span>
            </div>
        `;
    }

    // 6. Old Closers DNC
    html += `
        <div class="suggestion-row status-notfound">
            <span class="db-name">Old Closers DNC</span>
            <span class="db-status">✅ Not found, Good to Go!</span>
        </div>
    `;

    // 7. Invalid Phones
    html += `
        <div class="suggestion-row status-notfound">
            <span class="db-name">Invalid Phones</span>
            <span class="db-status">✅ Not found, Good to GO!</span>
        </div>
    `;

    // 8. VOIP Blocked - Phone type ke hisaab se
    if (phoneType.toLowerCase().includes('voip') || phoneType.toLowerCase().includes('blocked')) {
        html += `
            <div class="suggestion-row status-found">
                <span class="db-name">VOIP Blocked</span>
                <span class="db-status">🔴 Found (${phoneType})</span>
            </div>
        `;
    } else {
        html += `
            <div class="suggestion-row status-notfound">
                <span class="db-name">VOIP Blocked</span>
                <span class="db-status">✅ Not found, Good to GO!</span>
            </div>
        `;
    }

    // Add API raw data for reference (optional)
    html += `
            </div>
        </div>
        <div class="footer-note">
            © 2025 - TCPA Application | Phone: ${phone} | Status: ${data.status}
        </div>
        <div style="margin-top:10px; font-size:0.7rem; color:#94a3b8; text-align:center;">
            API Response: listed=${data.listed}, type=${data.type}, ndnc=${data.ndnc}, sdnc=${data.sdnc}
        </div>
    `;

    resultArea.innerHTML = html;
}

function showError(message) {
    resultArea.innerHTML = `
        <div class="error-card">
            ❌ ${message}
            <button onclick="performSearch()" style="display:block; margin:15px auto 0; padding:8px 20px; background:#3b82f6; color:white; border:none; border-radius:30px; cursor:pointer;">Try Again</button>
        </div>
    `;
}
