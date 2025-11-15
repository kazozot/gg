// --- MANAJEMEN IKLAN (VERSI PERBAIKAN V3 - iFrame untuk document.write) ---

/**
 * Mengembalikan objek konfigurasi untuk Banner Ad (728x90)
 * [MODIFIKASI] Menambahkan 'width' dan 'height' untuk iframe
 * @returns {object | null} Objek Konfigurasi atau null jika ads nonaktif
 */
function getBannerAdConfig() {
    if (typeof ENABLE_ADS === 'undefined' || ENABLE_ADS === false) {
        return null;
    }
    return {
        type: 'banner',
        containerClass: 'ad-container ad-banner-728x90',
        width: 728, // Dimensi untuk iframe
        height: 90, // Dimensi untuk iframe
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
 * (Fungsi ini tidak diubah, sudah benar)
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
 * Fungsi (V3) untuk menyisipkan iklan.
 * Tipe 'native' (modern) disisipkan langsung via DOM.
 * Tipe 'banner' (lama) disisipkan ke dalam iframe buatan.
 */
function injectAd(placeholderSelector, adConfig) {
    if (!adConfig) return; // Ads dinonaktifkan

    const placeholder = document.querySelector(placeholderSelector);
    if (!placeholder) {
        // console.warn('Ad placeholder not found (ini wajar):', placeholderSelector);
        return;
    }
    
    // [PENTING] Bersihkan placeholder
    placeholder.innerHTML = ''; 

    try {
        if (adConfig.type === 'native') {
            // --- Logika untuk Iklan NATIVE (Sudah Benar & Berhasil) ---
            const adWrapper = document.createElement('div');
            adWrapper.className = adConfig.containerClass;

            const innerDiv = document.createElement('div');
            innerDiv.id = adConfig.innerDivId;
            adWrapper.appendChild(innerDiv);

            const externalScript = document.createElement('script');
            externalScript.async = true;
            externalScript.setAttribute('data-cfasync', 'false');
            externalScript.src = adConfig.externalScriptSrc;
            adWrapper.appendChild(externalScript);
            
            placeholder.appendChild(adWrapper);

        } else if (adConfig.type === 'banner') {
            // --- Logika BARU untuk Iklan BANNER (via iFrame) ---
            // Ini adalah perbaikan untuk skrip iklan yang menggunakan document.write()
            
            // 1. Buat kontainer luar (untuk style margin/padding)
            const adWrapper = document.createElement('div');
            adWrapper.className = adConfig.containerClass;

            // 2. Buat iframe sebagai "halaman web mini"
            const adFrame = document.createElement('iframe');
            adFrame.width = adConfig.width;
            adFrame.height = adConfig.height;
            adFrame.frameBorder = 0;
            adFrame.scrolling = 'no';
            adFrame.style.border = 'none';
            adFrame.style.overflow = 'hidden';
            adFrame.style.maxWidth = '100%'; // Agar tetap responsif

            // 3. Gabungkan adWrapper dan adFrame, lalu masukkan ke placeholder
            adWrapper.appendChild(adFrame);
            placeholder.appendChild(adWrapper);

            // 4. Siapkan HTML lengkap untuk ditulis ke dalam iframe
            const adHtml = `
                <html>
                <head>
                    <style>
                        /* Reset body margin/padding di dalam iframe */
                        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                    </style>
                </head>
                <body>
                    <script type="text/javascript">
                        ${adConfig.inlineScriptContent}
                    <\/script>
                    <script type="text/javascript" src="${adConfig.externalScriptSrc}"><\/script>
                </body>
                </html>
            `;

            // 5. Tulis HTML ke dalam iframe
            // Kita gunakan 'setTimeout' 0 untuk memastikan iframe sudah 
            // ter-render di DOM sebelum kita akses 'contentWindow'
            setTimeout(() => {
                if (adFrame.contentWindow) {
                    const adDoc = adFrame.contentWindow.document;
                    adDoc.open();
                    adDoc.write(adHtml);
                    adDoc.close();
                } else {
                    console.error('Tidak bisa mengakses contentWindow iframe untuk iklan di', placeholderSelector);
                }
            }, 0);
        }
    } catch (e) {
        console.error('Gagal menyisipkan iklan ke', placeholderSelector, e);
    }
}
