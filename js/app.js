/* =========================================================
   KEUANGAN RUMAH TANGGA ISLAMI
   FINAL FIXED FULL - MOBILE FIRST
   Cordova / Android Ready
========================================================= */

/* ===== GLOBAL STATE ===== */
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let selectedMonth = "";
let selectedUser = "all";
let isRamadhan = false;
let editIndex = null;
let ramadhanStartDate = null;
let ramadhanEndDate   = null;
let selectedCityId = null;


/* ===== DOM ===== */
let transactionForm, transactionTable;
let dateEl, userEl, typeEl, categoryEl, amountEl, noteEl;
let totalIncome, totalExpense, balance, saving;
let sedekahValue, zakatValue, analysisResult, warningBox;
let monthFilter, userFilter, ramadhanMode;
let barCanvas, pieCanvas;
let barChart, pieChart;
let zakatIncomeEl, zakatMaalEl, zakatNoteEl;

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", init);

function init(){
// SETTING TGL.RAMADHAN
const ramadhanStartInput = document.getElementById("ramadhanStart");
const ramadhanEndInput   = document.getElementById("ramadhanEnd");

// load dari storage
ramadhanStartDate = localStorage.getItem("ramadhanStart");
ramadhanEndDate   = localStorage.getItem("ramadhanEnd");

if(ramadhanStartDate) ramadhanStartInput.value = ramadhanStartDate;
if(ramadhanEndDate)   ramadhanEndInput.value   = ramadhanEndDate;

// simpan saat berubah
ramadhanStartInput.onchange = () => {
  const val = ramadhanStartInput.value; // YYYY-MM-DD
  if(!val) return;

  ramadhanStartDate = val;
  localStorage.setItem("ramadhanStart", val);

  checkRamadhanAuto();
  renderKalenderRamadhanSimple();

   document.getElementById("ramadhanStart")
  ?.addEventListener("change", renderKalenderRamadhanSimple);

};


ramadhanEndInput.onchange = () => {
  localStorage.setItem("ramadhanEnd", ramadhanEndInput.value);
  ramadhanEndDate = ramadhanEndInput.value;
  checkRamadhanAuto();
};

   // FORM
  transactionForm = document.getElementById("transactionForm");
  transactionTable = document.getElementById("transactionTable");

  dateEl = document.getElementById("date");
  userEl = document.getElementById("user");
  typeEl = document.getElementById("type");
  categoryEl = document.getElementById("category");
  amountEl = document.getElementById("amount");
  noteEl = document.getElementById("note");
zakatIncomeEl = document.getElementById("zakatIncome");
zakatMaalEl   = document.getElementById("zakatMaal");
zakatNoteEl   = document.getElementById("zakatNote");
  // DASHBOARD
  totalIncome = document.getElementById("totalIncome");
  totalExpense = document.getElementById("totalExpense");
  balance = document.getElementById("balance");
  saving = document.getElementById("saving");
  sedekahValue = document.getElementById("sedekahValue");
  zakatValue = document.getElementById("zakatValue");
  analysisResult = document.getElementById("analysisResult");
  warningBox = document.getElementById("warningBox");

  // FILTER
  monthFilter = document.getElementById("monthFilter");
  userFilter = document.getElementById("userFilter");
  ramadhanMode = document.getElementById("ramadhanMode");

  // CHART
  barCanvas = document.getElementById("barChart");
  pieCanvas = document.getElementById("pieChart");

  // EVENTS
  transactionForm.addEventListener("submit", onSubmit);
  monthFilter.onchange = e => { selectedMonth = e.target.value; update(); };
  userFilter.onchange = e => { selectedUser = e.target.value; update(); };
  
  ramadhanMode.onchange = e => { isRamadhan = e.target.checked;  
  if(isRamadhan){document.body.classList.add("ramadhan");
  } else {document.body.classList.remove("ramadhan");}update(); };

  setupTheme();
  setupQuotes();
  setupImport();
  update();
  checkRamadhanAuto();// RAMADHAN SETTING
  loadCities();
   
// ⬇️ TAMBAH
setTimeout(() => {
  if (localStorage.getItem("ramadhanStart")) {
    renderRamadhanCalendar();
  }
}, 500);
}

