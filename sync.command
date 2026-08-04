#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo "== Sync FontWow =="

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "این پوشه یک ریپازیتوری گیت نیست."
  read -p "برای خروج Enter بزنید..."
  exit 1
fi

echo "-> در حال Pull..."
git pull --rebase origin main

if [ -n "$(git status --porcelain)" ]; then
  echo "-> تغییرات جدید پیدا شد، در حال Commit..."
  git add -A
  git commit -m "Auto sync $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo "-> تغییری برای Commit وجود ندارد."
fi

echo "-> در حال Push..."
git push origin main

echo "== انجام شد =="
read -p "برای خروج Enter بزنید..."
