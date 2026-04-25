/**
 * charts.js — Chart.js configuration helpers for surveilencemaxxing.
 * Dark theme defaults, line chart factory, sparkline factory.
 */

// ─── Global Chart.js Dark Theme Defaults ──────────────────────────────────────
Chart.defaults.color = '#666680';
Chart.defaults.borderColor = '#1e1e2e';
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size = 11;
Chart.defaults.animation.duration = 400;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#111118';
Chart.defaults.plugins.tooltip.borderColor = '#2a2a3e';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#e0e0f0';
Chart.defaults.plugins.tooltip.bodyColor = '#666680';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;

// ─── Color constants ──────────────────────────────────────────────────────────
const COLORS = {
    green: '#00ff88',
    red: '#ff4466',
    blue: '#4488ff',
    yellow: '#ffcc44',
    purple: '#aa66ff',
    orange: '#ff8844',
};

function makeGradient(ctx, colorHex, alpha1 = 0.25, alpha2 = 0.0) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.offsetHeight || 200);
    gradient.addColorStop(0, colorHex + Math.round(alpha1 * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, colorHex + Math.round(alpha2 * 255).toString(16).padStart(2, '0'));
    return gradient;
}

// ─── Line Chart Factory ───────────────────────────────────────────────────────
/**
 * Create a styled line chart.
 * @param {string} canvasId - Canvas element ID
 * @param {string[]} labels  - X-axis labels
 * @param {number[]} values  - Data values
 * @param {string} color     - Hex color string (e.g. '#00ff88')
 * @param {string} label     - Dataset label
 */
function createLineChart(canvasId, labels, values, color = COLORS.blue, label = '') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Destroy existing chart if any
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = makeGradient(ctx, color);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                borderColor: color,
                borderWidth: 2,
                backgroundColor: gradient,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { intersect: false, mode: 'index' },
            scales: {
                x: {
                    grid: { color: 'rgba(30,30,46,0.8)', lineWidth: 1 },
                    ticks: {
                        maxTicksLimit: 7,
                        maxRotation: 0,
                        color: '#444460',
                    },
                },
                y: {
                    position: 'right',
                    grid: { color: 'rgba(30,30,46,0.8)', lineWidth: 1 },
                    ticks: { color: '#444460' },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y.toLocaleString()}`
                    }
                }
            }
        }
    });
}

// ─── Sparkline Chart Factory ──────────────────────────────────────────────────
/**
 * Create a minimal sparkline chart (no axes, no labels).
 * @param {string} canvasId - Canvas element ID
 * @param {number[]} values  - Data array
 * @param {string} color     - Hex color
 */
function createSparkline(canvasId, values, color = COLORS.blue) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const ctx = canvas.getContext('2d');
    const gradient = makeGradient(ctx, color, 0.3, 0.0);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: values.map((_, i) => i),
            datasets: [{
                data: values,
                borderColor: color,
                borderWidth: 1.5,
                backgroundColor: gradient,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { display: false },
                y: { display: false },
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
            },
            elements: { line: { borderJoinStyle: 'round' } }
        }
    });
}

// ─── Fear & Greed Gauge (SVG-based) ──────────────────────────────────────────
/**
 * Draw the Fear & Greed arc gauge.
 * @param {string} svgId   - SVG element ID
 * @param {number} value   - 0..100
 * @param {string} color   - Arc color hex
 */
function drawFearGreedGauge(svgId, value, color) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const W = 180, H = 100, cx = 90, cy = 95, r = 70;
    const startAngle = Math.PI;       // left
    const totalAngle = Math.PI;       // semicircle
    const angle = startAngle + (value / 100) * totalAngle;

    function polar(angle, radius) {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    }

    const trackStart = polar(startAngle, r);
    const trackEnd = polar(0, r);

    const needleX = polar(angle, r - 10).x;
    const needleY = polar(angle, r - 10).y;

    // Zone colors
    const zones = [
        { start: 0, end: 25, color: '#ff4466' },
        { start: 25, end: 45, color: '#ff8844' },
        { start: 45, end: 55, color: '#4488ff' },
        { start: 55, end: 75, color: '#88cc44' },
        { start: 75, end: 100, color: '#00ff88' },
    ];

    let arcs = '';
    for (const zone of zones) {
        const a1 = startAngle + (zone.start / 100) * totalAngle;
        const a2 = startAngle + (zone.end / 100) * totalAngle;
        const p1 = polar(a1, r);
        const p2 = polar(a2, r);
        const large = (zone.end - zone.start) > 50 ? 1 : 0;
        arcs += `<path d="M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}"
            fill="none" stroke="${zone.color}" stroke-width="10" stroke-opacity="0.6"
            stroke-linecap="butt"/>`;
    }

    // Active zone highlight
    const needlePoint = polar(angle, r);
    const needleStart = polar(startAngle, r);
    const needleLarge = value > 50 ? 1 : 0;
    arcs += `<path d="M ${needleStart.x} ${needleStart.y} A ${r} ${r} 0 ${needleLarge} 1 ${needlePoint.x} ${needlePoint.y}"
        fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`;

    // Needle
    const nBase1 = polar(angle - 0.08, 12);
    const nBase2 = polar(angle + 0.08, 12);
    const nTip = polar(angle, r - 5);
    arcs += `<polygon points="${nBase1.x},${nBase1.y} ${nTip.x},${nTip.y} ${nBase2.x},${nBase2.y}"
        fill="${color}" opacity="0.9"/>`;
    arcs += `<circle cx="${cx}" cy="${cy}" r="6" fill="#111118" stroke="${color}" stroke-width="2"/>`;

    svg.innerHTML = arcs;
}

// ─── Fetch + render chart helper (for timeframe buttons) ─────────────────────
async function loadForexChart(canvasId, pair, timeframe) {
    try {
        const r = await fetch(`/forex/data?pair=${pair}&timeframe=${timeframe}`);
        const d = await r.json();
        const history = d.history || [];
        const labels = history.map(h => h.date);
        const values = history.map(h => h.rate);
        const color = (values[values.length - 1] >= values[0]) ? COLORS.green : COLORS.red;
        createLineChart(canvasId, labels, values, color, pair);
    } catch (e) {
        console.error('loadForexChart error:', e);
    }
}

async function loadCryptoChart(canvasId, coin, currency, days) {
    try {
        const r = await fetch(`/crypto/data?coin=${coin}&currency=${currency}&days=${days}`);
        const d = await r.json();
        const prices = d.prices || [];
        const labels = prices.map(p => new Date(p[0]).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
        const values = prices.map(p => p[1]);
        const color = (values[values.length - 1] >= values[0]) ? COLORS.green : COLORS.red;
        createLineChart(canvasId, labels, values, color, coin);
    } catch (e) {
        console.error('loadCryptoChart error:', e);
    }
}

// ─── Module refresh helper ────────────────────────────────────────────────────
async function refreshModule(module) {
    const btn = document.getElementById(`refresh-${module}`);
    if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
    try {
        const r = await fetch(`/api/refresh/${module}`);
        const d = await r.json();
        if (d.status === 'ok') {
            setTimeout(() => location.reload(), 600);
        } else {
            alert(`Refresh failed: ${d.error || 'unknown error'}`);
        }
    } catch (e) {
        alert(`Network error: ${e}`);
    } finally {
        if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
    }
}
