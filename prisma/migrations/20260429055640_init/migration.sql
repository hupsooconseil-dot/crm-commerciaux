-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COMMERCIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Commercial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "region" TEXT,
    "secteur" TEXT,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "numeroRSAC" TEXT,
    "dateValiditeRSAC" DATETIME,
    "assureurRCPro" TEXT,
    "dateValiditeRCPro" DATETIME,
    "objectifMensuel" REAL DEFAULT 0,
    "objectifAnnuel" REAL DEFAULT 0,
    "parrainId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commercial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Commercial_parrainId_fkey" FOREIGN KEY ("parrainId") REFERENCES "Commercial" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "contactNom" TEXT,
    "contactPrenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "secteurActivite" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'NOUVEAU',
    "source" TEXT,
    "notes" TEXT,
    "dateContact" DATETIME,
    "dateRdv" DATETIME,
    "dateDevis" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prospect_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "prospectId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "montantEstime" REAL NOT NULL DEFAULT 0,
    "probabilite" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "etape" TEXT NOT NULL DEFAULT 'PROSPECTION',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePrevClot" DATETIME,
    "dateClot" DATETIME,
    "nbRelances" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunite_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunite_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "opportuniteId" TEXT,
    "reference" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientTelephone" TEXT,
    "produit" TEXT,
    "montant" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "dateSignature" DATETIME,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "tauxCommission" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrat_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contrat_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CRV" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "prospectId" TEXT,
    "opportuniteId" TEXT,
    "dateVisite" DATETIME NOT NULL,
    "typeContact" TEXT NOT NULL DEFAULT 'VISITE',
    "duree" INTEGER,
    "objectif" TEXT,
    "compteRendu" TEXT NOT NULL,
    "actionsNext" TEXT,
    "dateRelance" DATETIME,
    "kilometrage" REAL,
    "coordonnees" TEXT,
    "qualite" INTEGER DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CRV_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CRV_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CRV_opportuniteId_fkey" FOREIGN KEY ("opportuniteId") REFERENCES "Opportunite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "contratId" TEXT,
    "periode" TEXT NOT NULL,
    "montantBase" REAL NOT NULL DEFAULT 0,
    "taux" REAL NOT NULL DEFAULT 0,
    "montantCommission" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "dateValidation" DATETIME,
    "datePaiement" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "fichierUrl" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'VALIDE',
    "dateDocument" DATETIME,
    "dateExpiration" DATETIME,
    "dateReception" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'E_LEARNING',
    "categorie" TEXT,
    "contenu" TEXT,
    "duree" INTEGER,
    "niveau" TEXT NOT NULL DEFAULT 'DEBUTANT',
    "estObligatoire" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ModuleFormation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formationId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "duree" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'TEXTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModuleFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "choix" TEXT NOT NULL,
    "bonneReponse" INTEGER NOT NULL,
    "explication" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuizQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ModuleFormation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormationCommercial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'NON_COMMENCE',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormationCommercial_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormationCommercial_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'NORMALE',
    "estLue" BOOLEAN NOT NULL DEFAULT false,
    "dateLecture" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alerte_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "Commercial" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RapportHebdomadaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commercialId" TEXT NOT NULL,
    "semaine" TEXT NOT NULL,
    "nbProspects" INTEGER NOT NULL DEFAULT 0,
    "nbRdv" INTEGER NOT NULL DEFAULT 0,
    "nbDevis" INTEGER NOT NULL DEFAULT 0,
    "nbContrats" INTEGER NOT NULL DEFAULT 0,
    "caRealise" REAL NOT NULL DEFAULT 0,
    "kilometrage" REAL NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Commercial_userId_key" ON "Commercial"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrat_reference_key" ON "Contrat"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "FormationCommercial_commercialId_formationId_key" ON "FormationCommercial"("commercialId", "formationId");
