# Utilizarea LLM-urilor în Dezvoltarea Catalogului Electronic

## Introducere

Acest document prezintă modul în care diverse modele de limbaj de mari dimensiuni (LLM-uri) au fost utilizate pentru a dezvolta și optimiza sistemul de Catalog Electronic. Fiecare LLM a fost folosit pentru sarcini specifice, valorificând punctele sale forte pentru a eficientiza procesul de dezvoltare.

## 1. ChatGPT - Dezvoltarea Logicii de Business și Arhitectura Componentelor

### Utilizare Principală

ChatGPT a fost folosit pentru:

- Generarea punctuala a unor funcții fără context în restul programului ca și:
  a) Crearea funcțiilor de validare pentru CNP și date personale
  b) Calcularea mediei

### Exemple de Fișiere Dezvoltate cu ChatGPT

#### `src/utils/calculare_medie.js`

```javascript
// Funcție generată cu ajutorul ChatGPT pentru calcularea mediei elevilor
export const calculeazaMedie = (note) => {
  if (!note || note.length === 0) return 0;

  const noteValide = note.filter((nota) => nota && nota.valoare);
  if (noteValide.length === 0) return 0;

  const suma = noteValide.reduce((acc, nota) => acc + nota.valoare, 0);
  return Math.round((suma / noteValide.length) * 100) / 100;
};
```

#### `src/utils/cnpValidator.js`

```javascript
// Validator CNP dezvoltat cu ChatGPT
export const validateCNP = (cnp) => {
  if (!cnp || cnp.length !== 13) return false;

  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnp[i]) * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder < 10 ? remainder : 1;

  return parseInt(cnp[12]) === checkDigit;
};
```

### Avantaje și dezavantaje ale Utilizării ChatGPT

- Generare rapidă de cod funcțional unitar
- Explicații detaliate ale implementărilor
- DezavantajȘ nu înțelege contextul detaliat al aplicației

## 2. DeepSeek cu Deep Think - Rezolvarea Problemelor Complexe de Algoritmi

### Utilizare Principală

DeepSeek cu modul Deep Think a fost utilizat pentru fișiere lungi dar în continuare sarcini izolate:

- Model html de trimitere a email
- Functii firebase de autentificarea, 2fa

### Avantaje și Dezavantaje ale DeepSeek cu Deep Think

- Analiză profundă a problemelor complexe
- Soluții optimale pentru algoritmi complicați
- Considerarea multiplelor variabile și constrainturi
- Dezavantaj: După doua cereri nu mai merge, dă server error

## 3. Google Gemini - Eficientizarea Codului și Rezolvarea Bug-urilor

### Utilizare Principală

Google Gemini a fost folosit pentru:

- Optimizarea performanței componentelor React
- A reușit să ia ce a facut alte AI-uri sau noi și să facă paralelism a cereriilor, un exemplu este src/Catalog.jsx
- Implementarea lazy loading-ului/ error boundary pentru componente

### Exemple de Optimizări cu Google Gemini

#### `src/Components/Catalog.jsx`

```javascript
// Componentă optimizată cu Google Gemini pentru sincronizarea în timp real la DB
useEffect(() => {
  let array = [];
  for (let elev of classData?.elevi || []) {
    const unsub = onSnapshot(doc(db, "catalog", elev.id), (doc) => {
      fetchData();
    });
    const unsub2 = onSnapshot(doc(db, "eleviDocumente", elev.id), (doc) => {
      fetchData();
    });
    array.push(unsub);
    array.push(unsub2);
  }
}, []);
```

#### `src/Components/withErrorComponent.jsx`

```javascript
// Higher-Order Component pentru gestionarea erorilor, optimizat cu Gemini
import React from "react";
import ErrorFallback from "./ErrorFallback";

const withErrorComponent = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      // Gemini a sugerat logging detaliat pentru debugging
      console.error("Error caught by HOC:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return <ErrorFallback error={this.state.error} />;
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

export default withErrorComponent;
```

#### Bug Fix în `src/Components/ModalAddGrade.jsx`

