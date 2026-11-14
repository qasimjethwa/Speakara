import { buildCourse } from "../types";

/** Spanish for English speakers — CEFR A1, Section 1. Original content written for Speakara (CC BY-SA 4.0). */
export const esEn = buildCourse(
  {
    id: "es-en", target: "es", native: "en", title: "Spanish", targetName: "Spanish", nativeName: "English",
    flag: "🇪🇸", ttsLang: "es-ES", sttLang: "es-ES", status: "complete-unit-set",
    license: "CC BY-SA 4.0 — original Speakara content", review: "Author-reviewed; native-speaker review pending",
  },
  [
    {
      id: "es1", title: "Greetings", objective: "Say hello, be polite and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Two question marks", body: "Spanish questions open with ¿ and close with ?. Exclamations do the same with ¡ and !.", examples: [{ t: "¿Cómo estás?", n: "How are you?" }, { t: "¡Hola!", n: "Hello!" }] },
        { title: "Greetings change with the clock", body: "Use buenos días until about noon, buenas tardes until dusk and buenas noches at night — both to greet and to say goodbye.", examples: [{ t: "Buenos días", n: "Good morning" }, { t: "Buenas noches", n: "Good night" }] },
        { title: "You can drop “yo”", body: "The verb ending already tells who is speaking, so “Soy Ana” and “Yo soy Ana” both mean “I am Ana”.", examples: [{ t: "Soy Luis.", n: "I am Luis." }, { t: "Me llamo Ana.", n: "My name is Ana." }] },
      ],
      lessons: [
        { title: "Hello and thanks", words: [["hola", "hello"], ["adiós", "goodbye"], ["gracias", "thank you"], ["por favor", "please"], ["sí", "yes"], ["no", "no"]],
          sentences: [["Hola, buenos días.", "Hello, good morning."], ["Adiós, gracias.", "Goodbye, thank you.", ["Bye, thank you.", "Goodbye, thanks."]], ["Sí, por favor.", "Yes, please."], ["No, gracias.", "No, thank you.", ["No, thanks."]]] },
        { title: "Times of day", words: [["buenos días", "good morning"], ["buenas tardes", "good afternoon"], ["buenas noches", "good night"], ["hasta luego", "see you later"], ["mañana", "tomorrow"], ["señor", "sir"]],
          sentences: [["Buenas tardes, señor.", "Good afternoon, sir."], ["Buenas noches, mamá.", "Good night, mom.", ["Good night, mum.", "Goodnight, mom."]], ["Hasta luego.", "See you later."], ["Hasta mañana.", "See you tomorrow."]] },
        { title: "Your name", words: [["yo", "I"], ["tú", "you"], ["me llamo", "my name is"], ["soy", "I am"], ["eres", "you are"], ["cómo", "how"]],
          sentences: [["Me llamo Ana.", "My name is Ana.", ["I am called Ana."]], ["Yo soy Luis.", "I am Luis.", ["I'm Luis."]], ["¿Cómo te llamas?", "What is your name?", ["What's your name?"]], ["¿Tú eres María?", "Are you María?", ["Are you Maria?"]]] },
        { title: "How are you?", words: [["mucho gusto", "nice to meet you"], ["bien", "well"], ["muy", "very"], ["y", "and"], ["estoy", "I am"], ["estás", "you are"]],
          sentences: [["¿Cómo estás?", "How are you?"], ["Muy bien, gracias.", "Very well, thank you.", ["Very good, thank you.", "Very well, thanks."]], ["Mucho gusto, Ana.", "Nice to meet you, Ana."], ["Estoy bien, ¿y tú?", "I am fine, and you?", ["I am well, and you?", "I'm fine, and you?", "I am good, and you?"]]] },
      ],
      story: {
        id: "es1-story", title: "En el café", summary: "Ana meets Luis for the first time.",
        lines: [
          { speaker: "Ana", t: "¡Hola! Buenos días.", n: "Hello! Good morning." },
          { speaker: "Luis", t: "Buenos días. ¿Cómo te llamas?", n: "Good morning. What is your name?" },
          { speaker: "Ana", t: "Me llamo Ana. ¿Y tú?", n: "My name is Ana. And you?" },
          { speaker: "Luis", t: "Yo soy Luis. Mucho gusto, Ana.", n: "I am Luis. Nice to meet you, Ana." },
          { speaker: "Ana", t: "Mucho gusto. ¿Cómo estás?", n: "Nice to meet you. How are you?" },
          { speaker: "Luis", t: "Muy bien, gracias. ¿Y tú?", n: "Very well, thank you. And you?" },
          { speaker: "Ana", t: "Estoy bien. ¡Hasta luego, Luis!", n: "I am fine. See you later, Luis!" },
          { speaker: "Luis", t: "¡Adiós, Ana! Hasta mañana.", n: "Goodbye, Ana! See you tomorrow." },
        ],
        questions: [
          { afterLine: 3, prompt: "What is the man's name?", options: ["Ana", "Luis", "María"], answer: 1 },
          { afterLine: 5, prompt: "How is Luis feeling?", options: ["Very well", "Tired", "Hungry"], answer: 0 },
          { afterLine: 7, prompt: "When will they see each other again?", options: ["Tonight", "Tomorrow", "Never"], answer: 1 },
        ],
      },
    },
    {
      id: "es2", title: "People and family", objective: "Describe yourself, your family and friends", cefr: "A1", color: "sky",
      tips: [
        { title: "Nouns have gender", body: "Every noun is masculine or feminine. Masculine nouns usually take el / un, feminine nouns take la / una.", examples: [{ t: "el niño, un niño", n: "the boy, a boy" }, { t: "la niña, una niña", n: "the girl, a girl" }] },
        { title: "Ser: to be", body: "Use ser for identity and lasting traits: yo soy, tú eres, él / ella es.", examples: [{ t: "Ella es mi amiga.", n: "She is my friend." }, { t: "Tú eres alto.", n: "You are tall." }] },
        { title: "Tener: to have", body: "Yo tengo, tú tienes, él / ella tiene. Spanish questions keep the same word order — only the punctuation and your voice change.", examples: [{ t: "Tengo un hermano.", n: "I have a brother." }, { t: "¿Tienes una hermana?", n: "Do you have a sister?" }] },
      ],
      lessons: [
        { title: "Who is who", words: [["el hombre", "the man"], ["la mujer", "the woman"], ["el niño", "the boy"], ["la niña", "the girl"], ["un", "a (masculine)"], ["una", "a (feminine)"]],
          sentences: [["Yo soy un hombre.", "I am a man."], ["Tú eres una mujer.", "You are a woman."], ["El niño es Luis.", "The boy is Luis."], ["La niña es Ana.", "The girl is Ana."]] },
        { title: "My family", words: [["la madre", "the mother"], ["el padre", "the father"], ["el hermano", "the brother"], ["la hermana", "the sister"], ["mi", "my"]],
          sentences: [["Mi madre es Ana.", "My mother is Ana.", ["My mom is Ana."]], ["Mi padre es Luis.", "My father is Luis.", ["My dad is Luis."]], ["Mi hermano es un niño.", "My brother is a boy."], ["Mi hermana es una mujer.", "My sister is a woman."]] },
        { title: "I have…", words: [["tengo", "I have"], ["tienes", "you have"], ["tiene", "he / she has"], ["el amigo", "the friend (male)"], ["la amiga", "the friend (female)"], ["la hija", "the daughter"]],
          sentences: [["Tengo un hermano.", "I have a brother."], ["Tengo una amiga.", "I have a friend.", ["I have a female friend."]], ["¿Tienes una hermana?", "Do you have a sister?"], ["Mi amigo tiene una hija.", "My friend has a daughter."]] },
        { title: "Describing people", words: [["él", "he"], ["ella", "she"], ["es", "is"], ["alto", "tall"], ["simpático", "nice"], ["feliz", "happy"]],
          sentences: [["Él es mi padre.", "He is my father.", ["He is my dad."]], ["Ella es mi amiga.", "She is my friend."], ["Mi hermano es alto.", "My brother is tall."], ["Ella es muy feliz.", "She is very happy."]] },
      ],
      story: {
        id: "es2-story", title: "La foto", summary: "Ana shows Luis a family photo.",
        lines: [
          { speaker: "Luis", t: "Ana, ¿tienes hermanos?", n: "Ana, do you have siblings?" },
          { speaker: "Ana", t: "Sí. Tengo un hermano y una hermana.", n: "Yes. I have a brother and a sister." },
          { speaker: "Luis", t: "¿Él es tu hermano?", n: "Is he your brother?" },
          { speaker: "Ana", t: "No, él es mi padre. Es muy alto.", n: "No, he is my father. He is very tall." },
          { speaker: "Luis", t: "¿Y la niña?", n: "And the girl?" },
          { speaker: "Ana", t: "Ella es mi hermana. Es muy simpática.", n: "She is my sister. She is very nice." },
          { speaker: "Luis", t: "Tu familia es muy feliz.", n: "Your family is very happy." },
        ],
        questions: [
          { afterLine: 1, prompt: "How many siblings does Ana have?", options: ["One", "Two", "Three"], answer: 1 },
          { afterLine: 3, prompt: "Who is the tall man in the photo?", options: ["Ana's brother", "Ana's father", "Luis"], answer: 1 },
          { afterLine: 6, prompt: "How does Luis describe Ana's family?", options: ["Very tall", "Very happy", "Very small"], answer: 1 },
        ],
      },
    },
    {
      id: "es3", title: "Food and drink", objective: "Order food and say what you eat and drink", cefr: "A1", color: "grape",
      tips: [
        { title: "Comer and beber", body: "Regular -er verbs share endings: yo como / bebo, tú comes / bebes, él / ella come / bebe.", examples: [{ t: "Yo como pan.", n: "I eat bread." }, { t: "Ella bebe agua.", n: "She drinks water." }] },
        { title: "Ordering politely", body: "“Quiero…, por favor” is clear and friendly in a café. Add con (with) or sin (without) to adjust your order.", examples: [{ t: "Quiero un café con leche, por favor.", n: "I want a coffee with milk, please." }, { t: "Un té sin azúcar.", n: "A tea without sugar." }] },
        { title: "El agua", body: "Agua is feminine but takes el in the singular because it starts with a stressed a: el agua fría.", examples: [{ t: "El agua, por favor.", n: "The water, please." }] },
      ],
      lessons: [
        { title: "Eat and drink", words: [["el agua", "the water"], ["el pan", "the bread"], ["la leche", "the milk"], ["la manzana", "the apple"], ["como", "I eat"], ["bebo", "I drink"]],
          sentences: [["Yo como pan.", "I eat bread."], ["Yo bebo agua.", "I drink water."], ["Yo como una manzana.", "I eat an apple."], ["Yo bebo leche.", "I drink milk."]] },
        { title: "At the café", words: [["quiero", "I want"], ["el café", "the coffee"], ["el té", "the tea"], ["con", "with"], ["sin", "without"], ["el azúcar", "the sugar"]],
          sentences: [["Quiero un café, por favor.", "I want a coffee, please."], ["Quiero té con leche.", "I want tea with milk."], ["Un café sin azúcar.", "A coffee without sugar."], ["Quiero agua, por favor.", "I want water, please."]] },
        { title: "Meals", words: [["el desayuno", "the breakfast"], ["el almuerzo", "the lunch"], ["la cena", "the dinner"], ["el pollo", "the chicken"], ["el arroz", "the rice"], ["la ensalada", "the salad"]],
          sentences: [["El desayuno es pan y café.", "Breakfast is bread and coffee.", ["The breakfast is bread and coffee."]], ["Como pollo con arroz.", "I eat chicken with rice."], ["La cena es una ensalada.", "Dinner is a salad.", ["The dinner is a salad."]], ["Quiero el almuerzo.", "I want lunch.", ["I want the lunch."]]] },
        { title: "At the restaurant", words: [["la cuenta", "the check"], ["el restaurante", "the restaurant"], ["la mesa", "the table"], ["para", "for"], ["dos", "two"], ["delicioso", "delicious"]],
          sentences: [["Una mesa para dos, por favor.", "A table for two, please."], ["La cuenta, por favor.", "The check, please.", ["The bill, please."]], ["El pollo es delicioso.", "The chicken is delicious."], ["El restaurante es muy bueno.", "The restaurant is very good."]] },
      ],
      story: {
        id: "es3-story", title: "Una mesa para dos", summary: "Ana and Luis have dinner out.",
        lines: [
          { speaker: "Luis", t: "Buenas noches. Una mesa para dos, por favor.", n: "Good evening. A table for two, please." },
          { speaker: "Camarero", t: "Sí, señor. ¿Qué quiere?", n: "Yes, sir. What do you want?" },
          { speaker: "Ana", t: "Quiero pollo con arroz y agua.", n: "I want chicken with rice and water." },
          { speaker: "Luis", t: "Yo quiero una ensalada y un café sin azúcar.", n: "I want a salad and a coffee without sugar." },
          { speaker: "Ana", t: "¡El pollo es delicioso!", n: "The chicken is delicious!" },
          { speaker: "Luis", t: "Sí, el restaurante es muy bueno.", n: "Yes, the restaurant is very good." },
          { speaker: "Ana", t: "La cuenta, por favor.", n: "The check, please." },
        ],
        questions: [
          { afterLine: 2, prompt: "What does Ana order to drink?", options: ["Coffee", "Milk", "Water"], answer: 2 },
          { afterLine: 3, prompt: "How does Luis take his coffee?", options: ["With milk", "Without sugar", "With sugar"], answer: 1 },
          { afterLine: 6, prompt: "What does Ana ask for at the end?", options: ["The check", "A table", "More rice"], answer: 0 },
        ],
      },
    },
  ],
);
