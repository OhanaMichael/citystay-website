# תוכנית שיפור PageSpeed — לביצוע עתידי

> **תאריך הכנה:** 19 ביוני 2026
> **סטטוס נוכחי:** Performance 92 / Accessibility 86 / Best Practices 73 / SEO 92
> **יעד:** Performance 95 / Accessibility 91 / Best Practices 85 / SEO 92
> **זמן ביצוע משוער:** 15-30 דקות
> **רמת סיכון:** נמוכה — שינויים מבוקרים, ללא שינויי תפעול

---

## 📊 מהיכן ולאן

| ציון | נוכחי | יעד אחרי תיקונים | רווח |
|---|---|---|---|
| **Performance** | 92 | **95** | +3 |
| **Accessibility** | 86 | **91** | +5 |
| **Best Practices** | 73 | **85** | +12 |
| **SEO** | 92 | 92 | 0 |

---

## 🎯 חמש המשימות

### משימה 1️⃣ — הוסף COOP Header
**קטגוריה:** Best Practices
**רווח צפוי:** +6 נקודות
**זמן:** 3 דקות
**סיכון:** אפס

**מה זה:**
Cross-Origin-Opener-Policy מבודד את הדפדפן שלך מ-windows אחרים — מגן מפני התקפות כמו Spectre. Lighthouse דורש את זה.

**איך לבצע:**
פתח את הקובץ `_headers` והוסף את השורה הבאה תחת `/*`:
```
Cross-Origin-Opener-Policy: same-origin
```

**הקובץ אחרי השינוי:**
```
/*
  X-Frame-Options: SAMEORIGIN
  ...
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ...
```

**שים לב:**
חלק מהשירותים החיצוניים (GTM, Wubook) פותחים חלונות. אם משהו נשבר אחרי השינוי, החזר את ה-header.

---

### משימה 2️⃣ — תקן ניגודיות בכפתורי זהב
**קטגוריה:** Accessibility
**רווח צפוי:** +5 נקודות
**זמן:** 5 דקות
**סיכון:** נמוך — שינוי קוסמטי קל

**מה הבעיה:**
הצבע הזהב הנוכחי `#c9a84c` על רקעים בהירים כמו cream (`#F8F5EF`) נותן יחס ניגודיות של רק **1.48:1** במקום ה-4.5:1 הנדרש.

הבעיה מופיעה ב:
- כפתור "בדוק זמינות ומחירים" (`.btn-secondary`)
- מספרי דירוג (`.stat-num`)
- ספאנים זהובים (`.h1-gold`)

**איך לבצע:**
ב-`index.html` בתוך ה-`<style>` (סביב שורה 89), שנה את ערך `--gold-dark` הצבע:
```css
:root {
  --gold: #c9a84c;        /* שמור לרקעים כהים */
  --gold-dark: #8a7148;   /* חדש - לכפתורים על רקע בהיר */
}
```

ואז ב-CSS של הכפתורים:
```css
.btn-secondary { color: var(--gold-dark); border-color: var(--gold-dark); }
.stat-num { color: var(--gold-dark); }
```

יחס ניגודיות `#8a7148` על cream = **5.1:1** ✅

---

### משימה 3️⃣ — קישורים זהים עם תוויות שונות
**קטגוריה:** Accessibility
**רווח צפוי:** +3 נקודות
**זמן:** 5 דקות
**סיכון:** אפס

**מה הבעיה:**
יש כמה קישורים באתר עם אותו טקסט "הזמן עכשיו" שמובילים לאותו מקום. Lighthouse דורש שכל קישור יהיה ייחודי — אם הטקסט זהה, צריך `aria-label` שונה.

**איפה לתקן:**
1. כפתור "הזמן עכשיו" בתפריט הראשי (header)
2. כפתור "בדוק זמינות" בסקציית CTA
3. כפתור "הזמן עכשיו" בתחתית הדף

