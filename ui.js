// --- DOM Elements ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const distanceDisplay = document.getElementById('distance-display');
const moneyDisplay = document.getElementById('money-display');
const longestFrenzyDisplay = document.getElementById('longest-frenzy-display');
const bottleButton = document.getElementById('bottle-button');
const boostButton = document.getElementById('boost-button');
const sellButton = document.getElementById('sell-button');
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
const upgradeFillButton = document.getElementById('upgrade-fill-button');
const boostFillLevelDisplay = document.getElementById('boost-fill-level-display');
const boostFillCostDisplay = document.getElementById('boost-fill-cost-display');
const shopItemsContainer = document.getElementById('shop-items-container');
const inventoryList = document.getElementById('inventory-list');
const welcomeModal = document.getElementById('welcome-modal');
// MODIFIED: Renamed button and added new intro screen elements
const closeWelcomeButton = document.getElementById('close-welcome-button');
const playButton = document.getElementById('play-button');
const instructionsButton = document.getElementById('instructions-button');
const messageContainer = document.getElementById('message-container');
const frenzyDisplay = document.getElementById('frenzy-display');
const frenzyTimerDisplay = document.getElementById('frenzy-timer-display');
const gmcRevealModal = document.getElementById('gmc-reveal-modal');
const closeGmcModalButton = document.getElementById('close-gmc-modal-button');
const gmcCard = document.getElementById('gmc-card');
const gmcCardName = document.getElementById('gmc-card-name');
const gmcCardPurity = document.getElementById('gmc-card-purity');


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

function showGmcRevealModal(gmcData) {
    const { purity, isPure } = gmcData;
    gmcCardName.textContent = isPure ? "The Pure Gold Milk Can" : "Golden Milk Can";
    gmcCardPurity.textContent = `${purity.toFixed(2)}%`;
    gmcCard.classList.toggle('pure-gold', isPure);
    gmcRevealModal.classList.remove('hidden');
    gameRunning = false;
}

function updateUI() {
    distanceDisplay.textContent = Math.floor(distance / 100);
    moneyDisplay.textContent = Math.floor(money);
    longestFrenzyDisplay.textContent = longestFrenzyDuration.toFixed(1);

    const isFull = currentMilk >= currentMaxMilk;
    const boostReady = bottledMilk >= bottlesForBoost;
    const canSell = isFull && !isBoosting && !isAutoSelling && isNearHouse;

    boostFillLevelDisplay.textContent = boostFillLevel;
    boostFillCostDisplay.textContent = boostFillCost;
    upgradeFillButton.disabled = money < boostFillCost;

    bottleButton.disabled = !isFull;
    bottleButton.classList.toggle('glow-orange', isFull);

    if (isFull && !isAutoSelling && !hasShownFullMessage) {
        showMessage("Milk trailer full! Fill your boost or bottle it!");
        hasShownFullMessage = true;
    } else if (!isFull) {
        hasShownFullMessage = false;
    }

    boostButton.disabled = !boostReady;
    boostButton.classList.toggle('glow-red', boostReady);
    if (boostReady && !isBoosting && !hasShownBoostMessage) {
        showMessage("Boost is ready! Hit the boost!");
        hasShownBoostMessage = true;
    } else if (!boostReady) {
        hasShownBoostMessage = false;
    }

    sellButton.disabled = !canSell;
    sellButton.classList.toggle('glow-green', canSell);

    bottleButton.innerHTML = `Fill Boost<br>(${Math.floor((currentMilk / currentMaxMilk) * 100)}%)`;
    boostButton.innerHTML = `Boost<br>(${bottledMilk}/${bottlesForBoost})`;
    sellButton.innerHTML = `$<br>Sell`;

    const targetSellY = player.y - 120;
    const targetLowerY = player.y - 60;
    const targetBottleX = player.x - 50;
    const targetSellX = player.x;
    const targetBoostX = player.x + 50;
    bottleButtonPos.x = lerp(bottleButtonPos.x, targetBottleX, BUTTON_LERP_FACTOR);
    bottleButtonPos.y = lerp(bottleButtonPos.y, targetLowerY, BUTTON_LERP_FACTOR);
    boostButtonPos.x = lerp(boostButtonPos.x, targetBoostX, BUTTON_LERP_FACTOR);
    boostButtonPos.y = lerp(boostButtonPos.y, targetLowerY, BUTTON_LERP_FACTOR);
    sellButtonPos.x = lerp(sellButtonPos.x, targetSellX, BUTTON_LERP_FACTOR);
    sellButtonPos.y = lerp(sellButtonPos.y, targetSellY, BUTTON_LERP_FACTOR);
    bottleButton.style.left = `${bottleButtonPos.x}px`;
    bottleButton.style.top = `${bottleButtonPos.y}px`;
    bottleButton.style.transform = `translate(-50%, -50%)`;
    boostButton.style.left = `${boostButtonPos.x}px`;
    boostButton.style.top = `${boostButtonPos.y}px`;
    boostButton.style.transform = `translate(-50%, -50%)`;
    sellButton.style.left = `${sellButtonPos.x}px`;
    sellButton.style.top = `${sellButtonPos.y}px`;
    sellButton.style.transform = `translate(-50%, -50%)`;

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
}

