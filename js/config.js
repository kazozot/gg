// --- KONFIGURASI WEBSITE ---

/**
 * [KODE BARU] Kontrol Global untuk Fitur Iklan
 * * Ubah nilai di bawah ini untuk mengaktifkan atau menonaktifkan
 * semua iklan di seluruh website.
 * * - true:  Menampilkan iklan.
 * * - false: Menyembunyikan semua iklan.
 */
const ENABLE_ADS = true;


/**
 * Kontrol Global untuk Fitur Komentar (Giscus)
 * * Ubah nilai di bawah ini untuk mengaktifkan atau menonaktifkan
 * fitur komentar (diskusi) di seluruh website.
 * * - true:  Menampilkan dan mengaktifkan kolom komentar Giscus.
 * - false: Menyembunyikan seluruh bagian kolom komentar.
 */
const ENABLE_COMMENTS = true;


// --- [MODIFIKASI BARU] KONFIGURASI TAFSIR ---

/**
 * Definisikan sumber data tafsir yang tersedia.
 * Kunci (misal 'kemenag') harus unik dan akan disimpan di localStorage.
 * 'name' adalah teks yang akan tampil di dropdown.
 * 'data' adalah nama variabel global yang berisi data tafsir dari file .js-nya.
 */
const TAFSIR_SOURCES = {
    'kemenag': {
        name: "Tafsir Kemenag",
        data: TAFSIR_KEMENAG // Variabel dari js/data/tafsir-kemenag.js
    },
    'jalalayn': {
        name: "Tafsir Jalalayn",
        data: TAFSIR_JALALAYN // Variabel dari js/data/tafsir-jalalayn.js
    },
    'muntakhab': {
        // [MODIFIKASI BARU] Nama diubah
        name: "Tafsir Quraish Shihab", 
        // [AKHIR MODIFIKASI]
        data: TAFSIR_MUNTAKHAB // Variabel dari js/data/tafsir-muntakhab.js
    },
    'sabiq': {
        name: "Tafsir As-Sabiq",
        data: TAFSIR_SABIQ // Variabel dari js/data/tafsir-sabiq.js
    },
    'kingfahd': {
        name: "Tafsir King Fahd",
        data: TAFSIR_KINGFAHD // Variabel dari js/data/tafsir-kingfahd.js
    }
    // Anda bisa tambahkan sumber lain di sini di masa depan
};

/**
 * Tentukan tafsir default yang akan dimuat saat pengguna pertama kali membuka.
 * Gunakan kunci yang sama dari TAFSIR_SOURCES.
 */
const DEFAULT_TAFSIR = 'kemenag';

// --- [AKHIR MODIFIKASI] ---