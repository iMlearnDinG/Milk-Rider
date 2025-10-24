// --- Game Constants ---
const BOOST_DURATION = 2000;
const BOOST_INITIAL_SPEED = 20;
const BOOST_STACK_SPEED_INCREASE = 5;
const FRENZY_SPEED_THRESHOLD = BOOST_INITIAL_SPEED * 0.8;
const FRENZY_CHAIN_TIME = 5000;
const BOOST_CHAIN_GAP = 500;
const MAX_SPEED = 10;
const TAP_DECAY = 0.99;
const HOLD_ACCELERATION = 0.05;
const ROAD_HEIGHT = 100;
const PLAYER_X_POSITION = 200;
const HOUSE_SELL_PROXIMITY = 150;
const BOTTLE_SPAWN_CHANCE = 0.005;
const POWERUP_SPAWN_CHANCE = 0.0015;
// const COLLECTIBLE_BOTTLE_VALUE = 1; // REPLACED
const PLAYER_Y_LERP_FACTOR = 0.08;
const GRAVITY = 0.5;
const RAMP_JUMP_VELOCITY = -15;
const RAMP_SPAWN_CHANCE = 0.0008;
const MILK_CHARGE_SPEED_FACTOR = 0.5;
const TIME_SCALE = 0.1;
const DAY_DURATION = 2400;
const SEASON_DURATION = 10000;
const MAX_PARTICLES = 200;
const STAR_COUNT = 150;
const TRAILER_OFFSET_X = -80;
const ROPE_STIFFNESS = 0.01;
const ROPE_DAMPING = 0.1;
const ROPE_LENGTH = 50;
const BUTTON_LERP_FACTOR = 0.1;

// --- Game State ---
let speed = 0;
let distance = 0;
let money = 0;
let bottledMilk = 0;
let currentMilk = 0;
let worldOffset = 0;
let houses = [];
let collectibleBottles = [];
let powerups = [];
let ramps = [];
let rareMilks = [];
let isBoosting = false;
let boostEndTime = 0;
let currentBoostSpeed = 0;
let lastBoostTime = 0;
let boostChainStartTime = 0; // This is no longer used for frenzy activation
let boostChainCount = 0; // NEW: Tracks consecutive boosts
let isFrenzyActive = false;
let frenzyStartTime = 0;
let frenzyGracePeriodEnd = 0; // NEW: Timer for frenzy grace period
let lastFrenzyDuration = 0;
let longestFrenzyDuration = 0; // NEW: Track the best frenzy time
let isNearHouse = false;
let isAutoSelling = false;
let autoSellTimer = 0;
let gameRunning = false;
let sellIcon = { x: 0, y: 0, radius: 30, visible: false };
let roadTopYBoundary = 0;
let roadBottomYBoundary = 0;
let targetPlayerY = 0;
let isPointerDown = false;
let wind = 0;
let hasShownFullMessage = false;
let hasShownBoostMessage = false;
let gameTime = 500;
let currentSeason = 'autumn';
let seasonTimer = 0;
let particles = [];
let stars = [];
let currentMaxMilk = 100;
let bottlePrice = 25;
let bottlesForBoost = 1;
let moneyMultiplier = 1.0;
// Upgrades
let speedLevel = 1;
let speedCost = 50;
let efficiencyLevel = 1;
let efficiencyCost = 50;
let sellValueLevel = 1;
let sellValueCost = 75;
let collectorLevel = 1; // NEW
const collectorCosts = [200, 1000, 5000, 10000]; // Tiered costs for the collector
let collectorCost = collectorCosts[0]; // Initial cost
let collectibleBottleValue = 1;
let rareMilkMultiplier = 1; // NEW: Multiplier for rare milk
let holdPower = HOLD_ACCELERATION;

const player = {
    x: PLAYER_X_POSITION,
    y: 0,
    vy: 0,
    inAir: false,
    width: 80,
    height: 90,
    hitbox: {
        x: -30, y: -75, width: 70, height: 100
    },
    inventory: {}
};
const trailer = {
    x: PLAYER_X_POSITION + TRAILER_OFFSET_X,
    y: 0,
    vx: 0,
    width: 40,
    height: 30,
    wheelRadius: 8
};
let bottleButtonPos = { x: 100, y: window.innerHeight / 2 };
let boostButtonPos = { x: 100, y: window.innerHeight / 2 + 90 };


