/**
 * قائمة محاكيات PhET المنسّقة — دليل روابط خفيف فقط.
 * لا نستضيف أي ملف ولا محتوى؛ فقط الاسم والرابط الرسمي والتصنيف.
 * الرابط يشير مباشرةً لموقع PhET (phet.colorado.edu) ويُفتح في iframe.
 *
 * ملاحظة ترخيص: كل هذه المحاكيات منشورة قبل 29 مارس 2026 (CC BY 4.0).
 * التنويه الإلزامي يظهر عبر مكوّن PhetAttribution أينما عُرضت.
 *
 * تُبنى صيغة الرابط: https://phet.colorado.edu/sims/html/<slug>/latest/<slug>_all.html
 * الصيغة _all تدعم تبديل اللغة داخل المحاكاة (بما فيها العربية حيثما توفّرت).
 */

export type PhetSubject =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'math'
  | 'earth';

export interface PhetSim {
  slug: string;
  titleAr: string;
  titleEn: string;
  subject: PhetSubject;
  /** نطاق الصفوف التقريبي: 'primary' | 'middle' | 'high' */
  level: 'primary' | 'middle' | 'high';
  /** كلمات مفتاحية للبحث (عربي + إنجليزي) */
  keywords: string[];
}

export const PHET_SUBJECTS: { id: PhetSubject; ar: string }[] = [
  { id: 'physics', ar: 'الفيزياء' },
  { id: 'chemistry', ar: 'الكيمياء' },
  { id: 'biology', ar: 'الأحياء' },
  { id: 'math', ar: 'الرياضيات' },
  { id: 'earth', ar: 'علوم الأرض' },
];

/** رابط التضمين الرسمي في iframe */
export function phetEmbedUrl(slug: string): string {
  return `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_all.html`;
}

/** رابط صفحة المحاكاة على موقع PhET (للإسناد/الفتح الخارجي إن لزم) */
export function phetPageUrl(slug: string): string {
  return `https://phet.colorado.edu/en/simulations/${slug}`;
}

