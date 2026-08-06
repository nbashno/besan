// سكربت إضافة الإشعارات لـ assignment.use-case.ts على جهاز المستخدم
const fs = require("fs");
const f = "apps/api/src/modules/assignments/assignment.use-case.ts";
let c = fs.readFileSync(f, "utf8");
const log = [];

// 1) استيراد NotificationPort
if (!c.includes("NotificationPort")) {
  c = c.replace(
    "import { EventBus } from '@infrastructure/events/event-bus.service';",
    "import { EventBus } from '@infrastructure/events/event-bus.service';\nimport { NotificationPort } from '@application/ports/notification.port';"
  );
  log.push("import");
}

// 2) حقن في constructor (بعد events: EventBus)
if (!c.includes("private readonly notify: NotificationPort")) {
  c = c.replace(
    /private readonly events: EventBus,\s*\)\s*\{\}/,
    "private readonly events: EventBus,\n    private readonly notify: NotificationPort,\n  ) {}"
  );
  log.push("inject");
}

// 3) الدوال المساعدة قبل آخر }
if (!c.includes("notifyClassStudents")) {
  const helper = `
  private readonly WEBAPP_URL = 'https://t.me/Besan_bot/app';

  private async notifyClassStudents(
    classId: string,
    title: string,
    body: string,
    shareCode?: string | null,
  ) {
    const members = await this.prisma.classMember.findMany({
      where: { classId, role: 'STUDENT' },
      include: { user: { select: { telegramId: true } } },
    });
    const deepLink = shareCode
      ? \`\${this.WEBAPP_URL}?startapp=\${shareCode}\`
      : this.WEBAPP_URL;
    await Promise.all(
      members.map((m: { user: { telegramId: bigint | null } | null }) => {
        const tgId = m.user?.telegramId;
        if (!tgId) return Promise.resolve();
        return this.notify.send({ telegramId: tgId, title, body, deepLink });
      }),
    );
  }

  private async notifyTeacher(classId: string, title: string, body: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { owner: { select: { telegramId: true } } },
    });
    const tgId = cls?.owner?.telegramId;
    if (!tgId) return;
    await this.notify.send({ telegramId: tgId, title, body, deepLink: this.WEBAPP_URL });
  }
`;
  const lastBrace = c.lastIndexOf("}");
  c = c.substring(0, lastBrace) + helper + "\n}\n";
  log.push("helpers");
}

// 4) ربط: في createQuiz — بعد إنشاء الاختبار، أشعر الطلاب. نضيف قبل return الأخير في createQuiz.
// نبحث عن نمط return createQuiz
if (!c.includes("// notify:quiz-created")) {
  c = c.replace(
    "    return { id: result.id, title: result.title, classId: result.classId, shareCode: result.shareCode };",
    `    // notify:quiz-created
    await this.notifyClassStudents(
      result.classId,
      'اختبار جديد',
      \`تم نشر اختبار: \${result.title}\`,
      result.shareCode,
    ).catch(() => {});
    return { id: result.id, title: result.title, classId: result.classId, shareCode: result.shareCode };`
  );
  log.push("createQuiz-notify");
}

// 5) ربط: في submitQuiz — بعد الحفظ، أشعر المعلم + أشعر الطالب بالدرجة.
// نضيف قبل return النهائي في submitQuiz (يحوي submissionId + score + total)
if (!c.includes("// notify:quiz-submitted")) {
  c = c.replace(
    /return \{\s*submissionId: result\.id,\s*score: earnedPoints,\s*total: totalPoints,/,
    `// notify:quiz-submitted
    await this.notifyTeacher(
      a.classId,
      'تسليم جديد',
      \`سلّم أحد الطلاب اختبار: \${a.title} — الدرجة: \${earnedPoints}/\${totalPoints}\`,
    ).catch(() => {});
    return {
      submissionId: result.id,
      score: earnedPoints,
      total: totalPoints,`
  );
  log.push("submitQuiz-notify");
}

fs.writeFileSync(f, c);
console.log("applied:", log.join(", ") || "NOTHING");
console.log("has-createQuiz-notify:", c.includes("notify:quiz-created"));
console.log("has-submitQuiz-notify:", c.includes("notify:quiz-submitted"));
