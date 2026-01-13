// ===== PIN =====
const savedPIN = localStorage.getItem("pin") || "4215";
function checkPIN(){
  const input = document.getElementById("pinInput").value;
  if(input === savedPIN){
    document.getElementById("pinOverlay").classList.add("hidden");
  }else{
    document.getElementById("pinMsg").innerText = "PIN salah";
  }
}
window.onload = ()=>document.getElementById("pinOverlay").classList.remove("hidden");
function changePIN(){
  const oldPin = document.getElementById("oldPin").value;
  const newPin = document.getElementById("newPin").value;
  const confirmPin = document.getElementById("confirmPin").value;
  const msg = document.getElementById("pinChangeMsg");

  const currentPIN = localStorage.getItem("pin") || "1234";

  if(oldPin !== currentPIN){
    msg.style.color = "red";
    msg.innerText = "❌ PIN lama salah";
    return;
  }

  if(newPin.length !== 4 || isNaN(newPin)){
    msg.style.color = "red";
    msg.innerText = "❌ PIN baru harus 4 digit angka";
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

  // reset form
  document.getElementById("oldPin").value = "";
  document.getElementById("newPin").value = "";
  document.getElementById("confirmPin").value = "";
}

// ===== DATA =====
let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {date:"2026-01-02",type:"income",category:"Gaji",amount:5000000,note:"Gaji"},
  {date:"2026-01-05",type:"expense",category:"Makan",amount:750000,note:"Belanja"},
  {date:"2026-01-10",type:"sedekah",category:"Infaq",amount:200000,note:"Masjid"}
];
let selectedMonth="", isRamadhan=false;

function save(){localStorage.setItem("transactions",JSON.stringify(transactions))}
function filtered(){return selectedMonth?transactions.filter(t=>t.date.startsWith(selectedMonth)):transactions}

// ===== DASHBOARD =====
function renderDashboard(){
  let inc=0,exp=0,sed=0;
  filtered().forEach(t=>{
    if(t.type==="income")inc+=t.amount;
    else if(t.type==="expense")exp+=t.amount;
    else sed+=t.amount;
  });
  totalIncome.innerText=rupiah(inc);
  totalExpense.innerText=rupiah(exp);
  balance.innerText=rupiah(inc-exp);
  saving.innerText=rupiah((inc-exp)*0.2);
  sedekahValue.innerText=rupiah(sed);
  zakatValue.innerText=rupiah((inc-exp)>85000000?(inc-exp)*0.025:0);
  warning(inc,exp);
}

// ===== WARNING =====
function warning(inc,exp){
  const limit=isRamadhan?0.7:0.8;
  if(inc>0 && exp>=inc*limit){
    warningBox.classList.remove("hidden");
    warningBox.innerHTML=`⚠️ Boros!<br><em>QS Al-Isra:27</em>`;
  }else warningBox.classList.add("hidden");
}

// ===== ANALYSIS =====
function renderAnalysis(){
  const exp=filtered().filter(t=>t.type==="expense");
  if(!exp.length){analysisResult.innerHTML="<em>Tidak ada data</em>";return}
  const total=exp.reduce((a,b)=>a+b.amount,0);
  const cat={}; exp.forEach(t=>cat[t.category]=(cat[t.category]||0)+t.amount);
  const top=Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
  analysisResult.innerHTML=`
  <div class="analysis-box">
  Pengeluaran terbesar: <strong>${top[0]}</strong> (${Math.round(top[1]/total*100)}%)<br>
  💡 Kurangi ${top[0]} dengan perencanaan lebih baik.
  </div>`;
}

// ===== TABLE =====
function renderTable(){
  transactionTable.innerHTML="";
  filtered().forEach((t,i)=>{
    transactionTable.innerHTML+=`
    <tr>
      <td>${t.date}</td><td>${t.type}</td><td>${t.category}</td>
      <td>${rupiah(t.amount)}</td><td>${t.note}</td>
      <td><button class="delete" onclick="del(${i})">Hapus</button></td>
    </tr>`;
  });
}
function del(i){transactions.splice(i,1);save();update()}

// ===== FORM =====
transactionForm.onsubmit=e=>{
  e.preventDefault();
  transactions.push({date:date.value,type:type.value,category:category.value,amount:+amount.value,note:note.value});
  save(); e.target.reset(); update();
}

// ===== FILTER =====
monthFilter.onchange=e=>{selectedMonth=e.target.value;update()}
ramadhanMode.onchange=e=>{isRamadhan=e.target.checked;document.body.classList.toggle("ramadhan",isRamadhan);update()}

// ===== CHART =====
let bar,pie;
function renderCharts(){
  const data=filtered();
  let inc=0,exp=0,cat={};
  data.forEach(t=>{
    if(t.type==="income")inc+=t.amount;
    if(t.type==="expense"){exp+=t.amount;cat[t.category]=(cat[t.category]||0)+t.amount}
  });
  bar?.destroy(); pie?.destroy();
  bar=new Chart(barChart,{type:"bar",data:{labels:["Masuk","Keluar"],datasets:[{data:[inc,exp],backgroundColor:["#0f9d58","#c62828"]}]}});
  pie=new Chart(pieChart,{type:"pie",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
}

function rupiah(n){return"Rp "+n.toLocaleString("id-ID")}
function update(){renderDashboard();renderAnalysis();renderTable();renderCharts()}
update();
