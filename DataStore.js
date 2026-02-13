// ===== dataStore.js — Source unique de données =====
const DataStore = {
    db: null,
    currentUser: null,

    init(firebaseDb, user) {
        this.db = firebaseDb;
        this.currentUser = user;
    },

    // ===== PROFIL =====
    async getProfil() {
        if (!this.currentUser) return null;
        try {
            const snap = await this.db.collection('users').doc(this.currentUser.uid).get();
            return snap.exists ? snap.data() : null;
        } catch (e) {
            console.error('DataStore.getProfil:', e);
            // Fallback localStorage en cas de hors-ligne
            return this._getLocal('profil');
        }
    },

    async saveProfil(data) {
        if (!this.currentUser) return;
        const uid = this.currentUser.uid;
        try {
            await this.db.collection('users').doc(uid).set(data, { merge: true });
            // Cache local pour mode hors-ligne
            this._setLocal('profil', data);
        } catch (e) {
            console.error('DataStore.saveProfil:', e);
            this._setLocal('profil', data);
        }
    },

    // ===== DEMANDES / EXPÉDITIONS =====
    async getDemandes() {
        if (!this.currentUser) return [];
        try {
            const snap = await this.db
                .collection('users').doc(this.currentUser.uid)
                .collection('demandes')
                .orderBy('dateCreation', 'desc')
                .get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('DataStore.getDemandes:', e);
            return this._getLocal('demandes') || [];
        }
    },

    async saveDemande(demande) {
        if (!this.currentUser) return null;
        const uid = this.currentUser.uid;
        try {
            // Générer numéro si nécessaire
            if (!demande.numero) {
                demande.numero = await this.genererNumero();
            }
            demande.dateCreation = demande.dateCreation || new Date().toISOString();
            demande.userId = uid;

            // Sauvegarder dans sous-collection user
            const ref = await this.db
                .collection('users').doc(uid)
                .collection('demandes')
                .add(demande);

            // Sauvegarder dans collection racine (pour recherche suivi)
            await this.db.collection('expeditions').doc(demande.numero).set({
                ...demande,
                _demandeId: ref.id,
                userId: uid
            });

            // Cache local
            const demandes = this._getLocal('demandes') || [];
            demandes.unshift({ id: ref.id, ...demande });
            this._setLocal('demandes', demandes);

            return ref.id;
        } catch (e) {
            console.error('DataStore.saveDemande:', e);
            // Sauvegarde locale si hors-ligne
            const demandes = this._getLocal('demandes') || [];
            demandes.unshift(demande);
            this._setLocal('demandes', demandes);
            return 'local_' + Date.now();
        }
    },

    async updateDemande(demandeId, updates) {
        if (!this.currentUser) return;
        try {
            await this.db
                .collection('users').doc(this.currentUser.uid)
                .collection('demandes').doc(demandeId)
                .update(updates);

            // Mettre à jour aussi la collection racine
            if (updates.numero) {
                await this.db.collection('expeditions').doc(updates.numero).update(updates);
            }
        } catch (e) {
            console.error('DataStore.updateDemande:', e);
        }
    },

    async deleteDemande(demandeId) {
        if (!this.currentUser) return;
        try {
            const demSnap = await this.db
                .collection('users').doc(this.currentUser.uid)
                .collection('demandes').doc(demandeId).get();
            
            if (demSnap.exists) {
                const data = demSnap.data();
                // Supprimer de la collection racine
                if (data.numero) {
                    await this.db.collection('expeditions').doc(data.numero).delete();
                }
            }

            await this.db
                .collection('users').doc(this.currentUser.uid)
                .collection('demandes').doc(demandeId)
                .delete();
        } catch (e) {
            console.error('DataStore.deleteDemande:', e);
        }
    },

    // ===== DEVIS =====
    async getDevis(demandeId) {
        if (!this.currentUser) return [];
        try {
            const snap = await this.db
                .collection('users').doc(this.currentUser.uid)
                .collection('devis')
                .where('demandeId', '==', demandeId)
                .get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('DataStore.getDevis:', e);
            return [];
        }
    },

    async saveDevis(devis) {
        if (!this.currentUser) return null;
        try {
            devis.dateCreation = new Date().toISOString();
            devis.transporteurId = this.currentUser.uid;
            
            const ref = await this.db
                .collection('users').doc(devis.expediteurId)
                .collection('devis')
                .add(devis);
            return ref.id;
        } catch (e) {
            console.error('DataStore.saveDevis:', e);
            return null;
        }
    },

    // ===== VÉHICULES =====
    async getVehicules() {
        if (!this.currentUser) return [];
        try {
            const snap = await this.db
                .collection('flotte').doc(this.currentUser.uid)
                .collection('vehicules')
                .get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('DataStore.getVehicules:', e);
            return this._getLocal('vehicules') || [];
        }
    },

    async saveVehicule(vehicule) {
        if (!this.currentUser) return null;
        try {
            const ref = await this.db
                .collection('flotte').doc(this.currentUser.uid)
                .collection('vehicules')
                .add(vehicule);
            return ref.id;
        } catch (e) {
            console.error('DataStore.saveVehicule:', e);
            return null;
        }
    },

    // ===== UTILITAIRES =====
    async genererNumero() {
        try {
            const counterRef = this.db.collection('config').doc('compteur');
            const result = await this.db.runTransaction(async (transaction) => {
                const snap = await transaction.get(counterRef);
                const current = snap.exists ? snap.data().dernierNumero || 0 : 0;
                const next = current + 1;
                transaction.set(counterRef, { dernierNumero: next }, { merge: true });
                return 'WASL-' + String(next).padStart(4, '0');
            });
            return result;
        } catch (e) {
            // Fallback
            return 'WASL-' + Date.now().toString(36).toUpperCase();
        }
    },

    // ===== ADMIN : Tous les users =====
    async getAllUsers() {
        try {
            const snap = await this.db.collection('users').get();
            return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
        } catch (e) {
            console.error('DataStore.getAllUsers:', e);
            return [];
        }
    },

    async getAllExpeditions() {
        try {
            const snap = await this.db.collection('expeditions')
                .orderBy('dateCreation', 'desc')
                .get();
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('DataStore.getAllExpeditions:', e);
            return [];
        }
    },

    // ===== CACHE LOCAL (mode hors-ligne) =====
    _getLocal(key) {
        try {
            const data = localStorage.getItem('ds_' + key);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },

    _setLocal(key, value) {
        try {
            localStorage.setItem('ds_' + key, JSON.stringify(value));
        } catch { /* Storage plein */ }
    },

    clearLocalCache() {
        Object.keys(localStorage)
            .filter(k => k.startsWith('ds_'))
            .forEach(k => localStorage.removeItem(k));
    }
};
