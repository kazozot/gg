// File: gg-main/js/adblock-detector.js
(function() {
    var detected = false; // Flag agar tidak muncul peringatan ganda

    // --- Fungsi Tampilan Modal (Sama seperti sebelumnya, sedikit diperbaiki) ---
    function showAdBlockWarning() {
        if (detected) return; // Jika sudah terdeteksi, hentikan (jangan spam modal)
        detected = true;

        // Cek apakah modal sudah ada?
        if (document.getElementById('adblock-overlay')) return;

        var css = `
            #adblock-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.96); z-index: 2147483647; /* Z-index maksimal */
                display: flex; justify-content: center; align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #adblock-message {
                background: #1e1e1e; color: #fff; padding: 30px; border-radius: 12px;
                max-width: 500px; width: 90%; text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #444;
            }
            #adblock-message h2 { color: #ff5252; margin: 0 0 15px 0; font-size: 22px; }
            #adblock-message p { font-size: 15px; line-height: 1.6; margin-bottom: 15px; color: #ccc; }
            #adblock-btn {
                background: #ff5252; color: white; border: none; padding: 12px 25px;
                font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;
                transition: transform 0.2s;
            }
            #adblock-btn:hover { background: #ff7675; transform: scale(1.05); }
            body.adblock-active { overflow: hidden !important; }
        `;

        var style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        var modalHTML = `
            <div id="adblock-message">
                <h2>⚠️ AdBlock Terdeteksi</h2>
                <p>Halo! Kami mendeteksi Anda menggunakan pemblokir iklan.</p>
                <p>Kami telah bekerja keras mengumpulkan database ini. Biaya server dan domain cukup mahal. 
                Demi menghargai jerih payah developer, <strong>mohon matikan AdBlock Anda</strong>.</p>
                <p>Kami hanya memasang iklan banner yang sopan, tanpa pop-up yang mengganggu.</p>
                <button id="adblock-btn" onclick="location.reload();">Saya Sudah Matikan AdBlock ↻</button>
            </div>
        `;
        
        var overlay = document.createElement('div');
        overlay.id = 'adblock-overlay';
        overlay.innerHTML = modalHTML;
        document.body.appendChild(overlay);
        document.body.classList.add('adblock-active');
    }

    // --- Fungsi Pendeteksian Hardcore ---
    function runDetection() {
        // 1. Cek apakah variabel dari ads.js ada
        if (window.adBlockerDisabled === undefined) {
            console.log("Deteksi 1: Variabel ads.js tidak ditemukan.");
            showAdBlockWarning();
            return;
        }

        // 2. Cek Network/File dengan Fetch (Metode Jebakan Network)
        // Kita coba fetch file 'ads.js'. Jika browser memblokir requestnya, ini akan error.
        fetch('js/ads.js', { method: 'HEAD', mode: 'no-cors' })
        .catch(function(e) {
            console.log("Deteksi 2: Fetch ads.js gagal (diblokir network).");
            showAdBlockWarning();
        });

        // 3. Cek Elemen HTML (Metode Jebakan CSS - Paling Ampuh untuk uBlock Origin)
        var bait = document.createElement('div');
        // Kelas-kelas ini ada di daftar hitam EasyList (list standar AdBlock)
        bait.className = 'ad-banner adsbox doubleclick ad-placement carbon-ads';
        bait.style.position = 'absolute';
        bait.style.top = '-9999px';
        bait.style.left = '-9999px';
        bait.style.width = '1px';
        bait.style.height = '1px';
        document.body.appendChild(bait);

        // Kita beri sedikit delay agar AdBlock sempat bereaksi menyembunyikan elemen
        setTimeout(function() {
            var style = window.getComputedStyle(bait);
            if (
                style.display === 'none' || 
                style.visibility === 'hidden' || 
                style.height === '0px' || 
                bait.offsetHeight === 0
            ) {
                console.log("Deteksi 3: Elemen umpan disembunyikan oleh CSS AdBlock.");
                showAdBlockWarning();
            }
            bait.remove(); // Bersihkan jejak
        }, 100);
    }

    // --- Eksekusi Berulang (Loop Check) ---
    // AdBlocker kadang lambat loadingnya, jadi kita cek beberapa kali.
    // Cek segera saat load
    window.addEventListener('load', runDetection);
    
    // Cek lagi setelah 1 detik
    setTimeout(runDetection, 1000);
    
    // Cek lagi setelah 3 detik (untuk koneksi lambat/adblock lambat)
    setTimeout(runDetection, 3000);

})();
