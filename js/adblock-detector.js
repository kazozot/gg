(function() {
    // --- 1. Konfigurasi Tampilan (CSS & HTML) ---
    function showAdBlockModal() {
        // Cek jika modal sudah ada, jangan buat lagi
        if (document.getElementById('adblock-overlay')) return;

        // CSS untuk memblokir layar total
        const css = `
            #adblock-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                z-index: 2147483647; /* Z-index maksimal browser */
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #adblock-content {
                background: #1e1e1e;
                color: #fff;
                padding: 40px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 25px rgba(255,0,0,0.5);
                border: 2px solid #ff4757;
            }
            #adblock-content h2 {
                color: #ff4757;
                margin-top: 0;
                font-size: 24px;
                text-transform: uppercase;
            }
            #adblock-content p {
                line-height: 1.6;
                color: #ccc;
                margin-bottom: 20px;
            }
            #adblock-content .btn-refresh {
                background: #ff4757;
                color: white;
                border: none;
                padding: 12px 25px;
                font-size: 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: 0.3s;
            }
            #adblock-content .btn-refresh:hover {
                background: #ff6b81;
                transform: scale(1.05);
            }
            body { overflow: hidden !important; } /* Matikan scroll */
        `;

        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);

        const html = `
            <div id="adblock-content">
                <h2>🚫 AdBlock Terdeteksi</h2>
                <p>Halo Sobat! Kami mendeteksi Anda menggunakan pemblokir iklan.</p>
                <p>Mohon pengertiannya. Kami telah bekerja keras mengumpulkan database ini. Biaya server dan domain cukup mahal. Iklan kami hanya <strong>Banner</strong> (bukan popup) yang tidak mengganggu.</p>
                <p>Silakan <strong>matikan AdBlock</strong> untuk situs ini agar kami bisa terus berkarya.</p>
                <button class="btn-refresh" onclick="location.reload()">Saya Sudah Matikan AdBlock ↻</button>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.id = 'adblock-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    }

    // --- 2. Logika Deteksi Berlapis ---

    async function runDetection() {
        let detected = false;

        // TES A: Cek apakah variabel dari ads.js terbaca
        if (typeof adblock_test_variable === 'undefined') {
            console.log("Deteksi 1: Variable script hilang.");
            detected = true;
        }

        // TES B: Cek Bait Element (Jebakan CSS)
        // Kita buat div dengan kelas yang dibenci AdBlock
        const bait = document.createElement('div');
        bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adBox ads-area ads-box ads-sponsore';
        bait.setAttribute('style', 'position: absolute; top: -1000px; left: -1000px; width: 1px; height: 1px; background: transparent;');
        document.body.appendChild(bait);

        // Beri waktu sedikit untuk browser merender (dan AdBlock memblokir)
        await new Promise(r => setTimeout(r, 100));

        const baitStyle = window.getComputedStyle(bait);
        if (baitStyle.display === 'none' || baitStyle.visibility === 'hidden' || bait.offsetParent === null || bait.offsetHeight === 0) {
            console.log("Deteksi 2: Elemen jebakan disembunyikan.");
            detected = true;
        }
        bait.remove();

        // TES C: Network Request Check (Fetch file ads.js)
        // Mencoba mengambil file ads.js secara manual. Jika gagal = network diblokir.
        try {
            await fetch('js/ads.js', { method: 'HEAD' });
        } catch (e) {
            console.log("Deteksi 3: Network request ke ads.js gagal.");
            detected = true;
        }

        // --- KEPUTUSAN AKHIR ---
        if (detected) {
            showAdBlockModal();
        }
    }

    // --- 3. Eksekusi ---
    
    // Jalankan segera saat script dimuat
    runDetection();

    // Jalankan lagi saat window load (untuk memastikan)
    window.addEventListener('load', runDetection);

    // Jalankan Loop setiap 2 detik (Untuk menangkap AdBlock yang lambat loadingnya)
    // Ini penting karena kadang di Incognito, ekstensi butuh waktu inisialisasi
    let checkCount = 0;
    const interval = setInterval(() => {
        runDetection();
        checkCount++;
        // Berhenti mengecek setelah 10 detik (5 kali) agar tidak memberatkan browser
        if (checkCount > 5) clearInterval(interval);
    }, 2000);

})();
