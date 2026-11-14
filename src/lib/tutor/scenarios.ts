import type { LangCode } from "../content/types";

export interface ScriptStep { say: [string, string]; expect: string[]; sample: [string, string] }
export interface Scenario { id: string; title: string; emoji: string; description: string; role: string; script?: Partial<Record<LangCode, ScriptStep[]>> }

/** Scenario templates are configuration. `script` is the deterministic fallback used when no AI provider is configured. */
export const SCENARIOS: Scenario[] = [
  { id: "meet", title: "Meeting new people", emoji: "👋", description: "Introduce yourself and ask simple questions.", role: "a friendly person the learner has just met at a language exchange",
    script: {
      es: [
        { say: ["¡Hola! ¿Cómo te llamas?", "Hello! What is your name?"], expect: ["me llamo", "soy", "mi nombre"], sample: ["Me llamo Sam.", "My name is Sam."] },
        { say: ["Mucho gusto. ¿Cómo estás?", "Nice to meet you. How are you?"], expect: ["bien", "mal", "estoy", "feliz"], sample: ["Estoy bien, gracias.", "I am fine, thank you."] },
        { say: ["¿Tienes hermanos?", "Do you have siblings?"], expect: ["tengo", "si", "no", "hermano", "hermana"], sample: ["Sí, tengo una hermana.", "Yes, I have a sister."] },
        { say: ["¡Qué bien! Hasta luego.", "How nice! See you later."], expect: ["adios", "hasta", "luego", "manana"], sample: ["¡Hasta luego!", "See you later!"] },
      ],
      fr: [
        { say: ["Bonjour ! Comment tu t'appelles ?", "Hello! What is your name?"], expect: ["je m'appelle", "je suis", "appelle"], sample: ["Je m'appelle Sam.", "My name is Sam."] },
        { say: ["Enchanté ! Ça va ?", "Nice to meet you! How are you?"], expect: ["ca va", "bien", "oui", "merci"], sample: ["Ça va bien, merci.", "I am fine, thank you."] },
        { say: ["Super. Au revoir !", "Great. Goodbye!"], expect: ["au revoir", "salut", "bientot"], sample: ["Au revoir !", "Goodbye!"] },
      ],
      en: [
        { say: ["Hello! What is your name?", "¡Hola! ¿Cómo te llamas? / नमस्ते! आपका नाम क्या है?"], expect: ["my name is", "i am", "i'm"], sample: ["My name is Sam.", "Me llamo Sam. / मेरा नाम सैम है।"] },
        { say: ["Nice to meet you. How are you?", "Mucho gusto. ¿Cómo estás? / आप कैसे हैं?"], expect: ["fine", "good", "well", "i am"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Great! Goodbye!", "¡Genial! ¡Adiós! / बहुत अच्छा! अलविदा!"], expect: ["goodbye", "bye", "see you"], sample: ["Goodbye!", "¡Adiós! / अलविदा!"] },
      ],
    } },
  { id: "restaurant", title: "Restaurant", emoji: "🍽️", description: "Get a table, order food and ask for the check.", role: "a patient waiter in a casual restaurant",
    script: {
      es: [
        { say: ["Buenas noches. ¿Una mesa para dos?", "Good evening. A table for two?"], expect: ["si", "mesa", "por favor", "para"], sample: ["Sí, una mesa para dos, por favor.", "Yes, a table for two, please."] },
        { say: ["Muy bien. ¿Qué quiere comer?", "Very good. What do you want to eat?"], expect: ["quiero", "pollo", "arroz", "ensalada", "pan"], sample: ["Quiero pollo con arroz.", "I want chicken with rice."] },
        { say: ["¿Y para beber?", "And to drink?"], expect: ["agua", "cafe", "te", "leche", "quiero"], sample: ["Quiero agua, por favor.", "I want water, please."] },
        { say: ["Aquí tiene. ¿Algo más?", "Here you are. Anything else?"], expect: ["cuenta", "no", "gracias"], sample: ["La cuenta, por favor.", "The check, please."] },
      ],
      fr: [
        { say: ["Bonsoir ! Vous désirez ?", "Good evening! What would you like?"], expect: ["cafe", "s'il vous plait", "je voudrais", "un"], sample: ["Un café, s'il vous plaît.", "A coffee, please."] },
        { say: ["Voilà. Autre chose ?", "Here you are. Anything else?"], expect: ["non", "merci", "oui"], sample: ["Non, merci.", "No, thank you."] },
      ],
      en: [
        { say: ["Good evening. A table for two?", "Buenas noches. ¿Una mesa para dos? / दो लोगों के लिए टेबल?"], expect: ["yes", "please", "table"], sample: ["Yes, please.", "Sí, por favor. / हाँ, कृपया।"] },
        { say: ["What would you like to drink?", "¿Qué quiere beber? / आप क्या पीना चाहेंगे?"], expect: ["water", "coffee", "tea", "please"], sample: ["Water, please.", "Agua, por favor. / पानी, कृपया।"] },
        { say: ["Here you are. Anything else?", "Aquí tiene. ¿Algo más? / और कुछ?"], expect: ["no", "thank", "check", "bill"], sample: ["No, thank you.", "No, gracias. / नहीं, धन्यवाद।"] },
      ],
    } },
  { id: "everyday", title: "Everyday conversation", emoji: "☀️", description: "Small talk about your day, family and food.", role: "a neighbour making friendly small talk",
    script: {
      es: [
        { say: ["¡Buenos días! ¿Cómo estás?", "Good morning! How are you?"], expect: ["bien", "estoy", "gracias"], sample: ["Muy bien, gracias. ¿Y tú?", "Very well, thank you. And you?"] },
        { say: ["Bien, gracias. ¿Qué comes en el desayuno?", "Fine, thanks. What do you eat for breakfast?"], expect: ["como", "pan", "cafe", "leche", "manzana", "bebo"], sample: ["Como pan y bebo café.", "I eat bread and drink coffee."] },
        { say: ["¡Delicioso! Hasta mañana.", "Delicious! See you tomorrow."], expect: ["hasta", "adios", "manana"], sample: ["¡Hasta mañana!", "See you tomorrow!"] },
      ],
    } },
  { id: "shopping", title: "Shopping", emoji: "🛍️", description: "Ask for prices, sizes and colours.", role: "a helpful shop assistant" },
  { id: "airport", title: "Airport", emoji: "✈️", description: "Check in, find your gate and handle delays.", role: "an airline check-in agent" },
  { id: "hotel", title: "Hotel", emoji: "🏨", description: "Check in, ask about breakfast and fix a problem.", role: "a hotel receptionist" },
  { id: "interview", title: "Job interview", emoji: "💼", description: "Talk about your experience and strengths.", role: "a kind interviewer for an entry-level job" },
  { id: "university", title: "University", emoji: "🎓", description: "Meet classmates and talk about your studies.", role: "a fellow student on the first day of class" },
  { id: "travel", title: "Travel", emoji: "🧭", description: "Ask for directions and buy tickets.", role: "a local helping a lost traveller" },
];
export const getScenario = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
export const hasScript = (s: Scenario, target: LangCode) => !!s.script?.[target]?.length;
