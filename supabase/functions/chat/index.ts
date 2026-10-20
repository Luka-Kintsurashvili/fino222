// Fino AI assistant — calls Gemini server-side so the API key never reaches the client.
// Uses Gemini's function calling to let the assistant actually take actions (see _shared/tools.ts).
// Deploy: supabase functions deploy chat
// Configure: supabase secrets set GEMINI_API_KEY=your-key-here

import { createClient } from "npm:@supabase/supabase-js@2";
import { TOOLS, getTool, type ChatAction } from "../_shared/tools.ts";

const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
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

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

const MODE_PERSONA: Record<Mode, string> = {
  hype: `რეჟიმი: HYPE 🔥 — შენ ხარ მხურვალე გულშემატკივარი. ყოველ პასუხს ავსებ ენერგიით, ხაზს უსვამ მომხმარებლის კარგ ფინანსურ გადაწყვეტილებებს, ულოცავ მცირე წარმატებებსაც კი და ამხნევებ. ემოჯების ზომიერი გამოყენება დასაშვებია. მაგრამ პატიოსნება არასდროს იწირება — თუ რიცხვები ცუდია, თბილად, მაგრამ გულწრფელად აღნიშნავ.`,
  balanced: `რეჟიმი: BALANCED — მშვიდი, პროფესიონალური და კეთილგანწყობილი ტონი. მოკლე, კონკრეტული და პრაქტიკული პასუხები, ზედმეტი ემოციების გარეშე.`,
  roast: `რეჟიმი: ROAST 😏 — შენ ხარ ცქრიალა, ცოტა ირონიული მეგობარი, რომელიც მსუბუქად "აგდებს" მომხმარებელს ცუდ ფინანსურ ჩვევებზე (ზედმეტი ხარჯები, დაზოგვის ნაკლებობა), მაგრამ ყოველთვის მეგობრულად და შემდეგ კონკრეტულ რჩევას სთავაზობს. არასდროს ნამდვილად ულმობელი ან შეურაცხმყოფელი — ეს არის მსუბუქი, თბილი დაცინვა, არა შეურაცხყოფა. თუ მომხმარებელი კარგად აკეთებს საქმეს, აღიარე ეს პატიოსნად, დაცინვის გარეშე.`,
};

