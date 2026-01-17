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

/* ===== DOM ===== */
let transactionForm, transactionTable;
let dateEl, userEl, typeEl, categoryEl, amountEl, noteEl;
let totalIncome, totalExpense, balance, saving;
let sedekahValue, zakatValue, analysisResult, warningBox;
let monthFilter, userFilter, ramadhanMode;
let barCanvas, pieCanvas;
let barChart, pieChart;

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", init);

function init(){
  // FORM
  transactionForm = document.getElementById("transactionForm");
  transactionTable = document.getElementById("transactionTable");

  dateEl = document.getElementById("date");
  userEl = document.getElementById("user");
  typeEl = document.getElementById("type");
  categoryEl = document.getElementById("category");
  amountEl = document.getElementById("amount");
  noteEl = document.getElementById("note");

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
  ramadhanMode.onchange = e => { isRamadhan = e.target.checked; update(); };

  setupTheme();
  setupQuotes();
  setupImport();

  update();
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

  // 1️⃣ HITUNG DULU SEMUA DATA
  filtered().forEach(t=>{
    if(t.type === "income") inc += t.amount;
    if(t.type === "expense") exp += t.amount;
    if(t.type === "sedekah") sed += t.amount;
  });

  // 2️⃣ TAMPILKAN RINGKASAN
  totalIncome.textContent  = rupiah(inc);
  totalExpense.textContent = rupiah(exp);
  balance.textContent      = rupiah(inc - exp);
  saving.textContent       = rupiah((inc - exp) * 0.2);
  sedekahValue.textContent = rupiah(sed);
  zakatValue.textContent  =
    rupiah((inc - exp) >= 85000000 ? (inc - exp) * 0.025 : 0);

  // 3️⃣ PERINGATAN BOROS
  warningBox.classList.toggle("hidden", exp < inc * 0.8);

  // 4️⃣ REKOMENDASI SEDEKAH (FIXED)
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

  totalIncome.textContent = rupiah(inc);
  totalExpense.textContent = rupiah(exp);
  balance.textContent = rupiah(inc-exp);
  saving.textContent = rupiah((inc-exp)*0.2);
  sedekahValue.textContent = rupiah(sed);
  zakatValue.textContent = rupiah((inc-exp)>=85000000 ? (inc-exp)*0.025 : 0);

  warningBox.classList.toggle("hidden", exp < inc*0.8);
}

function renderAnalysis(){
  const expenses = filtered().filter(t => t.type === "expense");

  if(!expenses.length){
    analysisResult.innerHTML = "Belum ada data pengeluaran.";
    return;
  }

  const total = expenses.reduce((a,b)=>a+b.amount,0);
  const cat = {};
  expenses.forEach(t=>{
    cat[t.category] = (cat[t.category] || 0) + t.amount;
  });

  const [topCat, topVal] =
    Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];

  const percent = Math.round((topVal / total) * 100);

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
    "Harta tidak akan berkurang karena sedekah.",
    "Sesungguhnya pemboros adalah saudara setan.",
    "Jika kamu bersyukur niscaya Aku tambah nikmat."
  ];
  let i=0; q.textContent=arr[i];
  setInterval(()=>{i=(i+1)%arr.length;q.textContent=arr[i];},10000);
}
