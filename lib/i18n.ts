'use client';

import { useState, useEffect } from 'react';

export type Lang = 'en' | 'ru';

export const t = {
  en: {
    hero_title: "Your room. Your taste. 2 minutes.",
    hero_sub: "Photo or quiz → complete room → buy instantly",
    upload_label: "Drop your room photo here",
    upload_sub: "or click to browse",
    quiz_label: "No photo? Answer 5 questions",
    quiz_sub: "We'll figure out your style",
    budget_label: "Your budget",
    cta: "Find my perfect room →",
    analyzing: "Analyzing your space...",
    matching: "Matching your style...",
    curating: "Curating perfect pieces...",
    almost: "Almost ready...",
    results_title: "Your perfect rooms",
    get_room: "Get this room →",
    start_over: "← Start over",
    email_placeholder: "your@email.com",
    send_btn: "Send to my email",
    success_msg: "✓ Check your inbox",
    error_msg: "Something went wrong. Try again.",
    retry: "Retry",
    monthly: "or ₽{amount}/month",
    total: "Total",
    quiz_next: "Next →",
    quiz_back: "← Back",
    quiz_submit: "Find my room →",
    lang_toggle: "RU",
    q1_label: "What's the occasion?",
    q1_opt1: "Moving in for the first time",
    q1_opt2: "Renovation / redesign",
    q1_opt3: "New apartment",
    q1_opt4: "Just refreshing",
    q2_label: "What's your budget?",
    q2_opt1: "Up to ₽50,000",
    q2_opt2: "₽50,000 – ₽150,000",
    q2_opt3: "₽150,000 – ₽300,000",
    q2_opt4: "₽300,000+",
    q3_label: "How do you want to feel in this room?",
    q3_opt1: "Calm and cozy",
    q3_opt2: "Stylish and modern",
    q3_opt3: "Creative and inspired",
    q3_opt4: "Warm and classic",
    q4_label: "Which room are we furnishing?",
    q4_opt1: "Living room",
    q4_opt2: "Bedroom",
    q4_opt3: "Studio",
    q4_opt4: "Home office",
    q5_label: "Your email for the result",
    timeout_msg: "Taking longer than usual…",
    close: "Close",
    confirm_send: "Send to this email",
    enter_email: "Enter your email",
    confirm_email_msg: "We'll send your room to:",
    step_of: "of",
  },
  ru: {
    hero_title: "Ваша комната. Ваш стиль. 2 минуты.",
    hero_sub: "Фото или квиз → готовая комната → купить сразу",
    upload_label: "Перетащите фото комнаты сюда",
    upload_sub: "или нажмите для выбора",
    quiz_label: "Нет фото? Ответьте на 5 вопросов",
    quiz_sub: "Подберём стиль под вас",
    budget_label: "Ваш бюджет",
    cta: "Найти мою комнату →",
    analyzing: "Анализируем пространство...",
    matching: "Подбираем стиль...",
    curating: "Собираем комплект...",
    almost: "Почти готово...",
    results_title: "Ваши идеальные комнаты",
    get_room: "Хочу эту комнату →",
    start_over: "← Начать заново",
    email_placeholder: "ваш@email.com",
    send_btn: "Отправить на почту",
    success_msg: "✓ Проверьте почту",
    error_msg: "Что-то пошло не так. Попробуйте ещё раз.",
    retry: "Повторить",
    monthly: "или ₽{amount}/мес",
    total: "Итого",
    quiz_next: "Далее →",
    quiz_back: "← Назад",
    quiz_submit: "Найти мою комнату →",
    lang_toggle: "EN",
    q1_label: "По какому поводу?",
    q1_opt1: "Переезжаю впервые",
    q1_opt2: "Ремонт / редизайн",
    q1_opt3: "Новая квартира",
    q1_opt4: "Просто обновляю",
    q2_label: "Ваш бюджет?",
    q2_opt1: "До ₽50 000",
    q2_opt2: "₽50 000 – ₽150 000",
    q2_opt3: "₽150 000 – ₽300 000",
    q2_opt4: "₽300 000+",
    q3_label: "Как вы хотите себя чувствовать?",
    q3_opt1: "Спокойно и уютно",
    q3_opt2: "Стильно и современно",
    q3_opt3: "Творчески и вдохновлённо",
    q3_opt4: "Тепло и классично",
    q4_label: "Какую комнату обставляем?",
    q4_opt1: "Гостиная",
    q4_opt2: "Спальня",
    q4_opt3: "Студия",
    q4_opt4: "Рабочий кабинет",
    q5_label: "Ваш email для результата",
    timeout_msg: "Занимает дольше обычного…",
    close: "Закрыть",
    confirm_send: "Отправить на этот email",
    enter_email: "Введите ваш email",
    confirm_email_msg: "Отправим вашу комнату на:",
    step_of: "из",
  }
};

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('nestglow_lang') as Lang | null;
    if (stored === 'en' || stored === 'ru') {
      setLangState(stored);
    } else {
      const browserLang = navigator.language.toLowerCase();
      const detected: Lang = browserLang.startsWith('ru') ? 'ru' : 'en';
      setLangState(detected);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('nestglow_lang', newLang);
  };

  return [lang, setLang];
}
