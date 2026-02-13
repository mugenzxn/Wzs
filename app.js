// Auth / navigation / rôles
function fillLogin(e, p) {
    document.getElementById('loginEmail').value = e;
    document.getElementById('loginPwd').value = p;
}

function handleLogin(e) {
    e.preventDefault();
    const em = document.getElementById('loginEmail').value;
    const pw = document.getElementById('loginPwd').value;
    const u = US[em];
    if (u && u.password === pw) {
        CU = u;
        const r = u.roles || [];
        activeRole = r.includes('admin') ? 'admin'
            : r.includes('expediteur') ? 'expediteur'
            : r.includes('transporteur') ? 'transporteur' : '';
        if (!activeRole) {
            alert('Aucun rôle');
            return;
        }
        localStorage.setItem('w_cu', JSON.stringify(u));
        closeModal('loginModal');
        showNav();
        showDash();
    } else {
        alert('Identifiants incorrects');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const f = e.target;
    const role = f.regRole.value;
    const u = {
        id: Date.now(),
        prenom: f.prenom.value,
        nom: f.nom.value,
        email: f.email.value,
        tel: f.tel?.value || '',
        roles: [role],
        departement: role === 'transporteur' ? f.departement.value : null,
        transStatus: role === 'transporteur' ? 'pending_validation' : null,
        conformity: null,
        password: f.password.value
    };
    if (US[u.email]) {
        alert('Email déjà utilisé');
        return;
    }
    saveUser(u);
    CU = u;
    activeRole = role;
    localStorage.setItem('w_cu', JSON.stringify(u));
    closeModal('registerModal');
    showNav();
    showDash();
}

function toggleRegFields() {
    document
        .getElementById('regDeptField')
        .classList
        .toggle('hidden', document.querySelector('input[name="regRole"]:checked').value !== 'transporteur');
}

function logout() {
    localStorage.removeItem('w_cu');
    CU = null;
    location.reload();
}

// Wrapper pour compatibilité : masquer la nav et revenir à la page publique
function hideNav() {
    document.getElementById('navPublic').classList.remove('hidden');
    document.getElementById('navConnected').classList.add('hidden');
    document.getElementById('heroSection').classList.remove('hidden');
    document.getElementById('navBrand').className = 'text-2xl font-black text-white';
}

// Wrapper pour compatibilité : alias de switchActiveRole
function switchRole(role) {
    switchActiveRole(role);
}

function showNav() {
    document.getElementById('navPublic').classList.add('hidden');
    document.getElementById('navConnected').classList.remove('hidden');
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('navBrand').className = 'text-2xl font-black text-slate-900';
    document.getElementById('userName').textContent = CU.prenom + ' ' + CU.nom;
    updateRoleBadge();
    const r = CU.roles || [];
    const sw = document.getElementById('roleSwitcher');
    if (r.includes('expediteur') && r.includes('transporteur')) {
        sw.classList.remove('hidden');
        sw.classList.add('flex');
        updateSwitcher();
    } else {
        sw.classList.add('hidden');
    }
}

function updateRoleBadge() {
    const b = document.getElementById('userRole');
    if (activeRole === 'admin') {
        b.textContent = 'Admin';
        b.className = 'role-badge bg-purple-100 text-purple-700';
    } else if (activeRole === 'transporteur') {
        b.textContent = 'Transporteur';
        b.className = 'role-badge role-trans';
    } else {
        b.textContent = 'Expéditeur';
        b.className = 'role-badge role-exp';
    }
}

function updateSwitcher() {
    document.getElementById('rsExp').className =
        'px-3 py-1.5 rounded-lg text-xs font-bold transition ' +
        (activeRole === 'expediteur' ? 'bg-blue-600 text-white' : 'text-slate-600');
    document.getElementById('rsTrans').className =
        'px-3 py-1.5 rounded-lg text-xs font-bold transition ' +
        (activeRole === 'transporteur' ? 'bg-emerald-600 text-white' : 'text-slate-600');
}

function switchActiveRole(r) {
    activeRole = r;
    updateRoleBadge();
    updateSwitcher();
    showDash();
}

function showDash() {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    if (activeRole === 'expediteur') {
        document.getElementById('dashboardExp').classList.add('active');
        loadExp();
    } else if (activeRole === 'transporteur') {
        document.getElementById('dashboardTrans').classList.add('active');
        loadTrans();
    } else if (activeRole === 'admin') {
        document.getElementById('dashboardAdmin').classList.add('active');
        loadAdmin();
    }
}

// Modals
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}
function switchModal(a, b) {
    closeModal(a);
    setTimeout(function () {
        openModal(b);
    }, 200);
}

