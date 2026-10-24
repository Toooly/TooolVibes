import type { EditorialPostRecord } from "@/lib/types/article";

type GuidePreview = Pick<EditorialPostRecord, "title" | "dek" | "highlights">;

// Editorial display copy; article bodies and factual records remain canonical.
const previews: Record<string, GuidePreview & { sourceTitle: string }> = {
  "betterpic": {
    "sourceTitle": "BetterPic: la guida onesta all'headshot AI",
    "title": "BetterPic: ritratti AI per il tuo profilo professionale",
    "dek": "Come preparare le foto, valutare i risultati e capire quando serve ancora un fotografo.",
    "highlights": [
      "Ritratti per LinkedIn, CV e press kit: quali risultati aspettarti.",
      "Come riconoscere i limiti dell’AI prima di scegliere una foto."
    ]
  },
  "frase-ai": {
    "sourceTitle": "Frase: come funziona davvero la piattaforma SEO + content workflow",
    "title": "Frase: dalla ricerca SEO al testo da pubblicare",
    "dek": "Un percorso tra analisi della SERP, brief, scrittura e revisione, con i controlli da mantenere in mano.",
    "highlights": [
      "Come collegare ricerca, brief e revisione nello stesso flusso.",
      "Quando la piattaforma aiuta un team editoriale e dove richiede supervisione."
    ]
  },
  "jenny-ai": {
    "sourceTitle": "Jenni AI: la guida onesta all'assistente di scrittura accademica",
    "title": "Jenni AI: scrivere con le fonti, senza perdere il controllo",
    "dek": "Bozze, citazioni e revisione per tesi e paper: cosa affidare all’assistente e cosa verificare sempre.",
    "highlights": [
      "Come usare l’assistente tra prima bozza e gestione delle fonti.",
      "I controlli necessari su citazioni, accuratezza e regole accademiche."
    ]
  },
  "reclaim-ai": {
    "sourceTitle": "Reclaim AI: come pianificare la settimana senza farla a pezzi",
    "title": "Reclaim AI: più spazio al lavoro che conta",
    "dek": "Come organizzare attività, abitudini e riunioni in calendario, proteggendo il tempo di concentrazione.",
    "highlights": [
      "Come distribuire gli impegni senza riempire ogni spazio libero.",
      "Quando la pianificazione automatica aiuta e quando conviene intervenire."
    ]
  },
  "windsor-ai": {
    "sourceTitle": "Windsor AI: attribuzione marketing e reporting multi-canale",
    "title": "Windsor AI: leggere i risultati del marketing in un unico posto",
    "dek": "Dalle fonti pubblicitarie ai report: come collegare i dati e interpretare l’attribuzione senza perdere il contesto.",
    "highlights": [
      "Come riunire le fonti e costruire report confrontabili.",
      "Cosa può dirti l’attribuzione e quali limiti considerare."
    ]
  },
  "reachifyme": {
    "sourceTitle": "ReachifyMe: come creare un content engine per LinkedIn",
    "title": "ReachifyMe: una routine editoriale per LinkedIn",
    "dek": "Dall’idea al post pubblicato: scrittura, programmazione e analisi per dare continuità ai contenuti.",
    "highlights": [
      "Come passare dalle idee a un calendario di pubblicazione.",
      "Quali passaggi restano editoriali, anche con l’aiuto dell’AI."
    ]
  },
  "flowise-ai": {
    "sourceTitle": "Flowise AI: costruire agenti e flussi RAG senza scrivere codice",
    "title": "Flowise: progettare agenti e flussi AI su un canvas",
    "dek": "Come collegare modelli, dati e strumenti, passando dal prototipo ai controlli necessari per la produzione.",
    "highlights": [
      "Come comporre un flusso e capire il ruolo di ogni nodo.",
      "I compromessi tra facilità di costruzione, controllo e manutenzione."
    ]
  },
  "lemon-squeezy": {
    "sourceTitle": "Lemon Squeezy: merchant of record per SaaS e prodotti digitali",
    "title": "Lemon Squeezy: vendere software e prodotti digitali",
    "dek": "Pagamenti, abbonamenti e gestione fiscale tramite un merchant of record: come funziona e cosa verificare.",
    "highlights": [
      "Come cambia il flusso di vendita con un merchant of record.",
      "Gli aspetti operativi da valutare prima di adottare la piattaforma."
    ]
  },
  "agentxai": {
    "sourceTitle": "AgentX: costruire agenti AI no-code per lead e flussi automatizzati",
    "title": "AgentX: costruire agenti AI senza partire dal codice",
    "dek": "Lead, assistenza e automazioni interne: come valutare un builder no-code e riconoscerne i limiti.",
    "highlights": [
      "Quali attività si prestano a un agente costruito visualmente.",
      "Quando il no-code basta e quando serve uno sviluppo su misura."
    ]
  },
  "omi-app-ai": {
    "sourceTitle": "Omi: il wearable open-source che ascolta, trascrive e ricorda",
    "title": "Omi: dalle conversazioni a una memoria consultabile",
    "dek": "Trascrizioni, riepiloghi e ricerca: cosa offre il dispositivo indossabile e quali limiti contano nell’uso quotidiano.",
    "highlights": [
      "Come ritrovare informazioni tra conversazioni e riepiloghi.",
      "Privacy, autonomia e precisione: i controlli prima dell’uso."
    ]
  },
  "wegic": {
    "sourceTitle": "Wegic: il website team AI per lanciare un sito in pochi minuti",
    "title": "Wegic: creare un sito partendo da una conversazione",
    "dek": "Dalla descrizione alla prima versione: dove aiuta un builder AI e quali progetti richiedono più controllo.",
    "highlights": [
      "Come impostare una richiesta e rifinire il sito generato.",
      "Quando scegliere un builder conversazionale, un CMS o un percorso diverso."
    ]
  },
  "tolt": {
    "sourceTitle": "Tolt: lanciare un programma affiliate per SaaS senza fee iniziali",
    "title": "Tolt: gestire un programma di affiliazione per il tuo SaaS",
    "dek": "Dal tracciamento alle commissioni: come impostare il programma e valutare i passaggi operativi.",
    "highlights": [
      "Come organizzare affiliati, tracciamento e commissioni.",
      "Cosa valutare prima di aggiungere il programma al tuo flusso commerciale."
    ]
  }
};

export function getGuidePreviewCopy(post: EditorialPostRecord): GuidePreview {
  const preview = previews[post.slug];
  return preview?.sourceTitle === post.title ? preview : post;
}

export function getGuidePreviewTitle(slug: string, title: string): string {
  const preview = previews[slug];
  return preview?.sourceTitle === title ? preview.title : title;
}