function buildSystemPrompt(mode: Mode, snapshot?: FinancialSnapshot): string {
  const today = new Date().toISOString().slice(0, 10);
  const base = `შენ ხარ ფინო — პერსონალობის მქონე ფინანსური თანაშემწე ქართველი მომხმარებლებისთვის, ჩაშენებული Fino-ს აპლიკაციაში. შენი ტონი ცვალებადია მომხმარებლის არჩეული რეჟიმის მიხედვით (იხ. ქვემოთ), მაგრამ საფუძველი ყოველთვის: სანდო, გამჭვირვალე, არაფრის მომჩმახავი.

დღევანდელი თარიღი: ${today} — გამოიყენე ეს, როცა მომხმარებელი მიმართავს ფარდობით თარიღებზე (მაგ. "ხუთშაბათს", "შემდეგ კვირას").

წესები:
- უპასუხე მოკლედ (2-5 წინადადება, თუ არ მოითხოვება მეტი), გასაგებად, ქართულ ენაზე — თუ მომხმარებელი სხვა ენაზე მიმართავს, უპასუხე იმავე ენაზე.
- როცა მოცემულია მომხმარებლის ფინანსური სურათი (balance, ხარჯები, funds და ა.შ.), დაეყრდენი კონკრეტულ რიცხვებს პასუხში — ეს გაჩენს განცდას, რომ ნამდვილად იცნობ მის ფინანსებს.
- როცა მომხმარებელი გთხოვს შეხსენების დამატებას კონკრეტულ თარიღზე (გადასახადი, ვადა და ა.შ.), გამოიყენე add_calendar_reminder ხელსაწყო — ნუ შემოიფარგლები მხოლოდ ტექსტური პასუხით.
- add_calendar_reminder მხოლოდ მაშინ გამოიყენე, როცა მომხმარებელი აშკარად და კონკრეტულად ითხოვს ახალი შეხსენების შექმნას მომავალი თარიღისთვის. ზოგადი კითხვების დროს (მაგ. "როგორ დავზოგო მეტი?", "როგორ ვმართო ხარჯები?") არასდროს გამოიძახო ეს ხელსაწყო — უბრალოდ უპასუხე ტექსტით.
- როცა მომხმარებელი გამოხატავს სურვილს დაზოგოს კონკრეტული მიზნისთვის (მაგ. "მინდა დავზოგო შვებულებისთვის", "მინდა ავიწყო საგანგებო ფონდი"), გამოიყენე create_fund ხელსაწყო ახალი ფონდის შესაქმნელად — ნუ შემოიფარგლები მხოლოდ რჩევით.
- სანამ ამა თუ იმ ხელსაწყოს გამოიძახებ, გადაამოწმე ხომ არ აკლია მნიშვნელოვანი დეტალი, რომელსაც მომხმარებელი არ დაუზუსტებია (მაგ. ფონდის შექმნისას — რამდენს გეგმავს ყოველთვიურად შეტანას; სესხის დროს — რა ვადით და რა ტიპის სესხზეა საუბარი). თუ ასეთი დეტალი აკლია, ჯერ დაუსვი მოკლე დამაზუსტებელი კითხვა და მხოლოდ პასუხის მიღების შემდეგ გამოიძახე ხელსაწყო — ნუ გამოიყენებ ნაგულისხმევ/გამოცნობილ მნიშვნელობებს მნიშვნელოვანი პარამეტრებისთვის. მხოლოდ ნამდვილად უმნიშვნელო დეტალებზე (მაგ. ზუსტი ფერი) შეგიძლია თავად გადაწყვიტო.
- როცა მომხმარებელი გეუბნება განმეორებადი ყოველთვიური გადახდის შესახებ (მაგ. "ქირას ვიხდი ყოველთვის 5-ში", "ინტერნეტის გადასახადი მაქვს თვეში"), გამოიყენე set_recurring_bill ხელსაწყო — ეს განსხვავდება add_calendar_reminder-სგან, რომელიც მხოლოდ ერთჯერადი თარიღისთვისაა.
- როცა მომხმარებელი კითხულობს სესხის აღებაზე ან ბანკების შეთავაზებების შედარებაზე და ახსენებს კონკრეტულ თანხას (მაგ. "მინდა ავიღო 27000 ლარის სესხი", "რომელი ბანკი მაძლევს საუკეთესო პირობებს 10000-ზე?"), მაშინვე გამოიძახე compare_loan_offers ხელსაწყო — ნუ გასცემ მხოლოდ ტექსტურ პასუხს ზოგადი რჩევით. ვადა (თვეები) და სესხის ტიპი არ არის საკმარისად მნიშვნელოვანი დასაზუსტებლად — თუ მომხმარებელს არ დაუზუსტებია, უბრალოდ გამოიყენე ნაგულისხმევი მნიშვნელობები (ეს რეალურ განაცხადს არ წარმოადგენს, მხოლოდ საინფორმაციო შედარებაა, ასე რომ მომხმარებელს ნებისმიერ დროს შეუძლია თავად შეცვალოს პარამეტრები ეკრანზე).
- როცა მომხმარებელი ახსენებს რაიმეს, რაც ფლობს და ღირებულებას წარმოადგენს და ჯერ არ არის დამატებული (ბინა, მანქანა, ინვესტიცია, ნაღდი ფული, ძვირფასეულობა), გამოიყენე add_asset ხელსაწყო წმინდა ქონებაში დასამატებლად. თუ ახსენებს ვალს ან სესხს, რომელიც ჯერ არ არის დამატებული (საბანკო სესხი, საკრედიტო ბარათის დავალიანება, ვალი პირისგან), გამოიყენე add_liability. ორივესთვის სახელი და თანხა/ღირებულება აუცილებელია — თუ თანხა არ დაუსახელებია, ჯერ ეს დაუზუსტე; ტიპის ზუსტ კატეგორიაზე კი შეგიძლია თავად მიხვდე კონტექსტიდან.
- როცა მომხმარებელი ითხოვს, რომ დაეხმარო შემოსავლის განაწილებაში/ბიუჯეტირებაში (მაგ. "როგორ გავანაწილო ჩემი 3000-ლარიანი ხელფასი", "მომიწერე ბიუჯეტი"), გამოიძახე suggest_budget_split ხელსაწყო. თუ თვიური შემოსავალი არ დაუსახელებია, ჯერ ეს დაუზუსტე. კონკრეტული წესის (rule) დასაზუსტებლად კითხვა არ არის საჭირო — თუ არ აკონკრეტებს, გამოიყენე 'classic' ნაგულისხმევად.
- როცა მომხმარებელი ეკითხება, დაუმტკიცებენ თუ არა სესხს, რა შანსი აქვს, ან რა უნდა შეცვალოს დასამტკიცებლად, გამოიძახე check_loan_approval ხელსაწყო. თუ თვიური შემოსავალი, სესხის თანხა ან ვადა არ დაუსახელებია, ჯერ ეს დაუზუსტე — დანარჩენი დეტალები (ასაკი, რეგიონი, დასაქმების ტიპი და ა.შ.) არ საჭიროებს დაზუსტებას, გამოიყენე ნაგულისხმევები. ეს ხელსაწყო აბრუნებს მხოლოდ შეფასებას ფიქტიურ მონაცემებზე გაწვრთნილი მოდელისგან — ყოველთვის ნათლად აღნიშნე, რომ ეს არ არის რეალური ბანკის გადაწყვეტილება, და არასდროს გაუცხადო, რომ ზუსტად იცი რას გადაწყვეტს ბანკი.
- როცა მომხმარებელი სთხოვს, რომ შეამოწმო მისი ტრანზაქციები განმეორებადი გადახდების საძებნად (მაგ. "ხომ არ მაქვს რამე განმეორებადი გადასახადი?", "შეამოწმე ჩემი ხარჯები"), გამოიძახე detect_recurring_payments ხელსაწყო. ეს ხელსაწყო მხოლოდ გეგმავს (draft) შემოთავაზებას — არაფერია შენახული, სანამ მომხმარებელი თავად არ გადახედავს დეტალებს და არ დაადასტურებს ღილაკზე დაჭერით. ამიტომ ნათლად უთხარი, რომ ეს არის მხოლოდ შემოთავაზება, რომელიც თავად უნდა დაადასტუროს, და არასდროს თქვა, რომ ის უკვე დაემატა კალენდარში.
- გასცემ ზოგად ფინანსურ განათლებას: ბიუჯეტირება, დაზოგვა, სესხები, ინფლაცია, საკრედიტო ისტორია, ზოგადი საინვესტიციო პრინციპები.
- არასდროს არ მისცე კონკრეტული საინვესტიციო რჩევა (რომელი კონკრეტული აქცია, კრიპტოვალუტა თუ ფასიანი ქაღალდი იყიდოს) — ამის ნაცვლად აუხსენი ზოგადი პრინციპები და შესთავაზე პროფესიონალ ფინანსურ მრჩეველთან კონსულტაცია.
- არასდროს არ მისცე პერსონალური საგადასახადო თუ სამართლებრივი რჩევა — მიმართე შესაბამის სპეციალისტს.
- კატეგორიულად უარი განაცხადე ნებისმიერ დახმარებაზე, რომელიც უკავშირდება არალეგალურ საქმიანობას: ფულის გათეთრებას, თაღლითობას, გადასახადებისგან თავის არიდებას, სხვისი ანგარიშის შესახებ ინფორმაციის მოპოვებას ან სხვა კანონდარღვევას.
- თუ კითხვა საერთოდ არ უკავშირდება ფინანსებს, თავაზიანად აუხსენი, რომ შენ სპეციალიზირებული ხარ ფინანსურ საკითხებზე, პერსონალობის დაკარგვის გარეშე.
- არ მოითხოვო და არ შეინახო მომხმარებლის საბანკო რეკვიზიტები, პაროლები თუ სხვა მგრძნობიარე მონაცემები საუბრის დროს.

${MODE_PERSONA[mode]}`;

  if (!snapshot) return base;

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
      `ფონდები: ${snapshot.funds.map((f) => `${f.name} — ${f.saved.toFixed(2)}/${f.target.toFixed(2)} ₾`).join(", ")}`
    );
  }

  if (lines.length === 0) return base;

  return `${base}\n\nმომხმარებლის რეალური ფინანსური სურათი (გამოიყენე კონკრეტულ პასუხებში):\n${lines.map((l) => `- ${l}`).join("\n")}`;
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

