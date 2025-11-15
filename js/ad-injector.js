// --- MANAJEMEN IKLAN ---
// File ini bergantung pada variabel 'ENABLE_ADS' dari config.js

/**
 * Mengembalikan HTML untuk Banner Ad (728x90)
 * @returns {string} HTML Iklan atau string kosong
 */
function getBannerAdHTML() {
    // Cek apakah iklan diaktifkan secara global di config.js
    if (typeof ENABLE_ADS !== 'undefined' && ENABLE_ADS === true) {
        return `
        <div class="ad-container ad-banner-728x90">
            <script type="text/javascript">
                atOptions = {
                    'key' : '1b8a7e10e6a2219edc43d4e39450a3b2',
                    'format' : 'iframe',
                    'height' : 90,
                    'width' : 728,
                    'params' : {}
                };
            <\/script>
            <script type="text/javascript" src="//www.highperformanceformat.com/1b8a7e10e6a2219edc43d4e39450a3b2/invoke.js"><\/script>
        </div>
        `;
    }
    return ''; // Kembalikan string kosong jika ads nonaktif
}

/**
 * Mengembalikan HTML untuk Native Banner Ad
 * @returns {string} HTML Iklan atau string kosong
 */
function getNativeAdHTML() {
    // Cek apakah iklan diaktifkan secara global di config.js
    if (typeof ENABLE_ADS !== 'undefined' && ENABLE_ADS === true) {
        // ID div "container-f7..." harus unik. 
        // Saat berpindah halaman (SPA), script mungkin berjalan lagi.
        // Kita beri ID unik pada kontainer luar untuk script baru.
        const uniqueWrapperId = 'ad-native-wrapper-' + Date.now() + Math.floor(Math.random() * 1000);
        
        // Penting: Script ini mencari div dengan ID "container-f7278d1e580dbf687e9e48448cfe399f".
        // Dengan menempatkan script dan div bersamaan di dalam wrapper, 
        // kita memastikan script yang baru dieksekusi menemukan div yang baru dibuat.
        return `
        <div class="ad-container ad-native-banner" id="${uniqueWrapperId}">
            <script async="async" data-cfasync="false" src="//pl28058077.effectivegatecpm.com/f7278d1e580dbf687e9e48448cfe399f/invoke.js"><\/script>
            <div id="container-f7278d1e580dbf687e9e48448cfe399f"></div>
        </div>
        `;
    }
    return ''; // Kembalikan string kosong jika ads nonaktif
}

/**
 * Fungsi helper untuk menyisipkan ad ke placeholder di DOM
 * @param {string} placeholderSelector - CSS selector (e.g., "#ad-placeholder-1")
 * @param {string} adHTML - HTML yang di-generate oleh getBannerAdHTML() atau getNativeAdHTML()
 */
function injectAd(placeholderSelector, adHTML) {
    if (adHTML) { // Hanya jalankan jika adHTML tidak kosong (ads aktif)
        try {
            const placeholder = document.querySelector(placeholderSelector);
            if (placeholder) {
                // Menggunakan innerHTML agar browser mem-parsing <script>
                placeholder.innerHTML = adHTML;
            } else {
                // Ini wajar terjadi jika placeholder ada di bagian yg tidak aktif
                // console.warn('Ad placeholder not found (ini wajar):', placeholderSelector);
            }
        } catch (e) {
            console.error('Gagal menyisipkan iklan ke', placeholderSelector, e);
        }
    }
}