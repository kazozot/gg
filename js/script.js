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

    // --- [KODE BARU] Elemen DOM untuk Modal Copy ---
    const modalBackdrop = document.getElementById('copy-modal-backdrop');
    const modalContent = document.getElementById('copy-modal-content');
    const modalTitle = document.getElementById('copy-modal-title');
    const modalCloseBtn = document.getElementById('copy-modal-close');
    const modalConfirmBtn = document.getElementById('copy-modal-confirm');
    let currentCopyListener = null; // Untuk menyimpan listener tombol konfirmasi
    // --- [AKHIR KODE BARU] ---


    // --- [MODIFIKASI BARU] Variabel untuk Tafsir ---
    // TAFSIR_SOURCES dan DEFAULT_TAFSIR diambil dari config.js
    let currentTafsirId = DEFAULT_TAFSIR; // Akan di-override oleh localStorage di initializeApp
    // --- [AKHIR MODIFIKASI] ---

    // --- Variabel Global untuk Data ---
    // const allSurahInfo -> dari surah-info-data.js
    // const allAyahMeta  -> dari quran-metadata.js
    // const DB           -> dari asbabun-nuzul-data.js
    // const ENABLE_COMMENTS -> dari config.js
    // const ENABLE_ADS -> dari config.js (BARU)
    // const TAFSIR_KEMENAG, TAFSIR_JALALAYN, dll -> dari js/data/
    
    let ayahCounts = {}; // Cache untuk jumlah ayat per surah
    let asbabDataMap = new Map(); // Peta untuk mencari Asbabun Nuzul by key "surah-verseKey"
    let asbabDataBySurah = new Map(); // Peta untuk mencari Asbabun Nuzul by surahNum
    let surahArabicNameMap = new Map(); 

    // --- Fungsi Inisialisasi Aplikasi ---
    function initializeApp() {
        processData();

        // Terapkan mode tampilan (view mode) saat aplikasi dimuat
        applyViewMode(localStorage.getItem('viewMode') || 'wbw'); 

        // --- [MODIFIKASI BARU] Muat Tafsir pilihan ---
        currentTafsirId = localStorage.getItem('currentTafsir') || DEFAULT_TAFSIR;
        // --- [AKHIR MODIFIKASI] ---

        const isDeepLink = checkURLParams(); 
        if (!isDeepLink) {
            displaySurahList();
        }
        setupEventListeners();
    }

    // --- Fungsi untuk memproses data mentah menjadi cache ---
    function processData() {
        // 1. Hitung jumlah ayat (dari quran-ayahs-data.js)
        for (const [verseKey, ayahData] of Object.entries(allAyahMeta)) {
            const surahNum = ayahData.surah_number;
            if (!ayahCounts[surahNum]) {
                ayahCounts[surahNum] = 0;
            }
            ayahCounts[surahNum]++;
        }
        
        // 2. Buat Peta (Map) untuk data Asbabun Nuzul (dari asbabun-nuzul-data.js)
        DB.forEach(item => {
            const surahNum = item.surahNumber;
            const verseKey = String(item.verseNumber); // "2", "1-8", "10-13"
            
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
        surahListEl.innerHTML = '';
        
        // [IKLAN BARU] Panggil fungsi injeksi untuk iklan Halaman Utama
        // Kita panggil fungsi dari ad-injector.js
        if (typeof injectAd === 'function') {
            injectAd('#ad-placeholder-home-top', getBannerAdHTML());
            injectAd('#ad-placeholder-home-bottom', getNativeAdHTML());
        }
        // [AKHIR IKLAN BARU]

        // Menggunakan allSurahInfo sebagai basis untuk 114 surah
        Object.keys(allSurahInfo).sort((a, b) => parseInt(a) - parseInt(b)).forEach(surahKey => {
            const surahNumber = parseInt(surahKey);
            const meta = allSurahInfo[surahNumber];
            const totalAyahs = ayahCounts[surahNumber] || 0; // Ambil total ayat dari cache
            const arabicName = surahArabicNameMap.get(surahNumber) || meta.surah_name; // Ambil nama Arab dari DB jika ada
            const hasAsbab = asbabDataBySurah.has(surahNumber); // Cek apakah ada data di DB

            const card = document.createElement('div');
            card.className = `surah-card ${hasAsbab ? 'has-asbab' : ''}`;
            card.dataset.surah = surahNumber;
            
            card.innerHTML = `
                <div class="surah-header">
                    <div class="surah-number">${surahNumber}</div>
                    <div class="surah-info">
                        <h3>${meta.surah_name}</h3>
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
        
        // [IKLAN BARU] Panggil fungsi injeksi untuk iklan Halaman Ayat (Statis)
        if (typeof injectAd === 'function') {
            injectAd('#ad-placeholder-ayat-before-info', getBannerAdHTML());
            injectAd('#ad-placeholder-ayat-after-info', getBannerAdHTML());
        }
        // [AKHIR IKLAN BARU]

        const surahInfo = allSurahInfo[surahNumber];
        const totalAyahs = ayahCounts[surahNumber];
        const arabicName = surahArabicNameMap.get(surahNumber) || surahInfo.surah_name;
        const ayahEntries = asbabDataBySurah.get(surahNumber);

        // 1. Tampilkan Info Surah
        const infoHTML = surahInfo.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        surahInfoBoxEl.innerHTML = `<h2>${surahInfo.surah_name}</h2>${infoHTML}`;

        // --- [MODIFIKASI BARU] Buat HTML untuk Pilihan Tafsir ---
        let tafsirOptionsHTML = '';
        if (typeof TAFSIR_SOURCES !== 'undefined') {
            for (const [id, tafsir] of Object.entries(TAFSIR_SOURCES)) {
                tafsirOptionsHTML += `<option value="${id}">${tafsir.name}</option>`;
            }
        }
        // --- [AKHIR MODIFIKASI] ---

        // 2. Buat Sidebar [MODIFIKASI: Menambahkan dropdown tafsir]
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

            <div class="tafsir-toggle-sidebar">
                <p>Pilih Tafsir:</p>
                <select id="tafsir-select">
                    ${tafsirOptionsHTML}
                </select>
            </div>
            <div id="verse-list-items"></div>
        `;

        // --- [MODIFIKASI BARU] Set value dropdown & tambahkan listener ---
        const tafsirSelectEl = document.getElementById('tafsir-select');
        if (tafsirSelectEl) {
            tafsirSelectEl.value = currentTafsirId;
            tafsirSelectEl.addEventListener('change', (e) => {
                currentTafsirId = e.target.value;
                localStorage.setItem('currentTafsir', currentTafsirId);
                
                // Muat ulang konten ayat yang sedang aktif
                const activeVerseBtn = verseListSidebarEl.querySelector('.verse-list-item.active');
                if (activeVerseBtn) {
                    displaySingleVerse(surahNumber, activeVerseBtn.dataset.versekey);
                }
            });
        }
        // --- [AKHIR MODIFIKASI] ---

        // Panggil fungsi untuk setup listener tombol mode
        setupModeToggleListeners();
        // Terapkan mode yang tersimpan saat sidebar dibuat
        applyViewMode(localStorage.getItem('viewMode') || 'wbw');

        const verseListItemsContainer = verseListSidebarEl.querySelector('#verse-list-items');

        if (ayahEntries && ayahEntries.length > 0) {
            // --- KASUS 1: SURAH MEMILIKI ASBABUN NUZUL ---
            verseListSidebarEl.classList.remove('sidebar-empty');
            
            // 3. Sortir ayat
            ayahEntries.sort((a, b) => getSortableVerseNum(a.verseNumber) - getSortableVerseNum(b.verseNumber));

            // 4. Isi daftar ayat di sidebar HANYA dengan ayat yg ada riwayat
            let verseListHTML = '';
            ayahEntries.forEach(item => {
                const verseKey = String(item.verseNumber); // "2" atau "1-8"
                const hasHistory = Array.isArray(item.history) && item.history.length > 0;
                const asbabClass = hasHistory ? 'has-asbab' : '';
                verseListHTML += `<button class="verse-list-item ${asbabClass}" data-versekey="${verseKey}">Ayat ${verseKey}</button>`;
            });
            verseListItemsContainer.innerHTML = verseListHTML;

            // 5. Tambahkan event listener ke setiap tombol ayat
            verseListItemsContainer.querySelectorAll('.verse-list-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    displaySingleVerse(surahNumber, btn.dataset.versekey);
                });
            });

            // 6. Tampilkan placeholder atau ayat awal (jika dari deep link)
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


    // --- [FUNGSI BARU] Helper untuk memproses teks tafsir & footnote ---
    /**
     * Memproses entri tafsir untuk memisahkan teks utama dan catatan kaki.
     * @param {object} tafsirEntry - Objek dari TAFSIR_KEMENAG[key], misal {t: "...", f: {...}}
     * @returns {object} - Objek {main: "teks utama", notes: "html catatan kaki"}
     */
    function processTafsirText(tafsirEntry) {
        if (!tafsirEntry || !tafsirEntry.t) {
            return { main: "<i>Tafsir tidak ditemukan.</i>", notes: "" };
        }

        let mainText = tafsirEntry.t;
        const footnotes = tafsirEntry.f || {};
        let footnoteStrings = [];
        let footnoteCounter = 0;

        // Regex untuk mencari tag <sup foot_note="xxxxx">...</sup>
        const supRegex = /<sup foot_note="(\d+)">.*?<\/sup>/g;

        mainText = mainText.replace(supRegex, (match, footNoteId) => {
            footnoteCounter++;
            const footnoteText = footnotes[footNoteId];
            if (footnoteText) {
                // Tambahkan ke array untuk ditampilkan di bawah
                footnoteStrings.push(`<sup>[${footnoteCounter}]</sup> ${footnoteText}`);
            }
            // Ganti tag di teks utama dengan nomor
            return `<sup>[${footnoteCounter}]</sup>`;
        });

        // Gabungkan semua footnote
        const notesHTML = footnoteStrings.join('<br>');

        return {
            main: mainText,
            notes: notesHTML
        };
    }
    // --- [AKHIR FUNGSI BARU] ---


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
            // Default ke 'wbw' (word-by-word)
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
        // Dibuat kosong karena logika dipindah ke setupModeToggleListeners() 
        // dan dipanggil dari showVersePage() agar elemennya pasti ada.
    }


    // --- [KODE BARU] Fungsi untuk Modal Copy ---
    function openCopyModal(surahNumber, verseKey, surahLatinName, asbabData) {
        modalTitle.textContent = `Copy: ${surahLatinName} Ayat ${verseKey}`;
        
        // Hapus listener lama jika ada (penting!)
        if (currentCopyListener) {
            modalConfirmBtn.removeEventListener('click', currentCopyListener);
        }
        
        // Buat listener baru dengan data yang relevan
        currentCopyListener = () => {
            handleConfirmCopy(surahNumber, verseKey, surahLatinName, asbabData);
        };
        
        // Tambahkan listener baru
        modalConfirmBtn.addEventListener('click', currentCopyListener);
        
        // Tampilkan modal
        modalBackdrop.classList.remove('hidden');
        modalContent.classList.remove('hidden');
    }

    function closeCopyModal() {
        modalBackdrop.classList.add('hidden');
        modalContent.classList.add('hidden');
        // Hapus listener setelah ditutup
        if (currentCopyListener) {
            modalConfirmBtn.removeEventListener('click', currentCopyListener);
            currentCopyListener = null;
        }
    }

    async function handleConfirmCopy(surahNumber, verseKey, surahLatinName, asbabData) {
        // 1. Dapatkan Opsi dari Modal
        const includeArabicFull = document.getElementById('copy-arabic-full').checked;
        const includeWbW = document.getElementById('copy-wbw').checked;
        const includeSelectedTafsir = document.getElementById('copy-selected-tafsir').checked;
        const includeAllTafsirs = document.getElementById('copy-all-tafsirs').checked;
        const includeAsbab = document.getElementById('copy-asbab').checked;

        let parts = []; // Array untuk menampung semua bagian teks
        parts.push(`Bismillāhir-raḥmānin-raḥīm`);
        parts.push(`Q.S. ${surahNumber} (${surahLatinName}): Ayat ${verseKey}`);
        parts.push('----');

        const individualVerses = asbabData.verses;

        // 2. Proses Setiap Ayat (jika format baru)
        if (Array.isArray(individualVerses) && individualVerses.length > 0) {
            individualVerses.forEach(verseData => {
                const { ayah, arabicText, wordByWord } = verseData;
                parts.push(`\n[ AYAT ${ayah} ]\n`);

                // 3. Tambahkan Teks Arab
                if (includeArabicFull) {
                    const cleanArabic = arabicText.replace(/<[^>]+>/g, ''); // Hapus HTML
                    parts.push(`${cleanArabic.trim()} (${ayah})\n`);
                } else if (includeWbW) {
                    let wbwText = 'Teks Per Kata:\n';
                    if (Array.isArray(wordByWord) && wordByWord.length > 0) {
                        wordByWord.forEach(word => {
                            if (word.translation) { // Hanya tambahkan jika ada terjemahan
                                wbwText += `${word.arab} : ${word.translation}\n`;
                            }
                        });
                    } else {
                        wbText += '(Per kata tidak tersedia)\n';
                    }
                    parts.push(wbwText);
                }

                // 4. Tambahkan Terjemahan/Tafsir
                if (includeAllTafsirs) {
                    parts.push('\n--- SEMUA TAFSIR ---');
                    for (const [id, source] of Object.entries(TAFSIR_SOURCES)) {
                        const tafsirData = source.data;
                        const tafsirName = source.name;
                        const tafsirKey = `${surahNumber}:${ayah}`;
                        parts.push(`\n[${tafsirName}]`);
                        
                        if (tafsirData && tafsirData[tafsirKey]) {
                            const processed = processTafsirText(tafsirData[tafsirKey]);
                            // Hapus semua tag HTML untuk copy plain text
                            let main = processed.main.replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ').trim();
                            let notes = processed.notes.replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ').trim();
                            parts.push(main);
                            if (notes) {
                                parts.push(`\nCatatan: ${notes}`);
                            }
                        } else {
                            parts.push('(Tafsir tidak ditemukan.)');
                        }
                    }
                } else if (includeSelectedTafsir) {
                    const activeTafsirSource = TAFSIR_SOURCES[currentTafsirId];
                    const tafsirData = activeTafsirSource.data;
                    const tafsirName = activeTafsirSource.name;
                    const tafsirKey = `${surahNumber}:${ayah}`;
                    parts.push(`\n--- TAFSIR TERPILIH (${tafsirName}) ---`);
                    
                    if (tafsirData && tafsirData[tafsirKey]) {
                        const processed = processTafsirText(tafsirData[tafsirKey]);
                        let main = processed.main.replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ').trim();
                        let notes = processed.notes.replace(/<[^>]+>/g, ' ').replace(/ +/g, ' ').trim();
                        parts.push(main);
                        if (notes) {
                            parts.push(`\nCatatan: ${notes}`);
                        }
                    } else {
                        parts.push('(Tafsir tidak ditemukan.)');
                    }
                }
            }); // Akhir loop forEach verse
        } else {
            // Fallback untuk format data lama (jika diperlukan)
             parts.push("\n(Data ayat menggunakan format gabungan, salin manual dari halaman)");
        }

        // 5. Tambahkan Asbabun Nuzul
        if (includeAsbab) {
            parts.push(`\n----\nASBABUN NUZUL (untuk Ayat ${verseKey})\n----`);
            const historyArr = asbabData.history;
            if (historyArr && Array.isArray(historyArr) && historyArr.length > 0) {
                historyArr.forEach(riwayat => {
                    const cleanRiwayat = riwayat
                        .replace(/\*\*(.*?)\*\*/g, '$1') // Hapus markdown bold
                        .replace(/<br>/g, '\n'); // Ganti <br> dengan newline
                    parts.push(cleanRiwayat + '\n');
                });
            } else {
                parts.push('(Tidak ada riwayat asbabun nuzul.)');
            }
        }

        // 6. Tambahkan Atribusi
        const siteName = document.querySelector('.nav-brand').textContent.trim();
        const siteUrl = window.location.origin + window.location.pathname;
        const attribution = `\n\n----\ndapatkan asbabun nuzul hanya di ${siteName} ${siteUrl}`;
        parts.push(attribution);

        // 7. Salin ke Clipboard
        try {
            await navigator.clipboard.writeText(parts.join('\n'));
            showClipboardNotification('Teks telah disalin!');
        } catch (err) {
            console.error('Gagal menyalin:', err);
            showClipboardNotification('Gagal menyalin teks.');
        }

        // 8. Tutup Modal
        closeCopyModal();
    }
    // --- [AKHIR KODE BARU] ---


    // --- [FUNGSI MODIFIKASI BESAR] ---
    // Fungsi ini diubah untuk mengambil terjemahan dari sumber data tafsir yang dipilih
    // dan memproses catatan kaki.
    const displaySingleVerse = (surahNumber, verseKey) => {
        
        verseContentAreaEl.innerHTML = ''; // Kosongkan area konten

        // 1. Set tombol aktif di sidebar
        verseListSidebarEl.querySelectorAll('.verse-list-item').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = verseListSidebarEl.querySelector(`.verse-list-item[data-versekey='${verseKey}']`);
        if(activeBtn) {
            activeBtn.classList.add('active');
            // Scroll tombol aktif ke tengah sidebar jika perlu
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // 2. Dapatkan data Asbabun Nuzul
        const asbabData = asbabDataMap.get(`${surahNumber}-${verseKey}`);
        
        if (!asbabData) {
            verseContentAreaEl.innerHTML = `<p>Error: Data untuk S.${surahNumber} A.${verseKey} tidak ditemukan.</p>`;
            return;
        }

        const surahLatinName = allSurahInfo[surahNumber].surah_name;
        // Ambil riwayat dari level atas
        const historyArr = asbabData.history;
        // Ambil array verses (DATA BARU)
        const individualVerses = asbabData.verses;

        // 3. Buat Kontainer Utama
        const verseItemContainer = document.createElement('div');
        verseItemContainer.className = 'verse-item';
        let contentHTML = '';

        // 4. [MODIFIKASI] Buat Header (dengan tombol Share & Copy)
        contentHTML += `
            <div class="verse-header">
                <div class="verse-title">Surah ${surahLatinName}: Ayat ${verseKey}</div>
                <div class="header-buttons">
                    <button class="share-btn">Share Link</button>
                    <button class="copy-btn">Copy Teks</button>
                </div>
            </div>
        `;
        // --- [AKHIR MODIFIKASI] ---

        // 5. (LOGIKA BARU) Cek apakah data terpisah atau gabungan
        let individualAyahsHTML = '';

        // --- [MODIFIKASI BARU] Dapatkan data tafsir yang aktif ---
        const activeTafsirSource = (typeof TAFSIR_SOURCES !== 'undefined' && TAFSIR_SOURCES[currentTafsirId]) 
            ? TAFSIR_SOURCES[currentTafsirId] 
            : null;
        const tafsirData = activeTafsirSource ? activeTafsirSource.data : null;
        // Ambil nama dari config (karena sudah diubah di sana)
        const tafsirName = activeTafsirSource ? activeTafsirSource.name : "Tafsir";
        // --- [AKHIR MODIFIKASI] ---
        
        if (Array.isArray(individualVerses) && individualVerses.length > 0) {
            // --- KASUS A: DATA TERPISAH (FORMAT BARU) ---
            // Loop melalui setiap ayat di dalam "verses"
            individualVerses.forEach(verseData => {
                const { ayah, arabicText, wordByWord } = verseData; // Hapus translationText bawaan

                // --- [MODIFIKASI BARU] Ambil Teks Tafsir ---
                const tafsirKey = `${surahNumber}:${ayah}`;
                let translationHTML = '';
                let footnotesHTML = '';

                if (tafsirData && tafsirData[tafsirKey]) {
                    const tafsirEntry = tafsirData[tafsirKey];
                    const processedTafsir = processTafsirText(tafsirEntry); // Panggil helper baru
                    
                    translationHTML = processedTafsir.main;
                    if (processedTafsir.notes) {
                        footnotesHTML = `<div class="verse-footnotes"><h4>Catatan Tafsir:</h4>${processedTafsir.notes}</div>`;
                    }
                } else {
                    // Fallback jika tafsir tidak ditemukan
                    translationHTML = `<i>Tafsir (${tafsirName}) untuk ayat ${ayah} tidak ditemukan.</i>`;
                    // Coba fallback ke terjemahan default jika ada
                    if (verseData.translationText) {
                         translationHTML += `<br><br><b>Terjemahan Bawaan:</b> "${verseData.translationText}"`;
                    }
                }
                // --- [AKHIR MODIFIKASI] ---


                // Buat HTML Word-by-Word
                let wbwHTML = '<p class="no-history">Terjemahan per kata tidak tersedia.</p>';
                if (Array.isArray(wordByWord) && wordByWord.length > 0) {
                    wbwHTML = wordByWord.map(word => {
                        const translation = word.translation ? `<div class="translation-word">${word.translation}</div>` : '';
                        // Tambahkan kelas khusus untuk tanda waqaf (jika tidak ada terjemahan)
                        const waqafClass = !word.translation ? ' waqaf-sign' : '';
                        
                        return `
                            <div class="word-group${waqafClass}">
                                <div class="arabic-word">${word.arab}</div>
                                ${translation}
                            </div>
                        `;
                    }).join('');
                }

                // --- Gabungkan HTML untuk SATU ayat ini ---
                individualAyahsHTML += `
                    <div class="verse-block-individual">
                        <h4 class="individual-ayah-title">Ayat ${ayah}</h4>
                        
                        <div class="word-by-word-container">${wbwHTML}</div>
                        
                        <div class="arabic-full-container">
                            ${arabicText} <span class="verse-number-badge">(${ayah})</span>
                        </div>

                        <div class="verse-translation">
                            <b>Artinya (Tafsir ${tafsirName} Ayat ${ayah}):</b>
                            <div class="tafsir-text">${translationHTML}</div>
                        </div>
                        ${footnotesHTML}
                        </div>
                    <hr class="ayah-divider">
                `;
            });
            // Hapus <hr> terakhir
            if (individualAyahsHTML.endsWith('<hr class="ayah-divider">')) {
                individualAyahsHTML = individualAyahsHTML.substring(0, individualAyahsHTML.lastIndexOf('<hr class="ayah-divider">'));
            }

        } else {
            // --- KASUS B: DATA GABUNGAN (FORMAT LAMA / FALLBACK) ---
            const { arabicText, translationText, wordByWord } = asbabData;
            
            // --- [MODIFIKASI BARU] Coba cari tafsir untuk *ayat pertama* dari rentang ---
            const firstAyahInKey = String(verseKey).split('-')[0].split(',')[0];
            const tafsirKey = `${surahNumber}:${firstAyahInKey}`;
            let translationHTML = '';
            let footnotesHTML = '';

            if (tafsirData && tafsirData[tafsirKey]) {
                // Hanya tampilkan tafsir untuk ayat pertama dari rentang
                const tafsirEntry = tafsirData[tafsirKey];
                const processedTafsir = processTafsirText(tafsirEntry);
                
                translationHTML = `<b>Artinya (Tafsir ${tafsirName} Ayat ${firstAyahInKey}):</b><div class="tafsir-text">${processedTafsir.main}</div>`;
                if (processedTafsir.notes) {
                    footnotesHTML = `<div class="verse-footnotes"><h4>Catatan Tafsir:</h4>${processedTafsir.notes}</div>`;
                }
                // Tambahkan fallback ke terjemahan gabungan
                translationHTML += `<br><br><b>Terjemahan Bawaan (Gabungan Ayat ${verseKey}):</b> "${translationText}"`;
            } else {
                // Fallback penuh ke data lama (terjemahan bawaan)
                translationHTML = `<b>Artinya (Ayat ${verseKey}):</b> "${translationText}"`;
            }
            // --- [AKHIR MODIFIKASI] ---

            
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
                        ${translationHTML}
                    </div>
                    ${footnotesHTML}
                    </div>
            `;
        }


        // 6. Buat Riwayat Asbabun Nuzul (di paling bawah)
        let historyHTML = '<p class="no-history">Tidak ada riwayat asbabun nuzul untuk ayat ini.</p>';
        if (historyArr && Array.isArray(historyArr) && historyArr.length > 0) {
            historyHTML = historyArr.map(riwayat => {
                // Format teks: ganti \n dengan <br> dan **teks** dengan <strong>teks</strong>
                const formattedRiwayat = String(riwayat)
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return `<p class="riwayat-item">${formattedRiwayat}</p>`;
            }).join('');
        }

        // 7. Gabungkan semua bagian: Header + (Loop Ayat) + IKLAN + Riwayat
        contentHTML += individualAyahsHTML; // Tambahkan hasil loop
        
        // [IKLAN BARU] Tambahkan placeholder untuk Iklan Banner 4 (Setelah Arti)
        // ID ini harus unik untuk setiap pemanggilan fungsi
        const adPlaceholderMeaningId = 'ad-placeholder-ayat-after-meaning-' + Date.now();
        contentHTML += `<div id="${adPlaceholderMeaningId}"></div>`;


        contentHTML += `
            <div class="asbabun-nuzul">
                <h4>Asbabun Nuzul (untuk Ayat ${verseKey})</h4>
                ${historyHTML}
            </div>
        `;
        
        // [IKLAN BARU] Tambahkan placeholder untuk Iklan Native 2 (Setelah Asbab)
        const adPlaceholderAsbabId = 'ad-placeholder-ayat-after-asbab-' + Date.now();
        contentHTML += `<div id="${adPlaceholderAsbabId}"></div>`;

        
        // 8. Tambahkan placeholder untuk Giscus HANYA JIKA diaktifkan di config.js
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

        
        // [IKLAN BARU] Panggil fungsi injeksi untuk iklan dinamis Halaman Ayat
        // Kita panggil SETELAH HTML dimasukkan ke DOM
        if (typeof injectAd === 'function') {
            injectAd(`#${adPlaceholderMeaningId}`, getBannerAdHTML());
            injectAd(`#${adPlaceholderAsbabId}`, getNativeAdHTML());
        }


        // 10. Muat Giscus secara dinamis SETELAH konten dimasukkan ke DOM
        if (typeof ENABLE_COMMENTS !== 'undefined' && ENABLE_COMMENTS === true) {
            const giscusContainer = verseItemContainer.querySelector('#giscus-comment-thread');
            
            if (giscusContainer) {
                // Hapus script giscus lama jika ada (untuk mencegah duplikasi saat ganti tafsir)
                const oldScript = giscusContainer.querySelector('script[src^="https://giscus.app"]');
                if (oldScript) {
                    oldScript.remove();
                }

                // Buat script tag Giscus secara dinamis
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

        // 12. [KODE BARU] Tambahkan Event Listener ke Tombol Copy
        const copyButton = verseItemContainer.querySelector('.copy-btn');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                // Kirim semua data yang relevan ke fungsi modal
                openCopyModal(surahNumber, verseKey, surahLatinName, asbabData);
            });
        }
        
        // Update URL
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
                // Jika ayat ada tapi tak ada riwayat, tetap tampilkan halaman surah
                showVersePage(surahNum); 
                return true;
            }
        } else if (surahNum && allSurahInfo[surahNum]) {
             // Jika hanya ada parameter surah
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
            // Ambil angka ayat pertama untuk URL (cth: dari "6-7" ambil "6")
            const firstAyah = String(verseKey).split('-')[0].split(',')[0];
            params.set('ayat', firstAyah);
        }
        
        // Ganti URL tanpa me-reload halaman
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
            // Hapus parameter dari URL
            history.pushState(null, '', window.location.pathname);

            // [IKLAN BARU] Muat ulang iklan halaman utama saat kembali
            if (typeof injectAd === 'function') {
                injectAd('#ad-placeholder-home-top', getBannerAdHTML());
                injectAd('#ad-placeholder-home-bottom', getNativeAdHTML());
            }
        });

        // Tombol Tema
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = bodyEl.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);

            // Kirim pesan ke Giscus iframe untuk mengubah tema
            const giscusIframe = document.querySelector('iframe.giscus-frame');
            if (giscusIframe) {
                const giscusTheme = newTheme === 'dark' ? 'dark' : 'light';
                giscusIframe.contentWindow.postMessage(
                    { giscus: { setConfig: { theme: giscusTheme } } },
                    'https://giscus.app' // Target origin Giscus
                );
            }
        });
        
        // Handle navigasi back/forward browser
        window.addEventListener('popstate', () => {
            if (!checkURLParams()) {
                // Jika kembali ke state tanpa parameter, tampilkan halaman utama
                verseDetailsPageEl.classList.add('hidden');
                surahListEl.classList.remove('hidden');
                mainTitleEl.classList.remove('hidden');

                // [IKLAN BARU] Muat ulang iklan halaman utama saat kembali
                if (typeof injectAd === 'function') {
                    injectAd('#ad-placeholder-home-top', getBannerAdHTML());
                    injectAd('#ad-placeholder-home-bottom', getNativeAdHTML());
                }
            }
        });

        // --- [KODE BARU] Listener untuk menutup modal copy ---
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeCopyModal);
        }
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeCopyModal);
        }
        // --- [AKHIR KODE BARU] ---
    }

    // --- Logika Mode Terang/Gelap (Helper) ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            bodyEl.classList.add('dark-mode');
            if (moonIcon) moonIcon.style.display = 'none'; // Sembunyikan bulan
            if (sunIcon) sunIcon.style.display = 'block'; // Tampilkan matahari
        } else {
            bodyEl.classList.remove('dark-mode');
            if (moonIcon) moonIcon.style.display = 'block'; // Tampilkan bulan
            if (sunIcon) sunIcon.style.display = 'none'; // Sembunyikan matahari
        }
    };

    // --- Inisialisasi Aplikasi ---
    // Terapkan tema yang tersimpan di localStorage saat memuat
    const savedTheme = localStorage.getItem('theme') || 'light'; // default 'light'
    applyTheme(savedTheme);
    
    // Mulai aplikasi
    initializeApp();
});