/* ===== CORE ===== */
function onSubmit(e){
  e.preventDefault();

  const data = {
    date: dateEl.value,
    user: userEl.value,
    type: typeEl.value,
    category: categoryEl.value,
    amount: Number(amountEl.value),
    note: noteEl.value
  };

  if(!data.date || !data.amount) return;

  if(editIndex !== null){
    transactions[editIndex] = data;
    editIndex = null;
  } else {
    transactions.push(data);
  }

  save();
  transactionForm.reset();
  update();
}

function save(){
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function filtered(){
  return transactions.filter(t =>
    (!selectedMonth || t.date.startsWith(selectedMonth)) &&
    (selectedUser === "all" || t.user === selectedUser)
  );
}

/* ===== RENDER ===== */
function update(){
  renderDashboard();
  renderAnalysis();
  renderTable();
  renderCharts();
}

function rupiah(n){
  return "Rp " + n.toLocaleString("id-ID");
}

function renderDashboard(){
  let inc = 0, exp = 0, sed = 0;

  filtered().forEach(t=>{
    if(t.type === "income") inc += t.amount;
    if(t.type === "expense") exp += t.amount;
   if(t.type === "sedekah" || t.type === "zakat fitrah") sed += t.amount;
  });
   // ===== ZAKAT FITRAH =====
let zakatFitrah = 0;
filtered().forEach(t=>{
  if(t.type === "zakat fitrah") zakatFitrah += t.amount;
});

const zakatFitrahEl = document.getElementById("zakatFitrah");
if(zakatFitrahEl){
  zakatFitrahEl.textContent = rupiah(zakatFitrah);
}

  totalIncome.textContent  = rupiah(inc);
  totalExpense.textContent = rupiah(exp);
  balance.textContent      = rupiah(inc - exp);
  saving.textContent       = rupiah((inc - exp) * 0.2);
  sedekahValue.textContent = rupiah(sed);
  // ===== ZAKAT PENGHASILAN =====
const zakatPenghasilan = inc * 0.025;

// ===== ZAKAT MAAL =====
const nisab = 85000000;
const saldoBersih = inc - exp;
const zakatMaal = saldoBersih >= nisab ? saldoBersih * 0.025 : 0;

// tampilkan
if(zakatIncomeEl) zakatIncomeEl.textContent = rupiah(zakatPenghasilan);
if(zakatMaalEl)   zakatMaalEl.textContent   = rupiah(zakatMaal);

// catatan
if(zakatNoteEl){
  if(zakatMaal > 0){
    zakatNoteEl.innerHTML = `
      🕌 <em>Zakat maal wajib ditunaikan karena harta telah mencapai nisab.</em>
    `;
    zakatNoteEl.style.color = "#c62828";
  } else {
    zakatNoteEl.innerHTML = `
      ℹ️ <em>Harta belum mencapai nisab zakat maal.</em>
    `;
    zakatNoteEl.style.color = "#555";
  }
}

  warningBox.classList.toggle("hidden", exp < inc * 0.8);

  // ===== REKOMENDASI SEDEKAH =====
  const rekomEl = document.getElementById("sedekahRecommend");
  const noteEl  = document.getElementById("sedekahNote");

  const persen = isRamadhan ? 0.08 : 0.05;
  const rekom  = inc * persen;

  if(rekomEl) rekomEl.textContent = rupiah(rekom);

  if(noteEl){
    if(sed < rekom){
      noteEl.innerHTML = `
        💡 Dianjurkan menambah sedekah <b>${rupiah(rekom - sed)}</b><br>
        <em>“Harta tidak akan berkurang karena sedekah.”</em>
      `;
      noteEl.style.color = "#c62828";
    } else {
      noteEl.innerHTML = `
        ✅ Sedekah bulan ini sudah baik<br>
        <em>Semoga Allah melipatgandakan rezekimu.</em>
      `;
      noteEl.style.color = "#0f9d58";
    }
  }
}

 
function renderAnalysis(){
  const expenses = filtered().filter(t => t.type === "expense");

  if(!expenses.length){
    analysisResult.innerHTML = "Belum ada data pengeluaran.";
    renderAITips(0, 0, 0, "");
    return;
  }

  const totalExpense = expenses.reduce((a,b)=>a+b.amount,0);
  const totalIncome  = filtered()
    .filter(t=>t.type==="income")
    .reduce((a,b)=>a+b.amount,0);

  const totalSedekah = filtered()
    .filter(t=>t.type==="sedekah")
    .reduce((a,b)=>a+b.amount,0);

  const cat = {};
  expenses.forEach(t=>{
    cat[t.category] = (cat[t.category] || 0) + t.amount;
  });

  const [topCat, topVal] =
    Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];

  const percent = Math.round((topVal / totalExpense) * 100);

  let tip = "💡 Kelola pengeluaran dengan bijak.";
  if(percent > 50){
    tip = `⚠️ Pengeluaran ${topCat} sangat dominan. Pertimbangkan penghematan.`;
  }
  if(topCat.toLowerCase().includes("makan")){
    tip = "🍽️ Kurangi jajan berlebihan, utamakan masak di rumah.";
  }
  if(topCat.toLowerCase().includes("loan")){
    tip = "🚫 Utang berlebih tidak dianjurkan dalam Islam. Lunasi bertahap.";
  }

  analysisResult.innerHTML = `
    <strong>Terbesar:</strong> ${topCat} (${percent}%)<br>
    ${tip}
  `;

  // PANGGIL AI TIPS DI SINI (BENAR)
  renderAITips(totalIncome, totalExpense, totalSedekah, topCat);
}

