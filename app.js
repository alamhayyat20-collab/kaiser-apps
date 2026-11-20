/* Kaiser · Rekod Kerja & Tuntutan — Fasa 1 (mod demo)
 * Satu apps, dua paparan: Apps Pekerja (penyelia) dan Apps Pentadbiran (pengurus, pengarah, akaun).
 * Data disimpan dalam pelayar (localStorage). Lapisan `Store` boleh ditukar kepada Firebase kemudian.
 */
(function () {
  'use strict';

  // ---------- Konstan ----------
  const SKOP = [
    { id: 'sivil', nama: 'Kejuruteraan awam (sivil)', pendek: 'Sivil' },
    { id: 'elektrik', nama: 'Kerja elektrik', pendek: 'Elektrik' },
    { id: 'mekanikal', nama: 'Kerja mekanikal', pendek: 'Mekanikal' },
    { id: 'ac', nama: 'Penghawa dingin', pendek: 'AC' },
    { id: 'fabrikasi', nama: 'Fabrikasi & struktur keluli', pendek: 'Fabrikasi' },
    { id: 'cat', nama: 'Pengecatan & sand blasting', pendek: 'Cat / blasting' },
    { id: 'fasiliti', nama: 'Penyelenggaraan fasiliti', pendek: 'Fasiliti' },
    { id: 'tenaga', nama: 'Bekalan tenaga kerja', pendek: 'Tenaga kerja' },
  ];
  const VO_STATUS = ['Sedang dijalankan', 'Menunggu sebut harga', 'Sebut harga dihantar', 'PO diterima', 'Diinvois', 'Dibayar'];
  const PERANAN = { pekerja: 'Pekerja', penyelia: 'Penyelia', pengurus: 'Pengurus', pengarah: 'Pengarah', akaun: 'Akaun' };
  const STATUS_LABEL = { dihantar: 'Dihantar', disahkan: 'Disahkan', diluluskan: 'Diluluskan', dikembalikan: 'Dikembalikan', ditolak: 'Ditolak', dibatalkan: 'Dibatalkan', dibayar: 'Dibayar', dijelaskan: 'Dijelaskan' };
  const DB_KEY = 'kaiser_app_v1';
  const USER_KEY = 'kaiser_app_user';

  // ---------- Utiliti ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const thisMonth = () => today().slice(0, 7);
  const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const monthName = (ym) => `${BULAN[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
  const fmtDate = (d) => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${Number(dd)} ${BULAN[Number(m) - 1].slice(0, 3)} ${y}`; };
  const rm = (n) => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rm0 = (n) => 'RM ' + Math.round(Number(n || 0)).toLocaleString('en-MY');
  const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
  const daysBetween = (a, b) => Math.abs((Date.parse(a) - Date.parse(b)) / 864e5);

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Store (localStorage; tukar kepada Firebase dalam fasa seterusnya) ----------
  const Store = {
    load() {
      try { const raw = localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* storan tidak tersedia */ }
      return null;
    },
    save(db) {
      try { localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; }
      catch (e) { toast('Storan peranti penuh. Padam rekod lama atau sambung ke Firebase.'); return false; }
    },
    getUser() { try { return localStorage.getItem(USER_KEY); } catch (e) { return null; } },
    setUser(id) { try { id ? localStorage.setItem(USER_KEY, id) : localStorage.removeItem(USER_KEY); } catch (e) { /* abaikan */ } },
  };

  function seed() {
    const t = today(), m = thisMonth();
    const d = (day) => `${m}-${pad(Math.min(day, Number(t.slice(8, 10))))}`;
    const users = [
      { id: 'u1', nama: 'Mohd. Rasidi', peranan: 'pengarah' },
      { id: 'u2', nama: 'Ahmad Azli', peranan: 'pengurus' },
      { id: 'u3', nama: 'Iskandar', peranan: 'penyelia' },
      { id: 'u4', nama: 'Husni Yahya', peranan: 'penyelia' },
      { id: 'u5', nama: 'Akaun Kaiser', peranan: 'akaun' },
      { id: 'u6', nama: 'Muhd Nasrun', peranan: 'pekerja', tarikhMula: '2012-03-01' },
    ];
    const kod = [
      ['FPG-26-CV-001', 'Pembaikan longkang dan konkrit', 'sivil', 30000],
      ['FPG-26-EL-001', 'Pendawaian, lampu dan soket', 'elektrik', 15000],
      ['FPG-26-MK-001', 'Pembaikan pam dan paip', 'mekanikal', 12000],
      ['FPG-26-AC-001', 'Servis unit penghawa dingin', 'ac', 8000],
      ['FPG-26-FB-001', 'Fabrikasi dan pemasangan struktur keluli', 'fabrikasi', 25000],
      ['FPG-26-CT-001', 'Pengecatan dan sand blasting', 'cat', 10000],
      ['FPG-26-PM-001', 'Penyelenggaraan bangunan dan handyman', 'fasiliti', 20000],
      ['FPG-26-TK-001', 'Bekalan tenaga kerja', 'tenaga', 18000],
    ].map(([k, p, s, b], i) => ({ id: 'k' + (i + 1), kod: k, penerangan: p, skop: s, jenis: 'Kontrak', bajet: b, status: 'Aktif', tarikh: d(1) }));
    kod.push({ id: 'k9', kod: 'FPG-26-VO-001', penerangan: 'Contoh: tambah longkang Blok B', skop: 'sivil', jenis: 'VO', bajet: 0, status: 'Aktif', voStatus: 'Sedang dijalankan', pemberiArahan: 'Jurutera loji FPG (contoh)', caraArahan: 'WhatsApp', bukti: [], semak: 'dihantar', userId: 'u3', tarikh: d(3), history: [] });
    const belian = [
      { id: uid(), tarikh: d(2), userId: 'u3', kodId: 'k1', pembekal: 'Kedai Hardware (contoh)', noResit: 'R-1001', item: 'Simen 4 beg', jumlah: 96, bayaran: 'Tunai', noPO: '', resit: [], status: 'dihantar', nota: '', history: [] },
      { id: uid(), tarikh: d(2), userId: 'u4', kodId: 'k2', pembekal: 'Kedai Elektrik (contoh)', noResit: 'R-2033', item: 'Pemutus litar 2 unit', jumlah: 140, bayaran: 'Tunai', noPO: '', resit: [], status: 'disahkan', nota: '', history: [] },
      { id: uid(), tarikh: d(3), userId: 'u3', kodId: 'k9', pembekal: 'Pembekal Konkrit (contoh)', noResit: 'INV-77', item: 'Konkrit siap bancuh', jumlah: 1850, bayaran: 'PO', noPO: '', resit: [], status: 'dihantar', nota: '', history: [] },
    ];
    const laporan = [
      { id: uid(), tarikh: d(2), userId: 'u3', kodId: 'k1', lokasi: 'Blok A', tugas: 'Tampal retak longkang (contoh)', pekerja: 'Iskandar + 2 pekerja kontrak', jam: 6, bahan: 'Simen, 2 beg', gambar: [], status: 'dihantar', nota: '', history: [] },
      { id: uid(), tarikh: d(2), userId: 'u4', kodId: 'k2', lokasi: 'Stor 2', tugas: 'Tukar pemutus litar (contoh)', pekerja: 'Husni Yahya', jam: 2, bahan: 'Pemutus litar, 1 unit', gambar: [], status: 'diluluskan', nota: '', history: [] },
    ];
    return {
      v: 1,
      settings: { klien: 'FPG Oleochemicals Sdn. Bhd.', tapak: 'FPG Oleochemicals, Kuantan', prefix: 'FPG-26', hadTunai: 200, imprest: 2000 },
      users, kod, belian, laporan, hadir: [],
      mohon: [
        { id: uid(), jenis: 'cuti', userId: 'u6', tarikh: d(2), jenisCuti: 'Tahunan', mula: d(20), tamat: d(21), hari: 2, sebab: 'Urusan keluarga (contoh)', lampiran: [], status: 'dihantar', nota: '', history: [] },
        { id: uid(), jenis: 'tuntutan', userId: 'u3', tarikh: d(3), jenisTuntutan: 'Tol & parkir', tarikhBelanja: d(3), jumlah: 18.4, keterangan: 'Tol ke pembekal Gebeng (contoh)', kodId: 'k1', resitT: [], status: 'dihantar', nota: '', history: [] },
      ],
      tunai: [{ id: uid(), tarikh: d(1), jumlah: 2000, catatan: 'Imprest awal (contoh)', oleh: 'u5' }],
      kiraan: [], audit: [],
    };
  }

  // ---------- Firebase (mod awan) ----------
  // Jika fail firebase-config.js dan SDK Firebase dimuatkan, apps guna Firestore. Jika tidak, mod demo (localStorage).
  const CFG = window.KAISER_FIREBASE;
  const CLOUD = !!(CFG && window.firebase && window.firebase.initializeApp);
  const DEFAULT_SETTINGS = { klien: 'FPG Oleochemicals Sdn. Bhd.', tapak: 'FPG Oleochemicals, Kuantan', prefix: 'FPG-26', hadTunai: 200, imprest: 2000, waktuMasuk: '08:00', tapakLat: '', tapakLng: '', radius: 500, kadarKm: 0, hadPendahuluan: 500, hariJelasPetty: 7 };
  let fs = null, auth = null;
  const imgCache = {};
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  if (CLOUD) {
    firebase.initializeApp(CFG);
    fs = firebase.firestore();
    try { fs.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) { /* abaikan */ }
    auth = firebase.auth();
  }
  const clean = (o) => JSON.parse(JSON.stringify(o));
  const Cloud = {
    unsubs: [],
    write(coll, obj) {
      const data = clean(obj); const id = data.id; delete data.id;
      return fs.collection(coll).doc(id).set(data).catch((e) => { console.error(e); toast('Gagal simpan ke awan: ' + (e.code || e.message)); });
    },
    stop() { this.unsubs.forEach((u) => { try { u(); } catch (e) { /* abaikan */ } }); this.unsubs = []; },
    subscribe(u) {
      this.stop();
      const admin = !['penyelia', 'pekerja'].includes(u.peranan);
      const listen = (coll, q) => {
        this.unsubs.push(q.onSnapshot((snap) => {
          db[coll] = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
          scheduleRender();
        }, (e) => { console.error(coll, e); toast('Tiada akses: ' + coll); }));
      };
      listen('users', fs.collection('users'));
      listen('kod', fs.collection('kod'));
      ['laporan', 'belian', 'hadir', 'mohon'].forEach((c) => listen(c, admin ? fs.collection(c) : fs.collection(c).where('userId', '==', u.id)));
      if (admin) { listen('tunai', fs.collection('tunai')); listen('kiraan', fs.collection('kiraan')); }
      this.unsubs.push(fs.collection('settings').doc('main').onSnapshot((d) => { db.settings = Object.assign({}, DEFAULT_SETTINGS, d.exists ? d.data() : {}); scheduleRender(); }, () => {}));
    },
  };
  function emptyDb() { return { v: 1, settings: Object.assign({}, DEFAULT_SETTINGS), users: [], kod: [], belian: [], laporan: [], hadir: [], mohon: [], tunai: [], kiraan: [], audit: [] }; }

  // Simpan gambar draf: mod awan → dokumen berasingan dalam koleksi `gambar`, rekod hanya simpan id.
  function persistPhotos(arr) {
    if (!CLOUD) return arr.map((p) => ({ img: p.img, cap: p.cap || '' }));
    return arr.map((p) => {
      if (p.id) return { id: p.id, cap: p.cap || '' };
      const id = uid();
      imgCache[id] = p.img;
      fs.collection('gambar').doc(id).set({ data: p.img, ownerId: state.userId, t: new Date().toISOString() }).catch((e) => toast('Gagal simpan gambar: ' + (e.code || e.message)));
      return { id, cap: p.cap || '' };
    });
  }
  const imgSrc = (g) => (g.img || (g.id && imgCache[g.id]) || BLANK);
  const imgAttr = (g) => `src="${imgSrc(g)}" data-gid="${esc(g.id || '')}"`;
  function hydrateImages() {
    if (!CLOUD) return;
    document.querySelectorAll('img[data-gid]').forEach((el) => {
      const id = el.dataset.gid;
      if (!id) return;
      if (imgCache[id]) { el.src = imgCache[id]; return; }
      if (imgCache[id] === null) return;
      imgCache[id] = null;
      fs.collection('gambar').doc(id).get().then((d) => {
        imgCache[id] = d.exists ? d.data().data : undefined;
        if (imgCache[id]) document.querySelectorAll(`img[data-gid="${id}"]`).forEach((x) => { x.src = imgCache[id]; });
      }).catch(() => { imgCache[id] = undefined; });
    });
  }

  let db = CLOUD ? emptyDb() : (Store.load() || seed());
  db.mohon = db.mohon || [];
  db.settings = Object.assign({}, DEFAULT_SETTINGS, db.settings);
  const state = { userId: CLOUD ? null : Store.getUser(), draft: null, bulan: thisMonth(), modal: null, screen: CLOUD ? 'loading' : null, authUser: null };
  const me = () => db.users.find((u) => u.id === state.userId) || null;
  const userName = (id) => (db.users.find((u) => u.id === id) || {}).nama || '—';
  const kodOf = (id) => db.kod.find((k) => k.id === id) || null;
  const skopOf = (id) => SKOP.find((s) => s.id === id) || { nama: '—', pendek: '—' };
  const isAdmin = (u) => u && !['penyelia', 'pekerja'].includes(u.peranan);

  // changes: senarai [koleksi, rekod] yang berubah (untuk mod awan).
  function commit(act, ref, changes) {
    const a = { id: uid(), t: new Date().toISOString(), userId: state.userId, act, ref: ref || '' };
    if (CLOUD) {
      (changes || []).forEach(([coll, obj]) => Cloud.write(coll, obj));
      Cloud.write('audit', a);
      return true;
    }
    db.audit.push(a);
    if (db.audit.length > 2000) db.audit = db.audit.slice(-2000);
    return Store.save(db);
  }

  // ---------- Bendera merah ----------
  function flagsBelian(b) {
    const f = [];
    const k = kodOf(b.kodId);
    if (!b.resit || !b.resit.length) f.push('Tiada gambar resit');
    if (!b.noResit) f.push('Tiada no. resit');
    if (!k) f.push('Tiada kod kerja');
    else if (k.status !== 'Aktif') f.push('Kod kerja ditutup');
    if (b.bayaran === 'Tunai' && num(b.jumlah) > num(db.settings.hadTunai)) f.push('Melebihi had tunai');
    if (b.bayaran === 'PO' && !b.noPO) f.push('No. PO tiada');
    if (b.noResit && db.belian.some((o) => o.id !== b.id && o.noResit && o.noResit.trim().toLowerCase() === b.noResit.trim().toLowerCase() && (o.pembekal || '').trim().toLowerCase() === (b.pembekal || '').trim().toLowerCase())) f.push('Resit berganda');
    const sameItem = db.belian.filter((o) => o.item && b.item && o.item.trim().toLowerCase() === b.item.trim().toLowerCase() && daysBetween(o.tarikh, b.tarikh) <= 7);
    if (sameItem.length >= 3) f.push('Belian berulang (3+ dalam 7 hari)');
    return f;
  }
  function flagsLaporan(l) {
    const f = [];
    const k = kodOf(l.kodId);
    if (!k) f.push('Tiada kod kerja');
    else if (k.status !== 'Aktif') f.push('Kod kerja ditutup');
    if (!l.gambar || !l.gambar.length) f.push('Tiada gambar kerja');
    if (num(l.jam) > 12) f.push('Jam melebihi 12');
    return f;
  }
  function flagsVO(k) {
    const f = [];
    if (!k.bukti || !k.bukti.length) f.push('Tiada bukti arahan');
    if (!k.pemberiArahan) f.push('Pemberi arahan tidak dinyatakan');
    return f;
  }

  // ---------- Pengiraan ----------
  const live = (x) => x.status !== 'dikembalikan';
  const inMonth = (x, ym) => (x.tarikh || '').slice(0, 7) === ym;
  function kosKod(kodId, ym) { return db.belian.filter((b) => b.kodId === kodId && live(b) && (!ym || inMonth(b, ym))).reduce((s, b) => s + num(b.jumlah), 0); }
  function jamKod(kodId, ym) { return db.laporan.filter((l) => l.kodId === kodId && live(l) && (!ym || inMonth(l, ym))).reduce((s, l) => s + num(l.jam), 0); }
  function pendingItems() {
    const items = [];
    db.belian.forEach((b) => items.push({ type: 'belian', rec: b, flags: flagsBelian(b) }));
    db.laporan.forEach((l) => items.push({ type: 'laporan', rec: l, flags: flagsLaporan(l) }));
    db.kod.filter((k) => k.jenis === 'VO' && k.semak).forEach((k) => items.push({ type: 'vo', rec: Object.assign({}, k, { status: k.semak }), flags: flagsVO(k) }));
    return items;
  }
  function queueFor(u) {
    if (!u) return [];
    const want = u.peranan === 'pengarah' ? ['disahkan', 'dihantar'] : ['dihantar'];
    return pendingItems().filter((it) => want.includes(it.rec.status)).sort((a, b) => (a.rec.tarikh < b.rec.tarikh ? 1 : -1));
  }
  function skopStats(skopId, ym) {
    const kods = db.kod.filter((k) => k.skop === skopId);
    const ids = new Set(kods.map((k) => k.id));
    const aktif = kods.filter((k) => k.status === 'Aktif').length;
    const kos = db.belian.filter((b) => ids.has(b.kodId) && live(b) && inMonth(b, ym)).reduce((s, b) => s + num(b.jumlah), 0);
    const kosAll = db.belian.filter((b) => ids.has(b.kodId) && live(b)).reduce((s, b) => s + num(b.jumlah), 0);
    const jam = db.laporan.filter((l) => ids.has(l.kodId) && live(l) && inMonth(l, ym)).reduce((s, l) => s + num(l.jam), 0);
    const bajet = kods.reduce((s, k) => s + num(k.bajet), 0);
    const flags = pendingItems().filter((it) => ['dihantar', 'disahkan'].includes(it.rec.status) && it.flags.length && ids.has(it.type === 'vo' ? it.rec.id : it.rec.kodId)).length;
    const voOpen = kods.filter((k) => k.jenis === 'VO' && !['Diinvois', 'Dibayar'].includes(k.voStatus)).length;
    return { kods, aktif, kos, kosAll, jam, bajet, flags, voOpen };
  }
  function voBelumDicaj() {
    return db.kod.filter((k) => k.jenis === 'VO' && !['Diinvois', 'Dibayar'].includes(k.voStatus)).reduce((s, k) => s + kosKod(k.id), 0);
  }
  function bakiTunai() {
    const masuk = db.tunai.reduce((s, t) => s + num(t.jumlah), 0);
    const keluar = db.belian.filter((b) => b.bayaran === 'Tunai' && live(b)).reduce((s, b) => s + num(b.jumlah), 0);
    return { masuk, keluar, baki: masuk - keluar };
  }

  // ---------- Gambar ----------
  function compressImage(file, max) {
    max = max || 1000;
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onerror = () => reject(new Error('Gagal membaca gambar'));
      rd.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Format gambar tidak disokong'));
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.62));
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  // ---------- Ikon ----------
  const I = {
    lapor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>',
    resit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
    vo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    senarai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
    jam: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cuti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    tuntut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    dompet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h2M3 10h18"/></svg>',
    wang: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
    kamera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/></svg>',
  };

  const pill = (s) => `<span class="pill p-${esc(s)}">${esc(STATUS_LABEL[s] || s)}</span>`;
  const flagPills = (f) => (f.length ? f.map((x) => `<span class="pill p-flag">${esc(x)}</span>`).join(' ') : '<span class="pill p-okflag">OK</span>');

  // ---------- Paparan: log masuk ----------
  function viewLogin() {
    if (CLOUD) return viewCloudLogin();
    const order = ['penyelia', 'pengurus', 'pengarah', 'akaun'];
    const users = db.users.slice().sort((a, b) => order.indexOf(a.peranan) - order.indexOf(b.peranan));
    return `<div class="login">
      <div class="logo"><img src="icon-192.png" alt="Logo Kaiser"><div><h1>Kaiser Engineering</h1><div class="muted small">Rekod kerja, perbelanjaan dan tuntutan</div></div></div>
      <div class="notice">Mod demo: data disimpan dalam pelayar ini sahaja. Pilih pengguna untuk masuk.</div>
      <div class="stack">${users.map((u) => `<button class="user" data-a="login" data-id="${u.id}"><span><b>${esc(u.nama)}</b><br><span class="muted small">${PERANAN[u.peranan]}</span></span><span aria-hidden="true">›</span></button>`).join('')}</div>
    </div>`;
  }

  function loginShell(inner) {
    return `<div class="login"><div class="logo"><img src="icon-192.png" alt="Logo Kaiser"><div><h1>Kaiser Engineering</h1><div class="muted small">Rekod kerja, perbelanjaan dan tuntutan</div></div></div>${inner}</div>`;
  }
  function viewCloudLogin() {
    if (state.screen === 'loading') return loginShell('<div class="muted">Memuatkan…</div>');
    if (state.screen === 'bootstrap') return loginShell(`<div class="card stack"><h2>Sediakan sistem</h2>
      <div class="small">Anda pengguna pertama (${esc(state.authUser.email)}). Akaun ini akan didaftarkan sebagai <b>Pengarah</b>, dan anda boleh menambah pengguna lain dalam Tetapan.</div>
      <form class="stack" data-form="bootstrap"><label class="f">Nama penuh<input class="i" name="nama" required></label><button class="btn primary" type="submit">Sediakan sistem</button></form>
      <button class="btn" data-a="logout">Log keluar</button></div>`);
    if (state.screen === 'notreg') return loginShell(`<div class="notice bad">Akaun <b>${esc(state.authUser.email)}</b> belum didaftarkan atau telah dinyahaktifkan. Hubungi Pengarah Kaiser.</div><button class="btn" data-a="logout">Log keluar</button>`);
    return loginShell(`${navigator.onLine ? '' : '<div class="notice">Tiada internet. Log masuk pertama kali memerlukan internet.</div>'}
      <form class="card stack" data-form="login">
        <label class="f">Emel<input class="i" type="email" name="email" autocomplete="username" required></label>
        <label class="f">Kata laluan<input class="i" type="password" name="password" autocomplete="current-password" required></label>
        <button class="btn primary" type="submit">Log masuk</button>
        <button class="btn" type="button" data-a="resetPw">Lupa kata laluan</button>
      </form>`);
  }

  // ---------- Paparan: Apps Pekerja ----------
  function topbar(title, back) {
    const u = me();
    return `<header class="topbar">
      ${back ? `<a class="iconbtn" href="${back}" aria-label="Kembali">‹</a>` : '<img src="icon-64.png" alt="">'}
      <div><div class="t">${esc(title)}</div><div class="s">${esc(u.nama)} · ${PERANAN[u.peranan]}</div></div>
      <span class="sp"></span>
      ${isAdmin(u) ? '<a class="iconbtn" href="#a-dash">Pentadbiran</a>' : ''}
      <button class="iconbtn" data-a="logout">Keluar</button>
    </header>`;
  }

  function viewHome() {
    const u = me(), t = today();
    const h = db.hadir.find((x) => x.userId === u.id && x.tarikh === t);
    const mine = (arr) => arr.filter((x) => x.userId === u.id);
    const lapToday = mine(db.laporan).filter((x) => x.tarikh === t).length;
    const resToday = mine(db.belian).filter((x) => x.tarikh === t).length;
    const back = mine(db.belian).concat(mine(db.laporan)).filter((x) => x.status === 'dikembalikan');
    const bc = bakiCuti(u);
    const aktifMohon = mine(db.mohon).filter((m) => stepOf(m)).length;
    const pettyBelum = mine(db.mohon).filter((m) => m.jenis === 'pettycash' && m.status === 'dibayar');
    const isSv = u.peranan !== 'pekerja';
    const recent = mine(db.laporan).map((x) => ({ x, t: 'laporan' })).concat(mine(db.belian).map((x) => ({ x, t: 'belian' })))
      .sort((a, b) => (a.x.tarikh < b.x.tarikh ? 1 : -1)).slice(0, 5);
    let clock;
    if (!h) clock = `<a class="clock in" href="#hadir" style="text-decoration:none">${I.jam} Masuk Kerja</a>`;
    else if (!h.keluar) clock = `<a class="clock out" href="#hadir" style="text-decoration:none">${I.jam} Keluar Kerja <span class="small" style="font-weight:500">(masuk ${esc(h.masuk)})</span></a>`;
    else clock = `<div class="card small">Hari ini: masuk ${esc(h.masuk)}, keluar ${esc(h.keluar)}.</div>`;
    return `${topbar('Apps Pekerja')}
    <main class="wrap">
      ${navigator.onLine ? '' : '<div class="notice">Luar talian. Rekod disimpan dalam telefon dan akan dihantar bila ada liputan.</div>'}
      ${CLOUD ? '' : '<div class="notice small">Mod demo: data hanya dalam pelayar ini.</div>'}
      ${back.length ? `<a class="notice bad" href="#rekod" style="text-decoration:none"><b>${back.length} rekod dikembalikan</b> untuk pembetulan. Tekan untuk lihat.</a>` : ''}
      ${pettyBelum.length ? `<a class="notice" href="#permohonan" style="text-decoration:none"><b>Petty cash ${rm(pettyBelum.reduce((a, m) => a + num(m.jumlah), 0))} belum dijelaskan.</b> Hantar resit belian dan pulangkan baki.</a>` : ''}
      <div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div class="card kpi" style="text-align:center;padding:10px"><div class="v">${bc.Tahunan}</div><div class="l">Baki cuti tahunan</div></div>
        <div class="card kpi" style="text-align:center;padding:10px"><div class="v">${aktifMohon}</div><div class="l">Permohonan aktif</div></div>
        <div class="card kpi" style="text-align:center;padding:10px"><div class="v" style="color:${back.length ? 'var(--bad)' : 'var(--ink)'}">${back.length}</div><div class="l">Dikembalikan</div></div>
      </div>
      ${clock}
      <div class="tiles">
        <a class="tile" href="#laporan">${I.lapor}<span>Laporan Kerja</span></a>
        ${isSv ? `<a class="tile" href="#belian">${I.resit}<span>Belian / Resit</span></a>
        <a class="tile" href="#vo">${I.vo}<span>Arahan Kerja Tambahan</span></a>` : ''}
        <a class="tile" href="#mohon-cuti">${I.cuti}<span>Mohon Cuti</span></a>
        <a class="tile" href="#mohon-tuntutan">${I.tuntut}<span>Tuntutan</span></a>
        <a class="tile" href="#mohon-pettycash">${I.dompet}<span>Petty Cash</span></a>
        <a class="tile" href="#mohon-pendahuluan">${I.wang}<span>Pendahuluan Gaji</span></a>
        <a class="tile" href="#permohonan">${I.senarai}<span>Permohonan Saya</span></a>
        <a class="tile" href="#rekod">${I.senarai}<span>Rekod Kerja Saya</span></a>
      </div>
      <h2>Rekod terkini</h2>
      <div class="stack" style="gap:8px">${recent.length ? recent.map(({ x, t: ty }) => {
        const k = kodOf(x.kodId);
        return `<button class="item" data-a="openMine" data-type="${ty}" data-id="${x.id}"><span><span class="t">${esc(ty === 'laporan' ? x.tugas : x.item)}</span><br><span class="muted tiny">${fmtDate(x.tarikh)} · ${esc(k ? k.kod : '—')} · ${ty === 'laporan' ? esc(x.jam) + ' jam' : rm(x.jumlah)}</span></span>${pill(x.status)}</button>`;
      }).join('') : '<div class="muted small">Belum ada rekod.</div>'}</div>
    </main>`;
  }

  function kodOptions(sel, onlyActive) {
    const list = db.kod.filter((k) => !onlyActive || k.status === 'Aktif' || k.id === sel);
    return `<option value="">Pilih kod kerja…</option>` + SKOP.map((s) => {
      const ks = list.filter((k) => k.skop === s.id);
      if (!ks.length) return '';
      return `<optgroup label="${esc(s.nama)}">${ks.map((k) => `<option value="${k.id}" ${k.id === sel ? 'selected' : ''}>${esc(k.kod)} · ${esc(k.penerangan)}</option>`).join('')}</optgroup>`;
    }).join('');
  }

  function photoGrid(field, caps, capture) {
    const arr = state.draft[field] || [];
    const tiles = arr.map((p, i) => `<div class="ph"><img ${imgAttr(p)} alt=""${esc(p.cap || 'Gambar')}"><button type="button" class="x" data-a="rmPhoto" data-f="${field}" data-i="${i}" aria-label="Buang gambar">×</button>${p.cap ? `<span class="cap">${esc(p.cap)}</span>` : ''}</div>`).join('');
    const adds = (caps || ['']).map((c) => `<label class="addph">${I.kamera}<span>${c ? 'Gambar ' + esc(c.toLowerCase()) : 'Tambah gambar'}</span><input type="file" accept="image/*" capture="${capture || 'environment'}" data-file="${field}" data-cap="${esc(c)}"></label>`).join('');
    return `<div class="photos" id="ph-${field}">${tiles}${adds}</div>`;
  }

  function viewLaporan(id) {
    const rec = id ? db.laporan.find((x) => x.id === id) : null;
    if (!state.draft || state.draft._form !== 'laporan' || state.draft._id !== (id || null)) {
      state.draft = { _form: 'laporan', _id: id || null, gambar: rec ? (rec.gambar || []).slice() : [] };
    }
    const r = rec || { tarikh: today(), kodId: '', lokasi: '', tugas: '', pekerja: me().nama, jam: '', bahan: '' };
    return `${topbar(rec ? 'Betulkan laporan' : 'Laporan Kerja', '#home')}
    <main class="wrap">
      ${rec && rec.nota ? `<div class="notice bad"><b>Nota pengurus:</b> ${esc(rec.nota)}</div>` : ''}
      <form class="stack" data-form="laporan">
        <div class="grid2">
          <label class="f">Tarikh<input class="i" type="date" name="tarikh" value="${esc(r.tarikh)}" required></label>
          <label class="f">Jam kerja<input class="i" type="number" name="jam" min="0" max="24" step="0.5" inputmode="decimal" value="${esc(r.jam)}" required></label>
        </div>
        <label class="f">Kod kerja<select class="i" name="kodId" required>${kodOptions(r.kodId, true)}</select></label>
        <label class="f">Lokasi<input class="i" name="lokasi" value="${esc(r.lokasi)}" placeholder="Contoh: Blok B, longkang utara" required></label>
        <label class="f">Tugas yang dibuat<textarea class="i" name="tugas" required placeholder="Terangkan kerja yang dibuat">${esc(r.tugas)}</textarea></label>
        <label class="f">Pekerja<input class="i" name="pekerja" value="${esc(r.pekerja)}" placeholder="Nama pekerja / bilangan pekerja kontrak"></label>
        <label class="f">Bahan digunakan <span class="muted tiny" style="font-weight:400">Satu baris setiap bahan, contoh: Simen, 2 beg</span><textarea class="i" name="bahan">${esc(r.bahan)}</textarea></label>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Gambar kerja${photoGrid('gambar', ['Sebelum', 'Semasa', 'Selepas'])}</div>
        <button class="btn primary block" type="submit">${rec ? 'Hantar semula' : 'Hantar laporan'}</button>
      </form>
    </main>`;
  }

  function viewBelian(id) {
    const rec = id ? db.belian.find((x) => x.id === id) : null;
    if (!state.draft || state.draft._form !== 'belian' || state.draft._id !== (id || null)) {
      state.draft = { _form: 'belian', _id: id || null, resit: rec ? (rec.resit || []).slice() : [], bayaran: rec ? rec.bayaran : 'Tunai' };
    }
    const r = rec || { tarikh: today(), kodId: '', pembekal: '', noResit: '', item: '', jumlah: '', noPO: '' };
    const byr = state.draft.bayaran;
    return `${topbar(rec ? 'Betulkan belian' : 'Belian / Resit', '#home')}
    <main class="wrap">
      ${rec && rec.nota ? `<div class="notice bad"><b>Nota pengurus:</b> ${esc(rec.nota)}</div>` : ''}
      <form class="stack" data-form="belian">
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Gambar resit${photoGrid('resit', [''])}</div>
        <div class="grid2">
          <label class="f">Tarikh<input class="i" type="date" name="tarikh" value="${esc(r.tarikh)}" required></label>
          <label class="f">Jumlah (RM)<input class="i" type="number" name="jumlah" min="0" step="0.01" inputmode="decimal" value="${esc(r.jumlah)}" required></label>
        </div>
        <label class="f">Kod kerja<select class="i" name="kodId" required>${kodOptions(r.kodId, true)}</select></label>
        <div class="grid2">
          <label class="f">Pembekal<input class="i" name="pembekal" value="${esc(r.pembekal)}" required></label>
          <label class="f">No. resit / invois<input class="i" name="noResit" value="${esc(r.noResit)}"></label>
        </div>
        <label class="f">Barang / perkhidmatan<input class="i" name="barang" value="${esc(r.item)}" placeholder="Contoh: Simen 4 beg" required></label>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Cara bayaran
          <div class="chips">${['Tunai', 'PO'].map((b) => `<button type="button" class="chip ${byr === b ? 'on' : ''}" data-a="setBayaran" data-v="${b}" aria-pressed="${byr === b}">${b === 'Tunai' ? 'Tunai runcit' : 'Pesanan belian (PO)'}</button>`).join('')}</div>
        </div>
        ${byr === 'PO' ? `<label class="f">No. PO<input class="i" name="noPO" value="${esc(r.noPO)}"></label>` : `<div class="muted tiny">Had belian tunai sekali beli: ${rm(db.settings.hadTunai)}</div>`}
        <button class="btn primary block" type="submit">${rec ? 'Hantar semula' : 'Hantar resit'}</button>
      </form>
    </main>`;
  }

  function viewVO() {
    if (!state.draft || state.draft._form !== 'vo') state.draft = { _form: 'vo', bukti: [], skop: '' };
    const sk = state.draft.skop;
    return `${topbar('Arahan Kerja Tambahan', '#home')}
    <main class="wrap">
      <div class="notice">Rekod arahan klien <b>sebelum</b> kerja dimulakan. Kod VO baharu akan dibuka untuk semua rekod kerja ini.</div>
      <form class="stack" data-form="vo">
        <label class="f">Penerangan kerja<textarea class="i" name="penerangan" required placeholder="Contoh: Tambah longkang 20 m di Blok B"></textarea></label>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Skop kerja
          <div class="chips">${SKOP.map((s) => `<button type="button" class="chip ${sk === s.id ? 'on' : ''}" data-a="setSkop" data-v="${s.id}" aria-pressed="${sk === s.id}">${esc(s.pendek)}</button>`).join('')}</div>
        </div>
        <label class="f">Lokasi<input class="i" name="lokasi" required></label>
        <div class="grid2">
          <label class="f">Diarahkan oleh (nama &amp; jawatan klien)<input class="i" name="pemberiArahan" required></label>
          <label class="f">Cara arahan<select class="i" name="caraArahan"><option>Arahan Tapak</option><option>WhatsApp</option><option>Emel</option><option>Lisan</option><option>Minit mesyuarat</option></select></label>
        </div>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Bukti arahan (gambar arahan, tangkap layar WhatsApp, tapak)${photoGrid('bukti', [''])}</div>
        <button class="btn primary block" type="submit">Buka kod VO</button>
      </form>
    </main>`;
  }

  function viewRekod() {
    const u = me();
    const rows = db.laporan.filter((x) => x.userId === u.id).map((x) => ({ x, t: 'laporan' }))
      .concat(db.belian.filter((x) => x.userId === u.id).map((x) => ({ x, t: 'belian' })))
      .concat(db.kod.filter((k) => k.jenis === 'VO' && k.userId === u.id).map((x) => ({ x: Object.assign({}, x, { status: x.semak || 'disahkan' }), t: 'vo' })))
      .sort((a, b) => (a.x.tarikh < b.x.tarikh ? 1 : -1));
    return `${topbar('Rekod Saya', '#home')}
    <main class="wrap">
      <div class="stack" style="gap:8px">${rows.length ? rows.map(({ x, t }) => {
        const k = kodOf(x.kodId);
        const title = t === 'laporan' ? x.tugas : t === 'belian' ? x.item : `VO: ${x.penerangan}`;
        const sub = t === 'vo' ? `${x.kod} · ${x.voStatus}` : `${k ? k.kod : '—'} · ${t === 'laporan' ? x.jam + ' jam' : rm(x.jumlah)}`;
        return `<button class="item" data-a="openMine" data-type="${t}" data-id="${x.id}"><span><span class="t">${esc(title)}</span><br><span class="muted tiny">${fmtDate(x.tarikh)} · ${esc(sub)}</span></span>${pill(x.status)}</button>`;
      }).join('') : '<div class="muted">Belum ada rekod.</div>'}</div>
    </main>`;
  }

  // ---------- Paparan: Apps Pentadbiran ----------
  function adminShell(active, body) {
    const u = me();
    const q = queueFor(u).length;
    const link = (r, label, extra) => `<a href="#a-${r}" class="${active === r ? 'on' : ''}">${label}${extra || ''}</a>`;
    return `<div class="admin">
      <nav class="side" aria-label="Menu pentadbiran">
        <div class="brand"><img src="icon-64.png" alt=""><div><b>Kaiser</b><div class="tiny" style="color:#BFD0E0">${esc(u.nama)} · ${PERANAN[u.peranan]}</div></div></div>
        ${link('dash', 'Utama')}
        ${u.peranan !== 'akaun' ? link('semak', 'Peti semakan', q ? `<span class="badge">${q}</span>` : '') : ''}
        ${link('hadir', 'Kehadiran')}
        ${link('mohon', 'Permohonan staf', mohonQueue(u).length ? `<span class="badge">${mohonQueue(u).length}</span>` : '')}
        ${link('skop', 'Pantauan skop kerja')}
        ${link('vo', 'Daftar VO')}
        ${link('kod', 'Kod kerja')}
        ${link('tunai', 'Tunai runcit')}
        ${link('eksport', 'Eksport bulanan')}
        ${u.peranan === 'pengarah' ? link('tetapan', 'Tetapan &amp; pengguna') : ''}
        <a href="#home">Apps Pekerja</a>
        <a href="#" data-a="logout">Log keluar</a>
      </nav>
      <main class="main">${body}</main>
    </div>`;
  }

  function monthPicker() {
    const months = new Set([thisMonth()]);
    db.belian.concat(db.laporan).forEach((x) => x.tarikh && months.add(x.tarikh.slice(0, 7)));
    return `<label class="f" style="min-width:180px">Bulan<select class="i" data-a-change="setBulan">${[...months].sort().reverse().map((m) => `<option value="${m}" ${m === state.bulan ? 'selected' : ''}>${monthName(m)}</option>`).join('')}</select></label>`;
  }

  function viewDash() {
    const u = me(), ym = state.bulan;
    const q = queueFor(u);
    const kos = db.belian.filter((b) => live(b) && inMonth(b, ym)).reduce((s, b) => s + num(b.jumlah), 0);
    const flagged = pendingItems().filter((it) => ['dihantar', 'disahkan'].includes(it.rec.status) && it.flags.length).length;
    const tn = bakiTunai();
    return adminShell('dash', `
      <div class="row between" style="align-items:flex-end">
        <div><div class="muted small">${esc(db.settings.klien)}</div><h1>Selamat datang, ${esc(u.nama)}</h1></div>
        ${monthPicker()}
      </div>
      <div class="kpis">
        <div class="card kpi"><div class="l">Menunggu semakan anda</div><div class="v">${q.length}</div></div>
        <div class="card kpi"><div class="l">Kos ${monthName(ym)}</div><div class="v">${rm0(kos)}</div></div>
        <div class="card kpi"><div class="l">VO belum dicaj (kos)</div><div class="v" style="color:var(--warn)">${rm0(voBelumDicaj())}</div></div>
        <div class="card kpi"><div class="l">Bendera merah terbuka</div><div class="v" style="color:${flagged ? 'var(--bad)' : 'var(--ink)'}">${flagged}</div></div>
        <div class="card kpi"><div class="l">Baki tunai runcit</div><div class="v">${rm0(tn.baki)}</div></div>
        <div class="card kpi"><div class="l">Hadir hari ini</div><div class="v">${db.hadir.filter((h) => h.tarikh === today()).length} / ${fieldUsers().length}</div></div>
        <div class="card kpi"><div class="l">Permohonan staf menunggu anda</div><div class="v">${mohonQueue(u).length}</div></div>
      </div>
      <section class="stack"><div class="row between"><h2>Pantauan skop kerja</h2><span class="muted small">Tekan skop untuk butiran</span></div>${skopGrid(ym)}</section>
      ${u.peranan !== 'akaun' ? `<section class="card stack"><div class="row between"><h2>Peti semakan</h2><a class="btn sm" href="#a-semak">Lihat semua</a></div>${queueTable(q.slice(0, 6))}</section>` : ''}
    `);
  }

  function skopGrid(ym) {
    return `<div class="grid-auto">${SKOP.map((s) => {
      const st = skopStats(s.id, ym);
      return `<a class="skop ${st.flags ? 'hot' : ''}" href="#a-skop-${s.id}" style="text-decoration:none"><b>${esc(s.nama)}</b><span class="muted small">${st.aktif} kod aktif · ${rm0(st.kos)} · ${st.jam} jam</span><span>${st.flags ? `<span class="pill p-flag">${st.flags} bendera merah</span>` : '<span class="pill p-okflag">Tiada isu</span>'} ${st.voOpen ? `<span class="pill p-vo">${st.voOpen} VO terbuka</span>` : ''}</span></a>`;
    }).join('')}</div>`;
  }

  function queueTable(items) {
    if (!items.length) return '<div class="muted small">Tiada rekod menunggu semakan.</div>';
    return `<div class="tbl"><table><thead><tr><th>Tarikh</th><th>Oleh</th><th>Jenis</th><th>Kod kerja</th><th>Butiran</th><th class="n">Jumlah</th><th>Semakan</th><th>Status</th></tr></thead><tbody>${items.map((it) => {
      const r = it.rec, k = it.type === 'vo' ? r : kodOf(r.kodId);
      const jenis = { belian: 'Resit', laporan: 'Laporan kerja', vo: 'Arahan VO' }[it.type];
      const det = it.type === 'belian' ? r.item : it.type === 'laporan' ? r.tugas : r.penerangan;
      const amt = it.type === 'belian' ? rm(r.jumlah) : it.type === 'laporan' ? r.jam + ' jam' : '—';
      return `<tr style="cursor:pointer" data-a="openRec" data-type="${it.type}" data-id="${r.id}"><td>${fmtDate(r.tarikh)}</td><td>${esc(userName(r.userId))}</td><td>${jenis}</td><td>${esc(k ? k.kod : '—')}</td><td>${esc(det)}</td><td class="n">${esc(amt)}</td><td>${flagPills(it.flags)}</td><td>${pill(r.status)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function viewSemak() {
    const q = queueFor(me());
    const u = me();
    return adminShell('semak', `
      <div><h1>Peti semakan</h1><div class="muted small">${u.peranan === 'pengarah' ? 'Rekod yang telah disahkan pengurus menunggu kelulusan akhir anda. Rekod yang belum disahkan juga dipaparkan.' : 'Rekod yang dihantar dari tapak menunggu pengesahan anda.'} Tekan baris untuk semak.</div></div>
      <section class="card">${queueTable(q)}</section>`);
  }

  function viewSkopList() {
    return adminShell('skop', `<div class="row between" style="align-items:flex-end"><h1>Pantauan skop kerja</h1>${monthPicker()}</div>${skopGrid(state.bulan)}`);
  }

  function viewSkop(id) {
    const s = SKOP.find((x) => x.id === id);
    if (!s) return viewSkopList();
    const ym = state.bulan, st = skopStats(id, ym);
    const pct = st.bajet ? Math.round((st.kosAll / st.bajet) * 100) : 0;
    const ids = new Set(st.kods.map((k) => k.id));
    const flagged = pendingItems().filter((it) => ['dihantar', 'disahkan'].includes(it.rec.status) && it.flags.length && ids.has(it.type === 'vo' ? it.rec.id : it.rec.kodId));
    const photos = db.laporan.filter((l) => ids.has(l.kodId) && l.gambar && l.gambar.length).sort((a, b) => (a.tarikh < b.tarikh ? 1 : -1)).flatMap((l) => l.gambar.map((g) => ({ g, l }))).slice(0, 8);
    return adminShell('skop', `
      <a href="#a-skop" class="small">‹ Semua skop</a>
      <div class="row between" style="align-items:flex-end"><div><div class="muted small">Pantauan skop kerja</div><h1>${esc(s.nama)}</h1></div>${monthPicker()}</div>
      <div class="kpis">
        <div class="card kpi"><div class="l">Kod aktif</div><div class="v">${st.aktif}</div></div>
        <div class="card kpi"><div class="l">Jam (${monthName(ym)})</div><div class="v">${st.jam}</div></div>
        <div class="card kpi"><div class="l">Kos (${monthName(ym)})</div><div class="v">${rm0(st.kos)}</div></div>
        <div class="card kpi"><div class="l">VO terbuka</div><div class="v" style="color:var(--warn)">${st.voOpen}</div></div>
        <div class="card kpi"><div class="l">Bendera merah</div><div class="v" style="color:${st.flags ? 'var(--bad)' : 'var(--ink)'}">${st.flags}</div></div>
      </div>
      <div class="card stack" style="gap:8px"><div class="row between small"><b>Kos keseluruhan berbanding bajet</b><span class="muted">${rm0(st.kosAll)} daripada ${rm0(st.bajet)}${st.bajet ? ` (${pct}%)` : ''}</span></div><div class="bar"><div class="${pct > 100 ? 'over' : ''}" style="width:${Math.min(pct, 100)}%"></div></div></div>
      <section class="card stack"><h2>Kod kerja dalam skop ini</h2>
        <div class="tbl"><table><thead><tr><th>Kod</th><th>Penerangan</th><th>Jenis</th><th>Status</th><th class="n">Jam bulan ini</th><th class="n">Kos bulan ini</th><th class="n">Kos keseluruhan</th><th class="n">Bajet</th></tr></thead><tbody>
        ${st.kods.map((k) => `<tr><td>${esc(k.kod)}</td><td>${esc(k.penerangan)}</td><td>${k.jenis === 'VO' ? `<span class="pill p-vo">VO · ${esc(k.voStatus)}</span>` : esc(k.jenis)}</td><td>${esc(k.status)}</td><td class="n">${jamKod(k.id, ym)}</td><td class="n">${rm(kosKod(k.id, ym))}</td><td class="n">${rm(kosKod(k.id))}</td><td class="n">${k.bajet ? rm0(k.bajet) : '—'}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Tiada kod kerja.</td></tr>'}
        </tbody></table></div></section>
      <section class="card stack"><h2>Bendera merah terbuka</h2>${flagged.length ? queueTable(flagged) : '<div class="muted small">Tiada.</div>'}</section>
      <section class="card stack"><h2>Gambar kerja terkini</h2>${photos.length ? `<div class="thumbs">${photos.map(({ g, l }) => `<img ${imgAttr(g)} alt="${esc((g.cap || 'Gambar') + ' · ' + l.tugas)}" data-a="zoom">`).join('')}</div>` : '<div class="muted small">Belum ada gambar.</div>'}</section>
    `);
  }

  function viewKod() {
    const u = me();
    const canEdit = u.peranan === 'pengurus' || u.peranan === 'pengarah';
    return adminShell('kod', `
      <h1>Kod kerja</h1>
      ${canEdit ? `<form class="card stack" data-form="kod"><h2>Buka kod kerja baharu</h2>
        <div class="grid-auto">
          <label class="f">Kod<input class="i" name="kod" required placeholder="${esc(db.settings.prefix)}-CV-002"></label>
          <label class="f">Skop<select class="i" name="skop" required>${SKOP.map((s) => `<option value="${s.id}">${esc(s.nama)}</option>`).join('')}</select></label>
          <label class="f">Jenis<select class="i" name="jenis"><option>Kontrak</option><option>Ad-hoc</option><option>VO</option></select></label>
          <label class="f">Bajet (RM)<input class="i" name="bajet" type="number" min="0" step="1"></label>
        </div>
        <label class="f">Penerangan<input class="i" name="penerangan" required></label>
        <div><button class="btn primary" type="submit">Simpan kod kerja</button></div>
      </form>` : ''}
      <section class="card"><div class="tbl"><table><thead><tr><th>Kod</th><th>Penerangan</th><th>Skop</th><th>Jenis</th><th class="n">Bajet</th><th class="n">Kos</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.kod.slice().sort((a, b) => a.kod.localeCompare(b.kod)).map((k) => `<tr><td>${esc(k.kod)}</td><td>${esc(k.penerangan)}</td><td>${esc(skopOf(k.skop).pendek)}</td><td>${esc(k.jenis)}</td><td class="n">${k.bajet ? rm0(k.bajet) : '—'}</td><td class="n">${rm(kosKod(k.id))}</td><td>${esc(k.status)}</td><td>${canEdit ? `<button class="btn sm" data-a="toggleKod" data-id="${k.id}">${k.status === 'Aktif' ? 'Tutup' : 'Buka semula'}</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div></section>`);
  }

  function viewVOList() {
    const canEdit = true; // pengurus, pengarah dan akaun boleh kemas kini status VO (contoh: akaun tanda Diinvois / Dibayar)
    const vos = db.kod.filter((k) => k.jenis === 'VO').sort((a, b) => (a.tarikh < b.tarikh ? 1 : -1));
    return adminShell('vo', `
      <div><h1>Daftar kerja tambahan (VO)</h1><div class="muted small">Kerja yang diarahkan klien dan dijejak hingga dibayar. Kos dikira daripada resit di bawah kod VO.</div></div>
      <div class="kpis">${VO_STATUS.map((s) => `<div class="card kpi"><div class="l">${esc(s)}</div><div class="v">${vos.filter((k) => k.voStatus === s).length}</div></div>`).join('')}</div>
      <section class="card"><div class="tbl"><table><thead><tr><th>Tarikh</th><th>Kod</th><th>Kerja</th><th>Skop</th><th>Diarahkan oleh</th><th class="n">Kos setakat ini</th><th class="n">Jam</th><th>Status VO</th></tr></thead><tbody>
      ${vos.map((k) => `<tr><td>${fmtDate(k.tarikh)}</td><td><a href="#" data-a="openRec" data-type="vo" data-id="${k.id}">${esc(k.kod)}</a></td><td>${esc(k.penerangan)}</td><td>${esc(skopOf(k.skop).pendek)}</td><td>${esc(k.pemberiArahan || '—')}</td><td class="n">${rm(kosKod(k.id))}</td><td class="n">${jamKod(k.id)}</td><td>${canEdit ? `<select class="i" style="min-height:36px;padding:4px 8px" data-a-change="voStatus" data-id="${k.id}" aria-label="Status VO ${esc(k.kod)}">${VO_STATUS.map((s) => `<option ${s === k.voStatus ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>` : esc(k.voStatus)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">Belum ada VO.</td></tr>'}
      </tbody></table></div></section>`);
  }

  function viewTunai() {
    const tn = bakiTunai();
    const last = db.kiraan[db.kiraan.length - 1];
    const u = me();
    const can = u.peranan !== 'penyelia';
    const keluar = db.belian.filter((b) => b.bayaran === 'Tunai' && live(b)).sort((a, b) => (a.tarikh < b.tarikh ? 1 : -1));
    return adminShell('tunai', `
      <div><h1>Tunai runcit</h1><div class="muted small">Imprest tapak: ${rm(db.settings.imprest)} · had sekali beli: ${rm(db.settings.hadTunai)}</div></div>
      <div class="kpis">
        <div class="card kpi"><div class="l">Jumlah top-up</div><div class="v">${rm0(tn.masuk)}</div></div>
        <div class="card kpi"><div class="l">Belian tunai</div><div class="v">${rm0(tn.keluar)}</div></div>
        <div class="card kpi"><div class="l">Baki sepatutnya</div><div class="v">${rm(tn.baki)}</div></div>
        <div class="card kpi"><div class="l">Kiraan terakhir</div><div class="v">${last ? rm(last.jumlah) : '—'}</div><div class="tiny muted">${last ? `${fmtDate(last.tarikh)} · varians ${rm(last.jumlah - last.jangka)}` : 'Belum dikira'}</div></div>
      </div>
      ${can ? `<div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        <form class="card stack" data-form="topup"><h2>Top-up tunai</h2><label class="f">Jumlah (RM)<input class="i" name="jumlah" type="number" min="0" step="0.01" required></label><label class="f">Catatan<input class="i" name="catatan" placeholder="Contoh: Tambah semula imprest"></label><button class="btn primary" type="submit">Rekod top-up</button></form>
        <form class="card stack" data-form="kiraan"><h2>Kiraan tunai fizikal</h2><label class="f">Tunai dikira (RM)<input class="i" name="jumlah" type="number" min="0" step="0.01" required></label><div class="muted tiny">Varians mesti sifar atau dijelaskan.</div><button class="btn primary" type="submit">Rekod kiraan</button></form>
      </div>` : ''}
      <section class="card stack"><h2>Belian tunai</h2><div class="tbl"><table><thead><tr><th>Tarikh</th><th>Oleh</th><th>Kod</th><th>Barang</th><th class="n">Jumlah</th><th>Status</th></tr></thead><tbody>
      ${keluar.map((b) => `<tr style="cursor:pointer" data-a="openRec" data-type="belian" data-id="${b.id}"><td>${fmtDate(b.tarikh)}</td><td>${esc(userName(b.userId))}</td><td>${esc((kodOf(b.kodId) || {}).kod || '—')}</td><td>${esc(b.item)}</td><td class="n">${rm(b.jumlah)}</td><td>${pill(b.status)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Tiada.</td></tr>'}
      </tbody></table></div></section>`);
  }

  function viewEksport() {
    const ym = state.bulan;
    const kods = db.kod.map((k) => ({ k, kos: kosKod(k.id, ym), jam: jamKod(k.id, ym) })).filter((x) => x.kos || x.jam);
    const belumLulus = db.belian.concat(db.laporan).filter((x) => inMonth(x, ym) && ['dihantar', 'disahkan'].includes(x.status)).length;
    return adminShell('eksport', `
      <div class="row between" style="align-items:flex-end"><div><h1>Eksport bulanan</h1><div class="muted small">Ringkasan untuk draf invois klien dan master financial.</div></div>${monthPicker()}</div>
      ${belumLulus ? `<div class="notice bad">${belumLulus} rekod ${monthName(ym)} belum diluluskan. Selesaikan dahulu sebelum tutup bulan.</div>` : '<div class="notice" style="background:var(--ok-bg);border-color:#BFE3CC;color:var(--ok)">Semua rekod bulan ini telah diluluskan.</div>'}
      <div class="row">
        <button class="btn primary" data-a="csv" data-v="ringkasan">Muat turun ringkasan kod kerja (CSV)</button>
        <button class="btn" data-a="csv" data-v="belian">Senarai belian (CSV)</button>
        <button class="btn" data-a="csv" data-v="laporan">Senarai laporan &amp; jam (CSV)</button>
        <button class="btn" data-a="csv" data-v="gaji">Ringkasan gaji staf (CSV)</button>
      </div>
      <section class="card stack"><h2>Ringkasan ${monthName(ym)}</h2><div class="tbl"><table><thead><tr><th>Kod</th><th>Penerangan</th><th>Skop</th><th>Jenis</th><th class="n">Jam</th><th class="n">Kos bahan / belian</th></tr></thead><tbody>
      ${kods.map(({ k, kos, jam }) => `<tr><td>${esc(k.kod)}</td><td>${esc(k.penerangan)}</td><td>${esc(skopOf(k.skop).pendek)}</td><td>${esc(k.jenis)}</td><td class="n">${jam}</td><td class="n">${rm(kos)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Tiada rekod bulan ini.</td></tr>'}
      </tbody></table></div><div class="muted tiny">Caj kepada klien dikira mengikut jadual kadar kontrak dalam fasa 3. Ringkasan ini ialah kos sebenar.</div></section>`);
  }

  function viewTetapan() {
    const s = db.settings;
    return adminShell('tetapan', `
      <h1>Tetapan &amp; pengguna</h1>
      <form class="card stack" data-form="settings"><h2>Tetapan</h2>
        <div class="grid-auto">
          <label class="f">Klien<input class="i" name="klien" value="${esc(s.klien)}"></label>
          <label class="f">Awalan kod<input class="i" name="prefix" value="${esc(s.prefix)}"></label>
          <label class="f">Had belian tunai sekali beli (RM)<input class="i" type="number" name="hadTunai" value="${esc(s.hadTunai)}"></label>
          <label class="f">Imprest tunai runcit (RM)<input class="i" type="number" name="imprest" value="${esc(s.imprest)}"></label>
          <label class="f">Waktu masuk kerja<input class="i" type="time" name="waktuMasuk" value="${esc(s.waktuMasuk)}"></label>
          <label class="f">Kadar perjalanan (RM / km)<input class="i" type="number" step="0.01" name="kadarKm" value="${esc(s.kadarKm)}"></label>
          <label class="f">Had pendahuluan gaji (RM)<input class="i" type="number" name="hadPendahuluan" value="${esc(s.hadPendahuluan)}"></label>
          <label class="f">Tempoh jelaskan petty cash (hari)<input class="i" type="number" name="hariJelasPetty" value="${esc(s.hariJelasPetty)}"></label>
        </div>
        <h3>Lokasi tapak untuk kehadiran</h3>
        <div class="grid-auto">
          <label class="f">Latitud<input class="i" name="tapakLat" value="${esc(s.tapakLat)}" inputmode="decimal"></label>
          <label class="f">Longitud<input class="i" name="tapakLng" value="${esc(s.tapakLng)}" inputmode="decimal"></label>
          <label class="f">Jarak dibenarkan (meter)<input class="i" type="number" name="radius" value="${esc(s.radius)}"></label>
        </div>
        <div class="muted tiny">Berdiri di pintu masuk tapak dan tekan "Guna lokasi saya sekarang". Kosongkan jika tidak mahu semakan jarak.</div>
        <div class="row"><button class="btn" type="button" data-a="lokasiTapak">Guna lokasi saya sekarang</button></div>
        <div><button class="btn primary" type="submit">Simpan tetapan</button></div>
      </form>
      <section class="card stack"><h2>Pengguna</h2>
        <div class="tbl"><table style="min-width:380px"><thead><tr><th>Nama</th><th>Peranan</th><th>Mula kerja</th><th class="n">Hak cuti tahunan / sakit</th><th></th></tr></thead><tbody>${db.users.filter((u) => u.aktif !== false).map((u) => `<tr><td>${esc(u.nama)}${u.email ? `<br><span class="muted tiny">${esc(u.email)}</span>` : ''}</td><td>${PERANAN[u.peranan]}</td><td>${u.tarikhMula ? fmtDate(u.tarikhMula) : '—'}</td><td class="n">${hakCuti(u).Tahunan} / ${hakCuti(u).Sakit} hari</td><td>${u.id !== state.userId ? `<button class="btn sm danger" data-a="rmUser" data-id="${u.id}">Buang</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
        <form class="row" data-form="user" style="align-items:flex-end">
          <label class="f" style="flex:1 1 200px">Nama<input class="i" name="nama" required></label>
          ${CLOUD ? `<label class="f" style="flex:1 1 220px">Emel<input class="i" type="email" name="email" required></label>
          <label class="f" style="flex:1 1 180px">Kata laluan sementara<input class="i" name="password" minlength="6" required></label>` : ''}
          <label class="f" style="flex:1 1 160px">Tarikh mula kerja<input class="i" type="date" name="tarikhMula"></label>
          <label class="f" style="flex:1 1 160px">Peranan<select class="i" name="peranan">${Object.keys(PERANAN).map((p) => `<option value="${p}">${PERANAN[p]}</option>`).join('')}</select></label>
          <button class="btn primary" type="submit">Tambah pengguna</button>
        </form>
      </section>
      ${CLOUD ? `<section class="card stack"><h2>Sambungan</h2><div class="small">Disambung ke Firebase projek <b>${esc(CFG.projectId)}</b>.</div></section>` : `<section class="card stack"><h2>Data demo</h2><div class="muted small">Padam semua rekod dalam pelayar ini dan mula semula dengan data contoh.</div><div><button class="btn danger" data-a="reset">Set semula data demo</button></div></section>`}`);
  }

  // ---------- Modul staf: kehadiran bergambar dan permohonan ----------
  const isField = (u) => u && (u.peranan === 'penyelia' || u.peranan === 'pekerja');
  const fieldUsers = () => db.users.filter((u) => u.aktif !== false && isField(u));
  const MOHON = {
    cuti: { nama: 'Permohonan cuti', pendek: 'Cuti' },
    tuntutan: { nama: 'Tuntutan perbelanjaan', pendek: 'Tuntutan' },
    pettycash: { nama: 'Permohonan petty cash', pendek: 'Petty cash' },
    pendahuluan: { nama: 'Pendahuluan gaji', pendek: 'Pendahuluan gaji' },
  };
  const JENIS_CUTI = ['Tahunan', 'Sakit', 'Hospital', 'Kecemasan', 'Tanpa gaji', 'Bersalin / paterniti', 'Lain-lain'];
  const JENIS_TUNTUTAN = ['Perjalanan (km)', 'Makan / elaun luar kawasan', 'Tol & parkir', 'Bahan / alat dibeli sendiri', 'Lain-lain'];
  // Aliran kelulusan bagi setiap jenis permohonan: status semasa → langkah seterusnya.
  const TWO_STEP = {
    dihantar: { to: 'disahkan', who: ['pengurus', 'pengarah'], label: 'Sahkan' },
    disahkan: { to: 'diluluskan', who: ['pengarah'], label: 'Lulus akhir' },
    diluluskan: { to: 'dibayar', who: ['akaun', 'pengarah'], label: 'Tanda dibayar' },
  };
  const STEP = {
    cuti: { dihantar: { to: 'diluluskan', who: ['pengurus', 'pengarah'], label: 'Luluskan cuti' } },
    pendahuluan: TWO_STEP,
    tuntutan: TWO_STEP,
    pettycash: {
      dihantar: { to: 'diluluskan', who: ['pengurus', 'pengarah'], label: 'Luluskan' },
      diluluskan: { to: 'dibayar', who: ['akaun', 'pengarah'], label: 'Tanda wang diberi' },
      dibayar: { to: 'dijelaskan', who: ['akaun', 'pengurus', 'pengarah'], label: 'Jelaskan', form: true },
    },
  };
  const stepOf = (m) => (STEP[m.jenis] || {})[m.status] || null;
  const canAct = (m, u) => { const st = stepOf(m); return !!(st && u && st.who.includes(u.peranan) && m.userId !== u.id); };
  const canReject = (m, u) => canAct(m, u) && m.status !== 'dibayar';
  function mohonQueue(u) { return (db.mohon || []).filter((m) => canAct(m, u)); }

  const tsDate = (v) => (!v ? null : v.toDate ? v.toDate() : v.seconds ? new Date(v.seconds * 1000) : null);
  const monthsBetween = (a, b) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
  function kiraHari(mula, tamat) {
    if (!mula || !tamat || tamat < mula) return 0;
    let n = 0;
    for (let t = Date.parse(mula); t <= Date.parse(tamat); t += 864e5) if (new Date(t).getUTCDay() !== 0) n++;
    return n;
  }
  function jarakMeter(a, b) {
    const R = 6371000, rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function tapakPoint() {
    const lat = parseFloat(db.settings.tapakLat), lng = parseFloat(db.settings.tapakLng);
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  }

  // Hak cuti minimum Akta Kerja 1955 (seksyen 60E, 60F) ikut tempoh perkhidmatan; boleh diganti per pekerja.
  function hakCuti(u) {
    const y = u && u.tarikhMula ? (Date.now() - Date.parse(u.tarikhMula)) / (365.25 * 864e5) : 0;
    return {
      Tahunan: num(u && u.cutiTahunan) || (y >= 5 ? 16 : y >= 2 ? 12 : 8),
      Sakit: num(u && u.cutiSakit) || (y >= 5 ? 22 : y >= 2 ? 18 : 14),
      Hospital: 60,
    };
  }
  function bakiCuti(u) {
    const yr = String(new Date().getFullYear());
    const d = {};
    (db.mohon || []).filter((m) => m.jenis === 'cuti' && m.userId === (u && u.id) && m.status === 'diluluskan' && (m.mula || '').startsWith(yr))
      .forEach((m) => { d[m.jenisCuti] = (d[m.jenisCuti] || 0) + num(m.hari); });
    const h = hakCuti(u);
    return { Tahunan: h.Tahunan - (d.Tahunan || 0) - (d.Kecemasan || 0), Sakit: h.Sakit - (d.Sakit || 0), Hospital: h.Hospital - (d.Hospital || 0), hak: h, diambil: d };
  }
  function potonganBulan(m, ym) {
    if (m.jenis !== 'pendahuluan' || m.status !== 'dibayar' || !m.bulanPotong) return 0;
    const n = Math.max(1, num(m.ansuran) || 1), i = monthsBetween(m.bulanPotong, ym);
    return i >= 0 && i < n ? num(m.jumlah) / n : 0;
  }

  function flagsHadir(h) {
    const f = [];
    if (!h) return f;
    if (h.masuk && db.settings.waktuMasuk && h.masuk > db.settings.waktuMasuk) f.push('Lewat');
    if (!(h.fotoMasuk || []).length) f.push('Tiada swafoto');
    if (!h.gpsMasuk) f.push('Tiada lokasi');
    if (num(h.jarakMasuk) > num(db.settings.radius) && tapakPoint()) f.push(`Jauh dari tapak (${Math.round(h.jarakMasuk)} m)`);
    if (h.keluar && num(h.jarakKeluar) > num(db.settings.radius) && tapakPoint()) f.push(`Keluar jauh dari tapak (${Math.round(h.jarakKeluar)} m)`);
    const sv = tsDate(h.masukServer);
    if (sv) {
      const local = Date.parse(`${h.tarikh}T${h.masuk}:00`);
      if (Math.abs(sv.getTime() - local) > 10 * 60000) f.push('Masa telefon berbeza');
    }
    return f;
  }
  function jamHadir(h) {
    if (!h || !h.masuk || !h.keluar) return 0;
    const [a, b] = [h.masuk, h.keluar].map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));
    return Math.max(0, Math.round(((b - a) / 60) * 10) / 10);
  }

  function flagsMohon(m) {
    const f = [];
    const u = db.users.find((x) => x.id === m.userId) || {};
    const others = (db.mohon || []).filter((o) => o.userId === m.userId && o.id !== m.id && o.jenis === m.jenis);
    if (m.jenis === 'cuti' && m.status === 'dihantar') {
      const b = bakiCuti(u);
      if (['Tahunan', 'Kecemasan'].includes(m.jenisCuti) && num(m.hari) > b.Tahunan) f.push('Melebihi baki cuti tahunan');
      if (m.jenisCuti === 'Sakit' && num(m.hari) > b.Sakit) f.push('Melebihi baki cuti sakit');
      if (['Sakit', 'Hospital'].includes(m.jenisCuti) && !(m.lampiran || []).length) f.push('Tiada sijil cuti sakit');
    }
    if (m.jenis === 'pendahuluan') {
      if (num(m.jumlah) > num(db.settings.hadPendahuluan)) f.push('Melebihi had pendahuluan');
      const aktif = others.filter((o) => ['dihantar', 'disahkan', 'diluluskan'].includes(o.status) || (o.status === 'dibayar' && o.bulanPotong && monthsBetween(o.bulanPotong, thisMonth()) < Math.max(1, num(o.ansuran) || 1) - 1));
      if (aktif.length) f.push('Ada pendahuluan belum selesai');
    }
    if (m.jenis === 'pettycash') {
      if (others.some((o) => o.status === 'dibayar')) f.push('Petty cash lama belum dijelaskan');
      if (m.status === 'dibayar' && m.tarikhBayar && daysBetween(m.tarikhBayar, today()) > num(db.settings.hariJelasPetty)) f.push('Lewat dijelaskan');
    }
    if (m.jenis === 'tuntutan') {
      if (m.jenisTuntutan === 'Perjalanan (km)') { if (!num(m.km)) f.push('Tiada jarak perjalanan'); }
      else if (!(m.resitT || []).length) f.push('Tiada resit');
    }
    return f;
  }
  function mohonSummary(m) {
    if (m.jenis === 'cuti') return [`${m.jenisCuti} · ${fmtDate(m.mula)}${m.tamat !== m.mula ? ' – ' + fmtDate(m.tamat) : ''}`, `${m.hari} hari`];
    if (m.jenis === 'pendahuluan') return [`${m.sebab || '—'} · potong ${num(m.ansuran) > 1 ? m.ansuran + ' bulan' : 'sekali'} dari ${m.bulanPotong ? monthName(m.bulanPotong) : '—'}`, rm(m.jumlah)];
    if (m.jenis === 'pettycash') return [`${m.tujuan || '—'}${kodOf(m.kodId) ? ' · ' + kodOf(m.kodId).kod : ''}`, rm(m.jumlah)];
    return [`${m.jenisTuntutan}${m.keterangan ? ' · ' + m.keterangan : ''}`, rm(m.jumlah)];
  }

  // ----- Apps Pekerja: kehadiran -----
  function viewHadir() {
    const u = me(), t = today();
    const h = db.hadir.find((x) => x.userId === u.id && x.tarikh === t);
    const mode = !h ? 'masuk' : !h.keluar ? 'keluar' : 'siap';
    if (mode === 'siap') {
      return `${topbar('Kehadiran', '#home')}<main class="wrap"><div class="card stack"><h2>Kehadiran hari ini lengkap</h2><div>Masuk ${esc(h.masuk)} · keluar ${esc(h.keluar)} · ${jamHadir(h)} jam</div><div>${flagPills(flagsHadir(h))}</div></div><a class="btn block" href="#home">Kembali</a></main>`;
    }
    if (!state.draft || state.draft._form !== 'hadir' || state.draft._mode !== mode) {
      state.draft = { _form: 'hadir', _mode: mode, foto: [], gps: null, gpsMsg: 'Mendapatkan lokasi…' };
      setTimeout(ambilLokasi, 50);
    }
    return `${topbar(mode === 'masuk' ? 'Masuk Kerja' : 'Keluar Kerja', '#home')}
    <main class="wrap">
      <form class="stack" data-form="hadir">
        <div class="card" style="text-align:center"><div class="muted small">${fmtDate(t)}</div><div style="font-size:40px;font-weight:700;color:var(--ink)" id="jam-kini">${nowTime()}</div>${mode === 'keluar' ? `<div class="small">Masuk pada ${esc(h.masuk)}</div>` : ''}</div>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Swafoto (wajib)${photoGrid('foto', ['Swafoto'], 'user')}</div>
        <div class="card small" id="gps-box">${gpsBox()}</div>
        <label class="f">Catatan (pilihan)<input class="i" name="nota" placeholder="Contoh: terus ke tapak pembekal"></label>
        <button class="btn primary block" type="submit">${mode === 'masuk' ? 'Rekod masuk kerja' : 'Rekod keluar kerja'}</button>
        <div class="muted tiny">Swafoto dan lokasi hanya digunakan untuk rekod kehadiran dan disimpan dalam sistem Kaiser.</div>
      </form>
    </main>`;
  }
  function gpsBox() {
    const g = state.draft && state.draft.gps, tp = tapakPoint();
    if (!g) return `<div class="row between"><span>${esc((state.draft && state.draft.gpsMsg) || '')}</span><button type="button" class="btn sm" data-a="ambilLokasi">Cuba lagi</button></div>`;
    const d = tp ? jarakMeter(g, tp) : null;
    return `<div class="row between"><span>Lokasi diperoleh (±${Math.round(g.acc)} m)${d != null ? ` · ${Math.round(d)} m dari tapak` : ''}</span>${d != null ? (d > num(db.settings.radius) ? '<span class="pill p-flag">Jauh dari tapak</span>' : '<span class="pill p-okflag">Di tapak</span>') : ''}</div>`;
  }
  function ambilLokasi() {
    if (!state.draft || state.draft._form !== 'hadir') return;
    const box = () => { const b = $('#gps-box'); if (b) b.innerHTML = gpsBox(); };
    if (!navigator.geolocation) { state.draft.gpsMsg = 'Telefon ini tidak menyokong lokasi.'; box(); return; }
    state.draft.gpsMsg = 'Mendapatkan lokasi…'; box();
    try {
      navigator.geolocation.getCurrentPosition((p) => {
        if (!state.draft || state.draft._form !== 'hadir') return;
        state.draft.gps = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
        box();
      }, (e) => { if (state.draft) { state.draft.gpsMsg = e.code === 1 ? 'Kebenaran lokasi ditolak. Benarkan lokasi dalam tetapan pelayar.' : 'Lokasi tidak dapat diperoleh.'; box(); } }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    } catch (e) { state.draft.gpsMsg = 'Lokasi tidak tersedia di sini.'; box(); }
  }

  // ----- Apps Pekerja: borang permohonan -----
  function viewMohon(jenis) {
    if (!MOHON[jenis]) return viewPermohonanSaya();
    const u = me(), s = db.settings;
    if (!state.draft || state.draft._form !== 'mohon' || state.draft._jenis !== jenis) state.draft = { _form: 'mohon', _jenis: jenis, lampiran: [], resitT: [] };
    let body = '';
    if (jenis === 'cuti') {
      const b = bakiCuti(u);
      body = `<div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))">
          <div class="card kpi" style="text-align:center;padding:10px"><div class="v">${b.Tahunan}</div><div class="l">Baki tahunan</div></div>
          <div class="card kpi" style="text-align:center;padding:10px"><div class="v">${b.Sakit}</div><div class="l">Baki sakit</div></div>
          <div class="card kpi" style="text-align:center;padding:10px"><div class="v">${b.Hospital}</div><div class="l">Baki hospital</div></div></div>
        <label class="f">Jenis cuti<select class="i" name="jenisCuti" required>${JENIS_CUTI.map((j) => `<option>${j}</option>`).join('')}</select></label>
        <div class="grid2"><label class="f">Dari<input class="i" type="date" name="mula" value="${today()}" required data-a-change="kiraHari"></label><label class="f">Hingga<input class="i" type="date" name="tamat" value="${today()}" required data-a-change="kiraHari"></label></div>
        <div class="small" id="hari-cuti">${kiraHari(today(), today())} hari bekerja (Ahad tidak dikira)</div>
        <label class="f">Sebab<textarea class="i" name="sebab" required></textarea></label>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Lampiran (sijil cuti sakit / dokumen)${photoGrid('lampiran', [''])}</div>`;
    } else if (jenis === 'pendahuluan') {
      const nx = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; })();
      body = `<div class="notice small">Had pendahuluan: ${rm(s.hadPendahuluan)}. Jumlah ini akan dipotong daripada gaji mengikut jadual yang dipilih.</div>
        <label class="f">Jumlah (RM)<input class="i" type="number" min="1" step="0.01" name="jumlah" inputmode="decimal" required></label>
        <label class="f">Sebab<textarea class="i" name="sebab" required></textarea></label>
        <div class="grid2"><label class="f">Cara potongan<select class="i" name="ansuran"><option value="1">Sekali gus</option><option value="2">2 bulan</option><option value="3">3 bulan</option><option value="4">4 bulan</option></select></label>
        <label class="f">Mula dipotong<input class="i" type="month" name="bulanPotong" value="${nx}" required></label></div>`;
    } else if (jenis === 'pettycash') {
      body = `<div class="notice small">Wang petty cash mesti dijelaskan dengan resit belian dalam ${esc(s.hariJelasPetty)} hari. Baki dipulangkan kepada akaun.</div>
        <label class="f">Jumlah diperlukan (RM)<input class="i" type="number" min="1" step="0.01" name="jumlah" inputmode="decimal" required></label>
        <label class="f">Tujuan<textarea class="i" name="tujuan" required placeholder="Contoh: beli bahan baiki paip Blok B"></textarea></label>
        <label class="f">Kod kerja<select class="i" name="kodId">${kodOptions('', true)}</select></label>
        <label class="f">Tarikh diperlukan<input class="i" type="date" name="tarikhPerlu" value="${today()}"></label>`;
    } else {
      body = `<label class="f">Jenis tuntutan<select class="i" name="jenisTuntutan">${JENIS_TUNTUTAN.map((j) => `<option>${j}</option>`).join('')}</select></label>
        <div class="grid2"><label class="f">Tarikh belanja<input class="i" type="date" name="tarikhBelanja" value="${today()}" required></label>
        <label class="f">Jumlah (RM)<input class="i" type="number" min="0" step="0.01" name="jumlah" inputmode="decimal"></label></div>
        <label class="f">Jarak perjalanan (km)<input class="i" type="number" min="0" step="0.1" name="km" inputmode="decimal"></label>
        <div class="muted tiny">${num(s.kadarKm) ? `Untuk perjalanan, jumlah dikira automatik: km × ${rm(s.kadarKm)}.` : 'Kadar per km belum ditetapkan oleh Pengarah; isi jumlah sendiri.'}</div>
        <label class="f">Keterangan<textarea class="i" name="keterangan" required placeholder="Contoh: ke Gebeng ambil bahan untuk VO-002"></textarea></label>
        <label class="f">Kod kerja (jika berkaitan projek)<select class="i" name="kodId">${kodOptions('', true)}</select></label>
        <div class="f" style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600">Gambar resit${photoGrid('resitT', [''])}</div>`;
    }
    return `${topbar(MOHON[jenis].nama, '#home')}
    <main class="wrap"><form class="stack" data-form="mohon" data-jenis="${jenis}">${body}<button class="btn primary block" type="submit">Hantar permohonan</button></form></main>`;
  }

  function viewPermohonanSaya() {
    const u = me();
    const mine = (db.mohon || []).filter((m) => m.userId === u.id).sort((a, b) => (a.tarikh < b.tarikh ? 1 : -1));
    return `${topbar('Permohonan Saya', '#home')}
    <main class="wrap"><div class="stack" style="gap:8px">${mine.length ? mine.map((m) => {
      const [d, a] = mohonSummary(m);
      return `<button class="item" data-a="openMohon" data-id="${m.id}"><span><span class="t">${esc(MOHON[m.jenis].pendek)} · ${esc(a)}</span><br><span class="muted tiny">${fmtDate(m.tarikh)} · ${esc(d)}</span></span>${pill(m.status)}</button>`;
    }).join('') : '<div class="muted">Belum ada permohonan.</div>'}</div></main>`;
  }

  // ----- Apps Pentadbiran: kehadiran -----
  function viewAHadir() {
    const day = state.hariHadir || today();
    const users = fieldUsers();
    const onLeave = (uid2) => (db.mohon || []).find((m) => m.jenis === 'cuti' && m.userId === uid2 && m.status === 'diluluskan' && m.mula <= day && m.tamat >= day);
    const rows = users.map((u) => ({ u, h: db.hadir.find((x) => x.userId === u.id && x.tarikh === day), c: onLeave(u.id) }));
    const hadir = rows.filter((r) => r.h).length, lewat = rows.filter((r) => r.h && flagsHadir(r.h).includes('Lewat')).length, cuti = rows.filter((r) => !r.h && r.c).length;
    const thumb = (arr) => ((arr || [])[0] ? `<img ${imgAttr(arr[0])} alt="Swafoto" data-a="zoom" style="width:44px;height:44px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-right:6px;cursor:zoom-in">` : '');
    return adminShell('hadir', `
      <div class="row between" style="align-items:flex-end"><div><h1>Kehadiran</h1><div class="muted small">Swafoto, lokasi dan masa pelayan bagi setiap kakitangan tapak.</div></div>
        <label class="f">Tarikh<input class="i" type="date" value="${day}" data-a-change="setHariHadir"></label></div>
      <div class="kpis">
        <div class="card kpi"><div class="l">Hadir</div><div class="v">${hadir} / ${users.length}</div></div>
        <div class="card kpi"><div class="l">Lewat</div><div class="v" style="color:${lewat ? 'var(--warn)' : 'var(--ink)'}">${lewat}</div></div>
        <div class="card kpi"><div class="l">Bercuti</div><div class="v">${cuti}</div></div>
        <div class="card kpi"><div class="l">Tiada rekod</div><div class="v" style="color:${users.length - hadir - cuti ? 'var(--bad)' : 'var(--ink)'}">${users.length - hadir - cuti}</div></div>
      </div>
      <section class="card"><div class="tbl"><table><thead><tr><th>Nama</th><th>Peranan</th><th>Masuk</th><th>Keluar</th><th class="n">Jam</th><th>Semakan</th></tr></thead><tbody>
      ${rows.map(({ u, h, c }) => `<tr><td>${esc(u.nama)}</td><td>${PERANAN[u.peranan]}</td>
        <td>${h ? `${thumb(h.fotoMasuk)}${esc(h.masuk)}` : c ? `<span class="pill p-vo">Cuti ${esc(c.jenisCuti)}</span>` : '<span class="muted">—</span>'}</td>
        <td>${h && h.keluar ? `${thumb(h.fotoKeluar)}${esc(h.keluar)}` : h ? '<span class="muted">Belum keluar</span>' : ''}</td>
        <td class="n">${h ? jamHadir(h) || '—' : ''}</td>
        <td>${h ? flagPills(flagsHadir(h)) : c ? '' : '<span class="pill p-flag">Tiada rekod</span>'}${h && h.nota ? `<div class="tiny muted">${esc(h.nota)}</div>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Belum ada pekerja atau penyelia didaftarkan.</td></tr>'}
      </tbody></table></div></section>`);
  }

  // ----- Apps Pentadbiran: permohonan staf -----
  function viewAMohon() {
    const u = me();
    const fj = state.mohonJenis || 'semua', fs2 = state.mohonStatus || 'tindakan';
    let list = (db.mohon || []).slice();
    if (fj !== 'semua') list = list.filter((m) => m.jenis === fj);
    if (fs2 === 'tindakan') list = list.filter((m) => canAct(m, u));
    else if (fs2 === 'aktif') list = list.filter((m) => !!stepOf(m));
    list.sort((a, b) => (a.tarikh < b.tarikh ? 1 : -1));
    const cnt = (j) => mohonQueue(u).filter((m) => m.jenis === j).length;
    return adminShell('mohon', `
      <div><h1>Permohonan staf</h1><div class="muted small">Cuti, tuntutan, petty cash dan pendahuluan gaji daripada Apps Pekerja.</div></div>
      <div class="kpis">${Object.keys(MOHON).map((j) => `<div class="card kpi"><div class="l">${MOHON[j].pendek} menunggu anda</div><div class="v">${cnt(j)}</div></div>`).join('')}</div>
      <div class="row">
        <label class="f">Jenis<select class="i" data-a-change="setMohonJenis"><option value="semua">Semua</option>${Object.keys(MOHON).map((j) => `<option value="${j}" ${fj === j ? 'selected' : ''}>${MOHON[j].pendek}</option>`).join('')}</select></label>
        <label class="f">Papar<select class="i" data-a-change="setMohonStatus"><option value="tindakan" ${fs2 === 'tindakan' ? 'selected' : ''}>Perlu tindakan saya</option><option value="aktif" ${fs2 === 'aktif' ? 'selected' : ''}>Semua yang aktif</option><option value="semua" ${fs2 === 'semua' ? 'selected' : ''}>Semua</option></select></label>
      </div>
      <section class="card"><div class="tbl"><table><thead><tr><th>Tarikh</th><th>Nama</th><th>Jenis</th><th>Butiran</th><th class="n">Jumlah</th><th>Semakan</th><th>Status</th></tr></thead><tbody>
      ${list.map((m) => { const [d, a] = mohonSummary(m); return `<tr style="cursor:pointer" data-a="openMohon" data-id="${m.id}"><td>${fmtDate(m.tarikh)}</td><td>${esc(userName(m.userId))}</td><td>${esc(MOHON[m.jenis].pendek)}</td><td>${esc(d)}</td><td class="n">${esc(a)}</td><td>${flagPills(flagsMohon(m))}</td><td>${pill(m.status)}</td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">Tiada permohonan.</td></tr>'}
      </tbody></table></div></section>`);
  }

  function mohonDetail(id) {
    const m = (db.mohon || []).find((x) => x.id === id);
    if (!m) return '';
    const u = me();
    const rows = [['Nama', userName(m.userId)], ['Tarikh mohon', fmtDate(m.tarikh)]];
    let imgs = [];
    if (m.jenis === 'cuti') {
      const b = bakiCuti(db.users.find((x) => x.id === m.userId) || {});
      rows.push(['Jenis cuti', m.jenisCuti], ['Tempoh', `${fmtDate(m.mula)} – ${fmtDate(m.tamat)} (${m.hari} hari)`], ['Sebab', m.sebab], ['Baki tahunan / sakit', `${b.Tahunan} / ${b.Sakit} hari`]);
      imgs = (m.lampiran || []).map((g) => ({ img: g.img, id: g.id, cap: 'Lampiran' }));
    } else if (m.jenis === 'pendahuluan') {
      rows.push(['Jumlah', rm(m.jumlah)], ['Sebab', m.sebab], ['Potongan', `${num(m.ansuran) > 1 ? `${m.ansuran} bulan × ${rm(num(m.jumlah) / num(m.ansuran))}` : 'Sekali gus'} mulai ${m.bulanPotong ? monthName(m.bulanPotong) : '—'}`]);
    } else if (m.jenis === 'pettycash') {
      rows.push(['Jumlah', rm(m.jumlah)], ['Tujuan', m.tujuan], ['Kod kerja', (kodOf(m.kodId) || {}).kod || '—'], ['Tarikh diperlukan', fmtDate(m.tarikhPerlu)]);
      if (m.tarikhBayar) rows.push(['Wang diberi', fmtDate(m.tarikhBayar)]);
      if (m.status === 'dijelaskan') rows.push(['Dibelanjakan', rm(m.jumlahGuna)], ['Baki dipulangkan', rm(num(m.jumlah) - num(m.jumlahGuna))]);
    } else {
      rows.push(['Jenis', m.jenisTuntutan], ['Tarikh belanja', fmtDate(m.tarikhBelanja)], ['Jumlah', rm(m.jumlah)], ...(num(m.km) ? [['Jarak', `${m.km} km`]] : []), ['Keterangan', m.keterangan], ['Kod kerja', (kodOf(m.kodId) || {}).kod || '—']);
      imgs = (m.resitT || []).map((g) => ({ img: g.img, id: g.id, cap: 'Resit' }));
    }
    const st = stepOf(m);
    let actions = '';
    if (canAct(m, u)) {
      actions = st.form ? `<button class="btn primary" data-a="mohonJelas" data-id="${m.id}">${st.label}</button>` : `<button class="btn primary" data-a="mohonStep" data-id="${m.id}">${st.label}</button>`;
      if (canReject(m, u)) actions += ` <button class="btn danger" data-a="mohonTolak" data-id="${m.id}">Tolak</button>`;
    } else if (m.userId === u.id && m.status === 'dihantar') {
      actions = `<button class="btn danger" data-a="mohonBatal" data-id="${m.id}">Batalkan permohonan</button>`;
    } else if (st && isAdmin(u) && m.userId === u.id) {
      actions = '<div class="muted small">Permohonan anda sendiri perlu diluluskan oleh orang lain.</div>';
    }
    const hist = (m.history || []).slice().reverse();
    return `<div class="row between"><h2>${esc(MOHON[m.jenis].nama)}</h2>${pill(m.status)}</div>
      <div>${flagPills(flagsMohon(m))}</div>
      ${m.nota ? `<div class="notice bad"><b>Nota:</b> ${esc(m.nota)}</div>` : ''}
      <div class="tbl"><table style="min-width:0"><tbody>${rows.map(([a, b]) => `<tr><th style="width:38%">${esc(a)}</th><td style="white-space:pre-line">${esc(b)}</td></tr>`).join('')}</tbody></table></div>
      ${imgs.length ? `<div class="thumbs">${imgs.map((g) => `<img ${imgAttr(g)} alt="${esc(g.cap)}" data-a="zoom">`).join('')}</div>` : ''}
      ${actions ? `<div class="row" id="mohon-actions">${actions}</div>` : ''}
      ${hist.length ? `<details><summary class="small">Sejarah (${hist.length})</summary><ul class="small">${hist.map((h) => `<li>${esc(new Date(h.t).toLocaleString('ms-MY'))} · ${esc(userName(h.by))} · ${esc(h.act)}${h.nota ? ` · “${esc(h.nota)}”` : ''}</li>`).join('')}</ul></details>` : ''}
      <div><button class="btn" data-a="closeModal">Tutup</button></div>`;
  }

  function saveMohon(m, act, nota) {
    (m.history = m.history || []).push({ t: new Date().toISOString(), by: state.userId, act, nota: nota || '' });
    commit(`${m.jenis}: ${act}`, m.id, [['mohon', m]]);
  }
  const findMohon = (id) => (db.mohon || []).find((x) => x.id === id);

  const STAF_ACTIONS = {
    ambilLokasi() { ambilLokasi(); },
    openMohon(el) { openModal(mohonDetail(el.dataset.id)); },
    mohonStep(el) {
      const m = findMohon(el.dataset.id), u = me();
      if (!m || !canAct(m, u)) return;
      const st = stepOf(m);
      m.status = st.to; m.nota = '';
      if (st.to === 'dibayar') m.tarikhBayar = today();
      saveMohon(m, STATUS_LABEL[st.to]);
      closeModal(); toast(`${MOHON[m.jenis].pendek}: ${STATUS_LABEL[st.to].toLowerCase()}`); render();
    },
    mohonTolak(el) {
      $('#mohon-actions').outerHTML = `<form class="stack" data-form="mohonTolak" data-id="${el.dataset.id}"><label class="f">Sebab ditolak<textarea class="i" name="nota" required></textarea></label><div><button class="btn danger" type="submit">Tolak permohonan</button></div></form>`;
    },
    mohonJelas(el) {
      const m = findMohon(el.dataset.id);
      $('#mohon-actions').outerHTML = `<form class="stack" data-form="mohonJelas" data-id="${m.id}"><label class="f">Jumlah dibelanjakan ikut resit (RM)<input class="i" type="number" step="0.01" min="0" max="${esc(m.jumlah)}" name="jumlahGuna" required></label><div class="muted tiny">Baki = ${rm(m.jumlah)} tolak jumlah dibelanjakan, mesti dipulangkan kepada akaun. Pastikan resit telah direkod dalam Belian / Resit.</div><div><button class="btn primary" type="submit">Sahkan penjelasan</button></div></form>`;
    },
    mohonBatal(el) {
      if (!confirmInline(el, 'Tekan sekali lagi untuk batal')) return;
      const m = findMohon(el.dataset.id);
      m.status = 'dibatalkan'; saveMohon(m, 'Dibatalkan');
      closeModal(); toast('Permohonan dibatalkan'); render();
    },
    lokasiTapak() {
      if (!navigator.geolocation) { toast('Lokasi tidak disokong'); return; }
      toast('Mendapatkan lokasi…');
      navigator.geolocation.getCurrentPosition((p) => {
        const f = $('form[data-form=settings]');
        f.elements.namedItem('tapakLat').value = p.coords.latitude.toFixed(6);
        f.elements.namedItem('tapakLng').value = p.coords.longitude.toFixed(6);
        toast('Lokasi diisi. Tekan Simpan tetapan.');
      }, () => toast('Lokasi tidak dapat diperoleh'), { enableHighAccuracy: true, timeout: 15000 });
    },
  };

  const STAF_CHANGE = {
    kiraHari() { const f = $('form[data-form=mohon]'); const n = kiraHari(f.elements.namedItem('mula').value, f.elements.namedItem('tamat').value); $('#hari-cuti').textContent = `${n} hari bekerja (Ahad tidak dikira)`; },
    setHariHadir(el) { state.hariHadir = el.value; render(); },
    setMohonJenis(el) { state.mohonJenis = el.value; render(); },
    setMohonStatus(el) { state.mohonStatus = el.value; render(); },
  };

  const STAF_FORMS = {
    hadir(fd) {
      const d = state.draft, u = me(), t = today(), mode = d._mode;
      if (!d.foto.length) { toast('Ambil swafoto dahulu'); return; }
      const tp = tapakPoint();
      const jarak = d.gps && tp ? Math.round(jarakMeter(d.gps, tp)) : null;
      let h = db.hadir.find((x) => x.userId === u.id && x.tarikh === t);
      const foto = persistPhotos(d.foto);
      if (mode === 'masuk') {
        h = { id: uid(), userId: u.id, tarikh: t, masuk: nowTime(), keluar: '', fotoMasuk: foto, gpsMasuk: d.gps, jarakMasuk: jarak, nota: (fd.nota || '').trim() };
        db.hadir.push(h);
      } else {
        Object.assign(h, { keluar: nowTime(), fotoKeluar: foto, gpsKeluar: d.gps, jarakKeluar: jarak, nota: [h.nota, (fd.nota || '').trim()].filter(Boolean).join(' · ') });
      }
      if (commit(mode === 'masuk' ? 'masuk kerja' : 'keluar kerja', h.id, [['hadir', h]])) {
        if (CLOUD) setTimeout(() => fs.collection('hadir').doc(h.id).update({ [mode + 'Server']: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {}), 300);
        else { h[mode + 'Server'] = { seconds: Math.floor(Date.now() / 1000) }; Store.save(db); }
        state.draft = null;
        const fl = flagsHadir(h);
        toast(mode === 'masuk' ? `Masuk kerja ${h.masuk} direkod${fl.length ? ' · ' + fl.join(', ') : ''}` : `Keluar kerja ${h.keluar} direkod`);
        location.hash = '#home';
      }
    },
    mohon(fd, form) {
      const jenis = form.dataset.jenis, d = state.draft;
      const m = { id: uid(), jenis, userId: state.userId, tarikh: today(), status: 'dihantar', nota: '', history: [{ t: new Date().toISOString(), by: state.userId, act: 'Dihantar' }] };
      if (jenis === 'cuti') {
        if (fd.tamat < fd.mula) { toast('Tarikh tamat sebelum tarikh mula'); return; }
        Object.assign(m, { jenisCuti: fd.jenisCuti, mula: fd.mula, tamat: fd.tamat, hari: kiraHari(fd.mula, fd.tamat), sebab: fd.sebab.trim(), lampiran: persistPhotos(d.lampiran) });
        if (!m.hari) { toast('Tempoh cuti tiada hari bekerja'); return; }
      } else if (jenis === 'pendahuluan') {
        Object.assign(m, { jumlah: num(fd.jumlah), sebab: fd.sebab.trim(), ansuran: num(fd.ansuran) || 1, bulanPotong: fd.bulanPotong });
      } else if (jenis === 'pettycash') {
        Object.assign(m, { jumlah: num(fd.jumlah), tujuan: fd.tujuan.trim(), kodId: fd.kodId || '', tarikhPerlu: fd.tarikhPerlu });
      } else {
        const km = num(fd.km), kadar = num(db.settings.kadarKm);
        let jumlah = num(fd.jumlah);
        if (fd.jenisTuntutan === 'Perjalanan (km)' && km && kadar && !jumlah) jumlah = Math.round(km * kadar * 100) / 100;
        if (!jumlah) { toast('Isi jumlah tuntutan'); return; }
        Object.assign(m, { jenisTuntutan: fd.jenisTuntutan, tarikhBelanja: fd.tarikhBelanja, jumlah, km, keterangan: fd.keterangan.trim(), kodId: fd.kodId || '', resitT: persistPhotos(d.resitT) });
      }
      db.mohon.push(m);
      if (commit(`mohon ${jenis}`, m.id, [['mohon', m]])) {
        state.draft = null;
        const f = flagsMohon(m);
        toast(`${MOHON[jenis].pendek} dihantar${f.length ? ' · ' + f.join(', ') : ''}`);
        location.hash = '#permohonan';
      }
    },
    mohonTolak(fd, form) {
      const m = findMohon(form.dataset.id);
      m.status = 'ditolak'; m.nota = fd.nota.trim(); saveMohon(m, 'Ditolak', m.nota);
      closeModal(); toast('Permohonan ditolak'); render();
    },
    mohonJelas(fd, form) {
      const m = findMohon(form.dataset.id);
      m.jumlahGuna = num(fd.jumlahGuna); m.status = 'dijelaskan'; m.tarikhJelas = today();
      saveMohon(m, `Dijelaskan · guna ${rm(m.jumlahGuna)}, baki ${rm(num(m.jumlah) - m.jumlahGuna)}`);
      closeModal(); toast('Petty cash dijelaskan'); render();
    },
  };

  // Ringkasan bulanan untuk pemprosesan gaji (input kepada sistem gaji / akaun).
  function gajiRows(ym) {
    const head = [['Nama', 'Peranan', 'Hari hadir', 'Jumlah jam', 'Hari lewat', 'Cuti tahunan', 'Cuti sakit/hospital', 'Cuti tanpa gaji', 'Cuti lain', 'Potongan pendahuluan (RM)', 'Tuntutan dibayar (RM)', 'Petty cash belum dijelaskan (RM)']];
    const inYm = (d) => (d || '').slice(0, 7) === ym;
    const cutiHari = (m) => { let n = 0; for (let t = Date.parse(m.mula); t <= Date.parse(m.tamat); t += 864e5) { const ds = new Date(t).toISOString().slice(0, 10); if (inYm(ds) && new Date(t).getUTCDay() !== 0) n++; } return n; };
    return head.concat(db.users.filter((u) => u.aktif !== false).map((u) => {
      const hs = db.hadir.filter((h) => h.userId === u.id && inYm(h.tarikh));
      const ms = (db.mohon || []).filter((m) => m.userId === u.id);
      const cuti = (types) => ms.filter((m) => m.jenis === 'cuti' && m.status === 'diluluskan' && types.includes(m.jenisCuti)).reduce((a, m) => a + cutiHari(m), 0);
      return [u.nama, PERANAN[u.peranan], hs.length, hs.reduce((a, h) => a + jamHadir(h), 0), hs.filter((h) => flagsHadir(h).includes('Lewat')).length,
        cuti(['Tahunan', 'Kecemasan']), cuti(['Sakit', 'Hospital']), cuti(['Tanpa gaji']), cuti(['Bersalin / paterniti', 'Lain-lain']),
        ms.reduce((a, m) => a + potonganBulan(m, ym), 0).toFixed(2),
        ms.filter((m) => m.jenis === 'tuntutan' && m.status === 'dibayar' && inYm(m.tarikhBayar)).reduce((a, m) => a + num(m.jumlah), 0).toFixed(2),
        ms.filter((m) => m.jenis === 'pettycash' && m.status === 'dibayar').reduce((a, m) => a + num(m.jumlah), 0).toFixed(2)];
    }));
  }


  // ---------- Modal butiran rekod ----------
  function recDetail(type, id) {
    const u = me();
    let r, flags, rows = [], imgs = [];
    if (type === 'belian') {
      r = db.belian.find((x) => x.id === id); if (!r) return '';
      flags = flagsBelian(r);
      rows = [['Tarikh', fmtDate(r.tarikh)], ['Oleh', userName(r.userId)], ['Kod kerja', (kodOf(r.kodId) || {}).kod || '—'], ['Skop', skopOf((kodOf(r.kodId) || {}).skop).nama], ['Pembekal', r.pembekal], ['No. resit', r.noResit || '—'], ['Barang', r.item], ['Jumlah', rm(r.jumlah)], ['Bayaran', r.bayaran + (r.bayaran === 'PO' ? ` · ${r.noPO || 'tiada no. PO'}` : '')]];
      imgs = (r.resit || []).map((g) => ({ img: g.img, id: g.id, cap: 'Resit' }));
    } else if (type === 'laporan') {
      r = db.laporan.find((x) => x.id === id); if (!r) return '';
      flags = flagsLaporan(r);
      rows = [['Tarikh', fmtDate(r.tarikh)], ['Oleh', userName(r.userId)], ['Kod kerja', (kodOf(r.kodId) || {}).kod || '—'], ['Skop', skopOf((kodOf(r.kodId) || {}).skop).nama], ['Lokasi', r.lokasi], ['Tugas', r.tugas], ['Pekerja', r.pekerja], ['Jam', r.jam], ['Bahan', r.bahan || '—']];
      imgs = r.gambar || [];
    } else {
      const k = db.kod.find((x) => x.id === id); if (!k) return '';
      r = Object.assign({}, k, { status: k.semak || 'disahkan' });
      flags = flagsVO(k);
      rows = [['Tarikh', fmtDate(k.tarikh)], ['Dibuka oleh', userName(k.userId)], ['Kod VO', k.kod], ['Skop', skopOf(k.skop).nama], ['Kerja', k.penerangan], ['Lokasi', k.lokasi || '—'], ['Diarahkan oleh', k.pemberiArahan || '—'], ['Cara arahan', k.caraArahan || '—'], ['Status VO', k.voStatus], ['Kos setakat ini', rm(kosKod(k.id))], ['Jam setakat ini', jamKod(k.id)]];
      imgs = (k.bukti || []).map((g) => ({ img: g.img, id: g.id, cap: 'Bukti arahan' }));
    }
    const own = r.userId === u.id;
    let actions = '';
    if (isAdmin(u) && u.peranan !== 'akaun' && !own) {
      if (r.status === 'dihantar') actions = `<button class="btn primary" data-a="review" data-v="sahkan" data-type="${type}" data-id="${id}">Sahkan</button>`;
      if (r.status === 'disahkan' && u.peranan === 'pengarah') actions = `<button class="btn primary" data-a="review" data-v="lulus" data-type="${type}" data-id="${id}">Lulus akhir</button>`;
      if (u.peranan === 'pengarah' && r.status === 'dihantar') actions += ` <button class="btn" data-a="review" data-v="lulusTerus" data-type="${type}" data-id="${id}">Sahkan &amp; lulus</button>`;
      if (['dihantar', 'disahkan'].includes(r.status)) actions += ` <button class="btn danger" data-a="review" data-v="kembali" data-type="${type}" data-id="${id}">Kembalikan</button>`;
    } else if (isAdmin(u) && own && ['dihantar', 'disahkan'].includes(r.status)) {
      actions = '<div class="muted small">Rekod anda sendiri perlu disemak oleh orang lain.</div>';
    }
    if (own && r.status === 'dikembalikan' && type !== 'vo') actions = `<a class="btn primary" href="#${type}-${id}" data-a="closeModal">Betulkan &amp; hantar semula</a>`;
    const hist = (r.history || []).slice().reverse();
    return `<div class="row between"><h2>${{ belian: 'Resit / belian', laporan: 'Laporan kerja', vo: 'Arahan kerja tambahan' }[type]}</h2>${pill(r.status)}</div>
      <div>${flagPills(flags)}</div>
      ${r.nota ? `<div class="notice bad"><b>Nota:</b> ${esc(r.nota)}</div>` : ''}
      <div class="tbl"><table style="min-width:0"><tbody>${rows.map(([a, b]) => `<tr><th style="width:38%">${esc(a)}</th><td style="white-space:pre-line">${esc(b)}</td></tr>`).join('')}</tbody></table></div>
      ${imgs.length ? `<div class="thumbs">${imgs.map((g) => `<img ${imgAttr(g)} alt="${esc(g.cap || 'Gambar')}" data-a="zoom">`).join('')}</div>` : '<div class="muted small">Tiada gambar.</div>'}
      ${actions ? `<div class="row" id="rev-actions">${actions}</div>` : ''}
      ${hist.length ? `<details><summary class="small">Sejarah (${hist.length})</summary><ul class="small">${hist.map((h) => `<li>${esc(new Date(h.t).toLocaleString('ms-MY'))} · ${esc(userName(h.by))} · ${esc(h.act)}${h.nota ? ` · “${esc(h.nota)}”` : ''}</li>`).join('')}</ul></details>` : ''}
      <div><button class="btn" data-a="closeModal">Tutup</button></div>`;
  }

  function openModal(html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal'; m.id = 'modal';
    m.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`;
    setTimeout(hydrateImages, 0);
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
    const f = m.querySelector('button, a, select, input'); if (f) f.focus();
  }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  // ---------- Router ----------
  function render() {
    const app = $('#app');
    const u = me();
    const hash = location.hash.replace(/^#/, '');
    const parts = hash.split('-').filter(Boolean);
    if (!u) { app.innerHTML = viewLogin(); return; }
    if (CLOUD && u.aktif === false) { app.innerHTML = viewLogin(); return; }
    if (parts[0] === 'a') {
      if (!isAdmin(u)) { location.hash = '#home'; return; }
      const v = parts[1] || 'dash';
      const map = { hadir: viewAHadir, mohon: viewAMohon, dash: viewDash, semak: viewSemak, skop: () => (parts[2] ? viewSkop(parts[2]) : viewSkopList()), vo: viewVOList, kod: viewKod, tunai: viewTunai, eksport: viewEksport, tetapan: () => (u.peranan === 'pengarah' ? viewTetapan() : viewDash()) };
      app.innerHTML = (map[v] || viewDash)();
    } else {
      const v = (parts[0] && parts[0] !== 'mula') ? parts[0] : (isAdmin(u) ? 'admin' : 'home');
      if (v === 'admin') { location.hash = '#a-dash'; return; }
      if (!['laporan', 'belian', 'vo', 'hadir', 'mohon'].includes(v)) state.draft = null;
      const map = { home: viewHome, laporan: () => viewLaporan(parts[1]), belian: () => viewBelian(parts[1]), vo: viewVO, rekod: viewRekod, hadir: viewHadir, mohon: () => viewMohon(parts[1]), permohonan: viewPermohonanSaya };
      app.innerHTML = (map[v] || viewHome)();
    }
    if (state.lastHash !== hash) window.scrollTo(0, 0);
    state.lastHash = hash;
    hydrateImages();
  }

  // Lukis semula hanya grid gambar supaya isian borang tidak hilang.
  function refreshPhotos(field) {
    const el = $('#ph-' + field); if (!el) return;
    const caps = field === 'gambar' ? ['Sebelum', 'Semasa', 'Selepas'] : field === 'foto' ? ['Swafoto'] : [''];
    el.outerHTML = photoGrid(field, caps, field === 'foto' ? 'user' : 'environment');
    hydrateImages();
  }
  function rerenderKeepForm() {
    const form = $('form[data-form]');
    const vals = form ? Object.fromEntries(new FormData(form).entries()) : {};
    render();
    const f2 = $('form[data-form]');
    if (f2) Object.entries(vals).forEach(([k, v]) => { const el = f2.elements.namedItem(k); if (el && el.type !== 'file') el.value = v; });
  }

  // ---------- Tindakan ----------
  const A = {
    login(el) { state.userId = el.dataset.id; Store.setUser(state.userId); const u = me(); location.hash = isAdmin(u) ? '#a-dash' : '#home'; render(); },
    logout() { state.draft = null; location.hash = '#mula'; if (CLOUD) { Cloud.stop(); auth.signOut(); return; } state.userId = null; Store.setUser(null); render(); },
    resetPw() { const em = ($('input[name=email]') || {}).value; if (!em) { toast('Isi emel dahulu'); return; } auth.sendPasswordResetEmail(em.trim()).then(() => toast('Emel tetapan semula kata laluan dihantar')).catch((e) => toast(authMsg(e))); },
    ...STAF_ACTIONS,
    rmPhoto(el) { state.draft[el.dataset.f].splice(Number(el.dataset.i), 1); refreshPhotos(el.dataset.f); },
    setBayaran(el) { state.draft.bayaran = el.dataset.v; rerenderKeepForm(); },
    setSkop(el) { state.draft.skop = el.dataset.v; rerenderKeepForm(); },
    openMine(el) { openModal(recDetail(el.dataset.type, el.dataset.id)); },
    openRec(el) { openModal(recDetail(el.dataset.type, el.dataset.id)); },
    closeModal() { closeModal(); },
    zoom(el) { const w = document.createElement('div'); w.className = 'modal'; w.style.zIndex = 70; w.innerHTML = `<div class="box"><img class="full" src="${el.getAttribute('src')}" alt="${esc(el.alt)}"><div class="small muted">${esc(el.alt)}</div><button class="btn">Tutup</button></div>`; w.addEventListener('click', () => w.remove()); document.body.appendChild(w); },
    review(el) {
      const { type, id, v } = el.dataset;
      if (v === 'kembali') {
        const box = $('#rev-actions');
        box.outerHTML = `<form class="stack" data-form="kembali" data-type="${type}" data-id="${id}"><label class="f">Sebab dikembalikan<textarea class="i" name="nota" required placeholder="Contoh: Gambar resit tidak jelas"></textarea></label><div class="row"><button class="btn danger" type="submit">Kembalikan kepada penyelia</button></div></form>`;
        return;
      }
      const target = type === 'belian' ? db.belian.find((x) => x.id === id) : type === 'laporan' ? db.laporan.find((x) => x.id === id) : db.kod.find((x) => x.id === id);
      if (!target) return;
      const next = v === 'sahkan' ? 'disahkan' : 'diluluskan';
      if (type === 'vo') target.semak = next; else target.status = next;
      target.nota = '';
      (target.history = target.history || []).push({ t: new Date().toISOString(), by: state.userId, act: STATUS_LABEL[next] });
      commit(`${next} ${type}`, id, [[type === 'vo' ? 'kod' : type, target]]);
      closeModal(); toast(`Rekod ${STATUS_LABEL[next].toLowerCase()}`); render();
    },
    toggleKod(el) { const k = kodOf(el.dataset.id); k.status = k.status === 'Aktif' ? 'Ditutup' : 'Aktif'; commit(`kod ${k.status}`, k.id, [['kod', k]]); render(); },
    rmUser(el) {
      if (!confirmInline(el, 'Buang?')) return;
      const u = db.users.find((x) => x.id === el.dataset.id);
      if (CLOUD) { u.aktif = false; commit('nyahaktif pengguna', u.id, [['users', u]]); }
      else { db.users = db.users.filter((x) => x.id !== el.dataset.id); commit('buang pengguna', el.dataset.id); }
      render();
    },
    reset(el) { if (!confirmInline(el, 'Tekan sekali lagi untuk padam semua')) return; db = seed(); Store.save(db); toast('Data demo diset semula'); render(); },
    csv(el) { downloadCSV(el.dataset.v); },
    csvDownload() { csvDownload(); },
    csvCopy() { csvCopy(); },
  };

  // Pengesahan dua kali tekan (tanpa dialog pelayar).
  function confirmInline(el, label) {
    if (el.dataset.armed) return true;
    el.dataset.armed = '1'; const old = el.textContent; el.textContent = label;
    setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = old; } }, 3000);
    return false;
  }

  const CHANGE = {
    ...STAF_CHANGE,
    setBulan(el) { state.bulan = el.value; render(); },
    voStatus(el) { const k = kodOf(el.dataset.id); k.voStatus = el.value; (k.history = k.history || []).push({ t: new Date().toISOString(), by: state.userId, act: 'Status VO: ' + el.value }); commit('status VO', k.id, [['kod', k]]); toast('Status VO dikemas kini'); },
  };

  const FORMS = {
    ...STAF_FORMS,
    laporan(fd, form) {
      const id = state.draft._id;
      const data = { tarikh: fd.tarikh, kodId: fd.kodId, lokasi: fd.lokasi.trim(), tugas: fd.tugas.trim(), pekerja: fd.pekerja.trim(), jam: num(fd.jam), bahan: fd.bahan.trim(), gambar: persistPhotos(state.draft.gambar) };
      let r;
      if (id) {
        r = db.laporan.find((x) => x.id === id);
        Object.assign(r, data, { status: 'dihantar' });
        (r.history = r.history || []).push({ t: new Date().toISOString(), by: state.userId, act: 'Dihantar semula' });
      } else {
        r = Object.assign({ id: uid(), userId: state.userId, status: 'dihantar', nota: '', history: [{ t: new Date().toISOString(), by: state.userId, act: 'Dihantar' }] }, data);
        db.laporan.push(r);
      }
      if (commit('hantar laporan', r.id, [['laporan', r]])) { state.draft = null; toast('Laporan dihantar'); location.hash = '#home'; }
    },
    belian(fd) {
      const id = state.draft._id;
      const data = { tarikh: fd.tarikh, kodId: fd.kodId, pembekal: fd.pembekal.trim(), noResit: (fd.noResit || '').trim(), item: fd.barang.trim(), jumlah: num(fd.jumlah), bayaran: state.draft.bayaran, noPO: state.draft.bayaran === 'PO' ? (fd.noPO || '').trim() : '', resit: persistPhotos(state.draft.resit) };
      let r;
      if (id) {
        r = db.belian.find((x) => x.id === id);
        Object.assign(r, data, { status: 'dihantar' });
        (r.history = r.history || []).push({ t: new Date().toISOString(), by: state.userId, act: 'Dihantar semula' });
      } else {
        r = Object.assign({ id: uid(), userId: state.userId, status: 'dihantar', nota: '', history: [{ t: new Date().toISOString(), by: state.userId, act: 'Dihantar' }] }, data);
        db.belian.push(r);
      }
      const f = flagsBelian(r);
      if (commit('hantar resit', r.id, [['belian', r]])) { state.draft = null; toast(f.length ? `Dihantar dengan bendera: ${f.join(', ')}` : 'Resit dihantar'); location.hash = '#home'; }
    },
    vo(fd) {
      if (!state.draft.skop) { toast('Pilih skop kerja'); return; }
      const n = db.kod.filter((k) => k.jenis === 'VO').length + 1;
      let kod = `${db.settings.prefix}-VO-${String(n).padStart(3, '0')}`;
      while (db.kod.some((k) => k.kod === kod)) kod = kod.replace(/(\d+)$/, (m) => String(Number(m) + 1).padStart(3, '0'));
      const vk = { id: uid(), kod, penerangan: fd.penerangan.trim(), skop: state.draft.skop, jenis: 'VO', bajet: 0, status: 'Aktif', voStatus: 'Sedang dijalankan', lokasi: fd.lokasi.trim(), pemberiArahan: fd.pemberiArahan.trim(), caraArahan: fd.caraArahan, bukti: persistPhotos(state.draft.bukti), semak: 'dihantar', userId: state.userId, tarikh: today(), history: [{ t: new Date().toISOString(), by: state.userId, act: 'VO dibuka' }] };
      db.kod.push(vk);
      if (commit('buka VO', kod, [['kod', vk]])) { state.draft = null; toast(`Kod ${kod} dibuka. Gunakan kod ini untuk laporan dan resit.`); location.hash = '#home'; }
    },
    kembali(fd, form) {
      const { type, id } = form.dataset;
      const t = type === 'belian' ? db.belian.find((x) => x.id === id) : type === 'laporan' ? db.laporan.find((x) => x.id === id) : db.kod.find((x) => x.id === id);
      if (type === 'vo') t.semak = 'dikembalikan'; else t.status = 'dikembalikan';
      t.nota = fd.nota.trim();
      (t.history = t.history || []).push({ t: new Date().toISOString(), by: state.userId, act: 'Dikembalikan', nota: t.nota });
      commit('kembalikan ' + type, id, [[type === 'vo' ? 'kod' : type, t]]); closeModal(); toast('Rekod dikembalikan kepada penyelia'); render();
    },
    kod(fd, form) {
      if (db.kod.some((k) => k.kod.toLowerCase() === fd.kod.trim().toLowerCase())) { toast('Kod ini sudah wujud'); return; }
      const k = { id: uid(), kod: fd.kod.trim(), penerangan: fd.penerangan.trim(), skop: fd.skop, jenis: fd.jenis, bajet: num(fd.bajet), status: 'Aktif', tarikh: today(), userId: state.userId };
      if (k.jenis === 'VO') Object.assign(k, { voStatus: 'Sedang dijalankan', bukti: [], history: [] });
      db.kod.push(k); commit('buka kod', k.kod, [['kod', k]]); toast('Kod kerja disimpan'); render();
    },
    topup(fd) { const t = { id: uid(), tarikh: today(), jumlah: num(fd.jumlah), catatan: fd.catatan, oleh: state.userId }; db.tunai.push(t); commit('top-up tunai', '', [['tunai', t]]); toast('Top-up direkod'); render(); },
    kiraan(fd) { const jangka = bakiTunai().baki; const kr = { id: uid(), tarikh: today(), jumlah: num(fd.jumlah), jangka, oleh: state.userId }; db.kiraan.push(kr); commit('kiraan tunai', '', [['kiraan', kr]]); const v = num(fd.jumlah) - jangka; toast(Math.abs(v) < 0.005 ? 'Kiraan sepadan' : `Varians ${rm(v)}: perlu dijelaskan`); render(); },
    settings(fd) { Object.assign(db.settings, { klien: fd.klien, prefix: fd.prefix, hadTunai: num(fd.hadTunai), imprest: num(fd.imprest), waktuMasuk: fd.waktuMasuk || '08:00', kadarKm: num(fd.kadarKm), hadPendahuluan: num(fd.hadPendahuluan), hariJelasPetty: num(fd.hariJelasPetty) || 7, tapakLat: (fd.tapakLat || '').trim(), tapakLng: (fd.tapakLng || '').trim(), radius: num(fd.radius) || 500 }); commit('tetapan', '', [['settings', Object.assign({ id: 'main' }, db.settings)]]); toast('Tetapan disimpan'); render(); },
    user(fd, form) {
      if (!CLOUD) { db.users.push({ id: uid(), nama: fd.nama.trim(), peranan: fd.peranan, tarikhMula: fd.tarikhMula || '' }); commit('tambah pengguna', fd.nama); toast('Pengguna ditambah'); render(); return; }
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Mendaftar…';
      createCloudUser(fd).then(() => { toast(`${fd.nama} didaftarkan. Beri emel dan kata laluan sementara kepadanya.`); render(); })
        .catch((e) => { btn.disabled = false; btn.textContent = 'Tambah pengguna'; toast(authMsg(e)); });
    },
    login(fd, form) {
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Masuk…';
      auth.signInWithEmailAndPassword(fd.email.trim(), fd.password).catch((e) => { btn.disabled = false; btn.textContent = 'Log masuk'; toast(authMsg(e)); });
    },
    bootstrap(fd) { bootstrapSystem(fd.nama.trim()); },
  };

  // ---------- CSV ----------
  function downloadCSV(kind) {
    const ym = state.bulan;
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    let rows;
    if (kind === 'belian') {
      rows = [['Tarikh', 'Oleh', 'Kod kerja', 'Skop', 'Pembekal', 'No resit', 'Barang', 'Jumlah (RM)', 'Bayaran', 'No PO', 'Status', 'Bendera']]
        .concat(db.belian.filter((b) => inMonth(b, ym)).map((b) => { const k = kodOf(b.kodId) || {}; return [b.tarikh, userName(b.userId), k.kod, skopOf(k.skop).nama, b.pembekal, b.noResit, b.item, num(b.jumlah).toFixed(2), b.bayaran, b.noPO, STATUS_LABEL[b.status], flagsBelian(b).join('; ')]; }));
    } else if (kind === 'laporan') {
      rows = [['Tarikh', 'Oleh', 'Kod kerja', 'Skop', 'Lokasi', 'Tugas', 'Pekerja', 'Jam', 'Bahan', 'Status']]
        .concat(db.laporan.filter((l) => inMonth(l, ym)).map((l) => { const k = kodOf(l.kodId) || {}; return [l.tarikh, userName(l.userId), k.kod, skopOf(k.skop).nama, l.lokasi, l.tugas, l.pekerja, l.jam, l.bahan, STATUS_LABEL[l.status]]; }));
    } else if (kind === 'gaji') {
      rows = gajiRows(ym);
    } else {
      rows = [['Kod kerja', 'Penerangan', 'Skop', 'Jenis', 'Status VO', 'Jam', 'Kos (RM)']]
        .concat(db.kod.map((k) => [k.kod, k.penerangan, skopOf(k.skop).nama, k.jenis, k.voStatus || '', jamKod(k.id, ym), kosKod(k.id, ym).toFixed(2)]).filter((r) => r[5] || Number(r[6])));
    }
    const csv = rows.map((r) => r.map(q).join(',')).join('\r\n');
    const name = `kaiser-${kind}-${ym}.csv`;
    state.csv = { csv, name };
    openModal(`<h2>${esc(name)}</h2><div class="muted small">${rows.length - 1} baris. Muat turun fail, atau salin dan tampal ke Excel / Google Sheets.</div>
      <textarea class="i" readonly style="min-height:200px;font-family:ui-monospace,monospace;font-size:12px">${esc(csv)}</textarea>
      <div class="row"><button class="btn primary" data-a="csvDownload">Muat turun CSV</button><button class="btn" data-a="csvCopy">Salin</button><button class="btn" data-a="closeModal">Tutup</button></div>`);
  }
  function csvDownload() {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['\ufeff' + state.csv.csv], { type: 'text/csv;charset=utf-8' }));
      a.download = state.csv.name;
      document.body.appendChild(a); a.click(); a.remove();
      toast('Jika fail tidak dimuat turun, gunakan butang Salin');
    } catch (e) { toast('Muat turun tidak dibenarkan di sini. Gunakan butang Salin.'); }
  }
  async function csvCopy() {
    try { await navigator.clipboard.writeText(state.csv.csv); toast('CSV disalin'); }
    catch (e) { const t = $('#modal textarea'); if (t) { t.select(); } toast('Pilih semua teks dan salin secara manual'); }
  }

  // ---------- Pendengar acara ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el) return;
    const fn = A[el.dataset.a];
    if (!fn) return;
    if (el.tagName === 'A' && el.dataset.a === 'closeModal') { closeModal(); return; }
    e.preventDefault();
    fn(el);
  });
  document.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.file) {
      const files = [...el.files]; const field = el.dataset.file, cap = el.dataset.cap;
      for (const f of files) {
        try { state.draft[field].push({ img: await compressImage(f), cap }); }
        catch (err) { toast(err.message); }
      }
      refreshPhotos(field);
      return;
    }
    if (el.dataset && el.dataset.aChange && CHANGE[el.dataset.aChange]) CHANGE[el.dataset.aChange](el);
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    const fn = FORMS[form.dataset.form];
    if (fn) fn(fd, form);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal')) closeModal(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('online', () => scheduleRender());
  window.addEventListener('offline', () => scheduleRender());
  document.addEventListener('focusout', () => { if (state.pendingRender) setTimeout(scheduleRender, 50); });

  // Lukis semula bila data awan berubah, tanpa mengganggu borang yang sedang diisi.
  function scheduleRender() {
    clearTimeout(scheduleRender._t);
    scheduleRender._t = setTimeout(() => {
      const ae = document.activeElement;
      const typing = ae && ae.closest && ae.closest('#app') && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
      const onForm = /^#?(laporan|belian|vo|hadir|mohon)(-|$)/.test(location.hash.replace(/^#/, '')) && state.draft;
      if (typing || onForm) { state.pendingRender = true; return; }
      state.pendingRender = false;
      if ($('form[data-form]')) rerenderKeepForm(); else render();
    }, 120);
  }

  const AUTH_MSG = {
    'auth/invalid-credential': 'Emel atau kata laluan salah', 'auth/wrong-password': 'Emel atau kata laluan salah', 'auth/user-not-found': 'Emel atau kata laluan salah',
    'auth/invalid-email': 'Format emel tidak sah', 'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba sebentar lagi.', 'auth/network-request-failed': 'Tiada sambungan internet',
    'auth/email-already-in-use': 'Emel ini sudah didaftarkan', 'auth/weak-password': 'Kata laluan terlalu lemah (sekurang-kurangnya 6 aksara)', 'auth/operation-not-allowed': 'Log masuk emel belum dihidupkan dalam Firebase',
  };
  function authMsg(e) { return AUTH_MSG[e && e.code] || ('Ralat: ' + ((e && (e.code || e.message)) || 'tidak diketahui')); }

  // Pengarah mendaftar pengguna baharu menggunakan apps Firebase kedua, supaya sesi Pengarah tidak terputus.
  async function createCloudUser(fd) {
    const sec = firebase.apps.find((a) => a.name === 'daftar') || firebase.initializeApp(CFG, 'daftar');
    const sa = sec.auth();
    await sa.setPersistence(firebase.auth.Auth.Persistence.NONE);
    const cred = await sa.createUserWithEmailAndPassword(fd.email.trim(), fd.password);
    const u = { id: cred.user.uid, nama: fd.nama.trim(), peranan: fd.peranan, email: fd.email.trim().toLowerCase(), aktif: true, tarikhMula: fd.tarikhMula || '' };
    await sa.signOut();
    await fs.collection('users').doc(u.id).set(clean(Object.assign({}, u, { id: undefined })));
    commit('tambah pengguna', u.email);
  }

  async function bootstrapSystem(nama) {
    const au = state.authUser;
    try {
      const b1 = fs.batch();
      b1.set(fs.collection('users').doc(au.uid), { nama, peranan: 'pengarah', email: (au.email || '').toLowerCase(), aktif: true });
      b1.set(fs.collection('meta').doc('bootstrap'), { by: au.uid, t: new Date().toISOString() });
      await b1.commit();
      const b2 = fs.batch();
      b2.set(fs.collection('settings').doc('main'), DEFAULT_SETTINGS);
      [['CV', 'Kerja sivil am', 'sivil'], ['EL', 'Kerja elektrik am', 'elektrik'], ['MK', 'Kerja mekanikal am', 'mekanikal'], ['AC', 'Servis dan pembaikan penghawa dingin', 'ac'], ['FB', 'Fabrikasi dan struktur keluli', 'fabrikasi'], ['CT', 'Pengecatan dan sand blasting', 'cat'], ['PM', 'Penyelenggaraan fasiliti', 'fasiliti'], ['TK', 'Bekalan tenaga kerja', 'tenaga']]
        .forEach(([c, p, sk]) => { const id = uid(); b2.set(fs.collection('kod').doc(id), { kod: `${DEFAULT_SETTINGS.prefix}-${c}-001`, penerangan: p, skop: sk, jenis: 'Kontrak', bajet: 0, status: 'Aktif', tarikh: today(), userId: au.uid }); });
      await b2.commit();
      await onSignedIn(au);
      toast('Sistem disediakan. Tambah pengguna dalam Tetapan.');
    } catch (e) { console.error(e); toast('Gagal sediakan sistem: ' + (e.code || e.message)); }
  }

  async function onSignedIn(user) {
    state.authUser = user;
    try {
      const snap = await fs.collection('users').doc(user.uid).get();
      if (snap.exists && snap.data().aktif !== false) {
        const prof = Object.assign({ id: user.uid }, snap.data());
        db.users = [prof].concat(db.users.filter((x) => x.id !== user.uid));
        state.userId = user.uid; state.screen = null;
        Cloud.subscribe(prof);
        const h = location.hash.replace(/^#/, '');
        if (!h || h === 'mula') location.hash = prof.peranan === 'penyelia' ? '#home' : '#a-dash';
        render();
        return;
      }
      let boot = true;
      try { boot = (await fs.collection('meta').doc('bootstrap').get()).exists; } catch (e) { boot = true; }
      state.userId = null; state.screen = boot ? 'notreg' : 'bootstrap'; render();
    } catch (e) {
      console.error(e); state.screen = null; toast('Gagal memuatkan profil: ' + (e.code || e.message)); render();
    }
  }

  if (CLOUD) {
    render();
    auth.onAuthStateChanged((user) => {
      if (!user) { Cloud.stop(); db = emptyDb(); state.userId = null; state.authUser = null; state.screen = null; render(); return; }
      onSignedIn(user);
    });
  } else {
    if (!Store.load()) Store.save(db);
    render();
  }

  // Pasang service worker untuk kegunaan luar talian (hanya di https / localhost, bukan dalam iframe pratonton).
  try {
    if ('serviceWorker' in navigator && window.top === window.self && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch (e) { /* abaikan */ }
})();
