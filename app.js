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

  if (!nome || !cognome) {
    alert("Compila tutti i campi");
    return;
  }

  try {
    await db.collection("presenze").add({
      nome,
      cognome,
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
    tr.innerHTML = `<td>${d.nome}</td><td>${d.cognome}</td><td>${dataFormattata}</td><td>${oraFormattata}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("tabellaRegistro").style.display = snapshot.empty ? "none" : "table";
}
// ===== Funzione per esportare la tabella in CSV =====
function esportaCSV() {
  const rows = document.querySelectorAll("#tabellaRegistro tr");
  if (rows.length <= 1) {
    alert("Nessun dato da esportare");
    return;
  }

  let csv = [];
  rows.forEach(row => {
    const cols = row.querySelectorAll("th, td");
    const arr = [];
    cols.forEach(col => arr.push('"' + col.innerText + '"'));
    csv.push(arr.join(","));
  });

  const csvString = csv.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registro.csv";
  a.click();
  URL.revokeObjectURL(url);
}