function renderAITips(inc, exp, sed, topCat){
  const el = document.getElementById("aiTips");
  if(!el) return;

  let tips = "";

  // 🔴 Sedekah
  if(sed === 0 && inc > 0){
    tips = `
      🕌 <b>AI Islami:</b><br>
      Belum ada sedekah tercatat bulan ini.<br>
      <em>“Harta tidak akan berkurang karena sedekah.”</em>
    `;
  }

  // 🟠 Utang dominan
  else if(topCat.toLowerCase().includes("loan")){
    tips = `
      ⚠️ <b>AI Islami:</b><br>
      Utang mendominasi pengeluaran.<br>
      <em>Islam menganjurkan hidup tanpa memberatkan diri.</em>
    `;
  }

  // 🟢 Boros
  else if(exp > inc * 0.8){
    tips = `
      ⚠️ <b>AI Islami:</b><br>
      Pengeluaran mendekati pemasukan.<br>
      <em>“Makan dan minumlah, tetapi jangan berlebihan.”</em>
    `;
  }

  // 🔵 Sehat
  else{
    tips = `
      ✅ <b>AI Islami:</b><br>
      Keuangan keluarga dalam kondisi baik.<br>
      <em>Terus jaga amanah rezeki dari Allah.</em>
    `;
  }

  el.innerHTML = tips;
}



function renderTable(){
  transactionTable.innerHTML="";
  filtered().forEach((t,i)=>{
    transactionTable.innerHTML+=`
      <tr>
        <td>${t.date}</td>
        <td>${t.user}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${rupiah(t.amount)}</td>
        <td>${t.note||""}</td>
        <td>
          <button onclick="editTransaction(${i})">✏️</button>
          <button onclick="deleteTransaction(${i})">🗑️</button>
        </td>
      </tr>`;
  });
}

