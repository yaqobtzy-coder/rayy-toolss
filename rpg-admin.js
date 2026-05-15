// ========== RPG ADMIN PANEL - FIREBASE VERSION (FIXED) ==========

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

// Initialize Firebase
let database = null;

try {
    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    database = firebase.database();
    console.log('✅ Firebase connected');
} catch (error) {
    console.error('Firebase init error:', error);
}

// Admin password
const ADMIN_PASSWORD = "admin123";

// Global data
let allPlayers = {};
let allItems = {};
let allMonsters = {};
let allLocations = {};

// ========== ADMIN LOGIN ==========
function adminLogin() {
    console.log('Admin login function called');
    
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    const password = passwordInput.value;
    console.log('Password entered:', password);
    
    if (password === ADMIN_PASSWORD) {
        const loginScreen = document.getElementById('adminLoginScreen');
        const adminPanel = document.getElementById('adminPanel');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        
        loadAllData();
        showToast('Login berhasil! Selamat datang Admin.', 'success');
    } else {
        showToast('Kode admin salah!', 'error');
    }
}

function logoutAdmin() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (adminPanel) adminPanel.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
    
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) passwordInput.value = '';
    
    showToast('Logout berhasil', 'success');
}

// ========== LOAD ALL DATA FROM FIREBASE ==========
async function loadAllData() {
    showLoading('playersLoading', true);
    showToast('Memuat data dari Firebase...', 'info');
    
    try {
        // Load Players
        const playersSnapshot = await database.ref('rpg_players').once('value');
        allPlayers = playersSnapshot.val() || {};
        
        // Load Items (dari path rpg_items)
        const itemsSnapshot = await database.ref('rpg_items').once('value');
        allItems = itemsSnapshot.val() || {};
        
        // Load Monsters (dari path rpg_monsters)
        const monstersSnapshot = await database.ref('rpg_monsters').once('value');
        allMonsters = monstersSnapshot.val() || getDefaultMonsters();
        
        // Load Locations (dari path rpg_locations)
        const locationsSnapshot = await database.ref('rpg_locations').once('value');
        allLocations = locationsSnapshot.val() || getDefaultLocations();
        
        // Render semua
        renderStatsSummary();
        renderPlayers();
        renderItems();
        renderMonsters();
        renderLocations();
        renderGlobalStats();
        
        showToast(`Data berhasil dimuat! ${Object.keys(allPlayers).length} players, ${Object.keys(allItems).length} items, ${Object.keys(allMonsters).length} monsters`, 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Gagal memuat data: ' + error.message, 'error');
    }
    
    showLoading('playersLoading', false);
}

function getDefaultMonsters() {
    return {
        "1": { name: "Goblin", hp: 30, attack: 5, defense: 2, exp: 15, gold: 10, level: 1 },
        "2": { name: "Orc", hp: 50, attack: 8, defense: 4, exp: 25, gold: 20, level: 3 },
        "3": { name: "Naga", hp: 100, attack: 15, defense: 8, exp: 60, gold: 50, level: 10 }
    };
}

function getDefaultLocations() {
    return {
        "desa": { name: "Desa Pemula", monsters: [1], minLevel: 1, maxLevel: 5, desc: "Desa kecil yang tenang, tempat awal petualanganmu." },
        "hutan": { name: "Hutan Gelap", monsters: [1, 2], minLevel: 3, maxLevel: 8, desc: "Hutan lebat dengan pepohonan tinggi." },
        "gua": { name: "Gua Naga", monsters: [2, 3], minLevel: 8, maxLevel: 15, desc: "Gua gelap sarang makhluk legendaris." },
        "tambang": { name: "Tambang Terbengkalai", minLevel: 5, maxLevel: 20, desc: "Tambang tua menyimpan mineral berharga." }
    };
}

// ========== RENDER FUNCTIONS ==========
function renderStatsSummary() {
    const container = document.getElementById('statsSummary');
    if (!container) return;
    
    const totalPlayers = Object.keys(allPlayers).length;
    const totalGold = Object.values(allPlayers).reduce((sum, p) => sum + (p.gold || 0), 0);
    const avgLevel = totalPlayers > 0 ? 
        Math.round(Object.values(allPlayers).reduce((sum, p) => sum + (p.level || 1), 0) / totalPlayers) : 0;
    
    container.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <div class="stat-value">${totalPlayers}</div>
            <div class="stat-label">Total Players</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-coins"></i>
            <div class="stat-value">${formatGold(totalGold)}</div>
            <div class="stat-label">Total Gold</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-chart-line"></i>
            <div class="stat-value">${avgLevel}</div>
            <div class="stat-label">Rata-rata Level</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-trophy"></i>
            <div class="stat-value">${Object.keys(allMonsters).length}</div>
            <div class="stat-label">Total Monster</div>
        </div>
    `;
}

function renderPlayers() {
    const container = document.getElementById('playersGrid');
    if (!container) return;
    
    const players = Object.entries(allPlayers);
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users fa-3x"></i><p>Belum ada player. Tambahkan player baru!</p></div>';
        return;
    }
    
    container.innerHTML = players.map(([id, player]) => `
        <div class="player-card" data-id="${id}">
            <div class="player-header">
                <div>
                    <div class="player-name">${escapeHtml(player.username || id.slice(0, 15))}</div>
                    <div class="player-number" style="font-size: 0.6rem; opacity: 0.6;">${escapeHtml(id)}</div>
                </div>
                <div class="player-level-badge" style="background: var(--primary); color: #1a1a2e; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold;">Lv ${player.level || 1}</div>
            </div>
            <div class="player-stats">
                <div class="stat-item"><span>❤️ HP</span><span>${player.hp || 0}/${player.maxHp || 100}</span></div>
                <div class="stat-item"><span>🔵 MP</span><span>${player.mp || 0}/${player.maxMp || 30}</span></div>
                <div class="stat-item"><span>⚔️ Attack</span><span>${player.attack || 15}</span></div>
                <div class="stat-item"><span>🛡️ Defense</span><span>${player.defense || 10}</span></div>
                <div class="stat-item"><span>🌀 Agility</span><span>${player.agility || 5}</span></div>
                <div class="stat-item"><span>⭐ EXP</span><span>${player.exp || 0}/${player.expToNext || 100}</span></div>
                <div class="stat-item"><span>💰 Gold</span><span>${formatGold(player.gold || 0)}</span></div>
                <div class="stat-item"><span>🎭 Class</span><span>${player.class || 'warrior'}</span></div>
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="openEditPlayerModal('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="give-gold-btn" onclick="giveGoldToPlayer('${id}')"><i class="fas fa-coins"></i> Tambah Gold</button>
                <button class="delete-btn" onclick="deletePlayerFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderItems() {
    const container = document.getElementById('itemsGrid');
    if (!container) return;
    
    const items = Object.entries(allItems);
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box fa-3x"></i><p>Belum ada item. Tambahkan item baru!</p></div>';
        return;
    }
    
    container.innerHTML = items.map(([id, item]) => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-id" style="font-size: 0.6rem; opacity: 0.5;">${id}</div>
                </div>
                <div class="item-price" style="color: var(--success);">💰 ${item.price}</div>
            </div>
            <div class="item-details">
                <span><i class="fas fa-tag"></i> ${item.type}</span>
                ${item.type === 'weapon' ? `<span>⚔️ Attack +${item.attack}</span>` : ''}
                ${item.type === 'armor' ? `<span>🛡️ Defense +${item.defense}</span>` : ''}
                ${(item.type === 'heal' || item.type === 'mana') ? `<span>💪 +${item.value}</span>` : ''}
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="editItem('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteItemFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderMonsters() {
    const container = document.getElementById('monstersGrid');
    if (!container) return;
    
    const monsters = Object.entries(allMonsters);
    
    if (monsters.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-dragon fa-3x"></i><p>Belum ada monster. Tambahkan monster baru!</p></div>';
        return;
    }
    
    container.innerHTML = monsters.map(([id, monster]) => `
        <div class="monster-card">
            <div class="monster-header">
                <div>
                    <div class="monster-name">${escapeHtml(monster.name)}</div>
                </div>
                <div class="monster-level" style="background: rgba(255, 215, 0, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;">Lv ${monster.level || 1}</div>
            </div>
            <div class="monster-details">
                <span>❤️ HP: ${monster.hp}</span>
                <span>⚔️ ATK: ${monster.attack}</span>
                <span>🛡️ DEF: ${monster.defense}</span>
                <span>⭐ EXP: ${monster.exp}</span>
                <span>💰 Gold: ${monster.gold}</span>
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="editMonster('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteMonsterFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function renderLocations() {
    const container = document.getElementById('locationsGrid');
    if (!container) return;
    
    container.innerHTML = Object.entries(allLocations).map(([id, loc]) => `
        <div class="location-card">
            <div class="location-name">${escapeHtml(loc.name)}</div>
            <div class="location-desc">${escapeHtml(loc.desc || '')}</div>
            <div class="location-level" style="margin-top: 8px;">Level ${loc.minLevel || 1} - ${loc.maxLevel || 99}</div>
        </div>
    `).join('');
}

function renderGlobalStats() {
    const container = document.getElementById('globalStats');
    if (!container) return;
    
    const totalPlayers = Object.keys(allPlayers).length;
    const totalGold = Object.values(allPlayers).reduce((sum, p) => sum + (p.gold || 0), 0);
    const totalMonsters = Object.keys(allMonsters).length;
    const totalItems = Object.keys(allItems).length;
    const highestLevel = Math.max(...Object.values(allPlayers).map(p => p.level || 1), 0);
    const richestPlayer = Object.entries(allPlayers).sort((a,b) => (b[1].gold || 0) - (a[1].gold || 0))[0];
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div class="stat-card"><div class="stat-value">${totalPlayers}</div><div class="stat-label">Total Player</div></div>
            <div class="stat-card"><div class="stat-value">${formatGold(totalGold)}</div><div class="stat-label">Total Gold</div></div>
            <div class="stat-card"><div class="stat-value">${totalMonsters}</div><div class="stat-label">Total Monster</div></div>
            <div class="stat-card"><div class="stat-value">${totalItems}</div><div class="stat-label">Total Item</div></div>
            <div class="stat-card"><div class="stat-value">${highestLevel}</div><div class="stat-label">Level Tertinggi</div></div>
            ${richestPlayer ? `<div class="stat-card"><div class="stat-value" style="font-size: 0.7rem;">${richestPlayer[1].username || richestPlayer[0].slice(0, 10)}</div><div class="stat-label">Player Terkaya</div></div>` : ''}
        </div>
    `;
}

// ========== PLAYER MANAGEMENT ==========
function openEditPlayerModal(playerId) {
    const player = allPlayers[playerId];
    if (!player) return;
    
    document.getElementById('editPlayerId').value = playerId;
    document.getElementById('editPlayerUsername').value = player.username || '';
    document.getElementById('editPlayerGold').value = player.gold || 0;
    document.getElementById('editPlayerLevel').value = player.level || 1;
    document.getElementById('editPlayerExp').value = player.exp || 0;
    document.getElementById('editPlayerHp').value = player.hp || player.maxHp || 100;
    document.getElementById('editPlayerMaxHp').value = player.maxHp || 100;
    document.getElementById('editPlayerMp').value = player.mp || player.maxMp || 30;
    document.getElementById('editPlayerMaxMp').value = player.maxMp || 30;
    document.getElementById('editPlayerAttack').value = player.attack || 15;
    document.getElementById('editPlayerDefense').value = player.defense || 10;
    document.getElementById('editPlayerAgility').value = player.agility || 5;
    document.getElementById('editPlayerClass').value = player.class || 'warrior';
    document.getElementById('editPlayerLocation').value = player.location || 'desa';
    
    document.getElementById('editPlayerModal').style.display = 'flex';
}

function closeEditPlayerModal() {
    document.getElementById('editPlayerModal').style.display = 'none';
}

async function savePlayerToFirebase() {
    const playerId = document.getElementById('editPlayerId').value;
    const level = parseInt(document.getElementById('editPlayerLevel').value) || 1;
    
    const updatedPlayer = {
        username: document.getElementById('editPlayerUsername').value,
        gold: parseInt(document.getElementById('editPlayerGold').value) || 0,
        level: level,
        exp: parseInt(document.getElementById('editPlayerExp').value) || 0,
        hp: parseInt(document.getElementById('editPlayerHp').value) || 100,
        maxHp: parseInt(document.getElementById('editPlayerMaxHp').value) || 100,
        mp: parseInt(document.getElementById('editPlayerMp').value) || 30,
        maxMp: parseInt(document.getElementById('editPlayerMaxMp').value) || 30,
        attack: parseInt(document.getElementById('editPlayerAttack').value) || 15,
        defense: parseInt(document.getElementById('editPlayerDefense').value) || 10,
        agility: parseInt(document.getElementById('editPlayerAgility').value) || 5,
        class: document.getElementById('editPlayerClass').value,
        location: document.getElementById('editPlayerLocation').value,
        expToNext: Math.floor(100 * Math.pow(1.5, level - 1))
    };
    
    try {
        await database.ref(`rpg_players/${playerId}`).update(updatedPlayer);
        allPlayers[playerId] = { ...allPlayers[playerId], ...updatedPlayer };
        renderPlayers();
        renderStatsSummary();
        renderGlobalStats();
        closeEditPlayerModal();
        showToast('Player berhasil diupdate!', 'success');
    } catch (error) {
        showToast('Gagal update: ' + error.message, 'error');
    }
}

async function giveGoldToPlayer(playerId) {
    const amount = prompt('Masukkan jumlah gold yang ingin ditambahkan:', '1000');
    if (amount && !isNaN(parseInt(amount))) {
        const goldAmount = parseInt(amount);
        const currentGold = allPlayers[playerId]?.gold || 0;
        try {
            await database.ref(`rpg_players/${playerId}/gold`).set(currentGold + goldAmount);
            allPlayers[playerId].gold = currentGold + goldAmount;
            renderPlayers();
            renderStatsSummary();
            renderGlobalStats();
            showToast(`Berhasil menambahkan ${formatGold(goldAmount)}!`, 'success');
        } catch (error) {
            showToast('Gagal menambah gold: ' + error.message, 'error');
        }
    }
}

async function deletePlayerFromFirebase(playerId) {
    if (confirm(`Hapus player ${playerId}? Data tidak bisa dikembalikan!`)) {
        try {
            await database.ref(`rpg_players/${playerId}`).remove();
            delete allPlayers[playerId];
            renderPlayers();
            renderStatsSummary();
            renderGlobalStats();
            showToast('Player berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal hapus: ' + error.message, 'error');
        }
    }
}

function showAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'flex';
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

async function addPlayerToFirebase() {
    const playerId = document.getElementById('newPlayerId').value.trim();
    const username = document.getElementById('newPlayerUsername').value.trim();
    const playerClass = document.getElementById('newPlayerClass').value;
    const gold = parseInt(document.getElementById('newPlayerGold').value) || 50;
    
    if (!playerId) {
        showToast('Masukkan User ID!', 'error');
        return;
    }
    
    if (allPlayers[playerId]) {
        showToast('Player sudah ada!', 'error');
        return;
    }
    
    const classStats = {
        warrior: { hp: 100, mp: 30, attack: 15, defense: 10, agility: 5 },
        mage: { hp: 60, mp: 100, attack: 20, defense: 5, agility: 8 },
        archer: { hp: 80, mp: 50, attack: 12, defense: 7, agility: 15 }
    };
    
    const stats = classStats[playerClass];
    
    const newPlayer = {
        username: username || playerId,
        class: playerClass,
        level: 1,
        exp: 0,
        expToNext: 100,
        maxHp: stats.hp,
        hp: stats.hp,
        maxMp: stats.mp,
        mp: stats.mp,
        attack: stats.attack,
        defense: stats.defense,
        agility: stats.agility,
        gold: gold,
        inventory: { "potion": 3 },
        equipment: { weapon: null, armor: null },
        location: "desa",
        pvpWins: 0,
        pvpLosses: 0,
        createdAt: Date.now()
    };
    
    try {
        await database.ref(`rpg_players/${playerId}`).set(newPlayer);
        allPlayers[playerId] = newPlayer;
        renderPlayers();
        renderStatsSummary();
        renderGlobalStats();
        closeAddPlayerModal();
        showToast('Player baru berhasil ditambahkan!', 'success');
        
        // Reset form
        document.getElementById('newPlayerId').value = '';
        document.getElementById('newPlayerUsername').value = '';
        document.getElementById('newPlayerGold').value = '50';
    } catch (error) {
        showToast('Gagal tambah player: ' + error.message, 'error');
    }
}

// ========== ITEM MANAGEMENT ==========
function showAddItemModal() {
    document.getElementById('addItemModal').style.display = 'flex';
}

function closeAddItemModal() {
    document.getElementById('addItemModal').style.display = 'none';
}

async function addItemToFirebase() {
    const id = document.getElementById('newItemId').value.trim().toLowerCase().replace(/ /g, '_');
    const name = document.getElementById('newItemName').value.trim();
    const type = document.getElementById('newItemType').value;
    const value = parseInt(document.getElementById('newItemValue').value) || 0;
    const price = parseInt(document.getElementById('newItemPrice').value) || 0;
    
    if (!id || !name) {
        showToast('ID dan Nama item harus diisi!', 'error');
        return;
    }
    
    const newItem = { name, type, price };
    if (type === 'weapon') newItem.attack = value;
    else if (type === 'armor') newItem.defense = value;
    else newItem.value = value;
    
    try {
        await database.ref(`rpg_items/${id}`).set(newItem);
        allItems[id] = newItem;
        renderItems();
        closeAddItemModal();
        showToast('Item berhasil ditambahkan!', 'success');
        
        // Reset form
        document.getElementById('newItemId').value = '';
        document.getElementById('newItemName').value = '';
        document.getElementById('newItemValue').value = '';
        document.getElementById('newItemPrice').value = '';
    } catch (error) {
        showToast('Gagal tambah item: ' + error.message, 'error');
    }
}

async function editItem(id) {
    const newName = prompt('Edit nama item:', allItems[id]?.name);
    if (newName) {
        try {
            await database.ref(`rpg_items/${id}/name`).set(newName);
            allItems[id].name = newName;
            renderItems();
            showToast('Item berhasil diupdate!', 'success');
        } catch (error) {
            showToast('Gagal update: ' + error.message, 'error');
        }
    }
}

async function deleteItemFromFirebase(id) {
    if (confirm(`Hapus item "${allItems[id]?.name}"?`)) {
        try {
            await database.ref(`rpg_items/${id}`).remove();
            delete allItems[id];
            renderItems();
            showToast('Item berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal hapus: ' + error.message, 'error');
        }
    }
}

// ========== MONSTER MANAGEMENT ==========
function showAddMonsterModal() {
    document.getElementById('addMonsterModal').style.display = 'flex';
}

function closeAddMonsterModal() {
    document.getElementById('addMonsterModal').style.display = 'none';
}

async function addMonsterToFirebase() {
    const id = document.getElementById('newMonsterId').value;
    const name = document.getElementById('newMonsterName').value.trim();
    const hp = parseInt(document.getElementById('newMonsterHp').value) || 30;
    const attack = parseInt(document.getElementById('newMonsterAttack').value) || 5;
    const defense = parseInt(document.getElementById('newMonsterDefense').value) || 2;
    const exp = parseInt(document.getElementById('newMonsterExp').value) || 15;
    const gold = parseInt(document.getElementById('newMonsterGold').value) || 10;
    const level = parseInt(document.getElementById('newMonsterLevel').value) || 1;
    
    if (!id || !name) {
        showToast('ID dan Nama monster harus diisi!', 'error');
        return;
    }
    
    const newMonster = { name, hp, attack, defense, exp, gold, level };
    
    try {
        await database.ref(`rpg_monsters/${id}`).set(newMonster);
        allMonsters[id] = newMonster;
        renderMonsters();
        closeAddMonsterModal();
        showToast('Monster berhasil ditambahkan!', 'success');
        
        // Reset form
        document.getElementById('newMonsterId').value = '';
        document.getElementById('newMonsterName').value = '';
        document.getElementById('newMonsterHp').value = '';
        document.getElementById('newMonsterAttack').value = '';
        document.getElementById('newMonsterDefense').value = '';
        document.getElementById('newMonsterExp').value = '';
        document.getElementById('newMonsterGold').value = '';
        document.getElementById('newMonsterLevel').value = '';
    } catch (error) {
        showToast('Gagal tambah monster: ' + error.message, 'error');
    }
}

async function editMonster(id) {
    const newName = prompt('Edit nama monster:', allMonsters[id]?.name);
    if (newName) {
        try {
            await database.ref(`rpg_monsters/${id}/name`).set(newName);
            allMonsters[id].name = newName;
            renderMonsters();
            showToast('Monster berhasil diupdate!', 'success');
        } catch (error) {
            showToast('Gagal update: ' + error.message, 'error');
        }
    }
}

async function deleteMonsterFromFirebase(id) {
    if (confirm(`Hapus monster "${allMonsters[id]?.name}"?`)) {
        try {
            await database.ref(`rpg_monsters/${id}`).remove();
            delete allMonsters[id];
            renderMonsters();
            showToast('Monster berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal hapus: ' + error.message, 'error');
        }
    }
}

// ========== SYNC FUNCTIONS ==========
async function syncToFirebase() {
    showToast('Data sudah tersinkron dengan Firebase!', 'success');
}

async function syncItemsToFirebase() {
    showToast('Data items sudah tersinkron!', 'success');
}

async function syncMonstersToFirebase() {
    showToast('Data monsters sudah tersinkron!', 'success');
}

async function syncLocationsToFirebase() {
    try {
        await database.ref('rpg_locations').set(allLocations);
        showToast('Lokasi berhasil disinkron!', 'success');
    } catch (error) {
        showToast('Gagal sinkron: ' + error.message, 'error');
    }
}

// ========== EXPORT/IMPORT/RESET ==========
async function exportAllData() {
    const exportData = {
        players: allPlayers,
        items: allItems,
        monsters: allMonsters,
        locations: allLocations,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpg_export_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor!', 'success');
}

function importFromFile() {
    document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                
                if (imported.players) {
                    for (const [id, player] of Object.entries(imported.players)) {
                        await database.ref(`rpg_players/${id}`).set(player);
                    }
                }
                if (imported.items) {
                    for (const [id, item] of Object.entries(imported.items)) {
                        await database.ref(`rpg_items/${id}`).set(item);
                    }
                }
                if (imported.monsters) {
                    for (const [id, monster] of Object.entries(imported.monsters)) {
                        await database.ref(`rpg_monsters/${id}`).set(monster);
                    }
                }
                
                await loadAllData();
                showToast('Data berhasil diimpor!', 'success');
            } catch(err) {
                showToast('Gagal mengimpor: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };
}

async function resetAllData() {
    if (confirm('⚠️ Yakin ingin mereset SEMUA data? Data akan dihapus dari Firebase!')) {
        if (confirm('Konfirmasi kedua: Hapus semua data? Tidak bisa dikembalikan!')) {
            try {
                await database.ref('rpg_players').remove();
                await database.ref('rpg_items').remove();
                await database.ref('rpg_monsters').remove();
                await loadAllData();
                showToast('Semua data telah direset!', 'success');
            } catch (error) {
                showToast('Gagal reset: ' + error.message, 'error');
            }
        }
    }
}

async function resetPlayersOnly() {
    if (confirm('Hapus SEMUA player? Data tidak bisa dikembalikan!')) {
        try {
            await database.ref('rpg_players').remove();
            await loadAllData();
            showToast('Semua player telah dihapus!', 'success');
        } catch (error) {
            showToast('Gagal reset: ' + error.message, 'error');
        }
    }
}

async function resetAllGameData() {
    if (confirm('Reset data game (monster, item, location) ke default?')) {
        const defaultMonsters = getDefaultMonsters();
        const defaultItems = {
            "potion": { name: "Potion", type: "heal", value: 30, price: 10 },
            "pedang_besi": { name: "Pedang Besi", type: "weapon", attack: 5, price: 50 },
            "zirah_kulit": { name: "Zirah Kulit", type: "armor", defense: 3, price: 40 }
        };
        
        try {
            await database.ref('rpg_monsters').set(defaultMonsters);
            await database.ref('rpg_items').set(defaultItems);
            await loadAllData();
            showToast('Data game telah direset ke default!', 'success');
        } catch (error) {
            showToast('Gagal reset: ' + error.message, 'error');
        }
    }
}

// ========== FILTER FUNCTIONS ==========
function filterPlayers() {
    const searchTerm = document.getElementById('searchPlayer')?.value.toLowerCase() || '';
    const container = document.getElementById('playersGrid');
    if (!container) return;
    
    const filtered = Object.entries(allPlayers).filter(([id, player]) => 
        id.toLowerCase().includes(searchTerm) || 
        (player.username && player.username.toLowerCase().includes(searchTerm))
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search fa-3x"></i><p>Tidak ada player yang cocok</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(([id, player]) => `
        <div class="player-card">
            <div class="player-header">
                <div>
                    <div class="player-name">${escapeHtml(player.username || id.slice(0, 15))}</div>
                    <div class="player-number" style="font-size: 0.6rem; opacity: 0.6;">${escapeHtml(id)}</div>
                </div>
                <div>Lv ${player.level || 1}</div>
            </div>
            <div class="player-stats">
                <div class="stat-item"><span>❤️ HP</span><span>${player.hp || 0}/${player.maxHp || 100}</span></div>
                <div class="stat-item"><span>💰 Gold</span><span>${formatGold(player.gold || 0)}</span></div>
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="openEditPlayerModal('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="give-gold-btn" onclick="giveGoldToPlayer('${id}')"><i class="fas fa-coins"></i> Tambah Gold</button>
                <button class="delete-btn" onclick="deletePlayerFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function filterItems() {
    const searchTerm = document.getElementById('searchItem')?.value.toLowerCase() || '';
    const container = document.getElementById('itemsGrid');
    if (!container) return;
    
    const filtered = Object.entries(allItems).filter(([id, item]) => 
        id.toLowerCase().includes(searchTerm) || 
        item.name.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search fa-3x"></i><p>Tidak ada item yang cocok</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(([id, item]) => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-name">${escapeHtml(item.name)}</div>
                </div>
                <div>💰 ${item.price}</div>
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="editItem('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteItemFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

function filterMonsters() {
    const searchTerm = document.getElementById('searchMonster')?.value.toLowerCase() || '';
    const container = document.getElementById('monstersGrid');
    if (!container) return;
    
    const filtered = Object.entries(allMonsters).filter(([id, monster]) => 
        id.toLowerCase().includes(searchTerm) || 
        monster.name.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search fa-3x"></i><p>Tidak ada monster yang cocok</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(([id, monster]) => `
        <div class="monster-card">
            <div class="monster-header">
                <div>
                    <div class="monster-name">${escapeHtml(monster.name)}</div>
                </div>
                <div>Lv ${monster.level || 1}</div>
            </div>
            <div class="monster-details">
                <span>❤️ HP: ${monster.hp}</span>
                <span>💰 Gold: ${monster.gold}</span>
            </div>
            <div class="player-actions">
                <button class="edit-btn" onclick="editMonster('${id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteMonsterFromFirebase('${id}')"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        </div>
    `).join('');
}

// ========== UTILITIES ==========
function formatGold(amount) {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}rb`;
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = show ? 'flex' : 'none';
}

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) activeTab.classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// ========== THEME & NAVIGATION ==========
function loadTheme() {
    const savedTheme = localStorage.getItem('bizzy_theme_mode');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
    } else {
        document.body.classList.remove('light');
    }
}

function toggleTheme() {
    if (document.body.classList.contains('light')) {
        document.body.classList.remove('light');
        localStorage.setItem('bizzy_theme_mode', 'dark');
        showToast('🌙 Mode Gelap diaktifkan');
    } else {
        document.body.classList.add('light');
        localStorage.setItem('bizzy_theme_mode', 'light');
        showToast('☀️ Mode Terang diaktifkan');
    }
}

function goBackToTools() {
    if (window.GlobalMusic && window.GlobalMusic.saveState) {
        window.GlobalMusic.saveState();
    }
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = 'tools.html';
    }, 200);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin panel...');
    loadTheme();
    
    // Login button
    const loginBtn = document.getElementById('adminLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', adminLogin);
        console.log('Login button registered');
    } else {
        console.error('Login button not found!');
    }
    
    // Password enter key
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });
    
    console.log('Admin panel ready');
});

