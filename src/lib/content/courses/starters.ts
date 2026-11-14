import { buildCourse } from "../types";

/** Starter courses: one reviewed unit each, proving the content pipeline works for other language pairs. */
export const frEn = buildCourse(
  { id: "fr-en", target: "fr", native: "en", title: "French", targetName: "French", nativeName: "English", flag: "🇫🇷", ttsLang: "fr-FR", sttLang: "fr-FR",
    status: "starter", license: "CC BY-SA 4.0 — original Speakara content", review: "Author-reviewed; native-speaker review pending" },
  [{
    id: "fr1", title: "Greetings", objective: "Say hello, be polite and introduce yourself", cefr: "A1", color: "brand",
    tips: [
      { title: "Bonjour first", body: "In French it is polite to open any exchange with bonjour (or bonsoir in the evening) before asking for anything.", examples: [{ t: "Bonjour, un café, s'il vous plaît.", n: "Hello, a coffee, please." }] },
      { title: "Tu and vous", body: "Use tu with friends and children, vous with strangers and to show respect.", examples: [{ t: "Comment vas-tu ?", n: "How are you? (informal)" }, { t: "Comment allez-vous ?", n: "How are you? (formal)" }] },
    ],
    lessons: [
      { title: "Hello and thanks", words: [["bonjour", "hello"], ["au revoir", "goodbye"], ["merci", "thank you"], ["s'il vous plaît", "please"], ["oui", "yes"], ["non", "no"]],
        sentences: [["Bonjour, madame.", "Hello, madam.", ["Hello, ma'am.", "Good morning, madam."]], ["Au revoir, merci.", "Goodbye, thank you.", ["Goodbye, thanks."]], ["Oui, s'il vous plaît.", "Yes, please."], ["Non, merci.", "No, thank you.", ["No, thanks."]]] },
      { title: "Your name", words: [["je", "I"], ["je m'appelle", "my name is"], ["je suis", "I am"], ["et", "and"], ["bonsoir", "good evening"], ["enchanté", "nice to meet you"]],
        sentences: [["Je m'appelle Léa.", "My name is Léa.", ["My name is Lea.", "I am called Léa."]], ["Je suis Paul.", "I am Paul.", ["I'm Paul."]], ["Bonsoir, je suis Léa.", "Good evening, I am Léa.", ["Good evening, I am Lea."]], ["Enchanté, Paul.", "Nice to meet you, Paul."]] },
    ],
  }],
);

export const enEs = buildCourse(
  { id: "en-es", target: "en", native: "es", title: "Inglés", targetName: "English", nativeName: "Spanish", flag: "🇬🇧", ttsLang: "en-US", sttLang: "en-US",
    status: "starter", license: "CC BY-SA 4.0 — original Speakara content", review: "Author-reviewed; native-speaker review pending" },
  [{
    id: "ene1", title: "Saludos", objective: "Saluda, da las gracias y preséntate", cefr: "A1", color: "brand",
    tips: [
      { title: "El sujeto es obligatorio", body: "En inglés siempre se dice el sujeto: “I am Ana”, nunca solo “am Ana”.", examples: [{ t: "I am Ana.", n: "Soy Ana." }] },
      { title: "I siempre en mayúscula", body: "El pronombre I (yo) se escribe siempre con mayúscula.", examples: [{ t: "My name is Luis and I am happy.", n: "Me llamo Luis y estoy feliz." }] },
    ],
    lessons: [
      { title: "Hola y gracias", words: [["hello", "hola"], ["goodbye", "adiós"], ["thank you", "gracias"], ["please", "por favor"], ["yes", "sí"], ["no", "no"]],
        sentences: [["Hello, good morning.", "Hola, buenos días."], ["Goodbye, thank you.", "Adiós, gracias."], ["Yes, please.", "Sí, por favor."], ["No, thank you.", "No, gracias."]] },
      { title: "Tu nombre", words: [["I", "yo"], ["you", "tú"], ["my name is", "me llamo"], ["I am", "soy"], ["and", "y"], ["how", "cómo"]],
        sentences: [["My name is Ana.", "Me llamo Ana.", ["Mi nombre es Ana."]], ["I am Luis.", "Soy Luis.", ["Yo soy Luis."]], ["How are you?", "¿Cómo estás?"], ["I am fine, thank you.", "Estoy bien, gracias."]] },
    ],
  }],
);

export const enHi = buildCourse(
  { id: "en-hi", target: "en", native: "hi", title: "अंग्रेज़ी", targetName: "English", nativeName: "Hindi", flag: "🇬🇧", ttsLang: "en-IN", sttLang: "en-IN",
    status: "starter", license: "CC BY-SA 4.0 — original Speakara content", review: "Needs native Hindi review before promotion beyond starter status" },
  [{
    id: "enh1", title: "अभिवादन", objective: "नमस्ते कहना, धन्यवाद देना और अपना परिचय देना", cefr: "A1", color: "brand",
    tips: [
      { title: "क्रिया बीच में आती है", body: "अंग्रेज़ी में वाक्य का क्रम कर्ता + क्रिया + बाकी होता है: “I am Ravi”.", examples: [{ t: "My name is Ravi.", n: "मेरा नाम रवि है।" }] },
    ],
    lessons: [
      { title: "नमस्ते और धन्यवाद", words: [["hello", "नमस्ते"], ["thank you", "धन्यवाद"], ["please", "कृपया"], ["yes", "हाँ"], ["no", "नहीं"], ["water", "पानी"]],
        sentences: [["Hello, good morning.", "नमस्ते, सुप्रभात।"], ["Thank you.", "धन्यवाद।"], ["Yes, please.", "हाँ, कृपया।"], ["Water, please.", "पानी, कृपया।"]] },
      { title: "आपका नाम", words: [["I", "मैं"], ["you", "आप"], ["my name is", "मेरा नाम है"], ["how", "कैसे"], ["fine", "ठीक"], ["friend", "दोस्त"]],
        sentences: [["My name is Ravi.", "मेरा नाम रवि है।"], ["How are you?", "आप कैसे हैं?", ["तुम कैसे हो?"]], ["I am fine.", "मैं ठीक हूँ।"], ["You are my friend.", "आप मेरे दोस्त हैं।", ["तुम मेरे दोस्त हो।"]]] },
    ],
  }],
);
