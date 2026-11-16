import { buildCourse } from "../types";

/** Starter courses: one reviewed unit each, proving the content pipeline works for other language pairs. */
export const frEn = buildCourse(
  { id: "fr-en", target: "fr", native: "en", title: "French", targetName: "French", nativeName: "English", flag: "🇫🇷", ttsLang: "fr-FR", sttLang: "fr-FR",
    status: "beginner-set", license: "CC BY-SA 4.0 — original Speakara content", review: "Author-written; native-speaker review pending" },
  [{
    id: "fr1", title: "Greetings", objective: "Say hello, be polite and introduce yourself", cefr: "A1", color: "brand",
    tips: [
      { title: "Bonjour first", body: "In French it is polite to open any exchange with bonjour (or bonsoir in the evening) before asking for anything.", examples: [{ t: "Bonjour, un café, s'il vous plaît.", n: "Hello, a coffee, please." }] },
      { title: "Liaison", body: "A silent final consonant is pronounced when the next word starts with a vowel: vous‿êtes sounds like vou-zêtes, les‿amis like lé-zamis.", examples: [{ t: "Vous êtes Paul ?", n: "Are you Paul?" }] },
      { title: "Tu and vous", body: "Use tu with friends and children, vous with strangers and to show respect.", examples: [{ t: "Comment vas-tu ?", n: "How are you? (informal)" }, { t: "Comment allez-vous ?", n: "How are you? (formal)" }] },
    ],
    lessons: [
      { title: "Hello and thanks", words: [["bonjour", "hello"], ["au revoir", "goodbye"], ["merci", "thank you"], ["s'il vous plaît", "please"], ["oui", "yes"], ["non", "no"]],
        sentences: [["Bonjour, madame.", "Hello, madam.", ["Hello, ma'am.", "Good morning, madam."]], ["Au revoir, merci.", "Goodbye, thank you.", ["Goodbye, thanks."]], ["Oui, s'il vous plaît.", "Yes, please."], ["Non, merci.", "No, thank you.", ["No, thanks."]]] },
      { title: "Your name", words: [["je", "I"], ["je m'appelle", "my name is"], ["je suis", "I am"], ["et", "and"], ["bonsoir", "good evening"], ["enchanté", "nice to meet you"]],
        sentences: [["Je m'appelle Léa.", "My name is Léa.", ["My name is Lea.", "I am called Léa."]], ["Je suis Paul.", "I am Paul.", ["I'm Paul."]], ["Bonsoir, je suis Léa.", "Good evening, I am Léa.", ["Good evening, I am Lea."]], ["Enchanté, Paul.", "Nice to meet you, Paul."]] },
      { title: "How are you?", words: [["comment", "how"], ["ça va", "it's going, fine"], ["très bien", "very well"], ["vous", "you (formal)"], ["toi", "you (informal)"], ["je vais", "I am going, I am"]],
        sentences: [["Comment allez-vous ?", "How are you? (formal)", ["How are you?"]], ["Ça va bien, merci.", "I'm fine, thank you.", ["It's going well, thanks."]], ["Très bien, merci. Et toi ?", "Very well, thanks. And you?", ["Very good, thanks. And you?"]], ["Je vais très bien.", "I am doing very well.", ["I'm very well."]]] },
    ],
  }, {
    id: "fr2", title: "Au café", objective: "Order drinks and food and ask for the bill", cefr: "A1", color: "sun",
    tips: [
      { title: "Gender and articles", body: "French nouns are masculine (le, un) or feminine (la, une). Learn each noun with its article: le café, la limonade. Before a vowel, le and la become l'.", examples: [{ t: "Le café est chaud.", n: "The coffee is hot." }, { t: "L'eau est fraîche.", n: "The water is cool." }] },
      { title: "Je voudrais is polite", body: "Je voudrais (I would like) is more polite than je veux (I want). Use de l'eau, du pain and du lait for 'some' water, bread and milk.", examples: [{ t: "Je voudrais un café, s'il vous plaît.", n: "I would like a coffee, please." }, { t: "Je veux de l'eau.", n: "I want some water." }] },
    ],
    lessons: [
      { title: "Commander", words: [["un café", "a coffee"], ["un thé", "a tea"], ["de l'eau", "some water"], ["du lait", "some milk"], ["du pain", "some bread"], ["je voudrais", "I would like"]],
        sentences: [["Je voudrais un café, s'il vous plaît.", "I would like a coffee, please."], ["Un thé, merci.", "A tea, thanks.", ["A tea, thank you."]], ["Le café est chaud.", "The coffee is hot."], ["Le lait est froid.", "The milk is cold.", ["The milk is cool."]]] },
      { title: "Manger", words: [["la soupe", "soup"], ["le fromage", "cheese"], ["bon", "good"], ["délicieux", "delicious"], ["j'ai faim", "I am hungry"], ["j'ai soif", "I am thirsty"]],
        sentences: [["J'ai faim.", "I am hungry."], ["J'ai soif.", "I am thirsty."], ["La soupe est délicieuse.", "The soup is delicious."], ["Le fromage est bon.", "The cheese is good.", ["The cheese is nice."]]] },
      { title: "L'addition", words: [["l'addition", "the bill"], ["les toilettes", "the toilets"], ["où", "where"], ["payer", "to pay"], ["excusez-moi", "excuse me"], ["voici", "here is"]],
        sentences: [["Excusez-moi, où sont les toilettes ?", "Excuse me, where are the toilets?", ["Excuse me, where is the toilet?"]], ["L'addition, s'il vous plaît.", "The bill, please."], ["Je voudrais payer.", "I would like to pay."], ["Voici votre café.", "Here is your coffee.", ["Here's your coffee."]]] },
    ],
    story: { id: "fr2-story", title: "Au café", summary: "Léa orders tea and asks where the toilets are.",
      lines: [
        { speaker: "Léa", t: "Bonjour ! Je voudrais un thé, s'il vous plaît.", n: "Hello! I would like a tea, please." },
        { speaker: "Serveur", t: "Bien sûr. Voici le thé. Vous voulez du gâteau ?", n: "Of course. Here is the tea. Do you want some cake?" },
        { speaker: "Léa", t: "Non, merci. Où sont les toilettes ?", n: "No, thanks. Where are the toilets?" },
        { speaker: "Serveur", t: "Au fond, à gauche.", n: "At the back, on the left." },
      ],
      questions: [
        { afterLine: 1, prompt: "What does the waiter ask?", options: ["Whether she wants some cake", "Her name", "Her address"], answer: 0 },
        { afterLine: 3, prompt: "Where are the toilets?", options: ["At the back, on the left", "Upstairs", "Outside"], answer: 0 },
      ] },
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