// --- Utility Functions ---
function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = Math.min(PLAYER_X_POSITION, canvas.width * 0.25);
    trailer.x = player.x + TRAILER_OFFSET_X;
    const roadVisualTop = canvas.height - ROAD_HEIGHT + 10;
    const roadVisualBottom = canvas.height - 10;
    const playerVisualHeight = player.height;
    roadTopYBoundary = roadVisualTop + playerVisualHeight / 2 - 35;
    roadBottomYBoundary = roadVisualBottom - playerVisualHeight / 2 + 10;
    if (player.y === 0 || player.y < roadTopYBoundary || player.y > roadBottomYBoundary) {
        player.y = (roadTopYBoundary + roadBottomYBoundary) / 2;
        targetPlayerY = player.y;
    } else {
        player.y = Math.max(roadTopYBoundary, Math.min(roadBottomYBoundary, player.y));
        targetPlayerY = Math.max(roadTopYBoundary, Math.min(roadBottomYBoundary, targetPlayerY));
    }
    trailer.y = player.y;
}

function lerpColor(a, b, amount) {
    const ar = parseInt(a.slice(1, 3), 16),
        ag = parseInt(a.slice(3, 5), 16),
        ab = parseInt(a.slice(5, 7), 16),
        br = parseInt(b.slice(1, 3), 16),
        bg = parseInt(b.slice(3, 5), 16),
        bb = parseInt(b.slice(5, 7), 16),
        rr = Math.round(ar + (br - ar) * amount).toString(16).padStart(2, '0'),
        rg = Math.round(ag + (bg - ag) * amount).toString(16).padStart(2, '0'),
        rb = Math.round(ab + (bb - ab) * amount).toString(16).padStart(2, '0');
    return '#' + rr + rg + rb;
}

