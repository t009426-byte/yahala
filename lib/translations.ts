export type Lang = "ar" | "en";

export const translations = {
  ar: {
    // Layout / Header
    admin_portal: "بوابة الإدارة",
    brand: "WeddingPass",
    sign_out: "تسجيل الخروج",

    // Nav
    nav_dashboard: "لوحة التحكم",
    nav_guests: "المدعوون",
    nav_gifts: "الهدايا",
    nav_gate: "البوابة",

    // Roles
    role_organizer: "منظّم",
    role_couple: "العروسان",
    role_bride_family: "أهل العروس",
    role_groom_family: "أهل العريس",
    role_gate_staff: "موظف بوابة",

    // Hero
    wedding_ceremony: "حفل الزفاف",
    days_left: "يوم متبقٍ",
    today: "اليوم",
    ended: "انتهى",
    open_gate: "فتح البوابة",
    export_pdf: "تصدير PDF",
    send_thanks: "إرسال شكر",

    // Stats
    stat_invited: "المدعوون",
    stat_confirmed: "مؤكدون",
    stat_pending: "قيد الانتظار",
    stat_declined: "اعتذروا",
    stat_entered: "دخلوا",

    // RSVP Progress
    rsvp_title: "نسبة الحضور",
    rsvp_bride: "أهل العروس",
    rsvp_groom: "أهل العريس",
    rsvp_capacity: "الطاقة الاستيعابية",
    rsvp_confirmed_of: "مؤكد من أصل",
    rsvp_confirmed_attendance: "حضور مؤكد",
    gifts_total_title: "إجمالي الهدايا",
    gifts_total: "المجموع",
    load_error: "تعذّر تحميل البيانات",

    // Gift Feed
    gifts_title: "آخر الهدايا",
    gifts_live: "مباشر",
    gifts_empty: "لا توجد هدايا بعد",
    gifts_error: "تعذّر تحميل الهدايا",

    // Guest List
    guests_title: "قائمة المدعوين",
    guests_count: "مدعو",
    guests_search: "بحث عن مدعو بالاسم...",
    guests_empty: "لا يوجد مدعوون بعد",
    guests_no_results: "لا توجد نتائج لهذا البحث",
    guests_error: "تعذّر تحميل المدعوين",
    guests_prev: "السابق",
    guests_next: "التالي",
    guests_page: "صفحة",
    tab_all: "الكل",
    tab_confirmed: "مؤكد",
    tab_pending: "منتظر",
    tab_declined: "اعتذر",
    tab_entered: "دخل",
    status_confirmed: "مؤكد",
    status_pending: "منتظر",
    status_declined: "اعتذر",
    status_entered: "دخل",
    side_bride: "أهل العروس",
    side_groom: "أهل العريس",
    table: "طاولة",

    // Nav — event
    nav_event: "الفعالية",

    // Event page
    event_page_title: "إعداد الفعالية",
    event_page_subtitle: "أدخل تفاصيل حفل الزفاف",
    event_section_details: "تفاصيل الحفل",
    event_section_schedule: "التوقيت",
    event_section_venue: "المكان",
    event_section_contacts: "أرقام التواصل",
    event_section_settings: "الإعدادات",
    event_couple_names: "اسم العروسين",
    event_couple_names_placeholder: "مثال: أحمد ومريم",
    event_name: "اسم الفعالية",
    event_name_placeholder: "مثال: حفل زفاف أحمد ومريم",
    event_date: "تاريخ الحفل",
    event_time: "وقت الحفل",
    event_venue: "قاعة الاحتفال",
    event_venue_placeholder: "اسم القاعة أو المكان",
    event_capacity: "الطاقة الاستيعابية",
    event_capacity_hint: "العدد الأقصى للمدعوين",
    event_save: "حفظ التغييرات",
    event_create: "إنشاء الفعالية",
    event_saving: "جاري الحفظ...",
    event_saved: "تم الحفظ بنجاح",
    event_save_error: "حدث خطأ أثناء الحفظ",
    event_no_event: "لا توجد فعالية",
    event_no_event_hint: "أنشئ فعاليتك الأولى لتبدأ في إدارة المدعوين",
  },
  en: {
    // Layout / Header
    admin_portal: "Admin Portal",
    brand: "WeddingPass",
    sign_out: "Sign out",

    // Nav
    nav_dashboard: "Dashboard",
    nav_guests: "Guests",
    nav_gifts: "Gifts",
    nav_gate: "Gate",

    // Roles
    role_organizer: "Organizer",
    role_couple: "Couple",
    role_bride_family: "Bride's Family",
    role_groom_family: "Groom's Family",
    role_gate_staff: "Gate Staff",

    // Hero
    wedding_ceremony: "Wedding Ceremony",
    days_left: "days left",
    today: "Today",
    ended: "Ended",
    open_gate: "Open Gate",
    export_pdf: "Export PDF",
    send_thanks: "Send Thanks",

    // Stats
    stat_invited: "Invited",
    stat_confirmed: "Confirmed",
    stat_pending: "Pending",
    stat_declined: "Declined",
    stat_entered: "Entered",

    // RSVP Progress
    rsvp_title: "RSVP Progress",
    rsvp_bride: "Bride's Side",
    rsvp_groom: "Groom's Side",
    rsvp_capacity: "Capacity",
    rsvp_confirmed_of: "confirmed of",
    rsvp_confirmed_attendance: "confirmed attendance",
    gifts_total_title: "Total Gifts",
    gifts_total: "Total",
    load_error: "Failed to load data",

    // Gift Feed
    gifts_title: "Recent Gifts",
    gifts_live: "Live",
    gifts_empty: "No gifts yet",
    gifts_error: "Failed to load gifts",

    // Guest List
    guests_title: "Guest List",
    guests_count: "guests",
    guests_search: "Search by name...",
    guests_empty: "No guests yet",
    guests_no_results: "No results found",
    guests_error: "Failed to load guests",
    guests_prev: "← Prev",
    guests_next: "Next →",
    guests_page: "Page",
    tab_all: "All",
    tab_confirmed: "Confirmed",
    tab_pending: "Pending",
    tab_declined: "Declined",
    tab_entered: "Entered",
    status_confirmed: "Confirmed",
    status_pending: "Pending",
    status_declined: "Declined",
    status_entered: "Entered",
    side_bride: "Bride's Side",
    side_groom: "Groom's Side",
    table: "Table",

    // Nav — event
    nav_event: "Event",

    // Event page
    event_page_title: "Event Setup",
    event_page_subtitle: "Enter your wedding ceremony details",
    event_section_details: "Ceremony Details",
    event_section_schedule: "Schedule",
    event_section_venue: "Venue",
    event_section_contacts: "Contact Numbers",
    event_section_settings: "Settings",
    event_couple_names: "Couple Names",
    event_couple_names_placeholder: "e.g. Ahmad & Mariam",
    event_name: "Event Name",
    event_name_placeholder: "e.g. Ahmad & Mariam Wedding",
    event_date: "Event Date",
    event_time: "Event Time",
    event_venue: "Venue / Hall",
    event_venue_placeholder: "Hall name or location",
    event_capacity: "Capacity",
    event_capacity_hint: "Maximum number of guests",
    event_save: "Save Changes",
    event_create: "Create Event",
    event_saving: "Saving...",
    event_saved: "Saved successfully",
    event_save_error: "Error saving event",
    event_no_event: "No Event Found",
    event_no_event_hint: "Create your first event to start managing guests",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key];
}
