import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export async function POST() {
  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@crm.fr' } })
    if (existingAdmin) {
      return NextResponse.json({ message: 'Base déjà initialisée' })
    }

    const adminPw = await bcrypt.hash('Admin2024!', 12)
    await prisma.user.create({
      data: {
        email: 'admin@crm.fr',
        password: adminPw,
        role: 'ADMIN',
        commercial: {
          create: {
            nom: 'ADMIN',
            prenom: 'Super',
            statut: 'ACTIF',
          },
        },
      },
    })

    const regions = ['Île-de-France', 'PACA', 'Occitanie', 'Auvergne-Rhône-Alpes', 'Hauts-de-France']
    const prenoms = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Antoine', 'Camille', 'Thomas', 'Julie']
    const noms = ['MARTIN', 'BERNARD', 'THOMAS', 'PETIT', 'ROBERT', 'RICHARD', 'DURAND', 'MOREAU', 'SIMON', 'MICHEL']

    const produitsPV = [
      'Installation PV Résidentiel',
      'Installation PV Professionnel',
      'Batterie de stockage LFP',
      'Ombrière PV',
      'Borne IRVE',
      'Pompe à chaleur',
      'Ballon thermodynamique',
    ]

    for (let i = 0; i < 10; i++) {
      const pw = await bcrypt.hash('Pass2024!', 10)
      const email = `commercial${i + 1}@crm.fr`
      const nom = noms[i]
      const prenom = prenoms[i]

      const user = await prisma.user.create({
        data: {
          email,
          password: pw,
          role: 'COMMERCIAL',
          commercial: {
            create: {
              nom,
              prenom,
              telephone: `06${String(10000000 + i * 11111111).slice(0, 8)}`,
              region: regions[i % regions.length],
              secteur: `Secteur ${i + 1}`,
              dateDebut: new Date(2022, i % 12, 1),
              statut: i < 8 ? 'ACTIF' : 'INACTIF',
              numeroRSAC: `RS${String(100000 + i * 12345).padStart(6, '0')}`,
              dateValiditeRSAC: new Date(2025 + (i % 2), 11, 31),
              objectifMensuel: 15000 + i * 2000,
              objectifAnnuel: (15000 + i * 2000) * 12,
              dateValiditeRCPro: new Date(2025, i % 12, 28),
            },
          },
        },
        include: { commercial: true },
      })

      const commercial = user.commercial!

      // Prospects
      for (let j = 0; j < 5; j++) {
        const statuts = ['NOUVEAU', 'CONTACTE', 'RDV_PRIS', 'DEVIS_ENVOYE', 'GAGNE']
        await prisma.prospect.create({
          data: {
            commercialId: commercial.id,
            raisonSociale: `Société ${String.fromCharCode(65 + j)}${i + 1}`,
            contactNom: `Contact${j}`,
            contactPrenom: `Prénom${j}`,
            email: `contact${j}@societe${i}.fr`,
            telephone: `01${String(10000000 + j * 1234567).slice(0, 8)}`,
            statut: statuts[j],
            source: ['Prospection téléphonique', 'Recommandation', 'Salon professionnel'][j % 3],
            notes: `Intéressé par une installation ${produitsPV[j % produitsPV.length]}. Contact ${j + 1}.`,
          },
        })
      }

      // Opportunités
      const etapes = ['PROSPECTION', 'RDV', 'DEVIS', 'NEGOCIATION', 'CLOSING']
      for (let j = 0; j < 3; j++) {
        const opp = await prisma.opportunite.create({
          data: {
            commercialId: commercial.id,
            titre: `${produitsPV[(i + j) % produitsPV.length]} — ${prenom} ${nom}`,
            montantEstime: 5000 + j * 3000 + i * 1000,
            probabilite: 20 + j * 20,
            statut: j === 2 ? 'GAGNE' : 'EN_COURS',
            etape: etapes[j % etapes.length],
            nbRelances: j,
            datePrevClot: new Date(2025, 5 + j, 30),
          },
        })

        if (j === 2) {
          await prisma.contrat.create({
            data: {
              commercialId: commercial.id,
              opportuniteId: opp.id,
              reference: `SOL-2025${String(i * 10 + j).padStart(4, '0')}`,
              clientNom: `Client ${i + 1}-${j + 1}`,
              clientEmail: `client${i}${j}@example.fr`,
              produit: produitsPV[(i + j) % produitsPV.length],
              montant: 5000 + j * 3000 + i * 1000,
              statut: 'ACTIF',
              dateSignature: new Date(2025, 1 + i % 3, 15),
              dateDebut: new Date(2025, 2 + i % 3, 1),
              tauxCommission: 5 + j,
            },
          })

          await prisma.commission.create({
            data: {
              commercialId: commercial.id,
              periode: `2025-${String(3 + i % 6).padStart(2, '0')}`,
              montantBase: 5000 + j * 3000 + i * 1000,
              taux: 5 + j,
              montantCommission: (5000 + j * 3000 + i * 1000) * (5 + j) / 100,
              statut: i % 3 === 0 ? 'PAYEE' : i % 3 === 1 ? 'VALIDEE' : 'EN_ATTENTE',
              datePaiement: i % 3 === 0 ? new Date(2025, 4, 5) : undefined,
            },
          })
        }
      }

      // Documents administratifs
      const docTypes = [
        { type: 'RSAC', nom: 'Extrait RSAC', dateExpiration: new Date(2025, 11, 31) },
        { type: 'RC_PRO', nom: 'Attestation RC Pro', dateExpiration: new Date(2025, i % 12, 28) },
        { type: 'KBIS', nom: 'Extrait Kbis', dateExpiration: null },
        { type: 'RIB', nom: 'RIB Bancaire', dateExpiration: null },
        { type: 'CNI', nom: "Pièce d'identité", dateExpiration: new Date(2028, 5, 30) },
        { type: 'CONTRAT_AGENT', nom: "Contrat d'agent commercial", dateExpiration: null },
      ]

      for (const doc of docTypes) {
        const daysUntil = doc.dateExpiration
          ? Math.ceil((doc.dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null

        await prisma.document.create({
          data: {
            commercialId: commercial.id,
            type: doc.type,
            nom: doc.nom,
            statut: daysUntil !== null && daysUntil < 30 ? 'EXPIRE' : 'VALIDE',
            dateExpiration: doc.dateExpiration,
            dateReception: new Date(2024, i % 12, 1),
          },
        })
      }

      // CRV
      for (let j = 0; j < 3; j++) {
        await prisma.cRV.create({
          data: {
            commercialId: commercial.id,
            dateVisite: new Date(2025, 3, 10 + j),
            typeContact: ['VISITE', 'TELEPHONE', 'VISIO'][j],
            compteRendu: `Présentation de l'offre ${produitsPV[(i + j) % produitsPV.length]}. Client intéressé. Discussion sur les aides financières (MaPrimeRénov, crédit d'impôt).`,
            objectif: 'Présentation offre photovoltaïque',
            actionsNext: 'Envoyer étude de dimensionnement sous 48h',
            dateRelance: new Date(2025, 3, 20 + j),
            kilometrage: j > 0 ? 0 : 45 + i * 5,
            qualite: 3 + (j % 3),
          },
        })
      }
    }

    // ─── FORMATIONS SOLENYX ──────────────────────────────────────────────────

    const formationsData = [
      {
        titre: 'Installation résidentielle',
        description: 'Maîtrisez toutes les étapes d\'une installation photovoltaïque en résidentiel : dimensionnement, types de panneaux, pose en toiture, onduleurs, câblage DC/AC, conformité.',
        type: 'E_LEARNING',
        categorie: 'TECHNIQUE',
        duree: 25,
        niveau: 'DEBUTANT',
        estObligatoire: true,
        modules: [
          {
            titre: 'Dimensionnement d\'une installation résidentielle',
            ordre: 1,
            type: 'TEXTE',
            duree: 6,
            contenu: `<p>Le dimensionnement est la première étape critique. Il définit la puissance à installer en fonction de la consommation annuelle du ménage, de la surface disponible et de l'ensoleillement local.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1;text-align:left">Paramètre</th><th style="padding:8px;border:1px solid #cbd5e1;text-align:left">Valeur typique résidentiel</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Consommation foyer moyen (France)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">4 500 – 6 000 kWh/an</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Puissance pour couvrir 70% des besoins</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">3 à 6 kWc</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Surface par kWc (panneaux 400 Wc)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">5 à 7 m²</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Production annuelle (Sud de la France)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">1 200 – 1 400 kWh/kWc/an</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Production annuelle (Nord de la France)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">900 – 1 100 kWh/kWc/an</td></tr></table>
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Règle pratique :</strong> 1 kWc = 6 à 9 m² selon format des modules. Pour un foyer standard, 3 kWc couvrent 60 à 70% des besoins en autoconsommation. Une déviation de 45° Est ou Ouest réduit la production d'environ 10 à 15%.</p></div>
<p>L'orientation et l'inclinaison sont déterminantes. Une toiture plein Sud à 30° donne le rendement maximum. En dessous de 15° d'inclinaison, des problèmes d'autonettoyage apparaissent sur les modules.</p>`,
          },
          {
            titre: 'Panneaux solaires : types et spécifications',
            ordre: 2,
            type: 'TEXTE',
            duree: 6,
            contenu: `<p>Solenyx sélectionne des modules de qualité Tier 1 pour garantir la durabilité. Il existe quatre grandes familles utilisées en résidentiel.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Monocristallin PERC</div><div style="padding:12px 14px;font-size:0.9em">Rendement : 20–22% · Puissance : 380–420 Wc · Meilleure perf. faible luminosité · Durée de vie : 25–30 ans · <strong>Standard Solenyx</strong></div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Bifacial TOPCon</div><div style="padding:12px 14px;font-size:0.9em">Rendement : 21–23% · Puissance : 400–440 Wc · Production face arrière +5 à 15% · Idéal toiture claire · <strong>Solution Premium</strong></div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">HJT (Heterojunction)</div><div style="padding:12px 14px;font-size:0.9em">Rendement : 22–24% · Très faible coeff. thermique · Excellent en régions chaudes · Coût plus élevé · <strong>Haute performance</strong></div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Polycristallin</div><div style="padding:12px 14px;font-size:0.9em">Rendement : 15–17% · Coût inférieur · Moins performant en chaleur · Quasiment plus utilisé · <strong>Obsolète</strong></div></div>
</div>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Point de vigilance :</strong> Ne jamais mélanger des panneaux de marques ou modèles différents sur un même string. Cela dégrade les performances de l'ensemble du groupe.</p></div>`,
          },
          {
            titre: 'Structure de montage et onduleur',
            ordre: 3,
            type: 'TEXTE',
            duree: 7,
            contenu: `<p>La pose en toiture nécessite une analyse de la charpente et de l'étanchéité existante. Solenyx utilise des systèmes certifiés adaptés à chaque type de couverture.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Analyse de la toiture</strong> — Vérification pente (5°–60°), orientation, état de la couverture (tuiles, ardoises, bac acier), portance charpente.</li>
<li><strong>Choix du système de montage</strong> — Sur tuiles/ardoises : crochets traversants étanchés. Sur bac acier : pinces ou rails vissés dans les nervures.</li>
<li><strong>Pose des rails aluminium</strong> — Espacement entre rails : 900–1 100 mm selon longueur des modules. Nivellement obligatoire au niveau laser.</li>
<li><strong>Installation des panneaux</strong> — Glissement dans les clips. Serrage au couple : 15 à 20 Nm. Connexion câbles MC4 (DC).</li>
<li><strong>Vérifications finales</strong> — Contrôle de toutes fixations, test étanchéité crochets, absence d'ombrage non identifié.</li>
</ol>
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Sécurité obligatoire :</strong> Toute intervention en toiture nécessite des EPI : harnais, ligne de vie, casque. La réglementation R408 (travaux en hauteur) s'applique systématiquement.</p></div>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Type onduleur</th><th style="padding:8px;border:1px solid #cbd5e1">Usage</th><th style="padding:8px;border:1px solid #cbd5e1">Avantages</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">String central</td><td style="padding:8px;border:1px solid #e2e8f0">Toiture homogène</td><td style="padding:8px;border:1px solid #e2e8f0">Simple, fiable, économique</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Micro-onduleurs</td><td style="padding:8px;border:1px solid #e2e8f0">Toitures complexes/ombrages</td><td style="padding:8px;border:1px solid #e2e8f0">Optimisation panneau par panneau</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Onduleur hybride</td><td style="padding:8px;border:1px solid #e2e8f0">Avec batterie de stockage</td><td style="padding:8px;border:1px solid #e2e8f0">Gestion batterie intégrée, MPPT double</td></tr></table>`,
          },
          {
            titre: 'Quiz — Installation résidentielle',
            ordre: 4,
            type: 'QUIZ',
            duree: 6,
            contenu: null,
            questions: [
              { q: 'Quelle surface de toiture faut-il prévoir par kWc installé (panneaux 400 Wc) ?', opts: ['1 à 2 m²', '3 à 4 m²', '5 à 7 m²', '10 à 12 m²'], c: 2, expl: '1 kWc nécessite 5 à 7 m² selon le format des modules (400 Wc standard).' },
              { q: 'Quelle est la production estimée par kWc dans le Sud de la France ?', opts: ['400 à 600 kWh/kWc/an', '700 à 900 kWh/kWc/an', '1 200 à 1 400 kWh/kWc/an', '2 000 à 2 500 kWh/kWc/an'], c: 2, expl: 'Le Sud de la France bénéficie de 1 200 à 1 400 kWh/kWc/an de productivité.' },
              { q: 'Quel type d\'onduleur est recommandé pour une toiture avec des ombrages partiels ?', opts: ['Onduleur string central unique', 'Micro-onduleurs', 'Régulateur PWM', 'Convertisseur DC-DC seul'], c: 1, expl: 'Les micro-onduleurs optimisent chaque panneau individuellement, évitant la dégradation en cascade due à l\'ombrage.' },
              { q: 'Quel est le couple de serrage recommandé pour les clips de fixation des panneaux ?', opts: ['2 à 5 Nm', '5 à 10 Nm', '15 à 20 Nm', '40 à 50 Nm'], c: 2, expl: 'Le serrage au couple de 15 à 20 Nm garantit la tenue sans endommager les modules.' },
              { q: 'Que risque-t-on en mélangeant des panneaux de modèles différents dans un même string ?', opts: ['Rien, aucun impact', 'Légère amélioration du rendement', 'Dégradation des performances de tout le groupe', 'Risque d\'incendie immédiat'], c: 2, expl: 'Un string est limité par son panneau le moins performant, dégradant l\'ensemble du groupe.' },
              { q: 'Quelle réglementation s\'applique lors de la pose en toiture ?', opts: ['R408 (travaux en hauteur)', 'RT 2020', 'NF C 15-100 uniquement', 'Aucune réglementation spécifique'], c: 0, expl: 'La R408 impose le port des EPI (harnais, ligne de vie, casque) pour tout travail en hauteur.' },
            ],
          },
        ],
      },
      {
        titre: 'Installation professionnelle',
        description: 'Étude de faisabilité, dimensionnement kWc/MWh, étude de structure, onduleurs haute puissance, câblage BT/HTA, CONSUEL, obligations réglementaires.',
        type: 'E_LEARNING',
        categorie: 'TECHNIQUE',
        duree: 30,
        niveau: 'INTERMEDIAIRE',
        estObligatoire: true,
        modules: [
          {
            titre: 'Audit technique et étude de faisabilité',
            ordre: 1,
            type: 'TEXTE',
            duree: 7,
            contenu: `<p>Pour toute installation professionnelle supérieure à 36 kWc, une étude complète est obligatoire avant tout devis définitif.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Analyse de la consommation électrique</strong> — Récupérer les relevés Enedis sur 12 mois (courbe de charge 30 min). Identifier les pics de consommation.</li>
<li><strong>Inspection de la toiture et structure</strong> — Calcul charge admissible (15 à 25 kg/m²). Diagnostic étanchéité. Rapport bureau de contrôle si bâtiment &gt; 10 ans.</li>
<li><strong>Étude d'ombrage 3D</strong> — Modélisation avec PVsyst ou Helioscope. Simulation de production sur 12 mois. Identification des masques solaires.</li>
<li><strong>Étude de raccordement réseau</strong> — Contact Enedis pour DICT. Pour les installations &gt; 250 kWc : raccordement HTA souvent requis.</li>
</ol>
<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Réalisations Solenyx :</strong> Toiture Lyon 380 kWc / 420 MWh/an — Stade Saint-Étienne 820 kWc / 915 MWh/an — Restaurant Aix-en-Provence 60 kWc / 72 MWh/an.</p></div>`,
          },
          {
            titre: 'Dimensionnement et catégories réglementaires',
            ordre: 2,
            type: 'TEXTE',
            duree: 8,
            contenu: `<p>Les installations professionnelles se déclinent en catégories réglementaires qui conditionnent les démarches administratives.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Tranche</th><th style="padding:8px;border:1px solid #cbd5e1">Catégorie</th><th style="padding:8px;border:1px solid #cbd5e1">Démarche admin</th><th style="padding:8px;border:1px solid #cbd5e1">Raccordement</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">≤ 36 kWc</td><td style="padding:8px;border:1px solid #e2e8f0">Petite installation</td><td style="padding:8px;border:1px solid #e2e8f0">Déclaration préalable</td><td style="padding:8px;border:1px solid #e2e8f0">BT ENEDIS</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">36 à 100 kWc</td><td style="padding:8px;border:1px solid #e2e8f0">Moyenne</td><td style="padding:8px;border:1px solid #e2e8f0">Permis de construire</td><td style="padding:8px;border:1px solid #e2e8f0">BT ENEDIS</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">100 à 500 kWc</td><td style="padding:8px;border:1px solid #e2e8f0">Grande installation</td><td style="padding:8px;border:1px solid #e2e8f0">Permis + étude impact</td><td style="padding:8px;border:1px solid #e2e8f0">BT ou HTA</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">&gt; 500 kWc</td><td style="padding:8px;border:1px solid #e2e8f0">Grande centrale</td><td style="padding:8px;border:1px solid #e2e8f0">Autorisation DREAL</td><td style="padding:8px;border:1px solid #e2e8f0">HTA obligatoire</td></tr></table>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px"><strong>Calcul toiture plate</strong><br><span style="font-size:0.9em">Surface brute × 0,7 ÷ 6,5 m²/kWc = puissance installable<br><em>Ex : 3 000 m² → 323 kWc</em></span></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px"><strong>Production annuelle</strong><br><span style="font-size:0.9em">kWc × productivité locale<br>Lyon : × 1 050 kWh/kWc · PACA : × 1 350 kWh/kWc</span></div>
</div>`,
          },
          {
            titre: 'Procédures Enedis et CONSUEL',
            ordre: 3,
            type: 'TEXTE',
            duree: 8,
            contenu: `<p>Solenyx pilote l'intégralité de ces démarches administratives. Le technicien doit en maîtriser les étapes pour informer le client.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Demande de raccordement S14</strong> — Via portail Enedis. Délai de réponse : 3 à 4 semaines pour la PTF. Coût raccordement : 2 000 € à 80 000 €.</li>
<li><strong>Acceptation PTF et convention</strong> — Signature client. Dépôt caution (20% du coût). Délai de réalisation : 3 à 18 mois.</li>
<li><strong>CONSUEL et attestation de conformité</strong> — Contrôle électrique obligatoire avant raccordement. Sans ce document, aucun raccordement n'est possible.</li>
<li><strong>Mise en service et contrat d'accès réseau</strong> — Enedis pose le compteur de production (P1). Contrat OA ou autoconsommation avec vente de surplus.</li>
</ol>
<div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Délai global :</strong> Entre l'audit Solenyx et la mise en service : 4 à 8 mois. La pose elle-même ne dure que 2 à 4 semaines selon la puissance.</p></div>
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Norme NF C 15-712-1 :</strong> Les installations PV professionnelles sont soumises à cette norme. La conformité est vérifiée par le CONSUEL avant toute mise en service.</p></div>`,
          },
          {
            titre: 'Quiz — Installation professionnelle',
            ordre: 4,
            type: 'QUIZ',
            duree: 7,
            contenu: null,
            questions: [
              { q: 'Quel logiciel est utilisé pour la simulation de production et l\'étude d\'ombrage ?', opts: ['AutoCAD uniquement', 'PVsyst ou Helioscope', 'Excel avec formules', 'Google Maps'], c: 1, expl: 'PVsyst et Helioscope sont les références professionnelles pour la simulation PV.' },
              { q: 'Pour une toiture plate de 3 000 m², quelle puissance peut-on approximativement installer ?', opts: ['Environ 50 kWc', 'Environ 150 kWc', 'Environ 320 kWc', 'Environ 1 500 kWc'], c: 2, expl: '3 000 m² × 0,7 ÷ 6,5 = 323 kWc (surface utile × densité).' },
              { q: 'Quelle démarche administrative est requise pour une installation entre 100 et 500 kWc ?', opts: ['Simple déclaration de travaux', 'Déclaration préalable seule', 'Permis de construire + étude d\'impact', 'Aucune démarche'], c: 2, expl: 'Les grandes installations (100–500 kWc) requièrent un permis de construire et une étude d\'impact.' },
              { q: 'Qu\'est-ce que le CONSUEL ?', opts: ['Le compteur de production Enedis', 'L\'organisme de contrôle de conformité électrique avant raccordement', 'Le contrat avec EDF pour la revente', 'La certification RGE'], c: 1, expl: 'Le CONSUEL délivre l\'attestation de conformité électrique indispensable au raccordement Enedis.' },
              { q: 'Quel est le délai habituel de réponse d\'Enedis à une demande de raccordement (PTF) ?', opts: ['24 à 48h', '1 semaine', '3 à 4 semaines', '6 mois'], c: 2, expl: 'Enedis répond sous 3 à 4 semaines avec la Proposition Technique et Financière (PTF).' },
              { q: 'Pour une installation > 250 kWc, quel raccordement est souvent requis ?', opts: ['Raccordement 12 V DC', 'Raccordement BT standard 230 V', 'Raccordement HTA 20 000 V', 'Raccordement téléphonique'], c: 2, expl: 'Au-delà de 250 kWc, le réseau BT est souvent insuffisant et le raccordement HTA (20 kV) est requis.' },
            ],
          },
        ],
      },
      {
        titre: 'Ombrières photovoltaïques',
        description: 'Conception et installation des ombrières : calcul de structure, poteaux, disposition des modules, contraintes vent et neige, gestion eaux pluviales, intégration IRVE.',
        type: 'E_LEARNING',
        categorie: 'TECHNIQUE',
        duree: 25,
        niveau: 'INTERMEDIAIRE',
        estObligatoire: false,
        modules: [
          {
            titre: 'Spécificités techniques et types de structures',
            ordre: 1,
            type: 'TEXTE',
            duree: 8,
            contenu: `<p>L'ombrière est une structure autonome sur parking ou espace extérieur. Elle se distingue d'une installation en toiture par les contraintes structurelles et la réglementation.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Ombrière monopente</div><div style="padding:12px;font-size:0.9em">La plus simple et économique. Poteaux d'un côté, structure inclinée 5–15°. Idéale pour parkings en longueur. Portée : jusqu'à 5 m.</div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Ombrière bipente (arche)</div><div style="padding:12px;font-size:0.9em">Deux pans inclinés, poteaux centraux. Couvre 2 rangées de véhicules. Aspect architectural soigné. Portée : 7 à 10 m.</div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Canopée plate</div><div style="padding:12px;font-size:0.9em">Toiture plate ou très peu inclinée sur grande portée. Adaptée aux grandes surfaces.</div></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="background:#0f172a;color:white;padding:10px 14px;font-weight:600">Structure agricole surélevée</div><div style="padding:12px;font-size:0.9em">Hauteur libre ≥ 4 m pour matériel agricole. Grande portée entre poteaux.</div></div>
</div>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Loi APER 2023 :</strong> Tout parking &gt; 80 places avec surface &gt; 500 m² est soumis à l'obligation légale d'équipement solaire. Pour les parkings couverts &gt; 1 500 m², l'obligation porte sur 100% de la surface.</p></div>`,
          },
          {
            titre: 'Calcul de structure, fondations et IRVE',
            ordre: 2,
            type: 'TEXTE',
            duree: 10,
            contenu: `<p>Le calcul de structure est la partie la plus critique. Il doit être réalisé par un bureau d'études structure (BET) certifié.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Type de charge</th><th style="padding:8px;border:1px solid #cbd5e1">Valeur typique</th><th style="padding:8px;border:1px solid #cbd5e1">Norme</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Charge permanente (panneaux + structure)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">20 à 30 kg/m²</td><td style="padding:8px;border:1px solid #e2e8f0">Eurocodes</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Surcharge de vent (zone 2, France)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">700 à 1 200 Pa</td><td style="padding:8px;border:1px solid #e2e8f0">EC1 NF EN 1991</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Surcharge de neige (zone A1)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">45 kg/m²</td><td style="padding:8px;border:1px solid #e2e8f0">EC1 NF EN 1991</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Profondeur de fondation (hors gel)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">0,80 à 1,20 m selon région</td><td style="padding:8px;border:1px solid #e2e8f0">DTU 13.1</td></tr></table>
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Jamais sans étude structure :</strong> Aucune ombrière ne peut être posée sans note de calcul signée par un ingénieur structure. L'absence d'étude annule les assurances et engage la responsabilité décennale de Solenyx.</p></div>
<p><strong>Intégration IRVE</strong></p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Type de borne</th><th style="padding:8px;border:1px solid #cbd5e1">Puissance</th><th style="padding:8px;border:1px solid #cbd5e1">Section câble</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Mode 3 — 7 kW mono</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">7 kW</td><td style="padding:8px;border:1px solid #e2e8f0">3 × 6 mm²</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Mode 3 — 22 kW tri</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">22 kW</td><td style="padding:8px;border:1px solid #e2e8f0">5 × 6 mm²</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Charge rapide DC 50 kW</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">50 kW</td><td style="padding:8px;border:1px solid #e2e8f0">35 mm²</td></tr></table>`,
          },
          {
            titre: 'Quiz — Ombrières photovoltaïques',
            ordre: 3,
            type: 'QUIZ',
            duree: 7,
            contenu: null,
            questions: [
              { q: 'Quelle surface déclenche l\'obligation solaire selon la loi APER 2023 (parking > 80 places) ?', opts: ['Dès 100 m²', 'Dès 250 m²', 'Dès 500 m²', 'Dès 2 000 m²'], c: 2, expl: 'La loi APER 2023 impose l\'équipement solaire pour les parkings > 80 places et > 500 m².' },
              { q: 'Quelle est la profondeur minimale de fondation pour respecter la cote hors-gel ?', opts: ['0,20 à 0,40 m', '0,80 à 1,20 m selon région', '2 à 3 m systématiquement', 'La profondeur n\'a aucune importance'], c: 1, expl: 'La profondeur hors-gel varie selon la région : 0,80 à 1,20 m en France métropolitaine.' },
              { q: 'Quel traitement anticorrosion est obligatoire pour la structure métallique ?', opts: ['Peinture acrylique standard', 'Galvanisation à chaud ≥ 85 µm', 'Huile de protection annuelle', 'Aucun traitement, l\'acier suffit'], c: 1, expl: 'La galvanisation à chaud ≥ 85 µm est obligatoire sur toutes les pièces structurelles.' },
              { q: 'Quelle section de câble faut-il pour une borne IRVE 22 kW triphasée ?', opts: ['1,5 mm²', '2,5 mm²', '5 × 6 mm²', '35 mm²'], c: 2, expl: 'Une borne 22 kW triphasée requiert un câble 5 × 6 mm² (3 phases + neutre + PE).' },
              { q: 'Quel équipement est obligatoire pour les eaux de ruissellement d\'un parking avant rejet réseau ?', opts: ['Filtre à sable', 'Débourbeur / déshuileur', 'Citerne récupération eau de pluie', 'Aucun équipement requis'], c: 1, expl: 'Le débourbeur/déshuileur est obligatoire pour traiter les eaux de parking avant rejet au réseau.' },
              { q: 'Combien de jours minimum après coulage des massifs béton avant de charger la structure ?', opts: ['24 heures', '7 jours', '28 jours', '3 mois'], c: 2, expl: 'Le béton armé atteint sa résistance nominale après 28 jours de cure minimale.' },
            ],
          },
        ],
      },
      {
        titre: 'Systèmes de batteries & stockage',
        description: 'Technologies LFP/NMC, dimensionnement du stockage, couplage AC/DC, stratégies charge/décharge, protection, sécurité et réglementation.',
        type: 'E_LEARNING',
        categorie: 'TECHNIQUE',
        duree: 25,
        niveau: 'INTERMEDIAIRE',
        estObligatoire: false,
        modules: [
          {
            titre: 'Technologies batteries : LFP vs NMC',
            ordre: 1,
            type: 'TEXTE',
            duree: 6,
            contenu: `<p>Le marché du stockage est dominé par deux chimies lithium : NMC (Nickel Manganèse Cobalt) et LFP (Lithium Fer Phosphate). Leur compréhension est indispensable pour conseiller techniquement.</p>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Caractéristique</th><th style="padding:8px;border:1px solid #cbd5e1">NMC</th><th style="padding:8px;border:1px solid #cbd5e1">LFP</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Densité énergétique</td><td style="padding:8px;border:1px solid #e2e8f0">150–250 Wh/kg</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">90–160 Wh/kg</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Cycles de charge (80% DoD)</td><td style="padding:8px;border:1px solid #e2e8f0">1 000 – 2 000</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">3 000 – 6 000</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Durée de vie estimée</td><td style="padding:8px;border:1px solid #e2e8f0">8 – 12 ans</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">12 – 20 ans</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Sécurité thermique</td><td style="padding:8px;border:1px solid #e2e8f0">Risque emballement</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Très stable, sécurisé</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Usage privilégié</td><td style="padding:8px;border:1px solid #e2e8f0">Mobilité (VE)</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">Stockage stationnaire</td></tr></table>
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Recommandation Solenyx :</strong> Les batteries LFP sont systématiquement préférées pour le stockage stationnaire. Leur sécurité supérieure, leur longévité (12–20 ans) et leur stabilité thermique en font la référence du marché.</p></div>`,
          },
          {
            titre: 'Dimensionnement, couplage et sécurité',
            ordre: 2,
            type: 'TEXTE',
            duree: 12,
            contenu: `<p>Le dimensionnement dépend de l'objectif : couvrir la consommation nocturne, assurer une autonomie en cas de coupure réseau, ou optimiser l'autoconsommation sur 24h.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Calcul de la consommation nocturne</strong> — En résidentiel, 40 à 50% du total soit 5 à 8 kWh/nuit. Cette valeur détermine la capacité utile minimale.</li>
<li><strong>Détermination de la capacité brute</strong> — Capacité utile ÷ DoD. Avec DoD 80% : 7 kWh utiles ÷ 0,8 = 8,75 kWh bruts → choisir 10 kWh.</li>
<li><strong>Sélection puissance charge/décharge</strong> — La puissance crête batterie doit être compatible avec l'onduleur hybride.</li>
</ol>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px"><strong>Couplage DC (préféré)</strong><br><span style="font-size:0.9em">Batterie chargée depuis les panneaux en DC. Un seul convertissement DC→AC. Rendement global : 95–97%.</span></div>
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px"><strong>Couplage AC (rétrofit)</strong><br><span style="font-size:0.9em">Batterie chargée depuis le réseau AC. Double convertissement. Rendement : 88–92%. Compatible avec toute installation existante.</span></div>
</div>
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Risque incendie :</strong> En cas d'emballement thermique, la réaction se propage. Toute batterie présentant une déformation, odeur ou chaleur anormale doit être mise hors tension immédiatement.</p></div>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Règle</th><th style="padding:8px;border:1px solid #cbd5e1">Exigence</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Local d'installation</td><td style="padding:8px;border:1px solid #e2e8f0">Ventilé, classe de feu EI60 minimum</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Distance murs/objets</td><td style="padding:8px;border:1px solid #e2e8f0">Min. 200 mm sur les côtés, 300 mm en façade</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Mise à la terre</td><td style="padding:8px;border:1px solid #e2e8f0">Obligatoire, conducteur PE ≥ 6 mm²</td></tr></table>`,
          },
          {
            titre: 'Quiz — Batteries & stockage',
            ordre: 3,
            type: 'QUIZ',
            duree: 7,
            contenu: null,
            questions: [
              { q: 'Pourquoi les batteries LFP sont-elles préférées au NMC pour le stockage stationnaire ?', opts: ['Moins chères à fabrication équivalente', 'Densité énergétique plus élevée', 'Plus sûres et durée de vie bien supérieure', 'Meilleures pour les véhicules électriques'], c: 2, expl: 'LFP : 3 000–6 000 cycles, 12–20 ans de durée de vie, très stable thermiquement.' },
              { q: 'Quelle est la durée de vie estimée d\'une batterie LFP en stockage stationnaire ?', opts: ['2 à 5 ans', '5 à 8 ans', '12 à 20 ans', 'Plus de 50 ans'], c: 2, expl: 'Les batteries LFP durent 12 à 20 ans en usage stationnaire grâce à leurs 3 000–6 000 cycles.' },
              { q: 'Consommation nocturne utile = 7 kWh, DoD = 80%. Quelle capacité brute minimum ?', opts: ['5,6 kWh', '7 kWh', '8,75 kWh', '14 kWh'], c: 2, expl: 'Capacité brute = 7 kWh ÷ 0,8 (DoD) = 8,75 kWh. En pratique on choisit 10 kWh.' },
              { q: 'Quel est l\'avantage du couplage DC par rapport au couplage AC ?', opts: ['Compatible avec toutes les installations existantes', 'Meilleur rendement global (95–97% vs 88–92%)', 'Ne nécessite pas d\'onduleur hybride', 'Coûte moins cher'], c: 1, expl: 'Le couplage DC n\'implique qu\'un seul convertissement DC→AC, d\'où un meilleur rendement (95–97%).' },
              { q: 'Quelle est la distance minimale recommandée entre une batterie et les murs latéraux ?', opts: ['Aucune distance requise', '50 mm', '200 mm', '1 mètre'], c: 2, expl: '200 mm minimum sur les côtés et 300 mm en façade pour permettre la ventilation et l\'accès.' },
              { q: 'Quel protocole de communication est utilisé entre batterie et onduleur hybride ?', opts: ['Bluetooth uniquement', 'CAN bus, RS485 ou Wi-Fi selon marque', 'HDMI', 'Signal radio FM'], c: 1, expl: 'CAN bus, RS485 ou Wi-Fi selon les marques — il ne faut pas mélanger les protocoles.' },
            ],
          },
        ],
      },
      {
        titre: 'Raccordement & mise en service',
        description: 'Mise en service complète : vérifications pré-mise en service, séquences DC/AC, tests électriques, conformité NF C 15-712, CONSUEL, paramétrage onduleur.',
        type: 'E_LEARNING',
        categorie: 'TECHNIQUE',
        duree: 30,
        niveau: 'AVANCE',
        estObligatoire: true,
        modules: [
          {
            titre: 'Vérifications pré-mise en service',
            ordre: 1,
            type: 'TEXTE',
            duree: 8,
            contenu: `<p>Avant toute mise sous tension, une inspection complète et méthodique est obligatoire. Cette étape conditionne la sécurité des personnes et la conformité.</p>
<ul style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Côté DC :</strong> Vérification polarité connecteurs MC4 (rouge = +, noir = −), mesure tension Voc de chaque string, mesure Isc si accès sécurisé.</li>
<li>Tension Voc mesurée conforme à la valeur théorique (N panneaux × Voc unitaire × correction température). Tolérance : ±5%.</li>
<li>Test mégohmmètre entre conducteurs DC et masse : valeur &gt; 1 MΩ requise (absence de défaut d'isolement).</li>
<li><strong>Côté AC :</strong> Vérification tension réseau (230 V ±10%), ordre des phases (triphasé), fréquence 50 Hz ± 0,5 Hz.</li>
<li>Continuité conducteur PE entre tous les éléments, résistance de terre &lt; 100 Ω (résidentiel) ou &lt; 30 Ω (professionnel).</li>
</ul>
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>DANGER :</strong> Les connecteurs MC4 ne doivent JAMAIS être connectés ou déconnectés sous charge. Toujours couper le disjoncteur DC avant toute intervention. Une déconnexion sous charge crée un arc électrique dangereux (tension DC jusqu'à 800 V).</p></div>`,
          },
          {
            titre: 'Séquence de mise en service et paramétrage',
            ordre: 2,
            type: 'TEXTE',
            duree: 10,
            contenu: `<p>La mise en service suit une séquence stricte et non modifiable, conçue pour protéger les équipements et les intervenants.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Connexion DC</strong> — Fermer les sectionneurs DC. Vérifier l'affichage de la tension DC sur l'onduleur dans la plage MPPT.</li>
<li><strong>Connexion AC</strong> — Fermer le disjoncteur AC dédié. L'onduleur démarre sa procédure de synchronisation réseau (1 à 5 minutes).</li>
<li><strong>Vérification de la production</strong> — L'onduleur affiche la puissance AC injectée. Un wattmètre clamp sur la sortie AC confirme les valeurs.</li>
<li><strong>Test de coupure réseau (anti-îlotage)</strong> — Couper le disjoncteur AC → l'onduleur doit s'arrêter en moins de 2 secondes (norme EN 50549).</li>
<li><strong>Paramétrage et configuration monitoring</strong> — Connexion Wi-Fi/4G, enregistrement sur la plateforme Solenyx, test d'alerte.</li>
<li><strong>Remise des documents au client</strong> — DOE : plans câblage, fiches techniques, attestation conformité, guide utilisateur.</li>
</ol>
<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr style="background:#f0f9ff"><th style="padding:8px;border:1px solid #cbd5e1">Paramètre</th><th style="padding:8px;border:1px solid #cbd5e1">Valeur requise (France)</th><th style="padding:8px;border:1px solid #cbd5e1">Norme</th></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Tension min/max de déclenchement</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">195 V – 253 V (-15%/+10%)</td><td style="padding:8px;border:1px solid #e2e8f0">EN 50549</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Fréquence min de déclenchement</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">49 Hz</td><td style="padding:8px;border:1px solid #e2e8f0">EN 50549</td></tr>
<tr><td style="padding:8px;border:1px solid #e2e8f0">Délai de reconnexion après incident</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600">5 minutes minimum</td><td style="padding:8px;border:1px solid #e2e8f0">Enedis SOL-34</td></tr></table>
<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Profil pays :</strong> Vérifier que le profil "France" ou "FR" est bien sélectionné sur l'onduleur. Un onduleur en profil "Allemagne" peut entraîner des déclenchements intempestifs.</p></div>`,
          },
          {
            titre: 'Conformité CONSUEL et réception client',
            ordre: 3,
            type: 'TEXTE',
            duree: 5,
            contenu: `<p>La réception engage la responsabilité de Solenyx. Elle doit être documentée et comprend la transmission du dossier de conformité.</p>
<ol style="line-height:2;margin:12px 0 12px 20px">
<li><strong>Dossier CONSUEL</strong> — Remplir l'attestation AT01. Le contrôleur vérifie la mise à la terre, les protections différentielles, le câblage et les étiquetages. Délai : 2 à 4 semaines.</li>
<li><strong>Transmission à Enedis</strong> — L'attestation CONSUEL permet la pose du compteur de production (P1) et l'activation du contrat d'injection.</li>
<li><strong>Formation client</strong> — Présenter l'interface de monitoring. Expliquer : production instantanée, taux d'autoconsommation, alertes. Durée : 20 à 30 minutes.</li>
<li><strong>Procès-verbal de réception</strong> — Signature du PV par le client et le technicien Solenyx. Ce document déclenche la garantie décennale.</li>
</ol>
<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:6px;margin:12px 0"><p><strong>Délai global résidentiel Solenyx :</strong> Audit → pose → CONSUEL → raccordement Enedis = 30 à 45 jours. C'est l'engagement "installation sous 40 jours".</p></div>`,
          },
          {
            titre: 'Quiz — Raccordement & mise en service',
            ordre: 4,
            type: 'QUIZ',
            duree: 7,
            contenu: null,
            questions: [
              { q: 'Quelle valeur de résistance de terre est requise pour une installation résidentielle ?', opts: ['< 10 Ω', '< 100 Ω', '< 500 Ω', '< 1 000 Ω'], c: 1, expl: 'La résistance de terre doit être < 100 Ω en résidentiel et < 30 Ω en professionnel.' },
              { q: 'Pourquoi ne doit-on jamais déconnecter un connecteur MC4 sous charge ?', opts: ['Cela détruit le panneau solaire', 'La tension DC peut créer un arc électrique dangereux jusqu\'à 800 V', 'C\'est simplement une recommandation', 'Cela annule la garantie'], c: 1, expl: 'La tension DC (jusqu\'à 800 V) peut créer un arc électrique très dangereux lors de la déconnexion.' },
              { q: 'Quelle est la tension maximale autorisée avant déclenchement (norme EN 50549) ?', opts: ['230 V (pas de tolérance)', '253 V (+10%)', '280 V (+20%)', 'Aucune limite haute'], c: 1, expl: 'La norme EN 50549 autorise +10% soit 253 V maximum avant déclenchement de protection.' },
              { q: 'Quel est le délai minimal de reconnexion après incident réseau (norme Enedis) ?', opts: ['5 secondes', '30 secondes', '5 minutes', '1 heure'], c: 2, expl: 'L\'onduleur doit attendre 5 minutes minimum avant de se reconnecter (norme Enedis SOL-34).' },
              { q: 'Quel document déclenche l\'activation de l\'abonnement Solenyx et la garantie décennale ?', opts: ['La facture de l\'installation', 'Le devis accepté', 'Le procès-verbal de réception signé', 'L\'attestation CONSUEL seule'], c: 2, expl: 'Le PV de réception signé par le client et le technicien est le document déclencheur de la garantie.' },
              { q: 'Que vérifier concernant le profil pays de l\'onduleur avant mise en service en France ?', opts: ['Aucune vérification nécessaire', 'Vérifier que le profil "France" ou "FR" est sélectionné', 'Utiliser le profil "Allemagne" standard européen', 'Le profil est configuré uniquement par Enedis'], c: 1, expl: 'Le profil pays conditionne les seuils de tension et fréquence. Le profil France doit être sélectionné.' },
            ],
          },
        ],
      },
    ]

    for (const fData of formationsData) {
      const { modules, ...formationFields } = fData
      const formation = await prisma.formation.create({ data: formationFields })

      for (const mod of modules) {
        const { questions, ...modFields } = mod as any
        const module = await prisma.moduleFormation.create({
          data: { ...modFields, formationId: formation.id },
        })

        if (questions) {
          for (let qi = 0; qi < questions.length; qi++) {
            const q = questions[qi]
            await prisma.quizQuestion.create({
              data: {
                moduleId: module.id,
                question: q.q,
                choix: JSON.stringify(q.opts),
                bonneReponse: q.c,
                explication: q.expl,
                ordre: qi + 1,
              },
            })
          }
        }
      }
    }

    // Alertes
    await prisma.alerte.create({
      data: {
        type: 'RC_PRO',
        titre: 'RC Pro expirant bientôt',
        message: '3 commerciaux ont leur RC Pro qui expire dans moins de 30 jours',
        priorite: 'HAUTE',
      },
    })

    await prisma.alerte.create({
      data: {
        type: 'INACTIVITE',
        titre: 'Commerciaux sans activité',
        message: '2 commerciaux n\'ont pas eu d\'activité depuis plus de 2 semaines',
        priorite: 'NORMALE',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Base de données initialisée avec succès',
      credentials: {
        admin: { email: 'admin@crm.fr', password: 'Admin2024!' },
        commercial: { email: 'commercial1@crm.fr', password: 'Pass2024!' },
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
