require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in environment variables.");
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const useOpenAI =
  process.env.USE_OPENAI === "true" && !!process.env.OPENAI_API_KEY;

const client = useOpenAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// =========================
// DATA
// =========================
const org = {
  name: "Oakland College",
  address:
    "Behind Mall of Arabia - El Fairouz District, First 6th of October, Giza Governorate 3236140",
  phone: "012 03800011",
  contactPhoneIntl: "+20120380 0011",
  systems: "British & American",
  applicationLink:
    "https://docs.google.com/forms/d/e/1FAIpQLSesLIR0xgGpXwJLKL-2eTMv05eZdbHRWmPnvgWYZn8FBCWSGw/viewform?usp=sharing&ouid=103198229964772601584",
  hrEmail: "info@oaklandegypt.com",
  facebook: "https://m.facebook.com/Oakland.Egy/",
  instagram: "https://www.instagram.com/oakland.college",
  website: "https://oakland-egypt.com/about/"
};

const jobs = {
  english_primary: {
    title: "English Teacher (Y5–Y6)",
    requirements: [
      "Bachelor’s degree in English, Education, or related field",
      "Strong English proficiency (spoken & written)",
      "Experience with primary students preferred",
      "Ability to simplify concepts and engage young learners",
      "Classroom management skills"
    ]
  },
  english_high: {
    title: "English Teacher (High School)",
    requirements: [
      "Bachelor’s degree in English / Education",
      "Strong grammar, literature, and writing skills",
      "Previous experience teaching high school",
      "Ability to prepare students for exams",
      "Strong communication and presentation skills"
    ]
  },
  ict: {
    title: "ICT Teacher (Elementary & Middle School)",
    requirements: [
      "Degree in Computer Science, IT, or related field",
      "Basic programming knowledge (Scratch, Python is a plus)",
      "Ability to teach fundamentals (Word, PowerPoint, internet safety)",
      "Experience with young students",
      "Good communication and patience"
    ]
  },
  pe: {
    title: "PE Teacher",
    requirements: [
      "Degree in Physical Education or related field",
      "Knowledge of sports activities and physical fitness",
      "Ability to manage groups and ensure safety",
      "Energetic and motivating personality"
    ]
  },
  co_teacher: {
    title: "Co-Teacher (Assistant Teacher)",
    requirements: [
      "Relevant degree or currently studying (Education preferred)",
      "Good English communication",
      "Ability to support lead teacher",
      "Organized and patient"
    ]
  },
  robotics: {
    title: "Robotics Instructor",
    requirements: [
      "Background in Robotics, Engineering, or Mechatronics",
      "Experience with kits (LEGO, Arduino, etc.)",
      "Basic programming skills",
      "Ability to teach kids in a fun, interactive way"
    ]
  },
  ai: {
    title: "AI Instructor",
    requirements: [
      "Background in AI, Computer Science, or Data Science",
      "Knowledge of basic AI concepts (ML, simple models)",
      "Ability to simplify complex ideas",
      "Teaching or training experience is a plus"
    ]
  },
  automation: {
    title: "Automation Engineer",
    requirements: [
      "Degree in Engineering (Mechatronics, Electrical, etc.)",
      "Knowledge of automation systems (PLC, sensors, control systems)",
      "Problem-solving skills",
      "Industry or project experience preferred"
    ]
  }
};

const userStates = new Map();

// =========================
// STATIC TEXTS
// =========================
const welcomeEnglish = `Welcome to Oakland Assistant 🤖

We are a school offering the American and British systems with internationally aligned curricula and a strong focus on creativity, critical thinking, and lifelong learning.
I can help with jobs, applications, student admission, and general inquiries.
You can message in Arabic or English.

You can ask about:
- jobs / positions
- requirements
- apply / application
- location
- admission
- HR
- contact us
- Facebook / Instagram / website
- recommend a role`;

const welcomeArabic = `مرحبًا بك في Oakland Assistant 🤖

نحن مدرسة تقدم النظامين الأمريكي والبريطاني مع مناهج متوافقة دوليًا وتركيز قوي على الإبداع والتفكير النقدي والتعلم المستمر.
أقدر أساعدك في الوظائف، التقديم، القبول، والاستفسارات العامة.
تقدر تكتب بالعربي أو بالإنجليزي.

ممكن تسأل عن:
- الوظائف
- الشروط
- التقديم
- المكان
- القبول
- HR
- تواصل معنا
- فيسبوك / إنستجرام / الموقع
- رشحلي وظيفة`;

