export type Language = "ka" | "en";

export const translations = {
  appName: { ka: "ფინო", en: "Fino" },
  tagline: { ka: "შენი პირადი ფინანსური ასისტენტი", en: "Your personal finance assistant" },

  // Bottom nav / More sheet
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
} as const;

export type TranslationKey = keyof typeof translations;
