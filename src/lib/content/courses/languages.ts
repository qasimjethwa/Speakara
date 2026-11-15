import { buildCourse } from "../types";

/**
 * Target languages added in the six-language release: German, Korean, Italian and Russian, each taught to English
 * speakers. Every course has two A1 units of three lessons. Content is original and author-written; it is marked
 * "native-speaker review pending" until a reviewer signs it off. Stable IDs: never renumber existing units or lessons.
 */
const review = "Author-written; native-speaker review pending";
const license = "CC BY-SA 4.0 — original Speakara content";

export const deEn = buildCourse(
  { id: "de-en", target: "de", native: "en", title: "German", targetName: "German", nativeName: "English", flag: "🇩🇪", ttsLang: "de-DE", sttLang: "de-DE", status: "beginner-set", license, review },
  [
    { id: "de1", title: "Begrüßungen", objective: "Greet people, say thank you and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Capital nouns", body: "German writes every noun with a capital letter, so Kaffee, Buch and Freund all start with a capital.", examples: [{ t: "Das Buch ist gut.", n: "The book is good." }] },
        { title: "du and Sie", body: "Use du with friends and children. Use Sie (always capitalised) with strangers and older people.", examples: [{ t: "Wie geht es dir?", n: "How are you? (informal)" }, { t: "Wie geht es Ihnen?", n: "How are you? (formal)" }] },
      ],
      lessons: [
        { title: "Hallo und danke", words: [["hallo", "hello"], ["auf Wiedersehen", "goodbye"], ["danke", "thank you"], ["bitte", "please"], ["ja", "yes"], ["nein", "no"]],
          sentences: [["Guten Morgen, Frau Schmidt.", "Good morning, Mrs Schmidt."], ["Danke, auf Wiedersehen!", "Thank you, goodbye!", ["Thanks, goodbye!"]], ["Ja, bitte.", "Yes, please."], ["Nein, danke.", "No, thank you.", ["No, thanks."]]] },
        { title: "Wie heißt du?", words: [["ich", "I"], ["heiße", "am called"], ["du", "you"], ["Name", "name"], ["wie", "how"], ["freut mich", "nice to meet you"]],
          sentences: [["Ich heiße Lena.", "My name is Lena.", ["I am called Lena.", "I'm Lena."]], ["Wie heißt du?", "What is your name?", ["What's your name?"]], ["Ich bin Paul.", "I am Paul.", ["I'm Paul."]], ["Freut mich, Paul!", "Nice to meet you, Paul!"]] },
        { title: "Wie geht's?", words: [["gut", "good, well"], ["geht", "goes"], ["es", "it"], ["mir", "to me"], ["dir", "to you"], ["sehr", "very"]],
          sentences: [["Wie geht es dir?", "How are you?", ["How are you doing?"]], ["Gut, danke. Und dir?", "Good, thanks. And you?", ["Well, thanks. And you?"]], ["Mir geht es sehr gut.", "I am doing very well.", ["I am very well."]], ["Danke, mir geht es gut.", "Thanks, I am well."]] },
      ] },
    { id: "de2", title: "Im Café", objective: "Order drinks and food and ask for things politely", cefr: "A1", color: "sun",
      tips: [
        { title: "The verb is in second place", body: "In a German main sentence the conjugated verb is always the second idea. Start with another word and the verb still stays second.", examples: [{ t: "Ich trinke Kaffee.", n: "I drink coffee." }, { t: "Heute trinke ich Tee.", n: "Today I am drinking tea." }] },
        { title: "der, die, das", body: "Every noun has a grammatical gender. Learn the article with the noun: der Kaffee (masculine), die Milch (feminine), das Brot (neuter).", examples: [{ t: "Der Kaffee ist heiß.", n: "The coffee is hot." }, { t: "Die Milch ist kalt.", n: "The milk is cold." }] },
      ],
      lessons: [
        { title: "Bestellen", words: [["der Kaffee", "the coffee"], ["der Tee", "the tea"], ["das Wasser", "the water"], ["die Milch", "the milk"], ["das Brot", "the bread"], ["ich möchte", "I would like"]],
          sentences: [["Ich möchte einen Kaffee, bitte.", "I would like a coffee, please."], ["Ein Wasser, bitte.", "One water, please.", ["A water, please."]], ["Der Tee ist heiß.", "The tea is hot."], ["Die Milch ist kalt.", "The milk is cold.", ["The milk is cool."]]] },
        { title: "Essen", words: [["der Käse", "the cheese"], ["die Suppe", "the soup"], ["lecker", "tasty"], ["hungrig", "hungry"], ["durstig", "thirsty"], ["groß", "big, large"]],
          sentences: [["Ich bin hungrig.", "I am hungry."], ["Ich bin durstig.", "I am thirsty."], ["Die Suppe ist lecker.", "The soup is tasty.", ["The soup is delicious."]], ["Das Brot ist groß.", "The loaf is big.", ["The bread is big."]]] },
        { title: "Höflich fragen", words: [["Entschuldigung", "excuse me"], ["wo", "where"], ["die Toilette", "the toilet"], ["die Rechnung", "the bill"], ["zahlen", "to pay"], ["bitte schön", "here you are"]],
          sentences: [["Entschuldigung, wo ist die Toilette?", "Excuse me, where is the toilet?", ["Excuse me, where is the restroom?"]], ["Die Rechnung, bitte.", "The bill, please."], ["Ich möchte zahlen.", "I would like to pay."], ["Bitte schön, hier ist Ihr Kaffee.", "Here is your coffee.", ["Here you are, your coffee."]]] },
      ],
      story: { id: "de2-story", title: "Im Café", summary: "Lena orders at a café and asks for the toilet.",
        lines: [
          { speaker: "Lena", t: "Guten Tag! Ich möchte einen Tee, bitte.", n: "Good afternoon! I would like a tea, please." },
          { speaker: "Kellner", t: "Gerne. Möchten Sie auch Brot?", n: "Gladly. Would you also like some bread?" },
          { speaker: "Lena", t: "Ja, bitte. Wo ist die Toilette?", n: "Yes, please. Where is the toilet?" },
          { speaker: "Kellner", t: "Dort hinten, links.", n: "Over there at the back, on the left." },
        ],
        questions: [
          { afterLine: 0, prompt: "What does Lena order first?", options: ["A coffee", "A tea", "A water"], answer: 1 },
          { afterLine: 3, prompt: "Where is the toilet?", options: ["Over there at the back, on the left", "Upstairs", "Next to the door"], answer: 0 },
        ] },
    },
  ],
);