// Création de demande transport
function handleDemande(e) {
    e.preventDefault();

    // ══════════════════════════════════
    // 1. VALIDATION CHAMPS OBLIGATOIRES
    // ══════════════════════════════════
    const fc = document.getElementById('dFromCity').value.trim();
    const destNom = document.getElementById('dDestNom').value.trim();
    const destAddr1 = document.getElementById('dDestAddr1').value.trim();
    const destCP = document.getElementById('dDestCP').value.trim();
    const destVille = document.getElementById('dDestVille').value.trim();

    if (!fc) { alert('⚠️ Ville d\'enlèvement obligatoire'); return; }
    if (!destNom) { alert('⚠️ Nom du destinataire obligatoire'); return; }
    if (!destAddr1) { alert('⚠️ Adresse du destinataire obligatoire'); return; }
    if (!destCP) { alert('⚠️ Code postal du destinataire obligatoire'); return; }
    if (!destVille) { alert('⚠️ Ville du destinataire obligatoire'); return; }

    // ══════════════════════════════════
    // 2. DÉPARTEMENT
    // ══════════════════════════════════
    let dept = getDept(fc);
    if (!dept) {
        const d = prompt('Ville non reconnue. Code département (ex: 64):');
        if (d && d.trim()) {
            dept = d.trim();
        } else {
            alert('Département requis');
            return;
        }
    }

    // ══════════════════════════════════
    // 3. COLLECTE MARCHANDISES (tableau)
    // ══════════════════════════════════
    const marchandises = [];
    const rows = document.querySelectorAll('#marchandisesBody tr');
    let totalUM = 0, totalPoids = 0, totalVol = 0;

    rows.forEach(row => {
        const qte = parseInt(row.querySelector('.m-um')?.value) || 0;
        const type = row.querySelector('.m-type')?.value || '';
        const desc = row.querySelector('.m-desc')?.value || '';
        const poids = parseFloat(row.querySelector('.m-poids')?.value) || 0;
        const longueur = parseFloat(row.querySelector('.m-long')?.value) || 0;
        const largeur = parseFloat(row.querySelector('.m-larg')?.value) || 0;
        const hauteur = parseFloat(row.querySelector('.m-haut')?.value) || 0;
        const vol = parseFloat(row.querySelector('.m-vol')?.value) || 0;

        marchandises.push({ qte, type, desc, poids, longueur, largeur, hauteur, vol });
        totalUM += qte;
        totalPoids += poids * qte;
        totalVol += vol * qte;
    });

    if (marchandises.length === 0 || totalUM === 0) {
        alert('⚠️ Ajoutez au moins une ligne marchandise');
        return;
    }

    // ══════════════════════════════════
    // 4. ADRESSE ENLEVEMENT DIFFERENTE
    // ══════════════════════════════════
    let enlevDiff = null;
    if (document.getElementById('dEnlevDiff')?.checked) {
        enlevDiff = {
            nom: document.getElementById('dEnlevNom')?.value || '',
            addr: document.getElementById('dEnlevAddr')?.value || '',
            cp: document.getElementById('dEnlevCP')?.value || '',
            ville: document.getElementById('dEnlevVille')?.value || '',
            tel: document.getElementById('dEnlevTel')?.value || '',
            contact: document.getElementById('dEnlevContact')?.value || ''
        };
    }

    // ══════════════════════════════════
    // 5. CONSTRUCTION OBJET DEMANDE
    // ══════════════════════════════════
    const m = {
        ref: 'WASL-' + Date.now().toString().slice(-6),
        createdAt: new Date().toISOString(),
        expediteurId: CU?.id,
        expediteurNom: CU ? (CU.prenom + ' ' + CU.nom) : 'Inconnu',
        expediteurSociete: CU?.societe || '',

        // Expéditeur (pré-rempli)
        expediteur: {
            nom: document.getElementById('dExpNom')?.value || '',
            tel: document.getElementById('dExpTel')?.value || '',
            email: document.getElementById('dExpEmail')?.value || '',
            addr: document.getElementById('dExpAddr')?.value || '',
            cp: document.getElementById('dExpCP')?.value || '',
            ville: document.getElementById('dExpVille')?.value || ''
        },

        // Enlèvement
        type: document.getElementById('dType').value,
        fromCity: fc,
        fromAddr: document.getElementById('dFromAddr')?.value || '',
        dateEnlev: document.getElementById('dDate').value,
        enlevDiff: enlevDiff,

        // Destinataire
        dest: {
            code: document.getElementById('dDestCode').value.trim(),
            nom: destNom,
            addr1: destAddr1,
            addr2: document.getElementById('dDestAddr2').value.trim(),
            cp: destCP,
            ville: destVille,
            region: document.getElementById('dDestRegion')?.value || '',
            pays: document.getElementById('dDestPays')?.value || 'France',
            tel: document.getElementById('dDestTel').value.trim(),
            email: document.getElementById('dDestEmail')?.value || '',
            motDir: document.getElementById('dDestMotDir')?.value || '',
            contact: document.getElementById('dDestContact').value.trim()
        },

        // Livraison
        dateLiv: document.getElementById('dDateLiv')?.value || '',
        heureLiv: document.getElementById('dHeureLiv')?.value || '',
        refClient: document.getElementById('dRefClient')?.value || '',
        numBL: document.getElementById('dNumBL')?.value || '',
        refDest: document.getElementById('dRefDest')?.value || '',

        // Marchandises
        departement: dept,
        nature: document.getElementById('dNature')?.value || '',
        marchandises: marchandises,
        totalUM: totalUM,
        totalPoids: totalPoids,
        totalVol: totalVol,

        // Ancien format (compatibilité)
        um: totalUM,
        poids: totalPoids,
        volume: totalVol,

        // Valeur & Assurance
        valeur: parseFloat(document.getElementById('dValeur').value) || 0,
        devise: document.getElementById('dDevise').value,

        // Instructions
        instructions: document.getElementById('dInstructions').value.trim(),
        remarques: document.getElementById('dRemarques').value.trim(),

        // Statut initial
        status: 'pending',
        offres: [],
        devis: [],
        devisChoisi: null,
        transporteurId: null,
        transporteurNom: null,
        prixT: null,
        prixC: null,
        livraison: null,
        rejetMotif: null,
        factureEmise: false
    };

    // ══════════════════════════════════
    // 6. SAUVEGARDE
    // ══════════════════════════════════
    const ms = gM();
    ms.push(m);
    sM(ms);

    // ══════════════════════════════════
    // 7. FERMER ET RECHARGER
    // ══════════════════════════════════
    closeModal('demandeModal');
    loadExp();

    console.log('✅ Demande créée:', m.ref, m);
    alert('✅ Demande ' + m.ref + ' créée avec succès !\n'
        + totalUM + ' unités — ' + totalPoids.toFixed(1) + ' kg — ' + totalVol.toFixed(3) + ' m³\n'
        + 'Zones éligibles: ' + eligDepts(m.departement).join(', '));
}
function openDemande() {
    // ══════════════════════════════════
    // 1. PRÉ-REMPLIR EXPÉDITEUR
    // ══════════════════════════════════
    const u = JSON.parse(localStorage.getItem('w_cu'));
    console.log('🔍 currentUser (w_cu) =', JSON.stringify(u, null, 2));

    if (u) {
        document.getElementById('dExpNom').value = u.societe || ((u.prenom || '') + ' ' + (u.nom || '')).trim() || '';
        document.getElementById('dExpTel').value = u.tel || '';
        document.getElementById('dExpEmail').value = u.email || '';
        document.getElementById('dExpAddr').value = u.adresse || '';
        document.getElementById('dExpCP').value = u.cp || '';
        document.getElementById('dExpVille').value = u.ville || '';
    }

    // ══════════════════════════════════
    // 2. RESET ENLÈVEMENT
    // ══════════════════════════════════
    document.getElementById('dFromCity').value = '';
    document.getElementById('dFromAddr').value = '';
    document.getElementById('dEnlevDiff').checked = false;
    document.getElementById('enlevAdresseBloc').style.display = 'none';

    // Reset champs adresse enlèvement différente (si ils existent)
    const enlevFields = ['dEnlevAddr', 'dEnlevCP', 'dEnlevVille', 'dEnlevContact', 'dEnlevTel'];
    enlevFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // ══════════════════════════════════
    // 3. RESET DESTINATAIRE
    // ══════════════════════════════════
    const destFields = [
        'dDestCode', 'dDestNom', 'dDestAddr1', 'dDestAddr2',
        'dDestCP', 'dDestVille', 'dDestRegion', 'dDestPays',
        'dDestTel', 'dDestEmail', 'dDestMotDir', 'dDestContact'
    ];
    destFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // ══════════════════════════════════
    // 4. RESET TABLEAU MARCHANDISES
    // ══════════════════════════════════
    const tbody = document.getElementById('marchandisesBody');
    if (tbody) {
        tbody.innerHTML = ''; // Vider toutes les lignes
        ajouterLigneMarch();   // Remettre une ligne vide
    }

    // ══════════════════════════════════
    // 5. RESET TOTAUX
    // ══════════════════════════════════
    const totIds = ['totalUM', 'totalPoids', 'totalVol'];
    totIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });

    // ══════════════════════════════════
    // 6. RESET LIVRAISON / TRANSPORT
    // ══════════════════════════════════
    const transFields = ['dType', 'dNature', 'dValeur', 'dDevise', 'dNumBL', 'dRefDest'];
    transFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        }
    });

    // ══════════════════════════════════
    // 7. RESET INSTRUCTIONS / REMARQUES
    // ══════════════════════════════════
    const textFields = ['dInstructions', 'dRemarques'];
    textFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // ══════════════════════════════════
    // 8. RESET DATES
    // ══════════════════════════════════
    document.getElementById('dDate').value = new Date().toISOString().split('T')[0];

    const dateLiv = document.getElementById('dDateLiv');
    if (dateLiv) dateLiv.value = '';

    const heureLiv = document.getElementById('dHeureLiv');
    if (heureLiv) heureLiv.value = '';

    // ══════════════════════════════════
    // 9. OUVRIR LE MODAL
    // ══════════════════════════════════
    openModal('demandeModal');

    console.log('📋 Formulaire demande ouvert et réinitialisé');
}


