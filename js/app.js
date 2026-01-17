/* =========================================================
   KEUANGAN RUMAH TANGGA ISLAMI
   FINAL CLEAN VERSION
   ========================================================= */

/* ===== GLOBAL DATA ===== */
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let selectedMonth = "";
let selectedUser = "all";
let isRamadhan = false;
let editIndex = null;

/* ===== DOM ELEMENTS ===== */
let transactionTable, transactionForm;
let totalIncome, totalExpense, balance, saving;
let sedekahValue, zakatValue, warningBox, analysisResult;
let monthFilter, userFilter, ramadhanMode;
let barChart, pieChart;
let dateEl, userEl, typeEl, categoryEl, amountEl, noteEl;

/* ===== DOM READY ===== */
document.addEventListener("DOMContentLoaded", init);

function init() {
  transactionTable = document.getElementById("transactionTable");
  transactionForm  = document.getElementById("transactionForm");

  totalIncome   = document.getElementById("totalIncome");
  totalExpense  = document.getElementById("totalExpense");
  balance       = document.getElementById("balance");
  saving        = document.getElementById("saving");
  sedekahValue  = document.getElementById("sedekahValue");
  zakatValue    = document.getElementById("zakatValue");
  warningBox    = document.getElementById("warningBox");
  analysisResult= document.getElementById("analysisResult");

  monthFilter   = document.getElementById("monthFilter");
  userFilter    = document.getElementById("userFilter");
  ramadhanMode  = document.getElementById("ramadhanMode");

  barChart      = document.getElementById("barChart");
  pieChart      = document.getElementById("pieChart");

  dateEl     = document.getElementById("date");
  userEl     = document.getElementById("user");
  typeEl     = document.getElementById("type");
  categoryEl = document.getElementById("category");
  amountEl   = document.getElementById("amount");
  noteEl     = document.getElementById("note");

  transactionForm.addEventListener("submit", onSubmit);
  monthFilter.onchange   = e => { selectedMonth = e.target.value; update(); };
  userFilter.onchange    = e => { selectedUser  = e.target.value; update(); };
  ramadhanMode.onchange  = e => { isRamadhan = e.target.checked; update(); };

  setupTheme();
  setupQuotes();
  setupImport();

  update();
}

/* ===== STORAGE ===== */
function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* ===== FILTER ===== */
function filtered() {
  return transactions.filter(t =>
    (!selectedMonth || t.date.startsWith(selectedMonth)) &&
    (selectedUser === "all" || t.user === selectedUser)
  );
}

/* ===== DASHBOARD ===== */
function renderDashboard() {
  let inc = 0, exp = 0, sed = 0;

  filtered().forEach(t => {
    if (t.type === "income") inc += t.amount;
    else if (t.type === "expense") exp += t.amount;
    else if (t.type === "sedekah") sed += t.amount;
  });

  totalIncome.textContent  = rupiah(inc);
  totalExpense.textContent = rupiah(exp);
  balance.textContent      = rupiah(inc - exp);
  saving.textContent       = rupiah((inc - exp) * 0.2);
  sedekahValue.textContent = rupiah(sed);
  zakatValue.textContent   =
    (inc - exp >= 85000000) ? rupiah((inc - exp) * 0.025) : "Rp 0";

  const persenSedekah = isRamadhan ? 0.08 : 0.05;
  document.getElementById("sedekahRecommend").textContent =
    rupiah(inc * persenSedekah);

  if (exp >= inc * (isRamadhan ? 0.7 : 0.8)) {
    warningBox.classList.remove("hidden");
    warningBox.textContent = "⚠️ Pengeluaran mendekati/melewati pemasukan";
  } else {
    warningBox.classList.add("hidden");
  }
}

/* ===== ANALISIS ===== */
function renderAnalysis() {
  const exp = filtered().filter(t => t.type === "expense");
  if (!exp.length) {
    analysisResult.textContent = "Tidak ada data";
    return;
  }

  const total = exp.reduce((a,b)=>a+b.amount,0);
  const cat = {};
  exp.forEach(t => cat[t.category] = (cat[t.category]||0) + t.amount);

  const [c,v] = Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
  analysisResult.innerHTML =
    `Terbesar: <b>${c}</b> (${Math.round(v/total*100)}%)<br>💡 Kurangi ${c}`;
}

