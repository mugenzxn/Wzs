// === ADMIN — Pro Design ===
function showATab(t) {
    document.querySelectorAll('.a-tab').forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('[id^="aTab"]').forEach(b => b.classList.remove('active'));
    const map = {
        users:'Users', validation:'Validation', offres:'Offres',
        assign:'Assign', livraisons:'Livraisons', facturation:'Facturation', docs:'Docs'
    };
    document.getElementById('a'+map[t]+'C').classList.remove('hidden');
    document.getElementById('aTab'+map[t]).classList.add('active');
    ({
        users: renderAUsers,
        validation: renderAValidation,
        offres: renderAOffres,
        assign: renderAAssign,
        livraisons: renderALivraisons,
        facturation: renderAFacturation,
        docs: renderADocs
    })[t]();
}

function loadAdmin() {
    const ms = gM();
    const us = gU();
    document.getElementById('adminStats').innerHTML = [
        {v:us.length, l:'Utilisateurs', icon:'👥', color:'blue'},
        {v:ms.length, l:'Missions', icon:'📦', color:'emerald'},
        {v:ms.filter(m => m.status === 'pending' && m.offres.length).length, l:'Offres', icon:'💰', color:'yellow'},
        {v:ms.filter(m => m.status === 'pending_delivery').length, l:'Livraisons', icon:'📷', color:'orange'},
        {v:ms.filter(m => m.factureEmise).reduce((s,m)=>s+(m.prixC||0),0)+' €', l:'CA', icon:'💶', color:'purple'}
    ].map(s =>
        '<div class="kpi-card">' +
            '<div class="flex items-center justify-between mb-2">' +
                '<span class="text-xs font-bold uppercase tracking-wider text-slate-400">'+s.l+'</span>' +
                '<span class="text-xl">'+s.icon+'</span>' +
            '</div>' +
            '<div class="kpi-val text-'+s.color+'-600">'+s.v+'</div>' +
        '</div>'
    ).join('');
    showATab('users');
}

// ── USERS ──
function renderAUsers() {
    let us = gU().filter(u => !(u.roles || []).includes('admin'));
    const f = window.aUserFilter;
    if (f && f !== 'all') us = us.filter(u => (u.roles || []).includes(f));
    const q = (document.getElementById('aUserSearch')?.value || '').toLowerCase();
    if (q) {
        us = us.filter(u =>
            (u.prenom+' '+u.nom+' '+u.email+(u.departement||'')).toLowerCase().includes(q)
        );
    }
    const sort = document.getElementById('aUserSort')?.value || 'nom';
    us.sort((a,b) =>
        sort === 'dept'
            ? (a.departement || '99').localeCompare(b.departement || '99')
            : (a.nom || '').localeCompare(b.nom || '')
    );

    const filterBtn = (val, label, active) =>
        '<button onclick="window.aUserFilter=\''+val+'\';renderAUsers()" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all '+
        (active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')+'">'+label+'</button>';

    document.getElementById('aUsersC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">' +
            '<div class="flex gap-1.5">' +
                filterBtn('all','Tous',!f||f==='all') +
                filterBtn('expediteur','📦 Exp.',f==='expediteur') +
                filterBtn('transporteur','🚛 Trans.',f==='transporteur') +
            '</div>' +
            '<div class="flex gap-2">' +
                '<div class="relative"><input type="text" id="aUserSearch" oninput="renderAUsers()" placeholder="Rechercher..." class="inp pl-9 w-44 text-xs"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span></div>' +
                '<select id="aUserSort" onchange="renderAUsers()" class="inp w-28 text-xs"><option value="nom">Nom</option><option value="dept">Département</option></select>' +
            '</div>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        us.map(u => {
            const isTrans = (u.roles||[]).includes('transporteur');
            return '<div class="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black '+
                    (isTrans ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200')+'">'+
                    u.prenom.charAt(0)+u.nom.charAt(0)+'</div>' +
                    '<div><div class="font-bold text-sm text-slate-900">'+u.prenom+' '+u.nom+'</div>' +
                    '<div class="text-xs text-slate-500">'+u.email+
                    (u.departement ? ' · <span class="font-medium">'+u.departement+'</span> '+(DN[u.departement]||'') : '')+
                    '</div></div>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    (u.roles||[]).map(r =>
                        '<span class="role-badge '+(r==='transporteur'?'role-trans':'role-exp')+'">'+r+'</span>'
                    ).join('') +
                    '<button onclick="openRoleEditor(\''+u.email+'\')" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-sm transition" title="Gérer rôles">⚙️</button>' +
                '</div></div>';
        }).join('') +
        '</div>' +
        '<div class="p-4 border-t border-slate-100 text-xs text-slate-400 font-medium">'+us.length+' utilisateur(s)</div>' +
        '</div>';
}

