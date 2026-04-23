import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    const base = new URL(url);
    const resolveUrl = (href: string) => href.startsWith('http') ? href : `${base.origin}${href.startsWith('/') ? '' : '/'}${href}`;

    // Try multiple icon sources in order of preference
    const iconSources = [
      // Apple touch icons (usually high quality)
      html.match(/<link[^>]*rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1],
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*apple-touch-icon[^"']*["']/i)?.[1],
      // Standard favicons
      html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i)?.[1],
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i)?.[1],
      // PNG icons
      html.match(/<link[^>]*rel=["']icon["'][^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["']/i)?.[1],
      // SVG icons
      html.match(/<link[^>]*rel=["']icon["'][^>]*type=["']image\/svg\+xml["'][^>]*href=["']([^"']+)["']/i)?.[1],
    ].filter(Boolean);

    let icon = "";
    if (iconSources.length > 0 && iconSources[0]) {
      icon = resolveUrl(iconSources[0]);
    }

    // Fallback options
    if (!icon) {
      const fallbacks = [
        `${base.origin}/apple-touch-icon.png`,
        `${base.origin}/favicon.ico`,
        `https://www.google.com/s2/favicons?domain=${base.hostname}&sz=64`,
        `https://icon.horse/icon/${base.hostname}`,
      ];
      icon = fallbacks[2]; // Default to Google favicons
    }

    return NextResponse.json({ 
      title, 
      description, 
      icon,
      alternativeIcons: iconSources.slice(0, 3).filter(Boolean).map(src => resolveUrl(src!))
    });
  } catch (error) {
    const base = new URL(url);
    return NextResponse.json({ title: "", description: "", icon: `https://www.google.com/s2/favicons?domain=${base.origin}&sz=64` });
  }
}