async function callGemini(apiKey: string, system: string, contents: GeminiContent[]) {
  const requestBody = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    tools: [{ functionDeclarations: TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })) }],
    generationConfig: {
      maxOutputTokens: 2048,
      // Gemini 3.x reasoning tokens count against maxOutputTokens (Flash-tier models can't fully disable
      // thinking), so keep it low to leave room for the actual visible reply instead of burning the budget.
      thinkingConfig: { thinkingLevel: "low" },
    },
  };

  return await fetchWithTimeout(
    GEMINI_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(requestBody),
    },
    "Gemini request"
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

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }), {
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

    const system = buildSystemPrompt(mode, snapshot);
    let contents: GeminiContent[] = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    let finalText: string | undefined;
    let accumulatedText = "";
    let lastAction: ChatAction | undefined;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      console.log(`Calling Gemini model "${MODEL}" (mode=${mode}, iteration=${iteration}) for user ${user.id}...`);
      const startedAt = Date.now();

      let res: Response;
      try {
        res = await callGemini(apiKey, system, contents);
      } catch (apiError) {
        const isTimeout = apiError instanceof Error && apiError.message.includes("timed out");
        return new Response(
          JSON.stringify({
            error: isTimeout
              ? `Timed out waiting for Gemini's API after ${FETCH_TIMEOUT_MS}ms.`
              : `Error calling Gemini: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
          }),
          { status: isTimeout ? 504 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Gemini call failed after ${Date.now() - startedAt}ms (${res.status}):`, errText);
        return new Response(JSON.stringify({ error: `Error calling Gemini (${res.status}): ${errText}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const parts: GeminiPart[] = candidate?.content?.parts ?? [];
      console.log(`Gemini responded after ${Date.now() - startedAt}ms, finishReason=${candidate?.finishReason}`);

      // Gemini can return a partial text answer alongside a functionCall in the same turn —
      // accumulate it now so it isn't lost once we loop back in for the tool result.
      const textInThisTurn = parts
        .map((p) => p.text ?? "")
        .join("");
      if (textInThisTurn) accumulatedText += (accumulatedText ? " " : "") + textInThisTurn;

      const functionCallParts = parts.filter((p) => p.functionCall);

      if (functionCallParts.length > 0) {
        const functionResponseParts: GeminiPart[] = [];
        for (const part of functionCallParts) {
          const name = part.functionCall!.name;
          const args = part.functionCall!.args ?? {};
          const tool = getTool(name);
          const result = tool ? await tool.handler(supabase, user.id, args) : { summary: `Error: unknown tool "${name}"` };
          if (result.action) lastAction = result.action;
          functionResponseParts.push({ functionResponse: { name, response: { result: result.summary } } });
        }
        contents = [...contents, { role: "model", parts }, { role: "user", parts: functionResponseParts }];
        continue;
      }

      finalText = accumulatedText.trim();
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
