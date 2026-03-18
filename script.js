const API_BASE_URL = "https://api.uspeoplesearch.site/tcpa/v1";

document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('phoneInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') performSearch();
});

async function performSearch() {
    const phoneInput = document.getElementById('phoneInput');
    const resultArea = document.getElementById('resultArea');
    const phone = phoneInput.value.trim();

    // Basic validation
    if(!phone || phone.length !== 10 || isNaN(phone)) {
        resultArea.innerHTML = `<div class="info-card" style="text-align:center;color:#dc2626;padding:30px;">❌ Please enter a valid 10-digit phone number.</div>`;
        return;
    }

    // Show loading
    resultArea.innerHTML = `<div class="info-card" style="text-align:center;padding:30px;">⏳ Searching for ${phone}...</div>`;

    try {
        // Construct API URL with query parameter
        const apiUrl = `${API_BASE_URL}?x=${encodeURIComponent(phone)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Add any other headers if required by the API (like API keys)
                // 'Authorization': 'Bearer YOUR_API_KEY'
            }
        });

        if (!response.ok) {
            // Handle HTTP errors
            let errorMsg = `API Error: ${response.status}`;
            if(response.status === 400) errorMsg = "Bad Request: Phone number format might be incorrect.";
            if(response.status === 404) errorMsg = "API endpoint not found.";
            if(response.status === 500) errorMsg = "Server error. Please try later.";
            throw new Error(errorMsg);
        }

        const data = await response.json();
        displayResults(data, phone);

    } catch (error) {
        console.error("Fetch error:", error);
        resultArea.innerHTML = `<div class="info-card" style="text-align:center;color:#dc2626;padding:30px;">❌ Error: ${error.message}</div>`;
    }
}

function displayResults(data, phone) {
    // This function parses the API response.
    // IMPORTANT: Replace the mock data below with actual parsing of 'data'
    // based on the JSON structure your API returns.
    
    // Example of parsing - adjust according to your actual API response
    const locationInfo = data?.location || { 
        zip: '87106', 
        city: 'ALBUQUERQUE', 
        county: 'BERNALILLO', 
        state: 'NM' 
    };
    
    // Database suggestions - map API response to these statuses
    // Modify this logic based on your API's actual response fields
    const dbStatuses = [
        { name: 'Litigators DB', key: 'litigator', found: data?.litigator?.found ?? false },
        { name: 'Blacklisted DB', key: 'blacklist', found: data?.blacklist?.found ?? true }, // Example: true means found in blacklist (bad)
        { name: 'DNC Suggests', key: 'dnc', found: data?.dnc?.found ?? true },
        { name: 'Social Analytics', key: 'social', found: data?.social?.isGood ?? true },
        { name: 'Closers DNC', key: 'closers', found: data?.closers?.found ?? false },
        { name: 'Old Closers DNC', key: 'oldClosers', found: data?.oldClosers?.found ?? false },
        { name: 'Invalid Phones', key: 'invalid', found: data?.invalid?.found ?? false },
        { name: 'VOIP Blocked', key: 'voip', found: data?.voip?.found ?? false }
    ];

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

    dbStatuses.forEach(db => {
        let statusText = '';
        let statusClass = '';

        // Customize status text and class based on 'found' value and database meaning
        if (db.name === 'Blacklisted DB' || db.name === 'DNC Suggests') {
            // For blacklist/DNC, 'found' means it's bad
            statusText = db.found ? '🔴 FOUND (Blocked)' : '✅ Not Found, Good';
            statusClass = db.found ? 'status-found' : 'status-notfound';
        } else if (db.name === 'Social Analytics') {
            statusText = db.found ? '✅ Good' : '⚠️ Caution';
            statusClass = db.found ? 'status-notfound' : 'status-found';
        } else {
            // For others like Closers, Invalid, VOIP - 'found' might mean it's listed (bad)
            statusText = db.found ? '🔴 Found' : '✅ Not found, Good to GO!';
            statusClass = db.found ? 'status-found' : 'status-notfound';
        }

        html += `
            <div class="suggestion-row ${statusClass}">
                <span class="db-name">${db.name}</span>
                <span class="db-status">${statusText}</span>
            </div>
        `;
    });

    html += `
            </div>
        </div>
        <div class="footer-note">
            © 2025 - TCPA Application (Powered by your API)
        </div>
    `;

    document.getElementById('resultArea').innerHTML = html;
}
