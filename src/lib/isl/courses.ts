/**
 * ISL-first A1 courses: English through ISL and Spanish through ISL.
 *
 * ISL is the language of instruction; English and Spanish are the target written languages. The two courses share
 * themes but not content: each has its own vocabulary, grammar, reading and writing built for that language.
 *
 * Review status (honest): no item here has been reviewed by Deaf ISL signers yet. ISL grammar notes summarise published
 * ISL linguistics (topic–comment order, question words at the end, no articles or copula, non-manual markers) and MUST
 * be checked by Deaf ISL educators. Hindi support text has not been reviewed by a Hindi editor. Every sign is
 * "awaiting validation" until an educator authors and a Deaf signer approves its animation in the Sign Studio.
 */

export type IslCourseId = "english" | "spanish";
export interface VocabItem { id: string; sign: string; text: string; meaning: string; hi: string; emoji: string; example: string; exampleMeaning: string }
export interface GrammarPoint { title: string; target: string; isl: string; examples: { text: string; meaning: string; isl?: string }[] }
export interface ReadingQ { q: string; options: string[]; answer: number }
export interface Reading { title: string; emoji: string; sentences: { text: string; meaning: string; hi: string }[]; questions: ReadingQ[] }
export type WritingTask =
  | { kind: "arrange"; prompt: string; words: string[]; answer: string }
  | { kind: "fill"; prompt: string; before: string; after: string; answer: string[]; hint: string }
  | { kind: "correct"; prompt: string; wrong: string; answer: string[]; why: string }
  | { kind: "picture"; prompt: string; emoji: string; answer: string[] };
export interface QuizItem { q: string; options: string[]; answer: number; why?: string }
export interface IslUnit { id: string; title: string; titleMeaning: string; emoji: string; vocab: VocabItem[]; grammar: GrammarPoint[]; reading: Reading; writing: WritingTask[]; quiz: QuizItem[] }
export interface IslCourse { id: IslCourseId; title: string; target: string; flag: string; level: "A1"; tagline: string; units: IslUnit[] }

const v = (id: string, sign: string, text: string, meaning: string, hi: string, emoji: string, example: string, exampleMeaning: string): VocabItem =>
  ({ id, sign, text, meaning, hi, emoji, example, exampleMeaning });

