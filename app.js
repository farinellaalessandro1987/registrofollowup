const firebaseConfig = {
  apiKey: "AIzaSyDNtWNGKQQFKA9N07gw9ICFw7OY053D1Qs",
  authDomain: "registro-lezione.firebaseapp.com",
  projectId: "registro-lezione"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== Funzione per registrare presenza =====
async function salvaPresenza() {
  const nome = document.getElementById("nome").value.trim();
  const cognome = document.getElementById("cognome").value.trim();
  const gruppo = document.getElementById("gruppo").value;

  if (!nome || !cognome || !gruppo) {
  alert("Compila tutti i campi");
  return;
  }

  try {
  await db.collection("presenze").add({
  nome,
  cognome,
  gruppo,
  data: firebase.firestore.Timestamp.fromDate(new Date()),
  dataStr: new Date().toISOString().split("T")[0]
});

    alert("Presenza registrata");

    document.getElementById("nome").value = "";
    document.getElementById("cognome").value = "";
  } catch (err) {
    console.error("Errore registrazione:", err);
    alert("Errore registrazione. Controlla console.");
  }
}

// ===== Funzione per mostrare il registro di un giorno =====
async function mostraRegistro() {
  const data = document.getElementById("dataRegistro").value;
  if (!data) {
    alert("Seleziona una data");
    return;
  }

  const snapshot = await db.collection("presenze")
    .where("dataStr", "==", data)
    .get();

  const tbody = document.querySelector("#tabellaRegistro tbody");
  tbody.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    const dateObj = d.data.toDate ? d.data.toDate() : new Date(d.data);
    const dataFormattata = dateObj.toLocaleDateString(); // gg/mm/aaaa
    const oraFormattata = dateObj.toLocaleTimeString();  // hh:mm:ss
    const tr = document.createElement("tr");

if (d.gruppo === "gruppo 9-12") {
  tr.style.backgroundColor = "#d6f5d6"; // verde chiaro
}
if (d.gruppo === "gruppo 13-20") {
  tr.style.backgroundColor = "#d6ecff"; // azzurro chiaro
}
    tr.innerHTML = `<td>${d.nome}</td><td>${d.cognome}</td><td>${d.gruppo}</td><td>${dataFormattata}</td><td>${oraFormattata}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("tabellaRegistro").style.display = snapshot.empty ? "none" : "table";
}
// ===== Funzione per esportare la tabella in CSV =====
async function esportaCSV() {
  try {
    const snapshot = await db.collection("presenze").get();

    if (snapshot.empty) {
      alert("Nessun dato da esportare");
      return;
    }

    let csv = [];
    // Intestazione
    csv.push('"Nome","Cognome","Gruppo","Data","Ora"');

    snapshot.forEach(doc => {
      const d = doc.data();
      const dateObj = d.data.toDate ? d.data.toDate() : new Date(d.data);
      const dataFormattata = dateObj.toLocaleDateString();
      const oraFormattata = dateObj.toLocaleTimeString();
      csv.push(`"${d.nome}","${d.cognome}","${d.gruppo}","${dataFormattata}","${oraFormattata}"`);
    });

    const csvString = csv.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registro_completo.csv";
    a.click();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Errore esportazione CSV:", err);
    alert("Errore esportazione CSV. Controlla console.");
  }
}
// ===== Funzione per esportare in Excel con Password e Gruppi =====
async function esportaExcelPerGruppi() {
  // 1. Chiedi la password (cambia "laTuaPassword123" con quella che preferisci)
  const passwordInserita = prompt("Inserisci la password per scaricare il file Excel:");
  
  if (passwordInserita === null) {
    return; // L'utente ha cliccato su Annulla
  }

  const passwordSegreta = "laTuaPassword123"; 

  if (passwordInserita !== passwordSegreta) {
    alert("Password errata! Accesso negato.");
    return;
  }

  // 2. Verifica che la libreria XLSX sia presente
  if (typeof XLSX === 'undefined') {
    alert("Errore: La libreria Excel non è caricata!");
    return;
  }

  try {
    const snapshot = await db.collection("presenze").get();

    if (snapshot.empty) {
      alert("Nessun dato presente nel database da esportare.");
      return;
    }

    let datiPerGruppo = {};

    snapshot.forEach(doc => {
      const d = doc.data();
      let dataFormattata = "Data non valida";
      let oraFormattata = "";
      
      if (d.data) {
        const dateObj = d.data.toDate ? d.data.toDate() : new Date(d.data);
        if (!isNaN(dateObj)) {
          dataFormattata = dateObj.toLocaleDateString();
          oraFormattata = dateObj.toLocaleTimeString();
        }
      }

      let gruppoNome = d.gruppo ? d.gruppo.trim() : "Senza Gruppo";

      if (!datiPerGruppo[gruppoNome]) {
        datiPerGruppo[gruppoNome] = [
          ["Nome", "Cognome", "Gruppo", "Data", "Ora"]
        ];
      }

      datiPerGruppo[gruppoNome].push([
        d.nome || "", 
        d.cognome || "", 
        d.gruppo || "", 
        dataFormattata, 
        oraFormattata
      ]);
    });

    let wb = XLSX.utils.book_new();

    for (let gruppo in datiPerGruppo) {
      let ws = XLSX.utils.aoa_to_sheet(datiPerGruppo[gruppo]);
      let nomeFoglioSafe = gruppo.substring(0, 31).replace(/[:\\\/?*\[\]]/g, "_");
      XLSX.utils.book_append_sheet(wb, ws, nomeFoglioSafe);
    }

    XLSX.writeFile(wb, "registro_presenze_per_gruppi.xlsx");
    alert("File Excel scaricato con successo!");

  } catch (err) {
    console.error("Errore esportazione Excel:", err);
    alert("Errore durante l'esportazione. Controlla la console.");
  }
}


