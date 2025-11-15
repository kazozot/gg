// --- MANAJEMEN IKLAN (VERSI PERBAIKAN V4 - SEMUA IKLAN VIA iFrame) ---

/**
 * Mengembalikan objek konfigurasi untuk Banner Ad (728x90)
 * (Fungsi ini tidak diubah)
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
 * [MODIFIKASI] Menambahkan 'width' dan 'height' untuk iframe
 * @returns {object | null} Objek Konfigurasi atau null jika ads nonaktif
 */
function getNativeAdConfig() {
    if (typeof ENABLE_ADS === 'undefined' || ENABLE_ADS === false) {
        return null;
    }
    return {
        type: 'native', // Tipe untuk logika 'switch'
        containerClass: 'ad-container ad-native-banner',
        width: '100%',  // Lebar iframe, akan mengisi container
        height: 120,    // Tinggi iframe (CSS .ad-native-banner punya min-height: 100px)
        innerDivId: 'container-f7278d1e580dbf687e9e48448cfe399f', // ID yang dicari script
        externalScriptSrc: '//pl28058077.effectivegatecpm.com/f7278d1e580dbf687e9e48448cfe399f/invoke.js'
    };
}

/**
 * Fungsi (V4) untuk menyisipkan iklan.
 * [PERBAIKAN] Sekarang SEMUA tipe iklan dimuat via iFrame.
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
        // --- Logika BARU: Semua iklan (banner & native) sekarang dimuat via iFrame ---
        
        // 1. Buat kontainer luar (untuk style margin/padding)
        const adWrapper = document.createElement('div');
        adWrapper.className = adConfig.containerClass;

        // 2. Buat iframe sebagai "halaman web mini"
        const adFrame = document.createElement('iframe');
        
        // [PERBAIKAN AKSESIBILITAS] Menambahkan judul untuk iframe
        adFrame.title = 'Placeholder Iklan'; 
        
        adFrame.width = adConfig.width || '100%';
        adFrame.height = adConfig.height || 100; // Fallback height
        adFrame.frameBorder = 0;
        adFrame.scrolling = 'no';
        adFrame.style.border = 'none';
        adFrame.style.overflow = 'hidden';
        
        // Atur style spesifik berdasarkan tipe
        if (adConfig.type === 'banner') {
             adFrame.style.maxWidth = '100%'; // Biarkan banner 728x90 mengecil di mobile
        } else {
             adFrame.style.width = '100%'; // Pastikan native frame mengisi container
             // Biarkan height diatur oleh adConfig.height
        }

        // 3. Gabungkan adWrapper dan adFrame, lalu masukkan ke placeholder
        adWrapper.appendChild(adFrame);
        placeholder.appendChild(adWrapper);

        // 4. Siapkan HTML lengkap untuk ditulis ke dalam iframe
        let adHtml = '';
        const baseStyle = 'body, html { margin: 0; padding: 0; width: 100%; height: 100%; }';

        if (adConfig.type === 'banner') {
            // Style untuk banner: tengahkan konten
            const bannerStyle = `${baseStyle} body { display: flex; justify-content: center; align-items: center; overflow: hidden; }`;
            adHtml = `
                <html><head><style>${bannerStyle}</style></head>
                <body>
                    <script type="text/javascript">
                        ${adConfig.inlineScriptContent}
                    <\/script>
                    <script type="text/javascript" src="${adConfig.externalScriptSrc}"><\/script>
                </body>
                </html>
            `;
        } else if (adConfig.type === 'native') {
            // Style untuk native: biarkan default (top-left)
            adHtml = `
                <html><head><style>${baseStyle}</style></head>
                <body>
                    <div id="${adConfig.innerDivId}"></div>
                    <script async="async" data-cfasync="false" src="${adConfig.externalScriptSrc}"><\/script>
                </body>
                </html>
            `;
        }

        // 5. Tulis HTML ke dalam iframe
        if (adHtml) {
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
