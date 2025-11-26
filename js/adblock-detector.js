(function() {
    // Fungsi untuk menampilkan Pesan Peringatan
    function showAdBlockWarning() {
        // 1. Buat CSS untuk tampilan modal secara dinamis
        var css = `
            #adblock-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                text-align: center;
                color: #fff;
                overflow: hidden;
            }
            #adblock-message {
                background: #1a1a1a;
                padding: 40px;
                border-radius: 10px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.2);
                border: 1px solid #333;
            }
            #adblock-message h2 {
                color: #ff4757;
                margin-bottom: 20px;
                font-size: 24px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            #adblock-message p {
                line-height: 1.6;
                margin-bottom: 15px;
                color: #ddd;
                font-size: 16px;
            }
            #adblock-message .highlight {
                color: #2ed573;
                font-weight: bold;
            }
            #adblock-btn {
                background: #ff4757;
                color: white;
                border: none;
                padding: 12px 30px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.3s;
                font-weight: bold;
            }
            #adblock-btn:hover {
                background: #ff6b81;
            }
            /* Mencegah scroll pada body saat modal muncul */
            body.adblock-active {
                overflow: hidden !important;
            }
        `;

        // Masukkan CSS ke dalam head
        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        // 2. Buat HTML Modal
        var modalHTML = `
            <div id="adblock-message">
                <h2>AdBlock Terdeteksi!</h2>
                <p>Halo sobat, kami mendeteksi Anda menggunakan <strong>AdBlock</strong> (seperti uBlock Origin atau sejenisnya).</p>
                
                <p>Kami mohon pengertiannya. Membuat dan mengelola database ini membutuhkan waktu, tenaga, serta biaya untuk <strong>Hosting dan Domain</strong>.</p>
                
                <p>Demi bisa saling menghargai, mohon matikan AdBlock Anda di situs ini. Jangan khawatir, kami <span class="highlight">HANYA menggunakan iklan Banner</span> yang rapi, tanpa Pop-up yang mengganggu atau Social Bar.</p>
                
                <p>Silakan matikan AdBlock Anda, lalu klik tombol di bawah untuk memuat ulang halaman.</p>
                
                <button id="adblock-btn" onclick="location.reload();">Saya Sudah Matikan AdBlock & Refresh</button>
            </div>
        `;

        var overlay = document.createElement('div');
        overlay.id = 'adblock-overlay';
        overlay.innerHTML = modalHTML;
        
        // Tambahkan ke body
        document.body.appendChild(overlay);
        document.body.classList.add('adblock-active');
    }

    // Fungsi Utama Pendeteksian
    function detectAdBlock() {
        // Metode 1: Cek apakah file 'ads.js' berhasil dimuat (variabel canRunAds ada)
        if (typeof canRunAds === 'undefined') {
            showAdBlockWarning();
            return;
        }

        // Metode 2: Cek Umpan HTML (Bait Element)
        // Beberapa adblocker membiarkan file js tapi menyembunyikan elemen iklan via CSS
        var bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = 'adsbox ad-banner pub_300x250 pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        bait.style.position = 'absolute';
        bait.style.top = '-1000px';
        bait.style.left = '-1000px';
        bait.style.height = '10px'; // Beri tinggi sedikit
        
        document.body.appendChild(bait);

        setTimeout(function() {
            // Jika tinggi elemen menjadi 0 atau display none, berarti disembunyikan AdBlock
            if (bait.offsetHeight === 0 || bait.clientHeight === 0 || window.getComputedStyle(bait).display === 'none') {
                showAdBlockWarning();
            }
            // Bersihkan elemen umpan
            bait.remove();
        }, 100);
    }

    // Jalankan deteksi setelah halaman selesai dimuat
    window.addEventListener('load', detectAdBlock);

})();