// Init au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    initData();
    const sel = document.getElementById('regDept');
    Object.keys(DN).sort().forEach(function (k) {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = k + ' — ' + DN[k];
        sel.appendChild(o);
    });
    const s = localStorage.getItem('w_cu');
    if (s) {
        CU = JSON.parse(s);
        const r = CU.roles || [];
        activeRole = r.includes('admin') ? 'admin'
            : r.includes('expediteur') ? 'expediteur'
            : r.includes('transporteur') ? 'transporteur' : '';
        showNav();
        showDash();
    }
});

// Effet navbar scroll (mode public)
window.addEventListener('scroll', function () {
    const n = document.getElementById('navbar');
    if (window.scrollY > 100 && !CU) {
        n.classList.add('nav-scrolled');
        document.getElementById('navBrand').className = 'text-2xl font-black text-slate-900';
    } else if (!CU) {
        n.classList.remove('nav-scrolled');
        document.getElementById('navBrand').className = 'text-2xl font-black text-white';
    }
});
// ============================================
// GESTION TABLEAU MARCHANDISES
// ============================================

function ajouterLigneMarch() {
    const tbody = document.getElementById('marchandisesBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-um" value="1" min="1" oninput="calcTotaux()">
        </td>
        <td class="border border-slate-300 p-1">
            <select class="inp text-xs w-full m-type">
                <option>Palette</option>
                <option>Caisse</option>
                <option>Carton</option>
                <option>Roll</option>
                <option>Fût</option>
                <option>Sac</option>
                <option>Vrac</option>
                <option>Autre</option>
            </select>
        </td>
        <td class="border border-slate-300 p-1">
            <input type="text" class="inp text-xs w-full m-desc" placeholder="Description marchandise">
        </td>
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-poids" value="0" step="0.1" min="0" oninput="calcTotaux()">
        </td>
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-long" value="0" step="0.01" min="0" oninput="calcVolume(this)">
        </td>
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-larg" value="0" step="0.01" min="0" oninput="calcVolume(this)">
        </td>
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-haut" value="0" step="0.01" min="0" oninput="calcVolume(this)">
        </td>
        <td class="border border-slate-300 p-1">
            <input type="number" class="inp text-xs text-center w-full m-vol" value="0" step="0.001" readonly>
        </td>
        <td class="border border-slate-300 p-1 text-center">
            <button type="button" onclick="supprimerLigneMarch(this)" class="text-red-500 hover:text-red-700 font-bold text-lg">✕</button>
        </td>
    `;
    tbody.appendChild(tr);
}

function supprimerLigneMarch(btn) {
    const tbody = document.getElementById('marchandisesBody');
    if (tbody.rows.length > 1) {
        btn.closest('tr').remove();
        calcTotaux();
    } else {
        alert('Il faut au moins une ligne marchandise.');
    }
}

function calcVolume(input) {
    const tr = input.closest('tr');
    const longueur = parseFloat(tr.querySelector('.m-long').value) || 0;
    const largeur = parseFloat(tr.querySelector('.m-larg').value) || 0;
    const hauteur = parseFloat(tr.querySelector('.m-haut').value) || 0;
    const volume = longueur * largeur * hauteur;
    tr.querySelector('.m-vol').value = volume > 0 ? volume.toFixed(3) : '0';
    calcTotaux();
}

function calcTotaux() {
    const rows = document.querySelectorAll('#marchandisesBody tr');
    let totalUM = 0;
    let totalPoids = 0;
    let totalVol = 0;

    rows.forEach(row => {
        const qte = parseInt(row.querySelector('.m-um')?.value) || 0;
        const poids = parseFloat(row.querySelector('.m-poids')?.value) || 0;
        const vol = parseFloat(row.querySelector('.m-vol')?.value) || 0;

        totalUM += qte;
        totalPoids += poids * qte;
        totalVol += vol * qte;
    });

    document.getElementById('totalUM').textContent = totalUM;
    document.getElementById('totalPoids').textContent = totalPoids.toFixed(1);
    document.getElementById('totalVol').textContent = totalVol.toFixed(3);
}
// ============================================
// TOGGLE ADRESSE ENLEVEMENT DIFFERENTE
// ============================================
function toggleEnlevAdresse() {
    const checked = document.getElementById('dEnlevDiff').checked;
    document.getElementById('enlevAdresseBloc').style.display = checked ? 'block' : 'none';
}
/* ========================================================
   PAGE PROFIL — Ouvrir / Charger / Sauvegarder
   ======================================================== */

   function getCurrentUser() {
    return JSON.parse(localStorage.getItem('w_cu'));
}

function getAllUsers() {
    return JSON.parse(localStorage.getItem('w_us')) || [];
}

function saveCurrentUser(u) {
    localStorage.setItem('w_cu', JSON.stringify(u));
}

function saveAllUsers(users) {
    localStorage.setItem('w_us', JSON.stringify(users));
}

// ————— Ouvrir la page profil —————
function openProfilPage() {
    const u = getCurrentUser();
    if (!u) return alert('Aucun utilisateur connecté');

    // Masquer tous les dashboards
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById('profilPage').style.display = 'block';

    // Avatar (initiales)
    const initiales = ((u.prenom || '')[0] || '') + ((u.nom || '')[0] || '');
    document.getElementById('profilAvatar').textContent = initiales.toUpperCase() || '?';

    // Nom complet
    document.getElementById('profilFullName').textContent = 
        u.societe || ((u.prenom || '') + ' ' + (u.nom || '')).trim() || u.email;

    // Badges rôles
    const rolesDiv = document.getElementById('profilRoles');
    rolesDiv.innerHTML = '';
    (u.roles || []).forEach(role => {
        const badge = document.createElement('span');
        badge.className = role === 'transporteur' 
            ? 'px-3 py-1 bg-green-400/30 text-green-100 rounded-full text-sm font-semibold'
            : 'px-3 py-1 bg-blue-400/30 text-blue-100 rounded-full text-sm font-semibold';
        badge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        rolesDiv.appendChild(badge);
    });

    // Remplir le formulaire — Identité
    document.getElementById('profPrenom').value   = u.prenom   || '';
    document.getElementById('profNom').value      = u.nom      || '';
    document.getElementById('profSociete').value  = u.societe  || '';
    document.getElementById('profSiret').value    = u.siret    || '';

    // Contact
    document.getElementById('profEmail').value = u.email || '';
    document.getElementById('profTel').value   = u.tel   || '';

    // Adresse
    document.getElementById('profAdresse').value = u.adresse || '';
    document.getElementById('profCP').value      = u.cp      || '';
    document.getElementById('profVille').value   = u.ville   || '';
    document.getElementById('profPays').value    = u.pays    || 'France';

    // Section Transporteur (afficher si rôle transporteur)
    const transSection = document.getElementById('profilTransSection');
    if (u.roles && u.roles.includes('transporteur')) {
        transSection.style.display = 'block';
        const c = u.conformity || {};
        document.getElementById('profLicence').value       = c.licence        || '';
        document.getElementById('profImmatTracteur').value = c.immatTracteur  || '';
        document.getElementById('profImmatRemorque').value = c.immatRemorque  || '';
        document.getElementById('profTel247').value        = c.tel247         || '';
        document.getElementById('profDepartement').value   = u.departement    || '';
    } else {
        transSection.style.display = 'none';
    }

    // Reset mot de passe
    document.getElementById('profNewPwd').value     = '';
    document.getElementById('profConfirmPwd').value = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ————— Fermer la page profil —————
function closeProfilPage() {
    document.getElementById('profilPage').style.display = 'none';
    
    const u = getCurrentUser();
    if (!u) return;

    // Retourner au bon dashboard
    if (u.roles && u.roles.includes('transporteur')) {
        document.getElementById('dashboardTrans').style.display = 'block';
    } else if (u.roles && u.roles.includes('expediteur')) {
        document.getElementById('dashboardExp').style.display = 'block';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ————— Sauvegarder le profil —————
function saveProfile(e) {
    e.preventDefault();

    const u = getCurrentUser();
    if (!u) return alert('Erreur : utilisateur non trouvé');

    // Mot de passe
    const newPwd     = document.getElementById('profNewPwd').value.trim();
    const confirmPwd = document.getElementById('profConfirmPwd').value.trim();
    if (newPwd) {
        if (newPwd.length < 6) {
            return alert('Le mot de passe doit faire au moins 6 caractères');
        }
        if (newPwd !== confirmPwd) {
            return alert('Les mots de passe ne correspondent pas');
        }
        u.password = newPwd;
    }

    // Identité
    u.prenom  = document.getElementById('profPrenom').value.trim();
    u.nom     = document.getElementById('profNom').value.trim();
    u.societe = document.getElementById('profSociete').value.trim();
    u.siret   = document.getElementById('profSiret').value.trim();

    // Contact
    u.tel = document.getElementById('profTel').value.trim();

    // Adresse
    u.adresse = document.getElementById('profAdresse').value.trim();
    u.cp      = document.getElementById('profCP').value.trim();
    u.ville   = document.getElementById('profVille').value.trim();
    u.pays    = document.getElementById('profPays').value.trim();

    // Transporteur
    if (u.roles && u.roles.includes('transporteur')) {
        if (!u.conformity) u.conformity = {};
        u.conformity.licence       = document.getElementById('profLicence').value.trim();
        u.conformity.immatTracteur = document.getElementById('profImmatTracteur').value.trim();
        u.conformity.immatRemorque = document.getElementById('profImmatRemorque').value.trim();
        u.conformity.tel247        = document.getElementById('profTel247').value.trim();
        u.departement              = document.getElementById('profDepartement').value.trim();
    }

    // Sauvegarder dans w_cu
    saveCurrentUser(u);

    // Mettre à jour aussi dans w_us (liste de tous les users)
    let users = getAllUsers();
    const idx = users.findIndex(x => x.id === u.id || x.email === u.email);
    if (idx !== -1) {
        users[idx] = { ...users[idx], ...u };
        saveAllUsers(users);
    }

    // Feedback visuel
    showProfilToast('Profil mis à jour avec succès ✅');

    // Refresh le header de la page profil
    const initiales = ((u.prenom || '')[0] || '') + ((u.nom || '')[0] || '');
    document.getElementById('profilAvatar').textContent = initiales.toUpperCase();
    document.getElementById('profilFullName').textContent = 
        u.societe || ((u.prenom || '') + ' ' + (u.nom || '')).trim();
}

// ————— Toast notification —————
function showProfilToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold z-[9999] transition-all transform translate-y-0 opacity-100';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
