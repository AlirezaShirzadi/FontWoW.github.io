# Rules for Antigravity AI Agent

## Git Push/Pull Policy
- **Always pull before pushing**: To prevent any push conflicts or sync issues, you must always run `git pull` (or `git pull --rebase origin main`) before running `git push`.
- **قانون کشیدن قبل از فرستادن (Pull before Push)**: همیشه قبل از اجرای دستور `git push` باید دستور `git pull` اجرا شود تا از بروز هرگونه تداخل و مشکل در مخزن گیت جلوگیری شود.

## Versioning & Release Notes Policy / سیاست به‌روزرسانی نسخه و توضیحات تغییرات
- **Update Version and Write Persian Release Notes**: When introducing new features, options, or fixing bugs, you must always update the version in `src/updates.js` and write the description of the changes (under `fa`) in Persian.
- **به‌روزرسانی نسخه و نوشتن توضیحات به فارسی**: در زمان اضافه کردن ویژگی‌ها، گزینه‌ها یا رفع باگ‌های پروژه، همیشه باید نسخه برنامه در مسیر `src/updates.js` به‌روزرسانی شود و توضیحات تغییرات اعمال شده (زیرمجموعه کلید `fa`) حتماً به زبان فارسی نوشته شود.