function openRoleEditor(email) {
    curRoleUserId = email;
    const u = US[email];
    document.getElementById('roleUserInfo').innerHTML =
        '<div class="flex items-center gap-3">' +
            '<div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-600">'+u.prenom.charAt(0)+u.nom.charAt(0)+'</div>' +
            '<div><div class="font-bold text-slate-900">'+u.prenom+' '+u.nom+'</div><div class="text-xs text-slate-500">'+u.email+'</div></div>' +
        '</div>';
    document.getElementById('roleCheckboxes').innerHTML =
        ['expediteur','transporteur'].map(r =>
            '<div class="check-row"><input type="checkbox" id="role_'+r+'" '+
            ((u.roles||[]).includes(r)?'checked':'')+
            '><label for="role_'+r+'" class="font-bold text-sm cursor-pointer">'+
            (r==='expediteur'?'📦 Expéditeur':'🚛 Transporteur')+
            '</label></div>'
        ).join('');
    openModal('roleModal');
}

function saveRoles() {
    const u = US[curRoleUserId];
    const nr = [];
    if (document.getElementById('role_expediteur').checked) nr.push('expediteur');
    if (document.getElementById('role_transporteur').checked) nr.push('transporteur');
    if ((u.roles || []).includes('admin')) nr.push('admin');
    u.roles = nr;
    saveUser(u);
    closeModal('roleModal');
    renderAUsers();
    alert('✅ Rôles mis à jour');
}