export const itEn = buildCourse(
  { id: "it-en", target: "it", native: "en", title: "Italian", targetName: "Italian", nativeName: "English", flag: "🇮🇹", ttsLang: "it-IT", sttLang: "it-IT", status: "beginner-set", license, review },
  [
    { id: "it1", title: "Saluti", objective: "Greet people, say thank you and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Two ways to say you", body: "Use tu with friends and family. Use Lei (capitalised) with strangers and people you respect. Lei takes the verb in the third person.", examples: [{ t: "Come stai?", n: "How are you? (informal)" }, { t: "Come sta?", n: "How are you? (formal)" }] },
        { title: "Words end in vowels", body: "Most Italian words end in a vowel, and each vowel is said clearly: ciao, grazie, buona sera.", examples: [{ t: "Ciao, grazie!", n: "Hi, thanks!" }] },
      ],
      lessons: [
        { title: "Ciao e grazie", words: [["ciao", "hi, bye"], ["buongiorno", "good morning"], ["arrivederci", "goodbye"], ["grazie", "thank you"], ["prego", "you're welcome"], ["per favore", "please"]],
          sentences: [["Buongiorno, signora.", "Good morning, madam."], ["Grazie, arrivederci!", "Thank you, goodbye!", ["Thanks, goodbye!"]], ["Sì, per favore.", "Yes, please."], ["No, grazie.", "No, thank you.", ["No, thanks."]]] },
        { title: "Mi chiamo", words: [["mi chiamo", "my name is"], ["sono", "I am"], ["io", "I"], ["tu", "you"], ["piacere", "nice to meet you"], ["di", "from"]],
          sentences: [["Mi chiamo Marco.", "My name is Marco.", ["I am called Marco."]], ["Sono Giulia.", "I am Giulia.", ["I'm Giulia."]], ["Piacere, Marco!", "Nice to meet you, Marco!"], ["Sono di Roma.", "I am from Rome.", ["I'm from Rome."]]] },
        { title: "Come stai?", words: [["come", "how"], ["stai", "you are"], ["sto", "I am"], ["bene", "well"], ["molto", "very"], ["e", "and"]],
          sentences: [["Come stai?", "How are you?", ["How are you doing?"]], ["Sto bene, grazie. E tu?", "I am well, thanks. And you?", ["I'm well, thanks. And you?"]], ["Sto molto bene.", "I am very well.", ["I'm very well."]], ["Piacere di conoscerti.", "Nice to meet you.", ["Pleased to meet you."]]] },
      ] },
    { id: "it2", title: "Al bar", objective: "Order coffee and food and ask where things are", cefr: "A1", color: "sun",
      tips: [
        { title: "il, la, un, una", body: "Italian nouns are masculine or feminine, and the article shows which. Before a vowel, il and la become l'.", examples: [{ t: "Il caffè è buono.", n: "The coffee is good." }, { t: "L'acqua è fresca.", n: "The water is cool." }] },
        { title: "Double consonants matter", body: "A double consonant can change the meaning. Say it longer: caro (dear) and carro (cart).", examples: [{ t: "Il caro amico.", n: "The dear friend." }] },
      ],
      lessons: [
        { title: "Ordinare", words: [["un caffè", "a coffee"], ["un tè", "a tea"], ["l'acqua", "the water"], ["il latte", "the milk"], ["il pane", "the bread"], ["vorrei", "I would like"]],
          sentences: [["Vorrei un caffè, per favore.", "I would like a coffee, please."], ["Un'acqua, grazie.", "A water, thanks.", ["A water, please."]], ["Il tè è caldo.", "The tea is hot."], ["Il latte è freddo.", "The milk is cold.", ["The milk is cool."]]] },
        { title: "Il cibo", words: [["la zuppa", "the soup"], ["il formaggio", "the cheese"], ["buono", "good"], ["delizioso", "delicious"], ["affamato", "hungry"], ["assetato", "thirsty"]],
          sentences: [["Sono affamato.", "I am hungry (said by a man)."], ["Sono assetata.", "I am thirsty (said by a woman).", ["I am thirsty."]], ["La zuppa è deliziosa.", "The soup is delicious."], ["Il formaggio è buono.", "The cheese is good.", ["The cheese is nice."]]] },
        { title: "Chiedere", words: [["dov'è", "where is"], ["il bagno", "the bathroom"], ["il conto", "the bill"], ["pagare", "to pay"], ["scusi", "excuse me (formal)"], ["ecco", "here is"]],
          sentences: [["Scusi, dov'è il bagno?", "Excuse me, where is the bathroom?", ["Excuse me, where's the bathroom?"]], ["Il conto, per favore.", "The bill, please."], ["Vorrei pagare.", "I would like to pay."], ["Ecco il caffè.", "Here is the coffee.", ["Here's the coffee."]]] },
      ],
      story: { id: "it2-story", title: "Al bar", summary: "Marco orders a coffee and asks for the bathroom.",
        lines: [
          { speaker: "Marco", t: "Buongiorno! Vorrei un caffè, per favore.", n: "Good morning! I would like a coffee, please." },
          { speaker: "Cameriere", t: "Certo. Ecco il caffè. Desidera anche un dolce?", n: "Of course. Here is the coffee. Would you like a dessert too?" },
          { speaker: "Marco", t: "No, grazie. Dov'è il bagno?", n: "No, thanks. Where is the bathroom?" },
          { speaker: "Cameriere", t: "In fondo, a sinistra.", n: "At the end, on the left." },
        ],
        questions: [
          { afterLine: 1, prompt: "What does the waiter ask Marco?", options: ["Whether he would like a dessert", "Where he lives", "His name"], answer: 0 },
          { afterLine: 3, prompt: "Where is the bathroom?", options: ["At the end, on the left", "Upstairs", "Outside"], answer: 0 },
        ] },
    },
  ],
);

