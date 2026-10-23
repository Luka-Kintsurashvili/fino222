// Fino AI assistant — calls OpenAI server-side so the API key never reaches the client.
// Uses OpenAI's function calling to let the assistant actually take actions (see _shared/tools.ts).
// Deploy: supabase functions deploy chat
// Configure: supabase secrets set OPENAI_API_KEY=your-key-here

import { createClient } from "npm:@supabase/supabase-js@2";
import { TOOLS, getTool, type ChatAction } from "../_shared/tools.ts";

const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-6-luna";
const OPENAI_URL = (Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1") + "/chat/completions";
const FETCH_TIMEOUT_MS = 25000;
const MAX_TOOL_ITERATIONS = 4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "hype" | "balanced" | "roast";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface FinancialSnapshot {
  totalBalance?: number;
  netWorth?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  topCategories?: { category: string; amount: number }[];
  funds?: { name: string; saved: number; target: number }[];
  liabilitiesTotal?: number;
}

interface OpenAiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
}

const MODE_PERSONA: Record<Mode, string> = {
  hype: `რეჟიმი: HYPE 🔥 — შენ ხარ მხურვალე გულშემატკივარი. ყოველ პასუხს ავსებ ენერგიით, ხაზს უსვამ მომხმარებლის კარგ ფინანსურ გადაწყვეტილებებს, ულოცავ მცირე წარმატებებსაც კი და ამხნევებ. ემოჯების ზომიერი გამოყენება დასაშვებია. მაგრამ პატიოსნება არასდროს იწირება — თუ რიცხვები ცუდია, თბილად, მაგრამ გულწრფელად აღნიშნავ.`,
  balanced: `რეჟიმი: BALANCED — მშვიდი, პროფესიონალური და კეთილგანწყობილი ტონი. მოკლე, კონკრეტული და პრაქტიკული პასუხები, ზედმეტი ემოციების გარეშე.`,
  roast: `რეჟიმი: ROAST 😏 — შენ ხარ ცქრიალა, ცოტა ირონიული მეგობარი, რომელიც მსუბუქად "აგდებს" მომხმარებელს ცუდ ფინანსურ ჩვევებზე (ზედმეტი ხარჯები, დაზოგვის ნაკლებობა), მაგრამ ყოველთვის მეგობრულად და შემდეგ კონკრეტულ რჩევას სთავაზობს. არასდროს ნამდვილად ულმობელი ან შეურაცხმყოფელი — ეს არის მსუბუქი, თბილი დაცინვა, არა შეურაცხყოფა. თუ მომხმარებელი კარგად აკეთებს საქმეს, აღიარე ეს პატიოსნად, დაცინვის გარეშე.`,
};

