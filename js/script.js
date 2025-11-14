// --- Fungsi Notifikasi Clipboard ---
function showClipboardNotification(message) {
    const toast = document.getElementById('clipboard-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500); 
}

// --- Fungsi Share ---
async function handleShare(surahNumber, ayahNumber, surahLatinName) {
    const title = `Asbabun Nuzul: ${surahLatinName} Ayat ${ayahNumber}`;
    const text = `Lihat Asbabun Nuzul untuk Q.S. ${surahNumber} (${surahLatinName}) Ayat ${ayahNumber}`;
    const url = `${window.location.origin}${window.location.pathname}?surah=${surahNumber}&ayat=${ayahNumber}`;

    if (navigator.share) {
        try {
            await navigator.share({ title: title, text: text, url: url });
        } catch (err) {
            console.error('Error saat berbagi:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(url);
            showClipboardNotification('Link telah disalin ke clipboard!');
        } catch (err) {
            console.error('Gagal menyalin:', err);
            showClipboardNotification('Gagal menyalin link.');
        }
    }
}

// --- Event Listener Utama ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elemen DOM ---
    const surahListEl = document.getElementById('surah-list');
    const verseDetailsPageEl = document.getElementById('verse-details-page');
    const verseListSidebarEl = document.getElementById('verse-list-sidebar');
    const verseContentAreaEl = document.getElementById('verse-content-area');
    const backButton = document.getElementById('back-button');
    const mainTitleEl = document.querySelector('.main-title');
    const themeToggleButton = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const bodyEl = document.body;
    const surahInfoBoxEl = document.getElementById('surah-info-box');

    // --- Variabel Global untuk Data ---
    // (Data diasumsikan ada dari skrip yang di-defer)
    
    let ayahCounts = {}; 
    let asbabDataMap = new Map(); 
    let asbabDataBySurah = new Map();
    let surahArabicNameMap = new Map(); 

    // --- Fungsi Inisialisasi Aplikasi ---
    function initializeApp() {
        // Cek jika data sudah dimuat (penting karena 'defer')
        if (typeof allSurahInfo === 'undefined' || typeof allAyahMeta === 'undefined' || typeof DB === 'undefined') {
            console.error("Data inti (surah/ayah/asbabun nuzul) gagal dimuat.");
            if (surahListEl) {
                 // Hapus placeholder dan tampilkan error
                 surahListEl.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data. Silakan muat ulang halaman.</p>';
            }
            return; 
        }

        processData();
        applyViewMode(localStorage.getItem('viewMode') || 'wbw'); 

        const isDeepLink = checkURLParams(); 
        if (!isDeepLink) {
            displaySurahList();
        }
        setupEventListeners();
    }

    // --- Fungsi untuk memproses data mentah menjadi cache ---
    function processData() {
        // 1. Hitung jumlah ayat
        for (const [verseKey, ayahData] of Object.entries(allAyahMeta)) {
            const surahNum = ayahData.surah_number;
            if (!ayahCounts[surahNum]) {
                ayahCounts[surahNum] = 0;
            }
            ayahCounts[surahNum]++;
        }
        
        // 2. Buat Peta (Map) untuk data Asbabun Nuzul
        DB.forEach(item => {
            const surahNum = item.surahNumber;
            const verseKey = String(item.verseNumber); 
            
            const mapKey = `${surahNum}-${verseKey}`;
            asbabDataMap.set(mapKey, item);
            
            if (!asbabDataBySurah.has(surahNum)) {
                asbabDataBySurah.set(surahNum, []);
            }
            asbabDataBySurah.get(surahNum).push(item);

            if (!surahArabicNameMap.has(surahNum)) {
                surahArabicNameMap.set(surahNum, item.surahName);
            }
        });
    }

    // --- Fungsi untuk mencari KUNCI Asbabun Nuzul (untuk deep link) ---
    function findAsbabKeyForAyah(surahNumber, ayahNumber) {
        let key = `${surahNumber}-${ayahNumber}`;
        if (asbabDataMap.has(key)) {
            return String(ayahNumber); // return "2"
        }

        const entriesForSurah = asbabDataBySurah.get(surahNumber);
        if (!entriesForSurah) return null;

        for (const item of entriesForSurah) {
            const verseStr = String(item.verseNumber);
            if (verseStr.includes('-')) {
                const [start, end] = verseStr.split('-').map(Number);
                if (ayahNumber >= start && ayahNumber <= end) {
                    return verseStr; // return "1-8"
                }
            }
             if (verseStr.includes(',')) {
                const ayahs = verseStr.split(',').map(Number);
                if (ayahs.includes(ayahNumber)) {
                    return verseStr; // return "4,5,6" (contoh)
                }
            }
        }
        return null; // Tidak ditemukan
    }

    // --- Fungsi Tampil Daftar Surah (Menampilkan SEMUA 114 Surah) ---
    const displaySurahList = () => {
        surahListEl.innerHTML = ''; // Hapus placeholder pemuatan
        
        Object.keys(allSurahInfo).sort((a, b) => parseInt(a) - parseInt(b)).forEach(surahKey => {
            const surahNumber = parseInt(surahKey);
            const meta = allSurahInfo[surahNumber];
            const totalAyahs = ayahCounts[surahNumber] || 0; 
            const arabicName = surahArabicNameMap.get(surahNumber) || meta.surah_name;
            const hasAsbab = asbabDataBySurah.has(surahNumber); 

            const card = document.createElement('div');
            card.className = `surah-card ${hasAsbab ? 'has-asbab' : ''}`;
            card.dataset.surah = surahNumber;
            
            // BARU: Menggunakan <h2> bukan <h3> untuk Aksesibilitas
            card.innerHTML = `
                <div class="surah-header">
                    <div class="surah-number">${surahNumber}</div>
                    <div class="surah-info">
                        <h2>${meta.surah_name}</h2>
                        <p>${totalAyahs} Ayat ${hasAsbab ? '• (Ada Riwayat)' : ''}</p>
                    </div>
                    <div class="surah-arabic">${arabicName}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                showVersePage(surahNumber);
            });
            surahListEl.appendChild(card);
        });
    };

    // --- Helper untuk sorting ---
    function getSortableVerseNum(verseKey) {
        return parseInt(String(verseKey).split('-')[0].split(',')[0], 10);
    }

    // --- Fungsi Tampil Halaman Detail Surah (MODIFIKASI) ---
    const showVersePage = (surahNumber, initialAyahKey = null) => {
        surahListEl.classList.add('hidden');
        mainTitleEl.classList.add('hidden');
        verseDetailsPageEl.classList.remove('hidden');

        const surahInfo = allSurahInfo[surahNumber];
        const totalAyahs = ayahCounts[surahNumber];
        const arabicName = surahArabicNameMap.get(surahNumber) || surahInfo.surah_name;
        const ayahEntries = asbabDataBySurah.get(surahNumber);

        // 1. Tampilkan Info Surah
        const infoHTML = surahInfo.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        surahInfoBoxEl.innerHTML = `<h2>${surahInfo.surah_name}</h2>${infoHTML}`;

        // 2. Buat Sidebar
        verseListSidebarEl.innerHTML = `
            <div class="sidebar-surah-info">
                <div class="surah-info">
                    <h3>${surahInfo.surah_name}</h3>
                    <p>${totalAyahs} Ayat</p>
                </div>
                <div class="surah-arabic">${arabicName}</div>
            </div>
            
            <div class="mode-toggle-sidebar" id="view-mode-toggle">
                <p>Mode Tampilan:</p>
                <button class="mode-btn" id="btn-mode-wbw">Per Kata</button>
                <button class="mode-btn" id="btn-mode-full-arab">Arab & Arti</button>
            </div>
            <div id="verse-list-items"></div>
        `;

        setupModeToggleListeners();
        applyViewMode(localStorage.getItem('viewMode') || 'wbw');

        const verseListItemsContainer = verseListSidebarEl.querySelector('#verse-list-items');

        if (ayahEntries && ayahEntries.length > 0) {
            // --- KASUS 1: SURAH MEMILIKI ASBABUN NUZUL ---
            verseListSidebarEl.classList.remove('sidebar-empty');
            
            ayahEntries.sort((a, b) => getSortableVerseNum(a.verseNumber) - getSortableVerseNum(b.verseNumber));

            let verseListHTML = '';
            ayahEntries.forEach(item => {
                const verseKey = String(item.verseNumber);
                const hasHistory = Array.isArray(item.history) && item.history.length > 0;
                const asbabClass = hasHistory ? 'has-asbab' : '';
                verseListHTML += `<button class="verse-list-item ${asbabClass}" data-versekey="${verseKey}">Ayat ${verseKey}</button>`;
            });
            verseListItemsContainer.innerHTML = verseListHTML;

            verseListItemsContainer.querySelectorAll('.verse-list-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    displaySingleVerse(surahNumber, btn.dataset.versekey);
                });
            });

            if (initialAyahKey) {
                displaySingleVerse(surahNumber, initialAyahKey);
            } else {
                verseContentAreaEl.innerHTML = `
                    <div class="verse-item-placeholder">
                        <p>Surah ini memiliki riwayat Asbabun Nuzul. Pilih ayat dari daftar di samping untuk melihat detailnya.</p>
                    </div>
                `;
            }
        } else {
            // --- KASUS 2: SURAH TIDAK MEMILIKI ASBABUN NUZUL ---
            verseListSidebarEl.classList.add('sidebar-empty');
            verseListItemsContainer.innerHTML = '';
            verseContentAreaEl.innerHTML = `
                <div class="verse-item-placeholder">
                    <p>Surah ${surahInfo.surah_name} tidak memiliki riwayat Asbabun Nuzul dalam database ini.</p>
                </div>
            `;
        }
        
        updateURL(surahNumber, initialAyahKey);
    };


    // --- [FUNGSI BARU] Helper untuk menerapkan mode tampilan ---
    function applyViewMode(mode) {
        const btnWbw = document.getElementById('btn-mode-wbw');
        const btnFullArab = document.getElementById('btn-mode-full-arab');

        if (mode === 'full-arab') {
            verseContentAreaEl.classList.remove('mode-wbw');
            verseContentAreaEl.classList.add('mode-full-arab');
            if (btnFullArab) btnFullArab.classList.add('active');
            if (btnWbw) btnWbw.classList.remove('active');
        } else {
            verseContentAreaEl.classList.remove('mode-full-arab');
            verseContentAreaEl.classList.add('mode-wbw');
            if (btnWbw) btnWbw.classList.add('active');
            if (btnFullArab) btnFullArab.classList.remove('active');
        }
    }

    // --- [FUNGSI MODIFIKASI] Mengisi kembali fungsi setupModeButtons ---
    function setupModeToggleListeners() {
        const btnWbw = document.getElementById('btn-mode-wbw');
        const btnFullArab = document.getElementById('btn-mode-full-arab');

        if (btnWbw) {
            btnWbw.addEventListener('click', () => {
                applyViewMode('wbw');
                localStorage.setItem('viewMode', 'wbw');
            });
        }
        
        if (btnFullArab) {
            btnFullArab.addEventListener('click', () => {
                applyViewMode('full-arab');
                localStorage.setItem('viewMode', 'full-arab');
            });
        }
    }
    
    // --- (Fungsi ini dikosongkan di file Anda, sekarang kita isi) ---
    function setupModeButtons() {
        // Logika dipindah ke setupModeToggleListeners() 
    }

    // --- (FUNGSI INI TIDAK PERLU DIUBAH) ---
    const displaySingleVerse = (surahNumber, verseKey) => {
        
        verseContentAreaEl.innerHTML = ''; 

        // 1. Set tombol aktif di sidebar
        verseListSidebarEl.querySelectorAll('.verse-list-item').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = verseListSidebarEl.querySelector(`.verse-list-item[data-versekey='${verseKey}']`);
        if(activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // 2. Dapatkan data Asbabun Nuzul
        const asbabData = asbabDataMap.get(`${surahNumber}-${verseKey}`);
        
        if (!asbabData) {
            verseContentAreaEl.innerHTML = `<p>Error: Data untuk S.${surahNumber} A.${verseKey} tidak ditemukan.</p>`;
            return;
        }

        const surahLatinName = allSurahInfo[surahNumber].surah_name;
        const historyArr = asbabData.history;
        const individualVerses = asbabData.verses;

        // 3. Buat Kontainer Utama
        const verseItemContainer = document.createElement('div');
        verseItemContainer.className = 'verse-item';
        let contentHTML = '';

        // 4. Buat Header
        contentHTML += `
            <div class="verse-header">
                <div class="verse-title">Surah ${surahLatinName}: Ayat ${verseKey}</div>
                <button class="share-btn">Share</button>
            </div>
        `;

        // 5. (LOGIKA BARU) Cek apakah data terpisah atau gabungan
        let individualAyahsHTML = '';
        
        if (Array.isArray(individualVerses) && individualVerses.length > 0) {
            // --- KASUS A: DATA TERPISAH (FORMAT BARU) ---
            individualVerses.forEach(verseData => {
                const { ayah, arabicText, translationText, wordByWord } = verseData;

                let wbwHTML = '<p class="no-history">Terjemahan per kata tidak tersedia.</p>';
                if (Array.isArray(wordByWord) && wordByWord.length > 0) {
                    wbwHTML = wordByWord.map(word => {
                        const translation = word.translation ? `<div class="translation-word">${word.translation}</div>` : '';
                        const waqafClass = !word.translation ? ' waqaf-sign' : '';
                        
                        return `
                            <div class="word-group${waqafClass}">
                                <div class="arabic-word">${word.arab}</div>
                                ${translation}
                            </div>
                        `;
                    }).join('');
                }

                individualAyahsHTML += `
                    <div class="verse-block-individual">
                        <h4 class="individual-ayah-title">Ayat ${ayah}</h4>
                        
                        <div class="word-by-word-container">${wbwHTML}</div>
                        
                        <div class="arabic-full-container">
                            ${arabicText} <span class="verse-number-badge">(${ayah})</span>
                        </div>

                        <div class="verse-translation">
                            <b>Artinya (Ayat ${ayah}):</b> "${translationText}"
                        </div>
                    </div>
                    <hr class="ayah-divider">
                `;
            });
            if (individualAyahsHTML.endsWith('<hr class="ayah-divider">')) {
                individualAyahsHTML = individualAyahsHTML.substring(0, individualAyahsHTML.lastIndexOf('<hr class="ayah-divider">'));
            }

        } else {
            // --- KASUS B: DATA GABUNGAN (FORMAT LAMA / FALLBACK) ---
            const { arabicText, translationText, wordByWord } = asbabData;
            
            let wbwHTML = '<p class="no-history">Terjemahan per kata tidak tersedia.</p>';
            if (Array.isArray(wordByWord) && wordByWord.length > 0) {
                wbwHTML = wordByWord.map(word => {
                    const translation = word.translation ? `<div class="translation-word">${word.translation}</div>` : '';
                    const waqafClass = !word.translation ? ' waqaf-sign' : '';
                    return `
                        <div class="word-group${waqafClass}">
                            <div class="arabic-word">${word.arab}</div>
                            ${translation}
                        </div>
                    `;
                }).join('');
            }

            individualAyahsHTML = `
                <div class="verse-block-individual">
                    <p><i>(Data untuk rentang ayat ini digabung)</i></p>
                    <div class="word-by-word-container">${wbwHTML}</div>
                    <div class="arabic-full-container">
                        ${arabicText} <span class="verse-number-badge">(${verseKey})</span>
                    </div>
                    <div class="verse-translation">
                        <b>Artinya (Ayat ${verseKey}):</b> "${translationText}"
                    </div>
                </div>
            `;
        }


        // 6. Buat Riwayat Asbabun Nuzul
        let historyHTML = '<p class="no-history">Tidak ada riwayat asbabun nuzul untuk ayat ini.</p>';
        if (historyArr && Array.isArray(historyArr) && historyArr.length > 0) {
            historyHTML = historyArr.map(riwayat => {
                const formattedRiwayat = String(riwayat)
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return `<p class="riwayat-item">${formattedRiwayat}</p>`;
            }).join('');
        }

        // 7. Gabungkan semua bagian
        contentHTML += individualAyahsHTML; 
        contentHTML += `
            <div class="asbabun-nuzul">
                <h4>Asbabun Nuzul (untuk Ayat ${verseKey})</h4>
                ${historyHTML}
            </div>
        `;
        
        // 8. Tambahkan placeholder untuk Giscus
        if (typeof ENABLE_COMMENTS !== 'undefined' && ENABLE_COMMENTS === true) {
            contentHTML += `
                <div class="comments-section">
                    <hr>
                    <h3>Diskusi untuk Ayat ${verseKey}</h3>
                    <p>Silakan gunakan kolom diskusi di bawah ini. Harap menjaga adab dan etika dalam berdiskusi.</p>
                    <div id="giscus-comment-thread"></div>
                </div>
            `;
        }

        // 9. Masukkan ke DOM
        verseItemContainer.innerHTML = contentHTML;
        verseContentAreaEl.appendChild(verseItemContainer);


        // 10. Muat Giscus secara dinamis
        if (typeof ENABLE_COMMENTS !== 'undefined' && ENABLE_COMMENTS === true) {
            const giscusContainer = verseItemContainer.querySelector('#giscus-comment-thread');
            
            if (giscusContainer) {
                const giscusScript = document.createElement('script');
                giscusScript.src = "https://giscus.app/client.js";
                giscusScript.setAttribute("data-repo", "cinvisualcorp/Asbabun-Nuzul-DISKUSI");
                giscusScript.setAttribute("data-repo-id", "R_kgDOQU9gcg");
                giscusScript.setAttribute("data-category", "General");
                giscusScript.setAttribute("data-category-id", "DIC_kwDOQU9gcs4CxwLB");
                giscusScript.setAttribute("data-mapping", "specific");
                
                const giscusTerm = `Diskusi: ${surahLatinName} Ayat ${verseKey}`;
                giscusScript.setAttribute("data-term", giscusTerm);
                
                giscusScript.setAttribute("data-strict", "0");
                giscusScript.setAttribute("data-reactions-enabled", "1");
                giscusScript.setAttribute("data-emit-metadata", "1");
                giscusScript.setAttribute("data-input-position", "top");
                
                const websiteTheme = localStorage.getItem('theme') || 'light';
                const giscusTheme = websiteTheme === 'dark' ? 'dark' : 'light';
                giscusScript.setAttribute("data-theme", giscusTheme);
                
                giscusScript.setAttribute("data-lang", "id");
                giscusScript.setAttribute("crossorigin", "anonymous");
                giscusScript.async = true;
                
                giscusContainer.appendChild(giscusScript);
            }
        }

        // 11. Tambahkan Event Listener ke Tombol Share
        const shareButton = verseItemContainer.querySelector('.share-btn');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                const firstAyah = String(verseKey).split('-')[0].split(',')[0];
                handleShare(surahNumber, firstAyah, surahLatinName);
            });
        }
        
        updateURL(surahNumber, verseKey);
    };

    // --- Fungsi Cek URL Parameter (Deep Linking) ---
    const checkURLParams = () => {
        const params = new URLSearchParams(window.location.search);
        const surahNum = parseInt(params.get('surah'), 10);
        const ayahNum = parseInt(params.get('ayat'), 10);

        if (surahNum && ayahNum && allSurahInfo[surahNum]) {
            const ayahKey = findAsbabKeyForAyah(surahNum, ayahNum);
            if (ayahKey) {
                showVersePage(surahNum, ayahKey);
                return true;
            } else {
                showVersePage(surahNum); 
                return true;
            }
        } else if (surahNum && allSurahInfo[surahNum]) {
            showVersePage(surahNum);
            return true;
        }
        return false;
    };

    // --- Fungsi Update URL ---
    function updateURL(surahNumber, verseKey = null) {
        const params = new URLSearchParams();
        params.set('surah', surahNumber);
        
        if (verseKey) {
            const firstAyah = String(verseKey).split('-')[0].split(',')[0];
            params.set('ayat', firstAyah);
        }
        
        history.replaceState(null, '', `?${params.toString()}`);
    }


    // --- Fungsi untuk Mengatur Event Listener Global ---
    function setupEventListeners() {
        // Tombol Kembali
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            verseDetailsPageEl.classList.add('hidden');
            surahListEl.classList.remove('hidden');
            mainTitleEl.classList.remove('hidden');
            history.pushState(null, '', window.location.pathname);
        });

        // Tombol Tema
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = bodyEl.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);

            const giscusIframe = document.querySelector('iframe.giscus-frame');
            if (giscusIframe) {
                const giscusTheme = newTheme === 'dark' ? 'dark' : 'light';
                giscusIframe.contentWindow.postMessage(
                    { giscus: { setConfig: { theme: giscusTheme } } },
                    'https://giscus.app'
                );
            }
        });
        
        // Handle navigasi back/forward browser
        window.addEventListener('popstate', () => {
            if (!checkURLParams()) {
                verseDetailsPageEl.classList.add('hidden');
                surahListEl.classList.remove('hidden');
                mainTitleEl.classList.remove('hidden');
            }
        });
    }

    // --- Logika Mode Terang/Gelap (Helper) ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            bodyEl.classList.add('dark-mode');
            if (moonIcon) moonIcon.style.display = 'none'; 
            if (sunIcon) sunIcon.style.display = 'block';
        } else {
            bodyEl.classList.remove('dark-mode');
            if (moonIcon) moonIcon.style.display = 'block';
            if (sunIcon) sunIcon.style.display = 'none';
        }
    };

    // --- Inisialisasi Aplikasi ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Mulai aplikasi
    initializeApp();
});
