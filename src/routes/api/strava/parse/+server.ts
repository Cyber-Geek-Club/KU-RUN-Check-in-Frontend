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

        // First, try to resolve short link and get the activity ID
        let finalUrl = url;
        let activityId: string | null = null;
        
        // Extract activity ID from URL or resolve short link
        const directIdMatch = url.match(/strava\.com\/activities\/(\d+)/i);
        if (directIdMatch) {
            activityId = directIdMatch[1];
            finalUrl = `https://www.strava.com/activities/${activityId}`;
            console.log('📎 Direct activity ID:', activityId);
        } else if (url.includes('strava.app.link')) {
            console.log('📎 Resolving short link...');
            const resolved = await resolveStravaShortLink(url);
            finalUrl = resolved.url;
            activityId = resolved.activityId;
            console.log('📎 Resolved URL:', finalUrl, 'Activity ID:', activityId);
        }

        // Try Method 1: Fetch the mobile activity page directly
        console.log('🌐 Method 1: Fetching activity page:', finalUrl);

        const response = await fetch(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow'
        });

        console.log('📥 Response status:', response.status, 'Final URL:', response.url);

        // Check if we got redirected and can extract activity ID from final URL
        if (response.url) {
            const finalIdMatch = response.url.match(/activities\/(\d+)/);
            if (finalIdMatch && !activityId) {
                activityId = finalIdMatch[1];
                console.log('📎 Activity ID from redirect:', activityId);
            }
        }

        let result = { distance_km: null as number | null, moving_time: null as string | null, activity_name: null as string | null, elevation_gain: null as string | null };

        if (response.ok) {
            const html = await response.text();
            console.log('📄 Got HTML, length:', html.length);
            
            // Parse the HTML
            result = parseStravaHtml(html);
        }

        // Try Method 2: If parsing failed and we have activity ID, try embed endpoint
        if (result.distance_km === null && activityId) {
            console.log('🌐 Method 2: Trying embed endpoint for activity:', activityId);
            const embedResult = await tryEmbedEndpoint(activityId);
            if (embedResult.distance_km !== null) {
                result = { ...result, ...embedResult };
            }
        }

        // Try Method 3: If still failed, try the /overview page which is lighter
        if (result.distance_km === null && activityId) {
            console.log('🌐 Method 3: Trying overview endpoint for activity:', activityId);
            const overviewResult = await tryOverviewEndpoint(activityId);
            if (overviewResult.distance_km !== null) {
                result = { ...result, ...overviewResult };
            }
        }

        // Return result
        if (result.distance_km !== null) {
            console.log('✅ Parsed successfully:', result);
            return json({
                success: true,
                ...result
            });
        } else {
            console.log('⚠️ Could not parse distance from any method');
            return json({
                success: false,
                activity_name: result.activity_name,
                error: 'Could not extract distance - activity might be private',
                hint: 'Please enter distance manually'
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
 * Try to get activity data from Strava's embed endpoint
 */
async function tryEmbedEndpoint(activityId: string): Promise<{
    distance_km: number | null;
    moving_time: string | null;
    activity_name: string | null;
    elevation_gain: string | null;
}> {
    try {
        // Try the embed page which is lighter and more parseable
        const embedUrl = `https://www.strava.com/activities/${activityId}/embed/${activityId}`;
        console.log('  📎 Fetching embed:', embedUrl);
        
        const res = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,*/*',
            }
        });

        if (!res.ok) {
            console.log('  ⚠️ Embed fetch failed:', res.status);
            return { distance_km: null, moving_time: null, activity_name: null, elevation_gain: null };
        }

        const html = await res.text();
        console.log('  📄 Embed HTML length:', html.length);

        // Embed pages typically have simpler structure
        // Look for distance in various formats
        
        // Pattern: "distance":"3.45" in JSON
        const jsonDistMatch = html.match(/"distance"\s*:\s*"?([\d.]+)"?/i);
        if (jsonDistMatch) {
            const dist = parseFloat(jsonDistMatch[1]);
            if (!isNaN(dist) && dist > 0) {
                console.log('  ✓ Distance from embed JSON:', dist);
                // Could be in meters or km, check magnitude
                const distance_km = dist > 100 ? dist / 1000 : dist;
                return { distance_km, moving_time: null, activity_name: null, elevation_gain: null };
            }
        }

        // Pattern: data-distance="3.45"
        const dataDistMatch = html.match(/data-distance=["']?([\d.]+)["']?/i);
        if (dataDistMatch) {
            const dist = parseFloat(dataDistMatch[1]);
            if (!isNaN(dist) && dist > 0) {
                console.log('  ✓ Distance from data attribute:', dist);
                const distance_km = dist > 100 ? dist / 1000 : dist;
                return { distance_km, moving_time: null, activity_name: null, elevation_gain: null };
            }
        }

        // Parse standard HTML patterns
        return parseStravaHtml(html);
    } catch (error) {
        console.log('  ⚠️ Embed error:', error);
        return { distance_km: null, moving_time: null, activity_name: null, elevation_gain: null };
    }
}

/**
 * Try to get activity data from Strava's overview page
 */
async function tryOverviewEndpoint(activityId: string): Promise<{
    distance_km: number | null;
    moving_time: string | null;
    activity_name: string | null;
    elevation_gain: string | null;
}> {
    try {
        // Try the overview page 
        const overviewUrl = `https://www.strava.com/activities/${activityId}/overview`;
        console.log('  📎 Fetching overview:', overviewUrl);
        
        const res = await fetch(overviewUrl, {
            headers: {
                'User-Agent': 'Twitterbot/1.0',  // Social bot gets clean HTML
                'Accept': 'text/html,application/xhtml+xml,*/*',
            }
        });

        if (!res.ok) {
            console.log('  ⚠️ Overview fetch failed:', res.status);
            return { distance_km: null, moving_time: null, activity_name: null, elevation_gain: null };
        }

        const html = await res.text();
        console.log('  📄 Overview HTML length:', html.length);

        // Social bot pages usually have og: tags with data
        // Look for distance in og:description
        const ogDescMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
        if (ogDescMatch) {
            const desc = ogDescMatch[1];
            console.log('  📄 OG Description:', desc);
            // Pattern: "1.1 km" or "1.1km"
            const distMatch = desc.match(/([\d.,]+)\s*km/i);
            if (distMatch) {
                const dist = parseFloat(distMatch[1].replace(',', '.'));
                if (!isNaN(dist) && dist > 0) {
                    console.log('  ✓ Distance from og:description:', dist);
                    return { distance_km: dist, moving_time: null, activity_name: null, elevation_gain: null };
                }
            }
        }

        // Parse standard HTML patterns
        return parseStravaHtml(html);
    } catch (error) {
        console.log('  ⚠️ Overview error:', error);
        return { distance_km: null, moving_time: null, activity_name: null, elevation_gain: null };
    }
}

/**
 * Resolve Strava short link (strava.app.link) to full activity URL
 * These links use multiple redirects and sometimes JS-based routing
 */
async function resolveStravaShortLink(shortUrl: string): Promise<{ url: string; activityId: string | null }> {
    let activityId: string | null = null;
    
    try {
        // First, try to follow redirects with mobile user agent
        const res1 = await fetch(shortUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        // Check if we got redirected to strava.com
        if (res1.url) {
            const idMatch = res1.url.match(/activities\/(\d+)/);
            if (idMatch) {
                activityId = idMatch[1];
                console.log('  → Redirect resolved, ID:', activityId);
                return { url: res1.url, activityId };
            }
        }

        // If not redirected directly, parse the HTML to find the URL
        const html = await res1.text();
        
        // Look for activity ID or URL patterns in the page
        const patterns = [
            // Direct activity URL
            /https:\/\/www\.strava\.com\/activities\/(\d+)[^"'\s<>]*/gi,
            // Activity ID in data attributes
            /data-activity-id=["']?(\d+)["']?/i,
            // Activity ID in JSON
            /"activityId"\s*:\s*["']?(\d+)["']?/i,
            /"activity_id"\s*:\s*["']?(\d+)["']?/i,
            /"id"\s*:\s*(\d{8,})[\s,}]/i,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                const id = match[1];
                // Validate it looks like an activity ID (8+ digits)
                if (id && /^\d{8,}$/.test(id)) {
                    activityId = id;
                    console.log('  → Found activity ID in HTML:', activityId);
                    return { url: `https://www.strava.com/activities/${activityId}`, activityId };
                }
            }
        }

        // Look for canonical or og:url
        const urlPatterns = [
            /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
            /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i,
            /property=["']og:url["'][^>]*content=["']([^"']+)["']/i,
            /content=["']([^"']+)["'][^>]*property=["']og:url["']/i,
        ];

        for (const pattern of urlPatterns) {
            const match = html.match(pattern);
            if (match && match[1].includes('strava.com/activities')) {
                const url = match[1];
                const idMatch = url.match(/activities\/(\d+)/);
                if (idMatch) {
                    activityId = idMatch[1];
                }
                console.log('  → Found URL in meta tags:', url);
                return { url, activityId };
            }
        }

        // Try extracting from __NEXT_DATA__
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
        if (nextDataMatch) {
            try {
                const data = JSON.parse(nextDataMatch[1]);
                const id = data?.props?.pageProps?.activity?.id ||
                          data?.props?.pageProps?.initialActivity?.id ||
                          data?.props?.initialReduxState?.currentActivity?.id;
                if (id) {
                    activityId = String(id);
                    const activityUrl = `https://www.strava.com/activities/${activityId}`;
                    console.log('  → Found activity ID in __NEXT_DATA__:', activityId);
                    return { url: activityUrl, activityId };
                }
            } catch (e) {
                // Ignore
            }
        }

        // Return original URL if we couldn't resolve
        return { url: shortUrl, activityId: null };
    } catch (error) {
        console.error('  ⚠️ Error resolving short link:', error);
        return { url: shortUrl, activityId: null };
    }
}

/**
 * Parse Strava HTML to extract activity data
 * Based on Python script approach - more reliable regex patterns
 */
function parseStravaHtml(html: string): {
    distance_km: number | null;
    moving_time: string | null;
    activity_name: string | null;
    elevation_gain: string | null;
} {
    let distance_km: number | null = null;
    let moving_time_seconds: number = 0;
    let moving_time: string | null = null;
    let activity_name: string | null = null;
    let elevation_gain: string | null = null;

    try {
        console.log('🔎 Parsing HTML (Python method)...');
        
        // Strip HTML tags for text search (like BeautifulSoup's get_text)
        const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        
        // ---------------------------------------------------------
        // 🎯 1. หา Activity Title
        // ---------------------------------------------------------
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
            activity_name = titleMatch[1].replace(/\s*\|\s*Strava.*$/i, '').trim();
            console.log('  ✓ Activity name:', activity_name);
        }

        // ---------------------------------------------------------
        // 📏 2. หาระยะทาง (Distance) - regex from Python
        // ---------------------------------------------------------
        const distMatch = html.match(/"distance"\s*:\s*([\d.]+)/);
        if (distMatch) {
            const dist = parseFloat(distMatch[1]);
            if (!isNaN(dist) && dist > 0) {
                // Strava stores distance in meters
                distance_km = dist / 1000;
                console.log('  ✓ Distance from JSON:', distance_km, 'km');
            }
        }

        // ---------------------------------------------------------
        // ⏱️ 3. หาเวลา (Time) - multiple methods from Python
        // ---------------------------------------------------------
        // Step A: หาใน JSON keys
        const timeKeys = ['moving_time', 'elapsed_time', 'time_seconds'];
        for (const key of timeKeys) {
            const timeMatch = html.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
            if (timeMatch) {
                const val = parseInt(timeMatch[1]);
                if (val > 0) {
                    moving_time_seconds = val;
                    console.log(`  ✓ Time from ${key}:`, val, 'seconds');
                    break;
                }
            }
        }
        
        // Step B: Text scan patterns (like BeautifulSoup get_text)
        if (moving_time_seconds === 0) {
            // Pattern: 1h 20m
            const hmMatch = textContent.match(/(\d+)h\s+(\d+)m/);
            if (hmMatch) {
                moving_time_seconds = (parseInt(hmMatch[1]) * 3600) + (parseInt(hmMatch[2]) * 60);
                console.log('  ✓ Time from h m pattern:', moving_time_seconds, 'seconds');
            }
            
            // Pattern: 50m 30s
            if (moving_time_seconds === 0) {
                const msMatch = textContent.match(/(\d+)m\s+(\d+)s/);
                if (msMatch) {
                    moving_time_seconds = (parseInt(msMatch[1]) * 60) + parseInt(msMatch[2]);
                    console.log('  ✓ Time from m s pattern:', moving_time_seconds, 'seconds');
                }
            }
            
            // Pattern: Time 1:20:30 or Time 20:30
            if (moving_time_seconds === 0) {
                const clockMatch = textContent.match(/Time\s*(\d{1,2}:\d{2}(?::\d{2})?)/i);
                if (clockMatch) {
                    const parts = clockMatch[1].split(':').map(Number);
                    if (parts.length === 3) {
                        moving_time_seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) {
                        moving_time_seconds = parts[0] * 60 + parts[1];
                    }
                    console.log('  ✓ Time from clock pattern:', moving_time_seconds, 'seconds');
                }
            }
        }
        
        // Step C: Calculate from Pace (ไม้ตาย)
        if (moving_time_seconds === 0 && distance_km && distance_km > 0) {
            // Pattern: 5:30 /km
            const paceMatch = textContent.match(/(\d{1,2}):(\d{2})\s*\/km/);
            if (paceMatch) {
                const paceSeconds = (parseInt(paceMatch[1]) * 60) + parseInt(paceMatch[2]);
                moving_time_seconds = Math.round(distance_km * paceSeconds);
                console.log('  💡 Time calculated from pace:', moving_time_seconds, 'seconds');
            }
        }
        
        // Format time to string
        if (moving_time_seconds > 0) {
            const h = Math.floor(moving_time_seconds / 3600);
            const m = Math.floor((moving_time_seconds % 3600) / 60);
            const s = moving_time_seconds % 60;
            moving_time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        // ---------------------------------------------------------
        // 🏔️ 4. หา Elevation (bonus)
        // ---------------------------------------------------------
        const elevMatch = html.match(/"elevation_gain"\s*:\s*([\d.]+)/);
        if (elevMatch) {
            elevation_gain = `${Math.round(parseFloat(elevMatch[1]))} m`;
            console.log('  ✓ Elevation:', elevation_gain);
        }

        // ---------------------------------------------------------
        // 🔄 Fallback: Try Stat_statValue pattern for distance
        // ---------------------------------------------------------
        if (distance_km === null) {
            const statValuePattern = /class="Stat_statValue[^"]*"[^>]*>\s*([\d.,]+)\s*(km|mi)?/gi;
            const statMatches = [...html.matchAll(statValuePattern)];
            for (const match of statMatches) {
                let dist = parseFloat(match[1].replace(',', '.'));
                if (match[2]?.toLowerCase() === 'mi') {
                    dist = dist * 1.60934;
                }
                if (!isNaN(dist) && dist > 0 && dist < 1000) {
                    distance_km = dist;
                    console.log('  ✓ Distance from Stat class:', dist, 'km');
                    break;
                }
            }
        }

        // ---------------------------------------------------------
        // 🔄 Fallback: Generic >X.X km< pattern
        // ---------------------------------------------------------
        if (distance_km === null) {
            const anyKmMatch = html.match(/>(\d+\.?\d*)\s*km</i);
            if (anyKmMatch) {
                const dist = parseFloat(anyKmMatch[1]);
                if (!isNaN(dist) && dist > 0 && dist < 1000) {
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
