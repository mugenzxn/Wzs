// État global et constantes partagées
let CU = null, activeRole = '', expFilt = 'all', expPg = 1;
const PP = 5;
let curOfferRef = null, curUploadRef = null, curRejectRef = null, curComposeRef = null, devisCnt = 0, curRoleUserId = null;
window.aUserFilter = 'all';

// Données de base
const DN = {
    '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-Hte-Provence','05':'Hautes-Alpes','06':'Alpes-Maritimes',
    '07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube','11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône',
    '14':'Calvados','15':'Cantal','16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','2A':'Corse-du-Sud',
    '2B':'Haute-Corse','21':"Côte-d'Or",'22':"Côtes-d'Armor",'23':'Creuse','24':'Dordogne','25':'Doubs','26':'Drôme',
    '27':'Eure','28':'Eure-et-Loir','29':'Finistère','30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde',
    '34':'Hérault','35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isère','39':'Jura','40':'Landes',
    '41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique','45':'Loiret','46':'Lot',
    '47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire','50':'Manche','51':'Marne','52':'Haute-Marne',
    '53':'Mayenne','54':'Meurthe-et-Moselle','55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nièvre','59':'Nord',
    '60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques','65':'Hautes-Pyrénées',
    '66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône','70':'Haute-Saône','71':'Saône-et-Loire',
    '72':'Sarthe','73':'Savoie','74':'Haute-Savoie','75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne',
    '78':'Yvelines','79':'Deux-Sèvres','80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse',
    '85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne','90':'Territoire de Belfort',
    '91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis','94':'Val-de-Marne','95':"Val-d'Oise"
};

const DA = {'01':['38','39','69','71','73','74'],'02':['08','51','59','60','77','80'],'03':['18','23','42','58','63'],'04':['05','06','26','83','84'],'05':['04','26','38','73'],'06':['04','83'],'07':['26','30','38','42','43','48'],'08':['02','51','55'],'09':['11','31','66'],'10':['21','51','52','77','89'],'11':['09','31','34','66','81'],'12':['15','30','34','46','48','81','82'],'13':['30','83','84'],'14':['27','50','61','76'],'15':['12','19','43','46','63'],'16':['17','24','79','86','87'],'17':['16','24','33','79','85'],'18':['03','23','36','41','45','58'],'19':['15','23','24','46','63','87'],'2A':['2B'],'2B':['2A'],'21':['10','39','52','58','70','71','89'],'22':['29','35','56'],'23':['03','18','19','36','63','87'],'24':['16','17','19','33','46','47','87'],'25':['39','70','90'],'26':['04','05','07','38','84'],'27':['14','28','60','76','78','95'],'28':['27','41','45','61','72','78','91'],'29':['22','56'],'30':['07','12','13','34','48','84'],'31':['09','11','32','65','81','82'],'32':['31','40','47','64','65','82'],'33':['17','24','40','47'],'34':['11','12','30','81'],'35':['22','44','49','50','53','56'],'36':['18','23','37','41','86','87'],'37':['36','41','49','72','86'],'38':['01','05','07','26','42','69','73'],'39':['01','21','25','70','71'],'40':['32','33','47','64'],'41':['18','28','36','37','45','72'],'42':['03','07','38','43','63','69'],'43':['07','15','42','48','63'],'44':['35','49','56','85'],'45':['18','28','41','58','77','89','91'],'46':['12','15','19','24','47','82'],'47':['24','32','33','40','46','82'],'48':['07','12','15','30','43'],'49':['35','37','44','53','72','79','85','86'],'50':['14','35','53','61'],'51':['02','08','10','52','55','77'],'52':['10','21','51','54','55','70','88'],'53':['35','49','50','61','72'],'54':['55','57','67','88'],'55':['08','51','52','54','88'],'56':['22','29','35','44'],'57':['54','67'],'58':['03','18','21','45','71','89'],'59':['02','62','80'],'60':['02','27','76','77','78','80','95'],'61':['14','27','28','50','53','72','76'],'62':['59','80'],'63':['03','15','19','23','42','43'],'64':['32','40','65'],'65':['31','32','64'],'66':['09','11'],'67':['54','57','68'],'68':['67','88','90'],'69':['01','38','42','71'],'70':['21','25','39','52','88','90'],'71':['01','21','39','42','58','69'],'72':['28','37','41','49','53','61'],'73':['01','05','38','74'],'74':['01','73'],'75':['92','93','94'],'76':['14','27','60','61','80'],'77':['02','10','45','51','60','89','91','93','94'],'78':['27','28','60','91','92','95'],'79':['16','17','49','85','86'],'80':['02','59','60','62','76'],'81':['11','12','31','34','82'],'82':['12','31','32','46','47','81'],'83':['04','06','13','84'],'84':['04','13','26','30','83'],'85':['17','44','49','79'],'86':['16','36','37','49','79','87'],'87':['16','19','23','24','36','86'],'88':['52','54','55','67','68','70'],'89':['10','21','45','58','77'],'90':['25','68','70'],'91':['28','45','77','78','92','94'],'92':['75','78','91','93','94','95'],'93':['75','77','92','94','95'],'94':['75','77','91','92','93'],'95':['27','60','78','92','93']};

