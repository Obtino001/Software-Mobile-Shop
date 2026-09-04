const fs = require('fs');

const generateId = (prefix) => prefix + '_' + Math.random().toString(36).substring(2, 9);

// Partners
const partners = [
  {
    id: "partner_kaqm98w",
    name: "Yasir",
    initialInvestment: 250000,
    additionalInvestment: 0,
    totalInvestment: 250000,
    withdrawals: 0,
    ownershipPercentage: 50,
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "partner_mexadrb",
    name: "Saad",
    initialInvestment: 250000,
    additionalInvestment: 0,
    totalInvestment: 250000,
    withdrawals: 0,
    ownershipPercentage: 50,
    createdAt: "2026-08-01T10:00:00.000Z",
  }
];

// Initial Transactions for Partner Equity
const transactions = [
  {
    id: "txn_init_yasir",
    type: 'Partner Investment',
    category: 'Capital In',
    amount: 250000,
    date: "2026-08-01T10:00:00.000Z",
    description: 'Initial Capital Investment - Yasir',
    account: 'cash',
    recordedBy: 'Admin'
  },
  {
    id: "txn_init_saad",
    type: 'Partner Investment',
    category: 'Capital In',
    amount: 250000,
    date: "2026-08-01T10:00:00.000Z",
    description: 'Initial Capital Investment - Saad',
    account: 'cash',
    recordedBy: 'Admin'
  }
];

// One Time Expenses for Shop (New handwritten image)
const oneTimeExpenses = [
  { day: '2026-08-06', amount: 300, cat: 'Electricity', title: 'Cable / Taar for fan + supply (One-Time)', notes: 'One Time Expense for Shop - Cable / Taar' },
  { day: '2026-08-06', amount: 1000, cat: 'Electricity', title: 'Supply (One-Time)', notes: 'One Time Expense for Shop - Power Supply' },
  { day: '2026-08-06', amount: 300, cat: 'Electricity', title: 'Lights (One-Time)', notes: 'One Time Expense for Shop - Shop Lights' },
  { day: '2026-08-06', amount: 500, cat: 'Other', title: 'Tech / Tools (One-Time)', notes: 'One Time Expense for Shop - Tech' },
  { day: '2026-08-06', amount: 8500, cat: 'Other', title: 'Chairs (One-Time)', notes: 'One Time Expense for Shop - Chairs' },
  { day: '2026-08-06', amount: 650, cat: 'Electricity', title: 'Extension (One-Time)', notes: 'One Time Expense for Shop - Extension Board' },
  { day: '2026-08-06', amount: 500, cat: 'Other', title: 'Artificial grass for counter (One-Time)', notes: 'One Time Expense for Shop - Counter Grass' },
  { day: '2026-08-06', amount: 1000, cat: 'Electricity', title: 'Fan (One-Time)', notes: 'One Time Expense for Shop - Fan' },
  { day: '2026-08-06', amount: 600, cat: 'Internet', title: 'Internet (wifi) 6/August (One-Time)', notes: 'One Time Expense for Shop - Wifi Internet' },
  { day: '2026-08-06', amount: 2000, cat: 'Accessories', title: 'Mobile cooler fan CX07 (One-Time)', notes: 'One Time Expense for Shop - Mobile Cooler Fan CX07' },
  { day: '2026-08-06', amount: 520, cat: 'Other', title: 'Bill Pad + Thumb Pad + stapler + carbon paper (One-Time)', notes: 'One Time Expense for Shop - Stationery' },
];