// --- World Generation & Drawing (NO CHANGES IN THIS SECTION) ---
// ... functions from createHouse to drawRope remain the same ...
function createHouse(x) {
    const houseHeight = 80 + Math.random() * 100;
    const houseWidth = 100 + Math.random() * 50;
    const colors = ['#A0522D', '#D2691E', '#8B4513', '#CD853F'];
    const roofColors = ['#DC143C', '#8B0000', '#B22222'];
    return {
        x: x,
        y: canvas.height - ROAD_HEIGHT - houseHeight,
        width: houseWidth,
        height: houseHeight,
        color: colors[Math.floor(Math.random() * colors.length)],
        roofColor: roofColors[Math.floor(Math.random() * roofColors.length)],
        snowHeight: 0
    };
}
function generateHouses() {
    if (houses.length === 0) {
        houses.push(createHouse(worldOffset + canvas.width + 100));
    }
    const lastHouse = houses[houses.length - 1];
    if (lastHouse.x + lastHouse.width - worldOffset < canvas.width + 500) {
        const nextX = lastHouse.x + lastHouse.width + 150 + Math.random() * 300;
        houses.push(createHouse(nextX));
    }
}
function removeOldHouses() {
    houses = houses.filter(house => house.x + house.width - worldOffset > 0);
}
function generateCollectibleBottles() {
    if (Math.random() < BOTTLE_SPAWN_CHANCE * (Math.max(speed, 1) / MAX_SPEED + 0.1)) {
        const roadSurfaceY = canvas.height - ROAD_HEIGHT + 10;
        collectibleBottles.push({
            x: worldOffset + canvas.width + 50,
            y: roadSurfaceY + 5 + Math.random() * (ROAD_HEIGHT - 30),
            width: 10,
            height: 20
        });
    }
}
function removeOldCollectibleBottles() {
    collectibleBottles = collectibleBottles.filter(bottle => bottle.x + bottle.width - worldOffset > 0);
}
function generatePowerups() {
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
        const roadSurfaceY = canvas.height - ROAD_HEIGHT + 10;
        powerups.push({
            x: worldOffset + canvas.width + 100,
            y: roadSurfaceY + 10 + Math.random() * (ROAD_HEIGHT - 40),
            width: 30,
            height: 30,
            type: 'autoSell',
            duration: 3000 + Math.random() * 3000
        });
    }
}
function removeOldPowerups() {
    powerups = powerups.filter(p => p.x + p.width - worldOffset > 0);
}
function generateRamps() {
    if (Math.random() < RAMP_SPAWN_CHANCE) {
        const roadSurfaceY = canvas.height - ROAD_HEIGHT + 10;
        const rampWidth = 150;
        const rampHeight = 60;
        const rampX = worldOffset + canvas.width + 200;
        ramps.push({
            x: rampX,
            y: roadSurfaceY + (ROAD_HEIGHT - 20) - rampHeight,
            width: rampWidth,
            height: rampHeight
        });
        const milkValue = 5 + Math.floor(Math.random() * 6);
        rareMilks.push({
            x: rampX + rampWidth / 2,
            y: roadSurfaceY - rampHeight * 2.5,
            width: 20,
            height: 30,
            value: milkValue,
        });
    }
}
function removeOldRamps() {
    ramps = ramps.filter(r => r.x + r.width - worldOffset > 0);
}
function removeOldRareMilks() {
    rareMilks = rareMilks.filter(m => m.x + m.width - worldOffset > 0);
}
function updateGameTime() {
    gameTime = (gameTime + TIME_SCALE) % DAY_DURATION;
    seasonTimer++;
    if (seasonTimer > SEASON_DURATION) {
        seasonTimer = 0;
        if (currentSeason === 'autumn') currentSeason = 'winter';
        else if (currentSeason === 'winter') {
            currentSeason = 'spring';
            houses.forEach(h => h.snowHeight = 0);
        } else if (currentSeason === 'spring') currentSeason = 'summer';
        else if (currentSeason === 'summer') currentSeason = 'autumn';
    }
    if (Math.random() < 0.01) {
        wind = (Math.random() - 0.5) * 2;
    }
}
function getSkyColor() {
    const time = gameTime / DAY_DURATION;
    let c1, c2;
    if (time < 0.2) { c1 = '#020111'; c2 = '#20202E'; }
    else if (time < 0.3) { const interp = (time - 0.2) / 0.1; c1 = lerpColor('#020111', '#3a1c3b', interp); c2 = lerpColor('#20202E', '#f39060', interp); }
    else if (time < 0.7) { const interp = (time - 0.3) / 0.4; c1 = lerpColor('#3a1c3b', '#87CEEB', interp); c2 = lerpColor('#f39060', '#f8ffff', interp); }
    else if (time < 0.8) { const interp = (time - 0.7) / 0.1; c1 = lerpColor('#87CEEB', '#3a1c3b', interp); c2 = lerpColor('#f8ffff', '#f39060', interp); }
    else { const interp = (time - 0.8) / 0.2; c1 = lerpColor('#3a1c3b', '#020111', interp); c2 = lerpColor('#f39060', '#20202E', interp); }
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);
    return gradient;
}
function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.8,
            radius: Math.random() * 1.5,
            alpha: Math.random()
        });
    }
}
function drawSunMoon() {
    const time = gameTime / DAY_DURATION,
        angle = time * Math.PI * 2 - (Math.PI / 2),
        centerX = canvas.width / 2,
        centerY = canvas.height,
        radius = Math.min(canvas.width / 2, canvas.height) * 1.2,
        x = centerX + Math.cos(angle) * radius,
        y = centerY + Math.sin(angle) * radius;
    let color = '#FFF', size = 20;
    if (time > 0.3 && time < 0.7) { color = '#FFD700'; size = 30; }
    else { color = '#F4F4F4'; size = 20; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}
function drawStars() {
    const time = gameTime / DAY_DURATION;
    if (time > 0.8 || time < 0.25) {
        let intensity = (time > 0.8) ? (time - 0.8) / 0.2 : (0.25 - time) / 0.25;
        stars.forEach(star => {
            if (Math.random() > 0.99) star.alpha = Math.random();
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * intensity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
// --- Physics & Collisions ---
// --- Physics & Collisions ---
function updateParticles() {
    const effectiveGravity = 0.5;
    if (particles.length < MAX_PARTICLES) {
        // ... (particle generation logic is unchanged) ...
    }
    const roadY = canvas.height - ROAD_HEIGHT;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // MODIFIED: Particle X position is no longer affected by player speed.
        // This stops them from sweeping sideways.
        p.x += p.vx;
        p.y += p.vy;
        if (p.type !== 'rain') p.vy += effectiveGravity * 0.05;

        if (p.y > roadY) { particles.splice(i, 1); continue; }

        // MODIFIED: Snow no longer sticks to houses.
        for (const house of houses) {
            const screenX = house.x - worldOffset;
            if (p.x > screenX && p.x < screenX + house.width && p.y > house.y && p.y < house.y + 10) {
                // All particles are now removed on contact with a roof.
                particles.splice(i, 1);
                break;
            }
        }
        if (p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
            particles.splice(i, 1);
        }
    }
}
function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        if (p.stuck) {
            const houseItStuckTo = houses.find(h => {
                const screenX = h.x - worldOffset;
                return p.x > screenX && p.x < screenX + h.width && p.y > h.y && p.y < h.y + 5;
            });
            if (houseItStuckTo) {
                const screenX = houseItStuckTo.x - worldOffset;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            } else {
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        } else {
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}
function drawEnvironment() {
    ctx.fillStyle = getSkyColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawSunMoon();
    drawStars();
    ctx.fillStyle = '#228B22';
    if (currentSeason === 'winter') ctx.fillStyle = '#DDDDDD';
    if (currentSeason === 'autumn') ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - ROAD_HEIGHT, canvas.width, ROAD_HEIGHT);
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, canvas.height - ROAD_HEIGHT + 10, canvas.width, ROAD_HEIGHT - 20);
    ctx.fillStyle = 'white';
    const dashWidth = 40, dashGap = 60, startOffset = (worldOffset * 0.5) % (dashWidth + dashGap);
    for (let x = -startOffset; x < canvas.width; x += (dashWidth + dashGap)) {
        ctx.fillRect(x, canvas.height - ROAD_HEIGHT / 2 - 2, dashWidth, 4);
    }
}
function drawCollectibleBottles() {
    for (const bottle of collectibleBottles) {
        const screenX = bottle.x - worldOffset;
        if (screenX > canvas.width + bottle.width || screenX < -bottle.width) continue;
        ctx.fillStyle = 'white';
        ctx.fillRect(screenX, bottle.y, bottle.width, bottle.height);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(screenX, bottle.y, bottle.width, bottle.height * 0.3);
    }
}
function drawHouses() {
    isNearHouse = false;
    let closestHouseScreenX = -1, closestHouseScreenY = -1, minHouseDist = HOUSE_SELL_PROXIMITY;
    sellIcon.visible = false;
    for (const house of houses) {
        const screenX = house.x - worldOffset;
        if (screenX > canvas.width || screenX + house.width < 0) continue;
        ctx.fillStyle = house.color;
        ctx.fillRect(screenX, house.y, house.width, house.height);
        ctx.fillStyle = house.roofColor;
        ctx.beginPath();
        ctx.moveTo(screenX - 10, house.y);
        ctx.lineTo(screenX + house.width + 10, house.y);
        ctx.lineTo(screenX + house.width / 2, house.y - 40);
        ctx.closePath();
        ctx.fill();
        if (house.snowHeight > 0) {
            ctx.fillStyle = 'white';
            const snowOffset = Math.min(house.snowHeight, 20);
            ctx.beginPath();
            ctx.moveTo(screenX - 10, house.y - snowOffset * 0.5);
            ctx.lineTo(screenX + house.width + 10, house.y - snowOffset * 0.5);
            ctx.lineTo(screenX + house.width / 2, house.y - 40 - snowOffset);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = '#654321';
        ctx.fillRect(screenX + house.width / 2 - 15, house.y + house.height - 30, 30, 30);

        const houseCenterX = screenX + house.width / 2;
        const dist = Math.abs(player.x - houseCenterX);
        if (dist < HOUSE_SELL_PROXIMITY && !player.inAir) {
            if (dist < minHouseDist) {
                isNearHouse = true;
                minHouseDist = dist;
                closestHouseScreenX = houseCenterX;
                closestHouseScreenY = house.y - 20;
            }
        }
    }
    if (isNearHouse && currentMilk >= currentMaxMilk && !isBoosting && !isAutoSelling) {
        const iconX = closestHouseScreenX;
        const iconY = closestHouseScreenY - 40;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#00ff99';
        ctx.beginPath();
        ctx.arc(iconX, iconY, sellIcon.radius, 0, Math.PI * 2);
        ctx.fill();
        const pulseRadius = sellIcon.radius * (1 + Math.sin(Date.now() / 200) * 0.1);
        ctx.strokeStyle = '#00ff99';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(iconX, iconY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', iconX, iconY);
        ctx.fillStyle = '#00ff99';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`+$${Math.floor(bottlePrice * moneyMultiplier)}`, iconX, iconY + sellIcon.radius + 10);
        sellIcon.x = iconX;
        sellIcon.y = iconY;
        sellIcon.visible = true;
    }
}
function drawPowerups() {
    for (const p of powerups) {
        const screenX = p.x - worldOffset;
        if (screenX > canvas.width + p.width || screenX < -p.width) continue;
        if (p.type === 'autoSell') {
            ctx.fillStyle = '#22C55E';
            ctx.beginPath();
            ctx.rect(screenX, p.y, p.width, p.height * 0.8);
            ctx.moveTo(screenX, p.y);
            ctx.lineTo(screenX + p.width * 0.3, p.y - p.height * 0.2);
            ctx.lineTo(screenX + p.width * 0.7, p.y - p.height * 0.2);
            ctx.lineTo(screenX + p.width, p.y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', screenX + p.width / 2, p.y + p.height * 0.4);
        }
    }
}
function drawRamps() {
    for (const ramp of ramps) {
        const screenX = ramp.x - worldOffset;
        if (screenX > canvas.width || screenX + ramp.width < 0) continue;
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(screenX, ramp.y + ramp.height);
        ctx.lineTo(screenX + ramp.width, ramp.y + ramp.height);
        ctx.lineTo(screenX + ramp.width * 0.8, ramp.y);
        ctx.lineTo(screenX + ramp.width * 0.2, ramp.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(screenX + ramp.width * 0.2 + (ramp.width * 0.6 / 5) * i, ramp.y);
            ctx.lineTo(screenX + (ramp.width / 5) * i, ramp.y + ramp.height);
            ctx.stroke();
        }
    }
}
function drawRareMilks() {
    for (const milk of rareMilks) {
        const screenX = milk.x - worldOffset;
        if (screenX > canvas.width + milk.width || screenX < -milk.width) continue;
        ctx.save();
        const glowAmount = Math.sin(Date.now() / 150) * 5 + 15;
        ctx.shadowBlur = glowAmount;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, milk.y, milk.width, milk.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(screenX, milk.y, milk.width, milk.height * 0.3);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX + milk.width * 0.7, milk.y + milk.height * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
function drawPlayer() {
    const y = player.y, x = player.x;
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(x - 25, y + 25, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 25, y + 25, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    const wheelAngle = worldOffset * 0.1;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + wheelAngle;
        ctx.beginPath(); ctx.moveTo(x - 25, y + 25); ctx.lineTo(x - 25 + 15 * Math.cos(angle), y + 25 + 15 * Math.sin(angle)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 25, y + 25); ctx.lineTo(x + 25 + 15 * Math.cos(angle), y + 25 + 15 * Math.sin(angle)); ctx.stroke();
    }
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 25, y + 25); ctx.lineTo(x - 15, y - 30); ctx.lineTo(x + 10, y + 10); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 25, y + 25); ctx.lineTo(x + 20, y - 25); ctx.lineTo(x + 10, y + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 15, y - 20); ctx.lineTo(x - 15, y - 30); ctx.stroke();
    ctx.fillStyle = 'black'; ctx.beginPath(); ctx.moveTo(x - 25, y - 30); ctx.lineTo(x - 5, y - 30); ctx.lineTo(x - 10, y - 35); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 15, y - 25); ctx.lineTo(x + 30, y - 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 15, y - 25); ctx.lineTo(x + 5, y - 28); ctx.stroke();
    ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 15, y - 32); ctx.lineTo(x - 10, y - 55); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 10, y - 65, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10, y - 45); ctx.lineTo(x + 25, y - 27); ctx.stroke();
    const pedalCenterX = x + 10, pedalCenterY = y + 10;
    const pedalAngle = (Date.now() / 100 * (speed / MAX_SPEED + 0.1) * 5) % (Math.PI * 2);
    const pedalLength = 10;
    const legTopX = x - 15, legTopY = y - 32;
    const rightPedalX = pedalCenterX + pedalLength * Math.cos(pedalAngle);
    const rightPedalY = pedalCenterY + pedalLength * Math.sin(pedalAngle);
    ctx.beginPath(); ctx.moveTo(legTopX, legTopY); ctx.lineTo(rightPedalX, rightPedalY); ctx.stroke();
    ctx.fillRect(rightPedalX - 3, rightPedalY - 2, 6, 4);
    const leftPedalX = pedalCenterX + pedalLength * Math.cos(pedalAngle + Math.PI);
    const leftPedalY = pedalCenterY + pedalLength * Math.sin(pedalAngle + Math.PI);
    ctx.beginPath(); ctx.moveTo(legTopX, legTopY); ctx.lineTo(leftPedalX, leftPedalY); ctx.stroke();
    ctx.fillRect(leftPedalX - 3, leftPedalY - 2, 6, 4);
}
function drawTrailer() {
    trailer.y = lerp(trailer.y, player.y, 0.2);
    const x = trailer.x, y = trailer.y;
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(x - 10, y + 25, trailer.wheelRadius, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 10, y + 25, trailer.wheelRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - trailer.width / 2, y + 10, trailer.width, trailer.height - 10);
    const bottleWidth = trailer.width * 0.8;
    const bottleHeight = trailer.height * 1.5;
    const bottleX = x - bottleWidth / 2;
    const bottleY = y + 10 - bottleHeight + 2;
    ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(bottleX, bottleY, bottleWidth, bottleHeight); ctx.stroke(); ctx.fill();
    if (currentMilk > 0) {
        ctx.fillStyle = '#E6F7FF';
        const milkHeight = (bottleHeight - 4) * (currentMilk / currentMaxMilk);
        const milkY = bottleY + bottleHeight - 2 - milkHeight;
        ctx.fillRect(bottleX + 2, milkY, bottleWidth - 4, milkHeight);
    }
    ctx.fillStyle = '#888';
    ctx.fillRect(bottleX, bottleY - 5, bottleWidth, 5);
}
function drawRope() {
    const bikeAttachX = player.x - 28, bikeAttachY = player.y + 20,
        trailerAttachX = trailer.x, trailerAttachY = trailer.y + 15;
    const dx = trailerAttachX - bikeAttachX;
    const dy = trailerAttachY - bikeAttachY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sag = Math.min(dist * 0.1, 15);
    const midX = (bikeAttachX + trailerAttachX) / 2;
    const midY = (bikeAttachY + trailerAttachY) / 2 + sag;
    ctx.strokeStyle = '#5C3A21';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bikeAttachX, bikeAttachY);
    ctx.quadraticCurveTo(midX, midY, trailerAttachX, trailerAttachY);
    ctx.stroke();
}

// --- Physics & Collisions ---
function updatePhysics() {
    if (player.inAir) {
        player.vy += GRAVITY;
        player.y += player.vy;
        const middleOfRoad = (roadTopYBoundary + roadBottomYBoundary) / 2;
        if (player.y >= middleOfRoad && player.vy > 0) {
            player.inAir = false;
            player.vy = 0;
            player.y = middleOfRoad;
            targetPlayerY = player.y;
        }
    } else {
        player.y = lerp(player.y, targetPlayerY, PLAYER_Y_LERP_FACTOR);
        player.y = Math.max(roadTopYBoundary, Math.min(roadBottomYBoundary, player.y));
    }
    const targetX = player.x + TRAILER_OFFSET_X;
    const dx = trailer.x - targetX;
    const springForce = -ROPE_STIFFNESS * dx;
    const dampingForce = -ROPE_DAMPING * trailer.vx;
    const totalForce = springForce + dampingForce;
    trailer.vx += totalForce;
    trailer.x += trailer.vx;
    trailer.y = lerp(trailer.y, player.y, 0.2);
}
function checkCollisions() {
    const px = player.x + player.hitbox.x;
    const py = player.y + player.hitbox.y;
    const pw = player.hitbox.width;
    const ph = player.hitbox.height;
    for (let i = collectibleBottles.length - 1; i >= 0; i--) {
        const bottle = collectibleBottles[i];
        const bx = bottle.x - worldOffset;
        const by = bottle.y;
        if (px < bx + bottle.width && px + pw > bx && py < by + bottle.height && py + ph > by) {
            collectibleBottles.splice(i, 1);
            bottledMilk += collectibleBottleValue;
            showMessage(`+${collectibleBottleValue} Bottle` + (collectibleBottleValue > 1 ? 's!' : '!'));
        }
    }
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        const screenX = p.x - worldOffset;
        if (px < screenX + p.width && px + pw > screenX && py < p.y + p.height && py + ph > p.y) {
            if (p.type === 'autoSell' && !isAutoSelling) {
                isAutoSelling = true;
                autoSellTimer = p.duration;
                showMessage(`Auto-Sell Active! (${Math.ceil(p.duration / 1000)}s)`);
            }
            powerups.splice(i, 1);
        }
    }
    if (!player.inAir) {
        for (const ramp of ramps) {
            const rx = ramp.x - worldOffset;
            if (px < rx + ramp.width && px + pw > rx && py + ph > ramp.y && py < ramp.y + ramp.height) {
                player.inAir = true;
                player.vy = RAMP_JUMP_VELOCITY;
                showMessage("Wahoo!");
                break;
            }
        }
    } else {
        for (let i = rareMilks.length - 1; i >= 0; i--) {
            const milk = rareMilks[i];
            const mx = milk.x - worldOffset;
            if (px < mx + milk.width && px + pw > mx && py < milk.y + milk.height && py + ph > milk.y) {
                // MODIFIED: Apply the rare milk multiplier
                const value = Math.floor(milk.value * rareMilkMultiplier);
                bottledMilk += value;
                showMessage(`RARE MILK! +${value} Bottles!`);
                rareMilks.splice(i, 1);
            }
        }
    }
}


