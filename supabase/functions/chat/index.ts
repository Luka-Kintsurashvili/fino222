// Fino chat proxy — calls Gemini server-side so the API key never reaches the client.
// Deploy: supabase functions deploy chat
// Configure: supabase secrets set GEMINI_API_KEY=your-key-here

const SYSTEM_PROMPT = `შენ ხარ ფინო — მეგობრული ფინანსური ასისტენტი ქართული მომხმარებლებისთვის, ჩაშენებული Fino-ს აპლიკაციაში.

წესები:
- უპასუხე მოკლედ, გასაგებად და მეგობრულად, ქართულ ენაზე (თუ მომხმარებელი სხვა ენაზე მიმართავს, უპასუხე იმავე ენაზე).
- გასცემ ზოგად ფინანსურ განათლებას: ბიუჯეტირება, დაზოგვა, სესხები, ინფლაცია, საკრედიტო ისტორია, ზოგადი საინვესტიციო პრინციპები.
- არასდროს არ მისცე კონკრეტული საინვესტიციო რჩევა (რომელი კონკრეტული აქცია, კრიპტოვალუტა თუ ფასიანი ქაღალდი იყიდოს) — ამის ნაცვლად აუხსენი ზოგადი პრინციპები და შესთავაზე პროფესიონალ ფინანსურ მრჩეველთან კონსულტაცია.
- არასდროს არ მისცე პერსონალური საგადასახადო თუ სამართლებრივი რჩევა — მიმართე შესაბამის სპეციალისტს.
- კატეგორიულად უარი განაცხადე ნებისმიერ დახმარებაზე, რომელიც უკავშირდება არალეგალურ საქმიანობას: ფულის გათეთრებას, თაღლითობას, გადასახადებისგან თავის არიდებას, სხვისი ანგარიშის შესახებ ინფორმაციის მოპოვებას ან სხვა კანონდარღვევას.
- თუ კითხვა საერთოდ არ უკავშირდება ფინანსებს, თავაზიანად აუხსენი, რომ შენ სპეციალიზირებული ხარ ფინანსურ საკითხებზე.
- არ მოითხოვო და არ შეინახო მომხმარებლის საბანკო რეკვიზიტები, პაროლები თუ სხვა მგრძნობიარე მონაცემები საუბრის დროს.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    console.log(`Calling Gemini model "${model}"...`);
    const startedAt = Date.now();

    let geminiRes: Response;
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { maxOutputTokens: 500, temperature: 0.6 },
          }),
          signal: controller.signal,
        }
      );
      console.log(`Gemini responded after ${Date.now() - startedAt}ms with status ${geminiRes.status}`);
    } catch (fetchError) {
      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      console.error(
        `Gemini fetch failed after ${Date.now() - startedAt}ms — ${isTimeout ? "timed out" : "network error"}:`,
        fetchError
      );
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? "Timed out waiting for Gemini's API after 20s."
            : `Network error calling Gemini: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini API error (${geminiRes.status}):`, errText);
      return new Response(JSON.stringify({ error: `Gemini API error (${geminiRes.status}): ${errText}` }), {
        status: geminiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiRes.json();
    const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(JSON.stringify({ text: text ?? "ბოდიში, ამ კითხვაზე პასუხის გაცემა ვერ მოხერხდა." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in chat function:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
