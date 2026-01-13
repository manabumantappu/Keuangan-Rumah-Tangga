/* ================= PIN ================= */
const DEFAULT_PIN = "4215";
const SECURITY_ANSWER = (localStorage.getItem("securityAnswer") || "jain").toLowerCase();

function getPIN(){ return localStorage.getItem("pin") || DEFAULT_PIN; }

function checkPIN(){
  if(pinInput.value === getPIN()){
    pinOverlay.classList.add("hidden");
    pinMsg.innerText="";
  } else pinMsg.innerText="❌ PIN salah";
}

window.onload=()=>pinOverlay.classList.remove("hidden");

function showResetPIN(){
  if(confirm("Reset PIN ke default (4215)?")){
    localStorage.setItem("pin",DEFAULT_PIN);
    location.reload();
  }
}

function showForgotPIN(){
  forgotOverlay.classList.remove("hidden");
}

function verifySecurity(){
  if(securityAnswer.value.toLowerCase()===SECURITY_ANSWER){
    localStorage.setItem("pin",DEFAULT_PIN);
    forgotMsg.innerText="✅ PIN di-reset ke 4215";
    setTimeout(()=>location.reload(),1200);
  } else forgotMsg.innerText="❌ Jawaban salah";
}

function changePIN(){
  if(oldPin.value!==getPIN()){pinChangeMsg.innerText="❌ PIN lama salah";return}
  if(newPin.value.length!==4||isNaN(newPin.value)){pinChangeMsg.innerText="❌ PIN harus 4 digit";return}
  if(newPin.value!==confirmPin.value){pinChangeMsg.innerText="❌ Konfirmasi salah";return}
  localStorage.setItem("pin",newPin.value);
  pinChangeMsg.innerText="✅ PIN diganti";
  setTimeout(()=>location.reload(),1000);
}

/* ================= DATA ================= */
let transactions=JSON.parse(localStorage.getItem("transactions"))||[
  {date:"2026-01-02",type:"income",category:"Gaji",amount:5000000,note:"Gaji"},
  {date:"2026-01-05",type:"expense",category:"Makan",amount:750000,note:"Belanja"},
  {date:"2026-01-10",type:"sedekah",category:"Infaq",amount:200000,note:"Masjid"}
];
let selectedMonth="",isRamadhan=false;

function save(){localStorage.setItem("transactions",JSON.stringify(transactions))}
function filtered(){return selectedMonth?transactions.filter(t=>t.date.startsWith(selectedMonth)):transactions}

/* ================= DASHBOARD ================= */
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
  zakatValue.innerText=rupiah((inc-exp)>=85000000?(inc-exp)*0.025:0);
  warning(inc,exp);
}

/* ================= WARNING ================= */
function warning(i,e){
  const limit=isRamadhan?0.7:0.8;
  if(i>0&&e>=i*limit){
    warningBox.classList.remove("hidden");
    warningBox.innerHTML="⚠️ Boros! QS Al-Isra:27";
  } else warningBox.classList.add("hidden");
}

/* ================= ANALYSIS ================= */
function renderAnalysis(){
  const ex=filtered().filter(t=>t.type==="expense");
  if(!ex.length){analysisResult.innerHTML="<em>Tidak ada data</em>";return}
  const total=ex.reduce((a,b)=>a+b.amount,0);
  const cat={}; ex.forEach(t=>cat[t.category]=(cat[t.category]||0)+t.amount);
  const [c,v]=Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
  analysisResult.innerHTML=`<div class="analysis-box">Terbesar: <b>${c}</b> (${Math.round(v/total*100)}%)<br>💡 Kurangi ${c}</div>`;
}

/* ================= TABLE ================= */
function renderTable(){
  transactionTable.innerHTML="";
  filtered().forEach((t,i)=>{
    transactionTable.innerHTML+=`
    <tr><td>${t.date}</td><td>${t.type}</td><td>${t.category}</td>
    <td>${rupiah(t.amount)}</td><td>${t.note}</td>
    <td><button class="delete" onclick="del(${i})">Hapus</button></td></tr>`;
  });
}
function del(i){transactions.splice(i,1);save();update()}

/* ================= FORM ================= */
transactionForm.onsubmit=e=>{
  e.preventDefault();
  transactions.push({date:date.value,type:type.value,category:category.value,amount:+amount.value,note:note.value});
  save();e.target.reset();update();
}

/* ================= FILTER ================= */
monthFilter.onchange=e=>{selectedMonth=e.target.value;update()}
ramadhanMode.onchange=e=>{isRamadhan=e.target.checked;document.body.classList.toggle("ramadhan",isRamadhan);update()}

/* ================= CHART ================= */
let bar,pie;
function renderCharts(){
  let inc=0,exp=0,cat={};
  filtered().forEach(t=>{
    if(t.type==="income")inc+=t.amount;
    if(t.type==="expense"){exp+=t.amount;cat[t.category]=(cat[t.category]||0)+t.amount}
  });
  bar?.destroy(); pie?.destroy();
  bar=new Chart(barChart,{type:"bar",data:{labels:["Masuk","Keluar"],datasets:[{data:[inc,exp]}]}});
  pie=new Chart(pieChart,{type:"pie",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat)}]}});
}

function rupiah(n){return"Rp "+n.toLocaleString("id-ID")}
function update(){renderDashboard();renderAnalysis();renderTable();renderCharts()}
update();
