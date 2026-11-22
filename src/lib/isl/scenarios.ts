/**
 * Real-world scenarios for English through ISL and Spanish through ISL.
 *
 * Each scenario is a short branching conversation: the other person writes a line, the learner chooses a reply, and
 * the teacher reacts. Dialogue is written target-language text with meanings. Words that have a sign in the course
 * vocabulary carry its sign id, so a reviewed clip can be shown; nothing here invents a sign.
 */
import type { IslCourseId } from "./courses";

export type SceneIcon = "handshake" | "user" | "utensils" | "shopping" | "plane" | "train" | "school" | "users";
export interface Choice { text: string; meaning: string; ok: boolean; feedback: string }
export interface Turn { partner: { text: string; meaning: string }; choices: Choice[] }
export interface Scenario { id: string; icon: SceneIcon; title: string; place: string; intro: string; vocab: { text: string; meaning: string; sign?: string }[]; turns: Turn[] }

const c = (text: string, meaning: string, ok: boolean, feedback: string): Choice => ({ text, meaning, ok, feedback });
const turn = (text: string, meaning: string, ...choices: Choice[]): Turn => ({ partner: { text, meaning }, choices });

const META: { id: string; icon: SceneIcon; title: string; place: string; intro: string }[] = [
  { id: "meeting", icon: "handshake", title: /*i18n*/ "Meeting someone new", place: /*i18n*/ "A community event", intro: /*i18n*/ "You meet someone for the first time. Greet them and be friendly." },
  { id: "intro", icon: "user", title: /*i18n*/ "Introducing yourself", place: /*i18n*/ "A workshop", intro: /*i18n*/ "Tell a new classmate your name and where you are from." },
  { id: "restaurant", icon: "utensils", title: /*i18n*/ "At a restaurant", place: /*i18n*/ "A café", intro: /*i18n*/ "Order food and drink politely, then ask for the bill." },
  { id: "shopping", icon: "shopping", title: /*i18n*/ "Shopping", place: /*i18n*/ "A market stall", intro: /*i18n*/ "Ask for something, check the price and pay." },
  { id: "airport", icon: "plane", title: /*i18n*/ "At the airport", place: /*i18n*/ "The check-in desk", intro: /*i18n*/ "Check in for your flight and find your gate." },
  { id: "travel", icon: "train", title: /*i18n*/ "Travelling", place: /*i18n*/ "A train station", intro: /*i18n*/ "Buy a ticket and ask where your platform is." },
  { id: "college", icon: "school", title: /*i18n*/ "At college", place: /*i18n*/ "The college office", intro: /*i18n*/ "Find your classroom and ask about your timetable." },
  { id: "friends", icon: "users", title: /*i18n*/ "Meeting new friends", place: /*i18n*/ "The college canteen", intro: /*i18n*/ "Chat with new friends and make a plan together." },
];

