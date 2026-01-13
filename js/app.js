/* =========================
   PIN SECURITY (FINAL)
========================= */

// Ambil PIN dari localStorage atau default
function getPIN(){
  return localStorage.getItem("pin") || "4215";
}

// Cek PIN saat login
function checkPIN(){
  const input = document.getElementById("pinInput").value;
  const msg = document.getElementById("pinMsg");

  if(input === getPIN()){
    document.getElementById("pinOverlay").classList.add("hidden");
    msg.innerText = "";
  }else{
    msg.innerText = "❌ PIN salah";
  }
}

// Selalu kunci saat load
window.onload = () => {
  document.getElementById("pinOverlay").classList.remove("hidden");
};

// Ganti PIN via UI
function changePIN(){
  const oldPin = document.getElementById("oldPin").value.trim();
  const newPin = document.getElementById("newPin").value.trim();
  const confirmPin = document.getElementById("confirmPin").value.trim();
  const msg = document.getElementById("pinChangeMsg");

  if(oldPin !== getPIN()){
    msg.style.color = "red";
    msg.innerText = "❌ PIN lama salah";
    return;
  }

  if(newPin.length !== 4 || isNaN(newPin)){
    msg.style.color = "red";
    msg.innerText = "❌ PIN baru harus 4 digit angka";
    return;
  }

  if(newPin === getPIN()){
    msg.style.color = "red";
    msg.innerText = "❌ PIN baru tidak boleh sama dengan PIN lama";
    return;
  }

  if(newPin !== confirmPin){
    msg.style.color = "red";
    msg.innerText = "❌ Konfirmasi PIN tidak cocok";
    return;
  }

  localStorage.setItem("pin", newPin);
  msg.style.color = "green";
  msg.innerText = "✅ PIN berhasil diganti";

  // auto lock ulang
  setTimeout(() => location.reload(), 1000);
}

/* =========================
   DATA & STATE
========================= */

let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {date:"2026-01-02",type:"income",category:"Gaji",amount:5000000,note:"Gaji Bulanan"},
  {date:"2026-01-05",type:"expense",category:"Makan",amount:750000,note:"Belanja"},
  {date:"2026-01-10",type:"sedekah",category:"Infaq",amount:200000,note:"Masjid"}
];

let selectedMonth = "";
let isRamadhan = false;

function save(){
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function filtered(){
  return selectedMonth
    ? transactions.filter(t => t.date.startsWith(selectedMonth))
    : transactions;
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard(){
  let income = 0, expense = 0, sedekah = 0;

  filtered().forEach(t=>{
    if(t.type === "income") income += t.amount;
    else if(t.type === "expense") expense += t.amount;
    else if(t.type === "sedekah") sedekah += t.amount;
  });

  totalIncome.innerText = rupiah(income);
  totalExpense.innerText = rupiah(expense);
  balance.innerText = rupiah(income - expense);
  saving.innerText = rupiah((income - expense) * 0.2);
  sedekahValue.innerText = rupiah(sedekah);

  // zakat 2.5% jika saldo >= nisab (contoh 85 jt)
  zakatValue.innerText = rupiah(
    (income - expense) >= 85000000 ? (income - expense) * 0.025 : 0
  );

  renderWarning(income, expense);
}

/* =========================
   WARNING BOROS
========================= */

function renderWarning(income, expense){
  const limit = isRamadhan ? 0.7 : 0.8;

  if(income > 0 && expense >= income * limit){
    warningBox.classList.remove("hidden");
    warningBox.innerHTML = `
      ⚠️ <strong>Peringatan Boros</strong><br>
      <em>"Sesungguhnya pemboros itu adalah saudara setan"</em><br>
      (QS. Al-Isra: 27)
    `;
  }else{
    warningBox.classList.add("hidden");
  }
}

/* =========================
   ANALYSIS
========================= */

function renderAnalysis(){
  const expenses = filtered().filter(t => t.type === "expense");
  if(!expenses.length){
    analysisResult.innerHTML = "<em>Tidak ada data pengeluaran.</em>";
    return;
  }

  const total = expenses.reduce((a,b)=>a+b.amount,0);
  const byCat = {};

  expenses.forEach(t=>{
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });

  const [topCat, topVal] = Object.entries(byCat)
    .sort((a,b)=>b[1]-a[1])[0];

  analysisResult.innerHTML = `
    <div class="analysis-box">
      🔍 Pengeluaran terbesar: <strong>${topCat}</strong><br>
      Sebesar <strong>${rupiah(topVal)}</strong>
      (${Math.round(topVal/total*100)}%)
      <br><br>
      💡 <strong>Saran Hemat:</strong><br>
      Kurangi pengeluaran ${topCat} dengan perencanaan lebih baik.
    </div>
  `;
}

/* =========================
   TABLE
========================= */

function renderTable(){
  transactionTable.innerHTML = "";

  filtered().forEach((t,i)=>{
    transactionTable.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${rupiah(t.amount)}</td>
        <td>${t.note}</td>
        <td>
          <button class="delete" onclick="deleteTx(${i})">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });
}

function deleteTx(i){
  transactions.splice(i,1);
  save();
  update();
}

/* =========================
   FORM
========================= */

transactionForm.onsubmit = e => {
  e.preventDefault();

  transactions.push({
    date: date.value,
    type: type.value,
    category: category.value,
    amount: Number(amount.value),
    note: note.value
  });

  save();
  e.target.reset();
  update();
};

/* =========================
   FILTER & RAMADHAN
========================= */

monthFilter.onchange = e => {
  selectedMonth = e.target.value;
  update();
};

ramadhanMode.onchange = e => {
  isRamadhan = e.target.checked;
  document.body.classList.toggle("ramadhan", isRamadhan);
  update();
};

/* =========================
   CHART
========================= */

let barChart, pieChart;

function renderCharts(){
  const data = filtered();
  let income = 0, expense = 0;
  const categories = {};

  data.forEach(t=>{
    if(t.type === "income") income += t.amount;
    if(t.type === "expense"){
      expense += t.amount;
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    }
  });

  barChart?.destroy();
  pieChart?.destroy();

  barChart = new Chart(barChartCanvas,{
    type:"bar",
    data:{
      labels:["Pemasukan","Pengeluaran"],
      datasets:[{
        data:[income, expense],
        backgroundColor:["#0f9d58","#c62828"]
      }]
    }
  });

  pieChart = new Chart(pieChartCanvas,{
    type:"pie",
    data:{
      labels:Object.keys(categories),
      datasets:[{
        data:Object.values(categories)
      }]
    }
  });
}

/* =========================
   UTIL & INIT
========================= */

function rupiah(n){
  return "Rp " + n.toLocaleString("id-ID");
}

function update(){
  renderDashboard();
  renderAnalysis();
  renderTable();
  renderCharts();
}

update();