/* ===== CHART (AUTO DISABLE LOW-END) ===== */
function renderCharts(){
  if(!window.Chart || window.innerWidth < 360) return;

  let inc=0, exp=0, cat={};
  filtered().forEach(t=>{
    if(t.type==="income") inc+=t.amount;
    if(t.type==="expense"){ exp+=t.amount; cat[t.category]=(cat[t.category]||0)+t.amount; }
  });

  barChart?.destroy();
  pieChart?.destroy();

  barChart = new Chart(barCanvas,{type:"bar",data:{labels:["Masuk","Keluar"],datasets:[{data:[inc,exp]}]}});
  pieChart = new Chart(pieCanvas,{type:"pie",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
}

/* ===== ACTION ===== */
window.editTransaction = i=>{
  const t = filtered()[i];
  dateEl.value=t.date; userEl.value=t.user; typeEl.value=t.type;
  categoryEl.value=t.category; amountEl.value=t.amount; noteEl.value=t.note;
  editIndex = transactions.indexOf(t);
};

window.deleteTransaction = i=>{
  const t = filtered()[i];
  transactions.splice(transactions.indexOf(t),1);
  save(); update();
};

/* ===== RESET / BACKUP ===== */
window.resetData = ()=>{
  if(!confirm("Hapus semua data?")) return;
  localStorage.setItem("transactions_backup",JSON.stringify(transactions));
  localStorage.removeItem("transactions");
  location.reload();
};
window.undoReset = ()=>{
  const b = localStorage.getItem("transactions_backup");
  if(!b) return alert("Tidak ada backup");
  localStorage.setItem("transactions",b);
  location.reload();
};

/* ===== EXPORT / IMPORT ===== */
window.exportData = ()=>{
  const blob=new Blob([JSON.stringify(transactions,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="keuangan-rumah-tangga.json";
  a.click();
};
window.triggerImport = ()=>document.getElementById("importFile").click();
function setupImport(){
  const i=document.getElementById("importFile");
  if(!i) return;
  i.onchange=()=>{
    const r=new FileReader();
    r.onload=()=>{transactions=JSON.parse(r.result);save();update();alert("Import berhasil");};
    r.readAsText(i.files[0]); i.value="";
  };
}

/* ===== THEME ===== */
function setupTheme(){
  const t=document.getElementById("themeToggle");
  if(localStorage.getItem("theme")==="dark"){document.body.classList.add("dark");t.checked=true;}
  t?.addEventListener("change",()=>{document.body.classList.toggle("dark");localStorage.setItem("theme",t.checked?"dark":"light");});
}

/* ===== QUOTES ===== */
function setupQuotes(){
  const q=document.getElementById("quoteText");
  if(!q) return;
  const arr=[
    '“Sesungguhnya pemboros itu adalah saudara setan.” (QS. Al-Isra: 27)',
    '“Harta tidak akan berkurang karena sedekah.” (HR. Muslim)',
    '“Jika kamu bersyukur, niscaya Aku akan menambah (nikmat) kepadamu.” (QS. Ibrahim: 7)',
    '“Dan apa saja yang kamu infakkan, Allah akan menggantinya.” (QS. Saba: 39)',
    '“Sebaik-baik harta adalah yang berada di tangan orang saleh.” (HR. Ahmad)',
    '“Barang siapa bertakwa kepada Allah, niscaya Dia akan memberinya rezeki dari arah yang tidak disangka-sangka.” (QS. At-Talaq: 2–3)',
    '“Tangan di atas lebih baik daripada tangan di bawah.” (HR. Bukhari & Muslim)',
    '“Tidaklah seorang hamba bersedekah dengan sesuatu, melainkan Allah akan menggantinya.” (HR. Ahmad)',
    '“Makan dan minumlah, tetapi jangan berlebihan.” (QS. Al-A’raf: 31)',
    '“Sesungguhnya Allah mencintai jika seseorang bekerja, ia menyempurnakannya.” (HR. Thabrani)',
    '“Orang yang memberi nafkah kepada keluarganya dengan niat karena Allah, maka itu adalah sedekah.” (HR. Bukhari)',
    '“Harta dan anak-anak adalah perhiasan dunia, tetapi amal saleh lebih baik pahalanya.” (QS. Al-Kahfi: 46)',
    '“Sebaik-baik dinar adalah yang dinafkahkan untuk keluarganya.” (HR. Muslim)',
    '“Perumpamaan orang yang berinfak di jalan Allah seperti sebutir biji yang menumbuhkan tujuh tangkai.” (QS. Al-Baqarah: 261)',
    '“Tidak ada satu hari pun ketika hamba berada di pagi hari, melainkan ada dua malaikat yang turun.” (HR. Bukhari)'
  ];
  let i=0; q.textContent=arr[i];
  setInterval(()=>{i=(i+1)%arr.length;q.textContent=arr[i];},10000);
}


