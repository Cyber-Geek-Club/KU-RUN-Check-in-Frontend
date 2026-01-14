import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Strava Activity Parser API
 * Scrapes activity data from Strava public pages
 * 
 * POST /api/strava/parse
 * Body: { url: "https://strava.app.link/xxx" or "https://www.strava.com/activities/123" }
 * 
 * Example short link: https://strava.app.link/i1I3oE8wmZb
 * Resolves to: https://www.strava.com/activities/16830167117?share_sig=...
 */
export const POST = async ({ request }: RequestEvent) => {
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

        // Resolve short link if needed (strava.app.link -> strava.com)
        let finalUrl = url;
        if (url.includes('strava.app.link')) {
            console.log('📎 Resolving short link...');
            try {
                // Use GET with redirect:manual to capture the redirect location
                const resolveRes = await fetch(url, {
                    method: 'GET',
                    redirect: 'manual',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    }
                });
                
                // Check for redirect in Location header
                const location = resolveRes.headers.get('location');
                if (location) {
                    finalUrl = location;
                    console.log('📎 Redirected to:', finalUrl);
                } else if (resolveRes.status === 200) {
                    // If no redirect, the page might contain a meta refresh or JS redirect
                    const html = await resolveRes.text();
                    
                    // Look for meta refresh
                    const metaRefresh = html.match(/content=["']\d+;\s*url=([^"']+)["']/i);
                    if (metaRefresh) {
                        finalUrl = metaRefresh[1];
                        console.log('📎 Found meta refresh to:', finalUrl);
                    }
                    
                    // Look for canonical URL
                    const canonical = html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                                     html.match(/href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
                    if (canonical) {
                        finalUrl = canonical[1];
                        console.log('📎 Found canonical URL:', finalUrl);
                    }
                    
                    // Look for strava.com/activities URL in the page
                    const activityUrl = html.match(/https:\/\/www\.strava\.com\/activities\/\d+[^"'\s]*/i);
                    if (activityUrl) {
                        finalUrl = activityUrl[0];
                        console.log('📎 Found activity URL in page:', finalUrl);
                    }
                }
            } catch (e) {
                console.log('⚠️ Could not resolve short link:', e);
            }
        }

        console.log('🌐 Fetching activity page:', finalUrl);

        // Fetch the Strava activity page
        const response = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.strava.com/',
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            console.log('❌ Failed to fetch Strava page:', response.status);
            return json({ 
                success: false, 
                error: `Failed to fetch activity (${response.status})` 
            }, { status: 400 });
        }

        const html = await response.text();
        console.log('📄 Got HTML, length:', html.length);
        
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
            // Return partial data if we got activity name
            if (result.activity_name) {
                return json({
                    success: false,
                    activity_name: result.activity_name,
                    error: 'Could not extract distance - activity might be private',
                    hint: 'Please enter distance manually'
                }, { status: 400 });
            }
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
        console.log('🔎 Parsing HTML...');
        
        // Pattern 1: New Strava UI - Stat_statValue class (exact match from user)
        // <div class="Stat_statValue__lmw2H">1.1 km</div>
        const statValuePattern = /class="Stat_statValue[^"]*"[^>]*>\s*([^<]+)\s*</gi;
        const statMatches = [...html.matchAll(statValuePattern)];
        
        console.log('📊 Found stat values:', statMatches.length);
        
        for (const match of statMatches) {
            const value = match[1].trim();
            console.log('  - Stat value:', value);
            
            // Check for distance (km or mi) - more flexible matching
            const distanceMatch = value.match(/^([\d.,]+)\s*(km|mi|กม\.?|ก\.?ม\.?|kilometer|กิโลเมตร)?$/i);
            if (distanceMatch && distance_km === null) {
                let dist = parseFloat(distanceMatch[1].replace(',', '.'));
                // Convert miles to km if needed
                if (distanceMatch[2] && distanceMatch[2].toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                if (!isNaN(dist) && dist > 0) {
                    distance_km = dist;
                    console.log('  ✓ Distance found:', dist, 'km');
                    continue;
                }
            }
            
            // Check for time (h:mm:ss or mm:ss format)
            const timeMatch = value.match(/^(\d{1,2}:\d{2}(:\d{2})?)$/);
            if (timeMatch && moving_time === null) {
                moving_time = value;
                console.log('  ✓ Time found:', value);
                continue;
            }
            
            // Check for elevation (m or ft)
            const elevMatch = value.match(/^([\d.,]+)\s*(m|ft|เมตร)$/i);
            if (elevMatch && elevation_gain === null) {
                elevation_gain = value;
                console.log('  ✓ Elevation found:', value);
            }
        }

        // Pattern 2: Alternative - look for stats in different container
        if (distance_km === null) {
            // Try matching stat containers with labels
            const statWithLabelPattern = /(?:distance|ระยะทาง)[^<]*<[^>]*class="[^"]*Stat[^"]*"[^>]*>\s*([\d.,]+)\s*(km|mi)?/gi;
            const labelMatches = [...html.matchAll(statWithLabelPattern)];
            for (const match of labelMatches) {
                let dist = parseFloat(match[1].replace(',', '.'));
                if (match[2]?.toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                if (!isNaN(dist) && dist > 0) {
                    distance_km = dist;
                    console.log('  ✓ Distance from label pattern:', dist, 'km');
                    break;
                }
            }
        }

        // Pattern 3: Activity title from <title> tag or og:title
        const ogTitleMatch = html.match(/property="og:title"\s*content="([^"]+)"/i) ||
                            html.match(/content="([^"]+)"\s*property="og:title"/i);
        if (ogTitleMatch) {
            activity_name = ogTitleMatch[1].trim();
        } else {
            const titleMatch = html.match(/<title>([^<|]+)/i);
            if (titleMatch) {
                activity_name = titleMatch[1].trim();
            }
        }
        if (activity_name) {
            // Clean up Strava suffix
            activity_name = activity_name.replace(/\s*\|\s*Strava.*$/i, '').trim();
            activity_name = activity_name.replace(/\s*on Strava.*$/i, '').trim();
            console.log('  ✓ Activity name:', activity_name);
        }

        // Pattern 4: Fallback - Look for __NEXT_DATA__ JSON
        if (distance_km === null) {
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
            if (nextDataMatch) {
                try {
                    const nextData = JSON.parse(nextDataMatch[1]);
                    // Navigate to find distance in the data
                    const activity = nextData?.props?.pageProps?.activity || 
                                    nextData?.props?.pageProps?.initialActivity;
                    if (activity?.distance) {
                        distance_km = activity.distance / 1000; // meters to km
                        console.log('  ✓ Distance from __NEXT_DATA__:', distance_km, 'km');
                    }
                    if (activity?.moving_time && !moving_time) {
                        const seconds = activity.moving_time;
                        const h = Math.floor(seconds / 3600);
                        const m = Math.floor((seconds % 3600) / 60);
                        const s = seconds % 60;
                        moving_time = h > 0 
                            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                            : `${m}:${s.toString().padStart(2, '0')}`;
                        console.log('  ✓ Time from __NEXT_DATA__:', moving_time);
                    }
                } catch (e) {
                    console.log('  ⚠️ Could not parse __NEXT_DATA__');
                }
            }
        }

        // Pattern 5: Fallback - JSON-LD schema
        if (distance_km === null) {
            const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
            if (jsonLdMatch) {
                try {
                    const jsonData = JSON.parse(jsonLdMatch[1]);
                    if (jsonData.distance) {
                        const dist = parseFloat(jsonData.distance);
                        if (!isNaN(dist)) {
                            distance_km = dist / 1000; // Usually in meters
                            console.log('  ✓ Distance from JSON-LD:', distance_km, 'km');
                        }
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        }

        // Pattern 6: Fallback - Inline stats pattern
        if (distance_km === null) {
            const inlineDistMatch = html.match(/(?:distance|ระยะทาง)[:\s]*?([\d.,]+)\s*(km|mi|กม)/i);
            if (inlineDistMatch) {
                let dist = parseFloat(inlineDistMatch[1].replace(',', '.'));
                if (inlineDistMatch[2].toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                distance_km = dist;
                console.log('  ✓ Distance from inline pattern:', dist, 'km');
            }
        }

        // Pattern 7: Meta tags
        if (distance_km === null) {
            const metaMatch = html.match(/content="[^"]*?([\d.,]+)\s*(km|kilometers|mi|miles)[^"]*"/i);
            if (metaMatch) {
                let dist = parseFloat(metaMatch[1].replace(',', '.'));
                if (metaMatch[2].toLowerCase().includes('mi')) {
                    dist = dist * 1.60934;
                }
                distance_km = dist;
                console.log('  ✓ Distance from meta tag:', dist, 'km');
            }
        }

        // Pattern 8: Look for any "X.X km" pattern in the page
        if (distance_km === null) {
            const anyKmMatch = html.match(/>(\d+\.?\d*)\s*km</i);
            if (anyKmMatch) {
                const dist = parseFloat(anyKmMatch[1]);
                if (!isNaN(dist) && dist > 0 && dist < 1000) { // Sanity check
                    distance_km = dist;
                    console.log('  ✓ Distance from generic pattern:', dist, 'km');
                }
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