// ---------------------------------------------------------------- English through ISL
const english: IslCourse = {
  id: "english", title: "English through ISL", target: "English", flag: "🇬🇧", level: "A1",
  tagline: "Read and write everyday English, explained in Indian Sign Language.",
  units: [
    {
      id: "en1", title: "Greetings and introductions", titleMeaning: "Saying hello and telling people your name", emoji: "👋",
      vocab: [
        v("en1.w1", "HELLO", "hello", "a greeting", "नमस्ते", "👋", "Hello, Priya!", "A greeting to Priya."),
        v("en1.w2", "GOODBYE", "goodbye", "said when leaving", "अलविदा", "🙋", "Goodbye, see you tomorrow.", "Said when you leave."),
        v("en1.w3", "THANK-YOU", "thank you", "showing thanks", "धन्यवाद", "🙏", "Thank you for the book.", "Thanks for a book."),
        v("en1.w4", "PLEASE", "please", "a polite request word", "कृपया", "🤲", "Water, please.", "Asking politely for water."),
        v("en1.w5", "SORRY", "sorry", "an apology", "माफ़ कीजिए", "😔", "Sorry, I am late.", "An apology for being late."),
        v("en1.w6", "NAME", "name", "what people call you", "नाम", "🏷️", "My name is Ravi.", "Ravi introduces himself."),
        v("en1.w7", "FRIEND", "friend", "a person you like and trust", "दोस्त", "🤝", "Asha is my friend.", "Asha is a friend."),
        v("en1.w8", "GOOD-MORNING", "good morning", "a greeting before noon", "सुप्रभात", "🌅", "Good morning, teacher!", "A morning greeting."),
      ],
      grammar: [
        { title: "“to be”: I am, you are, he/she is",
          target: "English needs a form of “be” to join a person to a description: I am, you are, he is, she is, it is.",
          isl: "ISL does not use a separate sign for “am / is / are”. A signer shows the person, then the description (for example ME STUDENT). In English you must write the “be” word.",
          examples: [{ text: "I am a student.", meaning: "Describing yourself.", isl: "ME STUDENT" }, { text: "She is my friend.", meaning: "Describing her.", isl: "SHE FRIEND MY" }, { text: "You are kind.", meaning: "Describing you." }] },
        { title: "Introducing yourself",
          target: "Two common ways: “My name is …” and “I am …”. Names start with a capital letter.",
          isl: "In ISL, names are often fingerspelled or given a name sign. In English, write the name with a capital letter.",
          examples: [{ text: "My name is Ravi.", meaning: "Telling your name.", isl: "MY NAME R-A-V-I" }, { text: "I am Meera.", meaning: "Another way to tell your name." }] },
      ],
      reading: { title: "Meeting in class", emoji: "🏫", sentences: [
        { text: "Hello! My name is Ravi.", meaning: "Ravi says hello and tells his name.", hi: "नमस्ते! मेरा नाम रवि है।" },
        { text: "I am a student.", meaning: "Ravi studies.", hi: "मैं एक छात्र हूँ।" },
        { text: "This is Asha. She is my friend.", meaning: "Ravi introduces his friend Asha.", hi: "यह आशा है। वह मेरी दोस्त है।" },
        { text: "Good morning, teacher!", meaning: "They greet the teacher.", hi: "सुप्रभात, शिक्षक!" },
      ], questions: [
        { q: "What is the boy's name?", options: ["Asha", "Ravi", "Teacher"], answer: 1 },
        { q: "Who is Asha?", options: ["Ravi's friend", "Ravi's teacher", "Ravi's mother"], answer: 0 },
        { q: "What time of day is it?", options: ["Night", "Morning", "Evening"], answer: 1 },
      ] },
      writing: [
        { kind: "arrange", prompt: "Put the words in order.", words: ["is", "My", "Ravi.", "name"], answer: "My name is Ravi." },
        { kind: "fill", prompt: "Write the missing word.", before: "I", after: "a student.", answer: ["am"], hint: "I + am" },
        { kind: "correct", prompt: "Correct the mistake.", wrong: "I is happy.", answer: ["I am happy.", "i am happy."], why: "With “I”, use “am”." },
        { kind: "picture", prompt: "Write the English word for this picture.", emoji: "👋", answer: ["hello"] },
        { kind: "arrange", prompt: "Write a short message to a friend.", words: ["Good", "Asha!", "morning,"], answer: "Good morning, Asha!" },
      ],
      quiz: [
        { q: "Choose the polite word: “Water, ___.”", options: ["sorry", "please", "goodbye"], answer: 1 },
        { q: "Which sentence is correct?", options: ["She are my friend.", "She is my friend.", "She am my friend."], answer: 1, why: "He / she / it + is." },
        { q: "What do you say when you leave?", options: ["hello", "goodbye", "name"], answer: 1 },
        { q: "Which word starts with a capital letter?", options: ["friend", "Ravi", "morning"], answer: 1, why: "Names start with a capital letter." },
      ],
    },
    {
      id: "en2", title: "My family", titleMeaning: "Family members and talking about them", emoji: "👨‍👩‍👧",
      vocab: [
        v("en2.w1", "MOTHER", "mother", "female parent", "माँ", "👩", "My mother is a doctor.", "Talking about your mother's job."),
        v("en2.w2", "FATHER", "father", "male parent", "पिता", "👨", "My father cooks dinner.", "Your father cooks."),
        v("en2.w3", "SISTER", "sister", "a girl with the same parents", "बहन", "👧", "I have a sister.", "You have one sister."),
        v("en2.w4", "BROTHER", "brother", "a boy with the same parents", "भाई", "👦", "My brother is ten.", "Your brother is ten years old."),
        v("en2.w5", "FAMILY", "family", "parents, children and relatives", "परिवार", "👨‍👩‍👧‍👦", "This is my family.", "Showing your family."),
        v("en2.w6", "BABY", "baby", "a very young child", "शिशु", "👶", "The baby is sleeping.", "A baby sleeps."),
        v("en2.w7", "GRANDMOTHER", "grandmother", "mother of your parent", "दादी / नानी", "👵", "My grandmother lives with us.", "Grandmother lives in the same home."),
        v("en2.w8", "HOME", "home", "the place where you live", "घर", "🏠", "We are at home.", "The family is at home."),
      ],
      grammar: [
        { title: "a, an, the",
          target: "Use “a” before a consonant sound (a baby), “an” before a vowel sound (an apple), and “the” for something specific (the baby in this room).",
          isl: "ISL has no signs for “a”, “an” or “the”. Pointing (indexing) and the signing space show which person or thing you mean. English needs these small words in writing.",
          examples: [{ text: "I have a brother.", meaning: "One brother, not specific." }, { text: "The baby is sleeping.", meaning: "A specific baby.", isl: "BABY THERE SLEEP" }] },
        { title: "my, your, his, her",
          target: "Possessive words come before the noun: my mother, your father, his sister, her brother.",
          isl: "ISL often shows possession with a possessive handshape directed at the owner. English writes the possessive word first.",
          examples: [{ text: "This is my family.", meaning: "The family belongs to me." }, { text: "Her brother is ten.", meaning: "The brother of a girl." }] },
      ],
      reading: { title: "Asha's family", emoji: "🏠", sentences: [
        { text: "This is my family.", meaning: "Asha shows her family.", hi: "यह मेरा परिवार है।" },
        { text: "My mother is a teacher and my father is a cook.", meaning: "Her parents' jobs.", hi: "मेरी माँ शिक्षिका हैं और मेरे पिता रसोइया हैं।" },
        { text: "I have a brother and a baby sister.", meaning: "Asha has two siblings.", hi: "मेरा एक भाई और एक छोटी बहन है।" },
        { text: "My grandmother lives with us at home.", meaning: "Grandmother lives in the same home.", hi: "मेरी दादी हमारे साथ घर पर रहती हैं।" },
      ], questions: [
        { q: "What is Asha's mother's job?", options: ["Cook", "Teacher", "Doctor"], answer: 1 },
        { q: "How many brothers does Asha have?", options: ["One", "Two", "None"], answer: 0 },
        { q: "Who lives with the family?", options: ["Grandmother", "A friend", "The teacher"], answer: 0 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write “a” or “an”.", before: "I eat", after: "apple.", answer: ["an"], hint: "“apple” starts with a vowel sound." },
        { kind: "arrange", prompt: "Put the words in order.", words: ["my", "This", "family.", "is"], answer: "This is my family." },
        { kind: "correct", prompt: "Correct the mistake.", wrong: "My mother are a doctor.", answer: ["My mother is a doctor.", "my mother is a doctor."], why: "One person (my mother) + is." },
        { kind: "picture", prompt: "Write the English word for this picture.", emoji: "👶", answer: ["baby", "a baby"] },
      ],
      quiz: [
        { q: "Choose: “I have ___ sister.”", options: ["an", "a", "the"], answer: 1 },
        { q: "Your mother's mother is your…", options: ["sister", "grandmother", "baby"], answer: 1 },
        { q: "Which is correct?", options: ["Her brother is ten.", "Brother her is ten.", "Her is brother ten."], answer: 0 },
      ],
    },
    {
      id: "en3", title: "Food and shopping", titleMeaning: "Food words, buying things and prices", emoji: "🛒",
      vocab: [
        v("en3.w1", "WATER", "water", "a drink", "पानी", "💧", "I drink water.", "Drinking water."),
        v("en3.w2", "FOOD", "food", "what we eat", "खाना", "🍽️", "The food is hot.", "Hot food."),
        v("en3.w3", "RICE", "rice", "a grain we cook and eat", "चावल", "🍚", "We eat rice and dal.", "A common meal."),
        v("en3.w4", "APPLE", "apple", "a red or green fruit", "सेब", "🍎", "I want two apples.", "Asking for two apples."),
        v("en3.w5", "TEA", "tea", "a hot drink", "चाय", "🍵", "One tea, please.", "Ordering tea."),
        v("en3.w6", "MONEY", "money", "what we pay with", "पैसा", "💰", "I have money.", "You have money."),
        v("en3.w7", "BUY", "buy", "to get something by paying", "खरीदना", "🛍️", "I buy bread.", "Getting bread at a shop."),
        v("en3.w8", "HOW-MUCH", "how much", "asking a price", "कितना", "🏷️", "How much is this?", "Asking the price."),
      ],
      grammar: [
        { title: "Plurals: one apple, two apples",
          target: "Most English nouns add -s for more than one: apple → apples, book → books. Some words do not change: rice, water, money.",
          isl: "ISL can show plural by repeating a sign, adding a number, or using space; there is no -s ending. In English, check whether to add -s.",
          examples: [{ text: "I want two apples.", meaning: "More than one apple.", isl: "APPLE TWO ME WANT" }, { text: "I drink water.", meaning: "“water” has no plural here." }] },
        { title: "Asking questions: How much is this?",
          target: "English question words usually come first: How much is this? Where is the shop?",
          isl: "In ISL the question word is usually at the END with a question facial expression (eyebrows), for example THIS HOW-MUCH. In English, move the question word to the front and end with “?”.",
          examples: [{ text: "How much is the tea?", meaning: "Asking the price of tea.", isl: "TEA HOW-MUCH" }, { text: "Do you have rice?", meaning: "A yes/no question starts with “Do”." }] },
      ],
      reading: { title: "At the shop", emoji: "🏪", sentences: [
        { text: "Ravi goes to the shop.", meaning: "Ravi visits a shop.", hi: "रवि दुकान जाता है।" },
        { text: "He wants rice, tea and three apples.", meaning: "His shopping list.", hi: "उसे चावल, चाय और तीन सेब चाहिए।" },
        { text: "“How much is this?” he asks.", meaning: "He asks the price.", hi: "“यह कितने का है?” वह पूछता है।" },
        { text: "It is one hundred rupees. He pays and says thank you.", meaning: "He pays 100 rupees.", hi: "यह सौ रुपये का है। वह पैसे देता है और धन्यवाद कहता है।" },
      ], questions: [
        { q: "How many apples does Ravi want?", options: ["Two", "Three", "Four"], answer: 1 },
        { q: "How much does he pay?", options: ["10 rupees", "100 rupees", "1000 rupees"], answer: 1 },
        { q: "What does he say at the end?", options: ["Sorry", "Thank you", "Goodbye"], answer: 1 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write the plural.", before: "I want two", after: ".", answer: ["apples"], hint: "apple + s" },
        { kind: "arrange", prompt: "Make the question.", words: ["is", "How", "this?", "much"], answer: "How much is this?" },
        { kind: "correct", prompt: "Correct the question.", wrong: "This how much?", answer: ["How much is this?", "how much is this?"], why: "In English the question word comes first." },
        { kind: "picture", prompt: "Write the English word for this picture.", emoji: "🍵", answer: ["tea"] },
      ],
      quiz: [
        { q: "Plural of “book” is…", options: ["book", "books", "bookes"], answer: 1 },
        { q: "Which is a question?", options: ["How much is it?", "It is ten rupees.", "I buy tea."], answer: 0 },
        { q: "Which word usually has no plural -s?", options: ["apple", "water", "shop"], answer: 1 },
      ],
    },
    {
      id: "en4", title: "School and travel", titleMeaning: "Places, transport and asking where", emoji: "🚌",
      vocab: [
        v("en4.w1", "SCHOOL", "school", "a place to learn", "विद्यालय", "🏫", "I go to school.", "Going to school."),
        v("en4.w2", "TEACHER", "teacher", "a person who teaches", "शिक्षक", "🧑‍🏫", "The teacher is kind.", "Describing the teacher."),
        v("en4.w3", "BOOK", "book", "pages to read", "किताब", "📘", "The book is on the table.", "Where the book is."),
        v("en4.w4", "BUS", "bus", "a big road vehicle", "बस", "🚌", "I take the bus.", "Travelling by bus."),
        v("en4.w5", "TRAIN", "train", "a vehicle on rails", "रेलगाड़ी", "🚆", "The train is late.", "A late train."),
        v("en4.w6", "HOTEL", "hotel", "a place to stay when travelling", "होटल", "🏨", "The hotel is near the station.", "Location of a hotel."),
        v("en4.w7", "WHERE", "where", "asking about a place", "कहाँ", "📍", "Where is the bus stop?", "Asking for a place."),
        v("en4.w8", "TODAY", "today", "this day", "आज", "📅", "Today I go to college.", "Plans for this day."),
      ],
      grammar: [
        { title: "Present simple: I go, she goes",
          target: "For habits and facts use the base verb: I go, you go, we go. With he / she / it add -s or -es: she goes, he takes.",
          isl: "ISL verbs do not change for he/she. Time is usually set first with a time sign (TODAY, EVERY-DAY). English adds -s for he/she/it.",
          examples: [{ text: "I go to school.", meaning: "A habit." }, { text: "She takes the bus.", meaning: "She + takes (-s).", isl: "SHE BUS TAKE" }] },
        { title: "in, on, at, near",
          target: "Prepositions show place: in the bag, on the table, at school, near the station.",
          isl: "ISL shows location by placing signs in space (classifiers). English needs a preposition word.",
          examples: [{ text: "The book is on the table.", meaning: "Location on top.", isl: "TABLE, BOOK (placed on it)" }, { text: "Where is the hotel? It is near the station.", meaning: "Asking and answering a place." }] },
      ],
      reading: { title: "A trip to college", emoji: "🚆", sentences: [
        { text: "Today Meera goes to college.", meaning: "Meera's plan today.", hi: "आज मीरा कॉलेज जाती है।" },
        { text: "She takes the bus to the station.", meaning: "First the bus.", hi: "वह स्टेशन तक बस लेती है।" },
        { text: "The train is late, so she reads her book.", meaning: "She waits and reads.", hi: "रेलगाड़ी देर से है, इसलिए वह अपनी किताब पढ़ती है।" },
        { text: "Her college is near a big hotel.", meaning: "Where the college is.", hi: "उसका कॉलेज एक बड़े होटल के पास है।" },
      ], questions: [
        { q: "How does Meera go to the station?", options: ["By train", "By bus", "On foot"], answer: 1 },
        { q: "Why does she read?", options: ["The train is late", "She is at home", "The teacher says so"], answer: 0 },
        { q: "Where is her college?", options: ["Near a hotel", "In a shop", "On a bus"], answer: 0 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write the verb: “She ___ the bus.” (take)", before: "She", after: "the bus.", answer: ["takes"], hint: "she + verb + s" },
        { kind: "arrange", prompt: "Make the question.", words: ["the", "Where", "station?", "is"], answer: "Where is the station?" },
        { kind: "correct", prompt: "Correct the mistake.", wrong: "He go to school.", answer: ["He goes to school.", "he goes to school."], why: "he + goes." },
        { kind: "picture", prompt: "Write the English word for this picture.", emoji: "🚆", answer: ["train", "a train"] },
      ],
      quiz: [
        { q: "Choose: “The book is ___ the table.”", options: ["on", "at", "of"], answer: 0 },
        { q: "Which is correct?", options: ["She go to college.", "She goes to college.", "She going college."], answer: 1 },
        { q: "Which word asks about a place?", options: ["when", "where", "who"], answer: 1 },
      ],
    },
  ],
};

// ---------------------------------------------------------------- Spanish through ISL
const spanish: IslCourse = {
  id: "spanish", title: "Spanish through ISL", target: "Spanish", flag: "🇪🇸", level: "A1",
  tagline: "Read and write beginner Spanish, explained in Indian Sign Language.",
  units: [
    {
      id: "es1", title: "Saludos y presentaciones", titleMeaning: "Greetings and introductions", emoji: "👋",
      vocab: [
        v("es1.w1", "HELLO", "hola", "hello", "नमस्ते", "👋", "¡Hola, Lucía!", "Hello, Lucía!"),
        v("es1.w2", "GOODBYE", "adiós", "goodbye", "अलविदा", "🙋", "Adiós, hasta mañana.", "Goodbye, see you tomorrow."),
        v("es1.w3", "THANK-YOU", "gracias", "thank you", "धन्यवाद", "🙏", "Gracias por el libro.", "Thank you for the book."),
        v("es1.w4", "PLEASE", "por favor", "please", "कृपया", "🤲", "Agua, por favor.", "Water, please."),
        v("es1.w5", "SORRY", "perdón", "sorry / excuse me", "माफ़ कीजिए", "😔", "Perdón, llego tarde.", "Sorry, I'm late."),
        v("es1.w6", "NAME", "el nombre", "name (masculine noun)", "नाम", "🏷️", "Mi nombre es Ana.", "My name is Ana."),
        v("es1.w7", "FRIEND", "el amigo / la amiga", "friend (male / female)", "दोस्त", "🤝", "Lucía es mi amiga.", "Lucía is my friend."),
        v("es1.w8", "GOOD-MORNING", "buenos días", "good morning", "सुप्रभात", "🌅", "¡Buenos días, profesora!", "Good morning, teacher!"),
      ],
      grammar: [
        { title: "ser: yo soy, tú eres, él / ella es",
          target: "“ser” (to be) changes with the person: yo soy, tú eres, él es, ella es, usted es. Spanish often drops the pronoun: “Soy estudiante.”",
          isl: "ISL has no copula sign, and English has one form per person. Spanish goes further: the verb ending itself shows who. Learn soy / eres / es as three different written words.",
          examples: [{ text: "Soy estudiante.", meaning: "I am a student.", isl: "ME STUDENT" }, { text: "Ella es mi amiga.", meaning: "She is my friend." }, { text: "¿Eres profesor?", meaning: "Are you a teacher?" }] },
        { title: "¿Cómo te llamas? — questions with ¿ ?",
          target: "Spanish questions open with ¿ and close with ?. “Me llamo …” = My name is … (literally “I call myself”).",
          isl: "ISL marks a question with the face (eyebrows) and the question word at the end. Spanish marks it in writing at BOTH ends: ¿…?",
          examples: [{ text: "¿Cómo te llamas?", meaning: "What is your name?", isl: "YOUR NAME WHAT" }, { text: "Me llamo Ana.", meaning: "My name is Ana." }] },
      ],
      reading: { title: "En la clase", emoji: "🏫", sentences: [
        { text: "¡Hola! Me llamo Ana.", meaning: "Hello! My name is Ana.", hi: "नमस्ते! मेरा नाम आना है।" },
        { text: "Soy estudiante.", meaning: "I am a student.", hi: "मैं छात्रा हूँ।" },
        { text: "Ella es Lucía. Es mi amiga.", meaning: "This is Lucía. She is my friend.", hi: "यह लूसिया है। वह मेरी दोस्त है।" },
        { text: "¡Buenos días, profesora!", meaning: "Good morning, teacher!", hi: "सुप्रभात, शिक्षिका!" },
      ], questions: [
        { q: "¿Cómo se llama la chica? (What is the girl's name?)", options: ["Lucía", "Ana", "Profesora"], answer: 1 },
        { q: "¿Quién es Lucía? (Who is Lucía?)", options: ["Ana's friend", "Ana's teacher", "Ana's mother"], answer: 0 },
        { q: "Which greeting do they use?", options: ["Buenas noches", "Buenos días", "Adiós"], answer: 1 },
      ] },
      writing: [
        { kind: "arrange", prompt: "Ordena las palabras (put the words in order).", words: ["llamo", "Me", "Ana."], answer: "Me llamo Ana." },
        { kind: "fill", prompt: "Write the form of “ser”.", before: "Yo", after: "estudiante.", answer: ["soy"], hint: "yo → soy" },
        { kind: "correct", prompt: "Correct the question (add the opening mark).", wrong: "Cómo te llamas?", answer: ["¿Cómo te llamas?"], why: "Spanish questions start with ¿." },
        { kind: "picture", prompt: "Write the Spanish word for this picture.", emoji: "👋", answer: ["hola", "¡hola!"] },
        { kind: "arrange", prompt: "Write a short message.", words: ["días,", "Buenos", "Lucía!"], answer: "Buenos días, Lucía!" },
      ],
      quiz: [
        { q: "“tú ___ mi amigo” (ser)", options: ["soy", "eres", "es"], answer: 1 },
        { q: "How do you write “What is your name?”", options: ["¿Cómo te llamas?", "Cómo te llamas", "¿Cómo te llamas"], answer: 0 },
        { q: "“gracias” means…", options: ["please", "thank you", "sorry"], answer: 1 },
        { q: "A female friend is…", options: ["el amigo", "la amiga", "los amigos"], answer: 1 },
      ],
    },
    {
      id: "es2", title: "La familia", titleMeaning: "The family", emoji: "👨‍👩‍👧",
      vocab: [
        v("es2.w1", "MOTHER", "la madre", "mother", "माँ", "👩", "Mi madre es médica.", "My mother is a doctor."),
        v("es2.w2", "FATHER", "el padre", "father", "पिता", "👨", "Mi padre cocina.", "My father cooks."),
        v("es2.w3", "SISTER", "la hermana", "sister", "बहन", "👧", "Tengo una hermana.", "I have a sister."),
        v("es2.w4", "BROTHER", "el hermano", "brother", "भाई", "👦", "Mi hermano tiene diez años.", "My brother is ten years old."),
        v("es2.w5", "FAMILY", "la familia", "family", "परिवार", "👨‍👩‍👧‍👦", "Esta es mi familia.", "This is my family."),
        v("es2.w6", "BABY", "el bebé", "baby", "शिशु", "👶", "El bebé duerme.", "The baby sleeps."),
        v("es2.w7", "GRANDMOTHER", "la abuela", "grandmother", "दादी / नानी", "👵", "Mi abuela vive con nosotros.", "My grandmother lives with us."),
        v("es2.w8", "HOME", "la casa", "house / home", "घर", "🏠", "Estamos en casa.", "We are at home."),
      ],
      grammar: [
        { title: "Gender: el / la, un / una",
          target: "Every Spanish noun is masculine or feminine. Masculine: el / un (el hermano, un libro). Feminine: la / una (la hermana, una casa). Many -o words are masculine and many -a words are feminine.",
          isl: "ISL and English have no grammatical gender for nouns. Spanish does, so learn each noun WITH its article: “la casa”, not just “casa”.",
          examples: [{ text: "el hermano / la hermana", meaning: "the brother / the sister" }, { text: "un padre, una madre", meaning: "a father, a mother" }] },
        { title: "tener (to have) and age",
          target: "Spanish uses “tener” for age: Tengo diez años = I am ten (literally “I have ten years”). yo tengo, tú tienes, él / ella tiene.",
          isl: "ISL shows age with a number sign near the face/age location; English uses “be” (I am ten). Spanish uses “have”. Three languages, three different patterns.",
          examples: [{ text: "Tengo una hermana.", meaning: "I have a sister." }, { text: "Mi hermano tiene diez años.", meaning: "My brother is ten." }] },
      ],
      reading: { title: "La familia de Lucía", emoji: "🏠", sentences: [
        { text: "Esta es mi familia.", meaning: "This is my family.", hi: "यह मेरा परिवार है।" },
        { text: "Mi madre es profesora y mi padre es cocinero.", meaning: "My mother is a teacher and my father is a cook.", hi: "मेरी माँ शिक्षिका हैं और मेरे पिता रसोइया हैं।" },
        { text: "Tengo un hermano y una hermana bebé.", meaning: "I have a brother and a baby sister.", hi: "मेरा एक भाई और एक छोटी बहन है।" },
        { text: "Mi abuela vive con nosotros en casa.", meaning: "My grandmother lives with us at home.", hi: "मेरी दादी हमारे साथ घर पर रहती हैं।" },
      ], questions: [
        { q: "What is Lucía's mother's job?", options: ["cocinera", "profesora", "médica"], answer: 1 },
        { q: "“un hermano” means…", options: ["a brother", "a sister", "a baby"], answer: 0 },
        { q: "Who lives with the family?", options: ["la abuela", "la amiga", "la profesora"], answer: 0 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write “el” or “la”.", before: "", after: "casa es grande.", answer: ["la", "La"], hint: "casa is feminine." },
        { kind: "arrange", prompt: "Ordena las palabras.", words: ["mi", "Esta", "familia.", "es"], answer: "Esta es mi familia." },
        { kind: "correct", prompt: "Correct the article.", wrong: "El hermana es alta.", answer: ["La hermana es alta.", "la hermana es alta."], why: "hermana is feminine: la." },
        { kind: "picture", prompt: "Write the Spanish word with its article.", emoji: "👵", answer: ["la abuela"] },
      ],
      quiz: [
        { q: "Choose the article: ___ padre", options: ["el", "la", "una"], answer: 0 },
        { q: "“I am ten years old” in Spanish is…", options: ["Soy diez años.", "Tengo diez años.", "Estoy diez años."], answer: 1, why: "Spanish uses tener for age." },
        { q: "Feminine of “el hermano” is…", options: ["la hermano", "la hermana", "el hermana"], answer: 1 },
      ],
    },
    {
      id: "es3", title: "Comida y compras", titleMeaning: "Food and shopping", emoji: "🛒",
      vocab: [
        v("es3.w1", "WATER", "el agua", "water (uses el, but is feminine)", "पानी", "💧", "Bebo agua.", "I drink water."),
        v("es3.w2", "FOOD", "la comida", "food", "खाना", "🍽️", "La comida está caliente.", "The food is hot."),
        v("es3.w3", "RICE", "el arroz", "rice", "चावल", "🍚", "Comemos arroz.", "We eat rice."),
        v("es3.w4", "APPLE", "la manzana", "apple", "सेब", "🍎", "Quiero dos manzanas rojas.", "I want two red apples."),
        v("es3.w5", "TEA", "el té", "tea", "चाय", "🍵", "Un té, por favor.", "A tea, please."),
        v("es3.w6", "MONEY", "el dinero", "money", "पैसा", "💰", "No tengo dinero.", "I have no money."),
        v("es3.w7", "BUY", "comprar", "to buy", "खरीदना", "🛍️", "Compro pan.", "I buy bread."),
        v("es3.w8", "HOW-MUCH", "¿cuánto cuesta?", "how much does it cost?", "कितने का है?", "🏷️", "¿Cuánto cuesta el té?", "How much is the tea?"),
      ],
      grammar: [
        { title: "Plurals and agreement: la manzana roja → las manzanas rojas",
          target: "Add -s after a vowel (manzana → manzanas) and -es after a consonant (arroz → arroces). The article and adjective change too: las manzanas rojas.",
          isl: "ISL shows plural by repetition or number; adjectives do not change. In Spanish, the article, noun and adjective must ALL agree in gender and number.",
          examples: [{ text: "la manzana roja", meaning: "the red apple" }, { text: "las manzanas rojas", meaning: "the red apples", isl: "APPLE RED MANY" }, { text: "el libro nuevo / los libros nuevos", meaning: "the new book / the new books" }] },
        { title: "-ar verbs: compro, compras, compra",
          target: "Regular -ar verbs (comprar) change the ending: yo compro, tú compras, él / ella compra, nosotros compramos.",
          isl: "ISL verbs keep the same form; who does it is shown by space and direction. In Spanish the ending tells you who.",
          examples: [{ text: "Yo compro pan.", meaning: "I buy bread." }, { text: "Ella compra té.", meaning: "She buys tea." }] },
      ],
      reading: { title: "En el mercado", emoji: "🏪", sentences: [
        { text: "Ana va al mercado.", meaning: "Ana goes to the market.", hi: "आना बाज़ार जाती है।" },
        { text: "Quiere arroz, té y tres manzanas rojas.", meaning: "She wants rice, tea and three red apples.", hi: "उसे चावल, चाय और तीन लाल सेब चाहिए।" },
        { text: "—¿Cuánto cuesta? —pregunta Ana.", meaning: "“How much is it?” Ana asks.", hi: "“यह कितने का है?” आना पूछती है।" },
        { text: "Cuesta cinco euros. Ana paga y dice: «Gracias».", meaning: "It costs five euros. Ana pays and says “Thank you”.", hi: "यह पाँच यूरो का है। आना पैसे देती है और कहती है: “धन्यवाद”।" },
      ], questions: [
        { q: "¿Cuántas manzanas quiere Ana? (How many apples?)", options: ["dos", "tres", "cinco"], answer: 1 },
        { q: "What colour are the apples?", options: ["verdes", "rojas", "amarillas"], answer: 1 },
        { q: "How much does it cost?", options: ["cinco euros", "tres euros", "diez euros"], answer: 0 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write the plural adjective.", before: "las manzanas", after: ".", answer: ["rojas"], hint: "roja → rojas" },
        { kind: "arrange", prompt: "Make the question.", words: ["cuesta?", "¿Cuánto"], answer: "¿Cuánto cuesta?" },
        { kind: "correct", prompt: "Correct the agreement.", wrong: "Las manzanas rojo.", answer: ["Las manzanas rojas.", "las manzanas rojas."], why: "manzanas is feminine plural → rojas." },
        { kind: "fill", prompt: "Write the verb: “Ella ___ té.” (comprar)", before: "Ella", after: "té.", answer: ["compra"], hint: "ella → -a" },
      ],
      quiz: [
        { q: "Plural of “el libro” is…", options: ["los libros", "las libros", "el libros"], answer: 0 },
        { q: "“Yo ___ arroz.” (comprar)", options: ["compra", "compro", "compras"], answer: 1 },
        { q: "Which shows correct agreement?", options: ["la casa blanco", "la casa blanca", "el casa blanca"], answer: 1 },
      ],
    },
    {
      id: "es4", title: "Escuela y viajes", titleMeaning: "School and travel", emoji: "🚌",
      vocab: [
        v("es4.w1", "SCHOOL", "la escuela", "school", "विद्यालय", "🏫", "Voy a la escuela.", "I go to school."),
        v("es4.w2", "TEACHER", "el profesor / la profesora", "teacher (male / female)", "शिक्षक / शिक्षिका", "🧑‍🏫", "La profesora es amable.", "The teacher is kind."),
        v("es4.w3", "BOOK", "el libro", "book", "किताब", "📘", "El libro está en la mesa.", "The book is on the table."),
        v("es4.w4", "BUS", "el autobús", "bus", "बस", "🚌", "Tomo el autobús.", "I take the bus."),
        v("es4.w5", "TRAIN", "el tren", "train", "रेलगाड़ी", "🚆", "El tren llega tarde.", "The train is late."),
        v("es4.w6", "HOTEL", "el hotel", "hotel", "होटल", "🏨", "El hotel está cerca.", "The hotel is near."),
        v("es4.w7", "WHERE", "¿dónde?", "where?", "कहाँ?", "📍", "¿Dónde está la estación?", "Where is the station?"),
        v("es4.w8", "TODAY", "hoy", "today", "आज", "📅", "Hoy voy a la universidad.", "Today I go to university."),
      ],
      grammar: [
        { title: "estar for location: ¿Dónde está…?",
          target: "Spanish has two verbs for “be”. Use “estar” for location and states: El libro está en la mesa. ¿Dónde está el hotel? (yo estoy, tú estás, él / ella está).",
          isl: "ISL places things in the signing space to show where they are; there is no “be” sign. English has one “be”. Spanish chooses between ser (what something is) and estar (where it is / how it is).",
          examples: [{ text: "¿Dónde está el hotel?", meaning: "Where is the hotel?", isl: "HOTEL WHERE" }, { text: "El hotel está cerca de la estación.", meaning: "The hotel is near the station." }, { text: "Soy profesora. / Estoy en la escuela.", meaning: "I am a teacher (ser). / I am at school (estar)." }] },
        { title: "ir a: voy, vas, va",
          target: "“ir” (to go) is irregular: yo voy, tú vas, él / ella va. a + el = al: Voy al hotel.",
          isl: "ISL shows going with a directional verb moving through space. Spanish needs the irregular forms and the contraction al.",
          examples: [{ text: "Voy a la escuela.", meaning: "I go to school." }, { text: "Ella va al hotel.", meaning: "She goes to the hotel." }] },
      ],
      reading: { title: "Un viaje a la universidad", emoji: "🚆", sentences: [
        { text: "Hoy Lucía va a la universidad.", meaning: "Today Lucía goes to university.", hi: "आज लूसिया विश्वविद्यालय जाती है।" },
        { text: "Toma el autobús a la estación.", meaning: "She takes the bus to the station.", hi: "वह स्टेशन तक बस लेती है।" },
        { text: "El tren llega tarde y Lucía lee su libro.", meaning: "The train is late and Lucía reads her book.", hi: "रेलगाड़ी देर से आती है और लूसिया अपनी किताब पढ़ती है।" },
        { text: "La universidad está cerca de un hotel grande.", meaning: "The university is near a big hotel.", hi: "विश्वविद्यालय एक बड़े होटल के पास है।" },
      ], questions: [
        { q: "How does Lucía go to the station?", options: ["en tren", "en autobús", "a pie"], answer: 1 },
        { q: "What does Lucía do while waiting?", options: ["Lee su libro", "Compra té", "Va al hotel"], answer: 0 },
        { q: "¿Dónde está la universidad?", options: ["cerca de un hotel", "en el tren", "en casa"], answer: 0 },
      ] },
      writing: [
        { kind: "fill", prompt: "Write the form of “estar”.", before: "El libro", after: "en la mesa.", answer: ["está"], hint: "location → estar → está" },
        { kind: "arrange", prompt: "Make the question.", words: ["está", "¿Dónde", "hotel?", "el"], answer: "¿Dónde está el hotel?" },
        { kind: "correct", prompt: "Correct the mistake.", wrong: "Voy a el hotel.", answer: ["Voy al hotel.", "voy al hotel."], why: "a + el = al." },
        { kind: "picture", prompt: "Write the Spanish word with its article.", emoji: "🚌", answer: ["el autobús", "el autobus"] },
      ],
      quiz: [
        { q: "Location uses…", options: ["ser", "estar", "tener"], answer: 1 },
        { q: "“Ella ___ a la escuela.” (ir)", options: ["voy", "vas", "va"], answer: 2 },
        { q: "a + el =", options: ["ael", "al", "a el"], answer: 1 },
      ],
    },
  ],
};

export const ISL_COURSES: IslCourse[] = [english, spanish];
export const getIslCourse = (id: string) => ISL_COURSES.find((c) => c.id === id);
export const getIslUnit = (course: IslCourse, id: string) => course.units.find((u) => u.id === id);

/** Signs used by both courses (one ISL sign concept may teach English and Spanish words). */
export const SIGN_IDS = [...new Set(ISL_COURSES.flatMap((c) => c.units.flatMap((u) => u.vocab.map((w) => w.sign))))];

/** Official ISLRTC dictionary (linked, not copied: ISLRTC content needs permission to reproduce). */
export const ISLRTC_DICTIONARY = "https://divyangjan.depwd.gov.in/islrtc/";

/** Normalises a written answer for checking: trims, collapses spaces, ignores case and final punctuation. */
export const normAnswer = (s: string) => s.trim().replace(/\s+/g, " ").replace(/[.!]+$/, "").toLowerCase();
export const checkWritten = (given: string, answers: string[]) => answers.some((a) => normAnswer(a) === normAnswer(given));
