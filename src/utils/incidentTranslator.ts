// src/utils/incidentTranslator.ts

// Словник усіх термінів для перекладу
export const INCIDENT_DICTIONARY = {
  // Типи інцидентів (incident_type)
  types: {
    ambulance_call: '🚑 Виклик швидкої',
    police_call: '🚓 Виклик поліції',
    medical_aid: '🩹 Домедична допомога',
    lost_child: '👶 Загублена дитина',
    critical_swimmer: '🏊‍♂️ Порятунок на воді',
    other: '⚠️ Інше',
  } as Record<string, string>,

  // Причини (cause_details)
  causes: {
    alcohol: 'Алкогольне сп\'яніння',
    alcohol_drinking: 'Розпивання спиртного',
    exhaustion: 'Виснаження сил',
    cramp: 'Судоми',
    hypothermia: 'Переохолодження',
    sunstroke: 'Сонячний удар',
    drowning_swallowed: 'Наковтався води / Тонув',
    forbidden_zone: 'Заплив у заборонену зону',
    rule_violation: 'Порушення правил поведінки',
    hooliganism: 'Хуліганство',
    cut_wound: 'Поріз / Рана',
    insect_bite: 'Укус комахи/медузи',
    dislocation_fracture: 'Вивих / Перелом',
    loss_consciousness: 'Втрата свідомості',
    heart_disease: 'Серцевий напад',
    allergy: 'Алергічна реакція',
    disability: 'Особа з інвалідністю',
    lifeguard_found: 'Виявлено лайфгардом',
    reported_by_adult: 'Повідомили дорослі',
    stranger_brought: 'Привели сторонні люди',
    entangled_seaweed: 'Заплутався у водоростях',
    other: 'Інше',
  } as Record<string, string>,

  // Дії (actions_taken)
  actions: {
    dialogue: 'Профілактична бесіда',
    rescue: 'Порятунок / Транспортування',
    move_to_safe_zone: 'Виведення у безпечну зону',
    medical_aid: 'Надання домедичної допомоги',
    call_ambulance: 'Виклик швидкої допомоги',
    search_on_land: 'Пошук на суші',
    found_child: 'Дитину знайдено',
    other: 'Інші дії',
  } as Record<string, string>,

  // Результат (outcome_details)
  outcomes: {
    applied_bandage: 'Накладено пов\'язку',
    applied_plaster: 'Накладено пластир',
    treated_wound: 'Оброблено рану',
    help_not_needed: 'Допомога не знадобилась',
    sent_to_medpoint: 'Направлено до медпункту',
    called_ambulance: 'Викликано швидку',
    taken_by_ambulance: 'Госпіталізовано швидкою',
    treated_left_beach: 'Отримав допомогу та пішов',
    protocol_offender_left: 'Складено протокол, порушник пішов',
    protocol_offender_stayed: 'Складено протокол, порушник залишився',
    offender_left_with_police: 'Забрала поліція',
    police_no_action: 'Поліція не вжила заходів',
    other: 'Інше',
  } as Record<string, string>,
};

export type IncidentCategory = keyof typeof INCIDENT_DICTIONARY;

/**
 * Універсальна функція для парсингу та перекладу
 * @param category - категорія ('types', 'causes', 'actions', 'outcomes')
 * @param rawValue - значення з БД (рядок, JSON-рядок або JSON-масив)
 */
export const translateIncidentField = (
  category: IncidentCategory,
  rawValue: string | null | undefined
): string => {
  if (!rawValue) return '—';

  let parsedValues: string[] = [];

  // 1. Спроба розпарсити (JSON або простий текст)
  try {
    // Якщо це масив у вигляді рядка '["a","b"]'
    if (rawValue.trim().startsWith('[') || rawValue.trim().startsWith('"')) {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
            parsedValues = parsed;
        } else if (typeof parsed === 'string') {
            parsedValues = [parsed];
        } else {
            parsedValues = [String(parsed)];
        }
    } else {
        // Звичайний текст без лапок
        parsedValues = [rawValue];
    }
  } catch (e) {
    // Fallback: вважаємо це просто рядком
    parsedValues = [rawValue];
  }

  // 2. Переклад
  const translatedParts = parsedValues.map((key) => {
    const cleanKey = String(key).trim();
    return INCIDENT_DICTIONARY[category][cleanKey] || cleanKey;
  });

  return translatedParts.join(', ');
};

/**
 * Отримання стилів та іконки для картки інциденту
 */
export const getIncidentStyle = (type: string | null) => {
    const t = (type || '').toLowerCase();
    if (t.includes('ambulance')) return { color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300', icon: '🚑' };
    if (t.includes('police')) return { color: 'text-blue-800 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300', icon: '🚓' };
    if (t.includes('medical')) return { color: 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300', icon: '🩹' };
    if (t.includes('lost_child')) return { color: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300', icon: '👶' };
    if (t.includes('critical') || t.includes('swimmer')) return { color: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-300', icon: '🏊‍♂️' };
    
    return { color: 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300', icon: '⚠️' };
};