export const koEn = buildCourse(
  { id: "ko-en", target: "ko", native: "en", title: "Korean", targetName: "Korean", nativeName: "English", flag: "🇰🇷", ttsLang: "ko-KR", sttLang: "ko-KR", status: "beginner-set", license, review },
  [
    { id: "ko1", title: "인사", objective: "Greet people, say thank you and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Polite speech", body: "Most Korean speech uses the polite -요 endings (안녕하세요). The formal -ㅂ니다 style (감사합니다) is used in service and formal situations.", examples: [{ t: "안녕하세요.", n: "Hello. (polite)" }, { t: "감사합니다.", n: "Thank you. (formal)" }] },
        { title: "Particles mark the role", body: "은/는 marks the topic and 이/가 marks the subject. Use 은 or 이 after a final consonant (batchim), and 는 or 가 after a vowel.", examples: [{ t: "저는 학생이에요.", n: "I am a student." }, { t: "이름이 뭐예요?", n: "What is your name?" }] },
      ],
      lessons: [
        { title: "안녕하세요", words: [["안녕하세요", "hello"], ["안녕히 계세요", "goodbye (you stay)"], ["안녕히 가세요", "goodbye (you leave)"], ["감사합니다", "thank you"], ["네", "yes"], ["아니요", "no"]],
          sentences: [["안녕하세요, 선생님.", "Hello, teacher."], ["감사합니다. 안녕히 계세요.", "Thank you. Goodbye (you stay)."], ["네, 감사합니다.", "Yes, thank you."], ["아니요, 괜찮아요.", "No, it's okay.", ["No, thanks."]]] },
        { title: "이름", words: [["저", "I (polite)"], ["이름", "name"], ["학생", "student"], ["한국 사람", "Korean person"], ["만나서 반갑습니다", "nice to meet you"], ["뭐", "what"]],
          sentences: [["저는 민수예요.", "I am Minsu.", ["My name is Minsu."]], ["이름이 뭐예요?", "What is your name?", ["What's your name?"]], ["저는 학생이에요.", "I am a student."], ["만나서 반갑습니다.", "Nice to meet you.", ["Pleased to meet you."]]] },
        { title: "어떻게 지내요?", words: [["어떻게", "how"], ["지내요", "to get along, do"], ["잘", "well"], ["괜찮아요", "it's okay, I'm fine"], ["좋아요", "it's good"], ["많이", "a lot"]],
          sentences: [["어떻게 지내세요?", "How are you doing?", ["How are you?"]], ["저는 잘 지내요.", "I am doing well."], ["좋아요, 감사합니다.", "Good, thank you.", ["It's good, thank you."]], ["저도 많이 배워요.", "I am learning a lot too."]] },
      ] },
    { id: "ko2", title: "카페에서", objective: "Order drinks and food and ask for the bill", cefr: "A1", color: "sun",
      tips: [
        { title: "Object particles", body: "을 follows a word ending in a consonant and 를 follows a vowel. Both mark the object of the verb.", examples: [{ t: "물을 주세요.", n: "Water, please." }, { t: "커피를 마셔요.", n: "I drink coffee." }] },
        { title: "Ask politely with 주세요", body: "Add 주세요 (please give) after a noun to order it politely.", examples: [{ t: "커피 주세요.", n: "A coffee, please." }, { t: "계산해 주세요.", n: "The bill, please." }] },
      ],
      lessons: [
        { title: "주문하기", words: [["커피", "coffee"], ["차", "tea"], ["물", "water"], ["우유", "milk"], ["빵", "bread"], ["주세요", "please give"]],
          sentences: [["커피 주세요.", "A coffee, please."], ["물을 주세요.", "Water, please.", ["Please give me water."]], ["차가 뜨거워요.", "The tea is hot."], ["우유가 차가워요.", "The milk is cold.", ["The milk is cool."]]] },
        { title: "음식", words: [["수프", "soup"], ["치즈", "cheese"], ["맛있어요", "it's tasty"], ["배고파요", "I'm hungry"], ["목말라요", "I'm thirsty"], ["커요", "it's big"]],
          sentences: [["배고파요.", "I am hungry."], ["목말라요.", "I am thirsty."], ["수프가 맛있어요.", "The soup is tasty.", ["The soup is delicious."]], ["치즈가 커요.", "The cheese is big.", ["The cheese is large."]]] },
        { title: "계산", words: [["계산", "payment, the bill"], ["화장실", "toilet"], ["어디", "where"], ["여기", "here"], ["실례합니다", "excuse me"], ["얼마", "how much"]],
          sentences: [["실례합니다. 화장실이 어디예요?", "Excuse me. Where is the toilet?", ["Excuse me, where's the restroom?"]], ["계산해 주세요.", "The bill, please.", ["Check, please."]], ["얼마예요?", "How much is it?", ["How much?"]], ["여기 있어요.", "Here you are.", ["Here it is."]]] },
      ],
      story: { id: "ko2-story", title: "카페에서", summary: "Minsu orders a coffee and asks where the toilet is.",
        lines: [
          { speaker: "민수", t: "안녕하세요! 커피 주세요.", n: "Hello! A coffee, please." },
          { speaker: "직원", t: "네, 여기 있어요. 빵도 드릴까요?", n: "Yes, here you are. Shall I bring some bread too?" },
          { speaker: "민수", t: "아니요, 괜찮아요. 화장실이 어디예요?", n: "No, that's fine. Where is the toilet?" },
          { speaker: "직원", t: "저쪽이에요.", n: "It's over there." },
        ],
        questions: [
          { afterLine: 1, prompt: "What does the staff member offer?", options: ["Bread", "Soup", "A bill"], answer: 0 },
          { afterLine: 3, prompt: "Where is the toilet?", options: ["Over there", "Upstairs", "Outside"], answer: 0 },
        ] },
    },
  ],
);

