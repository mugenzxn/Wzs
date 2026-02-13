// === EXPÉDITEUR ===
function showExpTab(t) {
    document.getElementById('expTabExpContent').classList.toggle('hidden', t !== 'expeditions');
    document.getElementById('expTabDocsContent').classList.toggle('hidden', t !== 'documents');
    document.getElementById('expTabExp').classList.toggle('active', t === 'expeditions');
    document.getElementById('expTabDocs').classList.toggle('active', t === 'documents');
    if (t === 'documents') renderExpDocs();
}

function loadExp() {
    const ms = gM().filter(m => m.expediteurId === CU?.id);
    const ct = s => ms.filter(m => s === 'progress' ? ['accepted','progress'].includes(m.status) : m.status === s).length;

    document.getElementById('expStats').innerHTML = [
        {f:'all',v:ms.length,l:'Total',c:'slate'},
        {f:'pending',v:ct('pending'),l:'Attente',c:'yellow'},
        {f:'quoted',v:ct('quoted'),l:'Devis',c:'indigo'},
        {f:'progress',v:ct('progress'),l:'En cours',c:'blue'},
        {f:'pending_delivery',v:ct('pending_delivery'),l:'Livr.',c:'orange'},
        {f:'delivered',v:ct('delivered'),l:'Livrées',c:'green'}
    ].map(s =>
        `<div class="kpi-card cursor-pointer hover:border-${s.c}-300" onclick="filterExp('${s.f}')">
            <div class="kpi-val text-${s.c}-600">${s.v}</div>
            <div class="kpi-lbl">${s.l}</div>
        </div>`
    ).join('');

    document.getElementById('expFilterBtns').innerHTML = [
        {f:'all',l:'Toutes'},
        {f:'pending',l:'⏳'},
        {f:'quoted',l:'💰'},
        {f:'progress',l:'🚛'},
        {f:'delivered',l:'✅'}
    ].map(b =>
        `<button onclick="filterExp('${b.f}')" class="px-3 py-1.5 rounded-lg text-xs font-bold ${expFilt===b.f?'bg-blue-600 text-white':'bg-slate-100 text-slate-600'}">
            ${b.l}
        </button>`
    ).join('');

    renderExpList();
}

function filterExp(f) {
    expFilt = f;
    expPg = 1;
    loadExp();
}

function renderExpList() {
    let ms = gM().filter(m => m.expediteurId === CU?.id);
    if (expFilt !== 'all') {
        ms = ms.filter(m =>
            expFilt === 'progress'
                ? ['accepted','progress'].includes(m.status)
                : m.status === expFilt
        );
    }
    const q = (document.getElementById('expSearch')?.value || '').toLowerCase();
    if (q) {
        ms = ms.filter(m =>
            m.ref.toLowerCase().includes(q) ||
            m.fromCity.toLowerCase().includes(q) ||
            (m.dest?.ville || '').toLowerCase().includes(q) ||
            m.nature.toLowerCase().includes(q)
        );
    }
    ms.sort((a,b) => b.ref > a.ref ? 1 : -1);

    const c = document.getElementById('expList');
    const pg = document.getElementById('expPag');
    if (!ms.length) {
        c.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm">Aucune expédition</div>';
        pg.classList.add('hidden');
        return;
    }

    const tp = Math.ceil(ms.length / PP);
    if (expPg > tp) expPg = tp;

    c.innerHTML = ms.slice((expPg-1)*PP, expPg*PP).map(m => {
        const col = sCol(m.status), pct = sPct(m.status);
        return `
        <div class="p-4 hover:bg-slate-50">
            <div class="flex items-center justify-between cursor-pointer"
                 onclick="this.nextElementSibling?.nextElementSibling?.nextElementSibling?.classList.toggle('hidden')">
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-black text-sm">${m.ref}</span>
                        <span class="status-${m.status} px-2 py-0.5 rounded-full text-xs font-bold">${sL(m.status)}</span>
                    </div>
                    <div class="text-xs text-slate-500">
                        ${m.fromCity} → ${m.dest?.ville || '?'} • ${m.type==='aerien'?'✈️':'🚛'}
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-black text-${col}-600 text-sm">${m.prixC ? m.prixC+' €' : '—'}</div>
                    <div class="text-xs text-slate-400">${m.poids}kg</div>
                </div>
            </div>
            <div class="mt-1">
                <div class="w-full h-1.5 bg-slate-100 rounded-full">
                    <div class="h-full rounded-full bg-${col}-500" style="width:${pct}%"></div>
                </div>
            </div>
            ${m.status==='quoted'
                ? `<div class="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                        <span class="text-indigo-900 font-bold text-xs">💰 ${m.devis.length} proposition(s)</span>
                        <button onclick="event.stopPropagation();showDevis('${m.ref}')" class="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">Voir</button>
                   </div>`
                : ''
            }
            <div class="hidden mt-3 pt-3 border-t border-slate-100 text-sm">
                <div class="grid md:grid-cols-2 gap-2 mb-2">
                    <div class="p-2 bg-white border rounded-lg text-xs">
                        <strong>📤</strong> ${m.fromCity} — ${m.fromAddr}<br>📅 ${m.date}
                    </div>
                    <div class="p-2 bg-white border rounded-lg text-xs">
                        <strong>📥</strong> ${m.dest?.nom || '?'}<br>${m.dest?.addr1 || ''}, ${m.dest?.cp || ''} ${m.dest?.ville || ''}
                    </div>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg mb-2 text-xs">
                    ${m.nature} • ${m.poids}kg • ${m.um} UM${m.instructions ? ' • <em>'+m.instructions+'</em>' : ''}
                </div>
                <div class="flex gap-1">
                    ${m.status==='pending'
                        ? `<button onclick="genDeclValeur('${m.ref}')" class="px-2 py-1 bg-cyan-600 text-white rounded text-xs font-bold">💎 Décl. valeur</button>`
                        : ''
                    }
                    ${m.status==='delivered'
                        ? `<button onclick="viewPhotos('${m.ref}')" class="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">📷</button>`
                        : ''
                    }
                </div>
            </div>
        </div>`;
    }).join('');

    if (tp > 1) {
        pg.classList.remove('hidden');
        document.getElementById('expPagInfo').textContent = expPg + '/' + tp;
        document.getElementById('expPrev').disabled = expPg <= 1;
        document.getElementById('expNext').disabled = expPg >= tp;
    } else {
        pg.classList.add('hidden');
    }
}

