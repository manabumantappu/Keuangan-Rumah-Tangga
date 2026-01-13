let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {date:"2026-01-02",user:"Ayah",type:"income",category:"Gaji",amount:5000000,note:"Gaji"},
  {date:"2026-01-05",user:"Ibu",type:"expense",category:"Makan",amount:700000,note:"Belanja"},
  {date:"2026-01-10",user:"Ayah",type:"sedekah",category:"Infaq",amount:200000,note:"Masjid"}
];

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
  let inc=0, exp=0, sed=0;
  filtered().forEach(t=>{
    if(t.type==="income") inc+=t.amount;
    else if(t.type==="expense") exp+=t.amount;
    else sed+=t.amount;
  });

  totalIncome.innerText = rupiah(inc);
  totalExpense.innerText = rupiah(exp);
  balance.innerText = rupiah(inc-exp);
  saving.innerText = rupiah((inc-exp)*0.2);
  sedekahValue.innerText = rupiah(sed);
  zakatValue.innerText = rupiah((inc-exp)>=85000000?(inc-exp)*0.025:0);

  const limit=isRamadhan?0.7:0.8;
  if(exp>=inc*limit){
    warningBox.classList.remove("hidden");
    warningBox.innerText="⚠️ Pengeluaran mendekati/melewati pemasukan";
  } else warningBox.classList.add("hidden");
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
