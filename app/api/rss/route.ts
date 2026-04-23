import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } });
    const xml = await res.text();

    const items: { title: string; link: string; pubDate: string; description?: string; image?: string }[] = [];
    const isAtom = xml.includes('<feed');
    const entryRe = isAtom ? /<entry[\s\S]*?<\/entry>/g : /<item[\s\S]*?<\/item>/g;

    for (const entry of (xml.match(entryRe) || []).slice(0, 20)) {
      const title = (entry.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() || '';
      const link = isAtom
        ? (entry.match(/<link[^>]+href=["']([^"']+)["']/) || [])[1] || ''
        : (entry.match(/<link>([^<]+)<\/link>/) || entry.match(/<link[^>]+href=["']([^"']+)["']/) || [])[1] || '';
      
      // Ensure absolute URL
      const absoluteLink = link.startsWith('http') ? link : link.startsWith('/') ? new URL(link, url).href : link;
      const pubDate = (entry.match(/<(?:pubDate|published|updated)>([^<]+)<\/(?:pubDate|published|updated)>/) || [])[1] || '';
      const description = (entry.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content)>/) || [])[1]?.trim() || '';
      const image = (entry.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/) || 
                    entry.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/) || 
                    entry.match(/<img[^>]+src=["']([^"']+)["']/) || 
                    (description.match(/<img[^>]+src=["']([^"']+)["']/) || []))[1] || '';
      if (title) items.push({ title, link: absoluteLink, pubDate, description, image });
    }

    const feedTitle = (xml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() || url;
    return NextResponse.json({ title: feedTitle, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
