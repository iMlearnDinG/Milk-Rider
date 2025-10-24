// --- DOM Elements ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const distanceDisplay = document.getElementById('distance-display');
const moneyDisplay = document.getElementById('money-display');
const longestFrenzyDisplay = document.getElementById('longest-frenzy-display');
const bottleButton = document.getElementById('bottle-button');
const boostButton = document.getElementById('boost-button');
const openShopButton = document.getElementById('open-shop-button');
const upgradeSpeedButton = document.getElementById('upgrade-speed-button');
const upgradeEfficiencyButton = document.getElementById('upgrade-efficiency-button');
const upgradeSellButton = document.getElementById('upgrade-sell-button');
const upgradeCollectorButton = document.getElementById('upgrade-collector-button');
const speedLevelDisplay = document.getElementById('speed-level-display');
const speedCostDisplay = document.getElementById('speed-cost-display');
const efficiencyLevelDisplay = document.getElementById('efficiency-level-display');
const efficiencyCostDisplay = document.getElementById('efficiency-cost-display');
const sellLevelDisplay = document.getElementById('sell-level-display');
const sellCostDisplay = document.getElementById('sell-cost-display');
const collectorLevelDisplay = document.getElementById('collector-level-display');
const collectorCostDisplay = document.getElementById('collector-cost-display');
const shopModal = document.getElementById('shop-modal');
const closeShopButton = document.getElementById('close-shop-button');
const buyPs7Button = document.getElementById('buy-ps7');
const buyXbzButton = document.getElementById('buy-xbz');
const buyGmcButton = document.getElementById('buy-gmc');
const inventoryList = document.getElementById('inventory-list');
const welcomeModal = document.getElementById('welcome-modal');
const startGameButton = document.getElementById('start-game-button');
const messageContainer = document.getElementById('message-container');
const frenzyDisplay = document.getElementById('frenzy-display');
const frenzyTimerDisplay = document.getElementById('frenzy-timer-display');


// --- UI Management ---
function showMessage(text, duration = 2000) {
    const messageCard = document.createElement('div');
    messageCard.className = 'message-card';
    messageCard.textContent = text;
    messageContainer.appendChild(messageCard);
    setTimeout(() => {
        messageCard.style.opacity = '1';
        messageCard.style.transform = 'translateY(0)';
    }, 50);
    setTimeout(() => {
        messageCard.style.opacity = '0';
        messageCard.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            messageCard.remove();
        }, 500);
    }, duration);
}

