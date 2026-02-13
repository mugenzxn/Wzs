// ===============================================
// validators.js — Validation & Sanitisation
// ===============================================

const Validators = {

    // --- Sanitisation HTML (anti-XSS) ---
    sanitize(str) {
        if (typeof str !== 'string') return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, c => map[c]).trim();
    },

    // --- Validation téléphone ---
    phone(val) {
        const cleaned = String(val).replace(/[\s.\-()]/g, '');
        const regex = /^\+?[0-9]{8,15}$/;
        return {
            valid: regex.test(cleaned),
            cleaned: cleaned,
            error: 'Numéro de téléphone invalide (8-15 chiffres)'
        };
    },

    // --- Validation email ---
    email(val) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: regex.test(String(val).trim()),
            cleaned: String(val).trim().toLowerCase(),
            error: 'Adresse email invalide'
        };
    },

    // --- Validation prix/montant ---
    price(val) {
        const num = parseFloat(String(val).replace(/[,\s]/g, '.'));
        return {
            valid: !isNaN(num) && num >= 0 && num <= 9999999,
            cleaned: isNaN(num) ? 0 : Math.round(num * 100) / 100,
            error: 'Montant invalide (0 - 9 999 999)'
        };
    },

    // --- Validation poids ---
    weight(val) {
        const num = parseFloat(String(val).replace(/[,\s]/g, '.'));
        return {
            valid: !isNaN(num) && num > 0 && num <= 999999,
            cleaned: isNaN(num) ? 0 : Math.round(num * 100) / 100,
            error: 'Poids invalide (> 0 kg)'
        };
    },

    // --- Validation texte requis ---
    required(val, fieldName = 'Ce champ') {
        const s = String(val || '').trim();
        return {
            valid: s.length > 0,
            cleaned: s,
            error: `${fieldName} est obligatoire`
        };
    },

    // --- Validation texte avec longueur ---
    text(val, min = 1, max = 500) {
        const s = Validators.sanitize(String(val || ''));
        return {
            valid: s.length >= min && s.length <= max,
            cleaned: s,
            error: `Doit contenir entre ${min} et ${max} caractères`
        };
    },

    // --- Validation numéro référence ---
    reference(val) {
        const s = String(val || '').trim().toUpperCase();
        const regex = /^WASL-[A-Z0-9]{3,10}$/;
        return {
            valid: regex.test(s),
            cleaned: s,
            error: 'Format référence invalide (WASL-XXXX)'
        };
    },

    // --- Validation date ---
    date(val) {
        const d = new Date(val);
        return {
            valid: !isNaN(d.getTime()),
            cleaned: d,
            error: 'Date invalide'
        };
    },

    // ===============================================
    // VALIDATION FORMULAIRE COMPLET
    // ===============================================
    
    validateExpeditionForm(formData) {
        const errors = [];
        const cleaned = {};

        // Champs obligatoires texte
        const requiredFields = [
            { key: 'expediteur', label: 'Expéditeur' },
            { key: 'destinataire', label: 'Destinataire' },
            { key: 'villeDepart', label: 'Ville de départ' },
            { key: 'villeArrivee', label: 'Ville d\'arrivée' },
            { key: 'nature', label: 'Nature marchandise' }
        ];

        requiredFields.forEach(f => {
            const result = Validators.text(formData[f.key], 2, 200);
            if (!result.valid) {
                errors.push(`${f.label} : ${result.error}`);
            }
            cleaned[f.key] = result.cleaned;
        });

        // Téléphone
        if (formData.telephone) {
            const tel = Validators.phone(formData.telephone);
            if (!tel.valid) errors.push(tel.error);
            cleaned.telephone = tel.cleaned;
        }

        // Email
        if (formData.email) {
            const em = Validators.email(formData.email);
            if (!em.valid) errors.push(em.error);
            cleaned.email = em.cleaned;
        }

        // Prix
        const prix = Validators.price(formData.prix);
        if (!prix.valid) errors.push('Prix : ' + prix.error);
        cleaned.prix = prix.cleaned;

        // Poids
        if (formData.poids) {
            const poids = Validators.weight(formData.poids);
            if (!poids.valid) errors.push('Poids : ' + poids.error);
            cleaned.poids = poids.cleaned;
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            cleaned: { ...formData, ...cleaned }
        };
    },

    // ===============================================
    // AFFICHAGE ERREURS
    // ===============================================

    showErrors(errors, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            alert('Erreurs :\n' + errors.join('\n'));
            return;
        }

        container.innerHTML = `
            <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:12px; margin-bottom:16px;">
                <div style="font-weight:700; color:#dc2626; margin-bottom:6px;">⚠️ Veuillez corriger :</div>
                <ul style="margin:0; padding-left:20px; color:#991b1b; font-size:13px;">
                    ${errors.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>
        `;
    },

    clearErrors(containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
    }
};
