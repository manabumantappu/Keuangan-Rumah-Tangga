// =======================
// DATA & STATE
// =======================
let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {date:"2026-01-02", type:"income", category:"Gaji", amount:5000000, note:"Gaji Bulanan"},
  {date:"2026-01-05", type:"expense", category:"Makan", amount:750000, note:"Belanja Harian"},
  {date:"2026-01-10", type:"expense", category:"Listrik", amount:350000, note:"PLN"}
];

let selectedMonth = "";

// =======================
// STORAGE
// =======================
function saveData(){
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// =======================
// FILTERED DATA
// =======================
function getFilteredTransactions(){
  if(!selectedMonth) return transactions;
  return transactions.filter(t => t.date.startsWith(selectedMonth));
}

// =======================
// DASHBOARD
// =======================
function renderDashboard(){
  const data = getFilteredTransactions();
  let income = 0, expense = 0;

  data.forEach(t=>{
    t.type === "income" ? income += t.amount : expense += t.amount;
  });

  document.getElementById("totalIncome").innerText = formatRupiah(income);
  document.getElementById("totalExpense").innerText = formatRupiah(expense);
  document.getElementById("balance").innerText = formatRupiah(income - expense);
  document.getElementById("saving").innerText = formatRupiah((income - expense) * 0.2);

  checkWarning(income, expense);
}

// =======================
// WARNING BOROS
// =======================
function checkWarning(income, expense){
  const box = document.getElementById("warningBox");

  if(income > 0 && expense >= income * 0.8){
    box.classList.remove("hidden");
    box.innerHTML = `
      ⚠️ <strong>Peringatan Boros</strong><br>
      Pengeluaran mendekati pemasukan.<br>
      <em>"Sesungguhnya pemboros itu saudara setan"</em><br>
      (QS. Al-Isra: 27)
    `;
  } else {
    box.classList.add("hidden");
  }
}

// =======================
// TABLE
// =======================
function renderTable(){
  const table = document.getElementById("transactionTable");
  table.innerHTML = "";

  getFilteredTransactions().forEach((t,i)=>{
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
document.getElementById("transactionForm").addEventListener("submit", e=>{
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
// FILTER BULAN
// =======================
document.getElementById("monthFilter").addEventListener("change", e=>{
  selectedMonth = e.target.value;
  updateAll();
});

// =======================
// CHART
// =======================
let barChart, pieChart;

function renderCharts(){
  const data = getFilteredTransactions();

  let income = 0, expense = 0;
  const categories = {};

  data.forEach(t=>{
    if(t.type === "income") income += t.amount;
    else {
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
        data:Object.values(categories),
        backgroundColor:["#1565c0","#ff9800","#8e24aa","#0f9d58","#c62828"]
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

// =======================
// INIT
// =======================
const barChartCanvas = document.getElementById("barChart");
const pieChartCanvas = document.getElementById("pieChart");
updateAll();