const positionsText = `We are currently hiring for the following roles 👇

- English Teachers (Primary & High School)
- ICT Teachers
- PE Teacher
- Co-Teachers
- Robotics Instructors
- AI Instructors
- Automation Engineers

Which role are you interested in?`;

const positionsArabicText = `الوظائف المتاحة حاليًا 👇

- مدرس/ة English (Primary & High School)
- ICT Teacher
- PE Teacher
- Co-Teacher
- Robotics Instructor
- AI Instructor
- Automation Engineer

قوليلي أنهي وظيفة حابة تعرفي عنها أكتر؟`;

const locationText = `Our location is 📍
${org.address}

Phone: ${org.phone}`;

const locationArabicText = `مكان Oakland College 📍
${org.address}

رقم الهاتف: ${org.phone}`;

const applyText = `You can apply through the official application form 👇
${org.applicationLink}

Please make sure to upload your CV before submitting.`;

const applyArabicText = `تقدري تقدمي من خلال لينك التقديم الرسمي 👇
${org.applicationLink}

اتأكدي من رفع الـ CV قبل الإرسال.`;

const contactUsText = `You can contact us on ${org.contactPhoneIntl}`;
const contactUsArabicText = `يمكنك التواصل معنا على ${org.contactPhoneIntl}`;

const admissionText = `For student admission, you can contact us on ${org.contactPhoneIntl}`;
const admissionArabicText = `للاستفسار عن القبول، يمكنك التواصل معنا على ${org.contactPhoneIntl}`;

const hrText = `For HR inquiries, please send your message to ${org.hrEmail}`;
const hrArabicText = `لاستفسارات الـ HR، من فضلك ابعتي على الإيميل ده ${org.hrEmail}`;

const socialText = `Here are our official links 👇

📱 Facebook: ${org.facebook}
📸 Instagram: ${org.instagram}
🌐 Website: ${org.website}`;

const socialArabicText = `الروابط الرسمية بتاعتنا 👇

📱 فيسبوك: ${org.facebook}
📸 إنستجرام: ${org.instagram}
🌐 الموقع: ${org.website}`;

const unknownInfoText = `This detail is not confirmed yet.

You can ask about:
- available positions
- requirements
- location
- application
- fresh graduates
- recommend a role
- admission
- HR
- contact us`;

const unknownInfoArabicText = `المعلومة دي غير مؤكدة عندي حاليًا.

ممكن تسأليني عن:
- الوظائف المتاحة
- شروط كل وظيفة
- المكان
- طريقة التقديم
- هل fresh graduates ينفعوا
- ترشيح وظيفة مناسبة
- القبول
- HR
- تواصل معنا`;

// =========================
// OPENAI SYSTEM PROMPT
// =========================
const openaiSystemPrompt = `
You are Oakland Assistant, the official AI assistant for Oakland College.

Your job:
Help users understand:
- available positions
- requirements
- location
- application process
- whether fresh graduates may apply
- role recommendations based on background
- student admission
- HR contact
- social/contact links
- general school inquiries

Confirmed organization information:
- Name: ${org.name}
- Address: ${org.address}
- Phone: ${org.phone}
- Contact phone: ${org.contactPhoneIntl}
- Educational systems: ${org.systems}
- Application link: ${org.applicationLink}
- HR email: ${org.hrEmail}
- Facebook: ${org.facebook}
- Instagram: ${org.instagram}
- Website: ${org.website}

Available roles:
1) English Teacher (Y5–Y6)
Requirements:
- Bachelor’s degree in English, Education, or related field
- Strong English proficiency (spoken & written)
- Experience with primary students preferred
- Ability to simplify concepts and engage young learners
- Classroom management skills

2) English Teacher (High School)
Requirements:
- Bachelor’s degree in English / Education
- Strong grammar, literature, and writing skills
- Previous experience teaching high school
- Ability to prepare students for exams
- Strong communication and presentation skills

3) ICT Teacher (Elementary & Middle School)
Requirements:
- Degree in Computer Science, IT, or related field
- Basic programming knowledge (Scratch, Python is a plus)
- Ability to teach fundamentals (Word, PowerPoint, internet safety)
- Experience with young students
- Good communication and patience

4) PE Teacher
Requirements:
- Degree in Physical Education or related field
- Knowledge of sports activities and physical fitness
- Ability to manage groups and ensure safety
- Energetic and motivating personality

5) Co-Teacher (Assistant Teacher)
Requirements:
- Relevant degree or currently studying (Education preferred)
- Good English communication
- Ability to support lead teacher
- Organized and patient

6) Robotics Instructor
Requirements:
- Background in Robotics, Engineering, or Mechatronics
- Experience with kits (LEGO, Arduino, etc.)
- Basic programming skills
- Ability to teach kids in a fun, interactive way

7) AI Instructor
Requirements:
- Background in AI, Computer Science, or Data Science
- Knowledge of basic AI concepts (ML, simple models)
- Ability to simplify complex ideas
- Teaching or training experience is a plus

8) Automation Engineer
Requirements:
- Degree in Engineering (Mechatronics, Electrical, etc.)
- Knowledge of automation systems (PLC, sensors, control systems)
- Problem-solving skills
- Industry or project experience preferred

Rules:
- Reply in English if the user writes in English.
- Reply in simple Egyptian Arabic if the user writes in Arabic.
- Be friendly, helpful, concise, and practical.
- If information is not confirmed, say it is not confirmed.
- Do not invent salary, work hours, remote/hybrid setup, transportation, application deadlines, interview steps, or demo lesson requirements.
- If the user asks about HR, direct them to ${org.hrEmail}
- If the user asks about contact us or admission, provide ${org.contactPhoneIntl}
- If the user asks about social links, provide the official links.
- If useful, suggest what the user can ask next.
`;

