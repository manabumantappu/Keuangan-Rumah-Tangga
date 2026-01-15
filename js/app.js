document.addEventListener("DOMContentLoaded", () => {
// ===== AMBIL ELEMEN DOM (WAJIB) =====
const transactionTable = document.getElementById("transactionTable");
const transactionForm  = document.getElementById("transactionForm");

const totalIncome   = document.getElementById("totalIncome");
const totalExpense  = document.getElementById("totalExpense");
const balance       = document.getElementById("balance");
const saving        = document.getElementById("saving");
const sedekahValue  = document.getElementById("sedekahValue");
const zakatValue    = document.getElementById("zakatValue");
const warningBox    = document.getElementById("warningBox");
const analysisResult= document.getElementById("analysisResult");

const monthFilter   = document.getElementById("monthFilter");
const userFilter    = document.getElementById("userFilter");
const ramadhanMode  = document.getElementById("ramadhanMode");

const barChart      = document.getElementById("barChart");
const pieChart      = document.getElementById("pieChart");

// input form
const date     = document.getElementById("date");
const user     = document.getElementById("user");
const type     = document.getElementById("type");
const category = document.getElementById("category");
const amount   = document.getElementById("amount");
const note     = document.getElementById("note");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let selectedMonth = "";
let selectedUser = "all";
let isRamadhan = false;

function save(){ localStorage.setItem("transactions", JSON.stringify(transactions)); }

function filtered(){
  return transactions.filter(t=>{
    return (!selectedMonth || t.date.startsWith(selectedMonth)) &&
           (selectedUser === "all" || t.user === selectedUser);
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
  transactionTable.innerHTML = "";

  filtered().forEach((t, i)=>{
    transactionTable.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.user}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${rupiah(t.amount)}</td>
        <td>${t.note}</td>
        <td>
          <button class="edit-btn" onclick="editTransaction(${i})">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteTransaction(${i})">🗑️ Hapus</button>
        </td>
      </tr>
    `;
  });

  const emptyEl = document.getElementById("emptyState");
  if(emptyEl){
    emptyEl.style.display = filtered().length ? "none" : "block";
  }
}



function deleteTransaction(index){
  const list = filtered();
  if(!list[index]) return;

  const yakin = confirm("Yakin ingin menghapus transaksi ini?");
  if(!yakin) return;

  const realIndex = transactions.indexOf(list[index]);
  if(realIndex === -1) return;

  transactions.splice(realIndex, 1);
  save();
  update();
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

transactionForm.onsubmit = e => {
  e.preventDefault();

  const data = {
    date: date.value,
    user: user.value,
    type: type.value,
    category: category.value,
    amount: +amount.value,
    note: note.value
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
  
window.resetData = resetData;
window.undoReset = undoReset;
  
const yearEl = document.getElementById("year");
if(yearEl){
  yearEl.innerText = new Date().getFullYear();
}

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

// load tema tersimpan
if(savedTheme === "dark"){
  document.body.classList.add("dark");
  if(themeToggle) themeToggle.checked = true;
}

// toggle event
if(themeToggle){
  themeToggle.addEventListener("change", () => {
    if(themeToggle.checked){
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
}
let editIndex = null;

function editTransaction(index){
  const list = filtered();
  if(!list[index]) return;

  const t = list[index];

  date.value = t.date;
  user.value = t.user;
  type.value = t.type;
  category.value = t.category;
  amount.value = t.amount;
  note.value = t.note;

  editIndex = transactions.indexOf(t);
}


// ===== FOOTER AYAT / HADITS BERGANTIAN =====
document.addEventListener("DOMContentLoaded", () => {
  const quoteEl = document.getElementById("quoteText");
  if(!quoteEl) return;

  const quotes = [
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


 let i = 0;
  quoteEl.innerText = quotes[i];

  setInterval(() => {
    i = (i + 1) % quotes.length;
    quoteEl.innerText = quotes[i];
  }, 10000);
});
// ===== EXPORT DATA =====
function exportData(){
  const data = {
    transactions: transactions,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "keuangan-rumah-tangga.json";
  a.click();

  URL.revokeObjectURL(url);
}
// ===== IMPORT DATA =====
function importData(event){
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const json = JSON.parse(e.target.result);

      if(!Array.isArray(json.transactions)){
        alert("❌ File tidak valid");
        return;
      }

      const yakin = confirm(
        "⚠️ Import data akan MENIMPA data saat ini.\n\nLanjutkan?"
      );
      if(!yakin) return;

      transactions = json.transactions;
      localStorage.setItem("transactions", JSON.stringify(transactions));

      alert("✅ Data berhasil di-import");
      location.reload();

    } catch(err){
      alert("❌ Gagal membaca file");
    }
  };

  reader.readAsText(file);
}
const compactToggle = document.getElementById("compactMode");
if(compactToggle){
  compactToggle.onchange = () => {
    document.body.classList.toggle("compact", compactToggle.checked);
  };
}

});

