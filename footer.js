// === FOOTER ===
function renderFooter() {
    const footer = document.createElement('footer');
    footer.id = 'siteFooter';
    footer.className = 'bg-slate-900 text-slate-400 text-xs mt-auto';
    footer.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 py-10">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-black text-sm">W</div>
                    <span class="text-white font-black text-lg">WASL Transport</span>
                </div>
                <p class="leading-relaxed">Commissionnaire de transport — Solutions logistiques aérien &amp; routier, national et international.</p>
                <p class="mt-3 text-slate-500">SIRET : [À COMPLÉTER]<br>N° TVA : FR [À COMPLÉTER]<br>Licence transport : [À COMPLÉTER]</p>
            </div>
            <div>
                <h4 class="text-white font-bold text-sm mb-3">Services</h4>
                <ul class="space-y-2">
                    <li>🚛 Transport routier</li>
                    <li>✈️ Fret aérien</li>
                    <li>📦 Suivi des expéditions</li>
                    <li>📄 Documents CMR</li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-bold text-sm mb-3">Juridique</h4>
                <ul class="space-y-2">
                    <li><a href="#" onclick="showFooterDoc('cgu');return false" class="hover:text-white transition">📜 CGU</a></li>
                    <li><a href="#" onclick="showFooterDoc('cgv');return false" class="hover:text-white transition">📋 CGV</a></li>
                    <li><a href="#" onclick="showFooterDoc('rgpd');return false" class="hover:text-white transition">🔒 Politique de confidentialité</a></li>
                    <li><a href="#" onclick="showFooterDoc('mentions');return false" class="hover:text-white transition">⚖️ Mentions légales</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-white font-bold text-sm mb-3">Contact</h4>
                <ul class="space-y-2">
                    <li>📍 [Adresse à compléter]</li>
                    <li>📞 [Téléphone]</li>
                    <li>✉️ contact@wasl-transport.fr</li>
                    <li class="pt-2 flex gap-3">
                        <span class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 cursor-pointer transition">in</span>
                        <span class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 cursor-pointer transition">f</span>
                    </li>
                </ul>
            </div>
        </div>
        <div class="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p>© ${new Date().getFullYear()} WASL Transport — Tous droits réservés</p>
            <div class="flex gap-4">
                <a href="#" onclick="showFooterDoc('cgu');return false" class="hover:text-white transition">CGU</a>
                <a href="#" onclick="showFooterDoc('cgv');return false" class="hover:text-white transition">CGV</a>
                <a href="#" onclick="showFooterDoc('rgpd');return false" class="hover:text-white transition">RGPD</a>
                <a href="#" onclick="showFooterDoc('mentions');return false" class="hover:text-white transition">Mentions légales</a>
            </div>
        </div>
    </div>`;
    document.body.appendChild(footer);
}

// Contenus juridiques
const LEGAL_DOCS = {
    cgu: {
        title: "Conditions Générales d'Utilisation",
        html: `
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:12px">1. Objet</h3>
        <p>Les présentes CGU régissent l'utilisation de la plateforme WASL Transport. En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes conditions.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">2. Accès à la plateforme</h3>
        <p>L'accès nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. Tout usage frauduleux entraînera la suspension immédiate du compte.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">3. Rôles utilisateurs</h3>
        <p><strong>Expéditeur :</strong> peut créer des demandes de transport, consulter les devis et suivre ses expéditions.<br>
        <strong>Transporteur :</strong> peut consulter les missions disponibles, soumettre des offres et gérer ses livraisons.<br>
        <strong>Administrateur :</strong> gère les utilisateurs, valide les conformités et supervise les opérations.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">4. Responsabilités</h3>
        <p>WASL Transport agit en qualité de commissionnaire de transport au sens des articles L.1411-1 et suivants du Code des transports. La responsabilité est limitée conformément à la Convention CMR pour le transport international et à la loi française pour le national.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">5. Propriété intellectuelle</h3>
        <p>L'ensemble des éléments de la plateforme (textes, graphismes, logiciels) sont protégés par le droit de la propriété intellectuelle. Toute reproduction est interdite sans autorisation.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">6. Droit applicable</h3>
        <p>Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux de [Ville à compléter].</p>`
    },
    cgv: {
        title: "Conditions Générales de Vente",
        html: `
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:12px">1. Champ d'application</h3>
        <p>Les présentes CGV s'appliquent à toute prestation de commission de transport réalisée par WASL Transport pour le compte de ses clients (expéditeurs).</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">2. Devis et commandes</h3>
        <p>Les devis sont établis sur la base des informations fournies par l'expéditeur. L'acceptation d'un devis via la plateforme vaut commande ferme. Tout devis accepté engage les deux parties.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">3. Prix et facturation</h3>
        <p>Les prix sont exprimés en euros hors taxes. La TVA applicable (20%) est facturée en sus. Les factures sont payables à 30 jours date de facture, sauf accord contraire.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">4. Pénalités de retard</h3>
        <p>En cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées de plein droit, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L.441-10 C.com).</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">5. Responsabilité et assurance</h3>
        <p>La responsabilité de WASL Transport est engagée dans les limites de la Convention CMR (transport international) ou du contrat type général (transport national). L'expéditeur peut souscrire une assurance ad valorem via la déclaration de valeur.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">6. Réclamations</h3>
        <p>Toute réclamation doit être formulée par écrit dans les 3 jours suivant la livraison (7 jours pour le transport international CMR). Passé ce délai, aucune indemnisation ne sera due.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">7. Force majeure</h3>
        <p>WASL Transport ne saurait être tenue responsable en cas de force majeure : catastrophes naturelles, grèves, restrictions gouvernementales, pandémies.</p>`
    },
    rgpd: {
        title: "Politique de confidentialité — RGPD",
        html: `
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:12px">1. Responsable du traitement</h3>
        <p>WASL Transport, [Adresse à compléter], est responsable du traitement des données personnelles collectées via la plateforme, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">2. Données collectées</h3>
        <p>Nous collectons : nom, prénom, email, téléphone, département d'activité (transporteurs), informations de conformité (licence, immatriculation), données relatives aux expéditions et factures.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">3. Finalités</h3>
        <p>Les données sont traitées pour : la gestion des comptes utilisateurs, l'exécution des prestations de transport, la facturation, le respect des obligations légales, et l'amélioration de nos services.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">4. Base légale</h3>
        <p>Le traitement repose sur : l'exécution du contrat (art. 6.1.b RGPD), le respect d'obligations légales (art. 6.1.c), et notre intérêt légitime (art. 6.1.f) pour l'amélioration des services.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">5. Durée de conservation</h3>
        <p>Données de compte : durée de la relation + 3 ans. Données de facturation : 10 ans (obligation comptable). Documents de transport : 5 ans. Données de conformité transporteur : durée de validité + 1 an.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">6. Vos droits</h3>
        <p>Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition. Pour les exercer : <strong>rgpd@wasl-transport.fr</strong></p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">7. Cookies</h3>
        <p>La plateforme utilise le stockage local (localStorage) pour le fonctionnement de l'application. Aucun cookie tiers de traçage publicitaire n'est utilisé.</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">8. Réclamation</h3>
        <p>Vous pouvez introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" style="color:#2563eb" target="_blank">www.cnil.fr</a></p>`
    },
    mentions: {
        title: "Mentions légales",
        html: `
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:12px">Éditeur du site</h3>
        <p><strong>WASL Transport</strong><br>
        Forme juridique : [À compléter]<br>
        Capital social : [À compléter]<br>
        Siège social : [Adresse à compléter]<br>
        SIRET : [À compléter]<br>
        RCS : [Ville] [Numéro]<br>
        N° TVA intracommunautaire : FR [À compléter]<br>
        Licence de transport : [À compléter]<br>
        Directeur de la publication : [Nom à compléter]</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">Hébergement</h3>
        <p>[Nom de l'hébergeur]<br>[Adresse]<br>[Téléphone]</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">Activité réglementée</h3>
        <p>WASL Transport exerce en qualité de commissionnaire de transport conformément aux articles L.1411-1 et suivants du Code des transports. L'entreprise est inscrite au registre des commissionnaires de transport tenu par la DREAL [Région].</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">Assurance</h3>
        <p>Responsabilité civile professionnelle souscrite auprès de [Assureur], contrat n° [À compléter].</p>
        <h3 style="font-size:16px;font-weight:bold;margin:16px 0 12px">Contact</h3>
        <p>Email : contact@wasl-transport.fr<br>Téléphone : [À compléter]</p>`
    }
};

function showFooterDoc(key) {
    const doc = LEGAL_DOCS[key];
    if (!doc) return;
    document.getElementById('docContent').innerHTML =
        '<div style="font-family:Arial;max-width:800px;margin:auto;padding:20px;font-size:13px;line-height:1.7">' +
        '<h1 style="font-size:22px;font-weight:bold;color:#1e40af;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e2e8f0">' + doc.title + '</h1>' +
        doc.html +
        '<div style="margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">WASL Transport — Dernière mise à jour : ' + new Date().toLocaleDateString('fr-FR') + '</div>' +
        '</div>';
    openModal('docModal');
}

// Auto-render au chargement
document.addEventListener('DOMContentLoaded', function() {
    renderFooter();
    // Assurer la visibilité sur la page d'accueil ET les dashboards
    updateFooterVisibility();
});

function updateFooterVisibility() {
    const footer = document.getElementById('siteFooter');
    if (!footer) return;
    // Toujours visible sur la page d'accueil (hero)
    // Sur les dashboards, visible aussi en bas
    footer.style.display = 'block';
}