export interface Symptom {
    name: string,
    startDate: string,
    endDate: string | null,
    isActive: boolean,
}
export interface Profile {
    created_at: string; // ISO 8601 formatted date-time string
    first_name: string;
    last_name: string;
    user_id: string; // UUID
    phone: string;
    report_url: string[]; // Array of report URLs (assuming strings)
    symptoms: Symptom[]; // Array of symptoms (assuming strings)
    prescription_url: string[]; // Array of prescription URLs (assuming strings)
    reminder_preference: {
        pushNotifications: boolean;
        telegramMessages: boolean;
        sms: boolean;
        whatsappMessages: boolean;
    };
    telegram_id: string | null; // Can be null if not set
    push_token?: string | null; // Optional push token
}

export interface Medicine {
    user_id?: string; // UUID
    name: string;
    description?: string; //how to eat (before/after meal)
    eat_upto: string; // ISO 8601 formatted date string (YYYY-MM-DD)
    m_id?: string; // Medicine identifier
    side_effect: string[]; // Array of side effects (assuming strings)
    times_to_eat: string[]; // Array of time strings (HHMM format)
    uses: string; // Description of the medicine's use
}