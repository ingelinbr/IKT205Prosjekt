const API_KEY = Deno.env.get("API_FOOTBALL_KEY");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "next";

    let endpoint = "";

    if (type === "next") {
      endpoint =
        "https://v3.football.api-sports.io/fixtures?league=39&season=2025&status=NS";
    } else if (type === "previous") {
      endpoint =
        "https://v3.football.api-sports.io/fixtures?league=39&season=2025&status=FT&last=20";
    } else if (type === "live") {
      endpoint =
        "https://v3.football.api-sports.io/fixtures?live=all";
    } else {
      endpoint =
        "https://v3.football.api-sports.io/fixtures?league=39&season=2025";
    }

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY ?? "",
      },
    });

    const data = await res.json();

    const response = data.response ?? [];

    const filteredResponse =
      type === "live"
        ? response.filter((match: any) => match.league?.id === 39)
        : response;

    return new Response(JSON.stringify(filteredResponse), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
});