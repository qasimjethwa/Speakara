import { buildCourse } from "../types";

/**
 * Arabic (Modern Standard Arabic) for English speakers: ten units of five lessons, beginner (A1) to elementary (A2).
 * Words are shown with short-vowel marks (harakat) as a reading aid. Sentences in unit 1 are fully marked; later
 * sentences are written as ordinary Arabic is printed, without marks. Answer checking ignores the marks, so learners
 * may type with or without them. Original, author-written content: native-speaker review pending.
 * Stable IDs: never renumber or reorder units, lessons, words or sentences; append only.
 */
const review = "Author-written; native-speaker review pending";
const license = "CC BY-SA 4.0 — original Speakara content";

export const arEn = buildCourse(
  { id: "ar-en", target: "ar", native: "en", title: "Arabic", targetName: "Arabic", nativeName: "English", flag: "🇸🇦", ttsLang: "ar-SA", sttLang: "ar-SA", status: "complete-unit-set", license, review },
  [
    { id: "ar1", title: "التَّحِيّات", objective: "Greet people, say thank you and introduce yourself", cefr: "A1", color: "brand",
      tips: [
        { title: "Right to left, joined up", body: "Arabic is written from right to left, and most letters join the letter after them, so a letter changes shape at the start, middle and end of a word. You read the first word of a sentence on the right.", examples: [{ t: "مَرْحَبًا", n: "hello" }, { t: "شُكْرًا", n: "thank you" }] },
        { title: "Short vowels (harakat)", body: "The small marks above and below letters are short vowels: fatha ( َ ) is a, kasra ( ِ ) is i and damma ( ُ ) is u. Sukun ( ْ ) means no vowel and shadda ( ّ ) doubles a letter. Everyday Arabic usually leaves them out. Speakara shows them on new words and accepts your answers with or without them.", examples: [{ t: "كَيْفَ", n: "how (kayfa)" }, { t: "جِدًّا", n: "very (jiddan)" }] },
        { title: "You: man or woman?", body: "Arabic has a different “you” for a man (أَنْتَ, anta) and a woman (أَنْتِ, anti). Endings change too: حالُكَ (to a man) and حالُكِ (to a woman).", examples: [{ t: "كَيْفَ حالُكَ؟", n: "How are you? (to a man)" }, { t: "كَيْفَ حالُكِ؟", n: "How are you? (to a woman)" }] },
      ],
      lessons: [
        { title: "مَرْحَبًا", words: [["مَرْحَبًا", "hello"], ["أَهْلًا", "hi, welcome"], ["نَعَمْ", "yes"], ["لا", "no"], ["شُكْرًا", "thank you"], ["مِنْ فَضْلِكَ", "please"]],
          sentences: [["أَهْلًا وَسَهْلًا!", "Welcome!"], ["نَعَمْ، شُكْرًا.", "Yes, thank you.", ["Yes, thanks."]], ["لا، شُكْرًا.", "No, thank you.", ["No, thanks."]], ["مَرْحَبًا، شُكْرًا جَزِيلًا.", "Hello, thank you very much.", ["Hello, thanks a lot."]]] },
        { title: "السَّلامُ عَلَيْكُمْ", words: [["السَّلامُ عَلَيْكُمْ", "peace be upon you (hello)"], ["وَعَلَيْكُمُ السَّلامُ", "and upon you peace (reply)"], ["صَباحُ الخَيْرِ", "good morning"], ["صَباحُ النُّورِ", "good morning (reply)"], ["مَساءُ الخَيْرِ", "good evening"], ["مَعَ السَّلامَةِ", "goodbye"]],
          sentences: [["صَباحُ الخَيْرِ يا سارَة.", "Good morning, Sara.", ["Good morning Sara."]], ["مَساءُ الخَيْرِ يا أُسْتاذ.", "Good evening, sir.", ["Good evening, teacher."]], ["السَّلامُ عَلَيْكُمْ.", "Peace be upon you.", ["Hello."]], ["شُكْرًا، مَعَ السَّلامَةِ!", "Thank you, goodbye!", ["Thanks, goodbye!"]]] },
        { title: "كَيْفَ الحالُ؟", words: [["كَيْفَ", "how"], ["بِخَيْرٍ", "fine, well"], ["الحَمْدُ لِلَّهِ", "thank God"], ["وَأَنْتَ", "and you (to a man)"], ["وَأَنْتِ", "and you (to a woman)"], ["جِدًّا", "very"]],
          sentences: [["كَيْفَ حالُكَ؟", "How are you?", ["How are you doing?"]], ["أَنا بِخَيْرٍ، الحَمْدُ لِلَّهِ.", "I am fine, thank God.", ["I'm fine, thank God.", "I am well, thank God."]], ["بِخَيْرٍ، شُكْرًا. وَأَنْتَ؟", "Fine, thanks. And you?", ["Well, thanks. And you?", "Fine, thank you. And you?"]], ["أَنا بِخَيْرٍ جِدًّا.", "I am very well.", ["I'm very well.", "I am very fine."]]] },
        { title: "ما اسْمُكَ؟", words: [["اِسْمِي", "my name"], ["ما", "what"], ["اِسْمُكَ", "your name (to a man)"], ["أَنا", "I"], ["تَشَرَّفْنا", "nice to meet you"], ["أَيْضًا", "also, too"]],
          sentences: [["ما اسْمُكَ؟", "What is your name?", ["What's your name?"]], ["اسْمِي سارَة.", "My name is Sara.", ["I am Sara.", "I'm Sara."]], ["أَنا عُمَر.", "I am Omar.", ["I'm Omar."]], ["تَشَرَّفْنا يا عُمَر!", "Nice to meet you, Omar!", ["Nice to meet you Omar!"]]] },
        { title: "كَلِمات مُهَذَّبَة", words: [["عَفْوًا", "you're welcome, excuse me"], ["آسِفٌ", "sorry"], ["لا بَأْسَ", "no problem"], ["تَفَضَّلْ", "here you are, go ahead"], ["طَيِّب", "okay"], ["إِلى اللِّقاءِ", "see you later"]],
          sentences: [["عَفْوًا، لا بَأْسَ.", "You're welcome, no problem.", ["You are welcome, no problem."]], ["أَنا آسِفٌ.", "I am sorry.", ["I'm sorry."]], ["تَفَضَّلْ يا أَحْمَد.", "Here you are, Ahmad.", ["Go ahead, Ahmad."]], ["طَيِّب، إِلى اللِّقاءِ!", "Okay, see you later!", ["OK, see you later!"]]] },
      ],
      story: {
        id: "ar1-story", title: "مَرْحَبًا يا سارَة", summary: "Omar meets Sara for the first time.",
        lines: [
          { speaker: "Omar", t: "السَّلامُ عَلَيْكُمْ!", n: "Peace be upon you!" },
          { speaker: "Sara", t: "وَعَلَيْكُمُ السَّلامُ!", n: "And upon you peace!" },
          { speaker: "Omar", t: "ما اسْمُكِ؟", n: "What is your name?" },
          { speaker: "Sara", t: "اسْمِي سارَة. وَأَنْتَ؟", n: "My name is Sara. And you?" },
          { speaker: "Omar", t: "أَنا عُمَر. تَشَرَّفْنا!", n: "I am Omar. Nice to meet you!" },
          { speaker: "Sara", t: "كَيْفَ حالُكَ يا عُمَر؟", n: "How are you, Omar?" },
          { speaker: "Omar", t: "بِخَيْرٍ، الحَمْدُ لِلَّهِ.", n: "Fine, thank God." },
          { speaker: "Sara", t: "مَعَ السَّلامَةِ!", n: "Goodbye!" },
        ],
        questions: [
          { afterLine: 3, prompt: "What is the woman's name?", options: ["Sara", "Mona", "Laila"], answer: 0 },
          { afterLine: 6, prompt: "How is Omar?", options: ["Tired", "Fine", "Sad"], answer: 1 },
        ],
      } },

    { id: "ar2", title: "التَّعارُف", objective: "Say where you are from, which languages you speak and what you do", cefr: "A1", color: "sky",
      tips: [
        { title: "No “is” in the present", body: "Arabic does not use a word for am, is or are in the present. Put the two ideas side by side: أنا طالب is “I (am) a student”.", examples: [{ t: "أنا طالب.", n: "I am a student." }, { t: "هو مصري.", n: "He is Egyptian." }] },
        { title: "The feminine ending ة", body: "Most words for women end in ة (ta marbuta), said -a. Add it to describe a woman: طالب (male student), طالبة (female student).", examples: [{ t: "هي طالبة.", n: "She is a student." }, { t: "هي مصرية.", n: "She is Egyptian." }] },
        { title: "Nationalities with ـيّ", body: "Add -iyy (ـي) to a country to make a nationality: مصر (Egypt) → مصري (Egyptian). Drop ال first: المغرب → مغربي.", examples: [{ t: "أنا مغربي.", n: "I am Moroccan." }] },
      ],
      lessons: [
        { title: "مِنْ أَيْنَ أَنْتَ؟", words: [["مِصْر", "Egypt"], ["لُبْنان", "Lebanon"], ["المَغْرِب", "Morocco"], ["أَمْرِيكا", "America"], ["بَرِيطانِيا", "Britain"], ["مِنْ", "from"]],
          sentences: [["أنا من مصر.", "I am from Egypt.", ["I'm from Egypt."]], ["هل أنت من لبنان؟", "Are you from Lebanon?"], ["لا، أنا من المغرب.", "No, I am from Morocco.", ["No, I'm from Morocco."]], ["سارة من بريطانيا.", "Sara is from Britain.", ["Sara is from the UK."]]] },
        { title: "الجِنْسِيّات", words: [["مِصْرِيّ", "Egyptian (man)"], ["مِصْرِيَّة", "Egyptian (woman)"], ["عَرَبِيّ", "Arab, Arabic (man)"], ["أَمْرِيكِيّ", "American (man)"], ["هُوَ", "he"], ["هِيَ", "she"]],
          sentences: [["هو مصري.", "He is Egyptian.", ["He's Egyptian."]], ["هي مصرية.", "She is Egyptian.", ["She's Egyptian."]], ["أنا أمريكي.", "I am American.", ["I'm American."]], ["هل هي عربية؟", "Is she Arab?", ["Is she Arabic?"]]] },
        { title: "اللُّغات", words: [["اللُّغَة", "the language"], ["العَرَبِيَّة", "Arabic"], ["الإِنْجِلِيزِيَّة", "English"], ["أَتَكَلَّمُ", "I speak"], ["تَتَكَلَّمُ", "you speak (to a man)"], ["قَلِيلًا", "a little"]],
          sentences: [["أتكلم العربية قليلا.", "I speak a little Arabic.", ["I speak Arabic a little."]], ["هل تتكلم الإنجليزية؟", "Do you speak English?"], ["نعم، أتكلم الإنجليزية.", "Yes, I speak English."], ["اللغة العربية جميلة.", "The Arabic language is beautiful.", ["Arabic is beautiful.", "The Arabic language is pretty."]]] },
        { title: "العَمَل", words: [["طالِب", "student (man)"], ["طالِبَة", "student (woman)"], ["مُعَلِّم", "teacher"], ["طَبِيب", "doctor"], ["مُهَنْدِس", "engineer"], ["أَعْمَلُ", "I work"]],
          sentences: [["أنا طالب.", "I am a student.", ["I'm a student."]], ["هي طالبة.", "She is a student.", ["She's a student."]], ["هو معلم في المدرسة.", "He is a teacher at the school.", ["He is a teacher in the school.", "He's a teacher at the school."]], ["أعمل طبيبا.", "I work as a doctor."]] },
        { title: "أَيْنَ تَسْكُنُ؟", words: [["أَسْكُنُ", "I live"], ["تَسْكُنُ", "you live (to a man)"], ["فِي", "in"], ["مَدِينَة", "city"], ["أَيْنَ", "where"], ["القاهِرَة", "Cairo"]],
          sentences: [["أين تسكن؟", "Where do you live?"], ["أسكن في القاهرة.", "I live in Cairo."], ["القاهرة مدينة كبيرة.", "Cairo is a big city.", ["Cairo is a large city."]], ["أسكن في مدينة صغيرة.", "I live in a small city.", ["I live in a small town."]]] },
      ],
      story: {
        id: "ar2-story", title: "في الجامعة", summary: "Laila and Sam meet on the first day at university.",
        lines: [
          { speaker: "Laila", t: "مرحبا، أنا ليلى.", n: "Hello, I am Laila." },
          { speaker: "Sam", t: "أهلا يا ليلى، أنا سام.", n: "Hi Laila, I am Sam." },
          { speaker: "Laila", t: "من أين أنت يا سام؟", n: "Where are you from, Sam?" },
          { speaker: "Sam", t: "أنا من أمريكا. وأنت؟", n: "I am from America. And you?" },
          { speaker: "Laila", t: "أنا من لبنان. أنا طالبة.", n: "I am from Lebanon. I am a student." },
          { speaker: "Sam", t: "هل تتكلمين الإنجليزية؟", n: "Do you speak English?" },
          { speaker: "Laila", t: "نعم، قليلا.", n: "Yes, a little." },
        ],
        questions: [
          { afterLine: 3, prompt: "Where is Sam from?", options: ["Lebanon", "America", "Egypt"], answer: 1 },
          { afterLine: 4, prompt: "What does Laila do?", options: ["She is a doctor", "She is a student", "She is a teacher"], answer: 1 },
        ],
      } },

    { id: "ar3", title: "العائِلَة", objective: "Talk about your family and describe people", cefr: "A1", color: "grape",
      tips: [
        { title: "My, your, his, her", body: "Possession is an ending on the noun: ـي my, ـكَ your (man), ـكِ your (woman), ـه his, ـها her. A word ending in ة changes it to ت before the ending: عائلة → عائلتي.", examples: [{ t: "أبي", n: "my father" }, { t: "عائلتي كبيرة.", n: "My family is big." }] },
        { title: "هذا and هذه", body: "Use هذا (hadha) for a man or a masculine thing and هذه (hadhihi) for a woman or a feminine thing.", examples: [{ t: "هذا أبي.", n: "This is my father." }, { t: "هذه أمي.", n: "This is my mother." }] },
        { title: "Adjectives agree", body: "An adjective comes after the noun and takes ة when the noun is feminine.", examples: [{ t: "أخي طويل.", n: "My brother is tall." }, { t: "أختي طويلة.", n: "My sister is tall." }] },
      ],
      lessons: [
        { title: "أَبِي وَأُمِّي", words: [["أَب", "father"], ["أُمّ", "mother"], ["أَخ", "brother"], ["أُخْت", "sister"], ["عائِلَة", "family"], ["هَذا", "this (masculine)"]],
          sentences: [["هذا أبي.", "This is my father."], ["هذه أمي.", "This is my mother."], ["عندي أخ وأخت.", "I have a brother and a sister."], ["عائلتي كبيرة.", "My family is big.", ["My family is large."]]] },
        { title: "الأَبْناء", words: [["اِبْن", "son"], ["بِنْت", "daughter, girl"], ["زَوْج", "husband"], ["زَوْجَة", "wife"], ["طِفْل", "child"], ["عِنْدِي", "I have"]],
          sentences: [["عندي ابن وبنت.", "I have a son and a daughter."], ["زوجتي طبيبة.", "My wife is a doctor."], ["هل عندك أطفال؟", "Do you have children?", ["Do you have kids?"]], ["زوجي مهندس.", "My husband is an engineer."]] },
        { title: "جَدِّي وَجَدَّتِي", words: [["جَدّ", "grandfather"], ["جَدَّة", "grandmother"], ["عَمّ", "uncle (father's brother)"], ["خال", "uncle (mother's brother)"], ["كَبِير", "big, old"], ["صَغِير", "small, young"]],
          sentences: [["جدي كبير في السن.", "My grandfather is old.", ["My grandfather is elderly."]], ["أختي صغيرة.", "My sister is young.", ["My sister is little.", "My sister is small."]], ["عمي يسكن في دمشق.", "My uncle lives in Damascus."], ["جدتي لطيفة جدا.", "My grandmother is very kind.", ["My grandmother is very nice."]]] },
        { title: "الوَصْف", words: [["طَوِيل", "tall, long"], ["قَصِير", "short"], ["لَطِيف", "kind, nice"], ["سَعِيد", "happy"], ["جَمِيل", "beautiful"], ["ذَكِيّ", "clever"]],
          sentences: [["أخي طويل.", "My brother is tall."], ["البنت ذكية.", "The girl is clever.", ["The girl is smart."]], ["هو سعيد جدا.", "He is very happy.", ["He's very happy."]], ["البيت جميل.", "The house is beautiful.", ["The house is pretty.", "The house is nice."]]] },
        { title: "كَمْ؟", words: [["كَمْ", "how many"], ["واحِد", "one"], ["اِثْنان", "two"], ["ثَلاثَة", "three"], ["وَلَد", "boy"], ["أَوْلاد", "children, boys"]],
          sentences: [["كم أخا عندك؟", "How many brothers do you have?"], ["عندي أخ واحد.", "I have one brother."], ["عندها ثلاثة أولاد.", "She has three children.", ["She has three boys.", "She has three kids."]], ["عندنا بنتان.", "We have two daughters.", ["We have two girls."]]] },
      ],
      story: {
        id: "ar3-story", title: "صورة العائلة", summary: "Laila shows Sam a family photo.",
        lines: [
          { speaker: "Sam", t: "من هذا يا ليلى؟", n: "Who is this, Laila?" },
          { speaker: "Laila", t: "هذا أبي. هو طبيب.", n: "This is my father. He is a doctor." },
          { speaker: "Sam", t: "وهذه؟", n: "And this (woman)?" },
          { speaker: "Laila", t: "هذه أمي. هي معلمة.", n: "This is my mother. She is a teacher." },
          { speaker: "Sam", t: "هل عندك إخوة؟", n: "Do you have brothers and sisters?" },
          { speaker: "Laila", t: "نعم، عندي أخ واحد وأختان.", n: "Yes, I have one brother and two sisters." },
          { speaker: "Sam", t: "عائلتك كبيرة!", n: "Your family is big!" },
        ],
        questions: [
          { afterLine: 1, prompt: "What does Laila's father do?", options: ["He is a doctor", "He is an engineer", "He is a student"], answer: 0 },
          { afterLine: 5, prompt: "How many sisters does Laila have?", options: ["One", "Two", "Three"], answer: 1 },
        ],
      } },

    { id: "ar4", title: "الأَرْقام وَالوَقْت", objective: "Count, give your age, tell the time and name the days", cefr: "A1", color: "sun",
      tips: [
        { title: "Two sets of digits", body: "Arabic is written right to left, but numbers are read left to right. Many Arab countries use the digits ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩; others use 0–9.", examples: [{ t: "١٠", n: "10" }, { t: "٢٥", n: "25" }] },
        { title: "Telling the time", body: "Use الساعة (the hour) with an ordinal number: الساعة الثالثة is three o'clock. Add والنصف for half past and والربع for quarter past.", examples: [{ t: "الساعة الخامسة والنصف.", n: "It is half past five." }] },
        { title: "Numbers 3 to 10 flip gender", body: "With a counted noun, 3 to 10 take the opposite gender: ثلاثة أولاد (three boys) but ثلاث بنات (three girls). Don't worry about getting it perfect yet.", examples: [{ t: "عندها ثلاثة أولاد.", n: "She has three children." }] },
      ],
      lessons: [
        { title: "الأَرْقام", words: [["أَرْبَعَة", "four"], ["خَمْسَة", "five"], ["سِتَّة", "six"], ["سَبْعَة", "seven"], ["ثَمانِيَة", "eight"], ["عَشَرَة", "ten"]],
          sentences: [["عندي خمسة كتب.", "I have five books."], ["هذا رقم سبعة.", "This is number seven."], ["عندنا ستة أطفال.", "We have six children.", ["We have six kids."]], ["أربعة وأربعة ثمانية.", "Four and four is eight.", ["Four plus four is eight."]]] },
        { title: "كَمْ عُمْرُكَ؟", words: [["عُمْر", "age"], ["سَنَة", "year"], ["عُمْرِي", "my age"], ["عِشْرُون", "twenty"], ["ثَلاثُون", "thirty"], ["سَبْعُون", "seventy"]],
          sentences: [["كم عمرك؟", "How old are you?"], ["عمري عشرون سنة.", "I am twenty years old.", ["I'm twenty years old.", "I am twenty."]], ["أختي عمرها سبع سنوات.", "My sister is seven years old.", ["My sister is seven."]], ["عمر جدي سبعون سنة.", "My grandfather is seventy years old.", ["My grandfather is seventy."]]] },
        { title: "كَمِ السّاعَة؟", words: [["السّاعَة", "the hour, the time, the clock"], ["الآن", "now"], ["نِصْف", "half"], ["رُبْع", "quarter"], ["إِلّا", "to (minus), except"], ["دَقِيقَة", "minute"]],
          sentences: [["كم الساعة الآن؟", "What time is it now?", ["What time is it?"]], ["الساعة الثالثة.", "It is three o'clock.", ["It's three o'clock."]], ["الساعة الخامسة والنصف.", "It is half past five.", ["It's half past five."]], ["الساعة العاشرة والربع.", "It is quarter past ten.", ["It's quarter past ten.", "It is a quarter past ten."]]] },
        { title: "الأَيّام", words: [["اليَوْم", "today, the day"], ["غَدًا", "tomorrow"], ["أَمْس", "yesterday"], ["يَوْم الجُمُعَة", "Friday"], ["يَوْم السَّبْت", "Saturday"], ["يَوْم الأَحَد", "Sunday"]],
          sentences: [["اليوم يوم الجمعة.", "Today is Friday."], ["غدا يوم السبت.", "Tomorrow is Saturday."], ["أمس كان يوم الخميس.", "Yesterday was Thursday."], ["أعمل يوم الأحد.", "I work on Sunday.", ["I work on Sundays."]]] },
        { title: "الصَّباح وَالمَساء", words: [["صَباح", "morning"], ["مَساء", "evening"], ["لَيْل", "night"], ["ظُهْر", "noon"], ["أُسْبُوع", "week"], ["كُلّ", "every, all"]],
          sentences: [["أعمل في الصباح.", "I work in the morning."], ["نلتقي في المساء.", "We meet in the evening."], ["أدرس كل يوم.", "I study every day."], ["الأسبوع سبعة أيام.", "A week is seven days.", ["The week has seven days."]]] },
      ],
      story: {
        id: "ar4-story", title: "مَوْعِد", summary: "Omar checks the time before his lesson.",
        lines: [
          { speaker: "Omar", t: "كم الساعة الآن؟", n: "What time is it now?" },
          { speaker: "Sara", t: "الساعة الرابعة.", n: "It is four o'clock." },
          { speaker: "Omar", t: "عندي درس في الساعة الخامسة.", n: "I have a lesson at five o'clock." },
          { speaker: "Sara", t: "هل عندك درس كل يوم؟", n: "Do you have a lesson every day?" },
          { speaker: "Omar", t: "لا، يوم الأحد ويوم الثلاثاء فقط.", n: "No, only on Sunday and Tuesday." },
          { speaker: "Sara", t: "واليوم يوم الثلاثاء!", n: "And today is Tuesday!" },
          { speaker: "Omar", t: "نعم، إلى اللقاء!", n: "Yes, see you later!" },
        ],
        questions: [
          { afterLine: 2, prompt: "When is Omar's lesson?", options: ["At four", "At five", "At six"], answer: 1 },
          { afterLine: 5, prompt: "What day is it today?", options: ["Sunday", "Tuesday", "Friday"], answer: 1 },
        ],
      } },

    { id: "ar5", title: "في المَقْهَى", objective: "Order food and drink, say you are hungry and pay the bill", cefr: "A1", color: "coral",
      tips: [
        { title: "Sun and moon letters", body: "ال (al-) means “the”. Before “sun letters” such as ش, س, ت and ن, the l is not said and the next letter is doubled: الشاي is ash-shay. Before “moon letters” such as ق and ح, you say it: القهوة is al-qahwa.", examples: [{ t: "الشاي", n: "the tea (ash-shay)" }, { t: "القهوة", n: "the coffee (al-qahwa)" }] },
        { title: "I want", body: "أريد + a noun asks for something. أريد أن + a verb says what you want to do.", examples: [{ t: "أريد قهوة من فضلك.", n: "I want coffee, please." }, { t: "أريد أن أدفع الآن.", n: "I want to pay now." }] },
        { title: "Hungry and thirsty", body: "These are adjectives, so a woman adds ة: جوعان / جوعانة, عطشان / عطشانة.", examples: [{ t: "أنا جوعان.", n: "I am hungry. (man)" }, { t: "أنا جوعانة.", n: "I am hungry. (woman)" }] },
      ],
      lessons: [
        { title: "المَشْرُوبات", words: [["قَهْوَة", "coffee"], ["شاي", "tea"], ["ماء", "water"], ["حَلِيب", "milk"], ["عَصِير", "juice"], ["أُرِيدُ", "I want"]],
          sentences: [["أريد قهوة من فضلك.", "I want coffee, please.", ["I would like coffee, please.", "I want a coffee, please."]], ["شاي بالحليب، من فضلك.", "Tea with milk, please."], ["الماء بارد.", "The water is cold."], ["هل عندكم عصير برتقال؟", "Do you have orange juice?"]] },
        { title: "الفُطُور", words: [["خُبْز", "bread"], ["جُبْن", "cheese"], ["بَيْض", "eggs"], ["فُول", "fava beans"], ["حُمُّص", "hummus"], ["آكُلُ", "I eat"]],
          sentences: [["آكل الخبز والجبن.", "I eat bread and cheese.", ["I eat the bread and the cheese."]], ["الفول لذيذ.", "The beans are delicious.", ["The beans are tasty.", "The fava beans are delicious."]], ["أريد بيضا وخبزا.", "I want eggs and bread."], ["الحمص طيب جدا.", "The hummus is very good.", ["The hummus is very tasty."]]] },
        { title: "جَوْعان", words: [["جَوْعان", "hungry"], ["عَطْشان", "thirsty"], ["لَذِيذ", "delicious"], ["حارّ", "hot"], ["بارِد", "cold"], ["أَشْرَبُ", "I drink"]],
          sentences: [["أنا جوعان.", "I am hungry.", ["I'm hungry."]], ["أنا عطشان جدا.", "I am very thirsty.", ["I'm very thirsty."]], ["الشاي حار.", "The tea is hot."], ["أشرب الماء كل يوم.", "I drink water every day."]] },
        { title: "في المَطْعَم", words: [["مَطْعَم", "restaurant"], ["طاوِلَة", "table"], ["قائِمَة الطَّعام", "menu"], ["نادِل", "waiter"], ["دَجاج", "chicken"], ["سَمَك", "fish"]],
          sentences: [["طاولة لشخصين من فضلك.", "A table for two, please."], ["أريد قائمة الطعام.", "I want the menu.", ["I would like the menu."]], ["أريد الدجاج مع الأرز.", "I want the chicken with rice.", ["I want chicken with rice."]], ["السمك لذيذ في هذا المطعم.", "The fish is delicious in this restaurant.", ["The fish in this restaurant is delicious."]]] },
        { title: "الحِساب", words: [["الحِساب", "the bill"], ["بِكَمْ", "how much (price)"], ["دِرْهَم", "dirham"], ["نُقُود", "money"], ["أَدْفَعُ", "I pay"], ["بَعْدَ", "after"]],
          sentences: [["الحساب من فضلك.", "The bill, please.", ["The check, please."]], ["بكم القهوة؟", "How much is the coffee?"], ["القهوة بعشرة دراهم.", "The coffee is ten dirhams.", ["The coffee costs ten dirhams."]], ["أريد أن أدفع الآن.", "I want to pay now.", ["I would like to pay now."]]] },
      ],
      story: {
        id: "ar5-story", title: "في المطعم", summary: "Sara and Omar order dinner.",
        lines: [
          { speaker: "Waiter", t: "أهلا وسهلا! تفضلوا.", n: "Welcome! Please come in." },
          { speaker: "Sara", t: "طاولة لشخصين من فضلك.", n: "A table for two, please." },
          { speaker: "Waiter", t: "ماذا تريدين؟", n: "What would you like?" },
          { speaker: "Sara", t: "أريد السمك والأرز.", n: "I want the fish and rice." },
          { speaker: "Omar", t: "وأنا أريد الدجاج وعصير برتقال.", n: "And I want the chicken and an orange juice." },
          { speaker: "Waiter", t: "حاضر.", n: "Certainly." },
          { speaker: "Omar", t: "الطعام لذيذ جدا!", n: "The food is very delicious!" },
        ],
        questions: [
          { afterLine: 3, prompt: "What does Sara order?", options: ["Chicken", "Fish and rice", "Hummus"], answer: 1 },
          { afterLine: 4, prompt: "What does Omar drink?", options: ["Tea", "Coffee", "Orange juice"], answer: 2 },
        ],
      } },

    { id: "ar6", title: "البَيْت", objective: "Describe your home and say where things are", cefr: "A1", color: "brand",
      tips: [
        { title: "There is: يوجد", body: "يوجد means “there is” and لا يوجد “there isn't”. In speech you will also hear فيه.", examples: [{ t: "يوجد كلب في الحديقة.", n: "There is a dog in the garden." }] },
        { title: "The house is new / the new house", body: "When both words have ال, the adjective describes the noun: البيت الجديد (the new house). When only the noun has ال, you have a sentence: البيت جديد (the house is new).", examples: [{ t: "البيت جديد.", n: "The house is new." }] },
        { title: "Where things are", body: "Place words go before the noun: تحت السرير (under the bed), بجانب الشباك (next to the window).", examples: [{ t: "القطة تحت السرير.", n: "The cat is under the bed." }] },
      ],
      lessons: [
        { title: "الغُرَف", words: [["بَيْت", "house"], ["شَقَّة", "apartment"], ["غُرْفَة", "room"], ["مَطْبَخ", "kitchen"], ["حَمّام", "bathroom"], ["باب", "door"]],
          sentences: [["بيتي صغير.", "My house is small."], ["عندي شقة في المدينة.", "I have an apartment in the city.", ["I have a flat in the city."]], ["المطبخ كبير.", "The kitchen is big.", ["The kitchen is large."]], ["أين الحمام؟", "Where is the bathroom?", ["Where is the toilet?"]]] },
        { title: "الأَثاث", words: [["سَرِير", "bed"], ["كُرْسِيّ", "chair"], ["مَكْتَب", "desk, office"], ["شُبّاك", "window"], ["كِتاب", "book"], ["عَلَى", "on"]],
          sentences: [["الكتاب على المكتب.", "The book is on the desk."], ["في الغرفة سرير وكرسي.", "In the room there is a bed and a chair.", ["There is a bed and a chair in the room."]], ["الشباك مفتوح.", "The window is open."], ["الكرسي في المطبخ.", "The chair is in the kitchen."]] },
        { title: "أَيْنَ؟", words: [["تَحْتَ", "under"], ["فَوْقَ", "above"], ["أَمامَ", "in front of"], ["وَراءَ", "behind"], ["بِجانِبِ", "next to"], ["هُناكَ", "there"]],
          sentences: [["القطة تحت السرير.", "The cat is under the bed."], ["المكتب بجانب الشباك.", "The desk is next to the window."], ["السيارة أمام البيت.", "The car is in front of the house."], ["الحديقة وراء البيت.", "The garden is behind the house."]] },
        { title: "يُوجَدُ", words: [["يُوجَدُ", "there is"], ["لا يُوجَدُ", "there isn't"], ["حَدِيقَة", "garden"], ["سَيّارَة", "car"], ["قِطَّة", "cat"], ["كَلْب", "dog"]],
          sentences: [["يوجد كلب في الحديقة.", "There is a dog in the garden."], ["لا يوجد ماء.", "There is no water.", ["There isn't any water."]], ["هل يوجد مطبخ في الشقة؟", "Is there a kitchen in the apartment?", ["Is there a kitchen in the flat?"]], ["عندنا قطة صغيرة.", "We have a small cat.", ["We have a little cat."]]] },
        { title: "جَدِيد وَقَدِيم", words: [["جَدِيد", "new"], ["قَدِيم", "old"], ["نَظِيف", "clean"], ["واسِع", "spacious, wide"], ["مَفْتُوح", "open"], ["مُغْلَق", "closed"]],
          sentences: [["البيت جديد ونظيف.", "The house is new and clean."], ["الشقة قديمة لكن واسعة.", "The apartment is old but spacious.", ["The flat is old but spacious."]], ["الباب مغلق.", "The door is closed.", ["The door is shut."]], ["الغرفة نظيفة جدا.", "The room is very clean."]] },
      ],
      story: {
        id: "ar6-story", title: "شقة جديدة", summary: "Laila tells Sam about her new apartment.",
        lines: [
          { speaker: "Laila", t: "عندي شقة جديدة!", n: "I have a new apartment!" },
          { speaker: "Sam", t: "مبروك! أين هي؟", n: "Congratulations! Where is it?" },
          { speaker: "Laila", t: "في وسط المدينة، بجانب الجامعة.", n: "In the city centre, next to the university." },
          { speaker: "Sam", t: "هل هي كبيرة؟", n: "Is it big?" },
          { speaker: "Laila", t: "لا، فيها غرفتان ومطبخ صغير.", n: "No, it has two rooms and a small kitchen." },
          { speaker: "Sam", t: "هل يوجد شباك كبير؟", n: "Is there a big window?" },
          { speaker: "Laila", t: "نعم، والشقة نظيفة جدا.", n: "Yes, and the apartment is very clean." },
        ],
        questions: [
          { afterLine: 2, prompt: "Where is the apartment?", options: ["Next to the university", "Behind the restaurant", "Near the airport"], answer: 0 },
          { afterLine: 4, prompt: "How many rooms does it have?", options: ["One", "Two", "Three"], answer: 1 },
        ],
      } },

    { id: "ar7", title: "المَدِينَة", objective: "Find places in town, ask the way and use transport", cefr: "A2", color: "sky",
      tips: [
        { title: "إلى and في", body: "إلى means “to” (movement) and في means “in” or “at” (place).", examples: [{ t: "أذهب إلى السوق.", n: "I go to the market." }, { t: "أنا في السوق.", n: "I am at the market." }] },
        { title: "Question words", body: "متى when, لماذا why, ماذا what (with a verb), ما what (without a verb), من who, أين where. هل turns a statement into a yes/no question.", examples: [{ t: "متى يفتح البنك؟", n: "When does the bank open?" }] },
        { title: "Who is doing it? Look at the start of the verb", body: "In the present tense the first letter shows the person: أ I, ت you or she, ي he, ن we. أذهب I go, تذهب you go, يذهب he goes, نذهب we go.", examples: [{ t: "نذهب إلى المطار.", n: "We go to the airport." }] },
      ],
      lessons: [
        { title: "الأَماكِن", words: [["شارِع", "street"], ["سُوق", "market"], ["مَسْجِد", "mosque"], ["مُسْتَشْفَى", "hospital"], ["مَدْرَسَة", "school"], ["بَنْك", "bank"]],
          sentences: [["السوق في هذا الشارع.", "The market is on this street.", ["The market is in this street."]], ["أين المستشفى من فضلك؟", "Where is the hospital, please?"], ["المدرسة بجانب المسجد.", "The school is next to the mosque."], ["البنك مغلق اليوم.", "The bank is closed today."]] },
        { title: "الاِتِّجاهات", words: [["يَمِين", "right"], ["يَسار", "left"], ["مُباشَرَةً", "straight ahead"], ["قَرِيب", "near"], ["بَعِيد", "far"], ["اِذْهَبْ", "go (to a man)"]],
          sentences: [["اذهب مباشرة ثم يمينا.", "Go straight ahead, then right.", ["Go straight, then right."]], ["البنك على اليسار.", "The bank is on the left."], ["السوق قريب من هنا.", "The market is near here.", ["The market is close to here."]], ["هل المطار بعيد؟", "Is the airport far?", ["Is the airport far away?"]]] },
        { title: "المُواصَلات", words: [["حافِلَة", "bus"], ["قِطار", "train"], ["تاكْسِي", "taxi"], ["مَحَطَّة", "station"], ["مَطار", "airport"], ["مَشْيًا", "on foot"]],
          sentences: [["أذهب إلى العمل بالحافلة.", "I go to work by bus."], ["أين محطة القطار؟", "Where is the train station?"], ["نذهب إلى المطار بالتاكسي.", "We go to the airport by taxi."], ["أذهب إلى المدرسة مشيا.", "I go to school on foot.", ["I walk to school."]]] },
        { title: "أَسْئِلَة", words: [["مَتَى", "when"], ["لِماذا", "why"], ["ماذا", "what"], ["مَنْ", "who"], ["هَلْ", "(yes/no question word)"], ["أَيّ", "which"]],
          sentences: [["متى يفتح البنك؟", "When does the bank open?"], ["ماذا تريد؟", "What do you want?", ["What would you like?"]], ["من هذا الرجل؟", "Who is this man?"], ["لماذا أنت هنا؟", "Why are you here?"]] },
        { title: "زِيارَة المَدِينَة", words: [["مَتْحَف", "museum"], ["فُنْدُق", "hotel"], ["مَكْتَبَة", "library, bookshop"], ["سِينَما", "cinema"], ["نَهْر", "river"], ["بَحْر", "sea"]],
          sentences: [["المتحف قريب من الفندق.", "The museum is near the hotel.", ["The museum is close to the hotel."]], ["أقرأ في المكتبة.", "I read in the library."], ["نهر النيل طويل جدا.", "The Nile river is very long.", ["The River Nile is very long.", "The Nile is very long."]], ["نذهب إلى السينما في المساء.", "We go to the cinema in the evening.", ["We go to the movies in the evening."]]] },
      ],
      story: {
        id: "ar7-story", title: "في المدينة", summary: "Sam asks the way to the museum.",
        lines: [
          { speaker: "Sam", t: "عفوا، أين المتحف؟", n: "Excuse me, where is the museum?" },
          { speaker: "Man", t: "المتحف قريب. اذهب مباشرة.", n: "The museum is near. Go straight ahead." },
          { speaker: "Sam", t: "ثم؟", n: "And then?" },
          { speaker: "Man", t: "ثم يسارا. المتحف بجانب البنك.", n: "Then left. The museum is next to the bank." },
          { speaker: "Sam", t: "هل أذهب مشيا أم بالحافلة؟", n: "Should I walk or take the bus?" },
          { speaker: "Man", t: "مشيا، خمس دقائق فقط.", n: "Walk, it's only five minutes." },
          { speaker: "Sam", t: "شكرا جزيلا!", n: "Thank you very much!" },
        ],
        questions: [
          { afterLine: 3, prompt: "What is next to the museum?", options: ["The bank", "The hotel", "The school"], answer: 0 },
          { afterLine: 5, prompt: "How long is the walk?", options: ["Two minutes", "Five minutes", "Ten minutes"], answer: 1 },
        ],
      } },

    { id: "ar8", title: "التَّسَوُّق", objective: "Name colours and clothes, ask prices and pay in a shop or market", cefr: "A2", color: "grape",
      tips: [
        { title: "Colour words have their own feminine", body: "Colours use a special pattern: أحمر becomes حمراء for a feminine noun, أزرق becomes زرقاء, أبيض becomes بيضاء.", examples: [{ t: "السيارة حمراء.", n: "The car is red." }, { t: "القميص أزرق.", n: "The shirt is blue." }] },
        { title: "The -an ending", body: "After أريد and other verbs an indefinite noun takes the ending -an, written with an extra ا: قميص → أريد قميصا.", examples: [{ t: "أريد قميصا أبيض.", n: "I want a white shirt." }] },
        { title: "Cheaper", body: "Comparatives use the pattern أفعل: رخيص (cheap) → أرخص (cheaper), كبير → أكبر.", examples: [{ t: "هل عندك شيء أرخص؟", n: "Do you have something cheaper?" }] },
      ],
      lessons: [
        { title: "الأَلْوان", words: [["أَحْمَر", "red"], ["أَزْرَق", "blue"], ["أَخْضَر", "green"], ["أَبْيَض", "white"], ["أَسْوَد", "black"], ["لَوْن", "colour"]],
          sentences: [["السيارة حمراء.", "The car is red."], ["القميص أزرق.", "The shirt is blue."], ["ما لونك المفضل؟", "What is your favourite colour?", ["What is your favorite color?", "What's your favourite colour?"]], ["لوني المفضل أخضر.", "My favourite colour is green.", ["My favorite color is green."]]] },
        { title: "المَلابِس", words: [["قَمِيص", "shirt"], ["فُسْتان", "dress"], ["حِذاء", "shoes"], ["بِنْطال", "trousers"], ["مِعْطَف", "coat"], ["مَقاس", "size"]],
          sentences: [["أريد قميصا أبيض.", "I want a white shirt.", ["I would like a white shirt."]], ["هذا الفستان جميل.", "This dress is beautiful.", ["This dress is pretty."]], ["ما مقاسك؟", "What is your size?", ["What size are you?"]], ["المعطف الأسود غال.", "The black coat is expensive."]] },
        { title: "الأَسْعار", words: [["غالٍ", "expensive"], ["رَخِيص", "cheap"], ["سِعْر", "price"], ["خَصْم", "discount"], ["جُنَيْه", "pound (money)"], ["مِئَة", "hundred"]],
          sentences: [["هذا غال جدا!", "This is very expensive!"], ["هل عندك شيء أرخص؟", "Do you have something cheaper?", ["Do you have anything cheaper?"]], ["السعر مئة جنيه.", "The price is a hundred pounds.", ["The price is one hundred pounds."]], ["هل يوجد خصم؟", "Is there a discount?"]] },
        { title: "في المَحَلّ", words: [["أَشْتَرِي", "I buy"], ["مَحَلّ", "shop"], ["كِيس", "bag"], ["بِطاقَة", "card"], ["نَقْدًا", "in cash"], ["فاكِهَة", "fruit"]],
          sentences: [["أشتري الفاكهة من السوق.", "I buy fruit from the market.", ["I buy fruit at the market."]], ["هل تقبلون البطاقة؟", "Do you accept cards?", ["Do you take cards?", "Do you accept card?"]], ["أدفع نقدا.", "I pay in cash.", ["I pay cash."]], ["أريد كيسا من فضلك.", "I want a bag, please.", ["I would like a bag, please."]]] },
        { title: "في السُّوق", words: [["تُفّاح", "apples"], ["مَوْز", "bananas"], ["بُرْتُقال", "oranges"], ["طَماطِم", "tomatoes"], ["بَطاطِس", "potatoes"], ["كِيلُو", "kilo"]],
          sentences: [["أريد كيلو تفاح.", "I want a kilo of apples.", ["I would like a kilo of apples."]], ["الموز رخيص اليوم.", "The bananas are cheap today.", ["Bananas are cheap today."]], ["بكم كيلو الطماطم؟", "How much is a kilo of tomatoes?"], ["أشتري البرتقال والبطاطس.", "I buy oranges and potatoes.", ["I buy the oranges and the potatoes."]]] },
      ],
      story: {
        id: "ar8-story", title: "في السوق", summary: "Sara buys fruit at the market.",
        lines: [
          { speaker: "Sara", t: "صباح الخير. بكم التفاح؟", n: "Good morning. How much are the apples?" },
          { speaker: "Seller", t: "عشرة جنيهات الكيلو.", n: "Ten pounds a kilo." },
          { speaker: "Sara", t: "والموز؟", n: "And the bananas?" },
          { speaker: "Seller", t: "الموز رخيص اليوم، خمسة جنيهات.", n: "Bananas are cheap today, five pounds." },
          { speaker: "Sara", t: "أريد كيلو تفاح وكيلو موز.", n: "I want a kilo of apples and a kilo of bananas." },
          { speaker: "Seller", t: "تفضلي. خمسة عشر جنيها.", n: "Here you are. Fifteen pounds." },
          { speaker: "Sara", t: "شكرا، أدفع نقدا.", n: "Thanks, I will pay in cash." },
        ],
        questions: [
          { afterLine: 1, prompt: "How much is a kilo of apples?", options: ["Five pounds", "Ten pounds", "Fifteen pounds"], answer: 1 },
          { afterLine: 6, prompt: "How does Sara pay?", options: ["By card", "In cash", "She doesn't pay"], answer: 1 },
        ],
      } },

    { id: "ar9", title: "يَوْمِي", objective: "Describe your daily routine, meals and what you like", cefr: "A2", color: "sun",
      tips: [
        { title: "Present tense: he, she, we, they", body: "The present tense adds a prefix (and sometimes an ending) to the verb stem: يذهب he goes, تذهب she goes, نذهب we go, يذهبون they go.", examples: [{ t: "هو يذهب إلى المدرسة.", n: "He goes to school." }, { t: "هي تعمل في المستشفى.", n: "She works at the hospital." }] },
        { title: "Don't: لا", body: "Put لا before a present-tense verb to make it negative.", examples: [{ t: "لا أحب القهوة.", n: "I don't like coffee." }] },
        { title: "Likes take ال", body: "After أحب (I like), a general noun takes ال: أحب الموسيقى (I like music).", examples: [{ t: "أحب الموسيقى العربية.", n: "I like Arabic music." }] },
      ],
      lessons: [
        { title: "الصَّباح", words: [["أَسْتَيْقِظُ", "I wake up"], ["أَنامُ", "I sleep"], ["أَذْهَبُ", "I go"], ["أَرْجِعُ", "I return"], ["مُبَكِّرًا", "early"], ["مُتَأَخِّرًا", "late"]],
          sentences: [["أستيقظ مبكرا كل يوم.", "I wake up early every day.", ["I get up early every day."]], ["أذهب إلى العمل في الساعة الثامنة.", "I go to work at eight o'clock.", ["I go to work at eight."]], ["أرجع إلى البيت في المساء.", "I return home in the evening.", ["I come back home in the evening.", "I go back home in the evening."]], ["أنام متأخرا.", "I sleep late.", ["I go to bed late."]]] },
        { title: "الدِّراسَة", words: [["أَدْرُسُ", "I study"], ["أَقْرَأُ", "I read"], ["أَكْتُبُ", "I write"], ["أَطْبُخُ", "I cook"], ["رِسالَة", "letter, message"], ["جَرِيدَة", "newspaper"]],
          sentences: [["أدرس العربية في الجامعة.", "I study Arabic at the university.", ["I study Arabic at university."]], ["أقرأ الجريدة في الصباح.", "I read the newspaper in the morning."], ["أكتب رسالة إلى أمي.", "I am writing a letter to my mother.", ["I write a letter to my mother.", "I'm writing a letter to my mother."]], ["أطبخ العشاء كل مساء.", "I cook dinner every evening."]] },
        { title: "الوَجَبات", words: [["فُطُور", "breakfast"], ["غَداء", "lunch"], ["عَشاء", "dinner"], ["أَرُزّ", "rice"], ["لَحْم", "meat"], ["خُضار", "vegetables"]],
          sentences: [["آكل الفطور في البيت.", "I eat breakfast at home.", ["I have breakfast at home."]], ["الغداء في الساعة الثانية.", "Lunch is at two o'clock.", ["Lunch is at two."]], ["نأكل الأرز واللحم.", "We eat rice and meat.", ["We eat the rice and the meat."]], ["أحب الخضار كثيرا.", "I like vegetables a lot.", ["I love vegetables."]]] },
        { title: "أُحِبُّ", words: [["أُحِبُّ", "I like, I love"], ["لا أُحِبُّ", "I don't like"], ["كَثِيرًا", "a lot"], ["رِياضَة", "sport"], ["مُوسِيقَى", "music"], ["كُرَة القَدَم", "football"]],
          sentences: [["أحب الموسيقى العربية.", "I like Arabic music.", ["I love Arabic music."]], ["لا أحب القهوة.", "I don't like coffee.", ["I do not like coffee."]], ["هل تحب كرة القدم؟", "Do you like football?", ["Do you like soccer?"]], ["أخي يحب الرياضة كثيرا.", "My brother likes sport a lot.", ["My brother loves sport.", "My brother likes sports a lot."]]] },
        { title: "هُوَ وَهِيَ", words: [["يَذْهَبُ", "he goes"], ["تَذْهَبُ", "she goes, you go"], ["يَعْمَلُ", "he works"], ["تَعْمَلُ", "she works, you work"], ["نَحْنُ", "we"], ["هُمْ", "they"]],
          sentences: [["هو يذهب إلى المدرسة.", "He goes to school.", ["He goes to the school."]], ["هي تعمل في المستشفى.", "She works at the hospital.", ["She works in the hospital."]], ["نحن ندرس معا.", "We study together."], ["هم يسكنون في القاهرة.", "They live in Cairo."]] },
      ],
      story: {
        id: "ar9-story", title: "يوم عمر", summary: "Omar describes an ordinary day.",
        lines: [
          { speaker: "Omar", t: "أستيقظ في الساعة السابعة.", n: "I wake up at seven o'clock." },
          { speaker: "Omar", t: "آكل الفطور وأشرب الشاي.", n: "I eat breakfast and drink tea." },
          { speaker: "Omar", t: "ثم أذهب إلى العمل بالحافلة.", n: "Then I go to work by bus." },
          { speaker: "Omar", t: "أعمل مهندسا في شركة كبيرة.", n: "I work as an engineer in a big company." },
          { speaker: "Omar", t: "في المساء أطبخ العشاء وأقرأ كتابا.", n: "In the evening I cook dinner and read a book." },
          { speaker: "Omar", t: "أنام في الساعة الحادية عشرة.", n: "I go to sleep at eleven o'clock." },
        ],
        questions: [
          { afterLine: 2, prompt: "How does Omar go to work?", options: ["By train", "By bus", "On foot"], answer: 1 },
          { afterLine: 3, prompt: "What is Omar's job?", options: ["Teacher", "Doctor", "Engineer"], answer: 2 },
        ],
      } },

    { id: "ar10", title: "السَّفَر وَالطَّقْس", objective: "Talk about the weather and seasons, travel, stay in a hotel and say what you did", cefr: "A2", color: "coral",
      tips: [
        { title: "The past tense: -tu for I", body: "Past-tense verbs add endings: ذهبتُ I went, ذهبتَ you went (man), ذهبَ he went, ذهبتْ she went.", examples: [{ t: "ذهبت إلى السوق أمس.", n: "I went to the market yesterday." }] },
        { title: "كان: was", body: "كان (he/it was) and كانت (she/it was) put a description in the past. The adjective after it takes the -an ending: كان الطقس جميلا.", examples: [{ t: "كان الطقس جميلا.", n: "The weather was nice." }] },
        { title: "Talking about the weather", body: "الجو and الطقس both mean the weather. ينزل المطر is “it rains” (literally “the rain comes down”).", examples: [{ t: "الجو مشمس وحار.", n: "It is sunny and hot." }] },
      ],
      lessons: [
        { title: "الطَّقْس", words: [["الطَّقْس", "the weather"], ["شَمْس", "sun"], ["مَطَر", "rain"], ["رِياح", "wind"], ["غائِم", "cloudy"], ["مُشْمِس", "sunny"]],
          sentences: [["الطقس جميل اليوم.", "The weather is nice today.", ["The weather is beautiful today."]], ["الجو مشمس وحار.", "It is sunny and hot.", ["It's sunny and hot.", "The weather is sunny and hot."]], ["هل ينزل المطر كثيرا هنا؟", "Does it rain a lot here?"], ["اليوم غائم وفيه رياح.", "Today is cloudy and windy.", ["It is cloudy and windy today."]]] },
        { title: "الفُصُول", words: [["صَيْف", "summer"], ["شِتاء", "winter"], ["رَبِيع", "spring"], ["خَرِيف", "autumn"], ["فَصْل", "season"], ["بَرْد", "cold (weather)"]],
          sentences: [["الصيف حار في مصر.", "Summer is hot in Egypt.", ["The summer is hot in Egypt."]], ["أحب فصل الربيع.", "I like the spring season.", ["I love spring.", "I like spring."]], ["الشتاء بارد في لبنان.", "Winter is cold in Lebanon.", ["The winter is cold in Lebanon."]], ["في الخريف ينزل المطر.", "In autumn it rains.", ["It rains in autumn.", "In the fall it rains."]]] },
        { title: "السَّفَر", words: [["سَفَر", "travel"], ["جَواز سَفَر", "passport"], ["تَذْكِرَة", "ticket"], ["حَقِيبَة", "suitcase, bag"], ["رِحْلَة", "trip, flight"], ["أُسافِرُ", "I travel"]],
          sentences: [["أسافر إلى دبي غدا.", "I travel to Dubai tomorrow.", ["I am travelling to Dubai tomorrow.", "I am traveling to Dubai tomorrow.", "I'm travelling to Dubai tomorrow."]], ["أين جواز سفرك؟", "Where is your passport?"], ["عندي تذكرة واحدة.", "I have one ticket."], ["الرحلة طويلة جدا.", "The trip is very long.", ["The flight is very long.", "The journey is very long."]]] },
        { title: "ماذا فَعَلْتَ؟", words: [["ذَهَبْتُ", "I went"], ["أَكَلْتُ", "I ate"], ["شَرِبْتُ", "I drank"], ["رَأَيْتُ", "I saw"], ["زُرْتُ", "I visited"], ["كانَ", "was"]],
          sentences: [["ذهبت إلى السوق أمس.", "I went to the market yesterday."], ["أكلت السمك في المطعم.", "I ate fish at the restaurant.", ["I ate fish in the restaurant.", "I ate the fish at the restaurant."]], ["زرت المتحف مع أختي.", "I visited the museum with my sister."], ["كان الطقس جميلا.", "The weather was nice.", ["The weather was beautiful."]]] },
        { title: "في الفُنْدُق", words: [["حَجْز", "reservation"], ["لَيْلَة", "night"], ["مِفْتاح", "key"], ["اِسْتِقْبال", "reception"], ["مُشْكِلَة", "problem"], ["مُكَيِّف", "air conditioner"]],
          sentences: [["عندي حجز باسم سارة.", "I have a reservation under the name Sara.", ["I have a reservation in the name of Sara.", "I have a booking under the name Sara."]], ["أريد غرفة لثلاث ليال.", "I want a room for three nights.", ["I would like a room for three nights."]], ["أين المفتاح من فضلك؟", "Where is the key, please?"], ["المكيف لا يعمل.", "The air conditioner doesn't work.", ["The air conditioner does not work.", "The air conditioner isn't working."]]] },
      ],
      story: {
        id: "ar10-story", title: "رحلة إلى عمّان", summary: "Sara tells Omar about her trip to Amman.",
        lines: [
          { speaker: "Sara", t: "سافرت إلى عمّان في الربيع.", n: "I travelled to Amman in the spring." },
          { speaker: "Omar", t: "كيف كانت الرحلة؟", n: "How was the trip?" },
          { speaker: "Sara", t: "كانت جميلة جدا. زرت المتحف والسوق.", n: "It was very nice. I visited the museum and the market." },
          { speaker: "Omar", t: "وكيف كان الطقس؟", n: "And how was the weather?" },
          { speaker: "Sara", t: "كان مشمسا، لكن الليل كان باردا.", n: "It was sunny, but the nights were cold." },
          { speaker: "Omar", t: "ماذا أكلت؟", n: "What did you eat?" },
          { speaker: "Sara", t: "أكلت المنسف. كان لذيذا!", n: "I ate mansaf. It was delicious!" },
        ],
        questions: [
          { afterLine: 2, prompt: "What did Sara visit?", options: ["The museum and the market", "The hospital", "The university"], answer: 0 },
          { afterLine: 4, prompt: "How was the weather at night?", options: ["Hot", "Cold", "Rainy"], answer: 1 },
        ],
      } },
  ],
);
