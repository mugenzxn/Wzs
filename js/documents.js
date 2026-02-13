// ===============================================
// documents.js — WASL Transport
// Gestion des documents : factures, CMR, attestations
// Version refactorisée — 2025
// ===============================================

// ===== UTILITAIRES DOCUMENTS =====

/**
 * Ouvre un document HTML dans la modale docModal
 */
function showDoc(html) {
    const content = document.getElementById('docContent');
    if (!content) {
        console.error('showDoc: #docContent introuvable');
        return;
    }
    content.innerHTML = html;
    openModal('docModal');
}

/**
 * Ouvre un document dans un nouvel onglet (pour impression)
 */
function openPrintWindow(html, title) {
    const w = window.open('', '_blank');
    if (!w) {
        alert('Popup bloquée — autorisez les popups pour imprimer.');
        return;
    }
    w.document.write(html);
    w.document.close();
    w.document.title = title || 'WASL Transport';
}

/**
 * Récupère une expédition par référence
 * Cherche dans toutes les sources possibles
 */
function getExpeditionByRef(ref) {
    if (!ref) return null;

    // 1. Variable globale currentExpeditions (dashboard)
    if (typeof currentExpeditions !== 'undefined' && Array.isArray(currentExpeditions)) {
        const found = currentExpeditions.find(e =>
            e.numero === ref || e.id === ref || e.numeroPEC === ref || e.reference === ref
        );
        if (found) return found;
    }

    // 2. Variable globale allExpeditions (admin)
    if (typeof allExpeditions !== 'undefined' && Array.isArray(allExpeditions)) {
        const found = allExpeditions.find(e =>
            e.numero === ref || e.id === ref || e.numeroPEC === ref || e.reference === ref
        );
        if (found) return found;
    }

    // 3. localStorage fallback
    const keys = Object.keys(localStorage).filter(k => k.startsWith('dem_'));
    for (const key of keys) {
        try {
            const d = JSON.parse(localStorage.getItem(key));
            if (d && (d.numero === ref || d.id === ref || d.numeroPEC === ref)) {
                return d;
            }
        } catch (e) { /* skip */ }
    }

    return null;
}

/**
 * Normalise les champs d'une expédition
 * Gère les différents formats de données
 */
function normaliserExpedition(d) {
    if (!d) return null;
    return {
        numero:       d.numero || d.id || d.numeroPEC || d.trackingNumber || d.numSuivi || d.reference || '-',
        expediteur:   d.expediteur || d.nomExpediteur || d.sender || d.entrepriseExp || '-',
        destinataire: d.destinataire || d.nomDestinataire || d.receiver || '-',
        origine:      d.origine || d.lieuDepart || d.villeDepart || d.depart || '-',
        destination:  d.destination || d.lieuArrivee || d.villeArrivee || d.arrivee || '-',
        nature:       d.nature || d.marchandise || d.typeMarchandise || d.description || '-',
        poids:        d.poids || d.weight || d.poidsKg || '-',
        nbColis:      d.nbColis || d.nombreColis || d.colis || d.quantite || '-',
        volume:       d.volume || d.volumeM3 || '-',
        date:         d.date || d.dateCreation || d.dateExpedition || new Date().toLocaleDateString('fr-FR'),
        dateLivraison: d.dateLivraison || d.dateLivraisonPrevue || '-',
        transporteur: d.transporteur || d.nomTransporteur || d.carrier || '-',
        statut:       d.statut || d.status || 'En attente',
        prix:         d.prix || d.montant || d.tarif || d.cout || 0,
        instructions: d.instructions || d.remarques || d.observation || '',
        telephone:    d.telephone || d.telExpediteur || d.phone || '-',
        email:        d.email || d.emailExpediteur || '-',
        adresseExp:   d.adresseExp || d.adresseExpediteur || '-',
        adresseDest:  d.adresseDest || d.adresseDestinataire || '-',
        mode:         d.mode || d.modeTransport || d.type || 'Routier',
        _raw: d  // données brutes pour debug
    };
}

/**
 * En-tête standard WASL pour tous les documents
 */
function waslHeader(options = {}) {
    const { color = '#1e40af', subtitle = '' } = options;
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:20px; border-bottom:3px solid ${color}; margin-bottom:24px;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:48px; height:48px; background:linear-gradient(135deg, ${color}, ${adjustColor(color, -30)}); border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:20px;">W</div>
                <div>
                    <div style="font-weight:900; font-size:18px; color:${color};">WASL Transport</div>
                    <div style="font-size:10px; color:#64748b;">Commissionnaire de transport</div>
                </div>
            </div>
            <div style="text-align:right;">
                ${subtitle ? `<div style="font-size:13px; font-weight:700; color:${color};">${subtitle}</div>` : ''}
                <div style="font-size:10px; color:#94a3b8;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            </div>
        </div>`;
}

/**
 * Pied de page standard
 */
function waslFooter(docType) {
    return `
        <div style="margin-top:30px; padding-top:15px; border-top:2px solid #e2e8f0; text-align:center; font-size:9px; color:#94a3b8;">
            <p><strong>WASL Transport</strong> — Commissionnaire de transport | SIRET : [À compléter] | TVA : FR [À compléter]</p>
            <p>📍 [Adresse] | 📞 [Téléphone] | ✉️ contact@wasl-transport.fr</p>
            <p style="margin-top:6px;">${docType} — Document généré automatiquement</p>
        </div>`;
}

/**
 * Assombrir/Éclaircir une couleur hex
 */
function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}


// ===============================================
// PHOTOS DE LIVRAISON
// ===============================================

function viewPhotos(ref) {
    if (!ref) { alert('Référence manquante'); return; }

    // Chercher les photos en localStorage
    const photosKey = 'ph_' + ref;
    const photosData = localStorage.getItem(photosKey);

    let photos = [];
    if (photosData) {
        try {
            photos = JSON.parse(photosData);
            if (!Array.isArray(photos)) photos = [photos];
        } catch (e) {
            // Peut-être une URL directe
            photos = [photosData];
        }
    }

    let html = `
        <div style="font-family:Arial; max-width:800px; margin:auto; padding:20px;">
            ${waslHeader({ subtitle: 'Photos de livraison' })}
            
            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px; margin-bottom:20px;">
                <span style="font-size:13px; font-weight:700; color:#0369a1;">📷 Expédition : ${ref}</span>
            </div>`;

    if (photos.length === 0) {
        html += `
            <div style="text-align:center; padding:60px 20px; background:#f8fafc; border-radius:12px; border:2px dashed #cbd5e1;">
                <span style="font-size:48px;">📭</span>
                <p style="color:#64748b; font-weight:600; margin-top:12px;">Aucune photo de livraison disponible</p>
                <p style="color:#94a3b8; font-size:12px; margin-top:6px;">Les photos seront ajoutées par le transporteur lors de la livraison</p>
            </div>`;
    } else {
        html += `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:16px;">`;
        photos.forEach((photo, i) => {
            const src = typeof photo === 'string' ? photo : (photo.url || photo.src || photo.data);
            const legend = typeof photo === 'object' ? (photo.legend || photo.description || '') : '';
            html += `
                <div style="border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <img src="${src}" alt="Photo ${i + 1}" 
                         style="width:100%; height:200px; object-fit:cover; cursor:pointer;" 
                         onclick="window.open('${src}','_blank')"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect fill=%22%23f1f5f9%22 width=%22300%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%2394a3b8%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>Image non disponible</text></svg>'"
                    />
                    <div style="padding:10px; background:white;">
                        <span style="font-size:11px; font-weight:600; color:#334155;">Photo ${i + 1}${legend ? ' — ' + legend : ''}</span>
                    </div>
                </div>`;
        });
        html += `</div>`;
    }

    html += waslFooter('Photos de livraison');
    html += `</div>`;

    showDoc(html);
}


