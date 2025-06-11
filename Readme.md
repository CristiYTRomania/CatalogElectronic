# 📘 Catalogul Electronic

### [Video prezentare aplicatie](https://www.youtube.com/watch?v=2jFBgGJkyWk)
### [Video prezentare testare cypress](https://www.youtube.com/watch?v=rHhsNEVWoKo)


## 🧑‍💻 Contribuții

### 1. **Dobricean Ioan-Dorian**  
- A ales tema proiectului, limbajul de programare și stack-urile tehnologice.  
- A coordonat implementarea componentelor principale.  
- A ghidat echipa în învățarea și utilizarea frameworkului **React**.

---

### 2. **Gheorghieș Petruț-Rareș**  
- A realizat paginile dedicate **adminului**.  
- A configurat testarea end-to-end cu **Cypress** pe GitHub Actions – una dintre cele mai complexe părți ale proiectului.  

---

### 3. **Jitescu Silviu-Cristian**  
- A dezvoltat componentele funcționale esențiale ale aplicației.  
- A integrat biblioteca **Ant Design (antd)** pentru interfața grafică.  
- A participat la testarea aplicației și la rafinarea experienței de utilizator.
- A efectuat **deploy-ul** aplicației pe **Vercel**.

---

## 🛠️ Stack Tehnologic

- **Frontend:** React, Ant Design  
- **Testare:** Cypress, GitHub Actions  
- **Deploy:** Vercel  
- **Altele:** ESLint, Prettier, Yarn

---

## 🚀 Deploy Live

Aplicația este disponibilă online la: [https://catalog-electronic.vercel.app](https://catalog-electronic.vercel.app)
---
---

## ✅ Check-list – B. Procesul de dezvoltare software *(notă între 1 și 10)*

### 🔹 1. User stories & Backlog creation

- Am utilizat [Trello – Catalog Electronic](https://trello.com/b/grMq9bNH/catalog-electronic)
- Am lucrat în principal individual și am notat user stories în Trello
- Am inclus **minim 10 user stories**
- User stories cu acceptance criteria: https://trello.com/c/9F5uxMqi/18-ca-utilizator-profesor-doresc-sa-pot-sa-pun-abaderi-pe-care-sa-le-vada-parintii https://trello.com/c/zI3afdIt/14-ca-utilizatordirector-doresc-sa-am-o-interfata-de-statistici https://trello.com/c/jch3vp1d/13-ca-utilizator-profesor-doresc-sa-pun-rapid-absente-si-note

---

### 🔹 2. Diagrame (UML, workflow)

- ❌ Nu au fost realizate diagrame

---

### 🔹 3. Source control cu Git

- Am lucrat exclusiv cu **Git + GitHub**
- Fiecare coleg a lucrat pe un **branch propriu**
- Am făcut **pull requests** către `main`
- Coechipierii au oferit **code review**
- De asemenea, s-a asteptat pana cand testele au fost validate
- ex: [PR](https://github.com/CristiYTRomania/CatalogElectronic/pull/7)
- ✅ S-au realizat **minim 10 commits per membru**

---

### 🔹 4. Teste automate *(2 pct)*

- Am implementat **2 teste automate** folosind **GitHub Actions**:
  - ✅ Test E2E cu **Cypress**
- O altă testare ca si consecință este deploy-ul vercel pentru fiecare pull-request, astfel putem verifca cum va arata producția și lăsa și comentarii direct in deploy dacă ceva vrem modificat, vizual.
- EX: [PR](https://github.com/CristiYTRomania/CatalogElectronic/pull/10)
- **Nu permitem merge-ul** fără ca testele să treacă

---

### 🔹 5. Raportare bug & rezolvare cu pull request *(1 pct)*

- Bug-urile identificate au fost **rezolvate prin PR-uri**
- Am urmat procesul de **ticket + branch-fix + pr + review + merge**
- ex:[PR](https://github.com/CristiYTRomania/CatalogElectronic/pull/10)

---

### 🔹 6. Comentarii cod & respectarea code standards *(1 pct)*

- Codul este **structurat clar**:
  - Folder `Pages/` → redă paginile principale
  - Folder `Components/` → elemente reutilizabile
  - Organizare pe roluri: `Admin/`, `Elev/`, `Profesor/`
- Am folosit **ESLint în VSCode**
  - Formatat automat la **on save**
  - Fișier care respectă code standards: https://github.com/CristiYTRomania/CatalogElectronic/blob/main/src/Components/ProfesorPage.jsx

---

### 🔹 7. Design patterns *(1 pct)*

- ✅ Am folosit **High Order Component**  
  > Ex: pentru afișarea erorilor, am creat o componentă care încarcă automat funcțiile necesare și include pagina ca și copil.
- ✅ **Redux** pentru state management, accesat în componente prin `useSelector`
- ✅ **Programare funcțională** cu hook-uri personalizate

---

### 🔹 8. Prompt Engineering *(2 pct)*

- În timpul dezvoltării, am folosit instrumente AI pentru clarificări și optimizare:
  - ✅ **DeepSeek** (modul deepThink) – întrebări legate de:
    - Implementarea MFA prin email cu Firebase
    - Configurația securizării emailurilor în Firebase
  - Ocazional am folosit și **ChatGPT**, dar DeepSeek a fost companionul principal
