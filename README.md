# Apps Kaiser · Rekod Kerja & Tuntutan (Fasa 1)

Satu PWA untuk Kaiser Engineering Sdn. Bhd.:
- **Apps Pekerja** (penyelia, telefon): masuk/keluar kerja, laporan kerja dengan gambar, resit belian, arahan kerja tambahan (VO), rekod saya.
- **Apps Pentadbiran** (pengurus, pengarah, akaun): dashboard, peti semakan (sahkan / kembalikan / lulus akhir), pantauan skop kerja (8 skop), daftar VO, kod kerja, tunai runcit, eksport CSV bulanan, tetapan & pengguna.

## Mod
- **Awan (Firebase):** bila dibuka di laman https (GitHub Pages), apps guna projek Firebase `kaiser-engineering-5d507`: log masuk emel ikut peranan, Firestore untuk semua rekod, gambar sebagai dokumen berasingan (`gambar`), boleh diisi tanpa internet.
- **Demo:** jika SDK Firebase tidak dapat dimuatkan, apps guna data contoh dalam pelayar.

## Persediaan Firebase (sekali sahaja)
1. Authentication → Get started → hidupkan Email/Password.
2. Firestore Database → Create database → asia-southeast1 (Singapore) → production mode.
3. Firestore Database → Rules → tampal kandungan `firestore.rules` → Publish.
4. Authentication → Settings → Authorized domains → tambah domain GitHub Pages.
5. Authentication → Users → Add user (emel Pengarah). Log masuk ke apps dengan akaun ini; skrin "Sediakan sistem" menjadikannya Pengarah. Pengguna lain ditambah oleh Pengarah dalam Tetapan.

## Jalankan
Fail statik sahaja, tiada build. Letak folder ini di GitHub Pages (contoh: `kaiser/`) atau mana-mana pelayan https.
Untuk uji di komputer: `python3 -m http.server` dalam folder ini, buka http://localhost:8000.

## Fail
- `index.html`, `styles.css`, `app.js` – apps
- `firebase-config.js` – konfigurasi projek Firebase
- `firestore.rules` – peraturan keselamatan (tampal ke Firebase console)
- `manifest.json`, `sw.js`, `icon-*.png` – pasang di skrin utama telefon dan guna luar talian
