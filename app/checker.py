import httpx, tldextract, re, json, asyncio
from bs4 import BeautifulSoup
from readability import Document
from urllib.parse import urlparse, urlunparse
from openai import OpenAI
from .config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def normalize_url(u: str) -> str:
    p = urlparse(u)
    # strip tracking and fragments
    clean_qs = "&".join([kv for kv in p.query.split("&") if kv and not kv.lower().startswith(("utm_", "fbclid="))])
    return urlunparse((p.scheme or "https", p.netloc, p.path, p.params, clean_qs, ""))

async def fetch_html(url: str, timeout=10):
    headers = {"User-Agent": "GentleReader/1.0 (+https://example.com)"}
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout, headers=headers) as hc:
        r = await hc.get(url)
        r.raise_for_status()
        return r.text, str(r.url), dict(r.headers)

def extract_text(html: str):
    # Try readability
    try:
        doc = Document(html)
        title = (doc.short_title() or "").strip()
        content_html = doc.summary(html_partial=True)
        soup = BeautifulSoup(content_html, "html.parser")
        paras = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        body = "\n\n".join(paras[:6])  # keep it short for inference
        if body.strip():
            return title, body
    except Exception:
        pass
    # Fallback: basic parse
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.get_text(strip=True) if soup.title else "")[:140]
    paras = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    body = "\n\n".join(paras[:6])
    return title, body

LOW_REP_DOMAINS = {
    # seed a few; expand from CSV later
    "clickbait.example": "low_domain_rep",
    "giveaway.example": "low_domain_rep",
}

def ux_noise_score(html: str) -> int:
    # crude signals; higher => noisier
    score = 0
    score += html.count("<iframe")
    score += html.count("subscribe") > 5
    score += html.count("popup") > 2
    return int(score)

async def classify_and_summarize(domain: str, title: str, body: str):
    # Single call that returns JSON for labels + short bullets
    prompt = f"""
You are a safety and misinformation assistant. Read the page metadata below and return strict JSON.

Return fields:
- headline_style: "clickbait" | "neutral"
- tone: "sensational" | "neutral"
- scam_signal: "strong" | "weak" | "none"
- health_claim: "present" | "not_present"
- summary_bullets: array of 3-5 short bullets (<=20 words each), plain text

CONTENT:
DOMAIN: {domain}
TITLE: {title}
BODY (truncated): {body[:4000]}
"""
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Return only valid JSON. Be conservative about scams and sensational claims."},
            {"role": "user", "content": prompt},
        ],
    )
    data = json.loads(resp.choices[0].message.content)
    return data

def combine_verdict(domain: str, labels: dict, noise: int):
    reasons = []
    # domain reputation
    if domain in LOW_REP_DOMAINS:
        reasons.append("low_domain_rep")
    # label-based
    if labels.get("headline_style") == "clickbait":
        reasons.append("clickbait")
    if labels.get("tone") == "sensational":
        reasons.append("sensational_tone")
    if labels.get("scam_signal") == "strong":
        reasons.append("scam_signals")
    if labels.get("health_claim") == "present":
        reasons.append("health_claims")
    if noise >= 3:
        reasons.append("intrusive_ui")

    # weight to band
    weight = 0
    for r in reasons:
        weight += {
            "scam_signals": 3,
            "low_domain_rep": 2,
            "health_claims": 2,
            "clickbait": 1,
            "sensational_tone": 1,
            "intrusive_ui": 1,
        }.get(r, 0)

    if "scam_signals" in reasons or weight >= 4:
        verdict = "danger"
    elif weight >= 2:
        verdict = "warning"
    else:
        verdict = "ok"
    return verdict, reasons

async def run_check(url: str):
    norm = normalize_url(url)
    html, final_url, headers = await fetch_html(norm)
    title, body = extract_text(html)
    ext = tldextract.extract(final_url)
    domain = ".".join(part for part in [ext.domain, ext.suffix] if part)
    labels = await classify_and_summarize(domain, title, body)
    noise = ux_noise_score(html)
    verdict, reasons = combine_verdict(domain, labels, noise)
    summary = "• " + "\n• ".join(labels.get("summary_bullets", [])[:5])

    meta = {
        "domain": domain,
        "final_url": final_url,
        "title": title,
        "headers_subset": {k: headers.get(k) for k in ["content-type", "server"]},
        "labels": labels,
        "noise": noise,
    }
    return verdict, reasons, summary, meta