// --- Game Actions ---
// in main.js
function bottleMilkAction() {
    if (currentMilk >= currentMaxMilk && !isAutoSelling && !player.inAir) {
        // This now correctly ensures you always have enough for the next boost
        bottledMilk = bottlesForBoost;
        currentMilk = 0;
        hasShownFullMessage = false;
        showMessage("Boost Gauge Filled!");

        // We can keep the timer logic, as it correctly "primes" the chain 
        // when you're not in the middle of one.
        const now = Date.now();
        if (now - lastBoostTime > BOOST_CHAIN_GAP) {
            lastBoostTime = now;
        }
    }
}

function sellMilkAction(isAuto = false) {
    if (currentMilk >= currentMaxMilk && !isBoosting && !player.inAir && isNearHouse && (isAuto || sellIcon.visible)) {
        currentMilk = 0;
        const earnings = bottlePrice * moneyMultiplier;
        money += earnings;
        hasShownFullMessage = false;
        sellIcon.visible = false;
        showMessage(`+$${Math.floor(earnings)} Sold!` + (isAuto ? " (Auto)" : ""));
    }
}

function useBoostAction() {
    // Exit if we don't have enough milk for the next boost
    if (bottledMilk < bottlesForBoost) {
        return;
    }

    const now = Date.now();

    // --- NEW FRENZY LOGIC ---
    // A frenzy chain continues if we are already boosting. Otherwise, it's a new chain.
    if (isBoosting) {
        boostChainCount++;
    } else {
        boostChainCount = 1; // Start a new chain
    }
    // --- END NEW LOGIC ---

    // Consume the milk and increase the cost for the next boost in the chain
    bottledMilk -= bottlesForBoost;
    bottlesForBoost = Math.floor(bottlesForBoost * 1.1 + 1);
    hasShownBoostMessage = false;

    // Apply the boost speed and duration
    if (isBoosting) {
        // If already boosting, stack it: add duration and speed
        boostEndTime += BOOST_DURATION;
        currentBoostSpeed += BOOST_STACK_SPEED_INCREASE;
        showMessage("Boost Stacked!");
    } else {
        // If not boosting, start a new boost
        isBoosting = true;
        boostEndTime = now + BOOST_DURATION;
        currentBoostSpeed = BOOST_INITIAL_SPEED;
        showMessage("MILK BOOST!");
    }

    // If a frenzy is active, this new boost resets the grace period timer
    if (isFrenzyActive) {
        frenzyGracePeriodEnd = 0;
    }

    // Check if this boost triggers a new frenzy
    if (boostChainCount >= 2 && !isFrenzyActive) {
        isFrenzyActive = true;
        frenzyStartTime = now;
        frenzyDisplay.classList.remove('hidden');
        document.body.classList.add('frenzy-active-body');
        showMessage("MILK FRENZY!", 1000);
    }
}