function toggleShop() {
    const isHidden = shopModal.classList.toggle('hidden');
    if (!isHidden) {
        updateShopUI();
    }
    gameRunning = isHidden && welcomeModal.classList.contains('hidden') && gmcRevealModal.classList.contains('hidden');
}

function closeShop() {
    shopModal.classList.add('hidden');
    gameRunning = welcomeModal.classList.contains('hidden') && gmcRevealModal.classList.contains('hidden');
}

const itemDetails = {
    ps7: {
        name: 'Praystation 7',
        cost: 50000,
        description: 'Bonus: Cosmetic item.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6"><path d="M2 5a3 3 0 013-3h10a3 3 0 013 3v1.854a2.5 2.5 0 00-1.242.986l-.16.208a2.5 2.5 0 00-.497 2.112l.16.48a2.5 2.5 0 002.433 1.839V15a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm3-1a1 1 0 00-1 1v.048a2.5 2.5 0 001.373 2.15l.161.08a2.5 2.5 0 001.82-.19l.182-.09a2.5 2.5 0 001.373-2.15V5a1 1 0 00-1-1H5zm6 0a1 1 0 00-1 1v.048a2.5 2.5 0 001.373 2.15l.161.08a2.5 2.5 0 001.82-.19l.182-.09a2.5 2.5 0 001.373-2.15V5a1 1 0 00-1-1h-4z" /></svg>`,
        iconBg: 'bg-blue-500/20 text-blue-300'
    },
    xbz: {
        name: 'Xblox Series Z',
        cost: 75000,
        description: 'Increases Milk Trailer Capacity by 50%.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6"><path d="M5.5 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM12.5 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path fill-rule="evenodd" d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm4.5 1.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3zm3 0a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3zm3 0a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z" clip-rule="evenodd" /></svg>`,
        iconBg: 'bg-green-500/20 text-green-300'
    },
    gmc: {
        name: 'Golden Milk Can',
        cost: 150000,
        description: 'Increases money earned. Stacks up to 5 times for better rolls.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M11.614 3.633a.75.75 0 01.636 1.286l-4.25 2.125a.75.75 0 01-.636-1.286l4.25-2.125zM8.563 6.81a.75.75 0 00-1.286-.636L5.152 10.4a.75.75 0 001.286.636l2.125-4.225zM12.848 7.44a.75.75 0 00-1.286-.636l-2.125 4.225a.75.75 0 001.286.636l2.125-4.225z" clip-rule="evenodd" /><path d="M16 10a6 6 0 11-12 0 6 6 0 0112 0zM4.75 10a5.25 5.25 0 1010.5 0 5.25 5.25 0 00-10.5 0z" /></svg>`,
        iconBg: 'bg-yellow-500/20 text-yellow-300'
    }
};