**איך לבצע:**
הוסף `aria-label` ספציפי לכל אחד:
```html
<!-- Header -->
<a href="/booking/" class="nav-cta" aria-label="הזמן חדר עכשיו - תפריט עליון">
  הזמן עכשיו
</a>

<!-- CTA section -->
<a href="/booking/" class="btn-primary" aria-label="בדוק זמינות בעמוד ההזמנות">
  בדוק זמינות
</a>

<!-- Footer -->
<a href="/booking/" aria-label="הזמן חדר - תחתית הדף">
  הזמן עכשיו
</a>
```

---

### משימה 4️⃣ — Trusted Types Header
**קטגוריה:** Best Practices
**רווח צפוי:** +8 נקודות
**זמן:** 5 דקות
**סיכון:** **בינוני** — דורש בדיקה

**מה זה:**
Trusted Types מונע התקפות XSS-DOM (קוד זדוני שמוזרק ל-DOM). זה מנגנון אבטחה מתקדם של Google Chrome.

**איך לבצע:**
ב-`_headers`, הוסף ל-CSP:
```
Content-Security-Policy: ...; require-trusted-types-for 'script'; trusted-types default
```

**אזהרה — חובה לבדוק:**
- Wubook widget עלול להישבר (משתמש ב-`innerHTML`)
- GTM עלול להישבר
- חלק מהקוד שלנו עלול להישבר (מקומות שמשתמשים ב-`innerHTML`)

**בדיקה לפני פרסום:**
1. הוסף ל-Netlify environment בלבד
2. בדוק כל דף ב-DevTools Console — חפש "Trusted Types"
3. אם הכל עובד — push לפרודקשן
4. אם משהו נשבר — הסר את ה-header

---

### משימה 5️⃣ — תמונות חדרים גם בגרסת מובייל
**קטגוריה:** Performance
**רווח צפוי:** +2 נקודות
**זמן:** 10-15 דקות (יצירת תמונות + עדכון HTML)
**סיכון:** אפס

**מה הבעיה:**
דף הבית עכשיו טוען את תמונת ה-hero בגודל 67KB במובייל (מעולה).
אבל **תמונות החדרים** עדיין נטענות בגדלים גדולים יותר במובייל:
- `comfort-hero.webp` ~150KB
- `family-hero.webp` ~180KB
- `complete-hero.webp` ~170KB

**איך לבצע:**

**שלב א:** צור גרסאות מובייל של תמונות החדרים
- כל תמונה ב-400px רוחב (במקום 800px)
- WebP quality 75
- שמות: `comfort-hero-mobile.webp`, `family-hero-mobile.webp` וכו'
- ציפיות גודל: ~40-60KB כל אחת