export const PHET_CATALOG: PhetSim[] = [
  // ===== الفيزياء =====
  {
    slug: 'ohms-law',
    titleAr: 'قانون أوم',
    titleEn: "Ohm's Law",
    subject: 'physics',
    level: 'middle',
    keywords: ['أوم', 'مقاومة', 'جهد', 'تيار', 'ohm', 'resistance', 'voltage', 'current'],
  },
  {
    slug: 'circuit-construction-kit-dc',
    titleAr: 'بناء الدارات الكهربائية (تيار مستمر)',
    titleEn: 'Circuit Construction Kit: DC',
    subject: 'physics',
    level: 'high',
    keywords: ['دارة', 'كهرباء', 'circuit', 'battery', 'بطارية'],
  },
  {
    slug: 'forces-and-motion-basics',
    titleAr: 'القوى والحركة — أساسيات',
    titleEn: 'Forces and Motion: Basics',
    subject: 'physics',
    level: 'middle',
    keywords: ['قوة', 'حركة', 'احتكاك', 'force', 'motion', 'friction', 'نيوتن'],
  },
  {
    slug: 'gravity-and-orbits',
    titleAr: 'الجاذبية والمدارات',
    titleEn: 'Gravity and Orbits',
    subject: 'physics',
    level: 'high',
    keywords: ['جاذبية', 'مدار', 'gravity', 'orbit', 'كواكب'],
  },
  {
    slug: 'energy-skate-park-basics',
    titleAr: 'حديقة الطاقة — أساسيات',
    titleEn: 'Energy Skate Park: Basics',
    subject: 'physics',
    level: 'middle',
    keywords: ['طاقة', 'حركية', 'وضع', 'energy', 'kinetic', 'potential'],
  },
  {
    slug: 'wave-on-a-string',
    titleAr: 'موجة على وتر',
    titleEn: 'Wave on a String',
    subject: 'physics',
    level: 'high',
    keywords: ['موجة', 'تردد', 'wave', 'frequency', 'اهتزاز'],
  },
  {
    slug: 'bending-light',
    titleAr: 'انكسار الضوء',
    titleEn: 'Bending Light',
    subject: 'physics',
    level: 'high',
    keywords: ['ضوء', 'انكسار', 'light', 'refraction', 'عدسة'],
  },
  // ===== الكيمياء =====
  {
    slug: 'build-an-atom',
    titleAr: 'بناء الذرّة',
    titleEn: 'Build an Atom',
    subject: 'chemistry',
    level: 'middle',
    keywords: ['ذرة', 'بروتون', 'إلكترون', 'atom', 'proton', 'electron'],
  },
  {
    slug: 'states-of-matter-basics',
    titleAr: 'حالات المادة — أساسيات',
    titleEn: 'States of Matter: Basics',
    subject: 'chemistry',
    level: 'primary',
    keywords: ['حالات', 'مادة', 'صلب', 'سائل', 'غاز', 'states', 'matter'],
  },
  {
    slug: 'balancing-chemical-equations',
    titleAr: 'موازنة المعادلات الكيميائية',
    titleEn: 'Balancing Chemical Equations',
    subject: 'chemistry',
    level: 'high',
    keywords: ['معادلة', 'موازنة', 'تفاعل', 'equation', 'balance', 'reaction'],
  },
  {
    slug: 'ph-scale-basics',
    titleAr: 'مقياس الأس الهيدروجيني — أساسيات',
    titleEn: 'pH Scale: Basics',
    subject: 'chemistry',
    level: 'middle',
    keywords: ['حموضة', 'قاعدة', 'ph', 'acid', 'base', 'أس هيدروجيني'],
  },
  {
    slug: 'concentration',
    titleAr: 'التركيز',
    titleEn: 'Concentration',
    subject: 'chemistry',
    level: 'high',
    keywords: ['تركيز', 'محلول', 'concentration', 'solution', 'مولارية'],
  },
  // ===== الأحياء =====
  {
    slug: 'gene-expression-essentials',
    titleAr: 'أساسيات التعبير الجيني',
    titleEn: 'Gene Expression Essentials',
    subject: 'biology',
    level: 'high',
    keywords: ['جين', 'dna', 'بروتين', 'gene', 'protein', 'وراثة'],
  },
  {
    slug: 'natural-selection',
    titleAr: 'الانتخاب الطبيعي',
    titleEn: 'Natural Selection',
    subject: 'biology',
    level: 'high',
    keywords: ['تطور', 'انتخاب', 'evolution', 'selection', 'وراثة'],
  },
  {
    slug: 'neuron',
    titleAr: 'الخلية العصبية',
    titleEn: 'Neuron',
    subject: 'biology',
    level: 'high',
    keywords: ['عصب', 'خلية', 'neuron', 'nerve', 'جهاز عصبي'],
  },
  // ===== الرياضيات =====
  {
    slug: 'graphing-lines',
    titleAr: 'رسم الخطوط المستقيمة',
    titleEn: 'Graphing Lines',
    subject: 'math',
    level: 'middle',
    keywords: ['رسم', 'خط', 'ميل', 'graph', 'line', 'slope', 'معادلة'],
  },
  {
    slug: 'fraction-matcher',
    titleAr: 'مطابقة الكسور',
    titleEn: 'Fraction Matcher',
    subject: 'math',
    level: 'primary',
    keywords: ['كسور', 'fraction', 'مطابقة', 'match'],
  },
  {
    slug: 'area-model-multiplication',
    titleAr: 'نموذج المساحة للضرب',
    titleEn: 'Area Model Multiplication',
    subject: 'math',
    level: 'primary',
    keywords: ['ضرب', 'مساحة', 'multiplication', 'area', 'نموذج'],
  },
  {
    slug: 'trig-tour',
    titleAr: 'جولة في حساب المثلثات',
    titleEn: 'Trig Tour',
    subject: 'math',
    level: 'high',
    keywords: ['مثلثات', 'جيب', 'جتا', 'trig', 'sine', 'cosine'],
  },
  // ===== علوم الأرض =====
  {
    slug: 'plate-tectonics',
    titleAr: 'الصفائح التكتونية',
    titleEn: 'Plate Tectonics',
    subject: 'earth',
    level: 'high',
    keywords: ['صفائح', 'زلزال', 'plate', 'tectonics', 'براكين'],
  },
  {
    slug: 'greenhouse-effect',
    titleAr: 'ظاهرة الاحتباس الحراري',
    titleEn: 'The Greenhouse Effect',
    subject: 'earth',
    level: 'high',
    keywords: ['احتباس', 'مناخ', 'greenhouse', 'climate', 'حرارة'],
  },
];

/** بحث محلي بسيط عبر العنوان والكلمات المفتاحية (عربي/إنجليزي) */
export function searchPhet(
  query: string,
  subject?: PhetSubject,
): PhetSim[] {
  const q = query.trim().toLowerCase();
  return PHET_CATALOG.filter((sim) => {
    if (subject && sim.subject !== subject) return false;
    if (!q) return true;
    const haystack = [
      sim.titleAr,
      sim.titleEn.toLowerCase(),
      ...sim.keywords.map((k) => k.toLowerCase()),
    ].join(' ');
    return haystack.includes(q);
  });
}
