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
    
    resultArea.innerHTML = `<div class="loading-card">⏳ API call ho rahi hai...<br><small>Phone: ${phone}</small></div>`;

    try {
        const apiUrl = `${CORS_PROXY}${API_BASE_URL}?x=${phone}`;
        
        console.log('🌐 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // 🔥 YAHAN SE DEBUGGING START HOTI HAI
        console.log('📦 RAW API RESPONSE:', data);
        
        // Pehle raw response dikhao, phir formatted results
        showRawResponse(data, phone);

    } catch (error) {
        console.error('❌ Error:', error);
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

// ==================== SHOW RAW RESPONSE ====================
function showRawResponse(data, phone) {
    // API response ka structure dekhte hain
    let html = `
        <div class="info-card" style="background:#1e293b; color:#e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <span class="phone-highlight" style="background:#3b82f6; color:white;">📱 ${phone}</span>
                <span style="background:#22c55e; color:white; padding:4px 12px; border-radius:30px; font-size:0.8rem;">✅ API Connected</span>
            </div>
            
            <div style="margin-bottom:20px;">
                <div style="color:#94a3b8; font-size:0.9rem; margin-bottom:8px;">🔍 API Response Type:</div>
                <div style="background:#0f172a; padding:12px; border-radius:10px;">
                    ${typeof data} | ${Array.isArray(data) ? 'Array' : 'Object'} | Length: ${Object.keys(data).length}
                </div>
            </div>
            
            <div style="margin-bottom:20px;">
                <div style="color:#94a3b8; font-size:0.9rem; margin-bottom:8px;">📋 Available Keys:</div>
                <div style="background:#0f172a; padding:12px; border-radius:10px; font-family:monospace;">
                    ${Object.keys(data).map(key => `"${key}"`).join(' • ') || 'No keys found'}
                </div>
            </div>
            
            <div>
                <div style="color:#94a3b8; font-size:0.9rem; margin-bottom:8px;">📦 Full JSON Response:</div>
                <pre style="background:#0f172a; padding:15px; border-radius:10px; overflow-x:auto; font-size:0.85rem; line-height:1.5; color:#a5f3fc;">${JSON.stringify(data, null, 2)}</pre>
            </div>
            
            <div style="margin-top:25px; padding-top:15px; border-top:1px solid #334155;">
                <div style="color:#fbbf24; font-size:1rem; margin-bottom:15px;">⚡ Ab aap batayein:</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="tryParsing()" style="flex:1; padding:12px; background:#3b82f6; color:white; border:none; border-radius:30px; font-weight:600; cursor:pointer;">🔄 Auto-Parse Try Karein</button>
                    <button onclick="location.reload()" style="flex:1; padding:12px; background:#475569; color:white; border:none; border-radius:30px; font-weight:600; cursor:pointer;">🏠 New Search</button>
                </div>
            </div>
        </div>
    `;
    
    resultArea.innerHTML = html;
    
    // Store data globally for parsing function
    window.lastApiResponse = data;
    window.lastPhone = phone;
}

// ==================== TRY PARSING ====================
window.tryParsing = function() {
    const data = window.lastApiResponse;
    const phone = window.lastPhone;
    
    if (!data) {
        alert('No API data found!');
        return;
    }
    
    // 🔥 YAHAN APKO BATANA HAI KAISE DATA ARAHA HAI
    let parsedHtml = `
        <div class="info-card">
            <div class="phone-highlight">📱 ${phone}</div>
            <div class="info-title">🔍 Parsing Attempt - Aap batayein sahi hai ya nahi?</div>
    `;
    
    // Try to find location data
    let location = {
        zip: findValue(data, ['zip', 'zipcode', 'postal', 'postal_code']),
        city: findValue(data, ['city', 'town', 'locality']),
        county: findValue(data, ['county', 'parish', 'district']),
        state: findValue(data, ['state', 'province', 'region'])
    };
    
    parsedHtml += `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin:15px 0;">
            <h4 style="margin-bottom:10px;">📍 Location Data Found:</h4>
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
                <div><strong>Zip:</strong> ${location.zip || '❌ Not found'}</div>
                <div><strong>City:</strong> ${location.city || '❌ Not found'}</div>
                <div><strong>County:</strong> ${location.county || '❌ Not found'}</div>
                <div><strong>State:</strong> ${location.state || '❌ Not found'}</div>
            </div>
        </div>
    `;
    
    // Try to find database statuses
    parsedHtml += `<div style="margin-top:20px;"><h4>📋 Database Status (jo mila):</h4>`;
    
    const dbChecks = [
        { name: 'Litigators DB', paths: ['litigator', 'litigators', 'legal'] },
        { name: 'Blacklisted DB', paths: ['blacklist', 'blacklisted', 'blocked'] },
        { name: 'DNC', paths: ['dnc', 'do_not_call', 'dnc_list'] },
        { name: 'Social Analytics', paths: ['social', 'analytics', 'score'] },
        { name: 'Closers DNC', paths: ['closers', 'closer'] },
        { name: 'Invalid Phones', paths: ['invalid', 'valid'] },
        { name: 'VOIP', paths: ['voip', 'blocked'] }
    ];
    
    dbChecks.forEach(db => {
        const found = findValue(data, db.paths);
        parsedHtml += `
            <div style="display:flex; justify-content:space-between; padding:10px; background:white; margin:5px 0; border-radius:8px; border-left:3px solid ${found ? '#22c55e' : '#94a3b8'};">
                <span>${db.name}</span>
                <span style="color:${found ? '#166534' : '#64748b'};">${found !== null ? JSON.stringify(found) : '❌ Not found'}</span>
            </div>
        `;
    });
    
    parsedHtml += `</div>`;
    
    // User feedback buttons
    parsedHtml += `
        <div style="margin-top:25px; padding-top:20px; border-top:2px dashed #cbd5e1;">
            <div style="text-align:center; margin-bottom:15px; font-weight:600;">🤔 Aapke hisaab se:</div>
            <div style="display:flex; gap:10px;">
                <button onclick="feedback('correct')" style="flex:1; padding:15px; background:#22c55e; color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer;">✅ Data Sahi Hai</button>
                <button onclick="feedback('wrong')" style="flex:1; padding:15px; background:#ef4444; color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer;">❌ Galat Hai</button>
            </div>
            <div style="margin-top:15px; text-align:center;">
                <small>Agar galat hai to batao kaise data aana chahiye</small>
            </div>
        </div>
    `;
    
    resultArea.innerHTML = parsedHtml;
};

// Helper function to find value in nested object
function findValue(obj, possibleKeys) {
    if (!obj || typeof obj !== 'object') return null;
    
    for (let key of possibleKeys) {
        if (obj[key] !== undefined) return obj[key];
        
        // Check in nested objects
        for (let prop in obj) {
            if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                const nested = findValue(obj[prop], [key]);
                if (nested !== null) return nested;
            }
        }
    }
    return null;
}

// Feedback function
window.feedback = function(type) {
    if (type === 'correct') {
        alert('🎉 Great! Ab hum is structure ke hisaab se final code bana denge. Aap batao konsa data sahi hai?');
    } else {
        const response = prompt('❌ Batao kya galat hai aur sahi data kya hona chahiye? Example: "Location city Mumbai hona chahiye"');
        if (response) {
            console.log('User Feedback:', response);
            alert('🙏 Thanks! Ab main is hisaab se code update karunga.');
        }
    }
};

function showError(message) {
    resultArea.innerHTML = `
        <div class="error-card">
            ❌ ${message}
            <button onclick="performSearch()" style="display:block; margin:15px auto 0; padding:8px 20px; background:#3b82f6; color:white; border:none; border-radius:30px; cursor:pointer;">Try Again</button>
        </div>
    `;
}