// ── VALIDATION ──
function renderAValidation() {
    const pending = gU().filter(u =>
        (u.roles || []).includes('transporteur') &&
        (u.transStatus === 'submitted' || u.transStatus === 'pending_validation')
    );
    document.getElementById('aValidationC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex items-center justify-between">' +
            '<h2 class="font-bold text-slate-900">Dossiers de conformité</h2>' +
            '<span class="px-3 py-1 rounded-full text-xs font-bold '+(pending.length ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500')+'">'+pending.length+'</span>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (pending.length
            ? pending.map(u =>
                '<div class="p-5">' +
                    '<div class="flex justify-between items-start mb-4">' +
                        '<div class="flex items-center gap-3">' +
                            '<div class="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center font-black text-purple-600 text-sm">'+u.prenom.charAt(0)+u.nom.charAt(0)+'</div>' +
                            '<div><div class="font-bold text-slate-900">'+u.prenom+' '+u.nom+'</div>' +
                            '<div class="text-xs text-slate-500">'+u.email+' · Dept '+u.departement+'</div></div>' +
                        '</div>' +
                        '<span class="status-pending_validation px-3 py-1 rounded-full text-xs font-bold">'+(u.transStatus === 'submitted' ? 'Soumis' : 'En attente')+'</span>' +
                    '</div>' +
                    (u.conformity
                        ? '<div class="p-4 bg-slate-50 rounded-xl text-xs mb-4 grid grid-cols-3 gap-3">' +
                            '<div><span class="text-slate-400 block mb-0.5">Licence</span><span class="font-bold text-slate-900">'+u.conformity.licence+'</span></div>' +
                            '<div><span class="text-slate-400 block mb-0.5">Immat.</span><span class="font-bold text-slate-900">'+u.conformity.immatTracteur+'</span></div>' +
                            '<div><span class="text-slate-400 block mb-0.5">Tél 24/7</span><span class="font-bold text-slate-900">'+u.conformity.tel247+'</span></div>' +
                          '</div>' +
                          '<div class="flex gap-2">' +
                            '<button onclick="validateTransporteur(\''+u.email+'\')" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all">✅ Valider</button>' +
                            '<button onclick="rejectTransporteur(\''+u.email+'\')" class="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition">❌ Refuser</button>' +
                          '</div>'
                        : '<div class="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Dossier non encore soumis par le transporteur</div>'
                    ) +
                '</div>'
            ).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucun dossier en attente</div>'
        ) + '</div></div>';
}

function validateTransporteur(email) {
    const u = US[email];
    u.transStatus = 'validated';
    saveUser(u);
    renderAValidation();
    alert('✅ Validé');
}

function rejectTransporteur(email) {
    const motif = prompt('Motif:');
    if (!motif) return;
    const u = US[email];
    u.transStatus = 'rejected';
    u.rejectMotif = motif;
    saveUser(u);
    renderAValidation();
}

// ── OFFRES ──
function renderAOffres() {
    const ms = gM().filter(m => m.status === 'pending');
    document.getElementById('aOffresC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex items-center justify-between">' +
            '<h2 class="font-bold text-slate-900">Offres transporteurs</h2>' +
            '<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">'+ms.length+' mission(s)</span>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (ms.length
            ? ms.map(m =>
                '<div class="p-5">' +
                    '<div class="flex justify-between items-center mb-3">' +
                        '<div><span class="font-black text-sm text-slate-900">'+m.ref+'</span>' +
                        '<span class="text-xs text-slate-500 ml-2">'+m.fromCity+' → '+(m.dest?.ville||'?')+' · Dept '+m.departement+'</span></div>' +
                        '<span class="text-xs font-bold '+(m.offres.length ? 'text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full' : 'text-slate-400')+'">'+m.offres.length+' offre(s)</span>' +
                    '</div>' +
                    (m.offres.length
                        ? '<div class="space-y-2 mb-4">'+
                          m.offres.map(o =>
                            '<div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">' +
                                '<div><span class="font-bold text-sm text-slate-900">'+o.nom+'</span>' +
                                '<span class="text-xs text-slate-400 ml-2">Dept '+o.dept+'</span>' +
                                '<div class="text-xs text-slate-500 mt-0.5">'+o.datePEC+' '+o.heurePEC+' → '+o.dateLiv+' '+o.heureLiv+'</div></div>' +
                                '<span class="font-black text-lg text-emerald-600">'+o.prix+' €</span>' +
                            '</div>'
                          ).join('') +
                          '</div>' +
                          '<button onclick="openCompose(\''+m.ref+'\')" class="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 transition-all">📨 Composer le devis</button>'
                        : '<div class="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">Zones éligibles: '+eligDepts(m.departement).join(', ')+'</div>'
                    ) +
                '</div>'
            ).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucune mission en attente</div>'
        ) + '</div></div>';
}

function openCompose(ref) {
    curComposeRef = ref;
    devisCnt = 0;
    const m = gM().find(x => x.ref === ref);
    document.getElementById('composeInfo').innerHTML =
        '<div class="flex items-center gap-3">' +
            '<span class="font-black text-slate-900">'+m.ref+'</span>' +
            '<span class="text-sm text-slate-500">'+m.fromCity+' → '+(m.dest?.ville||'?')+'</span>' +
            '<span class="text-sm text-slate-500">·</span>' +
            '<span class="text-sm text-slate-500">'+m.nature+' · '+m.poids+'kg</span>' +
        '</div>';
    document.getElementById('composeOffres').innerHTML =
        m.offres.map(o =>
            '<div class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl mb-2 text-sm">' +
                '<span class="font-bold text-slate-900">'+o.nom+'</span>' +
                '<span class="font-black text-emerald-600">'+o.prix+' €</span>' +
                '<span class="text-xs text-slate-400">'+o.datePEC+' → '+o.dateLiv+'</span>' +
            '</div>'
        ).join('');
    document.getElementById('composeFields').innerHTML = '';
    document.getElementById('addDevisBtn').classList.remove('hidden');
    addDevisRow();
    openModal('composeModal');
}

function addDevisRow() {
    if (devisCnt >= 3) return;
    devisCnt++;
    document.getElementById('composeFields').insertAdjacentHTML(
        'beforeend',
        '<div class="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 transition">' +
            '<div class="flex items-center gap-2 mb-3"><span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">'+devisCnt+'</span><span class="font-bold text-sm text-slate-900">Proposition '+devisCnt+'</span></div>' +
            '<div class="grid grid-cols-2 gap-3">' +
                '<div><label class="lbl">Prix HT (€)</label><input type="number" id="dp'+devisCnt+'" class="inp" step="0.01"></div>' +
                '<div><label class="lbl">Délai</label><input type="text" id="dd'+devisCnt+'" class="inp" placeholder="2-3 jours"></div>' +
            '</div></div>'
    );
    if (devisCnt >= 3) document.getElementById('addDevisBtn').classList.add('hidden');
}

function sendDevis() {
    const ms = gM();
    const m = ms.find(x => x.ref === curComposeRef);
    m.devis = [];
    for (let i = 1; i <= devisCnt; i++) {
        const p = parseFloat(document.getElementById('dp'+i).value);
        const d = document.getElementById('dd'+i).value;
        if (!p || !d) { alert('Champs requis'); return; }
        m.devis.push({id:i, prixC:p, delai:d});
    }
    m.status = 'quoted';
    sM(ms);
    closeModal('composeModal');
    loadAdmin();
    alert('✅ Devis envoyé !');
}

// ── ASSIGNATION ──
function renderAAssign() {
    const ms = gM().filter(m => m.status === 'accepted');
    document.getElementById('aAssignC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex items-center justify-between">' +
            '<h2 class="font-bold text-slate-900">Assignation transporteur</h2>' +
            '<span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">'+ms.length+'</span>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (ms.length
            ? ms.map(m => {
                const dv = m.devis[m.devisChoisi];
                const elig = gT().filter(t => eligDepts(m.departement).includes(t.departement));
                const om = {};
                m.offres.forEach(o => om[o.tId] = o);
                return '<div class="p-5">' +
                    '<div class="flex justify-between items-center mb-4">' +
                        '<div><span class="font-black text-sm text-slate-900">'+m.ref+'</span>' +
                        '<span class="text-xs text-slate-500 ml-2">'+m.fromCity+' → '+(m.dest?.ville||'?')+'</span></div>' +
                        '<div class="text-right"><div class="text-xs text-slate-400 uppercase tracking-wider font-bold">Prix client</div>' +
                        '<div class="font-black text-lg text-blue-600">'+(dv?.prixC||'?')+' €</div></div>' +
                    '</div>' +
                    '<div class="mb-4"><label class="lbl">Transporteur éligible</label>' +
                    '<select id="as_'+m.ref+'" class="inp">'+
                        '<option value="">— Sélectionner —</option>'+
                        elig.map(t => {
                            const o = om[t.id];
                            return '<option value="'+t.id+'">'+t.prenom+' '+t.nom+' ('+t.departement+')'+(o ? ' — '+o.prix+'€' : '')+'</option>';
                        }).join('') +
                    '</select></div>' +
                    '<button onclick="assignMission(\''+m.ref+'\')" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all">✅ Assigner</button>' +
                '</div>';
            }).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucune mission à assigner</div>'
        ) + '</div></div>';
}

function assignMission(ref) {
    const sel = document.getElementById('as_'+ref);
    if (!sel.value) { alert('Choisir un transporteur'); return; }
    const tid = parseInt(sel.value);
    const t = gU().find(u => u.id === tid);
    const ms = gM();
    const m = ms.find(x => x.ref === ref);
    const o = m.offres.find(x => x.tId === tid);
    m.transporteurId = tid;
    m.transporteurNom = t.prenom + ' ' + t.nom;
    m.prixT = o ? o.prix : null;
    m.status = 'progress';
    sM(ms);
    loadAdmin();
    alert('✅ Assigné à '+t.prenom+' '+t.nom);
}

// ── LIVRAISONS ──
function renderALivraisons() {
    const ms = gM().filter(m => m.status === 'pending_delivery');
    document.getElementById('aLivraisonsC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex items-center justify-between">' +
            '<h2 class="font-bold text-slate-900">Validation livraisons</h2>' +
            '<span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">'+ms.length+'</span>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (ms.length
            ? ms.map(m =>
                '<div class="p-5">' +
                    '<div class="flex justify-between items-start mb-3">' +
                        '<div><span class="font-black text-sm text-slate-900">'+m.ref+'</span>' +
                        '<span class="text-xs text-slate-500 ml-2">'+m.fromCity+' → '+(m.dest?.ville||'?')+'</span>' +
                        '<div class="text-xs text-slate-500 mt-1">Trans: <strong>'+m.transporteurNom+'</strong> · Client: <strong>'+m.expediteurNom+'</strong></div></div>' +
                    '</div>' +
                    (m.livraison
                        ? '<div class="mb-3 p-3 bg-slate-50 rounded-xl text-xs flex items-center gap-4">' +
                            '<span>📷 <strong>'+m.livraison.photos+'</strong> photo(s)</span>' +
                            '<button onclick="viewPhotos(\''+m.ref+'\')" class="text-blue-600 font-bold hover:underline">Voir</button>' +
                            '<span>Signataire: <strong>'+m.livraison.signataire+'</strong></span>' +
                          '</div>'
                        : ''
                    ) +
                    '<div class="flex items-center gap-4 text-xs mb-4 p-3 bg-slate-50 rounded-xl">' +
                        '<span>Trans: <strong class="text-emerald-600 text-sm">'+(m.prixT||'—')+' €</strong></span>' +
                        '<span>Client: <strong class="text-blue-600 text-sm">'+(m.prixC||'—')+' €</strong></span>' +
                        (m.prixT && m.prixC
                            ? '<span>Marge: <strong class="text-purple-600 text-sm">'+(m.prixC-m.prixT)+' €</strong></span>'
                            : ''
                        ) +
                    '</div>' +
                    '<div class="flex gap-2">' +
                        '<button onclick="validateDel(\''+m.ref+'\')" class="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all">✅ Valider</button>' +
                        '<button onclick="openReject(\''+m.ref+'\')" class="px-5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition">❌ Rejeter</button>' +
                    '</div>' +
                '</div>'
            ).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucune livraison en attente</div>'
        ) + '</div></div>';
}

function validateDel(ref) {
    const ms = gM();
    const m = ms.find(x => x.ref === ref);
    m.status = 'delivered';
    m.factureEmise = true;
    sM(ms);
    loadAdmin();
    alert('✅ Livraison validée');
}

function openReject(ref) {
    curRejectRef = ref;
    document.getElementById('rejectMotif').value = '';
    openModal('rejectModal');
}

function confirmReject() {
    const mt = document.getElementById('rejectMotif').value.trim();
    if (!mt) { alert('Motif requis'); return; }
    const ms = gM();
    const m = ms.find(x => x.ref === curRejectRef);
    m.status = 'progress';
    m.rejetMotif = mt;
    m.livraison = null;
    sM(ms);
    closeModal('rejectModal');
    loadAdmin();
    alert('❌ Livraison rejetée');
}

// ── FACTURATION ──
function renderAFacturation() {
    const ms = gM().filter(m => m.factureEmise);
    const totalCA = ms.reduce((s,m) => s+(m.prixC||0), 0);
    document.getElementById('aFacturationC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100 flex items-center justify-between">' +
            '<h2 class="font-bold text-slate-900">Factures émises</h2>' +
            '<span class="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">CA: '+totalCA+' €</span>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (ms.length
            ? ms.map(m =>
                '<div class="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">' +
                    '<div class="flex items-center gap-3">' +
                        '<div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-sm">💶</div>' +
                        '<div><span class="font-bold text-sm text-slate-900">'+m.ref+'</span>' +
                        '<div class="text-xs text-slate-500">'+m.expediteurNom+'</div></div>' +
                    '</div>' +
                    '<div class="flex items-center gap-3">' +
                        '<span class="font-black text-blue-600">'+m.prixC+' €</span>' +
                        '<button onclick="viewInvoiceClient(\''+m.ref+'\')" class="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:-translate-y-0.5 transition-all">Voir</button>' +
                    '</div>' +
                '</div>'
            ).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucune facture</div>'
        ) + '</div></div>';
}

// ── DOCUMENTS ──
function renderADocs() {
    const ms = gM().filter(m => m.transporteurId);
    document.getElementById('aDocsC').innerHTML =
        '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">' +
        '<div class="p-5 border-b border-slate-100">' +
            '<h2 class="font-bold text-slate-900">Documents transport</h2>' +
        '</div>' +
        '<div class="divide-y divide-slate-100">' +
        (ms.length
            ? ms.map(m =>
                '<div class="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">' +
                    '<div><span class="font-bold text-sm text-slate-900">'+m.ref+'</span>' +
                    '<span class="text-xs text-slate-500 ml-2">'+m.fromCity+' → '+(m.dest?.ville||'?')+'</span>' +
                    '<div class="text-xs text-slate-500 mt-0.5">'+m.transporteurNom+'</div></div>' +
                    '<div class="flex gap-2">' +
                        '<button onclick="genAttestation(\''+m.ref+'\')" class="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition">Attest.</button>' +
                        '<button onclick="genCMR(\''+m.ref+'\')" class="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition">CMR</button>' +
                    '</div>' +
                '</div>'
            ).join('')
            : '<div class="p-10 text-center text-slate-400 text-sm">Aucun document</div>'
        ) + '</div></div>';
}