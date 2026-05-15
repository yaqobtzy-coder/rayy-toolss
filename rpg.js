/*
 * © ALIP-AI
 * Since     : 2024 - 2026
 *
 * YouTube   : https://youtube.com/@alipclutch
 * Channel   : https://whatsapp.com/channel/0029VbC3jusK5cDD9mELOb18
 
 * © Elaina
 * Recode By Rahmad Tenpoles
 * https://wa.me/+6285764735713
 */

const fs = require('fs')
const path = require('path')

const rpgDBPath = './library/database/rpg.json'
const userDBPath = './library/database/user.json'
const limitUsagePath = './library/database/limit_usage.json'
const limitConfigPath = './library/database/limit_config.json'
const registerSystemPath = './library/database/register_system.json'

function getWIBTime() {
    const now = new Date()
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    return new Date(utc + 7 * 60 * 60000)
}

function safeReadJSON(path, fallback) {
    try {
        return JSON.parse(fs.readFileSync(path))
    } catch {
        fs.writeFileSync(path, JSON.stringify(fallback, null, 2))
        return fallback
    }
}

function isRegisterSystemEnabled() {
    try {
        if (!fs.existsSync(registerSystemPath)) return true
        const config = JSON.parse(fs.readFileSync(registerSystemPath))
        return config.enabled === true
    } catch {
        return true
    }
}

function isUserRegistered(jid) {
    if (!isRegisterSystemEnabled()) return true
    try {
        if (!fs.existsSync(userDBPath)) return false
        const userDB = JSON.parse(fs.readFileSync(userDBPath))
        const targetJid = jid.replace('@lid', '@s.whatsapp.net')
        return userDB.some(user => {
            const userJid = user.jid?.replace('@lid', '@s.whatsapp.net')
            return userJid === targetJid
        })
    } catch {
        return false
    }
}

function checkLimit(jid, isPrem, isCreator) {
    if (isPrem || isCreator) return false
    const usageDB = safeReadJSON(limitUsagePath, [])
    const today = getWIBTime().toISOString().split('T')[0]
    const config = safeReadJSON(limitConfigPath, { defaultLimit: 15, users: {} })
    const maxLimit = config.users[jid] || 15
    const user = usageDB.find(v => v.jid === jid)
    if (!user) return false
    if (user.date !== today) return false
    return user.count >= maxLimit
}

function addLimit(jid, isPrem, isCreator) {
    if (isPrem || isCreator) return
    const usageDB = safeReadJSON(limitUsagePath, [])
    const today = getWIBTime().toISOString().split('T')[0]
    let user = usageDB.find(v => v.jid === jid)
    if (!user) {
        usageDB.push({ jid, date: today, count: 1 })
    } else {
        if (user.date !== today) {
            user.date = today
            user.count = 1
        } else {
            user.count++
        }
    }
    fs.writeFileSync(limitUsagePath, JSON.stringify(usageDB, null, 2))
}

if (!fs.existsSync(rpgDBPath)) {
    const defaultRPG = {
        players: {},
        monsters: {
            "1": { "name": "Goblin", "hp": 30, "attack": 5, "defense": 2, "exp": 15, "gold": 10, "level": 1, "drops": { "kulit_goblin": 0.7, "taring_goblin": 0.3 } },
            "2": { "name": "Orc", "hp": 50, "attack": 8, "defense": 4, "exp": 25, "gold": 20, "level": 3, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.1 } },
            "3": { "name": "Naga", "hp": 100, "attack": 15, "defense": 8, "exp": 60, "gold": 50, "level": 10, "drops": { "sisik_naga": 0.5, "batu_kekuatan": 0.3 } },
            "4": { "name": "Goblin Jendral", "hp": 80, "attack": 12, "defense": 6, "exp": 70, "gold": 60, "level": 7, "drops": { "batu_kekuatan": 0.5 } }
        },
        locations: {
            "desa": { "name": "Desa Pemula", "monsters": [1], "minLevel": 1, "maxLevel": 5, "desc": "Desa kecil yang tenang, tempat awal petualanganmu." },
            "hutan": { "name": "Hutan Gelap", "monsters": [1, 2], "minLevel": 3, "maxLevel": 8, "desc": "Hutan lebat dengan pepohonan tinggi yang menutupi sinar matahari." },
            "gua": { "name": "Gua Naga", "monsters": [2, 3], "minLevel": 8, "maxLevel": 15, "desc": "Gua gelap yang konon menjadi sarang makhluk legendaris." },
            "tambang": { "name": "Tambang Terbengkalai", "minLevel": 5, "maxLevel": 20, "ores": { "batu": 0.8, "batu_bara": 0.5, "bijih_besi": 0.2, "permata": 0.05 }, "desc": "Tambang tua yang ditinggalkan, menyimpan berbagai mineral berharga." },
            "padang_rumput": { "name": "Padang Rumput Liar", "minLevel": 2, "maxLevel": 20, "herbs": { "rumput_liar": 0.9, "bunga_langka": 0.3, "jamur_ajaib": 0.1 }, "desc": "Hamparan rumput luas dengan berbagai tanaman herbal liar." }
        },
        items: {
            "potion": { "name": "Potion", "type": "heal", "value": 30, "price": 10 },
            "limit_bot_10": { "name": "10 Limit Bot", "type": "bot_feature", "value": 10, "price": 1000 },
            "elixir": { "name": "Elixir", "type": "mana", "value": 25, "price": 15 },
            "pedang_besi": { "name": "Pedang Besi", "type": "weapon", "attack": 5, "price": 50 },
            "zirah_kulit": { "name": "Zirah Kulit", "type": "armor", "defense": 3, "price": 40 },
            "pedang_kayu": { "name": "Pedang Kayu", "type": "weapon", "attack": 2, "price": 15 },
            "baju_kain": { "name": "Baju Kain", "type": "armor", "defense": 1, "price": 10 },
            "kulit_goblin": { "name": "Kulit Goblin", "type": "material", "price": 2 },
            "taring_goblin": { "name": "Taring Goblin", "type": "material", "price": 4 },
            "kulit_orc": { "name": "Kulit Orc", "type": "material", "price": 5 },
            "batu_kekuatan": { "name": "Batu Kekuatan", "type": "material", "price": 20 },
            "sisik_naga": { "name": "Sisik Naga", "type": "material", "price": 30 },
            "batu": { "name": "Batu", "type": "material", "price": 1 },
            "batu_bara": { "name": "Batu Bara", "type": "material", "price": 8 },
            "bijih_besi": { "name": "Bijih Besi", "type": "material", "price": 15 },
            "permata": { "name": "Permata", "type": "material", "price": 100 },
            "rumput_liar": { "name": "Rumput Liar", "type": "material", "price": 1 },
            "bunga_langka": { "name": "Bunga Langka", "type": "material", "price": 25 },
            "jamur_ajaib": { "name": "Jamur Ajaib", "type": "material", "price": 40 },
            "nikel": { "name": "Nikel", "type": "material", "price": 50 },
            "emas": { "name": "Emas", "type": "material", "price": 250 },
            "berlian": { "name": "Berlian", "type": "material", "price": 500 }
        },
        craftingRecipes: {
            "potion_kuat": { "name": "Potion Kuat", "result": "potion", "amount": 3, "materials": { "bunga_langka": 2, "jamur_ajaib": 1 } },
            "zirah_kulit_kuat": { "name": "Zirah Kulit Kuat", "result": "zirah_kulit", "amount": 1, "materials": { "kulit_orc": 5, "kulit_goblin": 10 } },
            "pedang_besi_tempa": { "name": "Pedang Besi Tempa", "result": "pedang_besi", "amount": 1, "materials": { "bijih_besi": 10, "batu_bara": 5 } }
        },
        quests: {
            "pemburu_goblin": { "title": "Pemburu Goblin", "description": "Kalahkan 5 Goblin di Desa Pemula.", "type": "kill", "target": "Goblin", "count": 5, "reward": { "exp": 100, "gold": 50, "item": { "id": "potion", "amount": 3 } } },
            "kolektor_kulit": { "title": "Kolektor Kulit", "description": "Kumpulkan 10 Kulit Goblin.", "type": "collect", "target": "kulit_goblin", "count": 10, "reward": { "exp": 80, "gold": 70 } }
        },
        dungeons: {
            "goblin_outpost": {
                "name": "Markas Goblin",
                "minLevel": 5,
                "stages": [
                    { "monsterId": "1", "count": 2 },
                    { "monsterId": "1", "count": 3 }
                ],
                "boss": "4",
                "reward": { "exp": 250, "gold": 200, "item": { "id": "batu_kekuatan", "amount": 2 } }
            }
        },
        petData: {
            "serigala": { "name": "Serigala", "attack": 5, "cost": 300, "description": "Serigala setia yang menambah kekuatan seranganmu." },
            "kura_kura": { "name": "Kura-kura", "defense": 3, "cost": 250, "description": "Kura-kura dengan tempurung keras yang menambah pertahananmu." }
        }
    }
    fs.writeFileSync(rpgDBPath, JSON.stringify(defaultRPG, null, 2))
}