// Daily Expenses from all handwritten notebook images (August + September 2026)
const dailyExpenseNotes = [
  // Image 2: Day 5 - Day 9
  { day: '2026-08-05', amount: 250, cat: 'Food', title: '100 Pani, 30 Copy, 120 Khana', notes: 'Daily Expense' },
  { day: '2026-08-06', amount: 250, cat: 'Food', title: '100 Pani, 150 Khana', notes: 'Daily Expense' },
  { day: '2026-08-07', amount: 3000, cat: 'Transport', title: 'Karachi for Purchasing', notes: 'Daily Expense - Karachi Trip' },
  { day: '2026-08-07', amount: 600, cat: 'Food', title: 'Food', notes: 'Daily Expense' },
  { day: '2026-08-08', amount: 300, cat: 'Electricity', title: 'Lights', notes: 'Daily Expense' },
  { day: '2026-08-08', amount: 100, cat: 'Water', title: 'Pani', notes: 'Daily Expense' },
  { day: '2026-08-08', amount: 50, cat: 'Food', title: 'Paan', notes: 'Daily Expense' },
  { day: '2026-08-08', amount: 500, cat: 'Accessories', title: 'Samsung S20+ Protector Yasir', notes: 'Daily Expense' },
  { day: '2026-08-09', amount: 40, cat: 'Food', title: 'Tea', notes: 'Daily Expense' },
  // Day 10 closed

  // Image 3: Day 11 - Day 19
  { day: '2026-08-11', amount: 100, cat: 'Water', title: 'Pani', notes: 'Daily Expense' },
  { day: '2026-08-12', amount: 300, cat: 'Food', title: 'Water and Food', notes: 'Daily Expense' },
  { day: '2026-08-13', amount: 300, cat: 'Food', title: 'Water and Food', notes: 'Daily Expense' },
  { day: '2026-08-15', amount: 400, cat: 'Accessories', title: '50 Glass Moto G 2024, 100 Pani, 200 Food, 100 Glass', notes: 'Daily Expense' },
  { day: '2026-08-16', amount: 700, cat: 'Accessories', title: '400 Protector ONN Tab, 300 Food+Water', notes: 'Daily Expense' },
  { day: '2026-08-17', amount: 4750, cat: 'Transport', title: 'Bus Rent, Rikshaw, Bykea, Petrol, Food in Karachi', notes: 'Daily Expense - Karachi Tour 2' },

  // Image 4: Day 20 - Day 26
  { day: '2026-08-20', amount: 300, cat: 'Food', title: 'Water and Food', notes: 'Daily Expense' },
  { day: '2026-08-22', amount: 610, cat: 'Transport', title: 'TCS for Moto g Power 2025', notes: 'Daily Expense - Return TCS' },
  { day: '2026-08-22', amount: 300, cat: 'Food', title: 'Water and food', notes: 'Daily Expense' },
  { day: '2026-08-23', amount: 100, cat: 'Water', title: 'Water', notes: 'Daily Expense' },
  { day: '2026-08-24', amount: 100, cat: 'Water', title: 'Water', notes: 'Daily Expense' },
  { day: '2026-08-25', amount: 100, cat: 'Water', title: 'Water', notes: 'Daily Expense' },
  // Day 26 off 12 Rabbiulawal

  // Image 1: Day 29 - Day 31
  { day: '2026-08-29', amount: 250, cat: 'Accessories', title: 'Water and Panni on S2+', notes: 'Daily Expense' },
  { day: '2026-08-30', amount: 340, cat: 'Food', title: 'Water and Food', notes: 'Daily Expense' },
  { day: '2026-08-31', amount: 340, cat: 'Food', title: 'Water and Food', notes: 'Daily Expense' },

  // Image 5: September Shop Rent
  { day: '2026-09-01', amount: 15000, cat: 'Rent', title: 'Shop Rent September (Advance)', notes: 'Shop Rent September 15000 as per Ledger Sheet' },
];

const allExpenseItems = [...oneTimeExpenses, ...dailyExpenseNotes];

const expenses = [];
allExpenseItems.forEach((note, idx) => {
  const dateIso = `${note.day}T10:00:00.000Z`;
  const expId = `exp_${note.day.replace(/-/g, '')}_${idx + 1}`;
  
  expenses.push({
    id: expId,
    category: note.cat,
    title: note.title,
    amount: note.amount,
    date: dateIso,
    paymentMethod: 'Cash',
    paidFrom: 'cash',
    notes: note.notes
  });
  
  transactions.push({
    id: `txn_${expId}`,
    type: 'Expense',
    category: note.cat,
    amount: note.amount,
    date: dateIso,
    description: note.title,
    account: 'cash',
    referenceId: expId
  });
});

// Sales from Image 5: "Total Profit = 19500"
const sales = [
  {
    id: 'sale_august_ledger_profit',
    mobileId: 'mob_august_summary',
    customerName: 'August Mobile Trading (Walk-in Customers)',
    customerPhone: 'Walk-in',
    sellingPrice: 19500,
    costPrice: 0,
    profit: 19500,
    paymentMethod: 'Cash',
    date: '2026-08-31T18:00:00.000Z',
    notes: 'Total gross trading profit for August recorded from notebook reconciliation ledger',
    soldBy: 'Yasir & Saad'
  }
];

// Transaction for trading profit cash inflow
transactions.push({
  id: 'txn_sale_august_profit',
  type: 'Sale Income',
  category: 'Trading Profit',
  amount: 19500,
  date: '2026-08-31T18:00:00.000Z',
  description: 'August Mobile Sales Gross Profit (Notebook Ledger)',
  account: 'cash',
  referenceId: 'sale_august_ledger_profit'
});

const settings = {
  businessName: 'Yasir & Saad Mobile Trading',
  shopName: 'Yasir & Saad Mobile Trading',
  currency: 'PKR',
  monthlyExpenseTarget: 35000,
  defaultPartnerSplit: 50,
  tagline: 'Premium Used & New Smartphones | Hall Road Quality',
  phone: '+92 300 1234567 / +92 301 9876543',
  address: 'Shop # 14, Ground Floor, Al-Hafeez Shopping Mall',
  city: 'Lahore, Pakistan',
  defaultWarrantyDays: 7,
  theme: 'dark',
  categoryBudgets: {
    Food: 6000,
    Water: 1500,
    Transport: 8500,
    Rent: 15000,
    Electricity: 4000,
  }
};

const finalState = {
  partners,
  mobiles: [],
  phones: [],
  purchases: [],
  sales,
  expenses,
  transactions,
  budgets: [],
  settings
};

fs.writeFileSync('pakmobile_reset.json', JSON.stringify(finalState, null, 2));
console.log(`File pakmobile_reset.json updated successfully with ${expenses.length} total expenses!`);