function updateUpgradeStats() {
    holdPower = HOLD_ACCELERATION * Math.pow(1.2, speedLevel - 1);
    bottlePrice = 25 * Math.pow(2, sellValueLevel - 1);
    collectibleBottleValue = collectorLevel;
    rareMilkMultiplier = collectorLevel;
    applyShopEffects();
}

function purchaseUpgradeSpeed() { if (money >= speedCost) { money -= speedCost; speedLevel++; speedCost = Math.floor(speedCost * 1.5); updateUpgradeStats(); showMessage("Pedal Power Upgraded!"); } }
function purchaseUpgradeEfficiency() { if (money >= efficiencyCost) { money -= efficiencyCost; efficiencyLevel++; efficiencyCost = Math.floor(efficiencyCost * 1.5); updateUpgradeStats(); showMessage("Milk Efficiency Upgraded!"); } }
function purchaseUpgradeSellValue() { if (money >= sellValueCost) { money -= sellValueCost; sellValueLevel++; sellValueCost = Math.floor(sellValueCost * 1.6); updateUpgradeStats(); showMessage("Milk Value Upgraded!"); } }

function purchaseUpgradeCollector() {
    if (money >= collectorCost) {
        money -= collectorCost;
        collectorLevel++;
        if (collectorLevel - 2 < collectorCosts.length) {
            collectorCost = collectorCosts[collectorLevel - 2];
        } else {
            collectorCost = Math.floor(collectorCost * 5);
        }
        updateUpgradeStats();
        showMessage("Bottle Collector Upgraded!");
    }
}

