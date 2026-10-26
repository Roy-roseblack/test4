document.addEventListener('DOMContentLoaded', checkAuth);

let allPlayers = {};
let playerData = {};
let clanData = {};

async function checkAuth() {
    try {
        // Parallelize auth check and data load to eliminate request waterfall
        const [authRes, dataRes] = await Promise.all([
            fetch('/api/me'),
            fetch('/players.json')
        ]);

        if (authRes.ok) {
            const user = await authRes.json();
            const data = await dataRes.json();

            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('mainDashboard').classList.add('show');

            // Pass already fetched data to loadUserData to avoid another fetch
            await loadUserData(user.username, data);
        } else {
            document.getElementById('auth-overlay').classList.remove('hidden');
            document.getElementById('mainDashboard').classList.remove('show');
        }
    } catch (e) { console.error("Auth check failed", e); }
}

async function loadUserData(username, preFetchedData = null) {
    try {
        let data;
        if (preFetchedData) {
            data = preFetchedData;
        } else {
            const response = await fetch('/players.json');
            data = await response.json();
        }
        allPlayers = data;
        const userKey = username.toLowerCase().split(' ')[0];

        if (!data[userKey]) {
            console.warn("User not found in players.json, using default profile.");
            playerData = data['dean'] || {};
        } else {
            playerData = data[userKey];
        }

        clanData = (playerData.clan && data.clans) ? data.clans[playerData.clan] : { members: [] };

        document.documentElement.style.setProperty('--primary', playerData.themeColor || '#fbbf24');
        document.documentElement.style.setProperty('--glow', (playerData.themeColor || '#fbbf24') + '44');
        document.getElementById('glow1').style.background = playerData.themeColor || '#fbbf24';
        document.getElementById('glow2').style.background = playerData.themeColor || '#fbbf24';

        animateValue("totalPoints", 0, playerData.totalPoints || 0, 1500);
        animateValue("currentPoints", 0, playerData.currentPoints || 0, 1200);
        animateValue("savedPoints", 0, playerData.savedPoints || 0, 1200);

        document.getElementById('profName').textContent = playerData.name || 'Unknown';
        document.getElementById('profId').textContent = `ID: #${playerData.id || '00000000'}`;
        document.getElementById('profClan').textContent = playerData.clan || 'No Clan';
        document.getElementById('avatarInitial').textContent = (playerData.name || 'U').charAt(0);
        document.getElementById('playerName').textContent = playerData.name || 'Unknown';
        document.getElementById('playerClan').textContent = playerData.clan || 'No Clan';
        document.getElementById('reviewMem').textContent = playerData.reviewMemorization || '0%';

        const imp = playerData.improvements || { total: '0%', current: '0%', saved: '0%', mem: '0%' };
        document.getElementById('totalImprovement').textContent = `+${imp.total} this month`;
        document.getElementById('currentImprovement').textContent = `+${imp.current}`;
        document.getElementById('savedImprovement').textContent = `+${imp.saved}`;
        document.getElementById('memImprovement').textContent = `+${imp.mem} from last week`;

        const isLeader = clanData.members && clanData.members.find(m => m.name === playerData.name && m.role === 'Leader');
        if (isLeader) document.getElementById('leaderBtn').style.display = 'block';
    } catch (err) { console.error("Data load failed", err); }
}

async function handleLogin() {
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    if (res.ok) {
        showSuccess("Access Granted", async () => {
            const data = await res.json();
            await loadUserData(data.username || username);
            document.getElementById('auth-overlay').classList.add('hidden');
            document.getElementById('mainDashboard').classList.add('show');
        });
    } else {
        alert("Login failed. Check credentials.");
    }
}

async function handleSignup() {
    const username = document.getElementById('sign-user').value;
    const password = document.getElementById('sign-pass').value;
    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });
    if (res.ok) {
        showSuccess("Account Created", () => {
            toggleAuth(false);
        });
    } else {
        const data = await res.json();
        alert(data.error || "Signup failed.");
    }
}

function showSuccess(msg, callback) {
    const overlay = document.getElementById('success-overlay');
    document.getElementById('success-msg').textContent = msg;
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.opacity = '1';
            callback();
        }, 500);
    }, 1500);
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
}

