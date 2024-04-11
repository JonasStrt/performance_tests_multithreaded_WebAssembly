function sendData(
  executionTime,
  totalJsHeapSize,
  gini,
  threads,
  nodes,
  implementation,
  vis
) {
  const messwert = {
    "Execution time": executionTime,
    "Total Heap Size": totalJsHeapSize,
    "Gini coefficient": gini,
    Threads: threads,
    Nodes: nodes,
    Browser: getBrowserName(),
    Implementation: implementation,
    Visualisation: vis
  };
  console.log(messwert);
  fetch("http://localhost:3000/sendData", {
    method: "POST", // HTTP-Methode
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messwert), // Daten in String umwandeln
  }).catch((error) => console.error("Fehler beim Senden der Daten:", error));
}

function getBrowserName() {
  const userAgent = navigator.userAgent;

  // Überprüfung für verschiedene Browser
  if (userAgent.match(/chrome|chromium|crios/i)) {
    return "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    return "Firefox";
  } else if (userAgent.match(/safari/i)) {
    return "Safari";
  } else if (userAgent.match(/opr\//i)) {
    return "Opera";
  } else if (userAgent.match(/edg/i)) {
    return "Edge";
  } else {
    return "Unknown";
  }
}

export { sendData };