// =========================
// KEYBOARDS
// =========================
function mainKeyboard() {
  return Markup.keyboard([
    ["Available Positions", "Location"],
    ["Apply", "Recommend a Role"],
    ["Requirements", "Contact HR"],
    ["Student Admission", "Contact Us"],
    ["Facebook / Instagram / Website"],
    ["الوظائف المتاحة", "المكان"],
    ["التقديم", "رشحلي وظيفة"],
    ["الشروط", "تواصل مع HR"],
    ["القبول", "تواصل معنا"],
    ["فيسبوك / إنستجرام / الموقع"]
  ]).resize();
}

// =========================
// HELPERS
// =========================
function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(msg, keywords) {
  return keywords.some((k) => msg.includes(k));
}

function looksArabic(text = "") {
  return /[\u0600-\u06FF]/.test(text);
}

function formatRequirements(job) {
  return `For the ${job.title} role 👇

- ${job.requirements.join("\n- ")}

Would you like to apply or know more details?`;
}

function formatRequirementsArabic(job) {
  return `متطلبات وظيفة ${job.title} 👇

- ${job.requirements.join("\n- ")}

تحبي تعرفي تفاصيل أكتر أو طريقة التقديم؟`;
}

function getAllRequirementsText(arabic = false) {
  const all = Object.values(jobs)
    .map((job) => `• ${job.title}`)
    .join("\n");

  if (arabic) {
    return `أقدر أشرح لك شروط أي وظيفة من دول 👇

${all}

ابعتِي اسم الوظيفة اللي عايزة تعرفي شروطها.`;
  }

  return `I can explain the requirements for any of these roles 👇

${all}

Send me the role name you want.`;
}

function recommendRoleSimple(message) {
  const msg = normalize(message);
  const arabic = looksArabic(message);

  if (
    containsAny(msg, [
      "english", "education", "teacher", "teaching",
      "انجليزي", "تعليم", "تدريس"
    ])
  ) {
    return arabic
      ? `بناءً على كلامك، الوظائف المناسبة غالبًا:
- English Teacher
- Co-Teacher

لو تحبي، قوليلي المرحلة اللي تفضليها أو خبرتك.`
      : `Based on your background, these roles may suit you:
- English Teacher
- Co-Teacher

You can also tell me your preferred age group or experience.`;
  }

  if (
    containsAny(msg, [
      "computer", "it", "scratch", "python", "coding",
      "كمبيوتر", "حاسب", "برمجة", "بايثون"
    ])
  ) {
    return arabic
      ? `بناءً على خلفيتك، ممكن تكوني مناسبة لـ:
- ICT Teacher
- AI Instructor`
      : `Based on your background, you may be a good fit for:
- ICT Teacher
- AI Instructor`;
  }

  if (
    containsAny(msg, [
      "engineering", "mechatronics", "robot", "arduino", "automation", "plc",
      "هندسة", "ميكاترونكس", "روبوت", "اردوينو", "اوتوميشن"
    ])
  ) {
    return arabic
      ? `الأنسب ليكي غالبًا:
- Robotics Instructor
- Automation Engineer`
      : `The most suitable roles may be:
- Robotics Instructor
- Automation Engineer`;
  }

  if (
    containsAny(msg, [
      "fresh", "graduate", "student", "no experience",
      "حديث تخرج", "طالبة", "بدون خبرة"
    ])
  ) {
    return arabic
      ? `لو إنتِ fresh graduate، فالأنسب غالبًا:
- Co-Teacher
- بعض instructor roles حسب المهارات`
      : `If you are a fresh graduate, the most suitable options may be:
- Co-Teacher
- Some instructor roles depending on your skills`;
  }

  return arabic
    ? `قوليلي:
- تخصصك
- بتحبي teaching ولا technical
- عندك خبرة ولا fresh graduate

وأرشحلك أنسب وظيفة.`
    : `Tell me:
- your degree/background
- whether you prefer teaching or technical work
- whether you are experienced or a fresh graduate

and I’ll recommend the most suitable role.`;
}

