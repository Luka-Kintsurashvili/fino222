export type Language = "ka" | "en";

export const translations = {
  appName: { ka: "ფინო", en: "Fino" },
  tagline: { ka: "შენი პირადი ფინანსური ასისტენტი", en: "Your personal finance assistant" },

  // Bottom nav / More sheet
  navAccounts: { ka: "მთავარი", en: "Home" },
  navGraphs: { ka: "გრაფები", en: "Graphs" },
  navLoan: { ka: "სესხი", en: "Loan" },
  navBudget: { ka: "ბიუჯეტი", en: "Budget" },
  navSavings: { ka: "დანაზოგი", en: "Savings" },
  navCalendar: { ka: "კალენდარი", en: "Calendar" },
  navMore: { ka: "მეტი", en: "More" },
  navInflation: { ka: "ინფლაცია", en: "Inflation" },
  navArticles: { ka: "სტატიები", en: "Articles" },
  navCurrency: { ka: "ვალუტა", en: "Currency" },
  navAdvisor: { ka: "მრჩეველი", en: "Advisor" },
  moreSheetTitle: { ka: "მეტი", en: "More" },

  // Page headers
  accountsTitle: { ka: "მთავარი", en: "Home" },
  accountsSubtitle: {
    ka: "შენი ანგარიშები და ხარჯები ერთ ადგილას",
    en: "All your accounts and spending in one place",
  },
  graphsSubtitle: {
    ka: "შემოსავალი, ხარჯები და დანაზოგი თვეების მიხედვით",
    en: "Income, expenses, and savings by month",
  },
  loanTitle: { ka: "სესხი", en: "Loan" },
  loanSubtitle: {
    ka: "შეადარე, დაგეგმე ვადაზე ადრე დაფარვა და შეამოწმე შენი შესაძლებლობები",
    en: "Compare offers, plan an early payoff, and check your eligibility",
  },
  budgetTitle: { ka: "ბიუჯეტის განკარგვა", en: "Budget Management" },
  budgetSubtitle: {
    ka: "აირჩიე წესი, შემდეგ თავად დაარეგულირე თითოეული კატეგორია",
    en: "Pick a rule, then fine-tune each category yourself",
  },
  savingsGoalsTitle: { ka: "დანაზოგი და მიზნები", en: "Savings & Goals" },
  savingsGoalsSubtitle: {
    ka: "დაგეგმე დანაზოგი და თვალი ადევნე შენს მიზნებს",
    en: "Plan your savings and track your goals",
  },
  calendarTitle: { ka: "გადახდების კალენდარი", en: "Payment Calendar" },
  calendarSubtitle: { ka: "ნუ გამოტოვებ გადასახდელ თარიღებს", en: "Never miss a due date" },
  inflationTitle: { ka: "ინფლაციის კალკულატორი", en: "Inflation Calculator" },
  inflationSubtitle: {
    ka: "იხილე, როგორ იცვლება ფულის მსყიდველობითი უნარი",
    en: "See how your money's purchasing power changes over time",
  },
  articlesTitle: { ka: "სტატიები", en: "Articles" },
  articlesSubtitle: {
    ka: "ფინანსური განათლება მოკლედ და გასაგებად",
    en: "Financial education, short and clear",
  },
  currencyTitle: { ka: "ვალუტის კონვერტორი", en: "Currency Converter" },
  currencySubtitle: { ka: "რეალურ დროში კურსები", en: "Live exchange rates" },
  advisorTitle: { ka: "ფინანსური მრჩეველი", en: "Financial Advisor" },
  advisorSubtitle: {
    ka: "შეაფასე შენი გეგმის რეალისტურობა",
    en: "Check how realistic your plan is",
  },
  savingsPlanTab: { ka: "დანაზოგის გეგმა", en: "Savings Plan" },
  myGoalsTab: { ka: "ჩემი მიზნები", en: "My Goals" },
  loanComparisonTab: { ka: "სესხის შედარება", en: "Compare" },
  loanPayoffTab: { ka: "სესხის დაფარვა", en: "Payoff" },
  loanEligibilityTab: { ka: "სესხის უფლება", en: "Eligibility" },

  // Login
  signIn: { ka: "შესვლა", en: "Sign In" },
  signUp: { ka: "რეგისტრაცია", en: "Sign Up" },
  email: { ka: "ელფოსტა", en: "Email" },
  password: { ka: "პაროლი", en: "Password" },
  confirmPassword: { ka: "გაიმეორე პაროლი", en: "Confirm password" },
  fullName: { ka: "სახელი გვარი", en: "Full name" },
  forgotPassword: { ka: "დაგავიწყდა პაროლი?", en: "Forgot password?" },
  continueWithGoogle: { ka: "Google-ით გაგრძელება", en: "Continue with Google" },
  or: { ka: "ან", en: "or" },

  // Profile menu
  profile: { ka: "პროფილი", en: "Profile" },
  security: { ka: "უსაფრთხოება", en: "Security" },
  notifications: { ka: "შეტყობინებები", en: "Notifications" },
  settings: { ka: "პარამეტრები", en: "Settings" },
  logout: { ka: "გასვლა", en: "Log out" },
  login: { ka: "შესვლა", en: "Log in" },

  // Common
  save: { ka: "შენახვა", en: "Save" },
  saving: { ka: "ინახება...", en: "Saving..." },
  cancel: { ka: "გაუქმება", en: "Cancel" },
  delete: { ka: "წაშლა", en: "Delete" },
  back: { ka: "უკან", en: "Back" },
  loadingText: { ka: "იტვირთება...", en: "Loading..." },

  // Settings page
  theme: { ka: "თემა", en: "Theme" },
  themeDark: { ka: "მუქი", en: "Dark" },
  themeLight: { ka: "ღია", en: "Light" },
  language: { ka: "ენა", en: "Language" },

  // Accounts / home tab
  totalBalance: { ka: "სულ თანხა", en: "Total balance" },
  addAccount: { ka: "ბარათის დამატება", en: "Add card" },
  bank: { ka: "ბანკი", en: "Bank" },
  accountNickname: { ka: "ბარათის სახელი", en: "Card nickname" },
  accountNicknamePlaceholder: { ka: "მაგ. ჩემი ბარათი", en: "e.g. My card" },
  balance: { ka: "ბალანსი", en: "Balance" },
  expenses: { ka: "ხარჯები", en: "Expenses" },
  noExpenses: { ka: "ჯერ არ არის დამატებული ხარჯი", en: "No expenses added yet" },
  addTransaction: { ka: "ჩანაწერის დამატება", en: "Add transaction" },
  expense: { ka: "ხარჯი", en: "Expense" },
  income: { ka: "შემოსავალი", en: "Income" },
  amount: { ka: "თანხა", en: "Amount" },
  category: { ka: "კატეგორია", en: "Category" },
  note: { ka: "შენიშვნა", en: "Note" },
  notePlaceholder: { ka: "მაგ. სუპერმარკეტი", en: "e.g. Groceries" },
  graphsTileSubtitle: { ka: "შემოსავალი, ხარჯები და დანაზოგი", en: "Income, expenses, and savings" },
  incomeByMonth: { ka: "შემოსავალი თვეების მიხედვით", en: "Income by month" },
  expensesByCategory: { ka: "ხარჯები კატეგორიების მიხედვით", en: "Expenses by category" },
  leftoverByMonth: { ka: "დარჩენილი თანხა თვეების მიხედვით", en: "Leftover by month" },
  noData: { ka: "მონაცემები არ არის", en: "No data yet" },
} as const;

export type TranslationKey = keyof typeof translations;