function initPlayerRPG(jid, className = "warrior") {
    const classes = {
        "warrior": { hp: 100, mp: 30, attack: 15, defense: 10, agility: 5, skillName: "Rage Slash", skillDesc: "Serangan dahsyat dengan damage 2.5x, mengorbankan 5 HP dan 15 MP" },
        "mage": { hp: 60, mp: 100, attack: 20, defense: 5, agility: 8, skillName: "Fireball", skillDesc: "Sihir api dengan damage 2x, mengonsumsi 20 MP" },
        "archer": { hp: 80, mp: 50, attack: 12, defense: 7, agility: 15, skillName: "Precision Shot", skillDesc: "Tembakan presisi dengan chance critical 75%, mengonsumsi 15 MP" }
    }
    const selectedClass = classes[className] || classes["warrior"]
    return {
        jid: jid,
        class: className,
        level: 1,
        exp: 0,
        expToNextLevel: 100,
        maxHp: selectedClass.hp,
        hp: selectedClass.hp,
        maxMp: selectedClass.mp,
        mp: selectedClass.mp,
        attack: selectedClass.attack,
        defense: selectedClass.defense,
        agility: selectedClass.agility,
        skillName: selectedClass.skillName,
        skillDesc: selectedClass.skillDesc,
        gold: 50,
        inventory: { "potion": 3, "pedang_kayu": 1, "baju_kain": 1 },
        equipment: { weapon: null, armor: null },
        location: "desa",
        battles: 0,
        monstersDefeated: 0,
        lastBattle: 0,
        activeQuest: null,
        questProgress: 0,
        lastDaily: 0,
        lastPvp: 0,
        pvpWins: 0,
        pvpLosses: 0,
        fishing: null,
        pet: null,
        dungeonState: null,
        miningState: null,
        lastForage: 0
    }
}

function getRandomMonster(location, rpgDB) {
    const locationData = rpgDB.locations[location]
    if (!locationData || !locationData.monsters || locationData.monsters.length === 0) return null
    const randomMonsterId = locationData.monsters[Math.floor(Math.random() * locationData.monsters.length)]
    return { ...rpgDB.monsters[randomMonsterId], id: randomMonsterId }
}

function getPlayerTotalStats(player, rpgDB) {
    let totalStats = { attack: player.attack, defense: player.defense }
    if (player.equipment.weapon) {
        const weapon = rpgDB.items[player.equipment.weapon]
        if (weapon) totalStats.attack += weapon.attack || 0
    }
    if (player.equipment.armor) {
        const armor = rpgDB.items[player.equipment.armor]
        if (armor) totalStats.defense += armor.defense || 0
    }
    return totalStats
}

function calculateDamage(attacker, defender, rpgDB) {
    const isPlayerAttacker = !!attacker.maxHp
    const attackerStats = isPlayerAttacker ? getPlayerTotalStats(attacker, rpgDB) : { attack: attacker.attack, defense: attacker.defense }
    const defenderStats = !isPlayerAttacker ? getPlayerTotalStats(defender, rpgDB) : { attack: defender.attack, defense: defender.defense }
    const damage = Math.max(1, Math.floor(attackerStats.attack - defenderStats.defense))
    const isCritical = Math.random() < ((attacker.agility || 5) / 100)
    return { damage: isCritical ? damage * 2 : damage, isCritical }
}

function gainExp(player, exp) {
    if (!player) return false
    player.exp += exp
    if (player.exp >= player.expToNextLevel) {
        player.level += 1
        player.exp -= player.expToNextLevel
        player.expToNextLevel = Math.floor(player.expToNextLevel * 1.5)
        player.maxHp += 10
        player.hp = player.maxHp
        player.maxMp += 5
        player.mp = player.maxMp
        player.attack += 2
        player.defense += 1
        player.agility += 1
        return true
    }
    return false
}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function msToTime(ms) {
    if (ms < 0) return '0 detik'
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)
    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24
    let result = []
    if (days > 0) result.push(`${days} hari`)
    if (hours > 0) result.push(`${hours} jam`)
    if (minutes > 0) result.push(`${minutes} menit`)
    if (seconds > 0 && result.length === 0) result.push(`${seconds} detik`)
    return result.join(' ') || 'sebentar lagi'
}

function formatIDR(amount) {
    return `Rp ${Math.abs(amount).toLocaleString('id-ID')}`
}

function addLimitToBonus(jid, amount) {
    try {
        const bonusDB = safeReadJSON('./library/database/limit_bonus.json', {})
        const today = getWIBTime().toISOString().split('T')[0]
        if (!bonusDB[jid] || bonusDB[jid].date !== today) {
            bonusDB[jid] = { bonus: 0, date: today }
        }
        bonusDB[jid].bonus += amount
        fs.writeFileSync('./library/database/limit_bonus.json', JSON.stringify(bonusDB, null, 2))
    } catch (e) {}
}