function purchaseItem(itemName, cost, effectCallback) { if (money >= cost && !player.inventory[itemName]) { money -= cost; player.inventory[itemName] = true; effectCallback(); updateShopUI(); showMessage(`${itemName.replace(/([A-Z])/g, ' $1').trim().replace('Ps7', 'Praystation 7').replace('Xbz', 'Xblox Series Z').replace('Gmc', 'Golden Milk Can')} Purchased!`); } }
function applyShopEffects() {
    currentMaxMilk = 100;
    moneyMultiplier = 1.0;
    if (player.inventory.xbz) { currentMaxMilk *= 1.5; }
    if (player.inventory.gmc) { moneyMultiplier *= 1.1; }
    currentMilk = Math.min(currentMilk, currentMaxMilk);
}


// --- Event Handlers ---
function handlePointerDown(e) {
    const touch = e.touches ? e.touches[0] : e;
    isPointerDown = true;
    if (!gameRunning) return;
    e.preventDefault();

    const targetElement = e.target;
    if (targetElement.closest('button') && targetElement.id !== 'bottle-button' && targetElement.id !== 'boost-button') {
        isPointerDown = false;
        return;
    }

    const clickX = touch.clientX;
    const clickY = touch.clientY;

    if (sellIcon.visible && !isAutoSelling) {
        const dist = Math.sqrt(Math.pow(clickX - sellIcon.x, 2) + Math.pow(clickY - sellIcon.y, 2));
        if (dist <= sellIcon.radius) {
            sellMilkAction();
            isPointerDown = false;
            return;
        }
    }

    if (!player.inAir && gameRunning) {
        targetPlayerY = touch.clientY;
        targetPlayerY = Math.max(roadTopYBoundary, Math.min(roadBottomYBoundary, targetPlayerY));
    }
}
function handlePointerUp(e) {
    isPointerDown = false;
    e.preventDefault();
}
function handlePointerMove(e) {
    const touch = e.touches ? e.touches[0] : e;
    if (!gameRunning || player.inAir || !isPointerDown) return;
    e.preventDefault();
    targetPlayerY = touch.clientY;
    targetPlayerY = Math.max(roadTopYBoundary, Math.min(roadBottomYBoundary, targetPlayerY));
}