// ===============================================
// FACTURE CLIENT (EXPÉDITEUR)
// ===============================================

function viewInvoiceClient(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const prix = parseFloat(d.prix) || 0;
    const tva = prix * 0.20;
    const ttc = prix + tva;
    const numFacture = 'FC-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const html = `
    <div style="font-family:Arial,sans-serif; max-width:800px; margin:auto; padding:30px; font-size:12px; line-height:1.6; color:#1e293b;">
        
        ${waslHeader({ color: '#1e40af', subtitle: 'FACTURE CLIENT' })}

        <!-- Numéro facture -->
        <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe); border:1px solid #93c5fd; border-radius:12px; padding:16px; margin-bottom:24px; text-align:center;">
            <span style="font-size:10px; color:#3b82f6; text-transform:uppercase; letter-spacing:2px;">Facture N°</span>
            <div style="font-size:20px; font-weight:900; color:#1e40af;">${numFacture}</div>
        </div>

        <!-- Expéditeur / Destinataire -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
            <div style="background:#f8fafc; border-radius:10px; padding:16px; border-left:4px solid #1e40af;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:8px; font-weight:700;">Facturé à</div>
                <div style="font-weight:800; font-size:14px; color:#1e293b;">${d.expediteur}</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">${d.adresseExp}</div>
                <div style="font-size:11px; color:#64748b;">${d.email}</div>
                <div style="font-size:11px; color:#64748b;">${d.telephone}</div>
            </div>
            <div style="background:#f8fafc; border-radius:10px; padding:16px; border-left:4px solid #06b6d4;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:8px; font-weight:700;">Détails expédition</div>
                <div style="font-size:11px;"><strong>Réf :</strong> ${d.numero}</div>
                <div style="font-size:11px;"><strong>Date :</strong> ${d.date}</div>
                <div style="font-size:11px;"><strong>Mode :</strong> ${d.mode}</div>
                <div style="font-size:11px;"><strong>Statut :</strong> ${d.statut}</div>
            </div>
        </div>

        <!-- Trajet -->
        <div style="background:#f0f9ff; border-radius:10px; padding:16px; margin-bottom:24px; display:flex; align-items:center; justify-content:center; gap:16px;">
            <div style="text-align:center;">
                <div style="font-size:10px; color:#64748b;">ORIGINE</div>
                <div style="font-weight:800; color:#1e293b; font-size:14px;">${d.origine}</div>
            </div>
            <div style="font-size:24px; color:#3b82f6;">→</div>
            <div style="text-align:center;">
                <div style="font-size:10px; color:#64748b;">DESTINATION</div>
                <div style="font-weight:800; color:#1e293b; font-size:14px;">${d.destination}</div>
            </div>
        </div>

        <!-- Tableau détails -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <thead>
                <tr style="background:#1e40af; color:white;">
                    <th style="padding:10px 14px; text-align:left; font-size:11px; border-radius:8px 0 0 0;">Description</th>
                    <th style="padding:10px 14px; text-align:center; font-size:11px;">Quantité</th>
                    <th style="padding:10px 14px; text-align:center; font-size:11px;">Poids</th>
                    <th style="padding:10px 14px; text-align:right; font-size:11px; border-radius:0 8px 0 0;">Montant HT</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px 14px;">
                        <div style="font-weight:700;">Transport ${d.mode}</div>
                        <div style="font-size:10px; color:#64748b;">${d.nature} — ${d.origine} → ${d.destination}</div>
                    </td>
                    <td style="padding:12px 14px; text-align:center;">${d.nbColis} colis</td>
                    <td style="padding:12px 14px; text-align:center;">${d.poids} kg</td>
                    <td style="padding:12px 14px; text-align:right; font-weight:700;">${prix.toFixed(2)} €</td>
                </tr>
            </tbody>
        </table>

        <!-- Totaux -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
            <div style="width:280px;">
                <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:12px;">
                    <span style="color:#64748b;">Total HT</span>
                    <span style="font-weight:600;">${prix.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:12px; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">TVA (20%)</span>
                    <span style="font-weight:600;">${tva.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:12px 0; font-size:16px;">
                    <span style="font-weight:900; color:#1e40af;">Total TTC</span>
                    <span style="font-weight:900; color:#1e40af;">${ttc.toFixed(2)} €</span>
                </div>
            </div>
        </div>

        <!-- Conditions -->
        <div style="background:#f8fafc; border-radius:10px; padding:14px; font-size:10px; color:#64748b; margin-bottom:20px;">
            <strong>Conditions de paiement :</strong> Paiement à 30 jours date de facture. 
            Pénalités de retard : 3 fois le taux d'intérêt légal. 
            Indemnité forfaitaire de recouvrement : 40 €.
            <br><strong>Règlement par :</strong> Virement bancaire — IBAN : [À compléter]
        </div>

        ${waslFooter('Facture client ' + numFacture)}
    </div>`;

    showDoc(html);
}
// ===============================================
// FACTURE TRANSPORTEUR
// ===============================================

function viewInvoiceTransporteur(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const prix = parseFloat(d.prix) || 0;
    const commission = prix * 0.15; // 15% commission WASL
    const netTransporteur = prix - commission;
    const tva = netTransporteur * 0.20;
    const ttc = netTransporteur + tva;
    const numFacture = 'FT-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const html = `
    <div style="font-family:Arial,sans-serif; max-width:800px; margin:auto; padding:30px; font-size:12px; line-height:1.6; color:#1e293b;">
        
        ${waslHeader({ color: '#059669', subtitle: 'FACTURE TRANSPORTEUR' })}

        <!-- Numéro facture -->
        <div style="background:linear-gradient(135deg, #ecfdf5, #d1fae5); border:1px solid #6ee7b7; border-radius:12px; padding:16px; margin-bottom:24px; text-align:center;">
            <span style="font-size:10px; color:#059669; text-transform:uppercase; letter-spacing:2px;">Facture N°</span>
            <div style="font-size:20px; font-weight:900; color:#047857;">${numFacture}</div>
        </div>

        <!-- Parties -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">
            <div style="background:#f8fafc; border-radius:10px; padding:16px; border-left:4px solid #059669;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:8px; font-weight:700;">Émetteur</div>
                <div style="font-weight:800; font-size:14px; color:#1e293b;">WASL Transport</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">Commissionnaire de transport</div>
                <div style="font-size:11px; color:#64748b;">SIRET : [À compléter]</div>
                <div style="font-size:11px; color:#64748b;">contact@wasl-transport.fr</div>
            </div>
            <div style="background:#f8fafc; border-radius:10px; padding:16px; border-left:4px solid #0891b2;">
                <div style="font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:8px; font-weight:700;">Transporteur</div>
                <div style="font-weight:800; font-size:14px; color:#1e293b;">${d.transporteur}</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">Licence : [N° licence]</div>
            </div>
        </div>

        <!-- Trajet -->
        <div style="background:#f0fdf4; border-radius:10px; padding:16px; margin-bottom:24px; display:flex; align-items:center; justify-content:center; gap:16px;">
            <div style="text-align:center;">
                <div style="font-size:10px; color:#64748b;">ENLÈVEMENT</div>
                <div style="font-weight:800; color:#1e293b; font-size:14px;">${d.origine}</div>
            </div>
            <div style="font-size:24px; color:#059669;">🚛 →</div>
            <div style="text-align:center;">
                <div style="font-size:10px; color:#64748b;">LIVRAISON</div>
                <div style="font-weight:800; color:#1e293b; font-size:14px;">${d.destination}</div>
            </div>
        </div>

        <!-- Détails mission -->
        <div style="background:#f8fafc; border-radius:10px; padding:16px; margin-bottom:24px;">
            <div style="font-size:11px; font-weight:700; color:#334155; margin-bottom:12px; text-transform:uppercase;">Détails de la mission</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Référence</div>
                    <div style="font-weight:700; color:#1e293b;">${d.numero}</div>
                </div>
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Date expédition</div>
                    <div style="font-weight:700; color:#1e293b;">${d.date}</div>
                </div>
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Mode</div>
                    <div style="font-weight:700; color:#1e293b;">${d.mode}</div>
                </div>
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Marchandise</div>
                    <div style="font-weight:700; color:#1e293b;">${d.nature}</div>
                </div>
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Poids</div>
                    <div style="font-weight:700; color:#1e293b;">${d.poids} kg</div>
                </div>
                <div>
                    <div style="font-size:10px; color:#94a3b8;">Colis</div>
                    <div style="font-weight:700; color:#1e293b;">${d.nbColis}</div>
                </div>
            </div>
        </div>

        <!-- Tableau financier -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <thead>
                <tr style="background:#059669; color:white;">
                    <th style="padding:10px 14px; text-align:left; font-size:11px; border-radius:8px 0 0 0;">Désignation</th>
                    <th style="padding:10px 14px; text-align:right; font-size:11px; border-radius:0 8px 0 0;">Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px 14px;">
                        <div style="font-weight:700;">Prix total du transport</div>
                        <div style="font-size:10px; color:#64748b;">${d.origine} → ${d.destination}</div>
                    </td>
                    <td style="padding:12px 14px; text-align:right; font-weight:600;">${prix.toFixed(2)} €</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#fef2f2;">
                    <td style="padding:12px 14px;">
                        <div style="font-weight:700; color:#dc2626;">Commission WASL (15%)</div>
                        <div style="font-size:10px; color:#64748b;">Commission commissionnaire de transport</div>
                    </td>
                    <td style="padding:12px 14px; text-align:right; font-weight:600; color:#dc2626;">- ${commission.toFixed(2)} €</td>
                </tr>
                <tr style="background:#f0fdf4;">
                    <td style="padding:12px 14px;">
                        <div style="font-weight:800; color:#059669;">Net transporteur HT</div>
                    </td>
                    <td style="padding:12px 14px; text-align:right; font-weight:800; color:#059669;">${netTransporteur.toFixed(2)} €</td>
                </tr>
            </tbody>
        </table>

        <!-- Totaux -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
            <div style="width:280px; background:#f0fdf4; border-radius:10px; padding:16px;">
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px;">
                    <span style="color:#64748b;">Net HT</span>
                    <span style="font-weight:600;">${netTransporteur.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:12px; border-bottom:1px solid #d1fae5;">
                    <span style="color:#64748b;">TVA (20%)</span>
                    <span style="font-weight:600;">${tva.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px 0; font-size:16px;">
                    <span style="font-weight:900; color:#047857;">Net TTC</span>
                    <span style="font-weight:900; color:#047857;">${ttc.toFixed(2)} €</span>
                </div>
            </div>
        </div>

        <!-- Conditions -->
        <div style="background:#f8fafc; border-radius:10px; padding:14px; font-size:10px; color:#64748b; margin-bottom:20px;">
            <strong>Conditions de règlement :</strong> Virement sous 15 jours après validation de la livraison.
            <br><strong>Coordonnées bancaires WASL :</strong> IBAN [À compléter] — BIC [À compléter]
            <br><strong>Important :</strong> La facture doit être accompagnée du CMR signé et des photos de livraison pour déclencher le paiement.
        </div>

        ${waslFooter('Facture transporteur ' + numFacture)}
    </div>`;

    showDoc(html);
}


// ===============================================
// ATTESTATION DE PRISE EN CHARGE
// ===============================================

function genAttestation(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const numAttest = 'ATT-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const html = `
    <div style="font-family:Arial,sans-serif; max-width:800px; margin:auto; padding:30px; font-size:12px; line-height:1.6; color:#1e293b;">
        
        ${waslHeader({ color: '#7c3aed', subtitle: 'ATTESTATION DE PRISE EN CHARGE' })}

        <!-- Numéro attestation -->
        <div style="background:linear-gradient(135deg, #f5f3ff, #ede9fe); border:1px solid #c4b5fd; border-radius:12px; padding:16px; margin-bottom:24px; text-align:center;">
            <span style="font-size:10px; color:#7c3aed; text-transform:uppercase; letter-spacing:2px;">Attestation N°</span>
            <div style="font-size:20px; font-weight:900; color:#6d28d9;">${numAttest}</div>
            <div style="font-size:11px; color:#8b5cf6; margin-top:4px;">Référence expédition : ${d.numero}</div>
        </div>

        <!-- Corps de l'attestation -->
        <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:24px;">
            
            <p style="font-size:13px; line-height:1.8; text-align:justify;">
                La société <strong>WASL Transport</strong>, agissant en qualité de commissionnaire de transport 
                conformément aux articles <strong>L.1411-1 et suivants du Code des transports</strong>, 
                atteste par la présente avoir pris en charge l'expédition suivante :
            </p>

            <!-- Détails expédition -->
            <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; padding:20px; margin:20px 0;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div>
                        <div style="font-size:10px; color:#7c3aed; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Expéditeur</div>
                        <div style="font-weight:800; font-size:14px;">${d.expediteur}</div>
                        <div style="font-size:11px; color:#64748b;">${d.adresseExp}</div>
                        <div style="font-size:11px; color:#64748b;">${d.telephone}</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#7c3aed; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Destinataire</div>
                        <div style="font-weight:800; font-size:14px;">${d.destinataire}</div>
                        <div style="font-size:11px; color:#64748b;">${d.adresseDest}</div>
                    </div>
                </div>

                <div style="height:1px; background:#e9d5ff; margin:16px 0;"></div>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Trajet</div>
                        <div style="font-weight:700;">${d.origine} → ${d.destination}</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Date de prise en charge</div>
                        <div style="font-weight:700;">${d.date}</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Livraison prévue</div>
                        <div style="font-weight:700;">${d.dateLivraison}</div>
                    </div>
                </div>

                <div style="height:1px; background:#e9d5ff; margin:16px 0;"></div>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;">
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Marchandise</div>
                        <div style="font-weight:700;">${d.nature}</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Poids brut</div>
                        <div style="font-weight:700;">${d.poids} kg</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Nombre de colis</div>
                        <div style="font-weight:700;">${d.nbColis}</div>
                    </div>
                    <div>
                        <div style="font-size:10px; color:#94a3b8;">Volume</div>
                        <div style="font-weight:700;">${d.volume} m³</div>
                    </div>
                </div>
            </div>

            <!-- Transporteur désigné -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px; margin-bottom:20px;">
                <div style="font-size:10px; color:#059669; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Transporteur désigné</div>
                <div style="font-weight:800; font-size:14px;">${d.transporteur}</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">Mode de transport : ${d.mode}</div>
            </div>

            <!-- Engagements -->
            <div style="margin-top:20px;">
                <div style="font-size:12px; font-weight:700; color:#334155; margin-bottom:10px;">Engagements :</div>
                <ul style="font-size:11px; color:#475569; padding-left:20px; line-height:2;">
                    <li>Organiser le transport dans les meilleurs délais et conditions.</li>
                    <li>Assurer le suivi de l'expédition et informer le client de tout incident.</li>
                    <li>Garantir la conformité aux réglementations en vigueur (Code des transports, Convention CMR le cas échéant).</li>
                    <li>Responsabilité limitée conformément aux CGV de WASL Transport et à la législation applicable.</li>
                </ul>
            </div>

            ${d.instructions ? `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-top:16px;">
                <div style="font-size:10px; color:#d97706; font-weight:700; margin-bottom:4px;">⚠️ Instructions particulières</div>
                <div style="font-size:11px; color:#92400e;">${d.instructions}</div>
            </div>` : ''}
        </div>

        <!-- Signatures -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
            <div style="background:#f8fafc; border-radius:10px; padding:20px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:40px;">Pour WASL Transport</div>
                <div style="border-top:1px dashed #94a3b8; padding-top:8px; font-size:10px; color:#94a3b8;">
                    Signature et cachet
                </div>
            </div>
            <div style="background:#f8fafc; border-radius:10px; padding:20px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:40px;">L'expéditeur (lu et approuvé)</div>
                <div style="border-top:1px dashed #94a3b8; padding-top:8px; font-size:10px; color:#94a3b8;">
                    Signature et cachet
                </div>
            </div>
        </div>

        ${waslFooter('Attestation ' + numAttest)}
    </div>`;

    showDoc(html);
}


// ===============================================
// ATTESTATION VERSION IMPRIMABLE (nouvelle fenêtre)
// ===============================================

function printAttestation(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const numAttest = 'ATT-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const printHtml = `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Attestation ${numAttest}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial,sans-serif; font-size:11px; line-height:1.6; color:#1e293b; padding:30px; }
            .header { display:flex; justify-content:space-between; align-items:center; padding-bottom:16px; border-bottom:3px solid #7c3aed; margin-bottom:20px; }
            .logo { font-weight:900; font-size:18px; color:#7c3aed; }
            .logo-sub { font-size:9px; color:#64748b; }
            .doc-num { text-align:center; background:#f5f3ff; border:1px solid #c4b5fd; border-radius:8px; padding:12px; margin-bottom:20px; }
            .doc-num .label { font-size:9px; color:#7c3aed; text-transform:uppercase; letter-spacing:2px; }
            .doc-num .value { font-size:18px; font-weight:900; color:#6d28d9; }
            .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
            .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
            .grid-4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; }
            .box { background:#faf5ff; border:1px solid #e9d5ff; border-radius:8px; padding:14px; }
            .box-green { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px; }
            .label-sm { font-size:9px; color:#7c3aed; font-weight:700; text-transform:uppercase; margin-bottom:3px; }
            .label-grey { font-size:9px; color:#94a3b8; }
            .value-lg { font-weight:800; font-size:13px; }
            .value-md { font-weight:700; font-size:11px; }
            .separator { height:1px; background:#e9d5ff; margin:12px 0; }
            .signatures { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
            .sig-box { border:1px solid #e2e8f0; border-radius:8px; padding:16px; text-align:center; min-height:100px; }
            .sig-label { font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase; }
            .sig-line { border-top:1px dashed #94a3b8; margin-top:50px; padding-top:6px; font-size:9px; color:#94a3b8; }
            .footer { margin-top:24px; padding-top:12px; border-top:2px solid #e2e8f0; text-align:center; font-size:8px; color:#94a3b8; }
            @media print {
                body { padding:15px; }
                .no-print { display:none; }
            }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 24px;background:#7c3aed;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;">🖨️ Imprimer</button>
        
        <div class="header">
            <div>
                <div class="logo">WASL Transport</div>
                <div class="logo-sub">Commissionnaire de transport</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px; font-weight:700; color:#7c3aed;">ATTESTATION DE PRISE EN CHARGE</div>
                <div style="font-size:9px; color:#94a3b8;">${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <div class="doc-num">
            <div class="label">Attestation N°</div>
            <div class="value">${numAttest}</div>
        </div>

        <p style="font-size:11px; line-height:1.8; text-align:justify; margin-bottom:16px;">
            La société <strong>WASL Transport</strong>, commissionnaire de transport (art. L.1411-1 Code des transports), 
            atteste avoir pris en charge l'expédition suivante :
        </p>

        <div class="box" style="margin-bottom:16px;">
            <div class="grid-2">
                <div>
                    <div class="label-sm">Expéditeur</div>
                    <div class="value-lg">${d.expediteur}</div>
                    <div style="font-size:10px; color:#64748b;">${d.adresseExp} — ${d.telephone}</div>
                </div>
                <div>
                    <div class="label-sm">Destinataire</div>
                    <div class="value-lg">${d.destinataire}</div>
                    <div style="font-size:10px; color:#64748b;">${d.adresseDest}</div>
                </div>
            </div>
            <div class="separator"></div>
            <div class="grid-3">
                <div><div class="label-grey">Trajet</div><div class="value-md">${d.origine} → ${d.destination}</div></div>
                <div><div class="label-grey">Date prise en charge</div><div class="value-md">${d.date}</div></div>
                <div><div class="label-grey">Livraison prévue</div><div class="value-md">${d.dateLivraison}</div></div>
            </div>
            <div class="separator"></div>
            <div class="grid-4">
                <div><div class="label-grey">Marchandise</div><div class="value-md">${d.nature}</div></div>
                <div><div class="label-grey">Poids</div><div class="value-md">${d.poids} kg</div></div>
                <div><div class="label-grey">Colis</div><div class="value-md">${d.nbColis}</div></div>
                <div><div class="label-grey">Volume</div><div class="value-md">${d.volume} m³</div></div>
            </div>
        </div>

        <div class="box-green" style="margin-bottom:16px;">
            <div style="font-size:9px; color:#059669; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Transporteur désigné</div>
            <div class="value-lg">${d.transporteur}</div>
            <div style="font-size:10px; color:#64748b;">Mode : ${d.mode}</div>
        </div>

        <div class="signatures">
            <div class="sig-box">
                <div class="sig-label">Pour WASL Transport</div>
                <div class="sig-line">Signature et cachet</div>
            </div>
            <div class="sig-box">
                <div class="sig-label">L'expéditeur</div>
                <div class="sig-line">Signature et cachet</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>WASL Transport</strong> — Commissionnaire de transport | SIRET : [À compléter]</p>
            <p>Attestation ${numAttest} — Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
    </body>
    </html>`;

    openPrintWindow(printHtml, 'Attestation ' + numAttest);
}
// ===============================================
// LETTRE DE VOITURE CMR
// ===============================================

function genCMR(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const numCMR = 'CMR-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const html = `
    <div style="font-family:Arial,sans-serif; max-width:850px; margin:auto; padding:20px; font-size:11px; line-height:1.5; color:#1e293b;">

        <!-- En-tête CMR -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #dc2626; padding-bottom:12px; margin-bottom:16px;">
            <div>
                <div style="font-weight:900; font-size:22px; color:#dc2626; letter-spacing:2px;">CMR</div>
                <div style="font-size:9px; color:#64748b;">LETTRE DE VOITURE INTERNATIONALE</div>
                <div style="font-size:8px; color:#94a3b8;">Convention relative au contrat de transport international de marchandises par route (Genève, 19 mai 1956)</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:10px; color:#64748b;">N° du document</div>
                <div style="font-weight:900; font-size:16px; color:#dc2626;">${numCMR}</div>
                <div style="font-size:9px; color:#94a3b8;">Réf : ${d.numero}</div>
            </div>
        </div>

        <!-- Grille CMR principale -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0; border:2px solid #1e293b; margin-bottom:2px;">
            
            <!-- Case 1 : Expéditeur -->
            <div style="border-right:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">1. Expéditeur (nom, adresse, pays)</div>
                <div style="font-weight:700; font-size:12px;">${d.expediteur}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">${d.adresseExp}</div>
                <div style="font-size:10px; color:#475569;">Tél : ${d.telephone}</div>
            </div>

            <!-- Case 16 : Transporteur -->
            <div style="border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">16. Transporteur (nom, adresse, pays)</div>
                <div style="font-weight:700; font-size:12px;">${d.transporteur}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">Mandaté par WASL Transport</div>
            </div>

            <!-- Case 2 : Destinataire -->
            <div style="border-right:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">2. Destinataire (nom, adresse, pays)</div>
                <div style="font-weight:700; font-size:12px;">${d.destinataire}</div>
                <div style="font-size:10px; color:#475569; margin-top:2px;">${d.adresseDest}</div>
            </div>

            <!-- Case 17 : Transporteurs successifs -->
            <div style="border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">17. Transporteurs successifs</div>
                <div style="font-size:10px; color:#94a3b8; font-style:italic;">Néant</div>
            </div>

            <!-- Case 3 : Lieu de livraison -->
            <div style="border-right:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">3. Lieu prévu pour la livraison</div>
                <div style="font-weight:700; font-size:13px;">${d.destination}</div>
                <div style="font-size:10px; color:#475569;">Date prévue : ${d.dateLivraison}</div>
            </div>

            <!-- Case 18 : Réserves -->
            <div style="border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">18. Réserves et observations du transporteur</div>
                <div style="font-size:10px; color:#94a3b8; font-style:italic;">Néant</div>
            </div>

            <!-- Case 4 : Lieu et date de prise en charge -->
            <div style="border-right:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">4. Lieu et date de prise en charge</div>
                <div style="font-weight:700; font-size:13px;">${d.origine}</div>
                <div style="font-size:10px; color:#475569;">Le ${d.date}</div>
            </div>

            <!-- Case 19 : Conventions particulières -->
            <div style="border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">19. Conventions particulières</div>
                <div style="font-size:10px; color:#475569;">${d.instructions || 'Néant'}</div>
            </div>
        </div>

        <!-- Section marchandises (pleine largeur) -->
        <div style="border:2px solid #1e293b; border-top:none; margin-bottom:2px;">
            
            <!-- Case 5 : Documents annexés -->
            <div style="border-bottom:1px solid #1e293b; padding:10px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">5. Documents annexés</div>
                <div style="font-size:10px; color:#475569;">Bon de livraison, facture commerciale</div>
            </div>

            <!-- Cases 6-12 : Tableau marchandises -->
            <div style="border-bottom:1px solid #1e293b;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#fef2f2;">
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:left; font-size:9px; font-weight:800; color:#dc2626;">6. Marques et numéros</th>
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:left; font-size:9px; font-weight:800; color:#dc2626;">7. Nombre de colis</th>
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:left; font-size:9px; font-weight:800; color:#dc2626;">8. Mode d'emballage</th>
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:left; font-size:9px; font-weight:800; color:#dc2626;">9. Nature de la marchandise</th>
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:left; font-size:9px; font-weight:800; color:#dc2626;">10. N° statistique</th>
                            <th style="padding:8px; border-right:1px solid #1e293b; text-align:right; font-size:9px; font-weight:800; color:#dc2626;">11. Poids brut (kg)</th>
                            <th style="padding:8px; text-align:right; font-size:9px; font-weight:800; color:#dc2626;">12. Volume (m³)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:10px; border-right:1px solid #e2e8f0; font-weight:600;">${d.numero}</td>
                            <td style="padding:10px; border-right:1px solid #e2e8f0; text-align:center; font-weight:700; font-size:14px;">${d.nbColis}</td>
                            <td style="padding:10px; border-right:1px solid #e2e8f0;">${d.emballage || 'Standard'}</td>
                            <td style="padding:10px; border-right:1px solid #e2e8f0; font-weight:700;">${d.nature}</td>
                            <td style="padding:10px; border-right:1px solid #e2e8f0; color:#94a3b8;">—</td>
                            <td style="padding:10px; border-right:1px solid #e2e8f0; text-align:right; font-weight:700; font-size:14px;">${d.poids}</td>
                            <td style="padding:10px; text-align:right; font-weight:700;">${d.volume}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Cases 13-15 : Instructions -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; border-bottom:1px solid #1e293b;">
                <div style="border-right:1px solid #1e293b; padding:10px;">
                    <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">13. Instructions de l'expéditeur</div>
                    <div style="font-size:10px; color:#475569;">${d.instructions || 'Aucune'}</div>
                </div>
                <div style="border-right:1px solid #1e293b; padding:10px;">
                    <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">14. Prescriptions d'affranchissement</div>
                    <div style="font-size:10px; color:#475569;">Port payé</div>
                </div>
                <div style="padding:10px;">
                    <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">15. Remboursement</div>
                    <div style="font-size:10px; color:#94a3b8;">Néant</div>
                </div>
            </div>

            <!-- Case 20 : À payer -->
            <div style="padding:10px; border-bottom:1px solid #1e293b;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:6px;">20. À payer par</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
                    <div>
                        <div style="font-size:9px; color:#64748b;">Expéditeur</div>
                        <div style="font-weight:700;">${parseFloat(d.prix).toFixed(2)} €</div>
                    </div>
                    <div>
                        <div style="font-size:9px; color:#64748b;">Devise</div>
                        <div style="font-weight:700;">EUR</div>
                    </div>
                    <div>
                        <div style="font-size:9px; color:#64748b;">Destinataire</div>
                        <div style="font-weight:700;">—</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cases 21-24 : Signatures -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0; border:2px solid #1e293b; border-top:none;">
            <div style="border-right:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:12px; min-height:90px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">21. Établi à</div>
                <div style="font-weight:700;">${d.origine}</div>
                <div style="font-size:10px; color:#475569;">Le ${d.date}</div>
            </div>
            <div style="border-bottom:1px solid #1e293b; padding:12px; min-height:90px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">22. Signature de l'expéditeur</div>
                <div style="margin-top:40px; border-top:1px dashed #94a3b8; padding-top:6px; font-size:9px; color:#94a3b8;">Date et signature</div>
            </div>
            <div style="border-right:1px solid #1e293b; padding:12px; min-height:90px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">23. Signature du transporteur</div>
                <div style="margin-top:40px; border-top:1px dashed #94a3b8; padding-top:6px; font-size:9px; color:#94a3b8;">Date et signature</div>
            </div>
            <div style="padding:12px; min-height:90px;">
                <div style="font-size:9px; font-weight:800; color:#dc2626; margin-bottom:4px;">24. Marchandise reçue — Signature du destinataire</div>
                <div style="margin-top:40px; border-top:1px dashed #94a3b8; padding-top:6px; font-size:9px; color:#94a3b8;">Date et signature</div>
            </div>
        </div>

        <!-- Pied CMR -->
        <div style="margin-top:12px; text-align:center; font-size:8px; color:#94a3b8;">
            <p>Ce document a été établi conformément à la Convention CMR — Généré par <strong>WASL Transport</strong></p>
            <p>${numCMR} — ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
    </div>`;

    showDoc(html);
}


// ===============================================
// CMR VERSION IMPRIMABLE
// ===============================================

function printCMR(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const numCMR = 'CMR-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const printHtml = `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>CMR ${numCMR}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial,sans-serif; font-size:10px; line-height:1.4; color:#1e293b; padding:20px; }
            .cmr-header { display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #dc2626; padding-bottom:10px; margin-bottom:14px; }
            .cmr-title { font-weight:900; font-size:24px; color:#dc2626; letter-spacing:3px; }
            .cmr-grid { display:grid; grid-template-columns:1fr 1fr; border:2px solid #1e293b; }
            .cmr-cell { border:1px solid #1e293b; padding:8px; }
            .cmr-label { font-size:8px; font-weight:800; color:#dc2626; margin-bottom:4px; }
            .cmr-value { font-weight:700; font-size:11px; }
            .cmr-sub { font-size:9px; color:#475569; }
            .cmr-full { grid-column:1/-1; }
            table { width:100%; border-collapse:collapse; }
            th { background:#fef2f2; padding:6px; font-size:8px; font-weight:800; color:#dc2626; border:1px solid #1e293b; text-align:left; }
            td { padding:8px; border:1px solid #e2e8f0; }
            .sig-grid { display:grid; grid-template-columns:1fr 1fr; border:2px solid #1e293b; border-top:none; }
            .sig-cell { border:1px solid #1e293b; padding:10px; min-height:80px; }
            .sig-line { margin-top:35px; border-top:1px dashed #94a3b8; padding-top:4px; font-size:8px; color:#94a3b8; }
            .footer { margin-top:16px; text-align:center; font-size:7px; color:#94a3b8; }
            @media print {
                body { padding:10px; }
                .no-print { display:none !important; }
            }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;z-index:999;">🖨️ Imprimer CMR</button>

        <div class="cmr-header">
            <div>
                <div class="cmr-title">CMR</div>
                <div style="font-size:8px; color:#64748b;">LETTRE DE VOITURE INTERNATIONALE</div>
                <div style="font-size:7px; color:#94a3b8;">Convention de Genève, 19 mai 1956</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:9px; color:#64748b;">N° du document</div>
                <div style="font-weight:900; font-size:16px; color:#dc2626;">${numCMR}</div>
                <div style="font-size:8px; color:#94a3b8;">Réf : ${d.numero}</div>
            </div>
        </div>

        <div class="cmr-grid">
            <div class="cmr-cell">
                <div class="cmr-label">1. Expéditeur</div>
                <div class="cmr-value">${d.expediteur}</div>
                <div class="cmr-sub">${d.adresseExp}<br>Tél : ${d.telephone}</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">16. Transporteur</div>
                <div class="cmr-value">${d.transporteur}</div>
                <div class="cmr-sub">Mandaté par WASL Transport</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">2. Destinataire</div>
                <div class="cmr-value">${d.destinataire}</div>
                <div class="cmr-sub">${d.adresseDest}</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">17. Transporteurs successifs</div>
                <div class="cmr-sub" style="font-style:italic;">Néant</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">3. Lieu de livraison</div>
                <div class="cmr-value">${d.destination}</div>
                <div class="cmr-sub">Date prévue : ${d.dateLivraison}</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">18. Réserves du transporteur</div>
                <div class="cmr-sub" style="font-style:italic;">Néant</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">4. Lieu et date de prise en charge</div>
                <div class="cmr-value">${d.origine}</div>
                <div class="cmr-sub">Le ${d.date}</div>
            </div>
            <div class="cmr-cell">
                <div class="cmr-label">19. Conventions particulières</div>
                <div class="cmr-sub">${d.instructions || 'Néant'}</div>
            </div>
        </div>

        <!-- Marchandises (pleine largeur) -->
        <div style="border:2px solid #1e293b; border-top:none;">
            <div class="cmr-cell">
                <div class="cmr-label">5. Documents annexés</div>
                <div class="cmr-sub">Bon de livraison, facture commerciale</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>6. Marques</th>
                        <th>7. Colis</th>
                        <th>8. Emballage</th>
                        <th>9. Nature</th>
                        <th>10. N° stat.</th>
                        <th style="text-align:right;">11. Poids (kg)</th>
                        <th style="text-align:right;">12. Volume (m³)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight:600;">${d.numero}</td>
                        <td style="text-align:center; font-weight:700; font-size:13px;">${d.nbColis}</td>
                        <td>${d.emballage || 'Standard'}</td>
                        <td style="font-weight:700;">${d.nature}</td>
                        <td style="color:#94a3b8;">—</td>
                        <td style="text-align:right; font-weight:700; font-size:13px;">${d.poids}</td>
                        <td style="text-align:right; font-weight:700;">${d.volume}</td>
                    </tr>
                </tbody>
            </table>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid #1e293b;">
                <div class="cmr-cell" style="border-right:1px solid #1e293b;">
                    <div class="cmr-label">13. Instructions expéditeur</div>
                    <div class="cmr-sub">${d.instructions || 'Aucune'}</div>
                </div>
                <div class="cmr-cell" style="border-right:1px solid #1e293b;">
                    <div class="cmr-label">14. Affranchissement</div>
                    <div class="cmr-sub">Port payé</div>
                </div>
                <div class="cmr-cell">
                    <div class="cmr-label">15. Remboursement</div>
                    <div class="cmr-sub">Néant</div>
                </div>
            </div>
            <div class="cmr-cell" style="border-top:1px solid #1e293b;">
                <div class="cmr-label">20. À payer par</div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:4px;">
                    <div><span class="cmr-sub">Expéditeur :</span> <strong>${parseFloat(d.prix).toFixed(2)} €</strong></div>
                    <div><span class="cmr-sub">Devise :</span> <strong>EUR</strong></div>
                    <div><span class="cmr-sub">Destinataire :</span> <strong>—</strong></div>
                </div>
            </div>
        </div>

        <!-- Signatures -->
        <div class="sig-grid">
            <div class="sig-cell">
                <div class="cmr-label">21. Établi à</div>
                <div class="cmr-value">${d.origine}</div>
                <div class="cmr-sub">Le ${d.date}</div>
            </div>
            <div class="sig-cell">
                <div class="cmr-label">22. Signature expéditeur</div>
                <div class="sig-line">Date et signature</div>
            </div>
            <div class="sig-cell">
                <div class="cmr-label">23. Signature transporteur</div>
                <div class="sig-line">Date et signature</div>
            </div>
            <div class="sig-cell">
                <div class="cmr-label">24. Marchandise reçue — Destinataire</div>
                <div class="sig-line">Date et signature</div>
            </div>
        </div>

        <div class="footer">
            <p>Document conforme à la Convention CMR — Généré par <strong>WASL Transport</strong></p>
            <p>${numCMR} — ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
    </body>
    </html>`;

    openPrintWindow(printHtml, 'CMR ' + numCMR);
}


// ===============================================
// COMPOSANTS HTML RÉUTILISABLES
// ===============================================

/**
 * En-tête standard WASL pour tous les documents
 * @param {Object} options - { color: '#hex', subtitle: 'Texte' }
 */
function waslHeader(options = {}) {
    const color = options.color || '#1e40af';
    const subtitle = options.subtitle || '';

    return `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid ${color}; padding-bottom:14px; margin-bottom:20px;">
        <div>
            <div style="font-weight:900; font-size:22px; color:${color}; letter-spacing:1px;">WASL Transport</div>
            <div style="font-size:9px; color:#64748b;">Commissionnaire de transport</div>
            <div style="font-size:8px; color:#94a3b8;">SIRET : [À compléter] — N° TVA : [À compléter]</div>
        </div>
        <div style="text-align:right;">
            ${subtitle ? `<div style="font-size:12px; font-weight:800; color:${color}; text-transform:uppercase;">${subtitle}</div>` : ''}
            <div style="font-size:9px; color:#94a3b8;">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>
    </div>`;
}

/**
 * Pied de page standard WASL
 * @param {string} docRef - Référence du document
 */
function waslFooter(docRef) {
    return `
    <div style="margin-top:24px; padding-top:14px; border-top:2px solid #e2e8f0; text-align:center; font-size:8px; color:#94a3b8; line-height:1.8;">
        <p><strong>WASL Transport</strong> — Commissionnaire de transport</p>
        <p>SIRET : [À compléter] — RCS : [À compléter] — N° TVA : [À compléter]</p>
        <p>${docRef} — Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>`;
}


// ===============================================
// IMPRESSION FACTURE CLIENT (nouvelle fenêtre)
// ===============================================

function printFactureClient(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const prix = parseFloat(d.prix) || 0;
    const tva = prix * 0.20;
    const ttc = prix + tva;
    const numFacture = 'FC-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    const printHtml = `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Facture ${numFacture}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial,sans-serif; font-size:11px; line-height:1.6; color:#1e293b; padding:30px; }
            @media print { .no-print { display:none !important; } body { padding:15px; } }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 24px;background:#1e40af;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;">🖨️ Imprimer</button>

        <div style="display:flex; justify-content:space-between; border-bottom:3px solid #1e40af; padding-bottom:14px; margin-bottom:20px;">
            <div>
                <div style="font-weight:900; font-size:20px; color:#1e40af;">WASL Transport</div>
                <div style="font-size:9px; color:#64748b;">Commissionnaire de transport</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px; font-weight:800; color:#1e40af;">FACTURE CLIENT</div>
                <div style="font-size:9px; color:#94a3b8;">${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <div style="text-align:center; background:#eff6ff; border:1px solid #93c5fd; border-radius:10px; padding:14px; margin-bottom:20px;">
            <div style="font-size:9px; color:#1e40af; text-transform:uppercase; letter-spacing:2px;">Facture N°</div>
            <div style="font-size:18px; font-weight:900; color:#1e40af;">${numFacture}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
            <div style="background:#f8fafc; border-radius:8px; padding:14px; border-left:4px solid #1e40af;">
                <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Émetteur</div>
                <div style="font-weight:800; font-size:13px;">WASL Transport</div>
                <div style="font-size:10px; color:#64748b;">SIRET : [À compléter]</div>
            </div>
            <div style="background:#f8fafc; border-radius:8px; padding:14px; border-left:4px solid #059669;">
                <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Client</div>
                <div style="font-weight:800; font-size:13px;">${d.expediteur}</div>
                <div style="font-size:10px; color:#64748b;">${d.adresseExp}</div>
            </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
                <tr style="background:#1e40af; color:white;">
                    <th style="padding:8px 12px; text-align:left; font-size:10px; border-radius:6px 0 0 0;">Désignation</th>
                    <th style="padding:8px 12px; text-align:center; font-size:10px;">Colis</th>
                    <th style="padding:8px 12px; text-align:center; font-size:10px;">Poids</th>
                    <th style="padding:8px 12px; text-align:right; font-size:10px; border-radius:0 6px 0 0;">Montant HT</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px 12px;">
                        <div style="font-weight:700;">Transport ${d.mode}</div>
                        <div style="font-size:9px; color:#64748b;">${d.nature} — ${d.origine} → ${d.destination}</div>
                    </td>
                    <td style="padding:10px; text-align:center;">${d.nbColis}</td>
                    <td style="padding:10px; text-align:center;">${d.poids} kg</td>
                    <td style="padding:10px 12px; text-align:right; font-weight:700;">${prix.toFixed(2)} €</td>
                </tr>
            </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
            <div style="width:260px;">
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:11px;">
                    <span style="color:#64748b;">Total HT</span>
                    <span style="font-weight:600;">${prix.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:11px; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">TVA (20%)</span>
                    <span style="font-weight:600;">${tva.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px 0; font-size:15px;">
                    <span style="font-weight:900; color:#1e40af;">Total TTC</span>
                    <span style="font-weight:900; color:#1e40af;">${ttc.toFixed(2)} €</span>
                </div>
            </div>
        </div>

        <div style="background:#f8fafc; border-radius:8px; padding:12px; font-size:9px; color:#64748b; margin-bottom:16px;">
            <strong>Conditions :</strong> Paiement à 30 jours. Pénalités de retard : 3× taux d'intérêt légal. Indemnité recouvrement : 40 €.
        </div>

        <div style="margin-top:20px; padding-top:12px; border-top:2px solid #e2e8f0; text-align:center; font-size:8px; color:#94a3b8;">
            <p><strong>WASL Transport</strong> — Commissionnaire de transport</p>
            <p>Facture ${numFacture} — ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </body>
    </html>`;

    openPrintWindow(printHtml, 'Facture ' + numFacture);
}


// ===============================================
// IMPRESSION FACTURE TRANSPORTEUR (nouvelle fenêtre)
// ===============================================

function printFactureTransporteur(ref) {
    const expedition = getExpeditionByRef(ref);
    if (!expedition) {
        alert('Expédition introuvable : ' + ref);
        return;
    }

    const d = normaliserExpedition(expedition);
    const prix = parseFloat(d.prix) || 0;
    const commission = prix * 0.15;
    const net = prix - commission;
    const tva = net * 0.20;
    const ttc = net + tva;
    const numFacture = 'FT-' + d.numero.replace('WASL-', '') + '-' + new Date().getFullYear();

    // Réutilise le même pattern que printFactureClient
    // avec les données transporteur
    const printHtml = `<!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Facture transporteur ${numFacture}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial,sans-serif; font-size:11px; line-height:1.6; color:#1e293b; padding:30px; }
            @media print { .no-print { display:none !important; } body { padding:15px; } }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 24px;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;">🖨️ Imprimer</button>

        <div style="display:flex; justify-content:space-between; border-bottom:3px solid #059669; padding-bottom:14px; margin-bottom:20px;">
            <div>
                <div style="font-weight:900; font-size:20px; color:#059669;">WASL Transport</div>
                <div style="font-size:9px; color:#64748b;">Commissionnaire de transport</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px; font-weight:800; color:#059669;">FACTURE TRANSPORTEUR</div>
                <div style="font-size:9px; color:#94a3b8;">${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
        </div>

        <div style="text-align:center; background:#ecfdf5; border:1px solid #6ee7b7; border-radius:10px; padding:14px; margin-bottom:20px;">
            <div style="font-size:9px; color:#059669; text-transform:uppercase; letter-spacing:2px;">Facture N°</div>
            <div style="font-size:18px; font-weight:900; color:#047857;">${numFacture}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
            <div style="background:#f8fafc; border-radius:8px; padding:14px; border-left:4px solid #059669;">
                <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Émetteur</div>
                <div style="font-weight:800; font-size:13px;">WASL Transport</div>
            </div>
            <div style="background:#f8fafc; border-radius:8px; padding:14px; border-left:4px solid #0891b2;">
                <div style="font-size:9px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:6px;">Transporteur</div>
                <div style="font-weight:800; font-size:13px;">${d.transporteur}</div>
            </div>
        </div>

        <div style="background:#f0fdf4; border-radius:8px; padding:14px; margin-bottom:20px; text-align:center;">
            <span style="font-weight:800;">${d.origine}</span>
            <span style="margin:0 10px; color:#059669;">🚛 →</span>
            <span style="font-weight:800;">${d.destination}</span>
            <span style="margin-left:16px; font-size:10px; color:#64748b;">Réf : ${d.numero}</span>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <thead>
                <tr style="background:#059669; color:white;">
                    <th style="padding:8px 12px; text-align:left; font-size:10px;">Désignation</th>
                    <th style="padding:8px 12px; text-align:right; font-size:10px;">Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px 12px;"><strong>Prix total transport</strong><br><span style="font-size:9px; color:#64748b;">${d.origine} → ${d.destination}</span></td>
                    <td style="padding:10px 12px; text-align:right; font-weight:600;">${prix.toFixed(2)} €</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#fef2f2;">
                    <td style="padding:10px 12px;"><strong style="color:#dc2626;">Commission WASL (15%)</strong></td>
                    <td style="padding:10px 12px; text-align:right; font-weight:600; color:#dc2626;">- ${commission.toFixed(2)} €</td>
                </tr>
                <tr style="background:#f0fdf4;">
                    <td style="padding:10px 12px;"><strong style="color:#059669;">Net transporteur HT</strong></td>
                    <td style="padding:10px 12px; text-align:right; font-weight:800; color:#059669;">${net.toFixed(2)} €</td>
                </tr>
            </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
            <div style="width:260px; background:#f0fdf4; border-radius:8px; padding:14px;">
                <div style="display:flex; justify-content:space-between; padding:5px 0;">
                    <span style="color:#64748b;">Net HT</span>
                    <span style="font-weight:600;">${net.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #d1fae5;">
                    <span style="color:#64748b;">TVA (20%)</span>
                    <span style="font-weight:600;">${tva.toFixed(2)} €</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:15px;">
                    <span style="font-weight:900; color:#047857;">Net TTC</span>
                    <span style="font-weight:900; color:#047857;">${ttc.toFixed(2)} €</span>
                </div>
            </div>
        </div>

        <div style="background:#f8fafc; border-radius:8px; padding:12px; font-size:9px; color:#64748b;">
            <strong>Conditions :</strong> Virement sous 15 jours après validation de livraison. CMR signé + photos requis.
        </div>

        <div style="margin-top:20px; padding-top:12px; border-top:2px solid #e2e8f0; text-align:center; font-size:8px; color:#94a3b8;">
            <p><strong>WASL Transport</strong> — Commissionnaire de transport</p>
            <p>Facture ${numFacture} — ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </body>
    </html>`;

    openPrintWindow(printHtml, 'Facture transporteur ' + numFacture);
}


// ===============================================
// EXPORTS — Fonctions accessibles globalement
// ===============================================

// Toutes les fonctions sont déjà globales (pas de module)
// Résumé des fonctions disponibles :
//
// UTILITAIRES :
//   showDoc(html)                    - Affiche dans la modale
//   openPrintWindow(html, title)     - Ouvre fenêtre impression
//   getExpeditionByRef(ref)          - Cherche une expédition
//   normaliserExpedition(data)       - Normalise les champs
//   waslHeader(options)              - En-tête HTML réutilisable
//   waslFooter(docRef)               - Pied de page réutilisable
//
// FACTURES :
//   viewInvoiceClient(ref)           - Facture client (modale)
//   viewInvoiceTransporteur(ref)     - Facture transporteur (modale)
//   printFactureClient(ref)          - Facture client (impression)
//   printFactureTransporteur(ref)    - Facture transporteur (impression)
//
// DOCUMENTS :
//   genAttestation(ref)              - Attestation PEC (modale)
//   printAttestation(ref)            - Attestation PEC (impression)
//   genCMR(ref)                      - CMR (modale)
//   printCMR(ref)                    - CMR (impression)
//
// PHOTOS :
//   viewPhotos(ref)                  - Galerie photos (modale)
