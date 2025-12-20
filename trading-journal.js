// ============================================
// TRADING JOURNAL MODULE
// ============================================

const JOURNAL_STORAGE_KEY = 'tradingJournalEntries';

// Journal data
let journalEntries = [];
let currentTradeId = null;
let currentSetup = null;
let lastSavedTradeId = null;

// Setup definitions
const SETUPS = [
  { id: 1, name: 'WPOC lvl-ийн Manipulation', questionSetId: 'DEFAULT' },
  { id: 2, name: 'WPOC lvl-ийн Double Manipulation', questionSetId: 'DEFAULT' },
  { id: 3, name: 'WPOC Manipulation-ийн Test-ийн Manipulation', questionSetId: 'DEFAULT' },
  { id: 4, name: 'WPOC Manipulation-ий Test-ийн Double Manipulation', questionSetId: 'DEFAULT' },
  { id: 5, name: 'Test lvl Manipulation', questionSetId: 'TEST_LVL' },
  { id: 6, name: 'Test lvl Double Manipulation', questionSetId: 'TEST_LVL' },
  { id: 7, name: 'Test-ийн Manipulation-ий Test-ийн Manipulation', questionSetId: 'TEST_LVL' },
  { id: 8, name: 'Test-ийн Manipulation-ий Test-ийн Double Manipulation', questionSetId: 'TEST_LVL' },
  { id: 9, name: 'Manipulation дараа Дагаж Орох', questionSetId: 'DAGAJ_OROH' },
  { id: 10, name: 'Block-ын Zone-оос Дагаж орох', questionSetId: 'BLOCK_ZONE' },
  { id: 11, name: 'Block Гаралтын дараа Дагаж Орох', questionSetId: 'BLOCK_EXIT' },
  { id: 12, name: 'Эсрэг тоглогчийн Test lvl Break орсны дараа Дагаж Орох', questionSetId: 'TEST_BREAK' },
  { id: 13, name: 'Эсрэг тоглогчийн WPOC lvl Break орсны дараа Дагаж Орох', questionSetId: 'WPOC_BREAK' },
  { id: 14, name: 'Counter Trend Дагуу Орох', questionSetId: 'COUNTER_TREND' },
  { id: 15, name: 'Counter Trend араас Дагаж Орох', questionSetId: 'COUNTER_TREND' }
];

// Ticker colors (matching table component colors)
const TICKER_COLORS = {
  'NQ': '#87CEEB',
  'ES': '#7a5bb9ff',
  'GC': '#FFD700',
  '6E': '#16a216ff',
  'BTC': '#e5830bff',
  'CL': '#2F4F4F'
};

// Question sets for different setups
const QUESTION_SETS = {
  // Default questions for setups 1-4
  DEFAULT: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q1_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null // Will be set based on entry direction
    },
    {
      id: 'q2_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null // Will be set based on entry direction
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Test lvl setups (5-8)
  TEST_LVL: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q1_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q2_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_test_impulse',
      label: 'Тестийн lvl үүсгэсэсэн Impulse Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Manipulation дараа Дагаж Орох (setup 9)
  DAGAJ_OROH: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q1_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q2_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_impulse_behind',
      label: 'Lvl рүү дайрсан бар/барууд Impulse profile цаана нь шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_manip_closed',
      label: 'Manipulation баталгаа +1 TF өөр дээр нь орж хаагдсан эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_stopping',
      label: 'Connection үүсгэсэн cluster StoppingAction орсон эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_followup_profile',
      label: 'Market Profile Хүлээлт (Дагаж орох)',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_followup_constructor',
      label: 'Constructor хүлээлт (Дагаж орох)',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_followup_wave',
      label: 'Wave profile шилжсэн эсэх (Connection)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q_followup_impulse',
      label: 'Impulse profile шилжсэн эсэх (Connection)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_followup_entry_cluster',
      label: 'Оролтын cluster (Connection)',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q_followup_exit_cluster',
      label: 'Гаралтын cluster (Connection)',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q_followup_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон (Connection)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_followup_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү (Connection)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_followup_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан (Connection)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for WPOC Блокийн zone (setup 10)
  BLOCK_ZONE: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q1_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q2_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_block_profile_shift',
      label: 'Блокын Zone руу Market Profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_block_initiative_shift',
      label: 'Санаачлага ${direction} тал руу солигдсон эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_block_profile_expectation',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_block_constructor_expectation',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q_connection_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q_connection_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q_connection_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Block Гаралтын дараа Дагаж Орох (setup 11)
  BLOCK_EXIT: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q1_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q2_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_block_exit_impulse',
      label: 'Блокын гаралтын Impulse profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_block_exit_cluster',
      label: 'Блокын гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'Энгийн түлхэлт', 'StoppingAction']
    },
    {
      id: 'q_small_setup_manipulation',
      label: '+1 TF дээрх блокны дээд хүрээтэй ойр блокны Manipulation авсан эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_connection_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q_connection_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q_connection_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q_connection_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q_connection_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Эсрэг тоглогчийн Test lvl Break (setup 12)
  TEST_BREAK: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q_test_break_profile_shift',
      label: 'Wave эсвэл Impulse Profile манай ${direction} тал руу шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_test_break_cluster',
      label: 'Тестийн lvl-ийг Break хийж гарч ирсэн cluster',
      type: 'radio',
      options: ['Цохилт', 'Энгийн түлхэлт', 'StoppingAction']
    },
    {
      id: 'q_test_break_impulse',
      label: 'Testийн lvl-ийг Break хийсэн тоглогчийн Impulse Profile хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_test_break_manipulation',
      label: '+1 TF дээрх Break хийсэн блокны дээд хүрээтэй ойр блокны Manipulation авсан эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Эсрэг тоглогчийн WPOC lvl Break (setup 13) - same as TEST_BREAK
  WPOC_BREAK: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q_test_break_profile_shift',
      label: 'Эсрэг тоглогчийн Wave эсвэл Impulse Profile манай ${direction} тал руу шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_test_break_cluster',
      label: 'WPOC lvl-ийг Break хийж гарч ирсэн cluster',
      type: 'radio',
      options: ['Цохилт', 'Энгийн түлхэлт', 'StoppingAction']
    },
    {
      id: 'q_test_break_impulse',
      label: 'WPOC lvl-ийг Break хийсэн тоглогчийн Wave болон Impulse Profile хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_test_break_manipulation',
      label: '+1 TF дээрх Break хийсэн блокны дээд хүрээтэй ойр блокны Manipulation авсан эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave дотор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ],

  // Questions for Counter Trend (setups 14, 15)
  COUNTER_TREND: [
    {
      id: 'ticker',
      label: 'Тикер сонгох',
      type: 'select',
      options: ['NQ', 'ES', 'GC', '6E', 'BTC', 'CL'],
      default: 'NQ'
    },
    {
      id: 'weekly',
      label: 'Weekly хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'daily',
      label: 'Daily хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: 'Ойлгомжгүй'
    },
    {
      id: 'q_counter_profile_shift',
      label: 'Эсрэг тоглогчийн Wave эсвэл Impulse Profile манай ${direction} тал руу шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй']
    },
    {
      id: 'q_counter_wbp_cluster',
      label: 'WBP lvl-ийг сэтэлсэн гаралтын cluster',
      type: 'radio',
      options: ['StoppingAction', 'Цохилт', 'Энгийн']
    },
    {
      id: 'q_counter_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'Энгийн түлхэлт', 'StoppingAction']
    },
    {
      id: 'q_counter_small_profile',
      label: 'Market Profile Хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q_counter_small_constructor',
      label: 'Constructor хүлээлт',
      type: 'radio',
      options: ['Long', 'Short', 'Ойлгомжгүй'],
      default: null
    },
    {
      id: 'q3_wave',
      label: 'Wave profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Үгүй'
    },
    {
      id: 'q4_impulse',
      label: 'Impulse profile шилжсэн эсэх',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q5_entry_cluster',
      label: 'Оролтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction']
    },
    {
      id: 'q6_exit_cluster',
      label: 'Гаралтын cluster',
      type: 'radio',
      options: ['Цохилт', 'StoppingAction', 'Энгийн түлхэлт', 'Энгийн StoppingAction', 'Байхгүй (Single bar Manipulation)']
    },
    {
      id: 'q7_volume_spike',
      label: 'Lvl-ийн цаана оролтын cluster тухайн wave доторор багтах топ 3 volume spike орсон',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q8_exit_volume',
      label: 'Гаралтын cluster-ийн volume оролтын барын өмнөх бараас/дунджаас илүү',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'q9_volume_decrease',
      label: 'Lvl рүү тулж очсон cluster-уудын volume ерөнхийдөө буурч ажиглагдсан',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      default: 'Тийм'
    },
    {
      id: 'session',
      label: 'Market session',
      type: 'radio',
      options: ['Asia', 'Europe', 'US'],
      optional: true
    },
    {
      id: 'risk',
      label: 'Risk',
      type: 'number',
      optional: true,
      placeholder: 'Жишээ нь: 100$'
    },
    {
      id: 'reward',
      label: 'Reward',
      type: 'number',
      optional: true,
      placeholder: '300$, 500$'
    },
    {
      id: 'risk_reward',
      label: 'R/R',
      type: 'number',
      optional: true
    },
    {
      id: 'safe_rule',
      label: 'Safe-ийн дүрэм өгсөн эсэх (1:1 Break-even)',
      type: 'radio',
      options: ['Тийм', 'Үгүй'],
      optional: true
    },
    {
      id: 'result',
      label: 'Үр дүн',
      type: 'radio',
      options: ['Win', 'Loss'],
      optional: true
    },
    {
      id: 'psychology',
      label: 'Арилжааны өмнөх сэтгэлзүй',
      type: 'text',
      optional: true
    },
    {
      id: 'lesson',
      label: 'Дараа юун дээр анхаарах',
      type: 'text',
      optional: true
    }
  ]
};

// Initialize trading journal
function initializeTradingJournal() {
  loadJournalEntries();
  setupJournalEventListeners();
  renderJournalList();
}

