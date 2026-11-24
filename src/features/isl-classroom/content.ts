/**
 * ISL Classroom content. Every sign here is demonstrated by real Deaf ISL signers from the INCLUDE dataset
 * (AI4Bharat, CC BY 4.0). A sign is only taught with camera checking when the trained recogniser's evaluation marked
 * it "supported" (see public/isl-classroom/model.json and docs/isl-classroom/RECOGNITION.md).
 * Text explains written English/Spanish only; nothing here describes or invents how to sign.
 */
export type CourseId = "english" | "spanish";
export interface ClassroomSign {
  id: string;            // lowercase letters only (also used in progress ids)
  label: string;         // recogniser label (INCLUDE folder name without its number)
  en: string; es: string; hi: string;
  note: { en: string; es: string };   // usage note about the written phrase
}

export const SIGNS: ClassroomSign[] = [
  { id: "hello", label: "Hello", en: "Hello", es: "Hola", hi: "नमस्ते", note: { en: "“Hello” works at any time of day, with anyone.", es: "“Hola” sirve a cualquier hora y con cualquier persona." } },
  { id: "goodmorning", label: "Good Morning", en: "Good morning", es: "Buenos días", hi: "सुप्रभात", note: { en: "Use “Good morning” until about midday.", es: "“Buenos días” se usa hasta el mediodía. Fíjate: “días” va en plural." } },
  { id: "goodafternoon", label: "Good afternoon", en: "Good afternoon", es: "Buenas tardes", hi: "शुभ दोपहर", note: { en: "Use “Good afternoon” from midday until early evening.", es: "“Buenas tardes” se usa desde el mediodía hasta que oscurece." } },
  { id: "goodevening", label: "Good evening", en: "Good evening", es: "Buenas noches", hi: "शुभ संध्या", note: { en: "“Good evening” is a greeting when you arrive in the evening.", es: "En español, “buenas noches” sirve para saludar por la noche y también para despedirse." } },
  { id: "goodnight", label: "Good night", en: "Good night", es: "Buenas noches", hi: "शुभ रात्रि", note: { en: "“Good night” is said when leaving or going to sleep, not as a greeting.", es: "“Buenas noches” también se dice al irse a dormir." } },
  { id: "howareyou", label: "How are you", en: "How are you?", es: "¿Cómo estás?", hi: "आप कैसे हैं?", note: { en: "Written English puts “are” before “you” in questions.", es: "En español escrito la pregunta lleva “¿” al principio y “?” al final." } },
  { id: "alright", label: "Alright", en: "I’m alright", es: "Estoy bien", hi: "मैं ठीक हूँ", note: { en: "A common short answer to “How are you?”.", es: "Respuesta común a “¿Cómo estás?”. Usa “estoy” para cómo te sientes." } },
  { id: "thankyou", label: "Thank you", en: "Thank you", es: "Gracias", hi: "धन्यवाद", note: { en: "“Thank you” is polite in every situation.", es: "“Gracias” es siempre correcto; “muchas gracias” es más enfático." } },
  { id: "pleased", label: "Pleased", en: "Pleased to meet you", es: "Encantado / Encantada", hi: "आपसे मिलकर खुशी हुई", note: { en: "Say this when you meet someone for the first time.", es: "“Encantado” si eres hombre, “encantada” si eres mujer." } },
];

/** Lesson order: greetings first, then questions and answers, then politeness. */
export const LESSONS: { id: string; title: { en: string; es: string }; signs: string[] }[] = [
  { id: "greet", title: { en: "Greetings", es: "Saludos" }, signs: ["hello", "goodmorning", "goodafternoon", "goodevening", "goodnight"] },
  { id: "chat", title: { en: "Small talk", es: "Conversación" }, signs: ["howareyou", "alright", "thankyou", "pleased"] },
];

export const signById = (id: string) => SIGNS.find((s) => s.id === id);
export const phrase = (s: ClassroomSign, c: CourseId) => (c === "english" ? s.en : s.es);
/** Progress ids reuse the existing isl_progress format: "<course>:cls:<sign>". */
export const progressId = (c: CourseId, s: string) => `${c}:cls:${s}`;