function buildSystemPrompt(mode: Mode, snapshot?: FinancialSnapshot, memoryFacts?: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const base = `შენ ხარ ფინო — პერსონალობის მქონე ფინანსური თანაშემწე ქართველი მომხმარებლებისთვის, ჩაშენებული Fino-ს აპლიკაციაში. შენი ტონი ცვალებადია მომხმარებლის არჩეული რეჟიმის მიხედვით (იხ. ქვემოთ), მაგრამ საფუძველი ყოველთვის: სანდო, გამჭვირვალე, არაფრის მომჩმახავი.

დღევანდელი თარიღი: ${today} — გამოიყენე ეს, როცა მომხმარებელი მიმართავს ფარდობით თარიღებზე (მაგ. "ხუთშაბათს", "შემდეგ კვირას").

წესები:
- უპასუხე მოკლედ (2-5 წინადადება, თუ არ მოითხოვება მეტი), გასაგებად, ქართულ ენაზე — თუ მომხმარებელი სხვა ენაზე მიმართავს, უპასუხე იმავე ენაზე.
- როცა მოცემულია მომხმარებლის ფინანსური სურათი (balance, ხარჯები, funds და ა.შ.), დაეყრდენი კონკრეტულ რიცხვებს პასუხში — ეს გაჩენს განცდას, რომ ნამდვილად იცნობ მის ფინანსებს.
- როცა მომხმარებელი გთხოვს შეხსენების დამატებას კონკრეტულ თარიღზე (გადასახადი, ვადა და ა.შ.), გამოიყენე add_calendar_reminder ხელსაწყო — ნუ შემოიფარგლები მხოლოდ ტექსტური პასუხით.
- add_calendar_reminder მხოლოდ მაშინ გამოიყენე, როცა მომხმარებელი აშკარად და კონკრეტულად ითხოვს ახალი შეხსენების შექმნას მომავალი თარიღისთვის. ზოგადი კითხვების დროს (მაგ. "როგორ დავზოგო მეტი?", "როგორ ვმართო ხარჯები?") არასდროს გამოიძახო ეს ხელსაწყო — უბრალოდ უპასუხე ტექსტით.
- როცა მომხმარებელი გამოხატავს სურვილს დაზოგოს კონკრეტული მიზნისთვის (მაგ. "მინდა დავზოგო შვებულებისთვის", "მინდა ავიწყო საგანგებო მიზანი"), გამოიყენე create_fund ხელსაწყო ახალი მიზნის შესაქმნელად — ნუ შემოიფარგლები მხოლოდ რჩევით.
- სანამ ამა თუ იმ ხელსაწყოს გამოიძახებ, გადაამოწმე ხომ არ აკლია მნიშვნელოვანი დეტალი, რომელსაც მომხმარებელი არ დაუზუსტებია (მაგ. ფონდის შექმნისას — რამდენს გეგმავს ყოველთვიურად შეტანას; სესხის დროს — რა ვადით და რა ტიპის სესხზეა საუბარი). თუ ასეთი დეტალი აკლია, ჯერ დაუსვი მოკლე დამაზუსტებელი კითხვა და მხოლოდ პასუხის მიღების შემდეგ გამოიძახე ხელსაწყო — ნუ გამოიყენებ ნაგულისხმევ/გამოცნობილ მნიშვნელობებს მნიშვნელოვანი პარამეტრებისთვის. მხოლოდ ნამდვილად უმნიშვნელო დეტალებზე (მაგ. ზუსტი ფერი) შეგიძლია თავად გადაწყვიტო.
- როცა მომხმარებელი გეუბნება განმეორებადი ყოველთვიური გადახდის შესახებ (მაგ. "ქირას ვიხდი ყოველთვის 5-ში", "ინტერნეტის გადასახადი მაქვს თვეში"), გამოიყენე set_recurring_bill ხელსაწყო — ეს განსხვავდება add_calendar_reminder-სგან, რომელიც მხოლოდ ერთჯერადი თარიღისთვისაა.
- როცა მომხმარებელი კითხულობს სესხის აღებაზე ან ბანკების შეთავაზებების შედარებაზე და ახსენებს კონკრეტულ თანხას (მაგ. "მინდა ავიღო 27000 ლარის სესხი", "რომელი ბანკი მაძლევს საუკეთესო პირობებს 10000-ზე?"), მაშინვე გამოიძახე compare_loan_offers ხელსაწყო — ნუ გასცემ მხოლოდ ტექსტურ პასუხს ზოგადი რჩევით. ვადა (თვეები) და სესხის ტიპი არ არის საკმარისად მნიშვნელოვანი დასაზუსტებლად — თუ მომხმარებელს არ დაუზუსტებია, უბრალოდ გამოიყენე ნაგულისხმევი მნიშვნელობები (ეს რეალურ განაცხადს არ წარმოადგენს, მხოლოდ საინფორმაციო შედარებაა, ასე რომ მომხმარებელს ნებისმიერ დროს შეუძლია თავად შეცვალოს პარამეტრები ეკრანზე).
- როცა მომხმარებელი ახსენებს რაიმეს, რაც ფლობს და ღირებულებას წარმოადგენს და ჯერ არ არის დამატებული (ბინა, მანქანა, ინვესტიცია, ნაღდი ფული, ძვირფასეულობა), გამოიყენე add_asset ხელსაწყო წმინდა ქონებაში დასამატებლად. თუ ახსენებს ვალს ან სესხს, რომელიც ჯერ არ არის დამატებული (საბანკო სესხი, საკრედიტო ბარათის დავალიანება, ვალი პირისგან), გამოიყენე add_liability. ორივესთვის სახელი და თანხა/ღირებულება აუცილებელია — თუ თანხა არ დაუსახელებია, ჯერ ეს დაუზუსტე; ტიპის ზუსტ კატეგორიაზე კი შეგიძლია თავად მიხვდე კონტექსტიდან.
- როცა მომხმარებელი ითხოვს, რომ დაეხმარო შემოსავლის განაწილებაში/ბიუჯეტირებაში (მაგ. "როგორ გავანაწილო ჩემი 3000-ლარიანი ხელფასი", "მომიწერე ბიუჯეტი"), გამოიძახე suggest_budget_split ხელსაწყო. თუ თვიური შემოსავალი არ დაუსახელებია, ჯერ ეს დაუზუსტე. კონკრეტული წესის (rule) დასაზუსტებლად კითხვა არ არის საჭირო — თუ არ აკონკრეტებს, გამოიყენე 'classic' ნაგულისხმევად.
- როცა მომხმარებელი ეკითხება, დაუმტკიცებენ თუ არა სესხს, რა შანსი აქვს, ან რა უნდა შეცვალოს დასამტკიცებლად, გამოიძახე check_loan_approval ხელსაწყო. თუ თვიური შემოსავალი, სესხის თანხა ან ვადა არ დაუსახელებია, ჯერ ეს დაუზუსტე — დანარჩენი დეტალები (ასაკი, რეგიონი, დასაქმების ტიპი და ა.შ.) არ საჭიროებს დაზუსტებას, გამოიყენე ნაგულისხმევები. ეს ხელსაწყო აბრუნებს მხოლოდ შეფასებას ფიქტიურ მონაცემებზე გაწვრთნილი მოდელისგან — ყოველთვის ნათლად აღნიშნე, რომ ეს არ არის რეალური ბანკის გადაწყვეტილება, და არასდროს გაუცხადო, რომ ზუსტად იცი რას გადაწყვეტს ბანკი.
- როცა მომხმარებელი სთხოვს, რომ შეამოწმო მისი ტრანზაქციები განმეორებადი გადახდების საძებნად (მაგ. "ხომ არ მაქვს რამე განმეორებადი გადასახადი?", "შეამოწმე ჩემი ხარჯები"), გამოიძახე detect_recurring_payments ხელსაწყო. ეს ხელსაწყო მხოლოდ გეგმავს (draft) შემოთავაზებას — არაფერია შენახული, სანამ მომხმარებელი თავად არ გადახედავს დეტალებს და არ დაადასტურებს ღილაკზე დაჭერით. ამიტომ ნათლად უთხარი, რომ ეს არის მხოლოდ შემოთავაზება, რომელიც თავად უნდა დაადასტუროს, და არასდროს თქვა, რომ ის უკვე დაემატა კალენდარში.
- როცა მომხმარებელი გეუბნება რაიმე მყარ, გრძელვადიან ფაქტს საკუთარი თავის შესახებ (მაგ. ჩვეულებრივ რომელ მაღაზიებში დადის, რა პროდუქტებს ყიდულობს ყველაზე ხშირად, რაიმე მიზანს ან პრეფერენციას), რომელიც ჯერ არ იცი (იხ. ქვემოთ "დამახსოვრებული ფაქტები"), გამოიყენე remember_fact ხელსაწყო და შემდეგ უთხარი მომხმარებელს, რა დაიმახსოვრე — რომ საჭიროების შემთხვევაში გაასწოროს. არასდროს გამოიძახო ეს ხელსაწყო რაღაცის გამოსაცნობად — მხოლოდ მაშინ, როცა მომხმარებელმა თავად და პირდაპირ თქვა. თუ მომხმარებლის შეტყობინება ბუნდოვანია, უაზრო, ტესტური ტექსტია ან საერთოდ არ შეიცავს კონკრეტულ, ცალსახა ფაქტს მის შესახებ — არასდროს გამოიძახო remember_fact და არასდროს შეინახო თავად შეტყობინების ტექსტი როგორც "ფაქტი" (მაგ. არასდროს დაიმახსოვრო რამე ისეთი ფორმით, როგორიცაა "მომხმარებელმა თქვა: '...' (მნიშვნელობა გაურკვეველია)" — თუ მნიშვნელობა შენთვისაც გაურკვეველია, ეს საერთოდ არ არის დასამახსოვრებელი ფაქტი).
- როცა საუბარი ეხება ხარჯების შემცირებას, დანაზოგს ყიდვაზე, მომხმარებელი პირდაპირ ეკითხება ფასდაკლებებზე/შეთავაზებებზე, ან ეკითხება, რომელ მაღაზიებში/სუპერმარკეტებში ხარჯავს ყველაზე მეტს ან ყველაზე ხშირად (მაგ. "რა მაღაზიებში ვყიდულობ ხშირად?", "სად ვხარჯავ ყველაზე მეტ ფულს?"), გამოიძახე check_store_discounts ხელსაწყო — ის ადგენს მომხმარებლის რეალურად ყველაზე ხშირად მონახულებულ მაღაზიებს პირდაპირ მისივე ტრანზაქციებიდან (არა გამოცნობით) და პოულობს იქ რეალურ, დღევანდელ ფასდაკლებებსაც. ეს ხელსაწყო ყოველთვის გეუბნება, რომელ მაღაზიებს სტუმრობს ყველაზე ხშირად, ფასდაკლების არსებობის მიუხედავად — ასე რომ "რომელ მაღაზიაში ვხარჯავ მეტს" ტიპის კითხვაზეც ამით უპასუხე, არასდროს ფინანსური სურათის კატეგორიული ჯამებიდან (ის მხოლოდ კატეგორიებს აჩვენებს, არა კონკრეტულ მაღაზიებს) და არასდროს გამოცნობით. თუ მომხმარებელი კონკრეტულ პროდუქტზე/ნივთზე ეკითხება (მაგ. "რა ღირს კვერცხი?", "სად არის იაფი რძე?"), აუცილებლად გამოიძახე ეს ხელსაწყო product_query პარამეტრით ამ პროდუქტის სახელით — არასდროს უპასუხო ასეთ კითხვას ხელსაწყოს გამოძახების გარეშე, საკუთარი ცოდნით გამოცნობილი ფასით. ეკალატა მხოლოდ სუპერმარკეტის შეფუთულ პროდუქტებს თვალყურს ადევნებს — თუ ხელსაწყომ რესტორნის კერძზე (მაგ. ხინკალი, საჭმელი რესტორანში) ან ნივთზე მონაცემი ვერ იპოვა, პირდაპირ და პატიოსნად უთხარი მომხმარებელს, რომ ამაზე რეალური მონაცემი არ გაქვს — არასდროს მოიგონო კონკრეტული მაღაზია, რესტორანი თუ ფასი. თუ ამ თემაზე საუბრისას ჯერ არ იცი, რა პროდუქტებს ყიდულობს მომხმარებელი ყველაზე ხშირად, ჯერ ამაზე ჰკითხე და პასუხის მიღების შემდეგ დაიმახსოვრე (remember_fact) — ეს დაგეხმარება შემდეგში უფრო ზუსტი შეთავაზებები მისცე.
- ყველაზე მნიშვნელოვანი წესი: არასდროს დაასახელო კონკრეტული ფასი, მაღაზია, პროდუქტი, რესტორანი თუ ფასდაკლება, რომელიც თავად არ მოგცია რეალურმა ხელსაწყომ (მაგ. check_store_discounts) ან არ არის მოცემული მომხმარებლის ცნობილ მონაცემებში (ფინანსური სურათი, დამახსოვრებული ფაქტები). თუ ამის შესახებ ზუსტი, რეალური მონაცემი არ გაქვს, ეს პირდაპირ და პატიოსნად უთხარი მომხმარებელს — არასდროს გამოიგონო სარწმუნოდ მოჩვენებითი რიცხვი, მაღაზიის სახელი თუ ადგილი, თუნდაც ზოგადი ცოდნის საფუძველზე. ნდობა რიცხვებზეა დამყარებული — გამონაგონი რიცხვი ყოველთვის უარესია, ვიდრე პატიოსანი "არ ვიცი".
- გასცემ ზოგად ფინანსურ განათლებას: ბიუჯეტირება, დაზოგვა, სესხები, ინფლაცია, საკრედიტო ისტორია, ზოგადი საინვესტიციო პრინციპები.
- არასდროს არ მისცე კონკრეტული საინვესტიციო რჩევა (რომელი კონკრეტული აქცია, კრიპტოვალუტა თუ ფასიანი ქაღალდი იყიდოს) — ამის ნაცვლად აუხსენი ზოგადი პრინციპები და შესთავაზე პროფესიონალ ფინანსურ მრჩეველთან კონსულტაცია.
- არასდროს არ მისცე პერსონალური საგადასახადო თუ სამართლებრივი რჩევა — მიმართე შესაბამის სპეციალისტს.
- კატეგორიულად უარი განაცხადე ნებისმიერ დახმარებაზე, რომელიც უკავშირდება არალეგალურ საქმიანობას: ფულის გათეთრებას, თაღლითობას, გადასახადებისგან თავის არიდებას, სხვისი ანგარიშის შესახებ ინფორმაციის მოპოვებას ან სხვა კანონდარღვევას.
- თუ კითხვა საერთოდ არ უკავშირდება ფინანსებს, თავაზიანად აუხსენი, რომ შენ სპეციალიზირებული ხარ ფინანსურ საკითხებზე, პერსონალობის დაკარგვის გარეშე.
- არ მოითხოვო და არ შეინახო მომხმარებლის საბანკო რეკვიზიტები, პაროლები თუ სხვა მგრძნობიარე მონაცემები საუბრის დროს.

${MODE_PERSONA[mode]}`;

  const withMemory =
    memoryFacts && memoryFacts.length > 0
      ? `${base}\n\nდამახსოვრებული ფაქტები მომხმარებლის შესახებ (ეს ის არის, რაც მომხმარებელმა თავად გითხრა — გამოიყენე როგორც ცნობილი ფაქტი, არასდროს გამოიცნო ახალი):\n${memoryFacts.map((f) => `- ${f}`).join("\n")}`
      : base;

  if (!snapshot) return withMemory;

  const lines: string[] = [];
  if (typeof snapshot.totalBalance === "number") lines.push(`მთლიანი ბალანსი: ${snapshot.totalBalance.toFixed(2)} ₾`);
  if (typeof snapshot.netWorth === "number") lines.push(`წმინდა ღირებულება (Net Worth): ${snapshot.netWorth.toFixed(2)} ₾`);
  if (typeof snapshot.monthlyIncome === "number") lines.push(`ამ თვის შემოსავალი: ${snapshot.monthlyIncome.toFixed(2)} ₾`);
  if (typeof snapshot.monthlyExpenses === "number") lines.push(`ამ თვის ხარჯი: ${snapshot.monthlyExpenses.toFixed(2)} ₾`);
  if (typeof snapshot.liabilitiesTotal === "number") lines.push(`ვალდებულებები: ${snapshot.liabilitiesTotal.toFixed(2)} ₾`);
  if (snapshot.topCategories?.length) {
    lines.push(
      `ყველაზე დიდი ხარჯების კატეგორიები ამ თვეში: ${snapshot.topCategories
        .map((c) => `${c.category} (${c.amount.toFixed(2)} ₾)`)
        .join(", ")}`
    );
  }
  if (snapshot.funds?.length) {
    lines.push(
      `მიზნები: ${snapshot.funds.map((f) => `${f.name} — ${f.saved.toFixed(2)}/${f.target.toFixed(2)} ₾`).join(", ")}`
    );
  }

  if (lines.length === 0) return withMemory;

  return `${withMemory}\n\nმომხმარებლის რეალური ფინანსური სურათი (გამოიყენე კონკრეტულ პასუხებში):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    console.log(`${label} responded after ${Date.now() - startedAt}ms with status ${res.status}`);
    return res;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error(`${label} failed after ${Date.now() - startedAt}ms — ${isTimeout ? "timed out" : "network error"}:`, err);
    throw new Error(isTimeout ? `${label} timed out after ${FETCH_TIMEOUT_MS}ms` : `${label} network error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}

