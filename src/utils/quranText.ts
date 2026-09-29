/**
 * أدوات تنقيح وضبط النص القرآني برواية ورش عن نافع
 * تضمن ظهور النص القرآني بشكل سليم وجميل في جميع المتصفحات والشاشات
 * وتمنع ظهور أي مربعات فارغة أو رموز تشويه (Tofu Glyphs)
 */

export function sanitizeAyahText(text: string): string {
  if (!text) return '';

  return text
    // استبدال تنوين الفتح والضم المغربي بالرسم القياسي الواضح لمنع ظهور المربعات
    .replace(/ا\u0657/g, 'اً')
    .replace(/ة\u0657/g, 'ةً')
    .replace(/ي\u0657/g, 'ياً')
    .replace(/ء\u0657/g, 'ءً')
    .replace(/\u0657/g, 'ً')
    // استبدال الألف الخنجرية السفلية بتنوين الكسر أو الكسرة القياسية
    .replace(/\u0656/g, 'ٍ')
    // استبدال علامة النقل والتسهيل (النقطة الكبيرة المصمتة U+06EC) بحرف واضح أو ألف بدون مربع
    .replace(/اِ\u06ECل/g, 'ال')
    .replace(/اَ\u06ECل/g, 'ال')
    .replace(/اُ\u06ECل/g, 'ال')
    .replace(/\u06EC/g, '')
    // إزالة علامة الإمالة غير المدعومة في بعض الخطوط (U+06EA)
    .replace(/\u06EA/g, '')
    // إزالة علامات الوقف الإضافية المشوهة غير المدعومة (U+06D6 إلى U+06ED)
    .replace(/[\u06D6-\u06ED]/g, '')
    // ضبط الواو والياء الصغيرتين
    .replace(/\u06E5/g, 'ۥ')
    .replace(/\u06E6/g, 'ۦ')
    // إزالة المسافات المتكررة والكشيدة الزائدة
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * تحويل أرقام الآيات إلى أرقام عربية مشرقية منسقة داخل قوسين قرآنيين
 */
export function formatAyahNumber(num: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const formatted = num
    .toString()
    .split('')
    .map(d => arabicDigits[parseInt(d, 10)] || d)
    .join('');
  return `﴿${formatted}﴾`;
}