const CD = {
    'paris':'75','lyon':'69','marseille':'13','nice':'06','toulouse':'31','bordeaux':'33','bayonne':'64','pau':'64',
    'biarritz':'64','lille':'59','strasbourg':'67','nantes':'44','montpellier':'34','rennes':'35',
    'saint-etienne':'42','toulon':'83','grenoble':'38','dijon':'21','angers':'49','nimes':'30',
    'clermont-ferrand':'63','le havre':'76','reims':'51','brest':'29','limoges':'87','tours':'37','amiens':'80',
    'perpignan':'66','metz':'57','besancon':'25','orleans':'45','rouen':'76','caen':'14','nancy':'54',
    'avignon':'84','poitiers':'86','la rochelle':'17','colmar':'68','tarbes':'65','dax':'40',
    'mont-de-marsan':'40','auch':'32','lourdes':'65','hendaye':'64','saint-jean-de-luz':'64','anglet':'64'
};

// Utilitaires département / éligibilité
function getDept(c) {
    return c ? CD[c.toLowerCase().trim()] || null : null;
}
function eligDepts(d) {
    return d ? [d, ...(DA[d] || [])] : [];
}

// Données utilisateurs / missions en mémoire + localStorage
const US = {};

function gU() {
    return Object.values(US);
}
function gT() {
    return gU().filter(u => (u.roles || []).includes('transporteur') && u.transStatus === 'validated');
}
function gM() {
    return JSON.parse(localStorage.getItem('w_m') || '[]');
}
function sM(m) {
    localStorage.setItem('w_m', JSON.stringify(m));
}
function gC(tid) {
    return JSON.parse(localStorage.getItem('w_ch_'+tid) || '[]');
}
function sC(tid, c) {
    localStorage.setItem('w_ch_'+tid, JSON.stringify(c));
}
function saveUser(u) {
    US[u.email] = u;
    const s = JSON.parse(localStorage.getItem('w_us') || '[]');
    const i = s.findIndex(x => x.email === u.email);
    if (i >= 0) s[i] = u;
    else s.push(u);
    localStorage.setItem('w_us', JSON.stringify(s));
}

// Initialisation des données démo
function initData() {
    [
        {id:1,email:'expediteur@wasl.fr',password:'demo123',prenom:'Jean',nom:'Dupont',tel:'0601020304',roles:['expediteur'],departement:null,transStatus:null,conformity:null},
        {id:2,email:'transporteur@wasl.fr',password:'demo123',prenom:'Marie',nom:'Martin',tel:'0605060708',roles:['transporteur'],departement:'75',transStatus:'validated',conformity:{licence:'LT-2024-001',immatTracteur:'AB-123-CD',tel247:'0605060708'}},
        {id:3,email:'admin@wasl.fr',password:'admin123',prenom:'Admin',nom:'WASL',tel:'',roles:['admin'],departement:null,transStatus:null,conformity:null},
        {id:4,email:'transporteur2@wasl.fr',password:'demo123',prenom:'Pierre',nom:'Durand',tel:'0611223344',roles:['transporteur'],departement:'64',transStatus:'validated',conformity:{licence:'LT-2024-064',immatTracteur:'EF-456-GH',tel247:'0611223344'}}
    ].forEach(u => US[u.email] = u);

    (JSON.parse(localStorage.getItem('w_us') || '[]')).forEach(u => US[u.email] = u);

    if (!localStorage.getItem('w_m')) {
        sM([
            {
                ref:'WASL-001',expediteurId:1,expediteurNom:'Jean Dupont',type:'routier',
                fromCity:'Paris',fromAddr:'12 Rue de la Paix',
                dest:{nom:'Entreprise Nice',addr1:'45 Ave Jean Médecin',cp:'06000',ville:'Nice',pays:'FR'},
                departement:'75',nature:'Mobilier de bureau',um:3,poids:150,longueur:2,volume:4,valeur:5000,devise:'EUR',
                numBL:'BL-001',date:'2025-01-15',instructions:'',remarques:'',
                status:'progress',
                offres:[{tId:2,nom:'Marie Martin',dept:'75',prix:300,datePEC:'2025-01-15',heurePEC:'08:00',dateLiv:'2025-01-17',heureLiv:'14:00',dateO:new Date().toISOString()}],
                devis:[],devisChoisi:null,transporteurId:2,transporteurNom:'Marie Martin',
                prixT:300,prixC:420,livraison:null,rejetMotif:null,factureEmise:false
            },
            {
                ref:'WASL-002',expediteurId:1,expediteurNom:'Jean Dupont',type:'aerien',
                fromCity:'Bayonne',fromAddr:'8 Bd Haussmann',
                dest:{nom:'Client Bruxelles',addr1:'22 Avenue Louise',cp:'1050',ville:'Bruxelles',pays:'BE'},
                departement:'64',nature:'Documents confidentiels',um:1,poids:5,longueur:0.5,volume:0.1,valeur:1000,devise:'EUR',
                numBL:'BL-002',date:'2025-01-20',instructions:'Fragile',remarques:'',
                status:'pending',offres:[],devis:[],devisChoisi:null,
                transporteurId:null,transporteurNom:null,prixT:null,prixC:null,
                livraison:null,rejetMotif:null,factureEmise:false
            }
        ]);
    }
}

// Libellés / couleurs de statut
function sL(s) {
    return {
        pending:'En attente',
        quoted:'Devis envoyé',
        accepted:'Accepté',
        progress:'En cours',
        pending_delivery:'Livr. soumise',
        delivered:'Livrée'
    }[s] || s;
}
function sPct(s) {
    return {
        pending:10,
        quoted:25,
        accepted:40,
        progress:60,
        pending_delivery:85,
        delivered:100
    }[s] || 0;
}
function sCol(s) {
    return {
        pending:'yellow',
        quoted:'indigo',
        accepted:'blue',
        progress:'blue',
        pending_delivery:'orange',
        delivered:'green'
    }[s] || 'slate';
}