// --- MANAJEMEN IKLAN (VERSI PERBAIKAN) ---
// File ini bergantung pada variabel 'ENABLE_ADS' dari config.js

/**
 * Mengembalikan objek konfigurasi untuk Banner Ad (728x90)
 * @returns {object | null} Objek Konfigurasi atau null jika ads nonaktif
 */
function getBannerAdConfig() {
    if (typeof ENABLE_ADS === 'undefined' || ENABLE_ADS === false) {
        return null;
    }
    return {
        type: 'banner',
        containerClass: 'ad-container ad-banner-728x90',
        // Konten untuk script inline
        inlineScriptContent: `
            atOptions = {
                'key' : '1b8a7e10e6a2219edc43d4e39450a3b2',
                'format' : 'iframe',
                'height' : 90,
                'width' : 728,
                'params' : {}
            };
        `,
        // URL untuk script external
        externalScriptSrc: '//www.highperformanceformat.com/1b8a7e10e6a2219edc43d4e39450a3b2/invoke.js'
    };
}

/**
 * Mengembalikan objek konfigurasi untuk Native Banner Ad
 * @returns {object | null} Objek Konfigurasi atau null jika ads nonaktif
 */
function getNativeAdConfig() {
    if (typeof ENABLE_ADS === 'undefined' || ENABLE_ADS === false) {
        return null;
    }
    return {
        type: 'native',
        containerClass: 'ad-container ad-native-banner',
        // Script native ini butuh div dengan ID spesifik
        innerDivId: 'container-f7278d1e580dbf687e9e48448cfe399f',
        // URL untuk script external
        externalScriptSrc: '//pl28058077.effectivegatecpm.com/f7278d1e580dbf687e9e48448cfe399f/invoke.js'
    };
}

/**
 * Fungsi baru untuk menyisipkan iklan dengan membuat elemen DOM secara manual
 * @param {string} placeholderSelector - CSS selector (e.g., "#ad-placeholder-1")
 * @param {object} adConfig - Objek yang di-generate oleh getBannerAdConfig() atau getNativeAdConfig()
 */
function injectAd(placeholderSelector, adConfig) {
    if (!adConfig) return; // Ads dinonaktifkan

    const placeholder = document.querySelector(placeholderSelector);
    if (!placeholder) {
        // console.warn('Ad placeholder not found (ini wajar):', placeholderSelector);
        return;
    }
    
    // [PENTING] Bersihkan placeholder sebelum menyisipkan ulang
    // Ini mencegah duplikasi saat navigasi (misal, tekan 'back' atau ganti ayat)
    placeholder.innerHTML = ''; 

    try {
        // 1. Buat container utama (wrapper div)
        const adWrapper = document.createElement('div');
        adWrapper.className = adConfig.containerClass;
        
        if (adConfig.type === 'banner') {
            // --- Logika untuk Iklan Banner (inline + external) ---
            
            // 2a. Buat script inline
            const inlineScript = document.createElement('script');
            inlineScript.type = 'text/javascript';
            // Menyisipkan kode via textContent/innerHTML ke elemen script 
            // adalah cara yang benar agar dieksekusi
            inlineScript.textContent = adConfig.inlineScriptContent; 
            adWrapper.appendChild(inlineScript);

            // 2b. Buat script external
            const externalScript = document.createElement('script');
            externalScript.type = 'text/javascript';
            externalScript.src = adConfig.externalScriptSrc;
            adWrapper.appendChild(externalScript);

        } else if (adConfig.type === 'native') {
            // --- Logika untuk Iklan Native (div internal + external) ---
            
            // 2a. Buat div internal yang dibutuhkan oleh script native
            const innerDiv = document.createElement('div');
            innerDiv.id = adConfig.innerDivId;
            adWrapper.appendChild(innerDiv);

            // 2b. Buat script external
            const externalScript = document.createElement('script');
            externalScript.async = true;
            externalScript.setAttribute('data-cfasync', 'false'); // Set atribut khusus
            externalScript.src = adConfig.externalScriptSrc;
            adWrapper.appendChild(externalScript);
        }

        // 3. Sisipkan wrapper yang sudah berisi script ke placeholder di halaman
        placeholder.appendChild(adWrapper);

    } catch (e) {
        console.error('Gagal menyisipkan iklan ke', placeholderSelector, e);
    }
}