export const ruEn = buildCourse(
  { id: "ru-en", target: "ru", native: "en", title: "Russian", targetName: "Russian", nativeName: "English", flag: "🇷🇺", ttsLang: "ru-RU", sttLang: "ru-RU", status: "beginner-set", license, review },
  [
    { id: "ru1", title: "Знакомство", objective: "Greet people, say thank you and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Two ways to say you", body: "ты is informal, used with friends, family and children. вы is formal, and it is also the plural form.", examples: [{ t: "Как ты?", n: "How are you? (informal)" }, { t: "Как вы?", n: "How are you? (formal)" }] },
        { title: "Stress and ё", body: "Russian stress can move between syllables, so this course marks it with an accent (´). The letter ё is always stressed.", examples: [{ t: "приве́т", n: "hi" }, { t: "спаси́бо", n: "thank you" }] },
      ],
      lessons: [
        { title: "Привет и спасибо", words: [["приве́т", "hi"], ["до свидания", "goodbye"], ["спаси́бо", "thank you"], ["пожа́луйста", "please, you're welcome"], ["да", "yes"], ["нет", "no"]],
          sentences: [["Здравствуйте, доктор.", "Hello, doctor."], ["Спасибо, до свидания!", "Thank you, goodbye!", ["Thanks, goodbye!"]], ["Да, пожа́луйста.", "Yes, please.", ["Yes, please!"]], ["Нет, спасибо.", "No, thank you.", ["No, thanks."]]] },
        { title: "Меня зовут", words: [["меня́ зову́т", "my name is"], ["я", "I"], ["ты", "you"], ["о́чень", "very"], ["прия́тно", "pleasant, nice"], ["рад", "glad (said by a man)"]],
          sentences: [["Меня́ зову́т Анна.", "My name is Anna.", ["I am called Anna."]], ["Я Иван.", "I am Ivan.", ["I'm Ivan."]], ["О́чень прия́тно.", "Nice to meet you.", ["Pleased to meet you."]], ["Как тебя́ зову́т?", "What is your name?", ["What's your name?"]]] },
        { title: "Как дела?", words: [["как", "how"], ["дела́", "things, affairs"], ["хорошо́", "well, good"], ["пло́хо", "badly"], ["норма́льно", "okay"], ["и", "and"]],
          sentences: [["Как дела́?", "How are you?", ["How are things?"]], ["Хорошо́, спаси́бо. А у тебя́?", "Good, thanks. And you?", ["Well, thanks. And how are you?"]], ["Норма́льно.", "Okay.", ["Not bad."]], ["Я из Росси́и.", "I am from Russia.", ["I'm from Russia."]]] },
      ] },
    { id: "ru2", title: "В кафе", objective: "Order drinks and food and ask for the bill", cefr: "A1", color: "sun",
      tips: [
        { title: "Cases change endings", body: "Russian nouns change their endings with their role. After из (from) the noun takes the genitive case: Москва becomes Москвы.", examples: [{ t: "Я из Москвы.", n: "I am from Moscow." }] },
        { title: "Gender in the past tense", body: "Past-tense verbs agree with the speaker: я был (said by a man) and я была (said by a woman).", examples: [{ t: "Я был в кафе.", n: "I was at the café. (said by a man)" }] },
      ],
      lessons: [
        { title: "Заказываем", words: [["чай", "tea"], ["кофе", "coffee"], ["вода́", "water"], ["молоко́", "milk"], ["хлеб", "bread"], ["хочу́", "I want"]],
          sentences: [["Я хочу́ чай, пожа́луйста.", "I would like tea, please.", ["I want tea, please."]], ["Кофе, пожа́луйста.", "Coffee, please."], ["Чай горя́чий.", "The tea is hot."], ["Молоко́ холо́дное.", "The milk is cold.", ["The milk is cool."]]] },
        { title: "Еда", words: [["суп", "soup"], ["сыр", "cheese"], ["вку́сно", "tasty"], ["голоден", "hungry (said by a man)"], ["голодна́", "hungry (said by a woman)"], ["большо́й", "big"]],
          sentences: [["Я голоден.", "I am hungry (said by a man)."], ["Я голодна́.", "I am hungry (said by a woman).", ["I am hungry."]], ["Суп о́чень вку́сный.", "The soup is very tasty.", ["The soup is delicious."]], ["Сыр большо́й.", "The cheese is big.", ["The cheese is large."]]] },
        { title: "Счёт", words: [["счёт", "the bill"], ["туале́т", "toilet"], ["где", "where"], ["плати́ть", "to pay"], ["извини́те", "excuse me"], ["здесь", "here"]],
          sentences: [["Извини́те, где туале́т?", "Excuse me, where is the toilet?", ["Excuse me, where is the restroom?"]], ["Счёт, пожа́луйста.", "The bill, please."], ["Я хочу́ плати́ть.", "I want to pay.", ["I would like to pay."]], ["Вот ваш чай.", "Here is your tea.", ["Here's your tea."]]] },
      ],
      story: { id: "ru2-story", title: "В кафе", summary: "Anna orders tea and asks for the toilet.",
        lines: [
          { speaker: "Анна", t: "Здравствуйте! Я хочу чай, пожалуйста.", n: "Hello! I would like tea, please." },
          { speaker: "Официант", t: "Конечно. Вот ваш чай. Хотите сыр?", n: "Of course. Here is your tea. Would you like some cheese?" },
          { speaker: "Анна", t: "Да, спасибо. Где туалет?", n: "Yes, thank you. Where is the toilet?" },
          { speaker: "Официант", t: "Там, направо.", n: "Over there, to the right." },
        ],
        questions: [
          { afterLine: 1, prompt: "What does the waiter offer?", options: ["Cheese", "Soup", "A bill"], answer: 0 },
          { afterLine: 3, prompt: "Where is the toilet?", options: ["Over there, to the right", "Upstairs", "Outside"], answer: 0 },
        ] },
    },
  ],
);