type Body = Pick<Scenario, "vocab" | "turns">;
const EN: Record<string, Body> = {
  meeting: { vocab: [{ text: "hello", meaning: "a greeting", sign: "HELLO" }, { text: "nice to meet you", meaning: "said when you meet someone new" }, { text: "how are you?", meaning: "asking about someone’s day" }],
    turns: [
      turn("Hello! I don’t think we’ve met.", "They greet you.", c("Hello! Nice to meet you.", "A friendly greeting.", true, /*i18n*/ "Perfect: friendly and polite."), c("Goodbye.", "Said when leaving.", false, /*i18n*/ "“Goodbye” is for leaving. Try a greeting.")),
      turn("How are you?", "They ask how you are.", c("I’m fine, thank you. And you?", "You answer and ask back.", true, /*i18n*/ "Great: you answered and asked back."), c("I am a table.", "Not a sensible answer.", false, /*i18n*/ "That doesn’t answer the question. Say how you feel."), c("Yes.", "Doesn’t answer “how”.", false, /*i18n*/ "“How” questions need more than yes or no.")),
      turn("I’m well, thanks. See you later!", "They say goodbye.", c("See you later!", "A friendly goodbye.", true, /*i18n*/ "Nice ending to the conversation."), c("Good morning!", "A greeting, not a goodbye.", false, /*i18n*/ "That’s a greeting. They are leaving.")),
    ] },
  intro: { vocab: [{ text: "name", meaning: "what people call you", sign: "NAME" }, { text: "I am from …", meaning: "where you live or were born" }, { text: "student", meaning: "a person who studies" }],
    turns: [
      turn("Hi, I’m Meera. What’s your name?", "Meera asks your name.", c("My name is Ravi.", "You tell your name.", true, /*i18n*/ "Correct: “My name is …”."), c("My name Ravi.", "Missing a word.", false, /*i18n*/ "English needs “is”: “My name is Ravi.”")),
      turn("Where are you from?", "She asks where you are from.", c("I am from Pune.", "You say your city.", true, /*i18n*/ "Good. “I am from” + place."), c("I from Pune.", "Missing “am”.", false, /*i18n*/ "Add “am”: “I am from Pune.”")),
      turn("Are you a student here?", "She asks if you study here.", c("Yes, I am a student.", "You say yes.", true, /*i18n*/ "Well done: “I am a student.”"), c("Yes, I am student.", "Missing “a”.", false, /*i18n*/ "English uses “a” before a job: “a student”.")),
    ] },
  restaurant: { vocab: [{ text: "tea", meaning: "a hot drink" }, { text: "please", meaning: "a polite request word", sign: "PLEASE" }, { text: "the bill", meaning: "the paper that shows what to pay" }],
    turns: [
      turn("Good afternoon! What would you like?", "The waiter asks for your order.", c("A cup of tea, please.", "You order tea politely.", true, /*i18n*/ "Polite and clear."), c("Give tea.", "Too direct.", false, /*i18n*/ "Add “please” and “a cup of” to sound polite.")),
      turn("Anything to eat?", "They ask if you want food.", c("Yes, a sandwich, please.", "You order a sandwich.", true, /*i18n*/ "Good order."), c("Yes, I eat.", "Unclear order.", false, /*i18n*/ "Say what you want: “a sandwich, please”.")),
      turn("Here you are. Enjoy!", "The food arrives.", c("Thank you! Can I have the bill, please?", "You thank them and ask for the bill.", true, /*i18n*/ "Exactly how to finish a meal."), c("Sorry.", "An apology.", false, /*i18n*/ "Nothing went wrong. Say “thank you”.")),
    ] },
  shopping: { vocab: [{ text: "how much?", meaning: "asking the price" }, { text: "rupees", meaning: "Indian money" }, { text: "bag", meaning: "something to carry things in" }],
    turns: [
      turn("Hello! Can I help you?", "The seller offers help.", c("Yes, I want two apples, please.", "You ask for apples.", true, /*i18n*/ "Clear and polite."), c("Yes, I want two apple.", "Plural missing.", false, /*i18n*/ "Two or more needs -s: “two apples”.")),
      turn("Here you are.", "The seller gives the apples.", c("How much is it?", "You ask the price.", true, /*i18n*/ "Right question for the price."), c("How many is it?", "Wrong question word.", false, /*i18n*/ "For prices, ask “How much?”.")),
      turn("Forty rupees, please.", "The price is forty rupees.", c("Here you are. Thank you!", "You pay and thank them.", true, /*i18n*/ "Smooth payment."), c("Forty rupees, please.", "You repeated the seller.", false, /*i18n*/ "That’s the seller’s line. Hand over the money and say thanks.")),
    ] },
  airport: { vocab: [{ text: "passport", meaning: "your travel document" }, { text: "flight", meaning: "a journey by plane" }, { text: "gate", meaning: "where you board the plane" }],
    turns: [
      turn("Good morning. Your passport, please.", "The agent asks for your passport.", c("Here is my passport.", "You hand it over.", true, /*i18n*/ "Correct."), c("Here are my passport.", "Wrong verb form.", false, /*i18n*/ "One passport: “Here is”.")),
      turn("Where are you flying today?", "They ask your destination.", c("I am flying to Delhi.", "You say where you are going.", true, /*i18n*/ "Good use of “flying to”."), c("I am flying at Delhi.", "Wrong preposition.", false, /*i18n*/ "Use “to” for a destination.")),
      turn("Your gate is number twelve.", "They tell you the gate.", c("Thank you. Where is gate twelve?", "You ask the way.", true, /*i18n*/ "Polite, and a useful question."), c("Twelve is where?", "Unclear word order.", false, /*i18n*/ "English questions start with the question word: “Where is …?”")),
    ] },
  travel: { vocab: [{ text: "ticket", meaning: "paper that lets you travel" }, { text: "platform", meaning: "where the train stops" }, { text: "train", meaning: "a vehicle on rails" }],
    turns: [
      turn("Next, please. Where to?", "The ticket clerk asks where you are going.", c("One ticket to Mumbai, please.", "You ask for a ticket.", true, /*i18n*/ "Exactly right."), c("One Mumbai.", "Too short.", false, /*i18n*/ "Say “one ticket to Mumbai, please”.")),
      turn("Single or return?", "One way, or there and back?", c("Return, please.", "There and back.", true, /*i18n*/ "Clear answer."), c("Yes, please.", "Doesn’t choose.", false, /*i18n*/ "This question needs a choice, not yes.")),
      turn("Here’s your ticket.", "You have your ticket.", c("Which platform is the train?", "You ask for the platform.", true, /*i18n*/ "Useful question."), c("Which platform the train is?", "Wrong word order.", false, /*i18n*/ "In questions, “is” comes before the subject.")),
    ] },
  college: { vocab: [{ text: "class", meaning: "a lesson or a group of students" }, { text: "timetable", meaning: "a list of lesson times" }, { text: "room", meaning: "a space in a building" }],
    turns: [
      turn("Good morning. How can I help?", "The office worker offers help.", c("Where is my English class?", "You ask where your class is.", true, /*i18n*/ "Clear question."), c("Where my English class?", "Missing “is”.", false, /*i18n*/ "English needs “is”: “Where is …?”")),
      turn("It’s in room 204, on the second floor.", "They tell you the room.", c("Thank you. When does it start?", "You ask the time.", true, /*i18n*/ "Good follow-up."), c("Thank you. When it starts?", "Question form missing.", false, /*i18n*/ "Use “does”: “When does it start?”")),
      turn("At ten o’clock. Here is your timetable.", "Class is at ten; they give a timetable.", c("Thank you very much!", "You thank them.", true, /*i18n*/ "Lovely and polite."), c("Goodbye, teacher.", "They aren’t your teacher.", false, /*i18n*/ "A simple “thank you” fits better here.")),
    ] },
  friends: { vocab: [{ text: "friend", meaning: "a person you like and trust", sign: "FRIEND" }, { text: "weekend", meaning: "Saturday and Sunday" }, { text: "let’s …", meaning: "a suggestion to do something together" }],
    turns: [
      turn("Hi! Can I sit here?", "A classmate asks to sit with you.", c("Of course! Please sit down.", "You welcome them.", true, /*i18n*/ "Warm and friendly."), c("No, sit.", "Confusing.", false, /*i18n*/ "That’s mixed up. Try a clear welcome.")),
      turn("What do you like to do at the weekend?", "They ask about your hobbies.", c("I like reading and cricket.", "You share your hobbies.", true, /*i18n*/ "Good use of “I like”."), c("I liking reading.", "Wrong verb form.", false, /*i18n*/ "Say “I like reading”.")),
      turn("Me too! Let’s play cricket on Sunday.", "They suggest playing cricket together.", c("Great idea! See you on Sunday.", "You agree.", true, /*i18n*/ "You made a plan."), c("Great idea! See you in Sunday.", "Wrong preposition.", false, /*i18n*/ "Days take “on”: “on Sunday”.")),
    ] },
};