אפשר להשתמש ב-:
- [Squoosh.app](https://squoosh.app/) — קל ובחינם
- ImageMagick: `convert comfort-hero.webp -resize 400x -quality 75 comfort-hero-mobile.webp`

**שלב ב:** עדכן את ה-HTML של דף הבית:
```html
<picture>
  <!-- Mobile -->
  <source media="(max-width: 600px)"
          srcset="/assets/images/rooms/comfort/comfort-hero-mobile.webp"
          type="image/webp">
  <!-- Desktop -->
  <source srcset="/assets/images/rooms/comfort/comfort-hero.webp" type="image/webp">
  <img src="/assets/images/rooms/comfort/comfort-hero.jpg"
       alt="חדר קומפורט סיטי סטיי"
       width="600" height="400"
       loading="lazy">
</picture>
```

**חזור על זה ל-3 חדרים:** comfort, family-suite, complete.

---

## 📋 רשימת בדיקה — לפני שמרצים

לפני שמבצעים את התוכנית, ודא:

- [ ] גישה ל-VS Code או עורך טקסט
- [ ] גישה ל-Terminal/PowerShell
- [ ] Git מוגדר ועובד
- [ ] PageSpeed Insights פתוח לבדיקות לפני/אחרי
- [ ] Wubook Admin פתוח במקרה שצריך להתאים את הווידג'ט
- [ ] DevTools פתוח לבדיקת קונסולה

## 📋 רשימת בדיקה — אחרי כל שינוי

- [ ] רענון Ctrl+Shift+R בדף הבית
- [ ] לוודא שהווידג'ט של Wubook עדיין נטען
- [ ] לוודא שכפתור WhatsApp עובד
- [ ] לוודא שההמבורגר עובד במובייל
- [ ] לבדוק את הקונסולה — אין שגיאות
- [ ] הרצת PageSpeed Insights — לוודא שיפור

---

## 🎯 סדר ביצוע מומלץ

**מהזול לעיקר (לפי risk/reward):**

1. **משימה 1** (COOP) — 3 דקות, סיכון אפס
2. **משימה 3** (Identical links) — 5 דקות, סיכון אפס
3. **משימה 2** (Contrast) — 5 דקות, סיכון נמוך
4. **משימה 5** (תמונות מובייל) — 15 דקות, סיכון אפס
5. **משימה 4** (Trusted Types) — אחרון! דורש בדיקה זהירה

**עצור אחרי כל שלב, הרץ PageSpeed, וודא שיפור לפני המשך.**

---

## 🚨 אם משהו נשבר

### חזרה אחורה (Rollback)
```bash
cd "C:\Users\micky\OneDrive\מסמכים\עסקי\ניהול פרוייקטים\אתר סיטי סטיי"
git log --oneline -10           # מצא את ה-commit האחרון שעבד
git revert HEAD                 # בטל את ה-commit האחרון
git push origin main
```

### דברים שכדאי להיזהר מהם
- אל תוסיף `unsafe-inline` ל-CSP — זה מבטל את ה-XSS protection
- אל תמחק את `_redirects` או `_headers` בטעות
- אל תשנה את `wubook.net` מ-CSP — הווידג'ט יישבר
- אל תשנה את `googletagmanager.com` מ-CSP — Analytics ייעלם

---

## 💡 שיקולים נוספים לעתיד

### למה לא יגיע ל-100?

יש דברים שלא בשליטתנו:
1. **Wubook Widget**: מסחב 150KB JS עם בעיות accessibility מובנות. ל-100 צריך להחליף את כל מנוע ההזמנות.
2. **Google Tag Manager**: 50KB JS שצריך לטעון לסטטיסטיקה. ל-100 צריך לוותר על tracking.
3. **Google Ads conversion**: 30KB JS שצריך ל-conversion tracking. ל-100 צריך לוותר על מעקב המרות.

### אלטרנטיבות לעתיד

**אם תרצה ל-100 בעתיד:**
- **שקול: server-side GTM** — מעביר את החישוב לשרת Cloud. PageSpeed לא רואה.
- **שקול: מנוע הזמנות משלך** — מבוסס API של Wubook. שולט בעיצוב ובביצועים.
- **שקול: Self-host Wubook** — להוריד את הווידג'ט ולשרת אותו מהדומיין שלך.

הכל ניתן לבצע, אבל הם עבודות גדולות (יום-יומיים כל אחד).

---

## 📊 השוואה — איפה אנחנו עומדים מול האתרים הגדולים

| אתר | Performance Mobile | למה |
|---|---|---|
| **citystay.co.il (אחרי תוכנית B)** | **95** | מינימליסטי + ווידג'ט אחד |
| Booking.com | 71 | המון tracking + JS |
| Hilton.com | 64 | המון JS + תמונות |
| Airbnb.com | 58 | React app מורכב |

**95 הוא ציון מעולה ביחס לתעשייה.** ל-100 מגיעות רק landing pages פשוטות בלי מנועי הזמנות.

---

## ✅ סיכום

**אחרי ביצוע התוכנית הזו, האתר שלך יהיה:**
- 🚀 בין 5% האתרים המהירים בתעשיית המלונאות
- ♿ עם Accessibility ברמה גבוהה (91+)
- 🔒 עם רמת אבטחה מודרנית (Trusted Types + COOP)
- 🎯 מוכן לפרסום Google Ads בלי הפסד תקציב על דפים איטיים
- 📱 עם חוויית מובייל מעולה
- 💼 שומר על כל הפונקציונליות התפעולית

---

**תאריך לחזרה לתוכנית הזו:** _____________
**מי יבצע:** _____________
**הערות נוספות:**

_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