// --- Main Game Loop ---
function update() {
    if (!gameRunning) return;
    const now = Date.now();

    if (isBoosting) {
        speed = currentBoostSpeed;
        if (now > boostEndTime) {
            isBoosting = false;
            currentBoostSpeed = 0;
            if (isFrenzyActive) {
                frenzyGracePeriodEnd = now + 2000;
            }
        }
    } else if (isAutoSelling) {
        autoSellTimer -= 1000 / 60;
        if (autoSellTimer <= 0) {
            isAutoSelling = false;
            showMessage("Auto-Sell Ended!");
        } else if (currentMilk >= currentMaxMilk && isNearHouse) {
            sellMilkAction(true);
        }
        if (isPointerDown) {
            speed = Math.min(speed + holdPower, MAX_SPEED);
        } else {
            speed = Math.max(speed * TAP_DECAY, 0);
        }
    } else if (isPointerDown) {
        speed = Math.min(speed + holdPower, MAX_SPEED);
    } else {
        speed = Math.max(speed * TAP_DECAY, 0);
    }

    if (currentMilk < currentMaxMilk) {
        const efficiencyMultiplier = Math.pow(1.2, efficiencyLevel - 1);
        const chargeRate = speed * MILK_CHARGE_SPEED_FACTOR * efficiencyMultiplier;
        const milkChargeThisFrame = chargeRate / 60;
        currentMilk += milkChargeThisFrame;
        if (currentMilk > currentMaxMilk) {
            currentMilk = currentMaxMilk;
        }
    }

    worldOffset += speed;
    distance += speed;

    updateGameTime();
    updatePhysics();
    updateParticles();
    generateHouses(); removeOldHouses();
    generateCollectibleBottles(); removeOldCollectibleBottles();
    generatePowerups(); removeOldPowerups();
    generateRamps(); removeOldRamps(); removeOldRareMilks();

    if (isFrenzyActive) {
        const frenzyDuration = (now - frenzyStartTime) / 1000;
        frenzyTimerDisplay.textContent = frenzyDuration.toFixed(1) + 's';

        if (!isBoosting && frenzyGracePeriodEnd > 0 && now > frenzyGracePeriodEnd) {
            isFrenzyActive = false;
            lastFrenzyDuration = (now - frenzyStartTime) / 1000;
            longestFrenzyDuration = Math.max(longestFrenzyDuration, lastFrenzyDuration);

            frenzyStartTime = 0;
            boostChainCount = 0;
            frenzyGracePeriodEnd = 0;
            // FIX: Removing `lastBoostTime = 0;` prevents a race condition
            // where a new chain's state could be overwritten by this cleanup logic.
            // lastBoostTime = 0; 

            frenzyDisplay.classList.add('hidden');
            document.body.classList.remove('frenzy-active-body');
            showMessage(`Milk Frenzy Ended! Time: ${lastFrenzyDuration.toFixed(1)}s`, 4000);
        }
    }

    checkCollisions();
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEnvironment();
    drawCollectibleBottles();
    drawHouses();
    drawRamps();
    drawRareMilks();
    drawPowerups();
    drawParticles();
    drawRope();
    drawTrailer();
    drawPlayer();
}

function gameLoop() {
    if (gameRunning) {
        update();
        updateUI();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
    resizeCanvas();
    initStars();
    targetPlayerY = player.y;
    applyShopEffects();
    updateShopUI();
    updateUpgradeStats();
    updateUI();
    setupEventListeners();
    gameLoop();
}

init();