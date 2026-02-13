// ===== SUIVI PUBLIC =====
var dbSuivi = firebase.firestore();

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('suiviPublic');
    if (!container) return;

    container.innerHTML = `
        <div style="margin-top:32px; background:rgba(255,255,255,0.06); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:28px; max-width:600px;">
            <h3 style="color:white; font-weight:800; font-size:1.15rem; margin-bottom:16px;">📍 Suivre mon expédition</h3>
            <div style="display:flex; gap:10px;">
                <input 
                    id="suiviInput" 
                    type="text" 
                    placeholder="Ex: WASL-001" 
                    style="flex:1; padding:14px 18px; border-radius:12px; border:2px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.08); color:white; font-size:1rem; font-weight:600; outline:none; transition: border-color 0.3s;"
                    onfocus="this.style.borderColor='#3b82f6'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.15)'"
                    onkeypress="if(event.key==='Enter') rechercherSuivi()"
                />
                <button 
                    id="btnSuivi"
                    onclick="rechercherSuivi()"
                    style="padding:14px 28px; background:linear-gradient(135deg,#3b82f6,#06b6d4); color:white; border:none; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer; white-space:nowrap; transition: transform 0.2s, box-shadow 0.2s;"
                    onmouseenter="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 20px rgba(59,130,246,0.4)'"
                    onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='none'"
                >🔍 Suivre</button>
            </div>
            <div id="suiviResultat" style="display:none;"></div>
        </div>
    `;
});