function startRecommendationFlow(userId, arabic = false) {
  userStates.set(userId, {
    flow: "recommendation",
    step: 1,
    data: {}
  });

  return arabic
    ? `تمام 👌 هسألك 3 أسئلة سريعين علشان أرشحلك أنسب وظيفة.

1) تخصصك أو خلفيتك إيه؟`
    : `Great 👌 I’ll ask you 3 quick questions to recommend the best role.

1) What is your degree or background?`;
}

function continueRecommendationFlow(userId, message) {
  const state = userStates.get(userId);
  if (!state || state.flow !== "recommendation") return null;

  const arabic = looksArabic(message);

  if (state.step === 1) {
    state.data.background = message;
    state.step = 2;
    return arabic
      ? `2) تفضلي teaching ولا technical work؟`
      : `2) Do you prefer teaching or technical work?`;
  }

  if (state.step === 2) {
    state.data.preference = message;
    state.step = 3;
    return arabic
      ? `3) عندك خبرة ولا fresh graduate؟`
      : `3) Are you experienced or a fresh graduate?`;
  }

  if (state.step === 3) {
    state.data.experience = message;
    const combinedText = `${state.data.background}\n${state.data.preference}\n${state.data.experience}`;
    userStates.delete(userId);
    return recommendRoleSimple(combinedText);
  }

  return null;
}

function matchJobFromMessage(message) {
  const msg = normalize(message);

  if (containsAny(msg, ["robotics", "lego", "arduino", "روبوت", "ليجو", "اردوينو"])) {
    return jobs.robotics;
  }

  if (containsAny(msg, ["ict", "computer", "it", "coding", "كمبيوتر", "حاسب"])) {
    return jobs.ict;
  }

  if (containsAny(msg, ["ai instructor", "artificial intelligence", "machine learning", "ذكاء", "ai"])) {
    return jobs.ai;
  }

  if (containsAny(msg, ["automation", "plc", "control systems", "اوتوميشن", "تحكم"])) {
    return jobs.automation;
  }

  if (containsAny(msg, ["pe teacher", "physical education", "رياضة", "pe"])) {
    return jobs.pe;
  }

  if (containsAny(msg, ["co teacher", "co-teacher", "assistant teacher", "مساعد مدرس"])) {
    return jobs.co_teacher;
  }

  if (containsAny(msg, ["high school english", "secondary english", "انجليزي ثانوي", "high school teacher"])) {
    return jobs.english_high;
  }

  if (containsAny(msg, ["english teacher", "primary english", "y5", "y6", "انجليزي", "ابتدائي"])) {
    return jobs.english_primary;
  }

  return null;
}

