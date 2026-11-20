# Apps Kaiser · Rekod Kerja & Tuntutan (Fasa 1)

Dua apps untuk Kaiser Engineering Sdn. Bhd., satu kod dan satu pangkalan data:
- **Kaiser Pengurusan** (emel + kata laluan): https://alamhayyat20-collab.github.io/kaiser-apps/
- **Kaiser Pekerja** (ID pekerja + PIN 6 digit, dipasang di telefon): https://alamhayyat20-collab.github.io/kaiser-apps/pekerja/
- **Apps Pekerja** (pekerja & penyelia, telefon): kehadiran bergambar (swafoto + lokasi + masa pelayan), laporan kerja bergambar, permohonan cuti (baki ikut Akta Kerja 1955), tuntutan, petty cash, pendahuluan gaji; penyelia juga: resit belian dan arahan kerja tambahan (VO).
- **Apps Pentadbiran** (pengurus, pengarah, akaun): dashboard, kehadiran harian, permohonan staf (lulus / tolak / bayar / jelaskan), ringkasan gaji CSV, peti semakan (sahkan / kembalikan / lulus akhir), pantauan skop kerja (8 skop), daftar VO, kod kerja, tunai runcit, eksport CSV bulanan, tetapan & pengguna.

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
