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
      en: [
        { say: ["Hello! How are you?", "¡Hola! ¿Cómo estás? / नमस्ते! आप कैसे हैं?"], expect: ["fine", "good", "well"], sample: ["I am fine, thank you.", "Estoy bien, gracias. / मैं ठीक हूँ, धन्यवाद।"] },
        { say: ["Would you like water?", "¿Quieres agua? / क्या आपको पानी चाहिए?"], expect: ["yes", "no", "please", "thank"], sample: ["Yes, please.", "Sí, por favor. / हाँ, कृपया।"] },
        { say: ["Here you are. Goodbye!", "Aquí tienes. ¡Adiós! / यह लीजिए। अलविदा!"], expect: ["thank", "goodbye", "bye"], sample: ["Thank you. Goodbye!", "Gracias. ¡Adiós! / धन्यवाद। अलविदा!"] },
      ],
    } },
];
export const getScenario = (id: string) => SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
export const hasScript = (s: Scenario, target: LangCode) => !!s.script?.[target]?.length;