// =========================
// LOCAL FALLBACK
// =========================
function getLocalReply(message, userId) {
  const msg = normalize(message);
  const arabic = looksArabic(message);

  const recFlowReply = continueRecommendationFlow(userId, message);
  if (recFlowReply) return recFlowReply;

  if (containsAny(msg, ["/start", "start", "menu", "help", "ابدأ", "مساعدة"])) {
    return arabic ? welcomeArabic : welcomeEnglish;
  }

  if (
    containsAny(msg, [
      "available positions", "positions", "jobs", "available", "vacancies", "openings",
      "الوظائف", "وظائف", "متاح", "شغل", "فرص"
    ])
  ) {
    return arabic ? positionsArabicText : positionsText;
  }

  if (containsAny(msg, ["requirements", "requirement", "الشروط", "متطلبات"])) {
    const job = matchJobFromMessage(message);
    if (job) return arabic ? formatRequirementsArabic(job) : formatRequirements(job);
    return getAllRequirementsText(arabic);
  }

  if (containsAny(msg, ["location", "address", "where are you", "المكان", "العنوان", "فين"])) {
    return arabic ? locationArabicText : locationText;
  }

  if (containsAny(msg, ["apply", "application", "apply link", "التقديم", "لينك التقديم", "كيف اقدم", "كيف أقدم"])) {
    return arabic ? applyArabicText : applyText;
  }

  if (containsAny(msg, ["admission", "student admission", "قبول", "القبول", "تسجيل"])) {
    return arabic ? admissionArabicText : admissionText;
  }

  if (containsAny(msg, ["contact us", "phone", "call", "تواصل معنا", "رقم", "اتصال"])) {
    return arabic ? contactUsArabicText : contactUsText;
  }

  if (containsAny(msg, ["hr", "human resources", "تواصل مع hr", "التوظيف", "شؤون الموظفين"])) {
    return arabic ? hrArabicText : hrText;
  }

  if (containsAny(msg, ["facebook", "instagram", "website", "social", "contact links", "فيسبوك", "انستجرام", "إنستجرام", "الموقع"])) {
    return arabic ? socialArabicText : socialText;
  }

  if (containsAny(msg, ["recommend a role", "recommend", "رشحلي", "رشح لي", "أنسب وظيفة"])) {
    return startRecommendationFlow(userId, arabic);
  }

  if (containsAny(msg, ["fresh graduate", "fresh", "graduate", "حديث تخرج", "بدون خبرة"])) {
    return arabic
      ? `ينفع طبعًا تسألي عن الوظائف المناسبة للـ fresh graduates، وغالبًا Co-Teacher وبعض instructor roles بيكونوا مناسبين حسب مهاراتك.`
      : `Yes, fresh graduates can still ask about suitable roles. Co-Teacher and some instructor roles may fit depending on your skills.`;
  }

  return arabic ? unknownInfoArabicText : unknownInfoText;
}

// =========================
// BOT COMMANDS
// =========================
bot.start(async (ctx) => {
  const arabic = looksArabic(ctx.message?.text || "");
  await ctx.reply(arabic ? welcomeArabic : welcomeEnglish, mainKeyboard());
});

bot.command("menu", async (ctx) => {
  await ctx.reply("Main menu 👇", mainKeyboard());
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `You can ask me about:
- available positions
- requirements for a role
- location
- application
- fresh graduates
- recommend a role
- student admission
- HR
- contact us
- Facebook / Instagram / website`,
    mainKeyboard()
  );
});

bot.command("location", async (ctx) => ctx.reply(locationText, mainKeyboard()));
bot.command("apply", async (ctx) => ctx.reply(applyText, mainKeyboard()));
bot.command("admission", async (ctx) => ctx.reply(admissionText, mainKeyboard()));
bot.command("contact_us", async (ctx) => ctx.reply(contactUsText, mainKeyboard()));
bot.command("hr", async (ctx) => ctx.reply(hrText, mainKeyboard()));
bot.command("contact", async (ctx) => ctx.reply(socialText, mainKeyboard()));

// =========================
// MESSAGE HANDLER
// =========================
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from?.id;

  if (!useOpenAI || !client) {
    return ctx.reply(getLocalReply(userMessage, userId), mainKeyboard());
  }

  try {
    const localHint = getLocalReply(userMessage, userId);

    const response = await client.responses.create({
      model: "gpt-4.1",
      instructions: openaiSystemPrompt,
      input: `User message: ${userMessage}\n\nHelpful local context: ${localHint}`
    });

    const reply = response.output_text || localHint || "Sorry, I could not answer that clearly.";
    await ctx.reply(reply, mainKeyboard());
  } catch (err) {
    console.error(err);
    const message = err?.error?.message || err.message || "Unknown error";

    if (message.toLowerCase().includes("quota")) {
      await ctx.reply(
        "The AI service is currently unavailable because the API quota is not active yet. I will still answer using my built-in local replies.\n\n" +
          getLocalReply(userMessage, userId),
        mainKeyboard()
      );
    } else {
      await ctx.reply(getLocalReply(userMessage, userId), mainKeyboard());
    }
  }
});

// =========================
// KEEP SERVER ALIVE
// =========================
app.get("/", (req, res) => {
  res.status(200).send("Oakland Assistant bot is running.");
});

// =========================
// BOT LAUNCH
// =========================
bot.launch().then(() => {
  console.log("Oakland Assistant bot is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