function renderExpDocs() {
    const ms = gM().filter(m => m.expediteurId === CU?.id);
    const c = document.getElementById('expDocsList');
    if (!ms.length) {
        c.innerHTML = '<div class="p-6 text-center text-slate-400 text-sm">Aucune</div>';
        return;
    }
    c.innerHTML =
        '<table class="w-full text-xs"><thead><tr class="bg-slate-50">' +
        '<th class="p-3 text-left">Réf</th>' +
        '<th class="p-3 text-left">Trajet</th>' +
        '<th class="p-3 text-center">Preuve</th>' +
        '<th class="p-3 text-center">Facture</th>' +
        '<th class="p-3 text-center">Actions</th>' +
        '</tr></thead><tbody>' +
        ms.map(m => {
            const hp = m.livraison;
            const ps = m.status === 'delivered' && hp ? '✅'
                : m.status === 'pending_delivery' && hp ? '⏳' : '❌';
            const is = m.factureEmise ? '✅' : '❌';
            return '<tr class="border-t hover:bg-slate-50">' +
                '<td class="p-3 font-bold">' + m.ref + '</td>' +
                '<td class="p-3">' + m.fromCity + '→' + (m.dest?.ville || '?') + '</td>' +
                '<td class="p-3 text-center">' + ps +
                (m.status === 'delivered' && hp ? ' <button onclick="viewPhotos(\''+m.ref+'\')" class="text-blue-600 underline">voir</button>' : '') +
                '</td>' +
                '<td class="p-3 text-center">' + is +
                (m.factureEmise ? ' <button onclick="viewInvoiceClient(\''+m.ref+'\')" class="text-blue-600 underline">voir</button>' : '') +
                '</td>' +
                '<td class="p-3 text-center">' +
                (m.status === 'pending'
                    ? '<button onclick="genDeclValeur(\''+m.ref+'\')" class="px-2 py-1 bg-cyan-600 text-white rounded text-xs font-bold">Décl.</button>'
                    : '-') +
                '</td>' +
                '</tr>';
        }).join('') +
        '</tbody></table>';
}

function showDevis(ref) {
    const m = gM().find(x => x.ref === ref);
    if (!m) return;
    document.getElementById('devisSub').textContent =
        m.ref + ' — ' + m.fromCity + ' → ' + (m.dest?.ville || '?');
    document.getElementById('devisCards').innerHTML =
        m.devis.map((d,i) =>
            '<div class="devis-card text-center" onclick="acceptDevis(\''+ref+'\','+i+')">' +
                '<div class="text-2xl mb-2">'+['⭐','🚀','💼'][i]+'</div>' +
                '<div class="text-2xl font-black text-blue-600 mb-1">'+d.prixC+' € <span class="text-xs text-slate-500">HT</span></div>' +
                '<div class="text-slate-600 text-sm mb-3">Délai: <strong>'+d.delai+'</strong></div>' +
                '<button class="w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">Choisir</button>' +
            '</div>'
        ).join('');
    openModal('devisModal');
}

function acceptDevis(ref, i) {
    const ms = gM();
    const m = ms.find(x => x.ref === ref);
    m.devisChoisi = i;
    m.status = 'accepted';
    m.prixC = m.devis[i].prixC;
    sM(ms);
    closeModal('devisModal');
    loadExp();
    alert('✅ Devis accepté !');
}

// === Fonctions de compatibilité API Expéditeur ===

// Tableau de bord expéditeur complet
function renderExpDash() {
    loadExp();
}

// Détail d'une expédition (ici on force simplement l'ouverture de la liste et on scrolle dessus)
function showExpDetail(ref) {
    const rows = document.querySelectorAll('#expList > div');
    rows.forEach(row => {
        if (row.textContent.includes(ref)) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Soumission d'une nouvelle mission (alias de handleDemande)
function handleNewMission(e) {
    handleDemande(e);
}

// Choix d'un devis (alias d'acceptDevis)
function chooseDevis(ref, id) {
    acceptDevis(ref, id);
}