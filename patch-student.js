const fs = require("fs");
const p = "apps/web/src/components/StudentDashboard.tsx";
let c = fs.readFileSync(p, "utf8");
let changed = [];

// 1) استيراد QuizPlayer بعد PhetPlayer
if (!c.includes("QuizPlayer")) {
  c = c.replace(
    "import { PhetPlayer } from './PhetPlayer';",
    "import { PhetPlayer } from './PhetPlayer';\nimport { QuizPlayer } from './QuizPlayer';"
  );
  changed.push("import");
}

// 2) أضف isQuiz للـinterface Assignment (بعد phetSlug)
if (!c.includes("isQuiz?")) {
  c = c.replace(
    "phetSlug?: string | null;",
    "phetSlug?: string | null;\n  isQuiz?: boolean | null;"
  );
  changed.push("interface");
}

// 3) افتح QuizPlayer عند isQuiz بدل AssignmentDetail
const oldView = `{view.name === 'assignment' && (
        <AssignmentDetail
          assignment={view.assignment}
          onBack={() => setView({ name: 'home' })}
        />
      )}`;
const newView = `{view.name === 'assignment' && view.assignment.isQuiz && (
        <QuizPlayer
          assignmentId={view.assignment.id}
          onBack={() => setView({ name: 'home' })}
        />
      )}
      {view.name === 'assignment' && !view.assignment.isQuiz && (
        <AssignmentDetail
          assignment={view.assignment}
          onBack={() => setView({ name: 'home' })}
        />
      )}`;
if (c.includes(oldView)) {
  c = c.replace(oldView, newView);
  changed.push("view-switch");
}

fs.writeFileSync(p, c);
console.log("changed:", changed.join(", ") || "NOTHING");