/* ===== TABLE ===== */
function renderTable() {
  transactionTable.innerHTML = "";
  filtered().forEach((t,i)=>{
    transactionTable.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.user}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${rupiah(t.amount)}</td>
        <td>${t.note}</td>
        <td>
          <button onclick="editTransaction(${i})">✏️</button>
          <button onclick="deleteTransaction(${i})">🗑️</button>
        </td>
      </tr>`;
  });
}

/* ===== CHART ===== */
let bar, pie;
function renderCharts() {
  let inc=0, exp=0, cat={};
  filtered().forEach(t=>{
    if(t.type==="income") inc+=t.amount;
    if(t.type==="expense"){
      exp+=t.amount;
      cat[t.category]=(cat[t.category]||0)+t.amount;
    }
  });

  bar?.destroy(); pie?.destroy();
  bar = new Chart(barChart,{type:"bar",data:{labels:["Masuk","Keluar"],datasets:[{data:[inc,exp]}]}});
  pie = new Chart(pieChart,{type:"pie",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
}

/* ===== SUBMIT ===== */
function onSubmit(e){
  e.preventDefault();

  const data = {
    date: dateEl.value,
    user: userEl.value,
    type: typeEl.value,
    category: categoryEl.value,
    amount: +amountEl.value,
    note: noteEl.value
  };

  if(editIndex !== null){
    transactions[editIndex] = data;
    editIndex = null;
  } else {
    transactions.push(data);
  }

  save();
  e.target.reset();
  update();
}

/* ===== UTIL ===== */
function rupiah(n){ return "Rp " + n.toLocaleString("id-ID"); }
function update(){
  renderDashboard();
  renderAnalysis();
  renderTable();
  renderCharts();
}

/* ===== RESET / UNDO ===== */
window.resetData = ()=>{
  if(!confirm("Hapus semua data?")) return;
  localStorage.setItem("transactions_backup", JSON.stringify(transactions));
  localStorage.removeItem("transactions");
  location.reload();
};

window.undoReset = ()=>{
  const b = localStorage.getItem("transactions_backup");
  if(!b) return alert("Tidak ada data");
  localStorage.setItem("transactions", b);
  location.reload();
};

/* ===== EXPORT / IMPORT ===== */
window.exportData = ()=>{
  const blob = new Blob([JSON.stringify(transactions,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "keuangan-rumah-tangga.json";
  a.click();
};

window.triggerImport = ()=>{
  document.getElementById("importFile")?.click();
};

function setupImport(){
  const input = document.getElementById("importFile");
  if(!input) return;

  input.addEventListener("change",()=>{
    const r = new FileReader();
    r.onload = ()=>{
      transactions = JSON.parse(r.result);
      save();
      update();
      alert("✅ Import berhasil");
    };
    r.readAsText(input.files[0]);
    input.value="";
  });
}

/* ===== EDIT / DELETE ===== */
window.editTransaction = index=>{
  const t = filtered()[index];
  if(!t) return;

  dateEl.value = t.date;
  userEl.value = t.user;
  typeEl.value = t.type;
  categoryEl.value = t.category;
  amountEl.value = t.amount;
  noteEl.value = t.note;

  editIndex = transactions.indexOf(t);
};

window.deleteTransaction = index=>{
  const t = filtered()[index];
  transactions.splice(transactions.indexOf(t),1);
  save();
  update();
};

/* ===== THEME ===== */
function setupTheme(){
  const toggle = document.getElementById("themeToggle");
  if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark");
    if(toggle) toggle.checked=true;
  }
  toggle?.addEventListener("change",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",toggle.checked?"dark":"light");
  });
}

/* ===== QUOTES ===== */
function setupQuotes(){
  const q = document.getElementById("quoteText");
  if(!q) return;
  const arr=[
    "Harta tidak akan berkurang karena sedekah.",
    "Sesungguhnya pemboros adalah saudara setan.",
    "Jika kamu bersyukur niscaya Aku tambah nikmat."
  ];
  let i=0;
  q.textContent=arr[i];
  setInterval(()=>{i=(i+1)%arr.length;q.textContent=arr[i];},10000);
}
