# 12 — Débogage & raisonnement technique

Ce guide rassemble les pannes **réellement rencontrées** sur ce projet, leur cause, et la
méthode pour les diagnostiquer. À l'examen, savoir débloquer vite vaut autant que coder.

---

## 1. Boîte à outils du diagnostic

| Outil | Pour quoi |
|-------|-----------|
| **Console navigateur** (F12) | erreurs JS, statuts HTTP, messages d'erreur Angular |
| **Onglet Réseau** (F12) | URL exacte, méthode, headers, **code HTTP**, corps de réponse |
| **`curl`** (ou l'onglet Réseau « copy as curl ») | tester l'API GLPI **hors Angular** pour isoler |
| **`npm run build`** | erreurs de compilation & de templates (NG…) |
| **Logs serveur GLPI** | erreurs PHP côté backend |

**Méthode universelle :** *reproduire isolément*. Si une requête échoue dans l'app, rejoue-la
en `curl`. Si curl marche mais pas l'app → c'est un problème **front** (headers, proxy,
mapping). Si curl échoue aussi → c'est **GLPI/donnée**.

---

## 2. Panne : CORS « No 'Access-Control-Allow-Origin' »

**Symptôme :** `Access to XMLHttpRequest at 'http://localhost/api.php/...' from origin
'http://localhost:4200' has been blocked by CORS policy`.

**Cause :** le front (`:4200`) et GLPI (`:80`) sont des origines différentes ; GLPI ne renvoie
pas les headers CORS sur la vraie réponse.

**Solution (déjà en place) : proxy de dev.** `proxy.conf.json` redirige `/api.php`,
`/apirest.php`, `/files` vers `http://localhost`. Les URLs de `environment.ts` sont
**relatives** (`/api.php/v1`) → le navigateur appelle `localhost:4200/...` (même origine) et le
dev-server relaie. Le script `start` inclut `--proxy-config proxy.conf.json`.

> ⚠️ **Le proxy ne se charge qu'au démarrage.** Si tu modifies `proxy.conf.json` ou
> `angular.json`, **redémarre `npm start`**. Symptômes d'un proxy non chargé : un `GET` renvoie
> `index.html` (HTML) avec **200 mais `ok:false`** (Angular n'arrive pas à parser le JSON), et
> un `POST` renvoie **404**.

---

## 3. Panne : `400 "Contenu du JSON invalide"` (API v2)

**Symptôme :** un simple `GET /api.php/v2/Assets/...` renvoie 400 dans le navigateur (mais 200
en curl).

**Cause :** l'intercepteur ajoutait `Content-Type: application/json` sur un **GET sans corps**.
L'API v2 tente alors de parser un corps vide → 400.

**Solution (en place) :** l'intercepteur ne pose `Content-Type: application/json` que s'il y a
un **corps** non-`FormData` (`wantsJson = req.body != null && !isFormData`). Voir doc 05 §2.

---

## 4. Panne : upload d'image « Type de fichier invalide »

**Symptôme :** `POST /Document` accepté mais le fichier est rejeté ; image non liée.

**Causes & solutions :**
1. **Extension mensongère** : un `.png` qui est en réalité un **JPEG**. GLPI 11 valide le
   **contenu** (magic bytes) vs l'extension. → on **détecte** le vrai type (`detectImage`) et
   on **renomme** (`PC-ADM-001.jpg`) avant l'upload.
2. **`Content-Type` forcé sur le `FormData`** : casse le `multipart/form-data; boundary=…`. →
   l'intercepteur ne touche pas au `Content-Type` des `FormData`.
3. **Manifeste incomplet** : il faut `uploadManifest = {input:{name,_filename:[fichier]}}` et
   le blob dans `filename[0]`, le nom du blob = `_filename[0]`.

---

## 5. Panne : « référence non trouvée » à l'import des coûts / images

**Symptôme :** l'import des **coûts** (feuille 3) échoue (« Ticket #N introuvable »), ou
l'import des **images** échoue quand lancé **avec** les autres mais marche **seul**.

**Causes :**
- **Coûts** : le registre ne contient pas le ticket → soit la feuille 2 n'a pas été importée,
  soit le registre a été vidé. Rappel : `Num_Ticket` ≠ id GLPI → on **doit** passer par le
  registre (persistant). Importer d'abord la feuille 2 (ou l'avoir importée avant).
- **Images** : bug d'**exécution anticipée**. `importFile` faisait `from(this.run(file))` →
  `run()` (async) démarrait *tout de suite*, en parallèle de l'import des éléments → images
  cherchées avant que les éléments existent. **Seul**, les éléments existaient déjà dans GLPI
  (recherche API) → ça marchait. → **Solution : `defer(() => from(this.run(file)))`** + `defer`
  dans `runStep` du composant pour que chaque étape ne démarre qu'à son tour.

> 🧠 Leçon générale : « marche seul mais pas ensemble » ⇒ soupçonne un **problème d'ordre /
> d'exécution parallèle** (souvent un observable créé de façon non paresseuse).

---

## 6. Panne : `npm install` échoue (certificat)

**Symptôme :** `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.

**Cause :** proxy d'entreprise qui intercepte HTTPS ; Node n'a pas le certificat racine.

**Solutions :** `npm config set cafile "C:\chemin\cert-racine.pem"` puis `npm install` ; en
dernier recours réseau de confiance : `npm config set strict-ssl false` (à réactiver après).
NB : le **navigateur** a souvent le certificat racine du proxy installé → les CDN (FontAwesome)
chargent même quand `npm` échoue.

---

## 7. Panne : aucune icône FontAwesome ne s'affiche

**Cause :** la feuille FA n'est incluse nulle part.
**Solution (en place) :** lien CDN dans `src/index.html`
(`cdnjs.../font-awesome/6.5.1/css/all.min.css`). Si bloqué par le proxy, vendoriser FA en
local dans `public/`.

---

## 8. Codes HTTP GLPI à connaître

| Code | Sens fréquent ici |
|------|-------------------|
| 200/201 | OK / créé |
| 206 | *Partial Content* (pagination `range`) — **pas une erreur** |
| 400 | corps JSON invalide (cf. §3) ou input mal formé |
| 401 | token manquant/expiré (session non initialisée) |
| 404 | endpoint/ressource inexistant (ou proxy non chargé pour un POST) |
| 4xx sur liste vide | certaines entités vides répondent 4xx → on `catchError(() => of([]))` |

---

## 9. Erreurs Angular fréquentes (build/template)

| Message | Cause | Fix |
|---------|-------|-----|
| `NG8113 … is not used within the template` | composant importé mais non utilisé | le retirer de `imports` |
| Composant inconnu dans le template | oublié dans `imports` | l'ajouter |
| `Cannot read properties of undefined` dans un template | accès à un signal avant chargement | `@if (data())` ou `?.` |
| « rien ne s'affiche / pas d'appel réseau » | pas de `subscribe`/`firstValueFrom` | déclencher le flux |
| espacement/police « ne prend pas » | token CSS inexistant | définir le token / corriger le nom |

---

## 10. Démarche de débogage en 6 étapes (à appliquer mécaniquement)

1. **Lire le message** complet (console + onglet Réseau) — ne pas deviner.
2. **Localiser la couche** : UI ? service ? interceptor ? GLPI ?
3. **Reproduire en `curl`** la requête suspecte → front vs backend.
4. **Comparer** headers/corps entre l'app et le curl qui marche.
5. **Tracer le flux** (doc 11) du template jusqu'à l'endpoint.
6. **Corriger au bon endroit** (souvent : interceptor, mapping, ordre RxJS, token CSS), puis
   `npm run build` et test navigateur.

➡️ Tu as fini la doc. Passe aux **exercices** (`exercises/README.md`).
