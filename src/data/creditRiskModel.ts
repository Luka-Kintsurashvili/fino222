// Client-side copy of supabase/functions/_shared/creditRiskModel.ts — kept in sync manually,
// same pattern as src/data/banks.ts / supabase/functions/_shared/loanMath.ts.
// See ml/model_card.md for the full model card.

export const CREDIT_RISK_MODEL = {
  features: [
    "age", "years_at_job", "monthly_income_gel", "income_months_last_6",
    "credit_history_months", "overdrafts_last_6m", "essentials_share_pct", "existing_loans",
    "loan_amount", "loan_term_months", "monthly_payment", "pti_pct",
    "region_Kutaisi", "region_Other", "region_Rustavi", "region_Tbilisi",
    "employment_type_public_sector", "employment_type_salaried", "employment_type_self_employed",
    "credit_history_none", "credit_history_some", "loan_currency_USD",
  ],
  mean: [
    36.361666666666665, 5.221928571428572, 2248.292857142857, 5.533333333333333,
    34.617619047619044, 1.615952380952381, 51.324285714285715, 0.7769047619047619,
    4585.309523809524, 24.884285714285713, 269.79785714285714, 18.984642857142855,
    0.1130952380952381, 0.18666666666666668, 0.08238095238095237, 0.4766666666666667,
    0.1530952380952381, 0.5466666666666666, 0.15357142857142858,
    0.265, 0.3678571428571429, 0.11976190476190476,
  ],
  scale: [
    10.473431560419614, 6.459705329756065, 1252.8194355310018, 0.9083387942168742,
    40.96430471761644, 1.328580623794771, 14.216291148313102, 0.8777622741820955,
    3714.853185512087, 13.974600793830886, 235.8235576203987, 11.0341310256629,
    0.3167091808195959, 0.38964371189873226, 0.2749442326468399, 0.49945525881259434,
    0.3600792776150836, 0.4978174587358525, 0.3605374389684921,
    0.4413332074521472, 0.48222221569119195, 0.32468290828084134,
  ],
  coef: [
    -0.15524501493874845, -0.06743502013150927, 0.01780353159212589, -0.41387993083683006,
    0.14438260476182643, 0.2847160025561531, 0.2420608699124566, -0.22676413983581895,
    0.04129909209256204, -0.014396587937878194, -0.7944509688953673, 0.9071969734631814,
    -0.031272508258251806, 0.1252276477797532, 0.06343464017578032, -0.009961359207164483,
    -0.08676342385950378, 0.012260764363668488, -0.14455728915627486,
    0.664074617872103, 0.22242455684243234, 0.49542062034186674,
  ],
  intercept: -2.5790192844033464,
} as const;

export const FEATURE_LABELS_KA: Record<string, string> = {
  age: "ასაკი",
  years_at_job: "სამსახურის სტაჟი",
  monthly_income_gel: "ყოველთვიური შემოსავალი",
  income_months_last_6: "შემოსავლიანი თვეები ბოლო 6-დან",
  credit_history_months: "საკრედიტო ისტორიის ხანგრძლივობა",
  overdrafts_last_6m: "გადახარჯვები ბოლო 6 თვეში",
  essentials_share_pct: "აუცილებელი ხარჯების წილი",
  existing_loans: "არსებული სესხების რაოდენობა",
  loan_amount: "სესხის თანხა",
  loan_term_months: "სესხის ვადა",
  monthly_payment: "ყოველთვიური გადასახადი",
  pti_pct: "გადასახადი/შემოსავლის თანაფარდობა (PTI)",
  region_Kutaisi: "რეგიონი: ქუთაისი",
  region_Other: "რეგიონი: სხვა",
  region_Rustavi: "რეგიონი: რუსთავი",
  region_Tbilisi: "რეგიონი: თბილისი",
  employment_type_public_sector: "დასაქმება: საჯარო სექტორი",
  employment_type_salaried: "დასაქმება: დაქირავებული",
  employment_type_self_employed: "დასაქმება: თვითდასაქმებული",
  credit_history_none: "საკრედიტო ისტორია: არ არსებობს",
  credit_history_some: "საკრედიტო ისტორია: მცირე",
  loan_currency_USD: "სესხის ვალუტა: დოლარი",
};