// Export global functions
window.adminLogin = adminLogin;
window.logoutAdmin = logoutAdmin;
window.switchTab = switchTab;
window.filterPlayers = filterPlayers;
window.filterItems = filterItems;
window.filterMonsters = filterMonsters;
window.openEditPlayerModal = openEditPlayerModal;
window.closeEditPlayerModal = closeEditPlayerModal;
window.savePlayerToFirebase = savePlayerToFirebase;
window.giveGoldToPlayer = giveGoldToPlayer;
window.deletePlayerFromFirebase = deletePlayerFromFirebase;
window.showAddPlayerModal = showAddPlayerModal;
window.closeAddPlayerModal = closeAddPlayerModal;
window.addPlayerToFirebase = addPlayerToFirebase;
window.showAddItemModal = showAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.addItemToFirebase = addItemToFirebase;
window.editItem = editItem;
window.deleteItemFromFirebase = deleteItemFromFirebase;
window.showAddMonsterModal = showAddMonsterModal;
window.closeAddMonsterModal = closeAddMonsterModal;
window.addMonsterToFirebase = addMonsterToFirebase;
window.editMonster = editMonster;
window.deleteMonsterFromFirebase = deleteMonsterFromFirebase;
window.syncToFirebase = syncToFirebase;
window.syncItemsToFirebase = syncItemsToFirebase;
window.syncMonstersToFirebase = syncMonstersToFirebase;
window.syncLocationsToFirebase = syncLocationsToFirebase;
window.exportAllData = exportAllData;
window.importFromFile = importFromFile;
window.resetAllData = resetAllData;
window.resetPlayersOnly = resetPlayersOnly;
window.resetAllGameData = resetAllGameData;
window.toggleTheme = toggleTheme;
window.goBackToTools = goBackToTools;