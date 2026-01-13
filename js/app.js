// =======================
// DATA & STORAGE
// =======================
let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {date:"2026-01-01", type:"income", category:"Gaji", amount:5000000, note:"Gaji Bulanan"},
  {date:"2026-01-05", type:"expense", category:"Makan", amount:750000, note:"Belanja"}
];

function saveData(){
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// =======================
// RENDER DASHBOARD
// =======================
function renderDashboard(){
  let income = 0, expense = 0;

  transactions.forEach(t=>{
    if(t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  document.getElementById("totalIncome").innerText = formatRupiah(income);
  document.getElementById("totalExpense").innerText = formatRupiah(expense);
  document.getElementById("balance").innerText = formatRupiah(income - expense);
  document.getElementById("saving").innerText = formatRupiah((income - expense) * 0.2);
}

// =======================
// TABEL
// =======================
function renderTable(){
  const table = document.getElementById("transactionTable");
  table.innerHTML = "";

  transactions.forEach((t,i)=>{
    table.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
        <td>${formatRupiah(t.amount)}</td>
        <td>${t.note}</td>
        <td><button class="delete" onclick="deleteTransaction(${i})">Hapus</button></td>
      </tr>
    `;
  });
}

function deleteTransaction(index){
  transactions.splice(index,1);
  saveData();
  updateAll();
}

// =======================
// FORM
// =======================
document.getElementById("transactionForm").addEventListener("submit",e=>{
  e.preventDefault();

  transactions.push({
    date: date.value,
    type: type.value,
    category: category.value,
    amount: Number(amount.value),
    note: note.value
  });

  saveData();
  e.target.reset();
  updateAll();
});

// =======================
// CHART
// =======================
let barChart, pieChart;

function renderCharts(){
  const income = transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const expense = transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);

  barChart?.destroy();
  pieChart?.destroy();

  barChart = new Chart(barChartCanvas,{
    type:"bar",
    data:{
      labels:["Pemasukan","Pengeluaran"],
      datasets:[{
        data:[income,expense],
        backgroundColor:["#00c853","#ff5252"]
      }]
    }
  });

  const categories = {};
  transactions.filter(t=>t.type==="expense").forEach(t=>{
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  pieChart = new Chart(pieChartCanvas,{
    type:"pie",
    data:{
      labels:Object.keys(categories),
      datasets:[{
        data:Object.values(categories),
        backgroundColor:["#2979ff","#ff9800","#8e24aa","#00c853","#ff5252"]
      }]
    }
  });
}

// =======================
// UTIL
// =======================
function formatRupiah(num){
  return "Rp " + num.toLocaleString("id-ID");
}

function updateAll(){
  renderDashboard();
  renderTable();
  renderCharts();
}

// INIT
const barChartCanvas = document.getElementById("barChart");
const pieChartCanvas = document.getElementById("pieChart");

updateAll();
