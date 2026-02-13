// === TRANSPORTEUR ===
function showTransTab(t) {
    const map = { available:'Avail', my:'My', tms:'Tms', chauffeurs:'Chauf', comptabilite:'Compta' };
    Object.values(map).forEach(x => {
        const el = document.getElementById('t'+x+'C');
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('[id^="tTab"]').forEach(b => b.classList.remove('active'));
    const k = map[t];
    if (document.getElementById('t'+k+'C')) document.getElementById('t'+k+'C').classList.remove('hidden');
    const tabEl = document.getElementById('tTab'+k);
    if (tabEl) tabEl.classList.add('active');
    if (t === 'tms') renderTMS();
    if (t === 'chauffeurs') renderChauffeurs();
    if (t === 'comptabilite') renderCompta();
    if (t === 'documents') loadTransDocMissions();
}

function loadTrans() {
    if (!CU) return;
    const isPending = CU.transStatus === 'pending_validation' || CU.transStatus === 'submitted';
    document.getElementById('transPendingBanner').classList.toggle('hidden', !isPending);
    document.getElementById('transActiveContent').classList.toggle('hidden', isPending);
    if (isPending) return;

    const ms = gM();
    const dept = CU.departement;
    const elig = eligDepts(dept);
    const my = ms.filter(m => m.transporteurId === CU.id);

    document.getElementById('transStats').innerHTML = [
        {v:my.length,l:'Missions',c:'emerald'},
        {v:my.filter(m => ['progress','pending_delivery'].includes(m.status)).length,l:'En cours',c:'blue'},
        {v:my.filter(m => m.status === 'delivered').length,l:'Livrées',c:'green'},
        {v:my.filter(m => m.status === 'delivered').reduce((s,m)=>s+(m.prixT||0),0)+' €',l:'CA',c:'emerald'}
    ].map(s =>
        '<div class="kpi-card"><div class="kpi-val text-'+s.c+'-600">'+s.v+
        '</div><div class="kpi-lbl">'+s.l+'</div></div>'
    ).join('');

    const avail = ms.filter(m =>
        m.status === 'pending' &&
        elig.includes(m.departement) &&
        !m.offres.find(o => o.tId === CU.id)
    );

    document.getElementById('tAvailC').innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border overflow-hidden">' +
        '<div class="p-4 border-b"><h2 class="text-sm font-bold">Missions zone Dept '+dept+' ('+( DN[dept]||'')+')</h2></div>' +
        '<div class="divide-y">' +
        (avail.length
            ? avail.map(m =>
                '<div class="p-4 hover:bg-slate-50">' +
                    '<div class="flex justify-between items-center mb-2">' +
                        '<div><span class="font-bold text-sm">'+m.ref+
                        '</span> <span class="text-xs text-slate-500">'+m.fromCity+' → '+(m.dest?.ville||'?')+
                        '</span></div><span class="text-xs text-slate-400">Dept '+m.departement+'</span></div>' +
                    '<div class="text-xs text-slate-600 mb-2">'+m.nature+' • '+m.poids+'kg • '+m.um+' UM</div>' +
                    '<div class="flex justify-between">' +
                        '<span class="text-xs text-slate-500">📅 '+m.date+'</span>' +
                        '<button onclick="openOffer(\''+m.ref+'\')" class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold">📝 Offre</button>' +
                    '</div></div>'
            ).join('')
            : '<div class="p-6 text-center text-slate-400 text-sm">Aucune mission</div>') +
        '</div></div>';

    document.getElementById('tMyC').innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border overflow-hidden"><div class="p-4 border-b">' +
        '<h2 class="text-sm font-bold">Mes missions</h2></div><div class="divide-y">' +
        (my.length
            ? my.map(m =>
                '<div class="p-4 hover:bg-slate-50">' +
                    '<div class="flex justify-between items-center mb-1">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="font-bold text-sm">'+m.ref+'</span>' +
                            '<span class="status-'+m.status+' px-2 py-0.5 rounded-full text-xs font-bold">'+sL(m.status)+'</span>' +
                        '</div>' +
                        '<span class="font-bold text-emerald-600 text-sm">'+(m.prixT||'—')+' €</span>' +
                    '</div>' +
                    '<div class="text-xs text-slate-600 mb-2">'+m.fromCity+' → '+(m.dest?.ville||'?')+' • '+m.nature+'</div>' +
                    (m.rejetMotif
                        ? '<div class="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">❌ <strong>Rejeté:</strong> '+m.rejetMotif+'</div>'
                        : ''
                    ) +
                    '<div class="flex gap-1">' +
                        (m.status==='progress'
                            ? '<button onclick="openUpload(\''+m.ref+'\')" class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold">📷 Livraison</button>'
                            : ''
                        ) +
                        (m.status==='pending_delivery'
                            ? '<span class="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">⏳ Validation</span>'
                            : ''
                        ) +
                        (m.status==='delivered'
                            ? '<button onclick="genFactureTrans(\''+m.ref+'\')" class="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold">💶 Facture</button>'
                            : ''
                        ) +
                    '</div>' +
                '</div>'
            ).join('')
            : '<div class="p-6 text-center text-slate-400 text-sm">Aucune</div>'
        ) + '</div></div>';

    showTransTab('available');
}

function openOffer(ref) {
    curOfferRef = ref;
    const m = gM().find(x => x.ref === ref);
    document.getElementById('offerInfo').innerHTML =
        '<strong>'+m.ref+'</strong> — '+m.fromCity+' → '+(m.dest?.ville||'?')+
        '<br><span class="text-xs">'+m.nature+' • '+m.poids+'kg • Enlèv: '+m.date+'</span>';
    const ch = gC(CU.id);
    document.getElementById('ofChauffeur').innerHTML =
        '<option value="">— Moi-même —</option>' +
        ch.map(c => '<option value="'+c.id+'">'+c.prenom+' '+c.nom+'</option>').join('');
    openModal('offerModal');
}

function submitOffer(e) {
    e.preventDefault();
    const ms = gM();
    const m = ms.find(x => x.ref === curOfferRef);
    m.offres.push({
        tId: CU.id,
        nom: CU.prenom + ' ' + CU.nom,
        dept: CU.departement,
        prix: parseFloat(document.getElementById('ofPrix').value),
        datePEC: document.getElementById('ofDatePEC').value,
        heurePEC: document.getElementById('ofHeurePEC').value,
        dateLiv: document.getElementById('ofDateLiv').value,
        heureLiv: document.getElementById('ofHeureLiv').value,
        chauffeur: document.getElementById('ofChauffeur').value || null,
        dateO: new Date().toISOString()
    });
    sM(ms);
    closeModal('offerModal');
    loadTrans();
    alert('✅ Offre envoyée !');
}

function openUpload(ref) {
    curUploadRef = ref;
    document.getElementById('uploadRef').textContent = ref;
    document.getElementById('uploadS1').classList.remove('hidden');
    document.getElementById('uploadS2').classList.add('hidden');
    document.getElementById('photoPreview').innerHTML = '';
    openModal('uploadModal');
}

function previewPhotos(e) {
    document.getElementById('photoPreview').innerHTML =
        Array.from(e.target.files).map(f =>
            '<div class="aspect-square bg-slate-100 rounded-lg overflow-hidden">' +
                '<img src="'+URL.createObjectURL(f)+'" class="w-full h-full object-cover">' +
            '</div>'
        ).join('');
}

function submitDelivery() {
    const f = document.getElementById('photoInput').files;
    if (!f.length) {
        alert('Photo requise');
        return;
    }
    const ms = gM();
    const m = ms.find(x => x.ref === curUploadRef);
    m.status = 'pending_delivery';
    m.rejetMotif = null;
    m.livraison = {
        date: new Date().toISOString(),
        signataire: document.getElementById('signataire').value || 'Non spécifié',
        photos: f.length
    };
    const r = new FileReader();
    r.onload = function () {
        localStorage.setItem('ph_'+curUploadRef, r.result);
    };
    if (f[0]) r.readAsDataURL(f[0]);
    sM(ms);
    document.getElementById('uploadS1').classList.add('hidden');
    document.getElementById('uploadS2').classList.remove('hidden');
    loadTrans();
}

// === Fonctions de compatibilité API Transporteur ===

// Tableau de bord transporteur complet
function renderTransDash() {
    loadTrans();
}

// Rafraîchit les missions (disponibles + miennes)
function renderTransMissions() {
    loadTrans();
}

// Soumission d'une livraison via référence (ouvre le modal et laisse l'utilisateur valider)
function submitLivraison(ref) {
    openUpload(ref);
}

function renderTMS() {
    const ms = gM().filter(m => m.transporteurId === CU?.id);
    const del = ms.filter(m => m.status === 'delivered');
    const rej = ms.filter(m => m.rejetMotif);
    const onTime = del.length ? Math.round(del.length / (del.length + rej.length) * 100) : 0;
    const ca = del.reduce((s,m)=>s+(m.prixT||0),0);

    document.getElementById('tTmsC').innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border p-6">' +
        '<h2 class="text-lg font-bold mb-4">📊 TMS</h2>' +
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
        [
            {v:ms.length,l:'Total',c:'blue'},
            {v:del.length,l:'Livrées',c:'green'},
            {v:onTime+'%',l:'Réussite',c:'emerald'},
            {v:ca+' €',l:'CA',c:'purple'}
        ].map(k =>
            '<div class="kpi-card"><div class="kpi-val text-'+k.c+'-600">'+k.v+
            '</div><div class="kpi-lbl">'+k.l+'</div></div>'
        ).join('') +
        '</div><h3 class="font-bold text-sm mb-3">Historique</h3>' +
        '<div class="space-y-2">' +
        ms.map(m =>
            '<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">' +
                '<div><span class="font-bold text-xs">'+m.ref+'</span> ' +
                '<span class="text-xs text-slate-500">'+m.fromCity+'→'+(m.dest?.ville||'?')+'</span></div>' +
                '<div class="flex items-center gap-2">' +
                    '<span class="status-'+m.status+' px-2 py-0.5 rounded-full text-xs font-bold">'+sL(m.status)+'</span>' +
                    '<span class="text-xs font-bold text-emerald-600">'+(m.prixT||'—')+'€</span>' +
                '</div></div>'
        ).join('') +
        '</div></div>';
}

function renderChauffeurs() {
    const ch = gC(CU?.id);
    document.getElementById('tChaufC').innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border p-6">' +
        '<div class="flex justify-between items-center mb-4">' +
        '<h2 class="text-lg font-bold">👤 Chauffeurs</h2>' +
        '<button onclick="openModal(\'chauffeurModal\')" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">+ Ajouter</button>' +
        '</div>' +
        (ch.length
            ? '<div class="space-y-2">' +
              ch.map(c =>
                '<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">' +
                    '<div><span class="font-bold text-sm">'+c.prenom+' '+c.nom+
                    '</span> <span class="text-xs text-slate-500">Permis: '+c.permis+' ('+c.categorie+')</span>' +
                    (c.validite ? ' <span class="text-xs text-slate-400">Exp: '+c.validite+'</span>' : '') +
                    '</div><button onclick="removeChauffeur('+c.id+')" class="text-red-500 text-xs font-bold hover:underline">Suppr.</button></div>'
              ).join('') +
              '</div>'
            : '<div class="text-sm text-slate-400 text-center p-4">Aucun chauffeur</div>'
        ) + '</div>';
}

function addChauffeur(e) {
    e.preventDefault();
    const ch = gC(CU.id);
    ch.push({
        id: Date.now(),
        prenom: document.getElementById('chPrenom').value,
        nom: document.getElementById('chNom').value,
        permis: document.getElementById('chPermis').value,
        categorie: document.getElementById('chCategorie').value,
        validite: document.getElementById('chValidite').value,
        tel: document.getElementById('chTel').value
    });
    sC(CU.id, ch);
    closeModal('chauffeurModal');
    renderChauffeurs();
}

function removeChauffeur(id) {
    sC(CU.id, gC(CU.id).filter(c => c.id !== id));
    renderChauffeurs();
}

function renderCompta() {
    const ms = gM().filter(m => m.transporteurId === CU?.id);
    const del = ms.filter(m => m.status === 'delivered');
    const ca = del.reduce((s,m)=>s+(m.prixT||0),0);
    const tva = ca * .2;

    document.getElementById('tComptaC').innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm border p-6">' +
        '<h2 class="text-lg font-bold mb-4">💶 Comptabilité</h2>' +
        '<div class="grid grid-cols-3 gap-4 mb-6">' +
        [
            {v:ca.toFixed(2)+' €',l:'CA HT',c:'emerald'},
            {v:tva.toFixed(2)+' €',l:'TVA',c:'slate'},
            {v:(ca+tva).toFixed(2)+' €',l:'TTC',c:'blue'}
        ].map(k =>
            '<div class="kpi-card"><div class="kpi-val text-'+k.c+'-600">'+k.v+
            '</div><div class="kpi-lbl">'+k.l+'</div></div>'
        ).join('') +
        '</div><h3 class="font-bold text-sm mb-3">Factures</h3>' +
        '<div class="space-y-2">' +
        del.map(m =>
            '<div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">' +
                '<div><span class="font-bold text-xs">'+m.ref+
                '</span> <span class="text-xs text-slate-500">'+m.fromCity+'→'+(m.dest?.ville||'?')+'</span></div>' +
                '<div class="flex items-center gap-2">' +
                    '<span class="text-xs font-bold text-emerald-600">'+m.prixT+' €</span>' +
                    '<button onclick="genFactureTrans(\''+m.ref+'\')" class="px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">Voir</button>' +
                '</div></div>'
        ).join('') +
        '</div></div>';
}

function submitConformity(e) {
    e.preventDefault();
    CU.transStatus = 'submitted';
    CU.conformity = {
        licence: document.getElementById('cfLicence').value,
        assurDate: document.getElementById('cfAssurDate').value,
        immatTracteur: document.getElementById('cfImmatTracteur').value,
        immatRemorque: document.getElementById('cfImmatRemorque').value,
        tel247: document.getElementById('cfTel247').value,
        submittedAt: new Date().toISOString()
    };
    saveUser(CU);
    localStorage.setItem('w_cu', JSON.stringify(CU));
    closeModal('conformityModal');
    loadTrans();
    alert('✅ Dossier soumis !');
}