// Load journal entries from localStorage
function loadJournalEntries() {
  const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
  if (saved) {
    try {
      journalEntries = JSON.parse(saved);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      journalEntries = [];
    }
  }
}

// Save journal entries to localStorage
function saveJournalEntries() {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries));
}

// Setup event listeners
function setupJournalEventListeners() {
  // Add trade button
  const addTradeBtn = document.getElementById('add-trade-btn');
  if (addTradeBtn) {
    addTradeBtn.addEventListener('click', showSetupSelection);
  }
  
  // Header back button
  const headerBackBtn = document.getElementById('header-back-btn');
  if (headerBackBtn) {
    headerBackBtn.addEventListener('click', resetJournalView);
  }
  
  // Save button
  const saveBtn = document.getElementById('journal-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveTradeEntry);
  }
  
  // Questionnaire back button
  const questionnaireBackBtn = document.getElementById('questionnaire-back-btn');
  if (questionnaireBackBtn) {
    questionnaireBackBtn.addEventListener('click', () => showSetupSelection(false));
  }
}

// Show setup selection
function showSetupSelection(resetScroll = true) {
  const listContainer = document.getElementById('journal-list-container');
  const setupContainer = document.getElementById('journal-setup-container');
  const questionnaireContainer = document.getElementById('journal-questionnaire-container');
  const optionsContainer = document.getElementById('journal-setup-options');
  const addBtn = document.getElementById('add-trade-btn');
  const headerBackBtn = document.getElementById('header-back-btn');
  
  if (!setupContainer || !optionsContainer) return;
  
  // Clear and populate setup options
  optionsContainer.innerHTML = '';
  
  // Create header with title and search side by side
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'flex items-center justify-between gap-4 mb-4';
  
  // Create title
  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold text-white whitespace-nowrap';
  title.textContent = 'Сетап сонгох';
  
  // Create search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.id = 'setup-search-input';
  searchInput.placeholder = 'Setup хайх';
  searchInput.className = 'w-64 px-4 py-1.5 bg-white/10 text-white rounded-lg border-2 border-white/30 focus:border-blue-500 focus:outline-none placeholder-white/50';
  
  headerWrapper.appendChild(title);
  headerWrapper.appendChild(searchInput);
  optionsContainer.appendChild(headerWrapper);
  
  // Create container for setup buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.id = 'setup-buttons-container';
  buttonsContainer.className = 'space-y-3';
  
  SETUPS.forEach(setup => {
    const button = document.createElement('button');
    button.className = 'setup-option-btn w-full p-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border-2 border-transparent hover:border-blue-500 flex flex-col items-center gap-3';
    button.setAttribute('data-setup-name', setup.name.toLowerCase());
    button.setAttribute('data-setup-id', setup.id);
    
    // Create title
    const title = document.createElement('div');
    title.className = 'font-semibold text-base text-center';
    title.textContent = `${setup.id}. ${setup.name}`;
    
    // Create image container with relative positioning
    const imgContainer = document.createElement('div');
    imgContainer.className = 'relative w-full group';
    
    // Create image element
    const img = document.createElement('img');
    img.src = `./assets/setups/${setup.id}.png`;
    img.alt = setup.name;
    img.className = 'w-full h-auto object-contain rounded';
    
    // Create magnifier icon
    const magnifier = document.createElement('div');
    magnifier.className = 'absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer';
    magnifier.innerHTML = `
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
      </svg>
    `;
    
    // Magnifier click handler
    magnifier.addEventListener('click', (e) => {
      e.stopPropagation();
      showImageZoom(img.src, setup.name);
    });
    
    imgContainer.appendChild(img);
    imgContainer.appendChild(magnifier);
    
    button.appendChild(title);
    button.appendChild(imgContainer);
    button.addEventListener('click', () => selectSetup(setup.id));
    buttonsContainer.appendChild(button);
  });
  
  optionsContainer.appendChild(buttonsContainer);
  
  // Add search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const buttons = buttonsContainer.querySelectorAll('.setup-option-btn');
    
    buttons.forEach(button => {
      const setupName = button.getAttribute('data-setup-name');
      if (setupName.includes(searchTerm)) {
        button.style.display = 'flex';
      } else {
        button.style.display = 'none';
      }
    });
  });
  
  // Hide list, show setup selection
  if (listContainer) listContainer.classList.add('hidden');
  if (questionnaireContainer) questionnaireContainer.classList.add('hidden');
  setupContainer.classList.remove('hidden');
  
  // Toggle header buttons
  if (addBtn) addBtn.classList.add('hidden');
  if (headerBackBtn) headerBackBtn.classList.remove('hidden');
  
  // Reset scroll position only when coming from Add button
  if (resetScroll && setupContainer) {
    setupContainer.scrollTop = 0;
  }
}

// Select setup and show questionnaire
function selectSetup(setupId) {
  currentSetup = setupId;
  showQuestionnaire();
}