function updateUI() {
    distanceDisplay.textContent = Math.floor(distance / 100);
    moneyDisplay.textContent = Math.floor(money);
    longestFrenzyDisplay.textContent = longestFrenzyDuration.toFixed(1);

    const isFull = currentMilk >= currentMaxMilk;

    bottleButton.disabled = !isFull || isAutoSelling || player.inAir;

    if (isFull && !isBoosting && !isAutoSelling && !player.inAir && !hasShownFullMessage) {
        showMessage("Milk trailer full! Fill your boost or bottle it!");
        hasShownFullMessage = true;
    } else if (!isFull || player.inAir) {
        hasShownFullMessage = false;
    }

    const boostReady = bottledMilk >= bottlesForBoost;

    boostButton.disabled = !boostReady;

    if (boostReady && !isBoosting && !player.inAir && !hasShownBoostMessage) {
        showMessage("Boost is ready! Hit the boost!");
        hasShownBoostMessage = true;
    } else if (!boostReady || player.inAir) {
        hasShownBoostMessage = false;
    }

    bottleButton.classList.toggle('glow', isFull && !isAutoSelling && !player.inAir);
    boostButton.classList.toggle('glow', boostReady);

    // FIXED: Correctly set the button text without overwriting it.
    bottleButton.innerHTML = `Fill Boost<br>(${Math.floor((currentMilk / currentMaxMilk) * 100)}%)`;
    boostButton.innerHTML = `Boost<br>(${bottledMilk}/${bottlesForBoost})`;

    const targetButtonY = player.y - 80;
    const targetBottleX = player.x - 50;
    const targetBoostX = player.x + 50;

    bottleButtonPos.x = lerp(bottleButtonPos.x, targetBottleX, BUTTON_LERP_FACTOR);
    bottleButtonPos.y = lerp(bottleButtonPos.y, targetButtonY, BUTTON_LERP_FACTOR);
    boostButtonPos.x = lerp(boostButtonPos.x, targetBoostX, BUTTON_LERP_FACTOR);
    boostButtonPos.y = lerp(boostButtonPos.y, targetButtonY, BUTTON_LERP_FACTOR);

    bottleButton.style.left = `${bottleButtonPos.x}px`;
    bottleButton.style.top = `${bottleButtonPos.y}px`;
    bottleButton.style.transform = `translate(-50%, -50%)`;

    boostButton.style.left = `${boostButtonPos.x}px`;
    boostButton.style.top = `${boostButtonPos.y}px`;
    boostButton.style.transform = `translate(-50%, -50%)`;

    speedLevelDisplay.textContent = speedLevel;
    speedCostDisplay.textContent = speedCost;
    efficiencyLevelDisplay.textContent = efficiencyLevel;
    efficiencyCostDisplay.textContent = efficiencyCost;
    sellLevelDisplay.textContent = sellValueLevel;
    sellCostDisplay.textContent = sellValueCost;
    collectorLevelDisplay.textContent = collectorLevel;
    collectorCostDisplay.textContent = collectorCost;

    upgradeSpeedButton.disabled = money < speedCost;
    upgradeEfficiencyButton.disabled = money < efficiencyCost;
    upgradeSellButton.disabled = money < sellValueCost;
    upgradeCollectorButton.disabled = money < collectorCost;

    buyPs7Button.disabled = money < 50000 || player.inventory.ps7;
    buyXbzButton.disabled = money < 75000 || player.inventory.xbz;
    buyGmcButton.disabled = money < 250000 || player.inventory.gmc;
}


function toggleShop() {
    shopModal.classList.toggle('hidden');
    gameRunning = shopModal.classList.contains('hidden') && welcomeModal.classList.contains('hidden');
}

function closeShop() {
    shopModal.classList.add('hidden');
    gameRunning = welcomeModal.classList.contains('hidden');
}

function updateShopUI() {
    inventoryList.innerHTML = '';
    const ownedItems = Object.keys(player.inventory).filter(key => player.inventory[key]);
    if (ownedItems.length === 0) {
        inventoryList.innerHTML = '<li>No items yet!</li>';
    } else {
        ownedItems.forEach(itemName => {
            const li = document.createElement('li');
            li.textContent = itemName.replace(/([A-Z])/g, ' $1').replace('ps7', 'Praystation 7').replace('xbz', 'Xblox Series Z').replace('gmc', 'Golden Milk Can');
            inventoryList.appendChild(li);
        });
    }
    buyPs7Button.disabled = money < 50000 || player.inventory.ps7;
    buyXbzButton.disabled = money < 75000 || player.inventory.xbz;
    buyGmcButton.disabled = money < 250000 || player.inventory.gmc;
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp, { passive: false });
    canvas.addEventListener('touchcancel', handlePointerUp, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);
    canvas.addEventListener('mousemove', handlePointerMove);

    bottleButton.addEventListener('click', (e) => { e.stopPropagation(); bottleMilkAction(); });
    boostButton.addEventListener('click', (e) => { e.stopPropagation(); useBoostAction(); });
    openShopButton.addEventListener('click', (e) => { e.stopPropagation(); toggleShop(); });
    closeShopButton.addEventListener('click', closeShop);

    // Listeners for on-screen upgrade buttons
    upgradeSpeedButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeSpeed(); });
    upgradeEfficiencyButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeEfficiency(); });
    upgradeSellButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeSellValue(); });
    upgradeCollectorButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeCollector(); });

    // Shop listeners
    buyPs7Button.addEventListener('click', () => purchaseItem('ps7', 50000, applyShopEffects));
    buyXbzButton.addEventListener('click', () => purchaseItem('xbz', 75000, applyShopEffects));
    buyGmcButton.addEventListener('click', () => purchaseItem('gmc', 250000, applyShopEffects));

    startGameButton.addEventListener('click', () => {
        welcomeModal.classList.add('hidden');
        gameRunning = true;
    });
}