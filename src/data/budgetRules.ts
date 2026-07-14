export interface BudgetRule {
  id: string;
  label: string;
  description: string;
  needs: number;
  wants: number;
  savings: number;
}

export const budgetRules: BudgetRule[] = [
  {
    id: "classic",
    label: "50/30/20 კლასიკური",
    description: "დაბალანსებული წესი: საჭიროებები, სურვილები და დანაზოგი",
    needs: 50,
    wants: 30,
    savings: 20,
  },
  {
    id: "economic",
    label: "70/20/10 ეკონომიური",
    description: "მეტი სივრცე ყოველდღიური ხარჯებისთვის, ზომიერი დანაზოგი",
    needs: 70,
    wants: 20,
    savings: 10,
  },
  {
    id: "zero-based",
    label: "Zero-Based",
    description: "ყოველი ლარი ინაწილება მიზანზე — მეტი დანაზოგისკენ",
    needs: 55,
    wants: 15,
    savings: 30,
  },
  {
    id: "aggressive",
    label: "აგრესიული ინვესტორი",
    description: "მინიმალური ხარჯები, მაქსიმალური ინვესტიცია",
    needs: 50,
    wants: 10,
    savings: 40,
  },
];