// Show questionnaire
function showQuestionnaire(entry = null) {
  const listContainer = document.getElementById('journal-list-container');
  const setupContainer = document.getElementById('journal-setup-container');
  const questionnaireContainer = document.getElementById('journal-questionnaire-container');
  const form = document.getElementById('journal-questionnaire-form');
  
  if (!questionnaireContainer || !form) return;
  
  // Get the correct question set for current setup
  const setup = SETUPS.find(s => s.id === currentSetup);
  const QUESTIONS = QUESTION_SETS[setup?.questionSetId || 'DEFAULT'];
  
  // Build questionnaire form
  form.innerHTML = '';
  
  // Entry direction selection (BUY/SELL)
  const entryGroup = createEntryDirectionGroup();
  form.appendChild(entryGroup);
  
  // Create wrapper for all questions (disabled until entry direction is selected)
  const questionsWrapper = document.createElement('div');
  questionsWrapper.id = 'questions-wrapper';
  questionsWrapper.className = 'opacity-30 pointer-events-none transition-all duration-300';
  
  // Group 0: Ticker selection (before entry direction questions)
  const tickerGroup = document.createElement('div');
  tickerGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const tickerQ = createQuestionGroup(QUESTIONS[0], 0, '#7dd3fc'); // Sky blue for ticker
  tickerGroup.appendChild(tickerQ);
  questionsWrapper.appendChild(tickerGroup);
  
  // Group 1: Weekly and Daily хүлээлт
  const timeframeGroup = document.createElement('div');
  timeframeGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const weeklyQ = createQuestionGroup(QUESTIONS[1], 1, '#FFC107'); // Yellow for Weekly
  const dailyQ = createQuestionGroup(QUESTIONS[2], 2, '#e7a7f3ff'); // Purple for Daily
  
  timeframeGroup.appendChild(weeklyQ);
  timeframeGroup.appendChild(dailyQ);
  questionsWrapper.appendChild(timeframeGroup);
  
  // Group 2: +1 Setup TF questions
  const setupTFGroup = document.createElement('div');
  setupTFGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const setupTFTitle = document.createElement('h3');
  setupTFTitle.className = 'text-base font-bold mb-3';
  setupTFTitle.style.color = '#7dd3fc';
  setupTFTitle.innerHTML = '+1 Setup TF-ийн хувьд (<span style="color: #ec6764ff;">H1</span>/<span style="color: #5cc561ff;">H4</span>)';
  setupTFGroup.appendChild(setupTFTitle);
  
  // For TEST_BREAK and WPOC_BREAK setups (12, 13), use different questions
  if (setup?.questionSetId === 'TEST_BREAK' || setup?.questionSetId === 'WPOC_BREAK') {
    const qTestBreakProfileShift = createQuestionGroup(QUESTIONS[3], 3);
    const qTestBreakCluster = createQuestionGroup(QUESTIONS[4], 4);
    const qTestBreakImpulse = createQuestionGroup(QUESTIONS[5], 5);
    
    setupTFGroup.appendChild(qTestBreakProfileShift);
    setupTFGroup.appendChild(qTestBreakCluster);
    setupTFGroup.appendChild(qTestBreakImpulse);
  } else if (setup?.questionSetId === 'COUNTER_TREND') {
    const qCounterProfileShift = createQuestionGroup(QUESTIONS[3], 3);
    const qCounterWbpCluster = createQuestionGroup(QUESTIONS[4], 4);
    const qCounterEntryCluster = createQuestionGroup(QUESTIONS[5], 5);
    
    setupTFGroup.appendChild(qCounterProfileShift);
    setupTFGroup.appendChild(qCounterWbpCluster);
    setupTFGroup.appendChild(qCounterEntryCluster);
  } else {
    // Default questions for other setups
    const q1Profile = createQuestionGroup(QUESTIONS[3], 3);
    const q2Constructor = createQuestionGroup(QUESTIONS[4], 4);
    
    setupTFGroup.appendChild(q1Profile);
    setupTFGroup.appendChild(q2Constructor);
  }
  
  // For TEST_LVL setups (5-8), add test impulse question
  if (setup?.questionSetId === 'TEST_LVL') {
    const qTestImpulse = createQuestionGroup(QUESTIONS[5], 5);
    setupTFGroup.appendChild(qTestImpulse);
  }
  
  // For DAGAJ_OROH setup (9), add 3 additional questions
  if (setup?.questionSetId === 'DAGAJ_OROH') {
    const qImpulseBehind = createQuestionGroup(QUESTIONS[5], 5);
    const qManipClosed = createQuestionGroup(QUESTIONS[6], 6);
    const qConnectionStopping = createQuestionGroup(QUESTIONS[7], 7);
    setupTFGroup.appendChild(qImpulseBehind);
    setupTFGroup.appendChild(qManipClosed);
    setupTFGroup.appendChild(qConnectionStopping);
  }
  
  questionsWrapper.appendChild(setupTFGroup);

  // For TEST_BREAK and WPOC_BREAK setups (12, 13), add "Жижиг ерөнхий 0 Setup TF" group
  if (setup?.questionSetId === 'TEST_BREAK' || setup?.questionSetId === 'WPOC_BREAK') {
    const smallSetupGroup = document.createElement('div');
    smallSetupGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const smallSetupTitle = document.createElement('h3');
    smallSetupTitle.className = 'text-base font-bold mb-3';
    smallSetupTitle.style.color = '#7dd3fc';
    smallSetupTitle.innerHTML = 'Жижиг ерөнхий 0 Setup TF (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    smallSetupGroup.appendChild(smallSetupTitle);
    
    const qTestBreakManipulation = createQuestionGroup(QUESTIONS[6], 6);
    smallSetupGroup.appendChild(qTestBreakManipulation);
    questionsWrapper.appendChild(smallSetupGroup);
  }

  // For COUNTER_TREND setups (14, 15), add "Жижиг ерөнхий 0 Setup TF" group
  if (setup?.questionSetId === 'COUNTER_TREND') {
    const smallSetupGroup = document.createElement('div');
    smallSetupGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const smallSetupTitle = document.createElement('h3');
    smallSetupTitle.className = 'text-base font-bold mb-3';
    smallSetupTitle.style.color = '#7dd3fc';
    smallSetupTitle.innerHTML = 'Жижиг ерөнхий 0 Setup TF (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    smallSetupGroup.appendChild(smallSetupTitle);
    
    const qCounterSmallProfile = createQuestionGroup(QUESTIONS[6], 6);
    const qCounterSmallConstructor = createQuestionGroup(QUESTIONS[7], 7);
    smallSetupGroup.appendChild(qCounterSmallProfile);
    smallSetupGroup.appendChild(qCounterSmallConstructor);
    questionsWrapper.appendChild(smallSetupGroup);
  }
  
  // For BLOCK_ZONE setup (10), add "Оролтын 0 TF" group
  if (setup?.questionSetId === 'BLOCK_ZONE') {
    const entryTFGroup = document.createElement('div');
    entryTFGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const entryTFTitle = document.createElement('h3');
    entryTFTitle.className = 'text-base font-bold mb-3';
    entryTFTitle.style.color = '#7dd3fc';
    entryTFTitle.innerHTML = 'Жижиг Setup 0 TF (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    entryTFGroup.appendChild(entryTFTitle);
    
    // Add 4 block zone questions (indices 5-8)
    const qBlockProfileShift = createQuestionGroup(QUESTIONS[5], 5);
    const qBlockInitiativeShift = createQuestionGroup(QUESTIONS[6], 6);
    const qBlockProfileExpectation = createQuestionGroup(QUESTIONS[7], 7);
    const qBlockConstructorExpectation = createQuestionGroup(QUESTIONS[8], 8);
    
    entryTFGroup.appendChild(qBlockProfileShift);
    entryTFGroup.appendChild(qBlockInitiativeShift);
    entryTFGroup.appendChild(qBlockProfileExpectation);
    entryTFGroup.appendChild(qBlockConstructorExpectation);
    
    questionsWrapper.appendChild(entryTFGroup);
  }
  
  // For DAGAJ_OROH setup (9), add "Дагаж орох ерөнхий 0 Setup TF" group
  if (setup?.questionSetId === 'DAGAJ_OROH') {
    const followupSetupGroup = document.createElement('div');
    followupSetupGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const followupSetupTitle = document.createElement('h3');
    followupSetupTitle.className = 'text-base font-bold mb-3';
    followupSetupTitle.style.color = '#7dd3fc';
    followupSetupTitle.innerHTML = 'Дагаж орох ерөнхий 0 Setup TF (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    followupSetupGroup.appendChild(followupSetupTitle);
    
    const qFollowupProfile = createQuestionGroup(QUESTIONS[8], 8);
    const qFollowupConstructor = createQuestionGroup(QUESTIONS[9], 9);
    
    followupSetupGroup.appendChild(qFollowupProfile);
    followupSetupGroup.appendChild(qFollowupConstructor);
    questionsWrapper.appendChild(followupSetupGroup);
  }

  // For BLOCK_EXIT setup (11), add 2 additional questions to +1 Setup TF group
  if (setup?.questionSetId === 'BLOCK_EXIT') {
    // Add block exit impulse and cluster questions to the setup group (after q1_profile and q2_constructor)
    const blockExitImpulse = createQuestionGroup(QUESTIONS[5], 5);
    const blockExitCluster = createQuestionGroup(QUESTIONS[6], 6);
    setupTFGroup.appendChild(blockExitImpulse);
    setupTFGroup.appendChild(blockExitCluster);
  }

  // For BLOCK_EXIT setup (11), add "Жижиг ерөнхий 0 Setup TF" group
  if (setup?.questionSetId === 'BLOCK_EXIT') {
    const smallSetupGroup = document.createElement('div');
    smallSetupGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const smallSetupTitle = document.createElement('h3');
    smallSetupTitle.className = 'text-base font-bold mb-3';
    smallSetupTitle.style.color = '#7dd3fc';
    smallSetupTitle.innerHTML = 'Жижиг ерөнхий 0 Setup TF (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    smallSetupGroup.appendChild(smallSetupTitle);
    
    const qSmallSetupManipulation = createQuestionGroup(QUESTIONS[7], 7);
    smallSetupGroup.appendChild(qSmallSetupManipulation);
    questionsWrapper.appendChild(smallSetupGroup);
  }
  
  // Group 3: Сигналын 0 TF questions (skip for DAGAJ_OROH, BLOCK_ZONE, BLOCK_EXIT, TEST_BREAK, WPOC_BREAK, and COUNTER_TREND)
  if (setup?.questionSetId !== 'DAGAJ_OROH' && setup?.questionSetId !== 'BLOCK_ZONE' && setup?.questionSetId !== 'BLOCK_EXIT' && setup?.questionSetId !== 'TEST_BREAK' && setup?.questionSetId !== 'WPOC_BREAK' && setup?.questionSetId !== 'COUNTER_TREND') {
    const signalTFGroup = document.createElement('div');
    signalTFGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const signalTFTitle = document.createElement('h3');
    signalTFTitle.className = 'text-base font-bold mb-3';
    signalTFTitle.style.color = '#7dd3fc';
    signalTFTitle.innerHTML = 'Сигналын 0 TF дээрх баталгаа (<span style="color: #FF9800;">M5</span>/<span style="color: #FF9800;">M15</span>)';
    signalTFGroup.appendChild(signalTFTitle);
    
    // Determine starting index based on setup
    let signalStartIdx = 5;
    if (setup?.questionSetId === 'TEST_LVL') signalStartIdx = 6;
    
    // Add questions q3_wave through q9_volume_decrease (7 questions)
    for (let i = signalStartIdx; i < signalStartIdx + 7; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      signalTFGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(signalTFGroup);
  }
  
  // For DAGAJ_OROH setup (9), add connection signal group
  if (setup?.questionSetId === 'DAGAJ_OROH') {
    const connectionGroup = document.createElement('div');
    connectionGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const connectionTitle = document.createElement('h3');
    connectionTitle.className = 'text-base font-bold mb-3';
    connectionTitle.style.color = '#7dd3fc';
    connectionTitle.innerHTML = 'Сигналын -1 TF дээрх баталгаа (<span style="color: #FF9800;">M1</span>)';
    connectionGroup.appendChild(connectionTitle);
    
    // Add 7 connection questions (indices 17-23)
    for (let i = 17; i < 24; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      connectionGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(connectionGroup);
  }

  // For BLOCK_ZONE setup (10), add connection signal group
  if (setup?.questionSetId === 'BLOCK_ZONE') {
    const connectionGroup = document.createElement('div');
    connectionGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const connectionTitle = document.createElement('h3');
    connectionTitle.className = 'text-base font-bold mb-3';
    connectionTitle.style.color = '#7dd3fc';
    connectionTitle.innerHTML = 'Сигналын -1 TF дээрх баталгаа (<span style="color: #FF9800;">M1</span>)';
    connectionGroup.appendChild(connectionTitle);
    
    // Add 7 connection signal questions (indices 16-22)
    for (let i = 16; i < 23; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      connectionGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(connectionGroup);
  }

  // For BLOCK_EXIT setup (11), add connection signal group
  if (setup?.questionSetId === 'BLOCK_EXIT') {
    const connectionGroup = document.createElement('div');
    connectionGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const connectionTitle = document.createElement('h3');
    connectionTitle.className = 'text-base font-bold mb-3';
    connectionTitle.style.color = '#7dd3fc';
    connectionTitle.innerHTML = 'Сигналын -1 TF дээрх баталгаа (<span style="color: #FF9800;">M1</span>)';
    connectionGroup.appendChild(connectionTitle);
    
    // Add 7 connection signal questions (indices 8-14)
    for (let i = 8; i < 15; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      connectionGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(connectionGroup);
  }

  // For TEST_BREAK and WPOC_BREAK setups (12, 13), add signal group with -1 TF title
  if (setup?.questionSetId === 'TEST_BREAK' || setup?.questionSetId === 'WPOC_BREAK') {
    const signalTFGroup = document.createElement('div');
    signalTFGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const signalTFTitle = document.createElement('h3');
    signalTFTitle.className = 'text-base font-bold mb-3';
    signalTFTitle.style.color = '#7dd3fc';
    signalTFTitle.innerHTML = 'Сигналын -1 TF дээрх баталгаа (<span style="color: #FF9800;">M1</span>)';
    signalTFGroup.appendChild(signalTFTitle);
    
    // Add 7 signal questions (indices 7-13)
    for (let i = 7; i < 14; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      signalTFGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(signalTFGroup);
  }

  // For COUNTER_TREND setups (14, 15), add signal group with -1 TF title
  if (setup?.questionSetId === 'COUNTER_TREND') {
    const signalTFGroup = document.createElement('div');
    signalTFGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
    
    const signalTFTitle = document.createElement('h3');
    signalTFTitle.className = 'text-base font-bold mb-3';
    signalTFTitle.style.color = '#7dd3fc';
    signalTFTitle.innerHTML = 'Сигналын -1 TF дээрх баталгаа (<span style="color: #FF9800;">M1</span>)';
    signalTFGroup.appendChild(signalTFTitle);
    
    // Add 7 signal questions (indices 8-14)
    for (let i = 8; i < 15; i++) {
      const questionGroup = createQuestionGroup(QUESTIONS[i], i);
      signalTFGroup.appendChild(questionGroup);
    }
    
    questionsWrapper.appendChild(signalTFGroup);
  }
  
  // Group 3.5: Session selection
  const sessionGroup = document.createElement('div');
  sessionGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const sessionTitle = document.createElement('h3');
  sessionTitle.className = 'text-base font-bold mb-3';
  sessionTitle.style.color = '#7dd3fc';
  sessionTitle.innerHTML = 'Market session <span style="color: #ccced2ff; font-size: 0.875rem; font-weight: normal;">(заавал биш)</span>';
  sessionGroup.appendChild(sessionTitle);
  
  // Determine session index based on setup
  let sessionIdx = 12;
  if (setup?.questionSetId === 'TEST_LVL') sessionIdx = 13;
  if (setup?.questionSetId === 'DAGAJ_OROH') sessionIdx = 24;
  if (setup?.questionSetId === 'BLOCK_ZONE') sessionIdx = 23;
  if (setup?.questionSetId === 'BLOCK_EXIT') sessionIdx = 15;
  if (setup?.questionSetId === 'TEST_BREAK') sessionIdx = 14;
  if (setup?.questionSetId === 'WPOC_BREAK') sessionIdx = 14;
  if (setup?.questionSetId === 'COUNTER_TREND') sessionIdx = 15;
  
  const sessionQ = createQuestionGroup(QUESTIONS[sessionIdx], sessionIdx);
  sessionGroup.appendChild(sessionQ);
  questionsWrapper.appendChild(sessionGroup);
  
  // Group 4: Result tracking (optional)
  const resultGroup = document.createElement('div');
  resultGroup.id = 'result-group';
  resultGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const resultTitle = document.createElement('h3');
  resultTitle.className = 'text-base font-bold mb-3';
  resultTitle.style.color = '#7dd3fc';
  resultTitle.innerHTML = 'Арилжааны үр дүн <span style="color: #ccced2ff; font-size: 0.875rem; font-weight: normal;">(заавал биш)</span>';
  resultGroup.appendChild(resultTitle);
  
  // Determine result indices based on setup
  let riskIdx = 13, rewardIdx = 14, rrIdx = 15, safeIdx = 16, resultIdx = 17;
  if (setup?.questionSetId === 'TEST_LVL') {
    riskIdx = 14; rewardIdx = 15; rrIdx = 16; safeIdx = 17; resultIdx = 18;
  }
  if (setup?.questionSetId === 'DAGAJ_OROH') {
    riskIdx = 25; rewardIdx = 26; rrIdx = 27; safeIdx = 28; resultIdx = 29;
  }
  if (setup?.questionSetId === 'BLOCK_ZONE') {
    riskIdx = 24; rewardIdx = 25; rrIdx = 26; safeIdx = 27; resultIdx = 28;
  }
  if (setup?.questionSetId === 'BLOCK_EXIT') {
    riskIdx = 16; rewardIdx = 17; rrIdx = 18; safeIdx = 19; resultIdx = 20;
  }
  if (setup?.questionSetId === 'TEST_BREAK') {
    riskIdx = 15; rewardIdx = 16; rrIdx = 17; safeIdx = 18; resultIdx = 19;
  }
  if (setup?.questionSetId === 'WPOC_BREAK') {
    riskIdx = 15; rewardIdx = 16; rrIdx = 17; safeIdx = 18; resultIdx = 19;
  }
  if (setup?.questionSetId === 'COUNTER_TREND') {
    riskIdx = 16; rewardIdx = 17; rrIdx = 18; safeIdx = 19; resultIdx = 20;
  }
  
  // Create Risk and Reward on same row
  const riskRewardRow = document.createElement('div');
  riskRewardRow.className = 'flex gap-3 mb-4';
  
  const riskContainer = document.createElement('div');
  riskContainer.className = 'flex-1';
  const riskQ = createQuestionGroup(QUESTIONS[riskIdx], riskIdx);
  riskContainer.appendChild(riskQ);
  
  const rewardContainer = document.createElement('div');
  rewardContainer.className = 'flex-1';
  const rewardQ = createQuestionGroup(QUESTIONS[rewardIdx], rewardIdx);
  rewardContainer.appendChild(rewardQ);
  
  riskRewardRow.appendChild(riskContainer);
  riskRewardRow.appendChild(rewardContainer);
  resultGroup.appendChild(riskRewardRow);
  
  const rrQ = createQuestionGroup(QUESTIONS[rrIdx], rrIdx);
  const safeRuleQ = createQuestionGroup(QUESTIONS[safeIdx], safeIdx);
  const resultQ = createQuestionGroup(QUESTIONS[resultIdx], resultIdx);
  
  resultGroup.appendChild(rrQ);
  resultGroup.appendChild(safeRuleQ);
  resultGroup.appendChild(resultQ);
  questionsWrapper.appendChild(resultGroup);
  
  // Add auto-calculation listeners for Risk, Reward, and R/R
  setTimeout(() => {
    const riskInput = form.querySelector('input[name="risk"]');
    const rewardInput = form.querySelector('input[name="reward"]');
    const rrInput = form.querySelector('input[name="risk_reward"]');
    
    if (riskInput && rewardInput && rrInput) {
      riskInput.addEventListener('input', () => {
        const risk = parseFloat(riskInput.value);
        const rr = parseFloat(rrInput.value);
        const reward = parseFloat(rewardInput.value);
        
        if (risk && rr && !rewardInput.dataset.userInput) {
          rewardInput.value = (risk * rr).toFixed(2);
        } else if (risk && reward && !rrInput.dataset.userInput) {
          rrInput.value = (reward / risk).toFixed(2);
        }
      });
      
      rewardInput.addEventListener('input', () => {
        rewardInput.dataset.userInput = 'true';
        const risk = parseFloat(riskInput.value);
        const reward = parseFloat(rewardInput.value);
        const rr = parseFloat(rrInput.value);
        
        if (risk && reward && !rrInput.dataset.userInput) {
          rrInput.value = (reward / risk).toFixed(2);
        } else if (reward && rr && !riskInput.dataset.userInput) {
          riskInput.value = (reward / rr).toFixed(2);
        }
        setTimeout(() => delete rewardInput.dataset.userInput, 100);
      });
      
      rrInput.addEventListener('input', () => {
        rrInput.dataset.userInput = 'true';
        const risk = parseFloat(riskInput.value);
        const rr = parseFloat(rrInput.value);
        const reward = parseFloat(rewardInput.value);
        
        if (risk && rr && !rewardInput.dataset.userInput) {
          rewardInput.value = (risk * rr).toFixed(2);
        } else if (reward && rr && !riskInput.dataset.userInput) {
          riskInput.value = (reward / rr).toFixed(2);
        }
        setTimeout(() => delete rrInput.dataset.userInput, 100);
      });
    }
  }, 100);
  
  // Group 5: Notes (optional)
  const notesGroup = document.createElement('div');
  notesGroup.className = 'mb-6 p-4 bg-white/10 rounded-lg';
  
  const notesTitle = document.createElement('h3');
  notesTitle.className = 'text-base font-bold mb-3';
  notesTitle.style.color = '#7dd3fc';
  notesTitle.innerHTML = 'Тэмдэглэл <span style="color: #ccced2ff; font-size: 0.875rem; font-weight: normal;">(заавал биш)</span>';
  notesGroup.appendChild(notesTitle);
  
  // Determine notes indices based on setup
  let psychologyIdx = 18, lessonIdx = 19;
  if (setup?.questionSetId === 'TEST_LVL') {
    psychologyIdx = 19; lessonIdx = 20;
  }
  if (setup?.questionSetId === 'DAGAJ_OROH') {
    psychologyIdx = 30; lessonIdx = 31;
  }
  if (setup?.questionSetId === 'BLOCK_ZONE') {
    psychologyIdx = 29; lessonIdx = 30;
  }
  if (setup?.questionSetId === 'BLOCK_EXIT') {
    psychologyIdx = 21; lessonIdx = 22;
  }
  if (setup?.questionSetId === 'TEST_BREAK') {
    psychologyIdx = 20; lessonIdx = 21;
  }
  if (setup?.questionSetId === 'WPOC_BREAK') {
    psychologyIdx = 20; lessonIdx = 21;
  }
  if (setup?.questionSetId === 'COUNTER_TREND') {
    psychologyIdx = 21; lessonIdx = 22;
  }
  
  const psychologyQ = createQuestionGroup(QUESTIONS[psychologyIdx], psychologyIdx);
  const lessonQ = createQuestionGroup(QUESTIONS[lessonIdx], lessonIdx);
  
  notesGroup.appendChild(psychologyQ);
  notesGroup.appendChild(lessonQ);
  questionsWrapper.appendChild(notesGroup);
  
  form.appendChild(questionsWrapper);
  
  // Update back button behavior based on mode (edit vs create)
  const questionnaireBackBtn = document.getElementById('questionnaire-back-btn');
  if (questionnaireBackBtn) {
    // Remove existing listeners by cloning
    const newBackBtn = questionnaireBackBtn.cloneNode(true);
    questionnaireBackBtn.parentNode.replaceChild(newBackBtn, questionnaireBackBtn);
    
    // Add appropriate listener based on edit mode
    if (currentTradeId) {
      // Editing: go back to list
      newBackBtn.addEventListener('click', resetJournalView);
    } else {
      // Creating: go back to setup selection
      newBackBtn.addEventListener('click', () => showSetupSelection(false));
    }
  }
  
  // Setup entry direction change handler
  const entryRadios = form.querySelectorAll('input[name="entry_direction"]');
  entryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateDefaultsByEntryDirection();
      
      // Update labels that contain ${direction} for BLOCK_ZONE
      if (setup?.questionSetId === 'BLOCK_ZONE') {
        const entryDirection = form.querySelector('input[name="entry_direction"]:checked')?.value;
        const direction = entryDirection === 'BUY' ? 'Long' : 'Short';
        const directionColor = entryDirection === 'BUY' ? '#22c55e' : '#fb7185';
        
        // Find and update q_block_initiative_shift label
        const allLabels = form.querySelectorAll('h4');
        allLabels.forEach((label, index) => {
          if (label.innerHTML.includes('Санаачлага')) {
            const labelText = `Санаачлага <span style="color: ${directionColor};">${direction}</span> тал руу солигдсон эсэх`;
            const asterisk = ' <span style="color: #fb7185;">*</span>';
            // Extract the question number from the existing label
            const match = label.innerHTML.match(/^(\d+)\. /);
            const questionNumber = match ? match[1] : (index + 1);
            label.innerHTML = `${questionNumber}. ${labelText}${asterisk}`;
          }
        });
      }
      
      // Update labels that contain ${direction} for TEST_BREAK and WPOC_BREAK
      if (setup?.questionSetId === 'TEST_BREAK' || setup?.questionSetId === 'WPOC_BREAK') {
        const entryDirection = form.querySelector('input[name="entry_direction"]:checked')?.value;
        const direction = entryDirection === 'BUY' ? 'Long' : 'Short';
        const directionColor = entryDirection === 'BUY' ? '#22c55e' : '#fb7185';
        
        // Find and update q_test_break_profile_shift label
        const allLabels = form.querySelectorAll('h4');
        allLabels.forEach((label, index) => {
          if (label.innerHTML.includes('Wave эсвэл Impulse Profile манай')) {
            const labelText = `Wave эсвэл Impulse Profile манай <span style="color: ${directionColor};">${direction}</span> тал руу шилжсэн эсэх`;
            const asterisk = ' <span style="color: #fb7185;">*</span>';
            // Extract the question number from the existing label
            const match = label.innerHTML.match(/^(\d+)\. /);
            const questionNumber = match ? match[1] : (index + 1);
            label.innerHTML = `${questionNumber}. ${labelText}${asterisk}`;
          }
        });
      }

      // Update labels that contain ${direction} for COUNTER_TREND
      if (setup?.questionSetId === 'COUNTER_TREND') {
        const entryDirection = form.querySelector('input[name="entry_direction"]:checked')?.value;
        const direction = entryDirection === 'BUY' ? 'Long' : 'Short';
        const directionColor = entryDirection === 'BUY' ? '#22c55e' : '#fb7185';
        
        // Find and update q_counter_profile_shift label
        const allLabels = form.querySelectorAll('h4');
        allLabels.forEach((label, index) => {
          if (label.innerHTML.includes('Эсрэг тоглогчийн Wave эсвэл Impulse Profile манай')) {
            const labelText = `Эсрэг тоглогчийн Wave эсвэл Impulse Profile манай <span style="color: ${directionColor};">${direction}</span> тал руу шилжсэн эсэх`;
            const asterisk = ' <span style="color: #fb7185;">*</span>';
            // Extract the question number from the existing label
            const match = label.innerHTML.match(/^(\d+)\. /);
            const questionNumber = match ? match[1] : (index + 1);
            label.innerHTML = `${questionNumber}. ${labelText}${asterisk}`;
          }
        });
      }
    });
  });
  
  // If editing, pre-populate all answers
  if (entry && entry.answers) {
    // Set entry direction first
    const directionRadio = form.querySelector(`input[name="entry_direction"][value="${entry.answers.entry_direction}"]`);
    if (directionRadio) {
      directionRadio.checked = true;
      directionRadio.dispatchEvent(new Event('change'));
    }
    
    // Set all question answers
    QUESTIONS.forEach(question => {
      const answer = entry.answers[question.id];
      if (answer) {
        if (question.type === 'select') {
          const select = form.querySelector(`select[name="${question.id}"]`);
          if (select) select.value = answer;
        } else if (question.type === 'number') {
          const input = form.querySelector(`input[name="${question.id}"]`);
          if (input) input.value = answer;
        } else if (question.type === 'text') {
          const textarea = form.querySelector(`textarea[name="${question.id}"]`);
          if (textarea) textarea.value = answer;
        } else {
          const radio = form.querySelector(`input[name="${question.id}"][value="${answer}"]`);
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      }
    });
  }
  
  // Update journal title based on mode
  const journalTitle = document.getElementById('journal-title');
  const addBtn = document.getElementById('add-trade-btn');
  const headerBackBtn = document.getElementById('header-back-btn');
  
  if (journalTitle) {
    if (entry) {
      // Editing mode: show entry number and setup name
      const entryIndex = journalEntries.findIndex(e => e.id === entry.id) + 1;
      const setupName = setup?.name || 'Unknown Setup';
      journalTitle.textContent = `${entryIndex}. ${setupName}`;
    } else {
      // Creating mode: show default title
      journalTitle.textContent = 'Арилжааны Журнал';
    }
  }
  
  // Toggle header buttons based on mode
  if (entry) {
    // Editing mode: hide both buttons
    if (addBtn) addBtn.classList.add('hidden');
    if (headerBackBtn) headerBackBtn.classList.add('hidden');
  }
  // Note: In creating mode, buttons are already toggled by showSetupSelection()
  
  // Hide setup selection, show questionnaire
  if (listContainer) listContainer.classList.add('hidden');
  if (setupContainer) setupContainer.classList.add('hidden');
  questionnaireContainer.classList.remove('hidden');
  
  // Always reset scroll position when showing questionnaire
  questionnaireContainer.scrollTop = 0;
  form.scrollTop = 0;
  
  // Add scroll-to-bottom button (only when editing existing entry)
  if (entry) {
    // Remove existing scroll button if any
    const existingScrollBtn = questionnaireContainer.querySelector('.scroll-to-bottom-btn');
    if (existingScrollBtn) existingScrollBtn.remove();
    
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-bottom-btn absolute w-10 h-10 bg-slate-600 hover:bg-slate-800 text-white rounded-md shadow-lg transition-all flex items-center justify-center';
    scrollBtn.style.bottom = '6.8rem';
    scrollBtn.style.right = '3rem';
    scrollBtn.style.zIndex = '50';
    scrollBtn.title = 'Хамгийн доош шилжих';
    scrollBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    `;
    
    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const resultGroup = document.getElementById('result-group');
      const form = document.getElementById('journal-questionnaire-form');
      if (resultGroup && form) {
        // Get the position of result group relative to the form
        const resultPosition = resultGroup.offsetTop;
        
        form.scrollTo({
          top: resultPosition - 100, // Offset to show title clearly
          behavior: 'smooth'
        });
      }
    });
    
    // Append to questionnaire container (which should have position: relative)
    questionnaireContainer.appendChild(scrollBtn);
  } else {
    // Remove scroll button if creating new entry
    const existingScrollBtn = document.querySelector('.scroll-to-bottom-btn');
    if (existingScrollBtn) existingScrollBtn.remove();
  }
}

// Reset journal view to list
function resetJournalView() {
  const listContainer = document.getElementById('journal-list-container');
  const setupContainer = document.getElementById('journal-setup-container');
  const questionnaireContainer = document.getElementById('journal-questionnaire-container');
  const addBtn = document.getElementById('add-trade-btn');
  const headerBackBtn = document.getElementById('header-back-btn');
  
  // Reset journal title
  const journalTitle = document.getElementById('journal-title');
  if (journalTitle) {
    journalTitle.textContent = 'Арилжааны Журнал';
  }
  
  // Reset current setup and trade ID
  currentSetup = null;
  currentTradeId = null;
  
  // Remove scroll-to-bottom button if exists
  const scrollBtn = document.querySelector('.scroll-to-bottom-btn');
  if (scrollBtn) scrollBtn.remove();
  
  // Show list, hide others
  if (listContainer) listContainer.classList.remove('hidden');
  if (setupContainer) setupContainer.classList.add('hidden');
  if (questionnaireContainer) questionnaireContainer.classList.add('hidden');
  
  // Toggle header buttons back
  if (addBtn) addBtn.classList.remove('hidden');
  if (headerBackBtn) headerBackBtn.classList.add('hidden');
}

// Create entry direction group
function createEntryDirectionGroup() {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-6 mt-4 flex justify-center px-4';
  
  const container = document.createElement('div');
  container.className = 'p-4 bg-white/10 rounded-lg entry-glow w-96';
  container.id = 'entry-direction-container';
  
  const group = document.createElement('div');
  
  // Add title
  const title = document.createElement('h3');
  title.className = 'text-base font-bold text-white mb-3 text-center';
  title.textContent = 'Арилжааны төрөл';
  group.appendChild(title);
  
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'flex justify-center';
  
  const radioGroup = document.createElement('div');
  radioGroup.className = 'flex gap-3 w-80';
  
  ['BUY', 'SELL'].forEach(option => {
    const label = document.createElement('label');
    label.className = 'flex-1 cursor-pointer';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'entry_direction';
    radio.value = option;
    radio.className = 'hidden';
    
    const button = document.createElement('div');
    button.className = 'px-4 py-2 text-center font-bold text-white rounded-lg transition-all bg-white/10 hover:bg-white/20';
    button.textContent = option;
    
    radio.addEventListener('change', () => {
      const allButtons = radioGroup.querySelectorAll('div');
      allButtons.forEach((btn, idx) => {
        const opt = idx === 0 ? 'BUY' : 'SELL';
        if (opt === option) {
          btn.style.backgroundColor = opt === 'BUY' ? '#22c55e' : '#ef4444';
        } else {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
      });
      
      // Remove glow effect from container
      container.classList.remove('entry-glow');
      
      // Enable questions wrapper
      const questionsWrapper = document.getElementById('questions-wrapper');
      if (questionsWrapper) {
        questionsWrapper.classList.remove('opacity-30', 'pointer-events-none');
        
        // Scroll just enough to hide the BUY/SELL buttons and show first question
        const form = document.getElementById('journal-questionnaire-form');
        if (form) {
          setTimeout(() => {
            // Scroll to position the entry container at the top
            const entryContainer = document.getElementById('entry-direction-container');
            if (entryContainer) {
              form.scrollTo({ top: entryContainer.offsetHeight + 16, behavior: 'smooth' }); // height + margin
            }
          }, 100);
        }
      }
    });
    
    label.appendChild(radio);
    label.appendChild(button);
    radioGroup.appendChild(label);
  });
  
  buttonWrapper.appendChild(radioGroup);
  group.appendChild(buttonWrapper);
  container.appendChild(group);
  wrapper.appendChild(container);
  return wrapper;
}

// Create question group with button-style radios
function createQuestionGroup(question, questionNumber, titleColor = null) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-4';
  
  // Create header with question and score indicator
  const header = document.createElement('div');
  header.className = 'flex items-center gap-2 mb-2';
  
  const label = document.createElement('h4');
  label.className = 'text-sm font-normal text-white';
  if (titleColor) {
    label.style.color = titleColor;
  }
  
  // Process label text - handle ${direction} replacement for BLOCK_ZONE
  let labelText = question.label;
  if (labelText.includes('${direction}')) {
    const form = document.getElementById('journal-questionnaire-form');
    const entryDirection = form?.querySelector('input[name="entry_direction"]:checked')?.value;
    const direction = entryDirection === 'BUY' ? 'Long' : 'Short';
    const directionColor = entryDirection === 'BUY' ? '#22c55e' : '#fb7185'; // green for Long, rose for Short
    labelText = labelText.replace('${direction}', `<span style="color: ${directionColor};">${direction}</span>`);
  }
  
  // Add red asterisk for required questions
  const asterisk = question.optional ? '' : ' <span style="color: #fb7185;">*</span>';
  label.innerHTML = `${questionNumber}. ${labelText}${asterisk}`;
  
  const scoreIndicator = document.createElement('span');
  scoreIndicator.className = 'text-sm font-normal opacity-0 transition-opacity';
  scoreIndicator.setAttribute('data-score-for', question.id);
  
  header.appendChild(label);
  header.appendChild(scoreIndicator);
  wrapper.appendChild(header);
  
  // Handle different input types
  if (question.type === 'select') {
    const select = document.createElement('select');
    select.name = question.id;
    select.className = 'w-full px-4 py-2 bg-white/10 text-white rounded-lg border-2 border-white/30 focus:border-blue-500 focus:outline-none';
    
    question.options.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option;
      optionEl.textContent = option;
      optionEl.style.color = TICKER_COLORS[option] || '#ffffff';
      optionEl.style.backgroundColor = '#1f2937';
      if (question.default && option === question.default) {
        optionEl.selected = true;
      }
      select.appendChild(optionEl);
    });
    
    wrapper.appendChild(select);
  } else if (question.type === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.name = question.id;
    input.step = '0.1';
    input.min = '0';
    input.className = 'w-full px-4 py-2 bg-white/10 text-white rounded-lg border-2 border-white/30 focus:border-blue-500 focus:outline-none';
    input.placeholder = question.placeholder || 'Жишээ: 2, 3, 1.5';
    wrapper.appendChild(input);
  } else if (question.type === 'text') {
    const textarea = document.createElement('textarea');
    textarea.name = question.id;
    textarea.rows = 3;
    textarea.className = 'w-full px-4 py-2 bg-white/10 text-white rounded-lg border-2 border-white/30 focus:border-blue-500 focus:outline-none resize-none';
    textarea.placeholder = 'Энд бичнэ үү...';
    wrapper.appendChild(textarea);
  } else {
    // Radio buttons
    const radioGroup = document.createElement('div');
    radioGroup.className = 'flex flex-wrap gap-2';
    
    question.options.forEach((option) => {
      const label = document.createElement('label');
      label.className = 'cursor-pointer';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = question.id;
      radio.value = option;
      radio.className = 'hidden';
      radio.setAttribute('data-question-id', question.id);
      
      const button = document.createElement('div');
      button.className = 'px-4 py-2 text-sm font-normal text-white rounded-lg transition-all border-2 border-white/30 bg-white/10 hover:bg-white/20';
      button.textContent = option;
      
      radio.addEventListener('change', () => {
        const allButtons = radioGroup.querySelectorAll('div');
        allButtons.forEach(btn => {
          btn.style.backgroundColor = '';
          btn.style.borderColor = '';
        });
        // Special colors: Short=red, Ойлгомжгүй=yellow, Loss=red, others=green
        let selectedColor = '#22c55e'; // default green
        if (option === 'Short' || option === 'Loss' || option === 'Үгүй') selectedColor = '#ef4444'; // red
        else if (option === 'Ойлгомжгүй') selectedColor = '#36a1d7ff'; // sky-blue
        button.style.backgroundColor = selectedColor;
        button.style.borderColor = selectedColor;
        
        // Update all score indicators (to handle dependencies between questions)
        updateAllScoreIndicators();
      });
      
      label.appendChild(radio);
      label.appendChild(button);
      radioGroup.appendChild(label);
    });
    
    wrapper.appendChild(radioGroup);
  }
  
  return wrapper;
}

// Calculate score for individual question
function calculateQuestionScore(questionId, answer) {
  const form = document.getElementById('journal-questionnaire-form');
  if (!form) return null;
  
  const entryDirection = form.querySelector('input[name="entry_direction"]:checked')?.value;
  if (!entryDirection) return null;
  
  const expectedDirection = entryDirection === 'BUY' ? 'Long' : 'Short';
  
  // Q1: Market Profile
  if (questionId === 'q1_profile') {
    return answer === expectedDirection ? 30 : 0;
  }
  
  // Q2: Constructor
  if (questionId === 'q2_constructor') {
    return answer === expectedDirection ? 25 : 0;
  }
  
  // TEST_LVL setups (5-8): Test impulse question
  if (questionId === 'q_test_impulse') {
    if (answer === expectedDirection) return 5;
    if (answer === 'Ойлгомжгүй') return 0;
    return -5;
  }
  
  // DAGAJ_OROH setup (9): Additional +1 TF questions
  if (questionId === 'q_impulse_behind') {
    return answer === 'Тийм' ? 5 : -5;
  }
  
  if (questionId === 'q_manip_closed') {
    return answer === 'Тийм' ? 10 : -20;
  }
  
  if (questionId === 'q_connection_stopping') {
    return answer === 'Тийм' ? 10 : -20;
  }
  
  // DAGAJ_OROH setup (9): Followup profile/constructor
  if (questionId === 'q_followup_profile' || questionId === 'q_followup_constructor') {
    if (answer === expectedDirection) return 15;
    if (answer === 'Ойлгомжгүй') return 0;
    return -15;
  }
  
  // Q3: Wave profile
  if (questionId === 'q3_wave') {
    return answer === 'Тийм' ? 20 : 0;
  }
  
  // Q4: Impulse profile (only if Q3 is not 'Тийм')
  if (questionId === 'q4_impulse') {
    const q3Answer = form.querySelector('input[name="q3_wave"]:checked')?.value;
    if (q3Answer === 'Тийм') return null; // Q3 takes priority
    if (answer === 'Тийм') return 10;
    return -30; // Both Q3 and Q4 are no
  }
  
  // Q5: Entry cluster
  if (questionId === 'q5_entry_cluster') {
    const points = {
      'StoppingAction': 5,
      'Цохилт': 3
    };
    return points[answer] || -5;
  }
  
  // Q6: Exit cluster
  if (questionId === 'q6_exit_cluster') {
    const points = {
      'Цохилт': 5,
      'Энгийн түлхэлт': 2,
      'Энгийн StoppingAction': -4,
      'StoppingAction': -10,
      'Байхгүй (Single bar Manipulation)': 0
    };
    return points[answer] || 0;
  }
  
  // Q7: Volume spike
  if (questionId === 'q7_volume_spike') {
    return answer === 'Тийм' ? 5 : -10;
  }
  
  // Q8: Exit volume
  if (questionId === 'q8_exit_volume') {
    return answer === 'Тийм' ? 3 : -5;
  }
  
  // Q9: Volume decrease
  if (questionId === 'q9_volume_decrease') {
    return answer === 'Тийм' ? 5 : -10;
  }
  
  // DAGAJ_OROH setup (9): Connection signal questions (same scoring as main signal)
  if (questionId === 'q_followup_wave') {
    return answer === 'Тийм' ? 20 : 0;
  }
  
  if (questionId === 'q_followup_impulse') {
    const waveAnswer = form.querySelector('input[name="q_followup_wave"]:checked')?.value;
    if (waveAnswer === 'Тийм') return null;
    if (answer === 'Тийм') return 10;
    return -30;
  }
  
  if (questionId === 'q_followup_entry_cluster') {
    const points = {
      'StoppingAction': 5,
      'Цохилт': 3
    };
    return points[answer] || -5;
  }
  
  if (questionId === 'q_followup_exit_cluster') {
    const points = {
      'Цохилт': 5,
      'Энгийн түлхэлт': 2,
      'Энгийн StoppingAction': -4,
      'StoppingAction': -10,
      'Байхгүй (Single bar Manipulation)': 0
    };
    return points[answer] || 0;
  }
  
  if (questionId === 'q_followup_volume_spike') {
    return answer === 'Тийм' ? 5 : -10;
  }
  
  if (questionId === 'q_followup_exit_volume') {
    return answer === 'Тийм' ? 3 : -5;
  }
  
  if (questionId === 'q_followup_volume_decrease') {
    return answer === 'Тийм' ? 5 : -10;
  }
  
  // Daily bias
  if (questionId === 'daily') {
    return answer === expectedDirection ? 10 : 0;
  }
  
  // Weekly doesn't contribute to score
  if (questionId === 'weekly') {
    return null;
  }

  // BLOCK_ZONE setup (10): Жижиг Setup 0 TF questions
  if (questionId === 'q_block_profile_shift') {
    return answer === 'Тийм' ? 10 : -10;
  }

  if (questionId === 'q_block_initiative_shift') {
    return answer === 'Тийм' ? 10 : -10;
  }

  if (questionId === 'q_block_profile_expectation') {
    return answer === expectedDirection ? 30 : -30;
  }

  if (questionId === 'q_block_constructor_expectation') {
    return answer === expectedDirection ? 30 : -30;
  }

  // BLOCK_ZONE setup (10): Connection signal questions (same scoring as main signal)
  if (questionId === 'q_connection_wave') {
    return answer === 'Тийм' ? 20 : 0;
  }

  if (questionId === 'q_connection_impulse') {
    const waveAnswer = form.querySelector('input[name="q_connection_wave"]:checked')?.value;
    if (waveAnswer === 'Тийм') return null;
    if (answer === 'Тийм') return 10;
    return -30;
  }

  if (questionId === 'q_connection_entry_cluster') {
    const points = {
      'StoppingAction': 5,
      'Цохилт': 3
    };
    return points[answer] || -5;
  }

  if (questionId === 'q_connection_exit_cluster') {
    const points = {
      'Цохилт': 5,
      'Энгийн түлхэлт': 2,
      'Энгийн StoppingAction': -4,
      'StoppingAction': -10,
      'Байхгүй (Single bar Manipulation)': 0
    };
    return points[answer] || 0;
  }

  if (questionId === 'q_connection_volume_spike') {
    return answer === 'Тийм' ? 5 : -10;
  }

  if (questionId === 'q_connection_exit_volume') {
    return answer === 'Тийм' ? 3 : -5;
  }

  if (questionId === 'q_connection_volume_decrease') {
    return answer === 'Тийм' ? 5 : -10;
  }

  // BLOCK_EXIT setup (11): Block exit questions
  if (questionId === 'q_block_exit_impulse') {
    return answer === expectedDirection ? 15 : -15;
  }

  if (questionId === 'q_block_exit_cluster') {
    const points = {
      'Цохилт': 10,
      'Энгийн түлхэлт': 5,
      'StoppingAction': -10
    };
    return points[answer] || 0;
  }

  if (questionId === 'q_small_setup_manipulation') {
    return answer === 'Тийм' ? 10 : -10;
  }

  // TEST_BREAK setup (12): Test break questions
  if (questionId === 'q_test_break_profile_shift') {
    return answer === 'Тийм' ? 10 : -10;
  }

  if (questionId === 'q_test_break_cluster') {
    const points = {
      'Цохилт': 10,
      'Энгийн түлхэлт': 5,
      'StoppingAction': -5
    };
    return points[answer] || 0;
  }

  if (questionId === 'q_test_break_impulse') {
    return answer === expectedDirection ? 10 : -10;
  }

  if (questionId === 'q_test_break_manipulation') {
    return answer === 'Тийм' ? 10 : -10;
  }
  
  return 0;
}

// Update all score indicators for all questions
function updateAllScoreIndicators() {
  const form = document.getElementById('journal-questionnaire-form');
  if (!form) return;
  
  // Get the correct question set for current setup
  const setup = SETUPS.find(s => s.id === currentSetup);
  const QUESTIONS = QUESTION_SETS[setup?.questionSetId || 'DEFAULT'];
  
  // Update each question's score indicator
  QUESTIONS.forEach(question => {
    const scoreIndicator = form.querySelector(`span[data-score-for="${question.id}"]`);
    if (!scoreIndicator) return;
    
    const selectedRadio = form.querySelector(`input[name="${question.id}"]:checked`);
    if (!selectedRadio) {
      scoreIndicator.style.opacity = '0';
      return;
    }
    
    const score = calculateQuestionScore(question.id, selectedRadio.value);
    if (score !== null) {
      scoreIndicator.textContent = score >= 0 ? `+${score}` : `${score}`;
      scoreIndicator.style.color = score >= 0 ? '#4ade80' : '#fb7185'; // Lighter green/rose
      scoreIndicator.style.opacity = '1';
    } else {
      scoreIndicator.style.opacity = '0';
    }
  });
}

// Update defaults based on entry direction
function updateDefaultsByEntryDirection() {
  const form = document.getElementById('journal-questionnaire-form');
  if (!form) return;
  
  const entryDirection = form.querySelector('input[name="entry_direction"]:checked')?.value;
  if (!entryDirection) return;
  
  // Get the correct question set for current setup
  const setup = SETUPS.find(s => s.id === currentSetup);
  const QUESTIONS = QUESTION_SETS[setup?.questionSetId || 'DEFAULT'];
  const questionSetId = setup?.questionSetId || 'DEFAULT';
  
  const expectedDirection = entryDirection === 'BUY' ? 'Long' : 'Short';
  
  // Set defaults for questions based on setup type
  if (questionSetId === 'DEFAULT') {
    // Questions 1-2: q1_profile, q2_constructor
    ['q1_profile', 'q2_constructor'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'TEST_LVL') {
    // Questions 1-2-3: q1_profile, q2_constructor, q_test_impulse
    ['q1_profile', 'q2_constructor', 'q_test_impulse'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'DAGAJ_OROH') {
    // Questions 1-2, 8-9: q1_profile, q2_constructor, q_followup_profile, q_followup_constructor
    ['q1_profile', 'q2_constructor', 'q_followup_profile', 'q_followup_constructor'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'BLOCK_ZONE') {
    // Questions 1-2, 7-8: q1_profile, q2_constructor, q_block_profile_expectation, q_block_constructor_expectation
    ['q1_profile', 'q2_constructor', 'q_block_profile_expectation', 'q_block_constructor_expectation'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'BLOCK_EXIT') {
    // Questions 1-2, 5: q1_profile, q2_constructor, q_block_exit_impulse
    ['q1_profile', 'q2_constructor', 'q_block_exit_impulse'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'TEST_BREAK' || questionSetId === 'WPOC_BREAK') {
    // Question 5: q_test_break_impulse
    ['q_test_break_impulse'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  } else if (questionSetId === 'COUNTER_TREND') {
    // Questions 6-7: q_counter_small_profile, q_counter_small_constructor
    ['q_counter_small_profile', 'q_counter_small_constructor'].forEach(qId => {
      const radios = form.querySelectorAll(`input[name="${qId}"]`);
      radios.forEach(radio => {
        if (radio.value === expectedDirection) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      });
    });
  }
  
  // Set other defaults
  QUESTIONS.forEach(question => {
    const shouldSkip = ['q1_profile', 'q2_constructor', 'q_test_impulse', 'q_followup_profile', 'q_followup_constructor', 'q_block_profile_expectation', 'q_block_constructor_expectation', 'q_block_exit_impulse', 'q_test_break_impulse', 'q_counter_small_profile', 'q_counter_small_constructor'].includes(question.id);
    if (question.default && !shouldSkip) {
      const radio = form.querySelector(`input[name="${question.id}"][value="${question.default}"]`);
      if (radio && !form.querySelector(`input[name="${question.id}"]:checked`)) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }
  });
}

// Edit existing trade entry
function editTradeEntry(entryId) {
  const entry = journalEntries.find(e => e.id === entryId);
  if (!entry) return;
  
  // Set current trade ID and setup for editing
  currentTradeId = entryId;
  currentSetup = entry.setupId;
  
  // Show questionnaire with existing data
  showQuestionnaire(entry);
}

// Calculate assessment score using calculateQuestionScore as single source of truth
function calculateAssessment(answers) {
  let score = 0;
  
  // Temporarily set form context for calculateQuestionScore
  const form = document.getElementById('journal-questionnaire-form');
  if (!form) return 0;
  
  // Get the correct question set for current setup
  const setup = SETUPS.find(s => s.id === currentSetup);
  const QUESTIONS = QUESTION_SETS[setup?.questionSetId || 'DEFAULT'];
  
  // Loop through all questions and sum their scores
  QUESTIONS.forEach(question => {
    const answer = answers[question.id];
    if (answer) {
      const questionScore = calculateQuestionScore(question.id, answer);
      if (questionScore !== null) {
        score += questionScore;
      }
    }
  });
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

// Save trade entry
function saveTradeEntry() {
  const form = document.getElementById('journal-questionnaire-form');
  if (!form) return;
  
  // Get the correct question set for current setup
  const setup = SETUPS.find(s => s.id === currentSetup);
  const QUESTIONS = QUESTION_SETS[setup?.questionSetId || 'DEFAULT'];
  
  // Collect answers
  const answers = {
    entry_direction: form.querySelector('input[name="entry_direction"]:checked')?.value
  };
  
  // Check if all required questions are answered
  let allAnswered = true;
  const unansweredQuestions = [];
  
  QUESTIONS.forEach(question => {
    // First check if the question element exists in the form (some questions are conditionally rendered)
    let questionExists = false;
    if (question.type === 'select') {
      questionExists = !!form.querySelector(`select[name="${question.id}"]`);
    } else if (question.type === 'number') {
      questionExists = !!form.querySelector(`input[name="${question.id}"]`);
    } else if (question.type === 'text') {
      questionExists = !!form.querySelector(`textarea[name="${question.id}"]`);
    } else {
      questionExists = !!form.querySelector(`input[name="${question.id}"]`);
    }
    
    // Skip validation for questions that don't exist in the current form
    if (!questionExists) {
      return;
    }
    
    let answer;
    if (question.type === 'select') {
      const select = form.querySelector(`select[name="${question.id}"]`);
      answer = select?.value || '';
    } else if (question.type === 'number') {
      const input = form.querySelector(`input[name="${question.id}"]`);
      answer = input?.value || '';
    } else if (question.type === 'text') {
      const textarea = form.querySelector(`textarea[name="${question.id}"]`);
      answer = textarea?.value || '';
    } else {
      answer = form.querySelector(`input[name="${question.id}"]:checked`)?.value;
    }
    
    // Only validate non-optional questions
    if (!answer && !question.optional) {
      allAnswered = false;
      unansweredQuestions.push(question.id);
    }
    answers[question.id] = answer;
  });
  
  if (!allAnswered || !answers.entry_direction) {
    // Clear any existing highlights first
    form.querySelectorAll('[data-validation-highlight="true"]').forEach(group => {
      group.style.backgroundColor = '';
      group.removeAttribute('data-validation-highlight');
    });
    
    // Group unanswered questions by their parent container
    const unansweredGroups = new Set();
    unansweredQuestions.forEach(questionId => {
      const questionElement = form.querySelector(`[name="${questionId}"]`);
      if (questionElement) {
        const questionWrapper = questionElement.closest('.mb-4');
        if (questionWrapper) {
          const parentGroup = questionWrapper.parentElement;
          if (parentGroup && parentGroup.classList.contains('bg-white/10')) {
            unansweredGroups.add(parentGroup);
          }
        }
      }
    });
    
    // Highlight groups and set up removal logic
    unansweredGroups.forEach(parentGroup => {
      // Add light rose background and mark it
      parentGroup.setAttribute('data-validation-highlight', 'true');
      parentGroup.style.backgroundColor = 'rgba(251, 113, 133, 0.15)';
      parentGroup.style.transition = 'background-color 0.3s ease';
      
      // Function to check if all required questions in this group are answered
      const checkGroupComplete = () => {
        const questionsInGroup = parentGroup.querySelectorAll('[name]');
        let allGroupQuestionsAnswered = true;
        
        questionsInGroup.forEach(element => {
          const questionId = element.getAttribute('name');
          // Find the question definition to check if it's optional
          const questionDef = QUESTIONS.find(q => q.id === questionId);
          if (questionDef && !questionDef.optional) {
            let hasAnswer = false;
            if (element.tagName === 'SELECT') {
              hasAnswer = !!element.value;
            } else if (element.type === 'radio') {
              hasAnswer = !!form.querySelector(`input[name="${questionId}"]:checked`);
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              hasAnswer = !!element.value;
            }
            
            if (!hasAnswer) {
              allGroupQuestionsAnswered = false;
            }
          }
        });
        
        // Remove highlight if all required questions in this group are answered
        if (allGroupQuestionsAnswered) {
          parentGroup.style.backgroundColor = '';
          parentGroup.removeAttribute('data-validation-highlight');
        }
      };
      
      // Attach listeners to all questions in this group
      const questionsInGroup = parentGroup.querySelectorAll('[name]');
      questionsInGroup.forEach(element => {
        element.addEventListener('change', checkGroupComplete);
        element.addEventListener('input', checkGroupComplete);
      });
    });
    
    alert('Улаанаар * тэмдэглэгдсэн бүх асуултад хариулна уу.');
    return;
  }
  
  // Calculate score
  const score = calculateAssessment(answers);
  
  if (currentTradeId) {
    // Update existing entry
    const entryIndex = journalEntries.findIndex(e => e.id === currentTradeId);
    if (entryIndex !== -1) {
      journalEntries[entryIndex] = {
        ...journalEntries[entryIndex],
        setupId: currentSetup,
        setupName: SETUPS.find(s => s.id === currentSetup)?.name,
        answers: answers,
        score: score
      };
      lastSavedTradeId = currentTradeId;
    }
  } else {
    // Create new entry
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      setupId: currentSetup,
      setupName: SETUPS.find(s => s.id === currentSetup)?.name,
      answers: answers,
      score: score
    };
    journalEntries.unshift(entry); // Add to beginning
    lastSavedTradeId = entry.id;
  }
  
  saveJournalEntries();
  
  // Update UI and reset view
  renderJournalList();
  resetJournalView();
}

// Render journal list
function renderJournalList() {
  const container = document.getElementById('journal-entries-list');
  if (!container) return;
  
  if (journalEntries.length === 0) {
    container.innerHTML = '<p class="text-white/50 text-center py-8">Арилжааны түүх байхгүй байна</p>';
    return;
  }
  
  container.innerHTML = '';
  
  const totalEntries = journalEntries.length;
  journalEntries.forEach((entry, index) => {
    // Number from bottom to top: newest entry gets highest number
    const entryNumber = totalEntries - index;
    const row = createJournalRow(entry, entryNumber);
    container.appendChild(row);
  });
}

// Create journal row
function createJournalRow(entry, entryNumber) {
  const row = document.createElement('div');
  row.className = 'journal-entry p-3 bg-white/10 hover:bg-white/15 rounded-lg transition-all cursor-pointer mb-2';
  
  // Add glow effect if this is the recently saved trade
  if (lastSavedTradeId === entry.id) {
    row.style.animation = 'glow-pulse 1.5s ease-out';
    row.style.boxShadow = '0 0 30px rgba(229, 231, 235, 0.9)';
    // Remove the glow after animation
    setTimeout(() => {
      row.style.animation = '';
      row.style.boxShadow = '';
      lastSavedTradeId = null;
    }, 1500);
  }
  
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleString('mn-MN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Score color
  let scoreColor = '#f15959ff'; // red
  if (entry.score >= 70) scoreColor = '#22c55e'; // green
  else if (entry.score >= 50) scoreColor = '#eab308'; // yellow
  
  // Entry direction color
  const directionColor = entry.answers.entry_direction === 'BUY' ? '#22c55e' : '#fa6767ff';
  
  // Result badge
  let resultBadge = '';
  if (entry.answers.result === 'Win') {
    resultBadge = '<span style="display: inline-block; background-color: #22c55e; color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; margin-left: 6px; white-space: nowrap;">WIN</span>';
  } else if (entry.answers.result === 'Loss') {
    // If safe rule was applied (Тийм), show BE badge in orange, otherwise show SL in red
    if (entry.answers.safe_rule === 'Тийм') {
      resultBadge = '<span style="display: inline-block; background-color: #f97316; color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; margin-left: 6px; white-space: nowrap;">BE</span>';
    } else {
      resultBadge = '<span style="display: inline-block; background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; margin-left: 6px; white-space: nowrap;">SL</span>';
    }
  }
  
  // Break-even indicator (only show if answer was yes and result is NOT loss)
  // If result is loss and safe_rule is yes, it's already shown as BE badge
  let breakEvenIndicator = '';
  if (entry.answers.safe_rule === 'Тийм' && entry.answers.result !== 'Loss') {
    breakEvenIndicator = ' • <span style="color: #eab308;">Break-even ✓</span>';
  }
  
  // Risk/Reward ratio
  let riskRewardDisplay = '';
  if (entry.answers.risk_reward) {
    const rrValue = parseFloat(parseFloat(entry.answers.risk_reward).toFixed(2));
    riskRewardDisplay = ` • <span style="color: #ffffff;">1/${rrValue}</span>`;
  }
  
  // Ticker badge
  let tickerBadge = '';
  if (entry.answers.ticker) {
    const tickerColor = TICKER_COLORS[entry.answers.ticker] || '#ffffff';
    tickerBadge = `<span style="display: inline-block; background-color: ${tickerColor}; color: white; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; margin-right: 6px; white-space: nowrap; font-weight: 600;">${entry.answers.ticker}</span>`;
  }
  
  // Session display
  let sessionDisplay = '';
  if (entry.answers.session) {
    const sessionAbbr = entry.answers.session === 'Europe' ? 'EU' : entry.answers.session;
    sessionDisplay = ` • <span style="color: rgba(255, 255, 255, 0.6);">${sessionAbbr}</span>`;
  }
  
  // Trim setup name if too long (max 35 characters)
  const maxLength = 35;
  const displayName = entry.setupName.length > maxLength 
    ? entry.setupName.substring(0, maxLength) + '...' 
    : entry.setupName;
  
  row.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex-1">
        <div class="text-white font-normal text-sm">${entryNumber}. ${displayName}${resultBadge}</div>
        <div class="text-white/60 text-xs">${tickerBadge}${dateStr} • <span style="color: ${directionColor};">${entry.answers.entry_direction}</span>${breakEvenIndicator}${riskRewardDisplay}${sessionDisplay}</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-white font-normal text-lg" style="color: ${scoreColor};">${entry.score}</div>
        <button class="delete-entry-btn text-white/60 hover:text-red-500 transition-colors" data-entry-id="${entry.id}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Delete button handler
  const deleteBtn = row.querySelector('.delete-entry-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteJournalEntry(entry.id);
  });
  
  // Row click to edit trade
  row.addEventListener('click', () => {
    editTradeEntry(entry.id);
  });
  
  return row;
}

// Delete journal entry
function deleteJournalEntry(entryId) {
  const entry = journalEntries.find(e => e.id === entryId);
  if (!entry) return;
  
  // Show delete trade modal
  const modal = document.getElementById('delete-trade-modal');
  const titleElement = document.getElementById('delete-trade-title');
  const okBtn = document.getElementById('delete-trade-ok-btn');
  const cancelBtn = document.getElementById('delete-trade-cancel-btn');
  
  if (!modal || !titleElement) return;
  
  // Find entry number
  const totalEntries = journalEntries.length;
  const entryIndex = journalEntries.findIndex(e => e.id === entryId);
  const entryNumber = totalEntries - entryIndex;
  
  // Set modal title
  titleElement.textContent = `${entryNumber}. ${entry.setupName}`;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Remove existing listeners by cloning
  const newOkBtn = okBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Cancel button
  newCancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  // OK button
  newOkBtn.addEventListener('click', () => {
    journalEntries = journalEntries.filter(e => e.id !== entryId);
    saveJournalEntries();
    renderJournalList();
    modal.classList.add('hidden');
  });
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
}

// Show image zoom modal
function showImageZoom(imageSrc, altText) {
  const modal = document.getElementById('image-zoom-modal');
  const zoomedImage = document.getElementById('zoomed-image');
  const closeBtn = document.getElementById('close-zoom-btn');
  
  if (!modal || !zoomedImage) return;
  
  zoomedImage.src = imageSrc;
  zoomedImage.alt = altText;
  modal.classList.remove('hidden');
  
  // Close on background click
  const closeModal = () => {
    modal.classList.add('hidden');
  };
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
}

// Export functions for use in main script
if (typeof window !== 'undefined') {
  window.TradingJournal = {
    initialize: initializeTradingJournal,
    saveTradeEntry: saveTradeEntry,
    resetJournalView: resetJournalView
  };
}