const ES: Record<string, Body> = {
  meeting: { vocab: [{ text: "hola", meaning: "hello", sign: "HELLO" }, { text: "mucho gusto", meaning: "nice to meet you" }, { text: "¿qué tal?", meaning: "how are you?" }],
    turns: [
      turn("¡Hola! Creo que no nos conocemos.", "Hello! I don’t think we’ve met.", c("¡Hola! Mucho gusto.", "Hello! Nice to meet you.", true, /*i18n*/ "Perfect: friendly and polite."), c("Adiós.", "Goodbye.", false, /*i18n*/ "“Adiós” is for leaving. Try a greeting.")),
      turn("¿Qué tal?", "How are you?", c("Bien, gracias. ¿Y tú?", "Fine, thanks. And you?", true, /*i18n*/ "Great: you answered and asked back."), c("Sí.", "Yes.", false, /*i18n*/ "“¿Qué tal?” needs more than yes.")),
      turn("Muy bien. ¡Hasta luego!", "Very well. See you later!", c("¡Hasta luego!", "See you later!", true, /*i18n*/ "Nice ending to the conversation."), c("¡Buenos días!", "Good morning!", false, /*i18n*/ "That’s a greeting. They are leaving.")),
    ] },
  intro: { vocab: [{ text: "me llamo …", meaning: "my name is …", sign: "NAME" }, { text: "soy de …", meaning: "I am from …" }, { text: "estudiante", meaning: "student" }],
    turns: [
      turn("Hola, soy Lucía. ¿Cómo te llamas?", "Hi, I’m Lucía. What’s your name?", c("Me llamo Ravi.", "My name is Ravi.", true, /*i18n*/ "Correct: “Me llamo …”."), c("Yo llamo Ravi.", "Missing “me”.", false, /*i18n*/ "Spanish says “Me llamo Ravi”.")),
      turn("¿De dónde eres?", "Where are you from?", c("Soy de la India.", "I am from India.", true, /*i18n*/ "Good. “Soy de” + place."), c("Estoy de la India.", "Wrong verb.", false, /*i18n*/ "Origin uses “ser”: “Soy de …”.")),
      turn("¿Eres estudiante?", "Are you a student?", c("Sí, soy estudiante.", "Yes, I’m a student.", true, /*i18n*/ "Well done. Spanish needs no “a” here."), c("Sí, soy un estudiante.", "Extra word.", false, /*i18n*/ "With jobs and roles after “soy”, Spanish usually drops “un/una”.")),
    ] },
  restaurant: { vocab: [{ text: "un café", meaning: "a coffee" }, { text: "por favor", meaning: "please", sign: "PLEASE" }, { text: "la cuenta", meaning: "the bill" }],
    turns: [
      turn("¡Buenas tardes! ¿Qué desea?", "Good afternoon! What would you like?", c("Un café, por favor.", "A coffee, please.", true, /*i18n*/ "Polite and clear."), c("Café.", "Coffee.", false, /*i18n*/ "Add “un” and “por favor” to sound polite.")),
      turn("¿Algo de comer?", "Anything to eat?", c("Sí, una tortilla, por favor.", "Yes, an omelette, please.", true, /*i18n*/ "Good order."), c("Sí, un tortilla.", "Wrong article.", false, /*i18n*/ "“Tortilla” is feminine: “una tortilla”.")),
      turn("Aquí tiene. ¡Que aproveche!", "Here you are. Enjoy your meal!", c("¡Gracias! La cuenta, por favor.", "Thanks! The bill, please.", true, /*i18n*/ "Exactly how to finish a meal."), c("Lo siento.", "I’m sorry.", false, /*i18n*/ "Nothing went wrong. Say “gracias”.")),
    ] },
  shopping: { vocab: [{ text: "¿cuánto cuesta?", meaning: "how much is it?" }, { text: "euros", meaning: "money used in Spain" }, { text: "una bolsa", meaning: "a bag" }],
    turns: [
      turn("¡Hola! ¿Qué quería?", "Hello! What would you like?", c("Quiero dos manzanas, por favor.", "I want two apples, please.", true, /*i18n*/ "Clear and polite."), c("Quiero dos manzana.", "Plural missing.", false, /*i18n*/ "Two or more needs -s: “dos manzanas”.")),
      turn("Aquí tiene.", "Here you are.", c("¿Cuánto cuesta?", "How much is it?", true, /*i18n*/ "Right question for the price."), c("¿Cuántos cuesta?", "Wrong question word.", false, /*i18n*/ "For prices, ask “¿Cuánto cuesta?”.")),
      turn("Un euro, por favor.", "One euro, please.", c("Aquí tiene. ¡Gracias!", "Here you are. Thanks!", true, /*i18n*/ "Smooth payment."), c("Un euro, por favor.", "You repeated the seller.", false, /*i18n*/ "That’s the seller’s line. Pay and say thanks.")),
    ] },
  airport: { vocab: [{ text: "el pasaporte", meaning: "the passport" }, { text: "el vuelo", meaning: "the flight" }, { text: "la puerta", meaning: "the gate" }],
    turns: [
      turn("Buenos días. Su pasaporte, por favor.", "Good morning. Your passport, please.", c("Aquí tiene mi pasaporte.", "Here is my passport.", true, /*i18n*/ "Correct."), c("Aquí tienes mi pasaporte.", "Too informal here.", false, /*i18n*/ "With staff, use the polite “usted” form: “Aquí tiene”.")),
      turn("¿Adónde viaja hoy?", "Where are you travelling today?", c("Viajo a Madrid.", "I’m travelling to Madrid.", true, /*i18n*/ "Good use of “a” for a destination."), c("Viajo en Madrid.", "Wrong preposition.", false, /*i18n*/ "Use “a” for a destination.")),
      turn("Su puerta es la número doce.", "Your gate is number twelve.", c("Gracias. ¿Dónde está la puerta doce?", "Thanks. Where is gate twelve?", true, /*i18n*/ "Polite, and a useful question."), c("Gracias. ¿Dónde es la puerta doce?", "Wrong verb.", false, /*i18n*/ "Location uses “estar”: “¿Dónde está …?”")),
    ] },
  travel: { vocab: [{ text: "un billete", meaning: "a ticket" }, { text: "el andén", meaning: "the platform" }, { text: "el tren", meaning: "the train" }],
    turns: [
      turn("Siguiente, por favor. ¿Adónde va?", "Next, please. Where are you going?", c("Un billete a Sevilla, por favor.", "A ticket to Seville, please.", true, /*i18n*/ "Exactly right."), c("Sevilla.", "Seville.", false, /*i18n*/ "Say “un billete a Sevilla, por favor”.")),
      turn("¿De ida o de ida y vuelta?", "Single or return?", c("De ida y vuelta, por favor.", "Return, please.", true, /*i18n*/ "Clear answer."), c("Sí, por favor.", "Yes, please.", false, /*i18n*/ "This question needs a choice, not “sí”.")),
      turn("Aquí tiene su billete.", "Here’s your ticket.", c("¿De qué andén sale el tren?", "Which platform does the train leave from?", true, /*i18n*/ "Useful question."), c("¿Qué andén el tren?", "Verb missing.", false, /*i18n*/ "A Spanish question still needs a verb: “¿De qué andén sale el tren?”")),
    ] },
  college: { vocab: [{ text: "la clase", meaning: "the class" }, { text: "el horario", meaning: "the timetable" }, { text: "el aula", meaning: "the classroom" }],
    turns: [
      turn("Buenos días. ¿En qué puedo ayudarle?", "Good morning. How can I help you?", c("¿Dónde está mi clase de inglés?", "Where is my English class?", true, /*i18n*/ "Clear question."), c("¿Dónde es mi clase de inglés?", "Wrong verb.", false, /*i18n*/ "Location uses “estar”: “¿Dónde está …?”")),
      turn("Está en el aula 204, en el segundo piso.", "It’s in room 204, on the second floor.", c("Gracias. ¿A qué hora empieza?", "Thanks. What time does it start?", true, /*i18n*/ "Good follow-up."), c("Gracias. ¿Qué hora empieza?", "Missing “a”.", false, /*i18n*/ "“At what time” is “¿A qué hora …?”")),
      turn("A las diez. Aquí tiene su horario.", "At ten. Here is your timetable.", c("¡Muchas gracias!", "Thank you very much!", true, /*i18n*/ "Lovely and polite."), c("¡Adiós, profesor!", "Goodbye, teacher!", false, /*i18n*/ "They aren’t your teacher. “Muchas gracias” fits better.")),
    ] },
  friends: { vocab: [{ text: "amigo / amiga", meaning: "friend", sign: "FRIEND" }, { text: "el fin de semana", meaning: "the weekend" }, { text: "¿vamos a …?", meaning: "shall we …?" }],
    turns: [
      turn("¡Hola! ¿Me puedo sentar aquí?", "Hi! Can I sit here?", c("¡Claro! Siéntate.", "Of course! Sit down.", true, /*i18n*/ "Warm and friendly."), c("No, siéntate.", "Confusing.", false, /*i18n*/ "That’s mixed up. Try a clear welcome.")),
      turn("¿Qué te gusta hacer el fin de semana?", "What do you like to do at the weekend?", c("Me gusta leer y jugar al fútbol.", "I like reading and playing football.", true, /*i18n*/ "Good use of “me gusta”."), c("Yo gusto leer.", "Wrong structure.", false, /*i18n*/ "Spanish says “Me gusta leer”.")),
      turn("¡A mí también! ¿Vamos a jugar el domingo?", "Me too! Shall we play on Sunday?", c("¡Buena idea! Hasta el domingo.", "Great idea! See you on Sunday.", true, /*i18n*/ "You made a plan."), c("¡Buena idea! Hasta en domingo.", "Extra word.", false, /*i18n*/ "Say “hasta el domingo”.")),
    ] },
};

export function scenariosFor(course: IslCourseId): Scenario[] {
  const body = course === "spanish" ? ES : EN;
  return META.map((m) => ({ ...m, ...body[m.id] }));
}
export const getScenario = (course: IslCourseId, id: string) => scenariosFor(course).find((s) => s.id === id);