```javascript
// Bug fix pentru re-render-uri multiple, rezolvat cu ajutorul Gemini
const ModalAddGrade = ({ isOpen, onClose, elevId, materiaId }) => {
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  // Gemini a identificat problema: useEffect fără dependency array
  useEffect(() => {
    if (!isOpen) {
      setNota("");
      setLoading(false);
    }
  }, [isOpen]); // Dependency array adăugat

  // Gemini a sugerat debouncing pentru validarea în timp real
  const debouncedValidation = useMemo(
    () =>
      debounce((value) => {
        validateNota(value);
      }, 300),
    []
  );

  const handleNotaChange = (e) => {
    const value = e.target.value;
    setNota(value);
    debouncedValidation(value);
  };

  // Rest of component...
};
```

### Avantaje ale Google Gemini

- Identificarea rapidă a problemelor de performanță
- Sugestii concrete pentru refactorizare
- Optimizări bazate pe best practices React
- DezavantajȘTotuși este greu într-o aplicație mare, deoarece nu știe toate funcțiile ajutătoare

## 4. Claude Code - Dezvoltarea Testelor Cypress și Automatizări

### Utilizare Principală

Claude Code a fost folosit pentru:

- Crearea testelor end-to-end cu Cypress
- Automatizarea procesului de testare
- Implementarea CI/CD pipeline-ului
- Generarea de mock data pentru teste

### Exemple de Teste Cypress Dezvoltate cu Claude Code

#### `cypress/e2e/testApp.cy.js`

```javascript
describe("tets", () => {
  it("Should work properly", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    indexedDB.deleteDatabase("firebaseLocalStorageDb"); // șterge cache-ul de login Firebase

    cy.visit("http://localhost:3000");

    cy.get('input[name="email"]').type("dobriceanionut1408@gmail.com");
    cy.get('input[name="pass"]').type("1234567");
    cy.get("#login-btn").click();

    cy.wait(20000);
    cy.get('input[name="mfaCode"]').type("123456");
    cy.get("#login-btn").click();

    cy.wait(20000);
    cy.contains("span.ant-menu-title-content", "Clase").click();
    cy.get("div.ant-card-meta-title").contains("a V-a D").click();
    cy.wait(20000);
    cy.get("span.anticon-plus").first().click();
    cy.contains("span", "OK").click();
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const formattedDate = `${day}.${month}`;
    cy.wait(8000);
    cy.contains(formattedDate);
    cy.contains("SUCCES");
  });
});
```

### Avantaje ale Claude Code

- Rulează în terminal, în root-ul proiectului, adică trăiește în terminal
- Înțelege contextul aplicației, folosește helper functions, înțelege stilul tău.
- Scrie direct in vs code
- Este foarte scump, s-au cheltuit aproximativ 100 de RON în credite pentru acest proiect, și am aflat pe final de el, cam în ultimele 2 luni.

## 5. Integrarea LLM-urilor în Workflow-ul de Dezvoltare

### Strategia de Utilizare

1. **Planificare** - ChatGPT pentru structurarea proiectului
2. **Dezvoltare** - DeepSeek pentru algoritmi complecși
3. **Optimizare** - Google Gemini pentru performanță
4. **Testare** - Claude Code pentru muncă direct în cod

### Beneficii Generale

- **Accelerarea dezvoltării**: Reducerea timpului de implementare cu 60%
- **Boilerplate**: Conectare la baza de date, redux reducers, cod care e identic la fel.

## Concluzie

Utilizarea strategică a diferitelor LLM-uri a permis dezvoltarea eficientă a unui sistem complex de catalog electronic. Fiecare model a contribuit cu punctele sale forte, rezultând într-o aplicație robustă, testată și optimizată.

Combinația ChatGPT + DeepSeek + Google Gemini + Claude Code s-a dovedit a fi ideală pentru:

- Dezvoltarea rapidă a funcționalităților de bază
- Implementarea algoritmilor complecși
- Optimizarea performanței și rezolvarea bug-urilor
- Asigurarea calității prin teste automate comprehensive

Această abordare hibridă demonstrează potențialul LLM-urilor în dezvoltarea software modernă când sunt utilizate strategic și complementar. Am folosit atâtea LLM și pentru că nu am știut de la început de ele, spre exemplu de Google Gemini am aflat când am configurat trimiterea automată de e-mail-uri prin Google Workspace, având Premium, odată cu abonementul de GW. Astfel, consider ca DeepSeek este irelevant, față de Gemini. Claude Code de departe este cel de mai ajutor, scrie direct cod în proiect. ChatGPT, este cel mai bun la dezvoltarea primelor schițe ale aplicației, a infrastructurii.