// ===== RECHERCHE OPTIMISÉE =====
async function rechercherSuivi() {
    // ✅ APRÈS (avec validation)
const input = document.getElementById('suiviInput');
const btn = document.getElementById('btnSuivi');
const resultatDiv = document.getElementById('suiviResultat');
const numero = Validators.sanitize(input.value).toUpperCase().replace(/[^A-Z0-9\-_]/g, '');

if (!numero || numero.length < 3) {
    afficherErreur(resultatDiv, '⚠️', 'Numéro invalide', 'Entrez au moins 3 caractères alphanumériques');
    return;
}


    // Validation
    if (!numero) {
        afficherErreur(resultatDiv, '⚠️', 'Veuillez entrer un numéro de suivi', '');
        return;
    }

    // Format attendu
    if (!/^[A-Z]{2,10}-?\d{1,6}$/.test(numero) && numero.length < 3) {
        afficherErreur(resultatDiv, '⚠️', 'Format invalide', 'Essayez : WASL-001');
        return;
    }

    // État chargement
    btn.disabled = true;
    btn.innerHTML = '⏳';
    resultatDiv.style.display = 'block';
    resultatDiv.innerHTML = `
        <div style="text-align:center; padding:24px; margin-top:16px;">
            <div style="display:inline-block; width:32px; height:32px; border:3px solid rgba(147,197,253,0.3); border-top-color:#93c5fd; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
            <p style="color:#93c5fd; font-weight:600; margin-top:12px;">Recherche en cours...</p>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>`;

    try {
        let expedition = null;
        let expediteurInfo = null;

        // ===== MÉTHODE 1 : Collection racine (rapide — 1 lecture) =====
        const directSnap = await dbSuivi.collection('expeditions').doc(numero).get();
        
        if (directSnap.exists) {
            expedition = directSnap.data();
            // Récupérer info expéditeur si uid disponible
            if (expedition.userId) {
                const userSnap = await dbSuivi.collection('users').doc(expedition.userId).get();
                if (userSnap.exists) expediteurInfo = userSnap.data();
            }
        }

        // ===== MÉTHODE 2 : Fallback — recherche indexée =====
        if (!expedition) {
            // Chercher par champ "numero" dans la collection racine
            const querySnap = await dbSuivi.collection('expeditions')
                .where('numero', '==', numero)
                .limit(1)
                .get();

            if (!querySnap.empty) {
                expedition = querySnap.docs[0].data();
                if (expedition.userId) {
                    const userSnap = await dbSuivi.collection('users').doc(expedition.userId).get();
                    if (userSnap.exists) expediteurInfo = userSnap.data();
                }
            }
        }

        // ===== MÉTHODE 3 : Fallback legacy — sous-collections (ancien format) =====
        if (!expedition) {
            expedition = await rechercherDansSousCollections(numero);
        }

        // ===== AFFICHAGE =====
        if (expedition) {
            afficherResultat(resultatDiv, expedition, expediteurInfo, numero);
        } else {
            afficherErreur(resultatDiv, '❌', 'Aucune expédition trouvée', `Vérifiez le numéro <strong>${numero}</strong>`);
        }

    } catch (error) {
        console.error('Erreur suivi:', error);
        afficherErreur(resultatDiv, '⚠️', 'Erreur de connexion', error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔍 Suivre';
    }
}

// ===== FALLBACK : Recherche ancienne structure (sous-collections) =====
async function rechercherDansSousCollections(numero) {
    // Utiliser collectionGroup pour chercher dans TOUTES les sous-collections "demandes"
    // → 1 seule requête au lieu de N²
    try {
        const groupSnap = await dbSuivi.collectionGroup('demandes')
            .where('numero', '==', numero)
            .limit(1)
            .get();

        if (!groupSnap.empty) {
            return groupSnap.docs[0].data();
        }

        // Essayer avec d'autres champs
        const champs = ['id', 'numeroPEC', 'trackingNumber', 'numSuivi', 'reference'];
        for (const champ of champs) {
            const snap = await dbSuivi.collectionGroup('demandes')
                .where(champ, '==', numero)
                .limit(1)
                .get();
            if (!snap.empty) return snap.docs[0].data();
        }
    } catch (e) {
        // collectionGroup peut nécessiter un index Firestore
        console.warn('collectionGroup non disponible, fallback complet:', e.message);
        return await rechercherFallbackComplet(numero);
    }

    return null;
}

// ===== DERNIER FALLBACK : Scan complet (ancien code amélioré) =====
async function rechercherFallbackComplet(numero) {
    const usersSnap = await dbSuivi.collection('users').get();
    
    // Lancer toutes les requêtes en parallèle (pas en série !)
    const promises = usersSnap.docs.map(async (userDoc) => {
        const demandesSnap = await dbSuivi
            .collection('users').doc(userDoc.id)
            .collection('demandes').get();

        for (const demDoc of demandesSnap.docs) {
            const d = demDoc.data();
            const identifiants = [
                d.id, d.numero, d.numeroPEC, 
                d.trackingNumber, d.numSuivi, 
                d.reference, demDoc.id
            ].filter(Boolean).map(v => String(v).toUpperCase());

            if (identifiants.includes(numero)) {
                return { ...d, _docId: demDoc.id, _userId: userDoc.id };
            }
        }
        return null;
    });

    const results = await Promise.all(promises);
    return results.find(r => r !== null) || null;
}

// ===== AFFICHAGE RÉSULTAT =====
function afficherResultat(container, d, expediteurInfo, numero) {
    const statut = d.statut || d.status || 'En attente';
    const statutLower = statut.toLowerCase();

    // Couleurs et icônes par statut
    const statutConfig = getStatutConfig(statutLower);

    // Timeline des étapes
    const etapes = [
        { label: 'Confirmé', icon: '✓', key: 'confirm' },
        { label: 'Pris en charge', icon: '📦', key: 'prise' },
        { label: 'En transit', icon: '🚚', key: 'transit' },
        { label: 'Livré', icon: '✅', key: 'livre' }
    ];

    const etapeActive = getEtapeActive(statutLower);

    const timelineHTML = etapes.map((e, i) => {
        const isActive = i <= etapeActive;
        const isCurrent = i === etapeActive;
        return `
            <div style="display:flex; align-items:center; gap:10px; ${i > 0 ? 'margin-top:8px;' : ''}">
                <div style="
                    width:28px; height:28px; border-radius:50%; 
                    display:flex; align-items:center; justify-content:center;
                    font-size:12px; font-weight:700; flex-shrink:0;
                    ${isActive 
                        ? `background:${statutConfig.color}; color:white; box-shadow:0 0 12px ${statutConfig.color}40;` 
                        : 'background:rgba(255,255,255,0.1); color:#64748b;'}
                    ${isCurrent ? 'animation:pulse 2s infinite;' : ''}
                ">${isActive ? e.icon : '○'}</div>
                <span style="
                    font-weight:${isActive ? '700' : '400'}; 
                    font-size:0.85rem;
                    color:${isActive ? 'white' : '#64748b'};
                ">${e.label}</span>
                ${isCurrent ? `<span style="font-size:0.7rem; color:${statutConfig.color}; font-weight:600;">← Actuel</span>` : ''}
            </div>
            ${i < etapes.length - 1 ? `
                <div style="width:2px; height:16px; margin-left:13px; background:${i < etapeActive ? statutConfig.color : 'rgba(255,255,255,0.1)'};"></div>
            ` : ''}
        `;
    }).join('');

    const displayNumero = d.numero || d.id || d.numeroPEC || d.trackingNumber || d.numSuivi || d.reference || numero;

    container.innerHTML = `
        <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}</style>
        <div style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1)); border:2px solid ${statutConfig.color}30; border-radius:16px; padding:24px; margin-top:16px;">
            
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                    <span style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Expédition</span>
                    <p style="font-size:1.2rem; font-weight:900; color:white;">${displayNumero}</p>
                </div>
                <div style="background:${statutConfig.color}20; color:${statutConfig.color}; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.8rem; border:1px solid ${statutConfig.color}40;">
                    ${statutConfig.icon} ${statut}
                </div>
            </div>

            <!-- Infos grid -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
                <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px;">
                    <p style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">📍 Origine</p>
                    <p style="font-weight:700; color:white; font-size:0.9rem;">${d.origine || d.lieuDepart || d.villeDepart || '-'}</p>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px;">
                    <p style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">🚚 Destination</p>
                    <p style="font-weight:700; color:white; font-size:0.9rem;">${d.destination || d.lieuArrivee || d.villeArrivee || '-'}</p>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px;">
                    <p style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">📦 Marchandise</p>
                    <p style="font-weight:700; color:white; font-size:0.9rem;">${d.nature || d.marchandise || d.typeMarchandise || '-'}</p>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px;">
                    <p style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">📅 Date</p>
                    <p style="font-weight:700; color:white; font-size:0.9rem;">${d.date || d.dateCreation || '-'}</p>
                </div>
            </div>

            ${expediteurInfo ? `
            <div style="background:rgba(255,255,255,0.05); padding:14px; border-radius:12px; margin-bottom:16px;">
                <p style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">👤 Expéditeur</p>
                <p style="font-weight:700; color:white;">${expediteurInfo.nom || expediteurInfo.entreprise || '-'}</p>
            </div>` : ''}

            <!-- Timeline -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px;">
                <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">Progression</p>
                ${timelineHTML}
            </div>
        </div>
    `;
}

// ===== CONFIG STATUTS =====
function getStatutConfig(statutLower) {
    if (statutLower.includes('livr')) 
        return { color: '#10b981', icon: '✅' };
    if (statutLower.includes('transit') || statutLower.includes('route')) 
        return { color: '#3b82f6', icon: '🚚' };
    if (statutLower.includes('pris') || statutLower.includes('charge') || statutLower.includes('collect'))
        return { color: '#8b5cf6', icon: '📦' };
    if (statutLower.includes('confirm') || statutLower.includes('accept'))
        return { color: '#06b6d4', icon: '✓' };
    if (statutLower.includes('refus') || statutLower.includes('annul'))
        return { color: '#ef4444', icon: '❌' };
    return { color: '#f59e0b', icon: '⏳' };
}

function getEtapeActive(statutLower) {
    if (statutLower.includes('livr')) return 3;
    if (statutLower.includes('transit') || statutLower.includes('route')) return 2;
    if (statutLower.includes('pris') || statutLower.includes('charge') || statutLower.includes('collect')) return 1;
    return 0;
}

// ===== AFFICHAGE ERREUR =====
function afficherErreur(container, icon, titre, detail) {
    container.style.display = 'block';
    container.innerHTML = `
        <div style="background:rgba(239,68,68,0.1); border:2px solid rgba(239,68,68,0.3); border-radius:16px; padding:24px; text-align:center; margin-top:16px;">
            <span style="font-size:2rem;">${icon}</span>
            <p style="color:#fca5a5; font-weight:700; margin-top:8px;">${titre}</p>
            ${detail ? `<p style="color:#f87171; font-size:0.85rem; margin-top:4px;">${detail}</p>` : ''}
        </div>`;
}
