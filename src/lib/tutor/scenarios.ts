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
      de: [
        { say: ["Hallo! Wie heißt du?", "Hello! What is your name?"], expect: ["ich heiße", "ich heisse", "ich bin", "mein name"], sample: ["Ich heiße Sam.", "My name is Sam."] },
        { say: ["Freut mich! Wie geht es dir?", "Nice to meet you! How are you?"], expect: ["gut", "danke", "mir geht", "schlecht"], sample: ["Mir geht es gut, danke.", "I am well, thanks."] },
        { say: ["Schön! Auf Wiedersehen!", "Lovely! Goodbye!"], expect: ["auf wiedersehen", "tschüss", "tschuss", "bis bald"], sample: ["Auf Wiedersehen!", "Goodbye!"] },
      ],
      it: [
        { say: ["Ciao! Come ti chiami?", "Hi! What is your name?"], expect: ["mi chiamo", "sono"], sample: ["Mi chiamo Sam.", "My name is Sam."] },
        { say: ["Piacere! Come stai?", "Nice to meet you! How are you?"], expect: ["sto", "bene", "grazie", "male"], sample: ["Sto bene, grazie.", "I am well, thanks."] },
        { say: ["Benissimo. Arrivederci!", "Very good. Goodbye!"], expect: ["arrivederci", "ciao", "a presto"], sample: ["Arrivederci!", "Goodbye!"] },
      ],
      ko: [
        { say: ["안녕하세요! 이름이 뭐예요?", "Hello! What is your name?"], expect: ["저는", "제 이름", "예요", "이에요", "입니다"], sample: ["저는 샘이에요.", "I am Sam."] },
        { say: ["만나서 반갑습니다. 어떻게 지내세요?", "Nice to meet you. How are you doing?"], expect: ["잘 지내", "좋아요", "괜찮아요", "감사합니다"], sample: ["잘 지내요, 감사합니다.", "I am doing well, thank you."] },
        { say: ["좋아요! 안녕히 가세요.", "Good! Goodbye."], expect: ["안녕히", "감사합니다", "또 만나요"], sample: ["안녕히 계세요.", "Goodbye."] },
      ],
      ru: [
        { say: ["Привет! Как тебя зовут?", "Hi! What is your name?"], expect: ["меня зовут", "я "], sample: ["Меня зовут Сэм.", "My name is Sam."] },
        { say: ["Очень приятно! Как дела?", "Nice to meet you! How are you?"], expect: ["хорошо", "нормально", "спасибо", "плохо"], sample: ["Хорошо, спасибо.", "Good, thanks."] },
        { say: ["Отлично. До свидания!", "Great. Goodbye!"], expect: ["до свидания", "пока"], sample: ["До свидания!", "Goodbye!"] },
      ],
      ar: [
        { say: ["مرحبا! ما اسمك؟", "Hello! What is your name?"], expect: ["اسمي", "انا"], sample: ["اسمي سام.", "My name is Sam."] },
        { say: ["تشرفنا! كيف حالك؟", "Nice to meet you! How are you?"], expect: ["بخير", "الحمد لله", "شكرا", "تعبان"], sample: ["أنا بخير، شكرا.", "I am fine, thanks."] },
        { say: ["من أين أنت؟", "Where are you from?"], expect: ["من", "انا"], sample: ["أنا من أمريكا.", "I am from America."] },
        { say: ["جميل! مع السلامة.", "Lovely! Goodbye."], expect: ["مع السلامة", "الى اللقاء", "شكرا", "باي"], sample: ["مع السلامة!", "Goodbye!"] },
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
      de: [
        { say: ["Guten Tag! Was möchten Sie trinken?", "Good afternoon! What would you like to drink?"], expect: ["ich möchte", "ich mochte", "kaffee", "tee", "wasser", "bitte"], sample: ["Ich möchte einen Kaffee, bitte.", "I would like a coffee, please."] },
        { say: ["Gerne. Möchten Sie etwas essen?", "Gladly. Would you like something to eat?"], expect: ["suppe", "brot", "käse", "kase", "nein", "ja"], sample: ["Ja, die Suppe, bitte.", "Yes, the soup, please."] },
        { say: ["Bitte schön. Noch etwas?", "Here you are. Anything else?"], expect: ["rechnung", "zahlen", "nein", "danke"], sample: ["Die Rechnung, bitte.", "The bill, please."] },
      ],
      it: [
        { say: ["Buongiorno! Cosa desidera da bere?", "Good morning! What would you like to drink?"], expect: ["vorrei", "caffè", "caffe", "tè", "acqua", "per favore"], sample: ["Vorrei un caffè, per favore.", "I would like a coffee, please."] },
        { say: ["Certo. Vuole mangiare qualcosa?", "Of course. Do you want something to eat?"], expect: ["zuppa", "pane", "formaggio", "no", "sì", "si"], sample: ["Sì, la zuppa, per favore.", "Yes, the soup, please."] },
        { say: ["Ecco. Altro?", "Here you are. Anything else?"], expect: ["conto", "pagare", "no", "grazie"], sample: ["Il conto, per favore.", "The bill, please."] },
      ],
      ko: [
        { say: ["어서 오세요! 뭐 드릴까요?", "Welcome! What can I get you?"], expect: ["주세요", "커피", "차", "물"], sample: ["커피 주세요.", "A coffee, please."] },
        { say: ["네. 음식도 드릴까요?", "Yes. Would you like some food too?"], expect: ["수프", "빵", "치즈", "네", "아니요", "괜찮아요"], sample: ["네, 빵 주세요.", "Yes, bread, please."] },
        { say: ["여기 있어요. 더 필요하세요?", "Here you are. Do you need anything else?"], expect: ["계산", "아니요", "감사합니다", "얼마"], sample: ["계산해 주세요.", "The bill, please."] },
      ],
      ru: [
        { say: ["Здравствуйте! Что вы хотите пить?", "Hello! What would you like to drink?"], expect: ["хочу", "чай", "кофе", "вод", "пожалуйста"], sample: ["Я хочу чай, пожалуйста.", "I would like tea, please."] },
        { say: ["Хорошо. Хотите есть?", "Good. Would you like to eat?"], expect: ["суп", "хлеб", "сыр", "да", "нет"], sample: ["Да, суп, пожалуйста.", "Yes, soup, please."] },
        { say: ["Вот, пожалуйста. Что-нибудь ещё?", "Here you are. Anything else?"], expect: ["счёт", "счет", "нет", "спасибо", "платить"], sample: ["Счёт, пожалуйста.", "The bill, please."] },
      ],
      ar: [
        { say: ["أهلا وسهلا! كم شخصا؟", "Welcome! How many people?"], expect: ["شخص", "واحد", "اثنان", "لشخصين", "طاولة", "انا"], sample: ["طاولة لشخصين من فضلك.", "A table for two, please."] },
        { say: ["ماذا تريد أن تأكل؟", "What would you like to eat?"], expect: ["اريد", "دجاج", "سمك", "حمص", "فول", "خبز"], sample: ["أريد الدجاج مع الأرز.", "I want the chicken with rice."] },
        { say: ["وماذا تشرب؟", "And what will you drink?"], expect: ["ماء", "شاي", "قهوة", "عصير", "اريد"], sample: ["أريد ماء من فضلك.", "I want water, please."] },
        { say: ["تفضل. هل تريد شيئا آخر؟", "Here you are. Would you like anything else?"], expect: ["الحساب", "لا", "شكرا", "نعم"], sample: ["لا، شكرا. الحساب من فضلك.", "No, thanks. The bill, please."] },
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
      fr: [
        { say: ["Bonjour ! Ça va ?", "Hello! How are you?"], expect: ["ca va", "bien", "oui", "merci"], sample: ["Ça va bien, merci.", "I am fine, thank you."] },
        { say: ["Très bien. Au revoir !", "Very good. Goodbye!"], expect: ["au revoir", "salut"], sample: ["Au revoir !", "Goodbye!"] },
      ],
      de: [
        { say: ["Hallo! Wie geht's?", "Hi! How are you?"], expect: ["gut", "danke", "mir geht", "schlecht", "super"], sample: ["Gut, danke!", "Good, thanks!"] },
        { say: ["Was machst du heute?", "What are you doing today?"], expect: ["heute", "lerne", "arbeite", "gehe", "ich"], sample: ["Heute lerne ich Deutsch.", "Today I am learning German."] },
        { say: ["Toll! Bis später!", "Great! See you later!"], expect: ["tschüss", "bis später", "bis bald"], sample: ["Bis später!", "See you later!"] },
      ],
      it: [
        { say: ["Ciao! Come va?", "Hi! How's it going?"], expect: ["bene", "grazie", "male", "benissimo"], sample: ["Bene, grazie!", "Good, thanks!"] },
        { say: ["Cosa fai oggi?", "What are you doing today?"], expect: ["oggi", "studio", "lavoro", "vado"], sample: ["Oggi studio l'italiano.", "Today I am studying Italian."] },
        { say: ["Bravo! A dopo!", "Great! See you later!"], expect: ["a dopo", "ciao", "a presto"], sample: ["A dopo!", "See you later!"] },
      ],
      ko: [
        { say: ["안녕하세요! 오늘 어때요?", "Hello! How is your day?"], expect: ["좋아요", "괜찮아요", "잘", "피곤해요"], sample: ["좋아요!", "It's good!"] },
        { say: ["오늘 뭐 해요?", "What are you doing today?"], expect: ["공부해요", "일해요", "배워요", "가요"], sample: ["한국어를 공부해요.", "I am studying Korean."] },
        { say: ["좋아요! 또 만나요.", "Great! See you again."], expect: ["또 만나요", "안녕히", "네"], sample: ["네, 또 만나요!", "Yes, see you again!"] },
      ],
      ru: [
        { say: ["Привет! Как дела?", "Hi! How are you?"], expect: ["хорошо", "нормально", "отлично", "плохо"], sample: ["Хорошо, спасибо!", "Good, thanks!"] },
        { say: ["Что ты делаешь сегодня?", "What are you doing today?"], expect: ["сегодня", "работаю", "учу", "читаю"], sample: ["Сегодня я учу русский.", "Today I am studying Russian."] },
        { say: ["Отлично! До встречи!", "Great! See you!"], expect: ["пока", "до встречи", "до свидания"], sample: ["Пока!", "Bye!"] },
      ],
      ar: [
        { say: ["صباح الخير! كيف حالك اليوم؟", "Good morning! How are you today?"], expect: ["بخير", "الحمد لله", "صباح النور", "تعبان", "شكرا"], sample: ["صباح النور! أنا بخير.", "Good morning! I am fine."] },
        { say: ["ماذا تفعل اليوم؟", "What are you doing today?"], expect: ["اعمل", "ادرس", "اذهب", "اقرا", "اطبخ", "اليوم"], sample: ["اليوم أدرس العربية.", "Today I am studying Arabic."] },
        { say: ["هل عندك إخوة؟", "Do you have brothers or sisters?"], expect: ["عندي", "اخ", "اخت", "لا", "نعم"], sample: ["نعم، عندي أخت.", "Yes, I have a sister."] },
        { say: ["ماذا تحب أن تأكل؟", "What do you like to eat?"], expect: ["احب", "اكل", "سمك", "دجاج", "خبز", "حمص", "فول"], sample: ["أحب السمك والأرز.", "I like fish and rice."] },
        { say: ["رائع! إلى اللقاء.", "Great! See you later."], expect: ["الى اللقاء", "مع السلامة", "شكرا"], sample: ["إلى اللقاء!", "See you later!"] },
      ],
      en: [
        { say: ["Good morning! How are you?", "¡Buenos días! ¿Cómo estás? / सुप्रभात! आप कैसे हैं?"], expect: ["fine", "good", "well"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Good. Would you like water?", "Bien. ¿Quieres agua? / अच्छा। क्या आपको पानी चाहिए?"], expect: ["yes", "no", "please", "thank"], sample: ["Yes, please.", "Sí, por favor. / हाँ, कृपया।"] },
        { say: ["Here you are. Goodbye!", "Aquí tienes. ¡Adiós! / यह लीजिए। अलविदा!"], expect: ["thank", "goodbye", "bye"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
  { id: "shopping", title: "Shopping", emoji: "🛍️", description: "Ask for prices, sizes and colours.", role: "a helpful shop assistant",
    script: {
      es: [
        { say: ["¡Hola! ¿Qué quiere?", "Hello! What would you like?"], expect: ["quiero", "pan", "manzana", "leche", "cafe", "agua"], sample: ["Quiero pan y leche, por favor.", "I want bread and milk, please."] },
        { say: ["Muy bien. ¿Quiere una manzana?", "Very good. Do you want an apple?"], expect: ["si", "no", "gracias", "quiero"], sample: ["Sí, quiero dos, por favor.", "Yes, I want two, please."] },
        { say: ["Aquí tiene. ¡Gracias y adiós!", "Here you are. Thank you and goodbye!"], expect: ["gracias", "adios", "hasta"], sample: ["Gracias, adiós.", "Thank you, goodbye."] },
      ],
      fr: [
        { say: ["Bonjour ! Vous désirez ?", "Hello! What would you like?"], expect: ["bonjour", "s'il vous plait", "un", "une", "je"], sample: ["Bonjour, un café, s'il vous plaît.", "Hello, a coffee, please."] },
        { say: ["Voilà. Merci et au revoir !", "Here you are. Thank you and goodbye!"], expect: ["merci", "au revoir"], sample: ["Merci, au revoir !", "Thank you, goodbye!"] },
      ],
      de: [
        { say: ["Guten Tag! Kann ich Ihnen helfen?", "Good afternoon! Can I help you?"], expect: ["ich suche", "ich möchte", "ja", "bitte"], sample: ["Ja, ich suche ein T-Shirt.", "Yes, I am looking for a T-shirt."] },
        { say: ["Welche Farbe?", "Which colour?"], expect: ["rot", "blau", "schwarz", "weiß", "grün"], sample: ["Blau, bitte.", "Blue, please."] },
        { say: ["Das kostet zehn Euro.", "That costs ten euros."], expect: ["gut", "ich nehme", "okay", "danke"], sample: ["Gut, ich nehme es.", "Good, I'll take it."] },
      ],
      it: [
        { say: ["Buongiorno! Posso aiutarla?", "Good morning! Can I help you?"], expect: ["cerco", "vorrei", "sì"], sample: ["Sì, cerco una maglietta.", "Yes, I am looking for a T-shirt."] },
        { say: ["Di che colore?", "What colour?"], expect: ["rosso", "rossa", "blu", "nero", "nera", "bianco", "bianca", "verde"], sample: ["Blu, per favore.", "Blue, please."] },
        { say: ["Costa dieci euro.", "It costs ten euros."], expect: ["va bene", "la prendo", "lo prendo", "grazie"], sample: ["Va bene, la prendo.", "Okay, I'll take it."] },
      ],
      ko: [
        { say: ["어서 오세요! 뭘 찾으세요?", "Welcome! What are you looking for?"], expect: ["찾아요", "티셔츠", "주세요", "있어요"], sample: ["티셔츠를 찾아요.", "I am looking for a T-shirt."] },
        { say: ["무슨 색이요?", "What colour?"], expect: ["빨간색", "파란색", "검은색", "하얀색", "초록색"], sample: ["파란색 주세요.", "Blue, please."] },
        { say: ["만 원이에요.", "It's ten thousand won."], expect: ["네", "좋아요", "주세요", "감사합니다"], sample: ["네, 이거 주세요.", "Yes, I'll take this."] },
      ],
      ru: [
        { say: ["Здравствуйте! Чем могу помочь?", "Hello! How can I help?"], expect: ["я ищу", "хочу", "футболк", "да"], sample: ["Я ищу футболку.", "I am looking for a T-shirt."] },
        { say: ["Какой цвет?", "What colour?"], expect: ["красн", "син", "чёрн", "бел", "зелён"], sample: ["Синий, пожалуйста.", "Blue, please."] },
        { say: ["Это стоит пятьсот рублей.", "That costs five hundred roubles."], expect: ["хорошо", "беру", "спасибо", "да"], sample: ["Хорошо, я беру.", "Good, I'll take it."] },
      ],
      ar: [
        { say: ["أهلا! ماذا تريد؟", "Hello! What would you like?"], expect: ["اريد", "قميص", "فستان", "حذاء", "معطف", "بنطال"], sample: ["أريد قميصا أبيض.", "I want a white shirt."] },
        { say: ["ما مقاسك؟", "What is your size?"], expect: ["مقاس", "كبير", "صغير", "متوسط", "مقاسي"], sample: ["مقاسي كبير.", "My size is large."] },
        { say: ["أي لون تريد؟", "Which colour would you like?"], expect: ["احمر", "ازرق", "اخضر", "ابيض", "اسود", "لون"], sample: ["أريد اللون الأزرق.", "I want the blue colour."] },
        { say: ["السعر مئة جنيه.", "The price is a hundred pounds."], expect: ["غال", "رخيص", "خصم", "بكم", "طيب", "ادفع", "شكرا"], sample: ["هل يوجد خصم؟", "Is there a discount?"] },
        { say: ["طيب، تسعون جنيها. كيف تدفع؟", "Okay, ninety pounds. How will you pay?"], expect: ["نقدا", "بطاقة", "ادفع"], sample: ["أدفع نقدا.", "I pay in cash."] },
      ],
      en: [
        { say: ["Hello! What would you like?", "¡Hola! ¿Qué quiere? / नमस्ते! आपको क्या चाहिए?"], expect: ["water", "please", "i want", "i would like"], sample: ["Water, please.", "Agua, por favor. / पानी, कृपया।"] },
        { say: ["Here you are. Anything else?", "Aquí tiene. ¿Algo más? / यह लीजिए। और कुछ?"], expect: ["no", "yes", "thank"], sample: ["No, thank you.", "No, gracias. / नहीं, धन्यवाद।"] },
        { say: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"], expect: ["goodbye", "bye", "thank"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
  { id: "airport", title: "Airport", emoji: "✈️", description: "Check in, find your gate and handle delays.", role: "an airline check-in agent",
    script: {
      es: [
        { say: ["Buenos días. ¿Cómo se llama?", "Good morning. What is your name?"], expect: ["me llamo", "soy", "mi nombre"], sample: ["Me llamo Sam.", "My name is Sam."] },
        { say: ["Gracias. ¿Quiere agua o café?", "Thank you. Do you want water or coffee?"], expect: ["agua", "cafe", "quiero", "no", "gracias"], sample: ["Quiero agua, por favor.", "I want water, please."] },
        { say: ["Muy bien. ¡Hasta luego!", "Very good. See you later!"], expect: ["gracias", "hasta", "adios"], sample: ["Gracias. ¡Hasta luego!", "Thank you. See you later!"] },
      ],
      fr: [
        { say: ["Bonjour. Comment vous appelez-vous ?", "Hello. What is your name?"], expect: ["je m'appelle", "je suis"], sample: ["Je m'appelle Sam.", "My name is Sam."] },
        { say: ["Merci. Au revoir !", "Thank you. Goodbye!"], expect: ["merci", "au revoir"], sample: ["Merci, au revoir !", "Thank you, goodbye!"] },
      ],
      ar: [
        { say: ["صباح الخير. جواز سفرك من فضلك.", "Good morning. Your passport, please."], expect: ["تفضل", "تفضلي", "جواز", "نعم", "هذا"], sample: ["تفضل، هذا جواز سفري.", "Here you are, this is my passport."] },
        { say: ["إلى أين تسافر؟", "Where are you travelling to?"], expect: ["الى", "اسافر"], sample: ["أسافر إلى دبي.", "I am travelling to Dubai."] },
        { say: ["كم حقيبة عندك؟", "How many bags do you have?"], expect: ["حقيبة", "واحدة", "اثنتان", "حقيبتان", "عندي", "لا"], sample: ["عندي حقيبة واحدة.", "I have one bag."] },
        { say: ["الرحلة في الساعة الخامسة. رحلة سعيدة!", "The flight is at five o'clock. Have a good trip!"], expect: ["شكرا", "مع السلامة", "الى اللقاء"], sample: ["شكرا جزيلا!", "Thank you very much!"] },
      ],
      en: [
        { say: ["Good morning. What is your name?", "Buenos días. ¿Cómo se llama? / सुप्रभात। आपका नाम क्या है?"], expect: ["my name is", "i am", "i'm"], sample: ["My name is Sam.", "Me llamo Sam. / मेरा नाम सैम है।"] },
        { say: ["Thank you. How are you?", "Gracias. ¿Cómo está? / धन्यवाद। आप कैसे हैं?"], expect: ["fine", "good", "well"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Good. Goodbye!", "Bien. ¡Adiós! / अच्छा। अलविदा!"], expect: ["goodbye", "bye", "thank"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
  { id: "hotel", title: "Hotel", emoji: "🏨", description: "Check in, ask about breakfast and fix a problem.", role: "a hotel receptionist",
    script: {
      es: [
        { say: ["Buenas tardes. ¿Cómo se llama?", "Good afternoon. What is your name?"], expect: ["me llamo", "soy"], sample: ["Buenas tardes. Me llamo Sam.", "Good afternoon. My name is Sam."] },
        { say: ["Mucho gusto. ¿Quiere el desayuno mañana?", "Nice to meet you. Do you want breakfast tomorrow?"], expect: ["si", "no", "quiero", "desayuno", "gracias"], sample: ["Sí, quiero el desayuno, por favor.", "Yes, I want breakfast, please."] },
        { say: ["El desayuno es pan y café. ¡Buenas noches!", "Breakfast is bread and coffee. Good night!"], expect: ["gracias", "buenas noches", "hasta"], sample: ["Gracias. ¡Buenas noches!", "Thank you. Good night!"] },
      ],
      fr: [
        { say: ["Bonsoir. Comment vous appelez-vous ?", "Good evening. What is your name?"], expect: ["je m'appelle", "je suis"], sample: ["Bonsoir, je m'appelle Sam.", "Good evening, my name is Sam."] },
        { say: ["Enchanté. Bonsoir !", "Nice to meet you. Good evening!"], expect: ["merci", "bonsoir"], sample: ["Merci, bonsoir !", "Thank you, good evening!"] },
      ],
      de: [
        { say: ["Guten Abend! Wie ist Ihr Name?", "Good evening! What is your name?"], expect: ["mein name", "ich heiße", "ich bin"], sample: ["Mein Name ist Sam.", "My name is Sam."] },
        { say: ["Danke. Möchten Sie Frühstück?", "Thank you. Would you like breakfast?"], expect: ["ja", "nein", "bitte", "danke"], sample: ["Ja, bitte.", "Yes, please."] },
        { say: ["Ihr Zimmer ist Nummer zwölf. Gute Nacht!", "Your room is number twelve. Good night!"], expect: ["danke", "gute nacht"], sample: ["Danke, gute Nacht!", "Thank you, good night!"] },
      ],
      it: [
        { say: ["Buonasera! Come si chiama?", "Good evening! What is your name?"], expect: ["mi chiamo", "sono"], sample: ["Mi chiamo Sam.", "My name is Sam."] },
        { say: ["Grazie. Vuole la colazione?", "Thank you. Would you like breakfast?"], expect: ["sì", "no", "grazie", "per favore"], sample: ["Sì, per favore.", "Yes, please."] },
        { say: ["La sua camera è la numero dodici. Buonanotte!", "Your room is number twelve. Good night!"], expect: ["grazie", "buonanotte"], sample: ["Grazie, buonanotte!", "Thank you, good night!"] },
      ],
      ko: [
        { say: ["안녕하세요! 성함이 어떻게 되세요?", "Hello! May I have your name?"], expect: ["저는", "예요", "이에요", "입니다"], sample: ["저는 샘이에요.", "I am Sam."] },
        { say: ["감사합니다. 아침 식사 하시겠어요?", "Thank you. Would you like breakfast?"], expect: ["네", "아니요", "주세요", "괜찮아요"], sample: ["네, 주세요.", "Yes, please."] },
        { say: ["방은 십이 호예요. 안녕히 주무세요!", "Your room is number 12. Good night!"], expect: ["감사합니다", "안녕히"], sample: ["감사합니다. 안녕히 주무세요!", "Thank you. Good night!"] },
      ],
      ru: [
        { say: ["Добрый вечер! Как вас зовут?", "Good evening! What is your name?"], expect: ["меня зовут"], sample: ["Меня зовут Сэм.", "My name is Sam."] },
        { say: ["Спасибо. Вы хотите завтрак?", "Thank you. Would you like breakfast?"], expect: ["да", "нет", "пожалуйста", "спасибо"], sample: ["Да, пожалуйста.", "Yes, please."] },
        { say: ["Ваша комната номер двенадцать. Спокойной ночи!", "Your room is number twelve. Good night!"], expect: ["спасибо", "спокойной ночи"], sample: ["Спасибо, спокойной ночи!", "Thank you, good night!"] },
      ],
      ar: [
        { say: ["مساء الخير! هل عندك حجز؟", "Good evening! Do you have a reservation?"], expect: ["نعم", "حجز", "عندي", "باسم", "لا"], sample: ["نعم، عندي حجز باسم سام.", "Yes, I have a reservation under the name Sam."] },
        { say: ["كم ليلة؟", "How many nights?"], expect: ["ليلة", "ليال", "ليلتين", "ثلاث", "واحدة"], sample: ["ثلاث ليال.", "Three nights."] },
        { say: ["هذا المفتاح. الغرفة في الطابق الثاني.", "Here is the key. The room is on the second floor."], expect: ["شكرا", "اين", "الفطور", "متى"], sample: ["شكرا. متى الفطور؟", "Thank you. When is breakfast?"] },
        { say: ["الفطور في الساعة السابعة. هل هناك مشكلة؟", "Breakfast is at seven o'clock. Is there a problem?"], expect: ["المكيف", "لا يعمل", "مشكلة", "لا", "الماء", "شكرا"], sample: ["المكيف لا يعمل.", "The air conditioner doesn't work."] },
        { say: ["آسف! سنصلحه الآن.", "Sorry! We will fix it now."], expect: ["شكرا", "طيب", "لا باس"], sample: ["شكرا جزيلا.", "Thank you very much."] },
      ],
      en: [
        { say: ["Good morning. What is your name?", "Buenos días. ¿Cómo se llama? / सुप्रभात। आपका नाम क्या है?"], expect: ["my name is", "i am", "i'm"], sample: ["My name is Sam.", "Me llamo Sam. / मेरा नाम सैम है।"] },
        { say: ["Would you like water?", "¿Quiere agua? / क्या आपको पानी चाहिए?"], expect: ["yes", "no", "please", "thank"], sample: ["Yes, please.", "Sí, por favor. / हाँ, कृपया।"] },
        { say: ["Here you are. Goodbye!", "Aquí tiene. ¡Adiós! / यह लीजिए। अलविदा!"], expect: ["thank", "goodbye", "bye"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
  { id: "interview", title: "Job interview", emoji: "💼", description: "Talk about your experience and strengths.", role: "a kind interviewer for an entry-level job",
    script: {
      es: [
        { say: ["Buenos días. ¿Cómo se llama?", "Good morning. What is your name?"], expect: ["me llamo", "soy"], sample: ["Buenos días. Me llamo Sam.", "Good morning. My name is Sam."] },
        { say: ["Mucho gusto. ¿Cómo está?", "Nice to meet you. How are you?"], expect: ["bien", "estoy", "gracias"], sample: ["Muy bien, gracias.", "Very well, thank you."] },
        { say: ["¿Usted es simpático y feliz?", "Are you nice and happy?"], expect: ["si", "soy", "feliz", "simpatico"], sample: ["Sí, soy muy feliz.", "Yes, I am very happy."] },
      ],
      fr: [
        { say: ["Bonjour. Comment vous appelez-vous ?", "Hello. What is your name?"], expect: ["je m'appelle", "je suis"], sample: ["Bonjour, je suis Sam.", "Hello, I am Sam."] },
        { say: ["Enchanté. Merci et au revoir.", "Nice to meet you. Thank you and goodbye."], expect: ["merci", "au revoir"], sample: ["Merci, au revoir.", "Thank you, goodbye."] },
      ],
      en: [
        { say: ["Hello. What is your name?", "Hola. ¿Cómo se llama? / नमस्ते। आपका नाम क्या है?"], expect: ["my name is", "i am", "i'm"], sample: ["Hello. My name is Sam.", "Hola. Me llamo Sam. / नमस्ते। मेरा नाम सैम है।"] },
        { say: ["Nice to meet you. How are you?", "Mucho gusto. ¿Cómo está? / आपसे मिलकर खुशी हुई। आप कैसे हैं?"], expect: ["fine", "good", "well"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"], expect: ["thank", "goodbye", "bye"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
  { id: "university", title: "University", emoji: "🎓", description: "Meet classmates and talk about your studies.", role: "a fellow student on the first day of class",
    script: {
      es: [
        { say: ["¡Hola! Soy Ana. ¿Y tú?", "Hi! I am Ana. And you?"], expect: ["soy", "me llamo"], sample: ["Hola, Ana. Yo soy Sam.", "Hi, Ana. I am Sam."] },
        { say: ["Mucho gusto. ¿Tienes un amigo aquí?", "Nice to meet you. Do you have a friend here?"], expect: ["si", "no", "tengo", "amigo", "amiga"], sample: ["No, no tengo un amigo aquí.", "No, I don't have a friend here."] },
        { say: ["¡Yo soy tu amiga! Hasta mañana.", "I am your friend! See you tomorrow."], expect: ["hasta", "gracias", "manana", "adios"], sample: ["¡Gracias! Hasta mañana.", "Thank you! See you tomorrow."] },
      ],
      fr: [
        { say: ["Salut ! Je suis Léa. Et toi ?", "Hi! I am Léa. And you?"], expect: ["je suis", "je m'appelle"], sample: ["Salut, je suis Sam.", "Hi, I am Sam."] },
        { say: ["Enchantée ! Au revoir !", "Nice to meet you! Goodbye!"], expect: ["au revoir", "salut", "enchante"], sample: ["Enchanté ! Au revoir !", "Nice to meet you! Goodbye!"] },
      ],
      en: [
        { say: ["Hi! I am Ana. And you?", "¡Hola! Soy Ana. ¿Y tú? / नमस्ते! मैं एना हूँ। और आप?"], expect: ["i am", "i'm", "my name is"], sample: ["Hello, Ana. I am Sam.", "Hola, Ana. Soy Sam. / नमस्ते, एना। मैं सैम हूँ।"] },
        { say: ["Nice to meet you. You are my friend!", "Mucho gusto. ¡Eres mi amigo! / आप मेरे दोस्त हैं!"], expect: ["thank", "friend", "you are"], sample: ["Thank you! You are my friend.", "¡Gracias! Eres mi amiga. / धन्यवाद! आप मेरे दोस्त हैं।"] },
        { say: ["Goodbye!", "¡Adiós! / अलविदा!"], expect: ["goodbye", "bye"], sample: ["Goodbye!", "¡Adiós! / अलविदा!"] },
      ],
    } },
  { id: "travel", title: "Travel", emoji: "🧭", description: "Ask for directions and buy tickets.", role: "a local helping a lost traveller",
    script: {
      es: [
        { say: ["¡Hola! ¿Estás bien?", "Hello! Are you OK?"], expect: ["si", "no", "estoy", "bien", "gracias"], sample: ["Sí, estoy bien, gracias.", "Yes, I am fine, thank you."] },
        { say: ["¿Quieres un restaurante o un café?", "Do you want a restaurant or a café?"], expect: ["quiero", "restaurante", "cafe"], sample: ["Quiero un restaurante, por favor.", "I want a restaurant, please."] },
        { say: ["El restaurante es muy bueno. ¡Adiós!", "The restaurant is very good. Goodbye!"], expect: ["gracias", "adios", "hasta"], sample: ["Muchas gracias. ¡Adiós!", "Thank you very much. Goodbye!"] },
      ],
      fr: [
        { say: ["Bonjour ! Ça va ?", "Hello! Are you OK?"], expect: ["oui", "non", "ca va", "merci"], sample: ["Oui, merci.", "Yes, thank you."] },
        { say: ["Très bien. Au revoir !", "Very good. Goodbye!"], expect: ["au revoir", "merci"], sample: ["Merci, au revoir !", "Thank you, goodbye!"] },
      ],
      de: [
        { say: ["Hallo! Wohin fährst du?", "Hi! Where are you travelling to?"], expect: ["nach", "ich fahre"], sample: ["Ich fahre nach Berlin.", "I am going to Berlin."] },
        { say: ["Schön! Mit dem Zug?", "Nice! By train?"], expect: ["ja", "nein", "zug", "bus", "auto"], sample: ["Ja, mit dem Zug.", "Yes, by train."] },
        { say: ["Gute Reise!", "Have a good trip!"], expect: ["danke", "tschüss"], sample: ["Danke! Tschüss!", "Thanks! Bye!"] },
      ],
      it: [
        { say: ["Ciao! Dove vai?", "Hi! Where are you going?"], expect: ["vado", "roma", "milano"], sample: ["Vado a Roma.", "I am going to Rome."] },
        { say: ["Bello! In treno?", "Nice! By train?"], expect: ["sì", "no", "treno", "autobus", "macchina"], sample: ["Sì, in treno.", "Yes, by train."] },
        { say: ["Buon viaggio!", "Have a good trip!"], expect: ["grazie", "ciao"], sample: ["Grazie! Ciao!", "Thanks! Bye!"] },
      ],
      ko: [
        { say: ["안녕하세요! 어디에 가요?", "Hello! Where are you going?"], expect: ["가요", "서울", "부산"], sample: ["서울에 가요.", "I am going to Seoul."] },
        { say: ["좋아요! 기차로 가요?", "Nice! Are you going by train?"], expect: ["네", "아니요", "기차", "버스"], sample: ["네, 기차로 가요.", "Yes, I am going by train."] },
        { say: ["즐거운 여행 되세요!", "Have a good trip!"], expect: ["감사합니다", "고마워요"], sample: ["감사합니다!", "Thank you!"] },
      ],
      ru: [
        { say: ["Привет! Куда ты едешь?", "Hi! Where are you going?"], expect: ["еду", "москв", "петербург"], sample: ["Я еду в Москву.", "I am going to Moscow."] },
        { say: ["Здорово! На поезде?", "Great! By train?"], expect: ["да", "нет", "поезд", "автобус"], sample: ["Да, на поезде.", "Yes, by train."] },
        { say: ["Счастливого пути!", "Have a good trip!"], expect: ["спасибо", "пока"], sample: ["Спасибо! Пока!", "Thanks! Bye!"] },
      ],
      ar: [
        { say: ["هل تحتاج مساعدة؟", "Do you need help?"], expect: ["نعم", "اين", "من فضلك", "عفوا"], sample: ["نعم، أين محطة القطار؟", "Yes, where is the train station?"] },
        { say: ["المحطة قريبة. اذهب مباشرة ثم يسارا.", "The station is near. Go straight ahead, then left."], expect: ["شكرا", "بعيد", "قريب", "مشيا", "كم"], sample: ["شكرا. هل هي بعيدة؟", "Thank you. Is it far?"] },
        { say: ["لا، خمس دقائق مشيا. إلى أين تسافر؟", "No, five minutes on foot. Where are you travelling to?"], expect: ["الى", "اسافر", "اذهب"], sample: ["أسافر إلى الإسكندرية.", "I am travelling to Alexandria."] },
        { say: ["التذكرة من الشباك هناك.", "The ticket is from the window over there."], expect: ["تذكرة", "بكم", "شكرا", "اريد"], sample: ["أريد تذكرة واحدة من فضلك.", "I want one ticket, please."] },
        { say: ["رحلة سعيدة!", "Have a good trip!"], expect: ["شكرا", "مع السلامة", "الى اللقاء"], sample: ["شكرا، مع السلامة!", "Thanks, goodbye!"] },
      ],
      en: [
        { say: ["Hello! How are you?", "¡Hola! ¿Cómo estás? / नमस्ते! आप कैसे हैं?"], expect: ["fine", "good", "well"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Would you like water?", "¿Quieres agua? / क्या आपको पानी चाहिए?"], expect: ["yes", "no", "please", "thank"], sample: ["Yes, please.", "Sí, por favor. / हाँ, कृपया।"] },
        { say: ["Here you are. Goodbye!", "Aquí tienes. ¡Adiós! / यह लीजिए। अलविदा!"], expect: ["thank", "goodbye", "bye"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
];
export const getScenario = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
export const hasScript = (s: Scenario, target: LangCode) => !!s.script?.[target]?.length;