// Tool schemas are authored in a Gemini-style OpenAPI subset (uppercase types, e.g. "OBJECT"/"STRING")
// in _shared/tools.ts — convert to standard lowercase JSON Schema for OpenAI's function-calling format.
function toJsonSchema(schema: unknown): unknown {
  if (schema == null || typeof schema !== "object") return schema;
  const { type, properties, nullable: _nullable, ...rest } = schema as Record<string, unknown>;
  const converted: Record<string, unknown> = { ...rest };
  if (typeof type === "string") converted.type = type.toLowerCase();
  if (properties && typeof properties === "object") {
    converted.properties = Object.fromEntries(
      Object.entries(properties as Record<string, unknown>).map(([k, v]) => [k, toJsonSchema(v)])
    );
  }
  return converted;
}

const OPENAI_TOOLS = TOOLS.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: toJsonSchema(t.parameters) },
}));

async function callOpenAI(apiKey: string, messages: OpenAiMessage[]) {
  const requestBody = {
    model: MODEL,
    messages,
    tools: OPENAI_TOOLS,
    max_completion_tokens: 2048,
    // gpt-6-luna (and other reasoning-tier models) reject tool calls on /v1/chat/completions
    // unless reasoning is explicitly turned off — otherwise it 400s even with no effort set.
    reasoning_effort: "none",
  };

  return await fetchWithTimeout(
    OPENAI_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    },
    "OpenAI request"
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: memoryRows, error: memoryError } = await supabase.from("user_memory").select("fact").order("created_at", { ascending: true });
    if (memoryError) console.error("Failed to load user_memory:", memoryError.message);
    const memoryFacts = (memoryRows ?? []).map((r) => r.fact as string);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured on the server." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as {
      messages: ChatMessage[];
      mode?: Mode;
      snapshot?: FinancialSnapshot;
    };
    const { messages, snapshot } = body;
    const mode: Mode = body.mode === "hype" || body.mode === "roast" ? body.mode : "balanced";

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = buildSystemPrompt(mode, snapshot, memoryFacts);
    let convo: OpenAiMessage[] = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user", content: m.text })),
    ];

    let finalText: string | undefined;
    let lastAction: ChatAction | undefined;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      console.log(`Calling OpenAI model "${MODEL}" (mode=${mode}, iteration=${iteration}) for user ${user.id}...`);
      const startedAt = Date.now();

      let res: Response;
      try {
        res = await callOpenAI(apiKey, convo);
      } catch (apiError) {
        const isTimeout = apiError instanceof Error && apiError.message.includes("timed out");
        return new Response(
          JSON.stringify({
            error: isTimeout
              ? `Timed out waiting for OpenAI's API after ${FETCH_TIMEOUT_MS}ms.`
              : `Error calling OpenAI: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
          }),
          { status: isTimeout ? 504 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`OpenAI call failed after ${Date.now() - startedAt}ms (${res.status}):`, errText);
        return new Response(JSON.stringify({ error: `Error calling OpenAI (${res.status}): ${errText}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const choice = data?.choices?.[0];
      const message = choice?.message;
      console.log(`OpenAI responded after ${Date.now() - startedAt}ms, finishReason=${choice?.finish_reason}`);

      const toolCalls: OpenAiToolCall[] = message?.tool_calls ?? [];

      if (toolCalls.length > 0) {
        convo = [...convo, { role: "assistant", content: message.content ?? null, tool_calls: toolCalls }];
        for (const call of toolCalls) {
          const name = call.function?.name;
          let args: Record<string, unknown> = {};
          try {
            args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
          } catch {
            args = {};
          }
          const tool = getTool(name);
          const result = tool ? await tool.handler(supabase, user.id, args) : { summary: `Error: unknown tool "${name}"` };
          if (result.action) lastAction = result.action;
          convo.push({ role: "tool", tool_call_id: call.id, content: result.summary });
        }
        continue;
      }

      finalText = (typeof message?.content === "string" ? message.content : "").trim();
      break;
    }

    if (finalText === undefined) {
      return new Response(JSON.stringify({ error: "Assistant took too many tool actions in a row. Please rephrase your request." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ text: finalText || "ბოდიში, ამ კითხვაზე პასუხის გაცემა ვერ მოხერხდა.", action: lastAction ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unhandled error in chat function:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
