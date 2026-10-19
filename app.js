/*
 * Klik Aman v3 — navigasi halaman, katalog contoh, dan penjelasan hasil.
 * Semua URL diperiksa oleh engine.js secara lokal. Tidak ada penyimpanan
 * masukan, permintaan jaringan, atau navigasi menuju URL yang diperiksa.
 */
(function () {
  "use strict";

  // Semua skenario buatan: .example dan rentang IP dokumentasi.
  const EXAMPLES = [
    { id: "beasiswa-at", title: "Tawaran beasiswa lewat chat", url: "https://kampus.example@klaim-beasiswa.example/masuk", clue: "Nama kampus sebelum @ bukan alamat tujuan." },
    { id: "domain-unib", title: "Portal kampus yang mengecoh", url: "https://unib.ac.id.klaim-beasiswa.example/masuk", clue: "Nama kampus berada di depan akhiran domain lain." },
    { id: "google-at", title: "Permintaan verifikasi akun", url: "https://google.com@verifikasi-akun.example/masuk", clue: "Baca hostname sesudah @, bukan nama di depannya." },
    { id: "microsoft-at", title: "Pesan reset password", url: "https://microsoft.com@reset-sandi.example/pulihkan", clue: "Nama layanan di awal tidak membuktikan identitas tujuan." },
    { id: "apple-at", title: "Hadiah perangkat gratis", url: "https://apple.com@hadiah-perangkat.example/klaim", clue: "Tujuan sebenarnya adalah domain setelah tanda @." },
    { id: "daftar-ulang", title: "Pengumuman daftar ulang", url: "https://portal-kampus.example@daftar-ulang.example/login", clue: "Periksa perbedaan nama sebelum dan sesudah @." },
    { id: "bank-at", title: "Pemberitahuan rekening diblokir", url: "https://bank.example@cek-rekening.example/verifikasi", clue: "Nama bank yang terlihat di depan bukan hostname." },
    { id: "paket-at", title: "Konfirmasi pengiriman paket", url: "https://layanan-paket.example@jadwal-ulang.example/konfirmasi", clue: "Tanda @ mengubah cara membaca alamat tujuan." },
    { id: "domain-google", title: "Peringatan keamanan akun", url: "https://google.com.pusat-keamanan.example/login", clue: "Ada akhiran lain setelah nama domain yang dikenal." },
    { id: "domain-microsoft", title: "Kotak masuk perlu diperbarui", url: "https://microsoft.com.verifikasi-email.example/masuk", clue: "Bukan microsoft.com maupun subdomain resminya." },
    { id: "domain-apple", title: "Permintaan pemulihan perangkat", url: "https://apple.com.dukungan-akun.example/pulihkan", clue: "Kata dukungan tidak menjadikan alamat ini domain resmi." },
    { id: "portal-mahasiswa", title: "Portal mahasiswa berlapis", url: "https://login.unib.ac.id.portal-mahasiswa.example/masuk", clue: "Nama kampus berada di tengah hostname yang panjang." },
    { id: "kampus-http", title: "Daftar ulang dengan dua indikator", url: "http://unib.ac.id.pendaftaran-ulang.example/login", clue: "Perhatikan domain yang mengecoh sekaligus HTTP." },
    { id: "google-http", title: "Reset akun melalui HTTP", url: "http://google.com@reset-akun.example/masuk", clue: "Tanda @ dan HTTP sama-sama perlu diperhatikan." },
    { id: "hadiah-port", title: "Klaim hadiah dengan port khusus", url: "https://microsoft.com@klaim-hadiah.example:8443/masuk", clue: "Tanda @ menjadi indikator utama; port adalah catatan tambahan." },
    { id: "identitas-at", title: "Permintaan validasi identitas", url: "https://apple.com@dukungan-identitas.example/verifikasi", clue: "Domain sesudah @ berbeda dari nama layanan di awal." },
    { id: "http-kampus", title: "Form pendaftaran tanpa HTTPS", url: "http://kampus.example/pendaftaran", clue: "HTTP tidak menyediakan perlindungan TLS seperti HTTPS." },
    { id: "http-bayar", title: "Halaman pembayaran melalui HTTP", url: "http://pembayaran.example/konfirmasi", clue: "Jangan masukkan data sensitif melalui koneksi HTTP." },
    { id: "http-login", title: "Pemulihan akun melalui HTTP", url: "http://pemulihan-akun.example/login", clue: "Ciri HTTP perlu ditinjau, tetapi bukan bukti penipuan." },
    { id: "http-absen", title: "Link absensi melalui HTTP", url: "http://absensi.example/masuk", clue: "Konfirmasi pengirim dan perlindungan koneksi sebelum mengisi data." },
    { id: "ipv4", title: "Tujuan berupa alamat IPv4", url: "https://192.0.2.1/konfirmasi", clue: "Identitas layanan tidak dapat dikenali dari angka saja." },
    { id: "ipv6", title: "Alamat IPv6 melalui HTTP", url: "http://[2001:db8::1]/masuk", clue: "Contoh memiliki alamat IP dan protokol HTTP." },
    { id: "normal", title: "URL yang terlihat biasa", url: "https://kampus.example/beasiswa", clue: "Tanpa indikator utama bukan berarti situsnya aman." },
    { id: "banyak-bagian", title: "Hostname dengan banyak bagian", url: "https://akun.portal.layanan.kampus.example/masuk", clue: "Banyak bagian juga dapat digunakan oleh layanan yang sah." }
  ];
  // Katalog dapat diuji di Node tanpa menjalankan antarmuka browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { examples: EXAMPLES };
    return;
  }

  const byId = id => document.getElementById(id);
  const input = byId("url-input");
  const form = byId("check-form");
  const main = byId("main");
  const live = byId("live-status");
  const PAGES = { periksa: "Periksa URL", hasil: "Hasil pemeriksaan", contoh: "Contoh Link", panduan: "Panduan Aman", tentang: "Tentang" };
  const categories = { high: "Pola mengecoh", review: "Perlu ditinjau", none: "Pembanding" };
  const severityNames = { strong: "POLA MENGECOH", caution: "PERLU DITINJAU", info: "CATATAN TAMBAHAN" };
  const shortNames = { userinfo: "Tanda @", "misleading-domain": "Domain mengecoh", http: "HTTP", shortener: "Link pendek", "ip-address": "Alamat IP", "local-host": "Host lokal", idn: "Punycode", "many-labels": "Banyak bagian", "custom-port": "Port khusus", "long-url": "URL panjang" };
  const reasonTitles = {
    userinfo: "Nama sebelum @ bukan tujuan link.",
    "misleading-domain": "Nama resmi ada di dalam alamat lain.",
    http: "Link ini menggunakan HTTP.",
    shortener: "Tujuan akhirnya belum terlihat.",
    "ip-address": "Tujuannya berupa alamat IP.",
    "local-host": "Alamat ini bersifat lokal.",
    idn: "Hostname menggunakan Punycode.",
    "many-labels": "Hostname memiliki banyak bagian.",
    "custom-port": "Ada port khusus setelah hostname.",
    "long-url": "Alamat ini cukup panjang."
  };
  const catalog = EXAMPLES.map(example => ({ ...example, analysis: window.KlikAman.analyze(example.url) }));
  const smallScreen = window.matchMedia("(max-width: 760px)");
  let analysis = null;
  let activeFinding = 0;
  let currentRoute = "periksa";
  let filter = "all";
  let search = "";
  let examplePage = 1;

  function setText(id, value) { byId(id).textContent = value; }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + name);
    svg.append(use);
    return svg;
  }
  function mark(text, severity) {
    return node("mark", severity === "caution" ? "mark-caution" : severity === "info" ? "mark-info" : "", text);
  }
  function routeFromHash() {
    const name = window.location.hash.replace(/^#\//, "");
    return Object.hasOwn(PAGES, name) ? name : "periksa";
  }
  function showPage(name, moveFocus) {
    currentRoute = name;
    document.querySelectorAll("[data-page]").forEach(page => { page.hidden = page.dataset.page !== name; });
    document.querySelectorAll("[data-nav]").forEach(link => {
      const active = link.dataset.nav === (name === "hasil" ? "periksa" : name);
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    setText("breadcrumb-current", PAGES[name]);
    document.title = PAGES[name] + " — Klik Aman";
    if (name === "hasil") renderResult();
    if (name === "contoh") renderExamples();
    main.scrollTop = 0;
    if (moveFocus) {
      byId("heading-" + name).focus({ preventScroll: true });
    }
  }
  function navigate(name) {
    if (!Object.hasOwn(PAGES, name)) return;
    if (window.location.hash === "#/" + name) showPage(name, true);
    else window.location.hash = "/" + name;
  }
  window.addEventListener("hashchange", () => showPage(routeFromHash(), true));
  document.querySelector(".skip-link").addEventListener("click", event => { event.preventDefault(); main.focus(); });

  // Menulis teks memakai textContent/append; URL pengguna tidak menjadi HTML.
  function paintHostname(target, result) {
    target.replaceChildren();
    const misleading = result.findings.find(finding => finding.id === "misleading-domain");
    if (misleading && misleading.referenceDomain) {
      const position = result.hostname.indexOf(misleading.referenceDomain);
      target.append(result.hostname.slice(0, position));
      target.append(mark(misleading.referenceDomain, "info"));
      target.append(mark(result.hostname.slice(position + misleading.referenceDomain.length), "strong"));
    } else if (result.findings.some(finding => finding.id === "userinfo")) {
      target.append(mark(result.hostname, "strong"));
    } else if (result.findings.some(finding => ["ip-address", "local-host", "shortener"].includes(finding.id))) {
      target.append(mark(result.hostname, "caution"));
    } else {
      target.append(result.hostname);
    }
  }
  function evidenceFor(target, finding, result) {
    target.replaceChildren();
    if (!finding) { target.append(result.hostname); return; }
    if (finding.id === "userinfo") {
      target.append(node("span", "muted-part", "[bagian sebelum @ disamarkan]"));
      target.append(mark("@" + result.hostname, "strong"));
    } else if (finding.id === "misleading-domain") {
      paintHostname(target, result);
    } else if (finding.id === "http") {
      target.append(mark("http://", "caution"), result.hostname);
    } else if (finding.id === "custom-port") {
      target.append(result.hostname, mark(":" + result.port, "info"));
    } else if (finding.id === "long-url") {
      target.append(mark("Lebih dari 180 karakter", "info"));
    } else if (finding.id === "idn") {
      result.hostname.split(".").forEach((label, index) => {
        if (index) target.append(".");
        target.append(label.startsWith("xn--") ? mark(label, "info") : document.createTextNode(label));
      });
    } else {
      target.append(mark(result.hostname, finding.severity));
    }
  }
  function renderReason(index) {
    if (!analysis) return;
    activeFinding = Math.max(0, Math.min(index, analysis.findings.length - 1));
    const finding = analysis.findings[activeFinding];
    const detail = byId("reason-detail");
    detail.dataset.severity = finding ? finding.severity : "info";
    setText("reason-label", finding ? severityNames[finding.severity] : "PAHAMI BATAS PEMERIKSAAN");
    setText("reason-title", finding ? (reasonTitles[finding.id] || finding.title) : "Belum ada indikator utama.");
    setText("reason-description", finding ? finding.detail : "Aturan yang dipakai belum menemukan ciri utama pada susunan URL ini. Isi dan reputasi situs belum diperiksa; situs penipuan juga dapat memiliki alamat yang tampak biasa. Tetap verifikasi sumbernya.");
    setText("reason-count", finding ? String(activeFinding + 1) + " / " + analysis.findings.length + " catatan" : "0 catatan");
    evidenceFor(byId("reason-evidence"), finding, analysis);
    byId("finding-select").querySelectorAll("button").forEach((button, buttonIndex) => {
      const active = buttonIndex === activeFinding;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function renderResult() {
    byId("result-empty").hidden = Boolean(analysis);
    byId("result-content").hidden = !analysis;
    if (!analysis) return;
    byId("verdict-banner").dataset.level = analysis.level;
    byId("verdict-symbol").setAttribute("href", analysis.level === "none" ? "#i-info" : "#i-alert");
    setText("result-tag", analysis.tag.toUpperCase());
    setText("result-heading", analysis.title);
    setText("result-summary", analysis.summary);
    setText("finding-total", String(analysis.findings.length));
    paintHostname(byId("hostname-value"), analysis);
    setText("hostname-context", analysis.findings.some(finding => finding.id === "userinfo")
      ? "Inilah alamat sesudah @ yang menjadi tujuan. Nama di depannya bukan hostname tujuan."
      : "Baca seluruh hostname ini, lalu cocokkan dengan alamat resmi dari sumber terpisah.");
    setText("protocol-value", analysis.protocol);
    byId("protocol-value").classList.toggle("protocol-warn", analysis.protocol === "HTTP");
    setText("port-value", analysis.port);
    byId("demo-notice").hidden = !analysis.isDemo;
    const notes = [];
    if (analysis.inferredScheme) notes.push("HTTPS ditambahkan untuk membaca URL, bukan hasil pengecekan koneksi situs.");
    if (analysis.hiddenParts) notes.push("Path, query, fragment, dan informasi pengguna tidak ditampilkan.");
    setText("normalization-note", notes.join(" "));
    byId("normalization-note").hidden = !notes.length;
    setText("action-text", analysis.action);
    const selectors = byId("finding-select");
    selectors.replaceChildren();
    selectors.hidden = !analysis.findings.length;
    analysis.findings.forEach((finding, index) => {
      const button = node("button", "finding-tab");
      button.type = "button";
      button.dataset.finding = String(index);
      button.dataset.severity = finding.severity;
      button.append(node("b", "", String(index + 1)), node("span", "", shortNames[finding.id] || finding.title));
      button.setAttribute("aria-label", "Baca alasan " + (index + 1) + ": " + finding.title);
      selectors.append(button);
    });
    renderReason(activeFinding);
  }
  function resetInput() {
    input.value = "";
    analysis = null;
    activeFinding = 0;
    byId("input-error").hidden = true;
    input.removeAttribute("aria-invalid");
    byId("pending-notice").hidden = true;
    live.textContent = "Kolom dan hasil pemeriksaan sudah dibersihkan.";
  }
  function checkLink(value) {
    const result = window.KlikAman.analyze(value);
    analysis = result.valid ? result : null;
    activeFinding = 0;
    byId("input-error").hidden = result.valid;
    input.setAttribute("aria-invalid", String(!result.valid));
    byId("pending-notice").hidden = true;
    if (!result.valid) {
      setText("input-error", result.error);
      live.textContent = "URL belum bisa diperiksa. " + result.error;
      if (currentRoute !== "periksa") navigate("periksa");
      input.focus();
      return result;
    }
    setText("input-error", "");
    navigate("hasil");
    live.textContent = result.title + " " + result.findings.length + " catatan. Baca alasan pemeriksaan.";
    return result;
  }
  form.addEventListener("submit", event => { event.preventDefault(); checkLink(input.value); });
  input.addEventListener("input", () => {
    analysis = null;
    byId("input-error").hidden = true;
    input.removeAttribute("aria-invalid");
    byId("pending-notice").hidden = !input.value.trim();
    live.textContent = input.value.trim() ? "Link belum diperiksa. Hasil sebelumnya dihapus." : "";
  });
  byId("reset-button").addEventListener("click", () => { resetInput(); input.focus(); });

  // Kartu contoh berpaginasi, bukan satu halaman panjang.
  function pageSize() { return smallScreen.matches ? 2 : 4; }
  function filteredExamples() {
    const term = search.trim().toLowerCase();
    return catalog.filter(example =>
      (filter === "all" || example.analysis.level === filter) &&
      (!term || [example.title, example.url, example.clue].some(value => value.toLowerCase().includes(term)))
    );
  }
  function paintExampleURL(target, example) {
    const url = new URL(example.url);
    const result = example.analysis;
    target.append(result.protocol === "HTTP" ? mark("http://", "caution") : "https://");
    if (url.username || url.password) {
      target.append(node("span", "muted-part", url.username), mark("@" + result.hostname, "strong"));
    } else {
      const host = node("span");
      paintHostname(host, result);
      target.append(host);
    }
    if (url.port) target.append(mark(":" + url.port, "info"));
    target.append(url.pathname);
  }
  function renderExamples() {
    const list = filteredExamples();
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize()));
    examplePage = Math.max(1, Math.min(examplePage, totalPages));
    const start = (examplePage - 1) * pageSize();
    const visible = list.slice(start, start + pageSize());
    const grid = byId("examples-grid");
    grid.replaceChildren();
    grid.hidden = !list.length;
    byId("examples-empty").hidden = Boolean(list.length);
    visible.forEach(example => {
      const article = node("article", "example-card");
      const top = node("div", "example-card-top");
      const number = String(EXAMPLES.findIndex(item => item.id === example.id) + 1).padStart(2, "0");
      top.append(node("span", "example-number", "CONTOH / " + number), node("span", "category-tag " + example.analysis.level, categories[example.analysis.level]));
      const title = node("h2", "", example.title);
      const urlText = node("code", "example-url");
      paintExampleURL(urlText, example);
      const footer = node("div", "example-footer");
      const button = node("button", "", "Periksa contoh");
      button.type = "button";
      button.dataset.example = example.id;
      button.setAttribute("aria-label", "Periksa contoh: " + example.title);
      button.append(icon("arrow"));
      footer.append(node("span", "", example.analysis.findings.length + " catatan URL"), button);
      article.append(top, title, urlText, node("p", "", example.clue), footer);
      grid.append(article);
    });
    setText("example-range", list.length ? String(start + 1) + "–" + Math.min(start + pageSize(), list.length) + " dari " + list.length + " contoh" : "0 contoh");
    byId("examples-prev").disabled = examplePage <= 1;
    byId("examples-next").disabled = examplePage >= totalPages;
    const numbers = byId("example-pages");
    numbers.replaceChildren();
    let visiblePages;
    if (totalPages <= 6) visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1);
    else visiblePages = Array.from(new Set([1, totalPages, examplePage - 1, examplePage, examplePage + 1, ...(examplePage <= 2 ? [3] : []), ...(examplePage >= totalPages - 1 ? [totalPages - 2] : [])])).filter(number => number > 0 && number <= totalPages).sort((a, b) => a - b);
    let previous = 0;
    if (list.length) visiblePages.forEach(number => {
      if (previous && number - previous > 1) {
        const ellipsis = node("span", "page-ellipsis", "…");
        ellipsis.setAttribute("aria-hidden", "true");
        numbers.append(ellipsis);
      }
      const button = node("button", "page-number" + (number === examplePage ? " active" : ""), String(number));
      button.dataset.examplePage = String(number);
      button.type = "button";
      button.setAttribute("aria-label", "Halaman contoh " + number);
      if (number === examplePage) button.setAttribute("aria-current", "page");
      numbers.append(button);
      previous = number;
    });
    document.querySelectorAll("[data-filter]").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function changeExamplePage(page) {
    examplePage = page;
    renderExamples();
    main.scrollTop = 0;
    live.textContent = "Contoh halaman " + examplePage + ". " + byId("example-range").textContent;
  }
  byId("examples-prev").addEventListener("click", () => changeExamplePage(examplePage - 1));
  byId("examples-next").addEventListener("click", () => changeExamplePage(examplePage + 1));
  byId("example-search").addEventListener("input", event => {
    search = event.target.value;
    examplePage = 1;
    renderExamples();
  });
  smallScreen.addEventListener("change", () => {
    examplePage = 1;
    if (currentRoute === "contoh") renderExamples();
  });

  function selectGuide(name, fromNext) {
    document.querySelectorAll("[data-guide-panel]").forEach(panel => { panel.hidden = panel.dataset.guidePanel !== name; });
    document.querySelectorAll(".guide-tab").forEach(button => {
      const active = button.dataset.guide === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      if (active && fromNext) button.focus({ preventScroll: true });
    });
    main.scrollTop = 0;
  }

  document.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    if (target.dataset.example) {
      const example = catalog.find(item => item.id === target.dataset.example);
      if (!example) return;
      input.value = example.url;
      checkLink(example.url);
    } else if (target.dataset.finding !== undefined) {
      renderReason(Number(target.dataset.finding));
    } else if (target.dataset.filter) {
      filter = target.dataset.filter;
      examplePage = 1;
      renderExamples();
    } else if (target.dataset.examplePage) {
      changeExamplePage(Number(target.dataset.examplePage));
    } else if (target.dataset.guide) {
      selectGuide(target.dataset.guide, !target.classList.contains("guide-tab"));
    } else if (target.dataset.action === "new-check") {
      resetInput();
      navigate("periksa");
    } else if (target.dataset.action === "reset-filter") {
      filter = "all";
      search = "";
      examplePage = 1;
      byId("example-search").value = "";
      renderExamples();
    }
  });

  // Tandai ikon dekoratif agar pembaca layar hanya membaca label kontrolnya.
  document.querySelectorAll("svg.icon").forEach(svg => svg.setAttribute("aria-hidden", "true"));
  form.querySelector("button[type=submit]").disabled = false;
  if (!window.location.hash.startsWith("#/") || !Object.hasOwn(PAGES, window.location.hash.slice(2))) {
    try { window.history.replaceState(null, "", "#/periksa"); }
    catch (_) { window.location.hash = "/periksa"; }
  }
  showPage(routeFromHash(), false);

  // WebMCP opsional; input tetap diproses lokal melalui alur yang sama.
  const context = document.modelContext;
  if (context && typeof context.registerTool === "function") {
    const lifetime = new AbortController();
    try {
      Promise.resolve(context.registerTool({
        name: "analyze_link",
        title: "Periksa indikator URL",
        description: "Membaca struktur URL secara lokal lalu menampilkan halaman hasil. Tidak membuka URL, mengirim, atau menyimpan masukan.",
        inputSchema: { type: "object", properties: { url: { type: "string", maxLength: 4096 } }, required: ["url"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(data) {
          if (!data || typeof data.url !== "string" || Object.keys(data).some(key => key !== "url")) throw new Error("Masukkan hanya properti url berupa teks.");
          const result = window.KlikAman.analyze(data.url);
          if (!result.valid) throw new Error(result.error);
          input.value = data.url;
          return checkLink(data.url);
        }
      }, { signal: lifetime.signal })).catch(() => {});
      window.addEventListener("pagehide", event => { if (!event.persisted) lifetime.abort(); }, { once: true });
    } catch (_) { /* Form tetap dapat digunakan tanpa dukungan WebMCP. */ }
  }
})();
