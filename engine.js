/*
 * MESIN PEMERIKSA KLIK AMAN v3.0
 * Pelajari file ini setelah memahami HTML dan event tombol di app.js.
 * Fungsi analyze() hanya membaca teks: tidak membuka link atau mengirim data.
 * Aturan adalah heuristik pembelajaran, bukan model AI atau bukti phishing.
 */
(function (root) {
  "use strict";

  // Daftar kecil untuk demonstrasi. Tidak mencakup semua layanan/domain.
  const KNOWN_DOMAINS = ["unib.ac.id", "google.com", "microsoft.com", "apple.com"];
  const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "s.id", "is.gd", "cutt.ly", "rebrand.ly", "shorturl.at", "rb.gy"];
  const LIMITATIONS = "Hanya membaca susunan URL. Isi situs, pengalihan, reputasi, umur domain, sertifikat, dan malware tidak diperiksa.";

  function invalid(message) {
    return { valid: false, error: message };
  }

  function isIPv4(hostname) {
    const parts = hostname.split(".");
    return parts.length === 4 && parts.every(part => /^\d+$/.test(part) && Number(part) <= 255);
  }

  // Langkah 1: validasi dan pemisahan URL dengan parser bawaan JavaScript.
  function analyze(input) {
    if (typeof input !== "string") return invalid("Masukkan satu link dalam bentuk teks.");
    const raw = input.trim();
    if (!raw) return invalid("Masukkan link terlebih dahulu, atau pilih salah satu contoh.");
    if (raw.length > 4096) return invalid("Link terlalu panjang. Batas prototipe ini adalah 4.096 karakter.");
    if (/[\s\u0000-\u001f\u007f\\]/u.test(raw)) return invalid("Link mengandung spasi, baris baru, atau garis miring terbalik. Tempel satu URL utuh.");

    let candidate = raw;
    let inferredScheme = false;
    const hostWithPort = /^(?:\[[^\]]+\]|[^/?#:]+):\d+(?:[/?#]|$)/.test(raw);
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) && !hostWithPort;
    if (hasScheme) {
      if (!/^https?:\/\/[^/]/i.test(raw)) return invalid("Gunakan alamat HTTP atau HTTPS yang lengkap. Skema lain tidak didukung.");
    } else {
      candidate = raw.startsWith("//") ? "https:" + raw : "https://" + raw;
      inferredScheme = true;
    }

    let url;
    try { url = new URL(candidate); }
    catch (_) { return invalid("Format link belum valid. Contoh: https://kampus.example/beasiswa"); }
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname) return invalid("Alamat harus mempunyai hostname dan memakai HTTP atau HTTPS.");

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    const ipv4 = isIPv4(hostname);
    const ipv6 = hostname.startsWith("[") && hostname.endsWith("]");
    const labels = hostname.split(".");
    if (!ipv6 && (hostname.length > 253 || labels.some(label => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label)))) {
      return invalid("Hostname tidak sesuai format domain yang didukung prototipe ini. Periksa kembali penulisannya.");
    }

    // Langkah 2: kumpulkan temuan. strong, caution, dan info bukan skor probabilitas.
    const findings = [];
    function add(id, severity, title, detail, referenceDomain) {
      const finding = { id, severity, title, detail };
      if (referenceDomain) finding.referenceDomain = referenceDomain;
      findings.push(finding);
    }

    if (url.username || url.password) {
      add("userinfo", "strong", "Ada bagian sebelum tanda @", "Teks sebelum @ adalah informasi pengguna, bukan hostname tujuan. Koneksi akan menuju " + hostname + ". Pola ini bisa mengecoh pembaca; jangan memasukkan kredensial pada link yang diragukan.");
    }

    const misleading = KNOWN_DOMAINS.find(domain => (hostname.startsWith(domain + ".") || hostname.includes("." + domain + ".")) && hostname !== domain && !hostname.endsWith("." + domain));
    if (misleading) {
      add("misleading-domain", "strong", "Nama domain dikenal berada di dalam hostname lain", "Teks " + misleading + " muncul sebelum akhiran lain. Hostname ini bukan " + misleading + " atau subdomainnya. Cocokkan dengan alamat resmi melalui sumber terpisah.", misleading);
    }

    if (url.protocol === "http:") {
      add("http", "caution", "Menggunakan HTTP", "Koneksi HTTP tidak menyediakan perlindungan TLS seperti HTTPS. Ini bukan bukti phishing, tetapi data sensitif sebaiknya tidak dimasukkan melalui koneksi ini.");
    }
    if (SHORTENERS.some(domain => hostname === domain || hostname.endsWith("." + domain))) {
      add("shortener", "caution", "Tujuan akhir tersembunyi oleh pemendek link", "Pemendek link juga digunakan secara sah. Prototipe ini tidak mengikuti pengalihan, sehingga alamat tujuan akhirnya belum diketahui. Minta alamat lengkap melalui pengirim yang sudah diverifikasi.");
    }
    if (ipv4 || ipv6) {
      add("ip-address", "caution", "Menggunakan alamat IP", "Alamat IP juga dapat dipakai oleh server yang sah. Identitas layanan lebih sulit dikenali dari angka ini saja; cocokkan tujuan dengan pihak yang seharusnya mengirim link.");
    }
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || (!hostname.includes(".") && !ipv6)) {
      add("local-host", "caution", "Alamat lokal atau hostname tanpa domain lengkap", "Alamat ini mungkin hanya berlaku di jaringan tertentu. Identitas tujuan tidak dapat disimpulkan dari pemeriksaan URL ini.");
    }
    if (labels.some(label => label.startsWith("xn--"))) {
      add("idn", "info", "Hostname menggunakan karakter internasional", "Browser menuliskannya dalam bentuk ASCII/Punycode yang diawali xn--. Domain internasional dapat sah; cocokkan ejaannya dengan alamat resmi karena beberapa karakter dapat terlihat mirip.");
    }
    if (!ipv4 && !ipv6 && labels.length >= 5) {
      add("many-labels", "info", "Hostname terdiri dari banyak bagian", "Banyak bagian dipisahkan titik. Ini dapat sah pada layanan besar. Baca seluruh hostname agar nama di bagian depan tidak disalahartikan sebagai tujuan resmi.");
    }
    if (url.port) {
      add("custom-port", "info", "Menggunakan port khusus", "Port " + url.port + " juga dapat digunakan untuk layanan atau pengembangan yang sah. Keberadaannya sendiri tidak membuktikan phishing.");
    }
    if (raw.length > 180) {
      add("long-url", "info", "Link cukup panjang", "Panjang URL melebihi ambang demonstrasi 180 karakter. Tautan sah juga bisa panjang; baca hostname dan verifikasi konteks pesannya. Ambang ini bukan standar keamanan.");
    }

    // Langkah 3: pilih kategori dari jenis temuan, bukan menjumlahkan skor.
    let level = "none";
    if (findings.some(f => f.severity === "strong")) level = "high";
    else if (findings.some(f => f.severity === "caution")) level = "review";
    const states = {
      high: { title: "Jangan klik dulu!", tag: "Pola mengecoh", summary: "Ada pola alamat yang dapat menyesatkan. Tunda membuka link ini sampai tujuan dan pengirimnya terverifikasi.", action: "Jangan membuka link dari pesan ini dulu. Cari aplikasi, situs, atau kontak resmi secara terpisah. Jangan kirim password, PIN, atau OTP kepada pengirim pesan." },
      review: { title: "Tahan dulu kliknya.", tag: "Perlu ditinjau", summary: "Ada bagian URL yang perlu diperhatikan. Konfirmasi tujuannya sebelum membuka; temuan ini belum membuktikan phishing.", action: "Minta alamat lengkap dan konfirmasi ke pengirim lewat kontak yang sudah kamu kenal. Hindari memasukkan data sensitif sebelum tujuan dan konteks pesan jelas." },
      none: { title: "Belum terverifikasi.", tag: "Belum terverifikasi", summary: "Belum ditemukan indikator utama pada aturan ini. Link yang terlihat biasa tetap bisa mengarah ke penipuan.", action: "Jangan jadikan hasil ini sebagai izin untuk langsung klik. Cocokkan alamat dengan sumber resmi dan konfirmasi konteks pesannya. Isi situs belum diperiksa." }
    };
    const state = states[level];
    const isDemo = hostname.endsWith(".example") || hostname === "example" ||
      (ipv4 && /^(192\.0\.2|198\.51\.100|203\.0\.113)\./.test(hostname)) || hostname.startsWith("[2001:db8:");
    return {
      valid: true, version: "3.0", level, ...state, hostname,
      protocol: url.protocol.slice(0, -1).toUpperCase(),
      port: url.port || (url.protocol === "https:" ? "443 (standar)" : "80 (standar)"),
      inferredScheme, isDemo, findings,
      // Nilai userinfo, path, query, dan fragment sengaja tidak dikembalikan.
      // Bagian tersebut bisa memuat informasi pribadi atau token rahasia.
      hiddenParts: Boolean(url.username || url.password || url.search || url.hash || url.pathname !== "/"),
      limitations: LIMITATIONS
    };
  }

  const api = { analyze, version: "3.0" };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KlikAman = api;
})(typeof window !== "undefined" ? window : this);
