export type VideoEmbed = {
  platform: "TikTok" | "YouTube" | "Instagram";
  embedUrl: string;
  thumb: string | null; // auto thumbnail (YouTube only); null for TikTok/IG
  aspect: "vertical" | "wide";
};

// Turn a post URL into an embeddable player URL. Returns null if we can't embed it.
export function parseVideo(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  const u = url.trim();
  let m: RegExpMatchArray | null;

  if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{6,})/))) {
    return {
      platform: "YouTube",
      embedUrl: `https://www.youtube.com/embed/${m[1]}`,
      thumb: `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`,
      aspect: "wide",
    };
  }
  if ((m = u.match(/tiktok\.com\/.*?\/video\/(\d+)/)) || (m = u.match(/tiktok\.com\/.*?(\d{12,})/))) {
    return { platform: "TikTok", embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`, thumb: null, aspect: "vertical" };
  }
  if ((m = u.match(/instagram\.com\/(reels?|p|tv)\/([\w-]+)/))) {
    const t = m[1].startsWith("reel") ? "reel" : m[1];
    return { platform: "Instagram", embedUrl: `https://www.instagram.com/${t}/${m[2]}/embed`, thumb: null, aspect: "vertical" };
  }
  return null;
}
