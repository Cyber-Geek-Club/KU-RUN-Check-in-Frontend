import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Strava Activity Parser API
 * Scrapes activity data from Strava public pages
 * 
 * POST /api/strava/parse
 * Body: { url: "https://strava.app.link/xxx" or "https://www.strava.com/activities/123" }
 */
export const POST = async ({ request, fetch }: RequestEvent) => {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return json({ success: false, error: 'URL is required' }, { status: 400 });
        }

        // Validate Strava URL
        const isStravaUrl = /strava\.app\.link|strava\.com/i.test(url);
        if (!isStravaUrl) {
            return json({ success: false, error: 'Invalid Strava URL' }, { status: 400 });
        }

        console.log('🔍 Parsing Strava URL:', url);

        // Resolve short link if needed
        let finalUrl = url;
        if (url.includes('strava.app.link')) {
            try {
                const resolveRes = await fetch(url, {
                    method: 'HEAD',
                    redirect: 'follow'
                });
                finalUrl = resolveRes.url || url;
                console.log('📎 Resolved to:', finalUrl);
            } catch (e) {
                console.log('⚠️ Could not resolve short link, using original');
            }
        }

        // Fetch the Strava activity page
        const response = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!response.ok) {
            console.log('❌ Failed to fetch Strava page:', response.status);
            return json({ 
                success: false, 
                error: `Failed to fetch activity (${response.status})` 
            }, { status: 400 });
        }

        const html = await response.text();
        
        // Parse the HTML to extract activity data
        const result = parseStravaHtml(html);
        
        if (result.distance_km !== null) {
            console.log('✅ Parsed successfully:', result);
            return json({
                success: true,
                ...result
            });
        } else {
            console.log('⚠️ Could not parse distance from page');
            return json({
                success: false,
                error: 'Could not extract distance from activity page',
                hint: 'Activity might be private or page structure changed'
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('❌ Strava parse error:', error);
        return json({
            success: false,
            error: error.message || 'Failed to parse Strava activity'
        }, { status: 500 });
    }
};

/**
 * Parse Strava HTML to extract activity data
 * Target elements:
 * - Distance: <div class="Stat_statValue__lmw2H">1.1 km</div>
 * - Also checks for other common patterns
 */
function parseStravaHtml(html: string): {
    distance_km: number | null;
    moving_time: string | null;
    activity_name: string | null;
    elevation_gain: string | null;
} {
    let distance_km: number | null = null;
    let moving_time: string | null = null;
    let activity_name: string | null = null;
    let elevation_gain: string | null = null;

    try {
        // Pattern 1: New Strava UI - Stat_statValue class
        // <div class="Stat_statValue__lmw2H">1.1 km</div>
        const statValuePattern = /class="Stat_statValue[^"]*"[^>]*>([^<]+)</gi;
        const statMatches = [...html.matchAll(statValuePattern)];
        
        for (const match of statMatches) {
            const value = match[1].trim();
            
            // Check for distance (km or mi)
            const distanceMatch = value.match(/^([\d.,]+)\s*(km|mi|กม\.|ก\.ม\.)$/i);
            if (distanceMatch && distance_km === null) {
                let dist = parseFloat(distanceMatch[1].replace(',', '.'));
                // Convert miles to km if needed
                if (distanceMatch[2].toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                distance_km = dist;
                continue;
            }
            
            // Check for time (h:mm:ss or mm:ss format)
            const timeMatch = value.match(/^(\d{1,2}:\d{2}(:\d{2})?)$/);
            if (timeMatch && moving_time === null) {
                moving_time = value;
                continue;
            }
            
            // Check for elevation (m or ft)
            const elevMatch = value.match(/^([\d.,]+)\s*(m|ft)$/i);
            if (elevMatch && elevation_gain === null) {
                elevation_gain = value;
            }
        }

        // Pattern 2: Activity title from <title> tag or h1
        const titleMatch = html.match(/<title>([^<|]+)/i);
        if (titleMatch) {
            activity_name = titleMatch[1].trim();
            // Clean up Strava suffix
            activity_name = activity_name.replace(/\s*\|\s*Strava.*$/i, '').trim();
        }

        // Pattern 3: Fallback - Look for distance in data attributes or JSON-LD
        if (distance_km === null) {
            // Try JSON-LD schema
            const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
            if (jsonLdMatch) {
                try {
                    const jsonData = JSON.parse(jsonLdMatch[1]);
                    if (jsonData.distance) {
                        const dist = parseFloat(jsonData.distance);
                        if (!isNaN(dist)) {
                            distance_km = dist / 1000; // Usually in meters
                        }
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        }

        // Pattern 4: Fallback - Inline stats pattern
        if (distance_km === null) {
            // Look for patterns like "Distance 1.1 km" or "1.1 km"
            const inlineDistMatch = html.match(/(?:distance|ระยะทาง)[:\s]*?([\d.,]+)\s*(km|mi|กม)/i);
            if (inlineDistMatch) {
                let dist = parseFloat(inlineDistMatch[1].replace(',', '.'));
                if (inlineDistMatch[2].toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                distance_km = dist;
            }
        }

        // Pattern 5: Meta tags
        if (distance_km === null) {
            const metaMatch = html.match(/content="[^"]*?([\d.,]+)\s*(km|kilometers|mi|miles)[^"]*"/i);
            if (metaMatch) {
                let dist = parseFloat(metaMatch[1].replace(',', '.'));
                if (metaMatch[2].toLowerCase().includes('mi')) {
                    dist = dist * 1.60934;
                }
                distance_km = dist;
            }
        }

    } catch (error) {
        console.error('Parse error:', error);
    }

    return {
        distance_km,
        moving_time,
        activity_name,
        elevation_gain
    };
}