function updateShopUI() {
    shopItemsContainer.innerHTML = '';
    inventoryList.innerHTML = '';
    for (const id in itemDetails) {
        const item = itemDetails[id];
        const isOwned = id !== 'gmc' && player.inventory[id];
        const gmcLevel = (player.inventory.gmc && player.inventory.gmc.level) || 0;
        const isGmcMaxed = id === 'gmc' && gmcLevel >= 5;
        const disabled = money < item.cost || isOwned || isGmcMaxed;
        let buttonText;
        if (id === 'gmc') {
            buttonText = isGmcMaxed ? 'MAX' : `$${item.cost}`;
        } else {
            buttonText = isOwned ? 'OWNED' : `$${item.cost}`;
        }
        const shopItemHTML = `
            <div class="shop-item flex items-center gap-4 rounded-lg bg-gray-100 p-3">
                <div class="shop-item-icon ${item.iconBg}">${item.icon}</div>
                <div class="flex-grow">
                    <h4 class="font-semibold text-lg">${item.name} ${id === 'gmc' ? `<span class="text-sm font-normal">(${gmcLevel}/5)</span>` : ''}</h4>
                    <p class="text-sm text-gray-600">${item.description}</p>
                </div>
                <button onclick="purchaseItem('${id}', ${item.cost})" class="rounded-lg bg-green-500 px-3 py-1.5 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400" ${disabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
        shopItemsContainer.innerHTML += shopItemHTML;
    }
    const ownedItems = Object.keys(player.inventory);
    if (ownedItems.length === 0) {
        inventoryList.innerHTML = '<p class="text-center text-gray-500">No items yet!</p>';
        return;
    }
    ownedItems.forEach(id => {
        const item = itemDetails[id];
        if (!item) return;
        let detailsHTML = `<span class="font-semibold">${item.name}</span>`;
        if (id === 'gmc') {
            const totalBonus = player.inventory.gmc.rolls.reduce((sum, roll) => sum + roll.purity, 0);
            detailsHTML = `<span class="font-semibold">${item.name} (x${player.inventory.gmc.level})</span> - <span class="text-green-600 font-bold">+${totalBonus.toFixed(2)}% Total Bonus</span>`;
        }
        const inventoryItemHTML = `
            <div class="inventory-item flex items-center gap-3 rounded-md bg-gray-100 p-2">
                <div class="inventory-item-icon ${item.iconBg}">${item.icon}</div>
                <div class="text-sm">${detailsHTML}</div>
            </div>
        `;
        inventoryList.innerHTML += inventoryItemHTML;
    });
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
    sellButton.addEventListener('click', (e) => { e.stopPropagation(); sellMilkAction(); });
    openShopButton.addEventListener('click', (e) => { e.stopPropagation(); toggleShop(); });
    closeShopButton.addEventListener('click', closeShop);
    upgradeSpeedButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeSpeed(); });
    upgradeEfficiencyButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeEfficiency(); });
    upgradeSellButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeSellValue(); });
    upgradeCollectorButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeCollector(); });
    upgradeFillButton.addEventListener('click', (e) => { e.stopPropagation(); purchaseUpgradeBoostFill(); });

    // --- NEW: Event listeners for intro and welcome screens ---
    playButton.addEventListener('click', () => {
        document.body.classList.add('game-active');
        gameRunning = true;
    });

    instructionsButton.addEventListener('click', () => {
        welcomeModal.classList.remove('hidden');
    });

    closeWelcomeButton.addEventListener('click', () => {
        welcomeModal.classList.add('hidden');
    });

    closeGmcModalButton.addEventListener('click', () => {
        gmcRevealModal.classList.add('hidden');
        // Resume game only if the shop is also hidden.
        gameRunning = shopModal.classList.contains('hidden');
    });
}
