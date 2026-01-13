let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let selectedMonth = "";
let selectedUser = "all";
let isRamadhan = false;

function save(){ localStorage.setItem("transactions", JSON.stringify(transactions)); }

function filtered(){
  return transactions.filter(t=>{
    return (!selectedMonth || t.date.startsWith(selectedMonth)) &&
           (selectedUser==="all" || t.user===selectedUser);
  });
}

function renderDashboard(){
  let inc = 0, exp = 0, sed = 0;

  // hitung total
  filtered().forEach(t=>{
    if(t.type === "income") inc += t.amount;
    else if(t.type === "expense") exp += t.amount;
    else if(t.type === "sedekah") sed += t.amount;
  });

  // tampilkan ringkasan
  totalIncome.innerText = rupiah(inc);
  totalExpense.innerText = rupiah(exp);
  balance.innerText = rupiah(inc - exp);
  saving.innerText = rupiah((inc - exp) * 0.2);
  sedekahValue.innerText = rupiah(sed);
  zakatValue.innerText = rupiah(
    (inc - exp) >= 85000000 ? (inc - exp) * 0.025 : 0
  );

  // ===== REKOMENDASI SEDEKAH (BENAR) =====
  const persenSedekah = isRamadhan ? 0.08 : 0.05;
  const rekomendasi = inc * persenSedekah;

  document.getElementById("sedekahRecommend").innerText =
    rupiah(rekomendasi);

  const kurang = rekomendasi - sed;
  const note = document.getElementById("sedekahNote");

  if(kurang > 0){
    note.innerText =
      `💡 Disarankan menambah sedekah sebesar ${rupiah(kurang)}`;
    note.style.color = "#c62828";
  } else {
    note.innerText = "✅ Sedekah bulan ini sudah mencukupi";
    note.style.color = "#0f9d58";
  }
// ===== PERINGATAN SEDEKAH 0 =====
const sedekahWarningId = "sedekahWarning";
let sedWarn = document.getElementById(sedekahWarningId);

// buat elemen kalau belum ada
if(!sedWarn){
  sedWarn = document.createElement("div");
  sedWarn.id = sedekahWarningId;
  sedWarn.className = "warning";
  sedekahValue.parentElement.appendChild(sedWarn);
}

if(inc > 0 && sed === 0){
  sedWarn.classList.remove("hidden");
  sedWarn.innerHTML = `
    🕌 <strong>Belum ada sedekah</strong><br>
    <em>"Harta tidak akan berkurang karena sedekah"</em><br>
    (HR. Muslim)
  `;
} else {
  sedWarn.classList.add("hidden");
}

  // ===== PERINGATAN BOROS =====
  const limit = isRamadhan ? 0.7 : 0.8;
  if(exp >= inc * limit){
    warningBox.classList.remove("hidden");
    warningBox.innerText =
      "⚠️ Pengeluaran mendekati/melewati pemasukan";
  } else {
    warningBox.classList.add("hidden");
  }
}

function renderAnalysis(){
  const exp=filtered().filter(t=>t.type==="expense");
  if(!exp.length){analysisResult.innerHTML="Tidak ada data";return}
  const total=exp.reduce((a,b)=>a+b.amount,0);
  const cat={};
  exp.forEach(t=>cat[t.category]=(cat[t.category]||0)+t.amount);
  const [c,v]=Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
  analysisResult.innerHTML=`Terbesar: <b>${c}</b> (${Math.round(v/total*100)}%)<br>💡 Kurangi ${c}`;
}

function renderTable(){
  transactionTable.innerHTML="";
  filtered().forEach(t=>{
    transactionTable.innerHTML+=`
      <tr>
        <td>${t.date}</td><td>${t.user}</td><td>${t.type}</td>
        <td>${t.category}</td><td>${rupiah(t.amount)}</td><td>${t.note}</td>
      </tr>`;
  });
}

let bar,pie;
function renderCharts(){
  let inc=0, exp=0, cat={};
  filtered().forEach(t=>{
    if(t.type==="income") inc+=t.amount;
    if(t.type==="expense"){exp+=t.amount;cat[t.category]=(cat[t.category]||0)+t.amount}
  });
  bar?.destroy(); pie?.destroy();
  bar=new Chart(barChart,{type:"bar",data:{labels:["Masuk","Keluar"],datasets:[{data:[inc,exp]}]}});
  pie=new Chart(pieChart,{type:"pie",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
}

transactionForm.onsubmit=e=>{
  e.preventDefault();
  transactions.push({
    date:date.value,user:user.value,type:type.value,
    category:category.value,amount:+amount.value,note:note.value
  });
  save();e.target.reset();update();
};

monthFilter.onchange=e=>{selectedMonth=e.target.value;update();}
userFilter.onchange=e=>{selectedUser=e.target.value;update();}
ramadhanMode.onchange=e=>{isRamadhan=e.target.checked;document.body.classList.toggle("ramadhan",isRamadhan);update();}

function rupiah(n){return"Rp "+n.toLocaleString("id-ID")}
function update(){renderDashboard();renderAnalysis();renderTable();renderCharts()}
update();
function resetData(){
  const yakin = confirm(
    "⚠️ Semua data transaksi akan dihapus.\n" +
    "Kamu masih bisa UNDO dalam beberapa menit.\n\n" +
    "Lanjutkan?"
  );

  if(!yakin) return;

  // simpan backup sementara
  localStorage.setItem(
    "transactions_backup",
    localStorage.getItem("transactions")
  );

  localStorage.setItem(
    "transactions_backup_time",
    Date.now()
  );

  // hapus data utama
  localStorage.removeItem("transactions");

  alert("Data di-reset. Kamu bisa UNDO dalam 5 menit.");
  location.reload();
}
function undoReset(){
  const backup = localStorage.getItem("transactions_backup");
  const time = localStorage.getItem("transactions_backup_time");

  if(!backup || !time){
    alert("Tidak ada data untuk di-undo.");
    return;
  }

  const batas = 5 * 60 * 1000; // 5 menit
  if(Date.now() - Number(time) > batas){
    localStorage.removeItem("transactions_backup");
    localStorage.removeItem("transactions_backup_time");
    alert("Waktu undo sudah habis.");
    return;
  }

  // restore data
  localStorage.setItem("transactions", backup);

  // hapus backup
  localStorage.removeItem("transactions_backup");
  localStorage.removeItem("transactions_backup_time");

  alert("Data berhasil dikembalikan.");
  location.reload();
}
const yearEl = document.getElementById("year");
if(yearEl){
  yearEl.innerText = new Date().getFullYear();
}


