require("dotenv").config();
const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const useOpenAI = process.env.USE_OPENAI === "true";
const client =
  useOpenAI && process.env.OPENAI_API_KEY
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
  systems: "British & American",
  applicationLink: "[https://docs.google.com/forms/d/e/1FAIpQLSesLIR0xgGpXwJLKL-2eTMv05eZdbHRWmPnvgWYZn8FBCWSGw/viewform?usp=sharing&ouid=103198229964772601584]"
};

const contactLinks = `
📱 **Facebook**: [https://m.facebook.com/Oakland.Egy/](https://m.facebook.com/Oakland.Egy/)
📸 **Instagram**: [https://www.instagram.com/oakland.college](https://www.instagram.com/oakland.college)
🌐 **Website**: [https://oakland-egypt.com/about/](https://oakland-egypt.com/about/)
`;

const contactArabicLinks = `
📱 **فيسبوك**: [https://m.facebook.com/Oakland.Egy/](https://m.facebook.com/Oakland.Egy/)
📸 **إنستجرام**: [https://www.instagram.com/oakland.college](https://www.instagram.com/oakland.college)
🌐 **الموقع**: [https://oakland-egypt.com/about/](https://oakland-egypt.com/about/)
`;

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

// =========================
// KEYBOARDS
// =========================
function mainKeyboard() {
  return Markup.keyboard([
    ["Available Positions", "Location"],
    ["Apply", "Recommend a Role"],
    ["Requirements", "Contact HR"],
    ["الوظائف المتاحة", "المكان"],
    ["التقديم", "رشحلي وظيفة"],
    ["الشروط", "تواصل مع HR"],
    ["Contact Us", "تواصل معنا"]
  ]).resize();
}

// =========================
// HELPERS
// =========================
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(msg, keywords) {
  return keywords.some((k) => msg.includes(k));
}

function looksArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

// =========================
// COMMANDS & HANDLERS
// =========================

bot.command('contact', (ctx) => {
  const isArabic = /[\u0600-\u06FF]/.test(ctx.message.text); // يتأكد من اللغة المستخدمة (عربي أو إنجليزي)
  const replyMessage = isArabic ? contactArabicLinks : contactLinks;
  ctx.reply(replyMessage);
});

bot.command('start', (ctx) => {
  const isArabic = looksArabic(ctx.message.text);
  const welcomeMessage = isArabic 
    ? `مرحبًا بك في بوت Oakland! 👋\n\nنحن مدرسة تقدم النظامين الأمريكي والبريطاني مع مناهج معتمدة عالميًا وتركيز قوي على الإبداع، التفكير النقدي، والتعلم المستمر.\nأنا هنا لمساعدتك في معرفة الوظائف المتاحة، التقديم، القبول الجامعي، وأي استفسارات أخرى.\nيمكنك الكتابة بالعربية أو الإنجليزية.`
    : `Welcome to Oakland Assistant 🤖\n\nWe are a school offering the American and British systems with internationally aligned curricula and a strong focus on creativity, critical thinking, and lifelong learning.\nI can help with jobs, applications, student admission, and general inquiries.\nYou can message in Arabic or English.`;

  ctx.reply(welcomeMessage, mainKeyboard());
});

bot.command('location', (ctx) => {
  const isArabic = looksArabic(ctx.message.text);
  const locationMessage = isArabic ? `مكان Oakland College 📍\n${org.address}\nرقم الهاتف: ${org.phone}` : `Our location is 📍\n${org.address}\nPhone: ${org.phone}`;
  ctx.reply(locationMessage);
});

bot.command('apply', (ctx) => {
  const applyMessage = `You can apply through the official application form 👇\n${org.applicationLink}\nPlease make sure to upload your CV before submitting.`;
  ctx.reply(applyMessage);
});

bot.command('admission', (ctx) => {
  const admissionMessage = `You can contact us for student admission at 📞 (+20) 120 380 0011`;
  ctx.reply(admissionMessage);
});

bot.command('contact_us', (ctx) => {
  const contactUsMessage = `You can contact us on 📞 (+20) 120 380 0011`;
  ctx.reply(contactUsMessage);
});

bot.command('hr', (ctx) => {
  const hrMessage = `For HR inquiries, you can reach us via email at 📧 info@oaklandegypt.com`;
  ctx.reply(hrMessage);
});

// =========================
// SMART REPLIES FOR QUESTIONS
// =========================
bot.on('text', (ctx) => {
  const message = ctx.message.text.toLowerCase();
  const isArabic = looksArabic(message);

  if (containsAny(message, ['jobs', 'positions', 'work', 'وظائف', 'شغل'])) {
    ctx.reply(isArabic ? positionsArabicText : positionsText);
  } else if (containsAny(message, ['apply', 'تقديم', 'كيف أقدم'])) {
    ctx.reply(isArabic ? `يمكنك التقديم عبر الرابط: ${org.applicationLink}` : `You can apply via the link: ${org.applicationLink}`);
  } else if (containsAny(message, ['location', 'مكان', 'أين يقع'])) {
    ctx.reply(isArabic ? `مكاننا هو: ${org.address}` : `Our location is: ${org.address}`);
  } else if (containsAny(message, ['admission', 'قبول', 'تسجيل'])) {
    ctx.reply(isArabic ? `للتواصل بخصوص القبول الجامعي: 📞 (+20) 120 380 0011` : `For student admission, contact us at 📞 (+20) 120 380 0011`);
  } else if (containsAny(message, ['hr', 'التوظيف', 'شؤون الموظفين'])) {
    ctx.reply(isArabic ? `للاستفسار عن شؤون الموظفين، يمكنكم التواصل عبر البريد الإلكتروني 📧 info@oaklandegypt.com` : `For HR inquiries, you can reach us via email 📧 info@oaklandegypt.com`);
  } else if (containsAny(message, ['contact us', 'تواصل معنا'])) {
    ctx.reply(isArabic ? `يمكنك التواصل معنا على 📞 (+20) 120 380 0011` : `You can contact us on 📞 (+20) 120 380 0011`);
  } else {
    ctx.reply(isArabic ? "أنا هنا لمساعدتك! ماذا يمكنني مساعدتك فيه؟" : "I'm here to help! What can I assist you with?");
  }
});

// =========================
// BOT LAUNCH
// =========================
bot.launch();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});