function toggleAuth(showSignup) {
    document.getElementById('login-box').style.display = showSignup ? 'none' : 'block';
    document.getElementById('signup-box').style.display = showSignup ? 'block' : 'none';
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.innerHTML = value.toLocaleString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function openClanModal() {
    const overlay = document.getElementById('clanModal');
    const content = document.getElementById('clanModalContent');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.remove('hide'); overlay.classList.add('show');
        content.classList.remove('hide'); content.classList.add('show');
    }, 10);
    document.getElementById('modalClanName').textContent = clanData.name || playerData.clan;
    document.getElementById('clanImprovement').textContent = `+${clanData.monthlyImprovement || '0%'} Clan Growth This Month`;
    const list = document.getElementById('memberList');
    list.innerHTML = "";
    (clanData.members || []).forEach((member, index) => {
        const item = document.createElement('div');
        item.className = 'member-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.innerHTML = `
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role === 'Leader' ? `<span class="role-leader">Leader</span>` : member.role}</div>
            </div>
            <div class="stat-value" style="font-size: 1.1rem;">${member.points.toLocaleString()}</div>
        `;
        list.appendChild(item);
    });
}

function openCommandCenter() {
    const overlay = document.getElementById('commandModal');
    const content = document.getElementById('commandModalContent');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.remove('hide'); overlay.classList.add('show');
        content.classList.remove('hide'); content.classList.add('show');
    }, 10);
    const members = clanData.members || [];
    if (members.length === 0) {
        document.getElementById('globalPower').textContent = '0';
        document.getElementById('avgPower').textContent = '0';
        document.getElementById('activeMembers').textContent = '0';
        document.getElementById('teamTbody').innerHTML = '';
        return;
    }
    const globalTotal = members.reduce((sum, m) => sum + m.points, 0);
    const avgPower = Math.floor(globalTotal / members.length);
    document.getElementById('globalPower').textContent = globalTotal.toLocaleString();
    document.getElementById('avgPower').textContent = avgPower.toLocaleString();
    document.getElementById('activeMembers').textContent = members.length;
    const tbody = document.getElementById('teamTbody');
    tbody.innerHTML = "";
    const leaderPoints = Math.max(...members.map(m => m.points));

    // Build HTML as a single string to avoid repeated DOM reflows in the loop
    let rowsHtml = "";
    members.forEach(member => {
        const powerPct = (member.points / leaderPoints) * 100;
        const userKey = member.name.split(' ')[0].toLowerCase();
        const detail = allPlayers[userKey] || { currentPoints: 0, savedPoints: 0, reviewMemorization: '0%', improvements: { total: '0%' } };
        let status = "Stable";
        let statusClass = "status-stable";
        if (member.points > 20000) { status = "Rising Star"; statusClass = "status-rising"; }

        rowsHtml += `
            <tr class="team-row">
                <td><div style="font-weight: bold;">${member.name} <span class="status-tag ${statusClass}">${status}</span></div></td>
                <td><span class="${member.role === 'Leader' ? 'role-leader' : ''}">${member.role}</span></td>
                <td>
                    <div class="member-detail-cell">
                        <div style="font-weight: 800; color: var(--primary);">${member.points.toLocaleString()} <span style="font-size: 0.6rem; color: var(--text-muted);">total</span></div>
                        <div class="member-substat">CUR: ${detail.currentPoints.toLocaleString()}</div>
                        <div class="member-substat">SAV: ${detail.savedPoints.toLocaleString()}</div>
                        <div class="member-substat">MEM: ${detail.reviewMemorization}</div>
                        <div class="member-substat" style="color: var(--accent)">INC: +${detail.improvements.total}</div>
                    </div>
                </td>
                <td style="text-align: right;">
                    <button class="edit-member-btn" onclick="editMember('${member.name}')" style="background: var(--primary); color: black; border: none; padding: 5px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 0.7rem; margin-bottom: 10px;">EDIT</button>
                    <div class="power-bar-bg" style="margin-left: 10px;"><div class="power-bar-fill" style="width: ${powerPct}%"></div></div>
                    <div style="font-size: 0.6rem; text-align: right; margin-top: 4px;">${Math.round(powerPct)}%</div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = rowsHtml;
}

async function editMember(name) {
    const userKey = name.split(' ')[0].toLowerCase();
    const detail = allPlayers[userKey];
    if (!detail) return alert("Player data not found");

    const newTotal = prompt(`Edit Total Points for ${name}:`, detail.totalPoints);
    if (newTotal === null) return;

    const newCurrent = prompt(`Edit Current Points for ${name}:`, detail.currentPoints);
    if (newCurrent === null) return;

    const newSaved = prompt(`Edit Saved Points for ${name}:`, detail.savedPoints);
    if (newSaved === null) return;

    let newMem = prompt(`Edit Memorization % for ${name}:`, detail.reviewMemorization);
    if (newMem === null) return;

    if (!newMem.endsWith('%')) {
        newMem = newMem + '%';
    }

    const res = await fetch('/api/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: name,
            stats: {
                totalPoints: parseInt(newTotal),
                currentPoints: parseInt(newCurrent),
                savedPoints: parseInt(newSaved),
                reviewMemorization: newMem
            }
        })
    });

    if (res.ok) {
        alert("Stats updated successfully!");
        window.location.reload();
    } else {
        const err = await res.json();
        alert("Update failed: " + err.error);
    }
}

function closeClanModal() {
    const overlay = document.getElementById('clanModal');
    const content = document.getElementById('clanModalContent');
    overlay.classList.remove('show'); overlay.classList.add('hide');
    content.classList.remove('show'); content.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function closeCommandCenter() {
    const overlay = document.getElementById('commandModal');
    const content = document.getElementById('commandModalContent');
    overlay.classList.remove('show'); overlay.classList.add('hide');
    content.classList.remove('show'); content.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}
