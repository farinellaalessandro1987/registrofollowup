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