module.exports = async (m, { alip, command, args, isCreator, isPremium, Reply, text, prefix }) => {
    try {
        if (!global.mess) global.mess = { prem: 'Fitur ini khusus premium!', verifikasi: 'Kamu belum terdaftar! Gunakan .daftar', limit: 'Limit harianmu habis! Ketik .claim untuk tambah limit.' }

        if (!isUserRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi)
        if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit)

        let rpgDB = {}
        try {
            rpgDB = JSON.parse(fs.readFileSync(rpgDBPath))
        } catch (e) {
            rpgDB = JSON.parse(fs.readFileSync(rpgDBPath))
        }
        if (!rpgDB.players) rpgDB.players = {}

        const battleCooldown = 20000
        const activityCooldown = 60000

        if (command === 'adduang') {
            if (!isCreator) return Reply('Hanya owner!')
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid') && m.metadata && m.metadata.participants) {
                        let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                        if (p && p.jid) targetJid = p.jid
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }
            if (!targetJid) return Reply(`Tag atau reply user!\nContoh: .adduang 1000 @user`)
            const textParts = text ? text.trim().split(' ') : []
            const amount = parseInt(textParts[0])
            if (isNaN(amount) || amount <= 0) return Reply(`Masukkan jumlah uang yang valid!`)
            if (!rpgDB.players[targetJid]) {
                rpgDB.players[targetJid] = initPlayerRPG(targetJid)
            }
            rpgDB.players[targetJid].gold += amount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`💵 Uang berhasil ditambahkan!\nPenerima: @${targetJid.split('@')[0]}\nJumlah: ${formatIDR(amount)}\nTotal sekarang: ${formatIDR(rpgDB.players[targetJid].gold)}`, [targetJid])
        }

        if (command === 'cekgold') {
            let targetJid = m.sender
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid') && m.metadata && m.metadata.participants) {
                        let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                        if (p && p.jid) targetJid = p.jid
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                } else if (text) {
                    const phoneNumber = text.replace(/[^0-9]/g, '')
                    if (phoneNumber.length > 3) targetJid = phoneNumber + '@s.whatsapp.net'
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            } else if (text) {
                const phoneNumber = text.replace(/[^0-9]/g, '')
                if (phoneNumber.length > 3) targetJid = phoneNumber + '@s.whatsapp.net'
            }
            if (!rpgDB.players[targetJid]) return Reply(`❌ ${targetJid === m.sender ? 'Kamu' : 'User tersebut'} belum memulai petualangan! Gunakan .rpgstart untuk memulai.`)
            const player = rpgDB.players[targetJid]
            let message = `💵 CEK UANG\n`
            if (targetJid !== m.sender) message += `Pemilik: @${targetJid.split('@')[0]}\n`
            message += `Total uang: ${formatIDR(player.gold)} 💵`
            if (targetJid === m.sender) {
                message += `\n\n⚔️ STATUS PETUALANG\nLevel: ${player.level}\nHP: ${player.hp}/${player.maxHp}\nMP: ${player.mp}/${player.maxMp}\nLokasi: ${rpgDB.locations[player.location]?.name || 'Desa Pemula'}`
            }
            addLimit(m.sender, isPremium, isCreator)
            return alip.sendMessage(m.chat, { text: message, mentions: targetJid !== m.sender ? [targetJid] : [] }, { quoted: m })
        }

        if (command === 'topuang') {
            const players = Object.entries(rpgDB.players).filter(([_, p]) => p && p.gold > 0).sort(([,a], [,b]) => (b.gold || 0) - (a.gold || 0)).slice(0, 10)
            if (players.length === 0) return Reply(`Belum ada petualang yang memiliki uang.`)
            let text = `🏆 TOP 10 TERKAYA 🏆\n\n`
            let mentions = []
            players.forEach(([jid, player], index) => {
                text += `${index + 1}. @${jid.split('@')[0]} — ${formatIDR(player.gold)}\n`
                mentions.push(jid)
            })
            addLimit(m.sender, isPremium, isCreator)
            return alip.sendMessage(m.chat, { text: text, mentions: mentions }, { quoted: m })
        }

        if (command === 'rpgstart') {
            if (rpgDB.players[m.sender]) return Reply(`Kamu sudah memulai petualangan! Ketik .rpgstats untuk melihat statistikmu.`)
            if (!text) {
                return Reply(`🎮 PILIH CLASS KARAKTER 🎮\n\n1. Warrior ⚔️ — HP & Defense tinggi\n2. Mage 🔥 — Serangan sihir kuat\n3. Archer 🏹 — Agility & Critical tinggi\n\nGunakan: .rpgstart [class]\nContoh: .rpgstart warrior`)
            }
            const classChoice = text.toLowerCase()
            if (!['warrior', 'mage', 'archer'].includes(classChoice)) return Reply(`Class "${text}" tidak tersedia! Pilih: warrior, mage, atau archer.`)
            rpgDB.players[m.sender] = initPlayerRPG(m.sender, classChoice)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🎉 Selamat datang, Petualang ${classChoice.toUpperCase()}! 🎉\n\nKamu memulai dengan:\n- Rp 50 💵 Uang\n- 3 Potion 🧪\n- Pedang Kayu & Baju Kain 🗡️\n\nKetik .rpghelp untuk melihat semua perintah RPG.`)
        }

        if (command === 'rpgstats') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            const totalStats = getPlayerTotalStats(player, rpgDB)
            const weaponName = player.equipment.weapon ? rpgDB.items[player.equipment.weapon].name : 'Tangan Kosong'
            const armorName = player.equipment.armor ? rpgDB.items[player.equipment.armor].name : 'Baju Biasa'
            const locationName = rpgDB.locations[player.location]?.name || 'Desa Pemula'
            const locationDesc = rpgDB.locations[player.location]?.desc || 'Tempat awal petualanganmu.'
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⚔️ STATISTIK PETUALANG ⚔️\n\nClass: ${player.class.toUpperCase()} (Level ${player.level})\nExp: ${player.exp}/${player.expToNextLevel}\nPvP: ${player.pvpWins} Menang / ${player.pvpLosses} Kalah\n\n❤️ HP: ${player.hp}/${player.maxHp}\n🔵 MP: ${player.mp}/${player.maxMp}\n⚔️ Attack: ${player.attack} (+${totalStats.attack - player.attack})\n🛡️ Defense: ${player.defense} (+${totalStats.defense - player.defense})\n🌀 Agility: ${player.agility}\n\n💵 Uang: ${formatIDR(player.gold)}\n🗡️ Senjata: ${weaponName}\n🥋 Zirah: ${armorName}\n\n📍 Lokasi: ${locationName}\n${locationDesc}`)
        }

        if (command === 'rpgexplore') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            const now = Date.now()
            if (now - (player.lastBattle || 0) < battleCooldown) {
                const cooldown = Math.ceil((battleCooldown - (now - (player.lastBattle || 0))) / 1000)
                return Reply(`Kamu masih kelelahan setelah pertempuran terakhir. Istirahat ${cooldown} detik lagi.`)
            }
            const monster = getRandomMonster(player.location, rpgDB)
            if (!monster) return Reply(`Tidak ada monster di daerah ini! Coba pindah lokasi dengan .rpgmove.`)
            player.battleState = {
                monster: monster,
                monsterHp: monster.hp,
                inBattle: true
            }
            player.lastBattle = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⚔️ PERTEMPURAN DIMULAI! ⚔️\n\n👾 Monster: ${monster.name} (Level ${monster.level})\n❤️ HP Musuh: ${monster.hp}/${monster.hp}\n\n🗡️ Perintah:\n.attack - Serang biasa\n.skill - Gunakan skill ${player.skillName}\n.flee - Kabur (resiko)\n.item - Gunakan item dari inventory`)
        }

        if (command === 'attack') {
            if (!rpgDB.players[m.sender]?.battleState?.inBattle) return Reply(`Kamu sedang tidak bertarung. Gunakan .rpgexplore untuk mencari monster.`)
            const player = rpgDB.players[m.sender]
            const battleState = player.battleState
            const playerDamage = calculateDamage(player, battleState.monster, rpgDB)
            battleState.monsterHp -= playerDamage.damage
            let log = [`⚔️ SERANGAN! ⚔️\n\nKamu menyerang ${battleState.monster.name} dan memberikan ${playerDamage.damage} damage!`]
            if (playerDamage.isCritical) log.push(`💥 CRITICAL HIT! Damage berlipat ganda!`)
            if (player.pet?.attack > 0) {
                const petDamage = player.pet.attack
                battleState.monsterHp -= petDamage
                log.push(`🐾 Peliharaanmu ${player.pet.name} ikut menyerang! +${petDamage} damage!`)
            }
            if (battleState.monsterHp <= 0) {
                const goldReward = battleState.monster.gold
                const expReward = battleState.monster.exp
                player.gold += goldReward
                const leveledUp = gainExp(player, expReward)
                player.monstersDefeated += 1
                log.push(`\n🎉 VICTORY! 🎉\n💵 Mendapat ${formatIDR(goldReward)}\n⭐ Mendapat ${expReward} EXP`)
                if (leveledUp) log.push(`🎊 LEVEL UP! Sekarang Level ${player.level}! 🎊`)
                delete player.battleState
            } else {
                const monsterDamage = calculateDamage(battleState.monster, player, rpgDB)
                player.hp -= monsterDamage.damage
                log.push(`\n🛡️ Serangan balik! ${battleState.monster.name} menyerangmu dengan ${monsterDamage.damage} damage!`)
                log.push(`\n❤️ HP-mu: ${player.hp}/${player.maxHp}\n👾 HP Musuh: ${battleState.monsterHp}/${battleState.monster.hp}`)
                if (player.hp <= 0) {
                    player.hp = Math.floor(player.maxHp / 2)
                    const goldLost = Math.floor(player.gold * 0.1)
                    player.gold -= goldLost
                    log.push(`\n💀 KAMU KALAH! 💀\nKamu terbangun di desa dengan HP terisi setengah.\n💵 Uangmu berkurang ${formatIDR(goldLost)} karena dirampok monster!`)
                    delete player.battleState
                }
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(log.join('\n'))
        }

        if (command === 'skill') {
            if (!rpgDB.players[m.sender]?.battleState?.inBattle) return Reply(`Kamu sedang tidak bertarung. Gunakan .rpgexplore untuk mencari monster.`)
            const player = rpgDB.players[m.sender]
            const battleState = player.battleState
            let log = [`✨ SKILL: ${player.skillName} ✨\n`]
            let skillUsed = false
            switch (player.class) {
                case 'warrior':
                    if (player.mp < 15) return Reply(`MP tidak cukup! Butuh 15 MP untuk menggunakan ${player.skillName}. MP-mu: ${player.mp}/${player.maxMp}`)
                    player.mp -= 15
                    player.hp -= 5
                    const warriorDamage = Math.floor(getPlayerTotalStats(player, rpgDB).attack * 2.5)
                    battleState.monsterHp -= warriorDamage
                    skillUsed = true
                    log.push(`💥 RAGE SLASH! Kamu mengeluarkan jurus pamungkas!\nDamage: ${warriorDamage} ke ${battleState.monster.name}!\nTapi kamu terkena efek samping: -5 HP`)
                    break
                case 'mage':
                    if (player.mp < 20) return Reply(`MP tidak cukup! Butuh 20 MP untuk menggunakan ${player.skillName}. MP-mu: ${player.mp}/${player.maxMp}`)
                    player.mp -= 20
                    const mageDamage = Math.floor(getPlayerTotalStats(player, rpgDB).attack * 2)
                    battleState.monsterHp -= mageDamage
                    skillUsed = true
                    log.push(`🔥 FIREBALL! Api berkobar dari tanganmu!\nDamage: ${mageDamage} ke ${battleState.monster.name}!`)
                    break
                case 'archer':
                    if (player.mp < 15) return Reply(`MP tidak cukup! Butuh 15 MP untuk menggunakan ${player.skillName}. MP-mu: ${player.mp}/${player.maxMp}`)
                    player.mp -= 15
                    const isCritical = Math.random() < 0.75
                    const archerStats = getPlayerTotalStats(player, rpgDB)
                    let archerDamage = Math.max(1, Math.floor(archerStats.attack - battleState.monster.defense))
                    if (isCritical) archerDamage *= 2
                    battleState.monsterHp -= archerDamage
                    skillUsed = true
                    log.push(`🏹 PRECISION SHOT! Bidikan presisi melesat!`)
                    if (isCritical) log.push(`💥 CRITICAL HIT!`)
                    log.push(`Damage: ${archerDamage} ke ${battleState.monster.name}!`)
                    break
            }
            if (skillUsed) {
                if (player.pet?.attack > 0 && battleState.monsterHp > 0) {
                    const petDamage = player.pet.attack
                    battleState.monsterHp -= petDamage
                    log.push(`🐾 Peliharaanmu ${player.pet.name} ikut menyerang! +${petDamage} damage!`)
                }
                if (battleState.monsterHp <= 0) {
                    const goldReward = battleState.monster.gold
                    const expReward = battleState.monster.exp
                    player.gold += goldReward
                    const leveledUp = gainExp(player, expReward)
                    log.push(`\n🎉 VICTORY! 🎉\n💵 Mendapat ${formatIDR(goldReward)}\n⭐ Mendapat ${expReward} EXP`)
                    if (leveledUp) log.push(`🎊 LEVEL UP! Sekarang Level ${player.level}! 🎊`)
                    delete player.battleState
                } else {
                    const monsterDamage = calculateDamage(battleState.monster, player, rpgDB)
                    player.hp -= monsterDamage.damage
                    log.push(`\n🛡️ Serangan balik! ${battleState.monster.name} menyerangmu dengan ${monsterDamage.damage} damage!`)
                    log.push(`\n❤️ HP-mu: ${player.hp}/${player.maxHp}\n👾 HP Musuh: ${battleState.monsterHp}/${battleState.monster.hp}`)
                    if (player.hp <= 0) {
                        player.hp = Math.floor(player.maxHp / 2)
                        const goldLost = Math.floor(player.gold * 0.1)
                        player.gold -= goldLost
                        log.push(`\n💀 KAMU KALAH! 💀\nKamu terbangun di desa dengan HP terisi setengah.\n💵 Uangmu berkurang ${formatIDR(goldLost)} karena dirampok monster!`)
                        delete player.battleState
                    }
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(log.join('\n'))
            }
        }

        if (command === 'flee') {
            if (!rpgDB.players[m.sender]?.battleState?.inBattle) return Reply(`Kamu sedang tidak bertarung.`)
            const player = rpgDB.players[m.sender]
            const monster = player.battleState.monster
            const fleeChance = Math.min(0.9, (player.agility / (player.agility + monster.level * 5)))
            if (Math.random() < fleeChance) {
                delete player.battleState
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(`🏃‍♂️ KABUR BERHASIL! 🏃‍♂️\n\nKamu berhasil melarikan diri dari ${monster.name} dengan selamat!`)
            } else {
                const monsterDamage = calculateDamage(monster, player, rpgDB)
                player.hp -= monsterDamage.damage
                let log = [`❌ GAGAL KABUR! ❌\n\n${monster.name} menyerangmu dari belakang!\n💥 Damage: ${monsterDamage.damage}`]
                if (player.hp <= 0) {
                    player.hp = Math.floor(player.maxHp / 2)
                    const goldLost = Math.floor(player.gold * 0.1)
                    player.gold -= goldLost
                    log.push(`\n💀 KAMU KALAH! 💀\nKamu terbangun di desa dengan HP terisi setengah.\n💵 Uangmu berkurang ${formatIDR(goldLost)} karena dirampok monster!`)
                    delete player.battleState
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(log.join('\n'))
            }
        }

        if (command === 'rpgmove') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text) {
                const player = rpgDB.players[m.sender]
                let locationList = `🗺️ DAFTAR LOKASI 🗺️\n\n`
                for (const [id, loc] of Object.entries(rpgDB.locations)) {
                    const canAccess = player.level >= loc.minLevel && player.level <= loc.maxLevel
                    locationList += `${canAccess ? '✅' : '❌'} ${loc.name} (Level ${loc.minLevel}-${loc.maxLevel})\n   ${loc.desc}\n   .rpgmove ${id}\n\n`
                }
                locationList += `📍 Lokasimu saat ini: ${rpgDB.locations[player.location]?.name || 'Desa Pemula'}`
                addLimit(m.sender, isPremium, isCreator)
                return Reply(locationList)
            }
            const player = rpgDB.players[m.sender]
            const locationId = text.toLowerCase()
            if (!rpgDB.locations[locationId]) return Reply(`Lokasi "${text}" tidak ditemukan!`)
            const targetLocation = rpgDB.locations[locationId]
            if (player.level < targetLocation.minLevel) return Reply(`Levelmu terlalu rendah! Butuh level ${targetLocation.minLevel} untuk masuk ${targetLocation.name}.`)
            if (player.level > targetLocation.maxLevel) return Reply(`Daerah ini terlalu mudah untukmu! (Maks level ${targetLocation.maxLevel})`)
            player.location = locationId
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🚶‍♂️ BERANGKAT KE ${targetLocation.name.toUpperCase()} 🚶‍♂️\n\n${targetLocation.desc}\n\nBersiaplah menghadapi monster di sini!`)
        }

        if (command === 'rpginv') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            let invText = `🎒 INVENTORY 🎒\n\n`
            if (!player.inventory || Object.keys(player.inventory).length === 0) {
                invText += `Inventory kosong.\n`
            } else {
                for (const [itemId, quantity] of Object.entries(player.inventory)) {
                    if (rpgDB.items[itemId]) invText += `${rpgDB.items[itemId].name} x${quantity}\n`
                }
            }
            invText += `\n💵 Uang: ${formatIDR(player.gold)}\n🗡️ Senjata: ${player.equipment?.weapon ? rpgDB.items[player.equipment.weapon]?.name : 'Tangan Kosong'}\n🥋 Zirah: ${player.equipment?.armor ? rpgDB.items[player.equipment.armor]?.name : 'Baju Biasa'}`
            addLimit(m.sender, isPremium, isCreator)
            return Reply(invText)
        }

        if (command === 'rpgshop') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            let shopText = `🛒 TOKO PETUALANG 🛒\n\n`
            for (const [itemId, item] of Object.entries(rpgDB.items)) {
                shopText += `${item.name} — ${formatIDR(item.price)}\n.buy ${itemId}\n\n`
            }
            shopText += `💵 Uangmu: ${formatIDR(player.gold)}\n💡 Jual item dengan .sell [item] [jumlah]`
            addLimit(m.sender, isPremium, isCreator)
            return Reply(shopText)
        }

        if (command === 'buy') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text) return Reply(`Gunakan: .buy [nama_item]\nContoh: .buy potion`)
            const player = rpgDB.players[m.sender]
            const itemId = text.toLowerCase().replace(/ /g, '_')
            if (!rpgDB.items[itemId]) return Reply(`Item "${text}" tidak ditemukan di toko!`)
            const item = rpgDB.items[itemId]
            if (player.gold < item.price) return Reply(`uang tidak cukup! Butuh ${formatIDR(item.price - player.gold)} lagi.`)
            player.gold -= item.price
            if (item.type === 'bot_feature') {
                addLimitToBonus(m.sender, item.value)
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(`✅ PEMBELIAN BERHASIL!\n\nItem: ${item.name}\nHarga: ${formatIDR(item.price)}\nBonus: +${item.value} limit bot hari ini!`)
            } else {
                if (!player.inventory) player.inventory = {}
                player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(`✅ PEMBELIAN BERHASIL!\n\nItem: ${item.name}\nHarga: ${formatIDR(item.price)}\nSisa uang: ${formatIDR(player.gold)}`)
            }
        }

        if (command === 'sell') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text) return Reply(`Gunakan: .sell [nama_item] [jumlah]\nContoh: .sell potion 1`)
            const player = rpgDB.players[m.sender]
            const args = text.trim().split(" ")
            const itemId = args[0].toLowerCase()
            const amount = parseInt(args[1]) || 1
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < amount) return Reply(`Kamu tidak memiliki ${amount} ${itemId} di inventory!`)
            if (!rpgDB.items[itemId]) return Reply(`Item "${itemId}" tidak valid!`)
            const item = rpgDB.items[itemId]
            const sellPrice = Math.floor(item.price * 0.5) * amount
            player.gold += sellPrice
            player.inventory[itemId] -= amount
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`💵 BERHASIL MENJUAL! 💵\n\nItem: ${item.name} x${amount}\nDapat: ${formatIDR(sellPrice)}\nSisa uang: ${formatIDR(player.gold)}`)
        }

        if (command === 'use') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text) return Reply(`Gunakan: .use [nama_item]\nContoh: .use potion`)
            const player = rpgDB.players[m.sender]
            const itemId = text.toLowerCase()
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) return Reply(`Kamu tidak memiliki "${itemId}" di inventory!`)
            if (!rpgDB.items[itemId]) return Reply(`Item "${itemId}" tidak valid!`)
            const item = rpgDB.items[itemId]
            let msg = `✨ MENGGUNAKAN ${item.name} ✨\n\n`
            if (item.type === 'heal') {
                const healAmount = item.value
                player.hp = Math.min(player.maxHp, player.hp + healAmount)
                msg += `❤️ HP pulih ${healAmount}!\n❤️ HP sekarang: ${player.hp}/${player.maxHp}`
            } else if (item.type === 'mana') {
                const manaAmount = item.value
                player.mp = Math.min(player.maxMp, player.mp + manaAmount)
                msg += `🔵 MP pulih ${manaAmount}!\n🔵 MP sekarang: ${player.mp}/${player.maxMp}`
            } else {
                return Reply(`Item ini tidak bisa digunakan dalam pertempuran atau di luar pertempuran.`)
            }
            player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(msg)
        }

        if (command === 'equip') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text) return Reply(`Gunakan: .equip [nama_item]\nLihat item di .rpginv`)
            const player = rpgDB.players[m.sender]
            const itemId = text.toLowerCase().replace(/ /g, '_')
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) return Reply(`Kamu tidak memiliki item "${text}"!`)
            const item = rpgDB.items[itemId]
            if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return Reply(`"${text}" bukan item yang bisa dipasang.`)
            const itemType = item.type
            if (!player.equipment) player.equipment = { weapon: null, armor: null }
            if (player.equipment[itemType]) {
                const oldItemId = player.equipment[itemType]
                player.inventory[oldItemId] = (player.inventory[oldItemId] || 0) + 1
            }
            player.equipment[itemType] = itemId
            player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`✅ ${item.name} berhasil dipasang!\n${item.type == 'weapon' ? '⚔️ Attack +' + item.attack : '🛡️ Defense +' + item.defense}`)
        }

        if (command === 'unequip') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            if (!text || !['weapon', 'armor'].includes(text.toLowerCase())) return Reply(`Gunakan: .unequip [weapon/armor]`)
            const player = rpgDB.players[m.sender]
            const slot = text.toLowerCase()
            if (!player.equipment || !player.equipment[slot]) return Reply(`Tidak ada ${slot} yang sedang dipakai.`)
            const itemId = player.equipment[slot]
            const item = rpgDB.items[itemId]
            if (!player.inventory) player.inventory = {}
            player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
            player.equipment[slot] = null
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🔄 ${item.name} dilepas dan dikembalikan ke inventory.`)
        }

        if (command === 'item') {
            if (!rpgDB.players[m.sender]?.battleState?.inBattle) return Reply(`Kamu sedang tidak bertarung. Item hanya bisa digunakan saat bertarung.`)
            const player = rpgDB.players[m.sender]
            const battleState = player.battleState
            if (!text) {
                const usableItems = Object.keys(player.inventory || {}).filter(itemId => {
                    const itemData = rpgDB.items[itemId]
                    return itemData && (itemData.type === 'heal' || itemData.type === 'mana')
                })
                if (usableItems.length === 0) return Reply(`Tidak ada item yang bisa digunakan dalam pertarungan!`)
                let itemList = `🎒 ITEM YANG BISA DIGUNAKAN 🎒\n\n`
                usableItems.forEach(itemId => {
                    itemList += `${rpgDB.items[itemId].name} (x${player.inventory[itemId]})\n`
                })
                itemList += `\nGunakan: .item [nama_item]`
                return Reply(itemList)
            }
            const itemId = text.toLowerCase().trim()
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) return Reply(`Kamu tidak memiliki item "${itemId}"!`)
            const item = rpgDB.items[itemId]
            if (!item || (item.type !== 'heal' && item.type !== 'mana')) return Reply(`Item "${item.name}" tidak dapat digunakan dalam pertarungan!`)
            let msg = `✨ MENGGUNAKAN ${item.name} ✨\n\n`
            if (item.type === 'heal') {
                const healAmount = item.value
                player.hp = Math.min(player.maxHp, player.hp + healAmount)
                msg += `❤️ HP pulih ${healAmount}! (${player.hp}/${player.maxHp})`
            } else if (item.type === 'mana') {
                const manaAmount = item.value
                player.mp = Math.min(player.maxMp, player.mp + manaAmount)
                msg += `🔵 MP pulih ${manaAmount}! (${player.mp}/${player.maxMp})`
            }
            player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
            const monsterDamage = calculateDamage(battleState.monster, player, rpgDB)
            player.hp -= monsterDamage.damage
            msg += `\n\n🛡️ GILIRAN MUSUH!\n${battleState.monster.name} menyerangmu dengan ${monsterDamage.damage} damage!`
            msg += `\n\n❤️ HP-mu: ${player.hp}/${player.maxHp}\n👾 HP Musuh: ${battleState.monsterHp}/${battleState.monster.hp}`
            if (player.hp <= 0) {
                player.hp = Math.floor(player.maxHp / 2)
                const goldLost = Math.floor(player.gold * 0.1)
                player.gold -= goldLost
                msg += `\n\n💀 KAMU KALAH! 💀\nKamu terbangun di desa dengan HP terisi setengah.\n💵 Uangmu berkurang ${formatIDR(goldLost)} karena dirampok monster!`
                delete player.battleState
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(msg)
        }

        if (command === 'rpghelp') {
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🎮 PERINTAH RPG 🎮

⚔️ PERTEMPURAN
.rpgexplore - Cari monster
.attack - Serang monster
.skill - Gunakan skill class
.flee - Kabur dari pertarungan
.item - Gunakan item saat bertarung
.pvp @user - Tantang user lain

🎒 INVENTORY & TOKO
.rpgshop - Lihat toko
.buy [item] - Beli item
.sell [item] [jumlah] - Jual item
.use [item] - Gunakan item
.equip [item] - Pasang senjata/armor
.unequip [weapon/armor] - Lepas senjata/armor
.rpginv - Lihat inventory

📊 STATISTIK & PROGRES
.rpgstats - Lihat statistik
.rpgmove - Pindah lokasi
.rpgstart [class] - Mulai petualangan
.cekuang - Cek uang
.topuang - Top 10 terkaya
.leaderboardrpg - Top 5 petualang

💼 PEKERJAAN & AKTIVITAS
.kerja - Kerja kantoran
.jobkerja - Kerja part time
.ngojek - Jadi ojek online
.berkebun - Bertani
.maling - Jadi maling
.begal - Jadi begal
.openbo - Open BO (beresiko tinggi)
.ngocok - Aktivitas tidak senonoh
.ngelonte - Jadi PSK
.tambang - Mulai menambang
.meramu - Cari bahan herbal
.mancingstart - Siapkan pancing
.mancing - Mulai memancing

🎁 LAINNYA
.quest - Ambil quest
.craft - Buat item dari bahan
.daily - Klaim hadiah harian
.dungeon - Masuki dungeon
.adopsipet - Adopsi peliharaan
.infopet - Info peliharaan
.tfuang [jumlah] @user - Transfer uang (owner only)`)
        }

        if (command === 'openbo') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 15) return Reply(`HP-mu terlalu rendah untuk open BO! Istirahat dulu.`)
            const results = [
                { name: "Dapat om-om sultan! Bayaran mahal!", exp: 40, gold: 500, hp: -20 },
                { name: "Dapat customer pelit...", exp: 15, gold: 50, hp: -15 },
                { name: "Kena tipu customer! Kabur tanpa bayar.", exp: 5, gold: 0, hp: -25 },
                { name: "Dapat customer gila! Trauma berat.", exp: 10, gold: 100, hp: -30 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `💦 OPEN BO 💦\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'ngocok') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 5) return Reply(`Kamu terlalu lelah untuk ngocok! Istirahat dulu.`)
            const results = [
                { name: "Keluar deras! Badan lemes.", exp: 10, gold: 20, hp: -8 },
                { name: "Cuma mimpi basah...", exp: 5, gold: 5, hp: -3 },
                { name: "Dapet ide brilian setelahnya!", exp: 15, gold: 10, hp: -5 },
                { name: "Kecanduan berat...", exp: 8, gold: 15, hp: -10 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🍆 NGOCOK 🍆\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'ngelonte') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 20) return Reply(`HP-mu terlalu rendah untuk ngelonte! Istirahat dulu.`)
            const results = [
                { name: "Dapat tamu kaya raya! Untung besar!", exp: 50, gold: 800, hp: -25 },
                { name: "Dapat tamu biasa, hasil standar.", exp: 20, gold: 150, hp: -15 },
                { name: "Dapat tamu yang kasar... Trauma.", exp: 10, gold: 50, hp: -35 },
                { name: "Dikejar-kejar satpol PP!", exp: 5, gold: 0, hp: -20 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `👊 NGELONTE 👊\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'tambang' || command === 'mining') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (player.location !== 'tambang') return Reply(`Kamu harus berada di Tambang Terbengkalai untuk menambang. Gunakan .rpgmove tambang.`)
            const now = Date.now()
            const cooldown = 3 * 60 * 1000
            if (now - (player.miningState?.lastMine || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.miningState?.lastMine || 0)))
                return Reply(`Kamu masih kelelahan setelah menambang. Istirahat ${timeLeft} lagi.`)
            }
            if (!player.miningState) player.miningState = { stage: 'permukaan', lastMine: 0 }
            const expGained = generateRandomNumber(5, 15)
            const batuGained = generateRandomNumber(1, 5)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["batu"] = (player.inventory["batu"] || 0) + batuGained
            player.miningState.stage = 'besi'
            player.miningState.lastMine = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⛏️ HASIL MENAMBANG ⛏️\n\nBatu: +${batuGained}\nEXP: +${expGained}\n\nKamu menemukan jalur menuju lapisan bijih besi! Ketik .besi untuk melanjutkan.`)
        }

        if (command === 'besi') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (!player.miningState || player.miningState.stage !== 'besi') return Reply(`Kamu belum mencapai lapisan bijih besi. Mulai dari .tambang dulu.`)
            const now = Date.now()
            const cooldown = 3 * 60 * 1000
            if (now - (player.miningState.lastMine || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.miningState.lastMine || 0)))
                return Reply(`Kamu masih kelelahan. Istirahat ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(15, 30)
            const itemGained = generateRandomNumber(1, 3)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["bijih_besi"] = (player.inventory["bijih_besi"] || 0) + itemGained
            player.miningState.stage = 'nikel'
            player.miningState.lastMine = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⛏️ HASIL MENAMBANG BIJIH BESI ⛏️\n\nBijih Besi: +${itemGained}\nEXP: +${expGained}\n\nKamu menemukan lapisan nikel! Ketik .nikel untuk melanjutkan.`)
        }

        if (command === 'nikel') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (!player.miningState || player.miningState.stage !== 'nikel') return Reply(`Kamu belum mencapai lapisan nikel. Selesaikan .besi dulu.`)
            const now = Date.now()
            const cooldown = 4 * 60 * 1000
            if (now - (player.miningState.lastMine || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.miningState.lastMine || 0)))
                return Reply(`Kamu masih kelelahan. Istirahat ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(25, 45)
            const itemGained = generateRandomNumber(1, 2)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["nikel"] = (player.inventory["nikel"] || 0) + itemGained
            player.miningState.stage = 'emas'
            player.miningState.lastMine = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⛏️ HASIL MENAMBANG NIKEL ⛏️\n\nNikel: +${itemGained}\nEXP: +${expGained}\n\nKamu melihat kilauan emas! Ketik .emas untuk melanjutkan.`)
        }

        if (command === 'emas') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (!player.miningState || player.miningState.stage !== 'emas') return Reply(`Kamu belum mencapai lapisan emas. Selesaikan .nikel dulu.`)
            const now = Date.now()
            const cooldown = 5 * 60 * 1000
            if (now - (player.miningState.lastMine || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.miningState.lastMine || 0)))
                return Reply(`Kamu masih kelelahan. Istirahat ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(40, 70)
            const itemGained = 1
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["emas"] = (player.inventory["emas"] || 0) + itemGained
            player.miningState.stage = 'berlian'
            player.miningState.lastMine = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⛏️ HASIL MENAMBANG EMAS ⛏️\n\nEmas: +${itemGained}\nEXP: +${expGained}\n\nWow! Kamu menemukan kilauan berlian di ujung terowongan! Ketik .berlian untuk melanjutkan.`)
        }

        if (command === 'berlian') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (!player.miningState || player.miningState.stage !== 'berlian') return Reply(`Kamu belum mencapai dasar tambang. Selesaikan .emas dulu.`)
            const now = Date.now()
            const cooldown = 7 * 60 * 1000
            if (now - (player.miningState.lastMine || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.miningState.lastMine || 0)))
                return Reply(`Kamu masih kelelahan. Istirahat ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(80, 150)
            const itemGained = 1
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["berlian"] = (player.inventory["berlian"] || 0) + itemGained
            player.miningState.stage = 'permukaan'
            player.miningState.lastMine = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`⛏️ HASIL MENAMBANG BERLIAN ⛏️\n\n✨ BERLIAN LANGKA! ✨\nBerlian: +${itemGained}\nEXP: +${expGained}\n\nKamu berhasil menemukan berlian berharga! Tambang telah reset, kamu bisa mulai lagi dari awal.`)
        }

        if (command === 'meramu' || command === 'foraging') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (player.location !== 'padang_rumput') return Reply(`Kamu harus berada di Padang Rumput Liar untuk meramu. Gunakan .rpgmove padang_rumput.`)
            const now = Date.now()
            const cooldown = 5 * 60 * 1000
            if (now - (player.lastForage || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.lastForage || 0)))
                return Reply(`Tanaman herbal belum tumbuh kembali. Coba lagi ${timeLeft} lagi.`)
            }
            const locationData = rpgDB.locations.padang_rumput
            if (!locationData.herbs) return Reply(`Tidak ada bahan yang bisa diramu di sini!`)
            let gainedHerbs = []
            if (!player.inventory) player.inventory = {}
            for (const [herb, chance] of Object.entries(locationData.herbs)) {
                if (Math.random() < chance) {
                    const amount = generateRandomNumber(1, 4)
                    player.inventory[herb] = (player.inventory[herb] || 0) + amount
                    gainedHerbs.push(`${rpgDB.items[herb]?.name || herb} x${amount}`)
                }
            }
            if (gainedHerbs.length === 0) {
                gainedHerbs.push("Rumput Liar x2")
                player.inventory["rumput_liar"] = (player.inventory["rumput_liar"] || 0) + 2
            }
            const expGained = generateRandomNumber(8, 20)
            gainExp(player, expGained)
            player.lastForage = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🌿 HASIL MERAMU 🌿\n\n${gainedHerbs.join('\n')}\nEXP: +${expGained}`)
        }

        if (command === 'dungeon') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (player.dungeonState?.inDungeon) {
                const dungeon = rpgDB.dungeons[player.dungeonState.id]
                if (!dungeon) return Reply(`Data dungeon tidak ditemukan!`)
                if (player.dungeonState.stage < dungeon.stages.length) {
                    const stageInfo = dungeon.stages[player.dungeonState.stage]
                    const monster = rpgDB.monsters[stageInfo.monsterId]
                    return Reply(`🔥 DUNGEON: ${dungeon.name} 🔥\nStage ${player.dungeonState.stage + 1}/${dungeon.stages.length + 1}\n\n👾 Musuh: ${monster.name} (${stageInfo.count} ekor)\n❤️ HP-mu: ${player.dungeonState.hp}/${player.maxHp}\n\nGunakan .dungeon attack untuk melanjutkan pertarungan!`)
                } else {
                    const boss = rpgDB.monsters[dungeon.boss]
                    return Reply(`👑 BOSS FIGHT! 👑\n${dungeon.name} - Stage Akhir\n\n👾 BOSS: ${boss.name}\n❤️ HP-mu: ${player.dungeonState.hp}/${player.maxHp}\n\nGunakan .dungeon attack untuk melawan bos!`)
                }
            }
            if (!text) {
                let dungeonList = `⚔️ DAFTAR DUNGEON ⚔️\n\n`
                for (const [id, d] of Object.entries(rpgDB.dungeons)) {
                    dungeonList += `${d.name} (Min Level ${d.minLevel})\n.dungeon start ${id}\n\n`
                }
                addLimit(m.sender, isPremium, isCreator)
                return Reply(dungeonList)
            }
            const [action, dungeonId] = text.split(' ')
            if (action === 'start' && dungeonId) {
                const dungeon = rpgDB.dungeons[dungeonId]
                if (!dungeon) return Reply(`Dungeon tidak ditemukan.`)
                if (player.level < dungeon.minLevel) return Reply(`Levelmu terlalu rendah! Minimal level ${dungeon.minLevel} untuk masuk dungeon ini.`)
                player.dungeonState = {
                    inDungeon: true,
                    id: dungeonId,
                    stage: 0,
                    hp: player.hp
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                addLimit(m.sender, isPremium, isCreator)
                return Reply(`🚪 MEMASUKI DUNGEON: ${dungeon.name} 🚪\n\nBersiaplah menghadapi ${dungeon.stages.length + 1} stage pertempuran (termasuk bos)!\n\nGunakan .dungeon untuk melihat status pertarungan.`)
            }
            if (action === 'attack') {
                if (!player.dungeonState?.inDungeon) return Reply(`Kamu sedang tidak berada di dalam dungeon.`)
                return Reply(`Gunakan .dungeon untuk melihat status dungeon terlebih dahulu.`)
            }
        }

        if (command === 'adopsipet' || command === 'adoptpet') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (player.pet) return Reply(`Kamu sudah memiliki peliharaan! Nama: ${player.pet.name}`)
            if (!text) {
                let petList = `🐾 TOKO PELIHARAAN 🐾\n\n`
                for (const [id, pet] of Object.entries(rpgDB.petData)) {
                    petList += `${pet.name}\n${pet.description}\nHarga: ${formatIDR(pet.cost)}\n.adopsipet ${id}\n\n`
                }
                return Reply(petList)
            }
            const petId = text.toLowerCase().trim()
            const petInfo = rpgDB.petData[petId]
            if (!petInfo) return Reply(`Peliharaan tidak tersedia.`)
            if (player.gold < petInfo.cost) return Reply(`uang tidak cukup! Butuh ${formatIDR(petInfo.cost)}.`)
            player.gold -= petInfo.cost
            player.pet = {
                id: petId,
                name: petInfo.name,
                level: 1,
                exp: 0,
                attack: petInfo.attack || 0,
                defense: petInfo.defense || 0
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🎉 SELAMAT! 🎉\n\nKamu berhasil mengadopsi ${petInfo.name}!\n${petInfo.description}\n\nKetik .infopet untuk melihat statistik peliharaanmu.`)
        }

        if (command === 'infopet' || command === 'petinfo') {
            if (!rpgDB.players[m.sender]?.pet) return Reply(`Kamu belum memiliki peliharaan. Gunakan .adopsipet untuk mengadopsi.`)
            const pet = rpgDB.players[m.sender].pet
            let petStats = `🐾 INFO PELIHARAAN 🐾\n\nNama: ${pet.name}\nLevel: ${pet.level}\nEXP: ${pet.exp}/100`
            if (pet.attack > 0) petStats += `\n⚔️ Attack: +${pet.attack}`
            if (pet.defense > 0) petStats += `\n🛡️ Defense: +${pet.defense}`
            addLimit(m.sender, isPremium, isCreator)
            return Reply(petStats)
        }

        if (command === 'quest') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (player.activeQuest) {
                const quest = rpgDB.quests[player.activeQuest]
                return Reply(`📜 QUEST AKTIF 📜\n\n${quest.title}\n${quest.description}\nProgress: ${player.questProgress || 0}/${quest.count}\n\nSelesaikan quest untuk mendapatkan hadiah!`)
            }
            if (player.location !== 'desa') return Reply(`Kamu harus berada di Desa Pemula untuk mengambil quest. Gunakan .rpgmove desa.`)
            if (!text) {
                let questList = `📜 QUEST TERSEDIA 📜\n\n`
                for (const [id, quest] of Object.entries(rpgDB.quests)) {
                    questList += `${quest.title}\nHadiah: ${quest.reward.exp} EXP, ${formatIDR(quest.reward.gold)}\n.quest ${id}\n\n`
                }
                addLimit(m.sender, isPremium, isCreator)
                return Reply(questList)
            }
            const questId = text.toLowerCase().trim()
            if (!rpgDB.quests[questId]) return Reply(`Quest tidak ditemukan.`)
            player.activeQuest = questId
            player.questProgress = 0
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`✅ QUEST DIAMBIL!\n\n${rpgDB.quests[questId].title}\n${rpgDB.quests[questId].description}\n\nSemoga berhasil, Petualang!`)
        }

        if (command === 'craft') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            if (!text) {
                let recipeList = `🛠️ RESEP CRAFT 🛠️\n\n`
                for (const [id, recipe] of Object.entries(rpgDB.craftingRecipes)) {
                    recipeList += `${recipe.name} (x${recipe.amount})\nBahan: ${Object.entries(recipe.materials).map(([mat, count]) => `${rpgDB.items[mat]?.name || mat} x${count}`).join(', ')}\n.craft ${id}\n\n`
                }
                addLimit(m.sender, isPremium, isCreator)
                return Reply(recipeList)
            }
            const recipeId = text.toLowerCase().trim()
            if (!rpgDB.craftingRecipes[recipeId]) return Reply(`Resep tidak ditemukan.`)
            const recipe = rpgDB.craftingRecipes[recipeId]
            for (const [material, required] of Object.entries(recipe.materials)) {
                if (!player.inventory || !player.inventory[material] || player.inventory[material] < required) {
                    return Reply(`Bahan tidak cukup! Butuh ${rpgDB.items[material]?.name || material} x${required} lagi.`)
                }
            }
            if (!player.inventory) player.inventory = {}
            for (const [material, required] of Object.entries(recipe.materials)) {
                player.inventory[material] -= required
                if (player.inventory[material] <= 0) delete player.inventory[material]
            }
            player.inventory[recipe.result] = (player.inventory[recipe.result] || 0) + recipe.amount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🔨 CRAFT BERHASIL! 🔨\n\n${recipe.name} (x${recipe.amount}) berhasil dibuat dan masuk ke inventorymu!`)
        }

        if (command === 'daily') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            const player = rpgDB.players[m.sender]
            const cooldown = 24 * 60 * 60 * 1000
            if (Date.now() - (player.lastDaily || 0) < cooldown) {
                const timeLeft = new Date((player.lastDaily || 0) + cooldown)
                return Reply(`Kamu sudah mengambil hadiah harian hari ini. Coba lagi besok jam ${timeLeft.toLocaleTimeString('id-ID')}.`)
            }
            const goldReward = 100 + (player.level * 10)
            const expReward = 50 + (player.level * 5)
            player.gold += goldReward
            player.exp += expReward
            player.lastDaily = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🎁 DAILY REWARD 🎁\n\n💵 Uang: +${formatIDR(goldReward)}\n⭐ EXP: +${expReward}\n\nJangan lupa claim lagi besok!`)
        }

        if (command === 'pvp') {
            if (!rpgDB.players[m.sender]) return Reply(`Kamu belum memulai petualangan! Ketik .rpgstart untuk memulai.`)
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid') && m.metadata && m.metadata.participants) {
                        let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                        if (p && p.jid) targetJid = p.jid
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }
            if (!targetJid) return Reply(`Tag atau reply user yang ingin diajak duel!\nContoh: .pvp @user`)
            if (targetJid === m.sender) return Reply(`Tidak bisa duel dengan diri sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`Lawan belum memulai petualangan RPG!`)
            const player = rpgDB.players[m.sender]
            const opponent = rpgDB.players[targetJid]
            const now = Date.now()
            const cooldown = 5 * 60 * 1000
            if (now - (player.lastPvp || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (now - (player.lastPvp || 0)))
                return Reply(`Kamu masih dalam masa cooldown PvP. Coba lagi ${timeLeft} lagi.`)
            }
            player.lastPvp = now
            let playerHp = player.hp
            let opponentHp = opponent.hp
            let log = [`⚔️ DUEL PVP ⚔️\n\n@${m.sender.split('@')[0]} VS @${targetJid.split('@')[0]}\n`]
            let turn = player.agility > opponent.agility ? m.sender : targetJid
            while (playerHp > 0 && opponentHp > 0) {
                if (turn === m.sender) {
                    const damage = Math.max(1, getPlayerTotalStats(player, rpgDB).attack - getPlayerTotalStats(opponent, rpgDB).defense)
                    opponentHp -= damage
                    log.push(`🗡️ @${m.sender.split('@')[0]} menyerang! Damage: ${damage}`)
                    log.push(`🛡️ HP lawan tersisa: ${opponentHp}`)
                    turn = targetJid
                } else {
                    const damage = Math.max(1, getPlayerTotalStats(opponent, rpgDB).attack - getPlayerTotalStats(player, rpgDB).defense)
                    playerHp -= damage
                    log.push(`🗡️ @${targetJid.split('@')[0]} menyerang balik! Damage: ${damage}`)
                    log.push(`❤️ HP-mu tersisa: ${playerHp}`)
                    turn = m.sender
                }
            }
            if (playerHp <= 0) {
                log.push(`\n💀 KAMU KALAH! 💀`)
                player.pvpLosses += 1
                opponent.pvpWins += 1
                const goldStolen = Math.floor(player.gold * 0.05)
                player.gold -= goldStolen
                opponent.gold += goldStolen
                log.push(`💵 ${formatIDR(goldStolen)} berpindah ke pemenang!`)
            } else {
                log.push(`\n🏆 KAMU MENANG! 🏆`)
                player.pvpWins += 1
                opponent.pvpLosses += 1
                const goldStolen = Math.floor(opponent.gold * 0.05)
                player.gold += goldStolen
                opponent.gold -= goldStolen
                log.push(`💵 Kamu mendapat ${formatIDR(goldStolen)} dari lawan!`)
            }
            player.hp = playerHp
            opponent.hp = opponentHp
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return alip.sendMessage(m.chat, { text: log.join('\n'), mentions: [m.sender, targetJid] }, { quoted: m })
        }

        if (command === 'leaderboardrpg' || command === 'lb_rpg') {
            const players = Object.entries(rpgDB.players).sort(([,a], [,b]) => b.level - a.level || b.exp - a.exp).slice(0, 5)
            if (players.length === 0) return Reply(`Belum ada petualang di dunia ini.`)
            let text = `🏆 TOP 5 PETUALANG TERKUAT 🏆\n\n`
            let mentions = []
            players.forEach(([jid, player], index) => {
                text += `${index + 1}. @${jid.split('@')[0]} — Level ${player.level}\n`
                mentions.push(jid)
            })
            addLimit(m.sender, isPremium, isCreator)
            return alip.sendMessage(m.chat, { text: text, mentions: mentions }, { quoted: m })
        }

        if (command === 'mancingstart') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (!player.fishing) player.fishing = { isFishing: false, lastCatch: 0 }
            player.fishing.isFishing = true
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`🎣 PANCING SIAP! 🎣\n\nKail sudah dilempar ke air.\nGunakan .mancing untuk mulai menarik!`)
        }

        if (command === 'mancing') {
            if (!rpgDB.players[m.sender]?.fishing?.isFishing) return Reply(`Kamu belum memulai memancing. Gunakan .mancingstart dulu.`)
            let player = rpgDB.players[m.sender]
            const now = Date.now()
            const cooldown = 60000
            if (now - (player.fishing.lastCatch || 0) < cooldown) {
                const timeLeft = Math.ceil((cooldown - (now - (player.fishing.lastCatch || 0))) / 1000)
                return Reply(`🎣 Tunggu ${timeLeft} detik lagi, ikannya belum menggigit.`)
            }
            const catches = [
                { name: 'Ikan Lele', gold: 15, exp: 10, msg: 'Kamu mendapatkan Ikan Lele yang lumayan besar!' },
                { name: 'Ikan Nila', gold: 10, exp: 7, msg: 'Seekor Ikan Nila berhasil kamu tangkap.' },
                { name: 'Sepatu Butut', gold: 1, exp: 1, msg: 'Sial, yang nyangkut malah sepatu butut.' },
                { name: 'Sampah Plastik', gold: 0, exp: 1, msg: 'Hmm, hanya sampah plastik. Setidaknya kamu membersihkan sungai.' },
                { name: 'Harta Karun Kecil', gold: 100, exp: 30, msg: 'WOW! Kamu menemukan kotak berisi harta karun kecil!' },
                { name: 'Ikan Mas', gold: 25, exp: 15, msg: 'Kailmu disambar Ikan Mas berwarna keemasan!' }
            ]
            let caught = catches[Math.floor(Math.random() * catches.length)]
            player.gold += caught.gold
            let leveledUp = gainExp(player, caught.exp)
            player.fishing.lastCatch = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            let replyMsg = `🎣 HASIL MANCING 🎣\n\n${caught.msg}\n💵 Uang: +${formatIDR(caught.gold)}\n⭐ EXP: +${caught.exp}`
            if (leveledUp) replyMsg += `\n\n🎊 LEVEL UP! Sekarang Level ${player.level}! 🎊`
            addLimit(m.sender, isPremium, isCreator)
            return Reply(replyMsg)
        }

        if (command === 'judionline') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.gold < 100) return Reply(`uang tidak cukup untuk berjudi! Minimal uang Rp 100`)
            player.gold -= 100
            const results = [
                { name: "JACKPOT! Kamu menang besar!", exp: 100, gold: 2000, hp: 0 },
                { name: "Kalah total... Uang habis dimakan bandar.", exp: 10, gold: 0, hp: -5 },
                { name: "Menang tipis, balik modal.", exp: 5, gold: 100, hp: 0 },
                { name: "Kalah terus sampai harus jual barang.", exp: 5, gold: -50, hp: -10 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🎰 JUDI ONLINE 🎰\n\n${reward.name}\n💵 Uang: ${reward.gold >= 0 ? '+' : '-'}${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}\n💵 Sisa uang: ${formatIDR(player.gold)}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'begal') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 25) return Reply(`HP-mu terlalu rendah untuk berbegal! Istirahat dulu.`)
            const results = [
                { name: "Berhasil merampok! Dapat banyak!", exp: 30, gold: 300, hp: -10 },
                { name: "Target melawan! Kamu babak belur.", exp: 10, gold: 10, hp: -25 },
                { name: "Target ternyata preman! Kabur sambil babak belur.", exp: 5, gold: 0, hp: -15 },
                { name: "Sukses besar! Dapat barang berharga!", exp: 50, gold: 500, hp: -15 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🔪 BEGAL JALANAN 🔪\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'maling') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 15) return Reply(`HP-mu terlalu rendah untuk mencuri! Istirahat dulu.`)
            const results = [
                { name: "Berhasil mencuri dompet!", exp: 25, gold: 200, hp: -5 },
                { name: "Ketahuan warga! Dihakimi massa.", exp: 5, gold: 0, hp: -20 },
                { name: "Dapat kotak kosong...", exp: 2, gold: 1, hp: -3 },
                { name: "Salah sasaran, curi dompet polisi!", exp: 10, gold: 0, hp: -30 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🥷 MALING MALAM 🥷\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'ngojek') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 8) return Reply(`HP-mu terlalu rendah untuk mengojek! Istirahat dulu.`)
            const results = [
                { name: "Dapat orderan jauh! Bonus lumayan.", exp: 15, gold: 70, hp: -8 },
                { name: "Orderan deket, hasil standar.", exp: 8, gold: 30, hp: -5 },
                { name: "Kecelakaan kecil...", exp: 5, gold: 10, hp: -15 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🛵 NGOJEK 🛵\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'ngaji') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 3) return Reply(`Kamu terlalu lelah untuk mengaji. Istirahat dulu.`)
            const results = [
                { name: "Hati menjadi tenang.", exp: 20, gold: 0, hp: 10 },
                { name: "Mendapat ilmu baru.", exp: 15, gold: 0, hp: 5 },
                { name: "Ketiduran saat mengaji...", exp: 5, gold: 0, hp: -3 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp > player.maxHp) player.hp = player.maxHp
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `📖 NGAJI 📖\n\n${reward.name}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp > 0 ? '+' : ''}${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'kerja') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 8) return Reply(`HP-mu terlalu rendah untuk bekerja! Istirahat dulu.`)
            const results = [
                { name: "Lembur dapat bonus!", exp: 20, gold: 150, hp: -10 },
                { name: "Kerja santai, gaji standar.", exp: 10, gold: 50, hp: -5 },
                { name: "Dimarahi bos...", exp: 5, gold: 30, hp: -8 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `💼 KERJA 💼\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'jobkerja') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 8) return Reply(`HP-mu terlalu rendah untuk kerja part time! Istirahat dulu.`)
            const results = [
                { name: "Jadi kuli bangunan.", exp: 15, gold: 100, hp: -12 },
                { name: "Jadi admin warnet.", exp: 12, gold: 60, hp: -7 },
                { name: "Kerja part-time di kafe.", exp: 18, gold: 80, hp: -10 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🧑‍🔧 KERJA PART TIME 🧑‍🔧\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }

        if (command === 'berkebun') {
            if (!rpgDB.players[m.sender]) rpgDB.players[m.sender] = initPlayerRPG(m.sender)
            let player = rpgDB.players[m.sender]
            if (player.hp < 6) return Reply(`HP-mu terlalu rendah untuk berkebun! Istirahat dulu.`)
            const results = [
                { name: "Panen melimpah!", exp: 25, gold: 120, hp: -10 },
                { name: "Panen sayur mayur.", exp: 15, gold: 70, hp: -5 },
                { name: "Tanaman dimakan hama.", exp: 8, gold: 30, hp: -7 }
            ]
            let reward = results[Math.floor(Math.random() * results.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            let msg = `🌽 BERKEBUN 🌽\n\n${reward.name}\n💵 Uang: +${formatIDR(reward.gold)}\n⭐ EXP: +${reward.exp}\n❤️ HP: ${reward.hp}`
            if (leveled) msg += `\n\n🎊 LEVEL UP! Level ${player.level}! 🎊`
            return Reply(msg)
        }
            if (command === 'slot') {
        if (!isUserRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi)
        if (global.isSlotRunning) return Reply("❌ Slot sedang digunakan oleh pemain lain, tunggu sebentar ya!")
        let jid = m.sender
        if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
        let player = rpgDB.players[jid]
        let cooldown = 3600000
        let lastSlot = player.lastSlot || 0
        if (Date.now() - lastSlot < cooldown) {
            let remaining = cooldown - (Date.now() - lastSlot)
            let minutes = Math.floor((remaining / (1000 * 60)) % 60)
            let seconds = Math.floor((remaining / 1000) % 60)
            return Reply(`❌ Kamu sudah main slot! Tunggu *${minutes} menit ${seconds} detik* lagi untuk bermain kembali`)
        }
        let q = text.trim()
        if (!q) return Reply(`Contoh: .${command} 10000`)
        let amount = parseInt(q.replace(/\D/g, ''))
        if (isNaN(amount) || amount < 10000) return Reply("❌ Minimal taruhan slot adalah 10.000!")
        let currentGold = Number(player.gold) || 0
        if (currentGold < amount) return Reply(`❌ Uang kamu tidak mencukupi! Saldo saat ini: ${formatIDR(currentGold)}`)
        global.isSlotRunning = true
        player.gold = currentGold - amount
        player.lastSlot = Date.now()
        const emojis = ["🍎", "🍊", "🍇", "🍒", "🍓", "🍋", "🔔", "💎", "7️⃣", "🎰"]
        const getGrid = () => {
            return [
                [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]],
                [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]],
                [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]]
            ]
        }
        const formatGrid = (grid) => {
            return grid.map(row => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join("\n")
        }
        try {
            let { key } = await alip.sendMessage(m.chat, { text: "🎰 *SLOT ROLLING* 🎰\n\n" + formatGrid(getGrid()) }, { quoted: m })
            for (let i = 0; i < 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 800))
                await alip.sendMessage(m.chat, { text: "🎰 *SLOT ROLLING* 🎰\n\n" + formatGrid(getGrid()), edit: key })
            }
           let finalGrid = getGrid()
            let [row1, row2, row3] = finalGrid
            let multiplier = 0
            let status = "RUNGKAD"
            let allSymbols = finalGrid.flat()
            let scatterCount = allSymbols.filter(s => s === "🎰").length
            if (row2[0] === row2[1] && row2[1] === row2[2]) {
                multiplier = row2[0] === "7️⃣" ? 50 : 20
                status = "JACKPOT TENGAH! 🎉"
            } else if (scatterCount >= 3) {
                multiplier = 10
                status = "SCATTER BONUS! 🎰"
            } else if (row1[0] === row1[1] && row1[1] === row1[2] || row3[0] === row3[1] && row3[1] === row3[2]) {
                multiplier = 5
                status = "MENANG BARIS! 💰"
            } else if (new Set(row2).size < 3) {
                multiplier = 2
                status = "COCOK 2! ✨"
            }
            let winnings = Math.floor(amount * multiplier)
            player.gold += winnings
            if (typeof gainExp === 'function') gainExp(player, multiplier > 0 ? 150 : 20)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            let resultCaption = `🎰 *SLOT RESULT* 🎰\n\n`
            resultCaption += formatGrid(finalGrid) + `\n\n`
            resultCaption += `*Hasil:* ${status}\n`
            resultCaption += `*Taruhan:* ${formatIDR(amount)}\n`
            resultCaption += `*Dapat:* ${formatIDR(winnings)}\n`
            resultCaption += `*Total Uang:* ${formatIDR(player.gold)}\n`
            await new Promise(resolve => setTimeout(resolve, 1000))
            await alip.sendMessage(m.chat, { text: resultCaption, edit: key })
        } catch (e) {
            console.error(e)
        } finally {
            global.isSlotRunning = false
        }
    }
    if (['trading', 'trade', 'trader'].includes(command)) {
        if (!isUserRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi)
        let jid = m.sender
        if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
        let player = rpgDB.players[jid]
        let currentGold = Number(player.gold) || 0
        let q = text.trim()
        if (!q) return Reply(`Contoh: .${command} 5000`)
        let amount = parseInt(q.replace(/\D/g, ''))
        if (isNaN(amount) || amount <= 0) return Reply("❌ Masukkan jumlah uang yang valid!")
        if (currentGold < amount) return Reply(`❌ Uang kamu tidak mencukupi! Saldo: ${formatIDR(currentGold)}`)
        player.gold = currentGold - amount
        const outcomes = [
            { status: "PROFIT ABIS!", multi: 2.5, exp: 50, msg: "Analisa teknikalmu jitu! Market pump gila-gilaan." },
            { status: "PROFIT", multi: 1.5, exp: 30, msg: "Lumayan dapet cuan dari scalping." },
            { status: "SIDEWAYS", multi: 1.0, exp: 10, msg: "Market lagi tenang, modalmu balik utuh." },
            { status: "LOSS", multi: 0.5, exp: 5, msg: "Market koreksi tajam, asetmu terpotong setengah." },
            { status: "LIQUIDATED!", multi: 0, exp: 2, msg: "Kena margin call! Saldo tradingmu ludes." }
        ]
        let result = outcomes[Math.floor(Math.random() * outcomes.length)]
        let winnings = Math.floor(amount * result.multi)
        player.gold += winnings
        if (typeof gainExp === 'function') gainExp(player, result.exp)
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        let caption = `📈 *TRADING SIMULATOR* 📈\n\n`
        caption += `*Hasil:* ${result.status}\n`
        caption += `*Keterangan:* ${result.msg}\n\n`
        caption += `📊 *Statistik:*\n`
        caption += `• Modal: ${formatIDR(amount)}\n`
        caption += `• Hasil: ${formatIDR(winnings)}\n`
        caption += `• EXP: +${result.exp}\n`
        caption += `• Total Uang: ${formatIDR(player.gold)}\n`
        Reply(caption)
    }
        if (command === 'tfuang') {
            if (!isCreator) return Reply(`Hanya owner yang bisa transfer uang antar user!`)
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid') && m.metadata && m.metadata.participants) {
                        let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                        if (p && p.jid) targetJid = p.jid
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }
            if (!targetJid) return Reply(`Tag atau reply user yang akan menerima transfer!\nContoh: .tfuang 1000 @user`)
            if (targetJid === m.sender) return Reply(`Tidak bisa transfer ke diri sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`User tersebut belum memulai petualangan RPG!`)
            const args = text.trim().split(' ')
            const amount = parseInt(args[0])
            if (isNaN(amount) || amount <= 0) return Reply(`Masukkan jumlah uang yang valid!`)
            const senderPlayer = rpgDB.players[m.sender]
            if (senderPlayer.gold < amount) return Reply(`Gold tidak cukup! Kamu hanya memiliki ${formatIDR(senderPlayer.gold)}.`)
            senderPlayer.gold -= amount
            rpgDB.players[targetJid].gold += amount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            addLimit(m.sender, isPremium, isCreator)
            return Reply(`💸 TRANSFER UANG BERHASIL 💸\n\nPenerima: @${targetJid.split('@')[0]}\nJumlah: ${formatIDR(amount)}\nSisa uangmu: ${formatIDR(senderPlayer.gold)}`, [targetJid])
        }

    } catch (error) {
        console.error('RPG Plugin Error:', error)
        Reply(`❌ Terjadi kesalahan pada sistem RPG: ${error.message}`)
    }
}

Object.assign(module.exports, {
    command: [
        'adduang', 'cekgold', 'topuang',
        'rpgstart', 'rpgstats', 'rpgexplore', 'attack', 'skill', 'flee', 'rpgmove', 'rpginv', 'rpgshop', 'buy', 'sell', 'use',
        'equip', 'unequip', 'item', 'rpghelp', 'tambang', 'mining', 'besi', 'nikel', 'emas', 'berlian', 'meramu', 'foraging',
        'dungeon', 'adopsipet', 'adoptpet', 'infopet', 'petinfo', 'judionline', 'begal', 'maling', 'openbo', 'ngocok', 'ngelonte',
        'quest', 'craft', 'daily', 'pvp', 'leaderboardrpg', 'lb_rpg', 'mancingstart', 'mancing', 'ngojek', 'ngaji', 'kerja', 'jobkerja', 'berkebun', 'tfuang', 'slot', 'trading', 'trade', 'trader'
    ]
})