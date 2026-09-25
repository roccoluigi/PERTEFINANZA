// Dati statici PERTEFINANZA

const ISSUERS_DATA = [
  {
    name: "Barclays",
    country: "Regno Unito",
    ratingSP: "A+",
    ratingMoodys: "A1",
    ratingFitch: "A+",
    ratings: { "S&P": "A+", "Moody's": "A1", Fitch: "A+" },
    marketShare: "Grande banca britannica globale",
    website: "https://certificati.barclays.com/it/",
    description: "Gruppo bancario britannico globale attivo nell'emissione di certificati d'investimento."
  },
  {
    name: "BNP Paribas",
    country: "Francia",
    ratingSP: "A+",
    ratingMoodys: "Aa3",
    ratingFitch: "AA-",
    ratings: { "S&P": "A+", "Moody's": "Aa3", Fitch: "AA-" },
    marketShare: "Grande banca europea internazionale",
    website: "https://investimenti.bnpparibas.it/",
    description: "Tra i principali emittenti bancari a livello globale, offre un'ampia gamma di certificati d'investimento."
  },
  {
    name: "Citigroup",
    country: "Stati Uniti",
    ratingSP: "A+",
    ratingMoodys: "Aa3",
    ratingFitch: "A+",
    ratings: { "S&P": "A+", "Moody's": "Aa3", Fitch: "A+" },
    marketShare: "Colosso bancario americano",
    website: "https://it.citifirst.com/",
    description: "Gruppo bancario americano attivo su strutture Cash Collect e panieri internazionali."
  },
  {
    name: "EFG International",
    country: "Svizzera",
    ratingSP: "A",
    ratingMoodys: "A1",
    ratingFitch: "A",
    ratings: { "S&P": "A", "Moody's": "A1", Fitch: "A" },
    marketShare: "Private banking svizzero",
    website: "https://www.efginternational.com/",
    description: "Gruppo svizzero di private banking e wealth management attivo nei prodotti strutturati."
  },
  {
    name: "Goldman Sachs",
    country: "Stati Uniti",
    ratingSP: "A+",
    ratingMoodys: "A1",
    ratingFitch: "A+",
    ratings: { "S&P": "A+", "Moody's": "A1", Fitch: "A+" },
    marketShare: "Wall Street e investment banking",
    website: "https://www.goldmansachs.it/",
    description: "Investment bank globale attiva in certificati Express, Phoenix e soluzioni a capitale protetto."
  },
  {
    name: "Intesa Sanpaolo",
    country: "Italia",
    ratingSP: "BBB+",
    ratingMoodys: "Baa1",
    ratingFitch: "BBB+",
    ratings: { "S&P": "BBB+", "Moody's": "Baa1", Fitch: "BBB+" },
    marketShare: "La grande banca italiana",
    website: "https://www.intesasanpaolo.prodottiequotazioni.com/",
    description: "Primo gruppo bancario italiano, attivo in certificati a capitale protetto e Cash Collect."
  },
  {
    name: "Leonteq Securities",
    country: "Svizzera",
    ratingSP: "Non rated",
    ratingMoodys: "Non rated",
    ratingFitch: "BBB",
    ratings: { Fitch: "BBB" },
    marketShare: "Fintech svizzera dei prodotti strutturati",
    website: "https://it.leonteq.com/",
    description: "Specialista fintech svizzero per l'emissione di prodotti strutturati e certificati."
  },
  {
    name: "Marex Financial",
    country: "Regno Unito",
    ratingSP: "BBB-",
    ratingMoodys: "Non rated",
    ratingFitch: "BBB",
    ratings: { "S&P": "BBB-", Fitch: "BBB" },
    marketShare: "Broker globale dei mercati",
    website: "https://certificati.marex.com/it/",
    description: "Piattaforma globale di servizi finanziari e market making attiva nei certificati."
  },
  {
    name: "Morgan Stanley",
    country: "Stati Uniti",
    ratingSP: "A+",
    ratingMoodys: "A1",
    ratingFitch: "A+",
    ratings: { "S&P": "A+", "Moody's": "A1", Fitch: "A+" },
    marketShare: "Investment banking globale",
    website: "https://etp.morganstanley.com/it/",
    description: "Investment bank globale attiva in certificati Phoenix e strutture autocallable."
  },
  {
    name: "Société Générale",
    country: "Francia",
    ratingSP: "A-",
    ratingMoodys: "A1",
    ratingFitch: "A",
    ratings: { "S&P": "A-", "Moody's": "A1", Fitch: "A" },
    marketShare: "Banca francese dell'innovazione finanziaria",
    website: "https://prodotti.societegenerale.it/",
    description: "Pioniere europeo dei certificati e derivati cartolarizzati."
  },
  {
    name: "UBS",
    country: "Svizzera",
    ratingSP: "A+",
    ratingMoodys: "Aa3",
    ratingFitch: "A+",
    ratings: { "S&P": "A+", "Moody's": "Aa3", Fitch: "A+" },
    marketShare: "Private banking svizzero globale",
    website: "https://keyinvest-it.ubs.com/",
    description: "Leader globale nel wealth management e nei prodotti strutturati."
  },
  {
    name: "UniCredit",
    country: "Italia",
    ratingSP: "BBB+",
    ratingMoodys: "Baa1",
    ratingFitch: "BBB+",
    ratings: { "S&P": "BBB+", "Moody's": "Baa1", Fitch: "BBB+" },
    marketShare: "Banca italiana paneuropea",
    website: "https://www.investimenti.unicredit.it/",
    description: "Gruppo bancario paneuropeo attivo in Cash Collect, Top Bonus, Airbag e Turbo."
  },
  {
    name: "Vontobel",
    country: "Svizzera",
    ratingSP: "A",
    ratingMoodys: "A2",
    ratingFitch: "A+",
    ratings: { "S&P": "A", "Moody's": "A2", Fitch: "A+" },
    marketShare: "Specialista svizzero di certificati e leva",
    website: "https://certificati.vontobel.com/IT/IT/Home",
    description: "Casa di investimento svizzera specializzata in certificati Memory, Fast Autocall e prodotti a leva."
  },
  {
    name: "Natixis",
    country: "Francia",
    ratingSP: "A",
    ratingMoodys: "A1",
    ratingFitch: "A+",
    ratings: { "S&P": "A", "Moody's": "A1", Fitch: "A+" },
    marketShare: "Investment banking francese",
    website: "https://www.natixis.com/",
    description: "Gruppo BPCE specializzato in ingegneria finanziaria e prodotti strutturati."
  },
  {
    name: "BBVA",
    country: "Spagna",
    ratingSP: "A",
    ratingMoodys: "A2",
    ratingFitch: "A-",
    ratings: { "S&P": "A", "Moody's": "A2", Fitch: "A-" },
    marketShare: "Grande gruppo bancario spagnolo",
    website: "https://www.bbva.com/",
    description: "Gruppo bancario spagnolo multinazionale attivo in Phoenix e Cash Collect."
  },
  {
    name: "Banco Santander",
    country: "Spagna",
    ratingSP: "A",
    ratingMoodys: "A2",
    ratingFitch: "A",
    ratings: { "S&P": "A", "Moody's": "A2", Fitch: "A" },
    marketShare: "Grande banca spagnola globale",
    website: "https://www.santander.com/",
    description: "Grande istituzione finanziaria internazionale attiva in prodotti strutturati."
  },
  {
    name: "Banque Internationale à Luxembourg (BIL)",
    country: "Lussemburgo",
    ratingSP: "A-",
    ratingMoodys: "A2",
    ratingFitch: "BBB+",
    ratings: { "S&P": "A-", "Moody's": "A2", Fitch: "BBB+" },
    marketShare: "Private banking lussemburghese",
    website: "https://www.bil.com/",
    description: "Storico istituto lussemburghese attivo in prodotti strutturati e note d'investimento."
  },
  {
    name: "Otala Market",
    country: "Internazionale",
    ratingSP: "Non rated",
    ratingMoodys: "Non rated",
    ratingFitch: "Non rated",
    ratings: { Profilo: "Specialized Vehicle", Mercato: "EuroTLX / MTF" },
    marketShare: "Piattaforma specializzata in strutturati",
    website: "https://www.otalamarket.com/",
    description: "Piattaforma e veicolo di emissione per prodotti cartolarizzati e note d'investimento speciali."
  }
];
