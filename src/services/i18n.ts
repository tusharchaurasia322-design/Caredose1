// src/services/i18n.ts

export type SupportedLanguage =
  | 'en' // English (Full)
  | 'hi' // Hindi - हिन्दी (Full)
  | 'bn' // Bengali - বাংলা
  | 'pa' // Punjabi - ਪੰਜਾਬੀ
  | 'mr' // Marathi - मराठी
  | 'gu' // Gujarati - ગુજરાતી
  | 'ta' // Tamil - தமிழ்
  | 'te' // Telugu - తెలుగు
  | 'kn' // Kannada - ಕನ್ನಡ
  | 'ml' // Malayalam - മലയാളം
  | 'or' // Odia - ଓଡ଼ିଆ
  | 'as'; // Assamese - অসমীয়া

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  status: 'FULLY_SUPPORTED' | 'PARTIAL_FALLBACK';
  speechLangCode: string;
  sampleSpokenText: string;
}

export const LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    status: 'FULLY_SUPPORTED',
    speechLangCode: 'en-US',
    sampleSpokenText: 'English language selected. Welcome to CareDose.'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    status: 'FULLY_SUPPORTED',
    speechLangCode: 'hi-IN',
    sampleSpokenText: 'हिन्दी भाषा चुनी गई है। केयरडोज़ में आपका स्वागत है।'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    status: 'FULLY_SUPPORTED',
    speechLangCode: 'mr-IN',
    sampleSpokenText: 'मराठी भाषा निवडली आहे. केअरडोस मध्ये आपले स्वागत आहे.'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    status: 'FULLY_SUPPORTED',
    speechLangCode: 'bn-IN',
    sampleSpokenText: 'বাংলা ভাষা নির্বাচিত হয়েছে। কেয়ারডোজে আপনাকে স্বাগতম।'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'gu-IN',
    sampleSpokenText: 'ગુજરાતી ભાષા પસંદ કરેલ છે. કેરડોઝમાં આપનું સ્વાગત છે.'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'ta-IN',
    sampleSpokenText: 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது. கேர்டோஸுக்கு வரவேற்கிறோம்.'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'te-IN',
    sampleSpokenText: 'తెలుగు భాష ఎంచుకోబడింది. కేర్‌డోస్‌కు స్వాగతం.'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'kn-IN',
    sampleSpokenText: 'ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ಕೇರ್ಡೋಸ್‌ಗೆ ಸ್ವಾಗತ.'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'pa-IN',
    sampleSpokenText: 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਚੁਣੀ ਗਈ ਹੈ। ਕੇਅਰਡੋਜ਼ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'ml-IN',
    sampleSpokenText: 'മലയാളം ഭാഷ തിരഞ്ഞെടുത്തു. കെയർഡോസിലേക്ക് സ്വാഗതം.'
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'or-IN',
    sampleSpokenText: 'ଓଡ଼ିଆ ଭାଷା ଚୟନ କରାଯାଇଛି। କେୟାରଡୋଜ୍ କୁ ସ୍ୱାଗତ।'
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    status: 'PARTIAL_FALLBACK',
    speechLangCode: 'as-IN',
    sampleSpokenText: 'অসমীয়া ভাষা বাছনি কৰা হৈছে। কেয়াৰডোজলৈ স্বাগতম।'
  }
];

export type TranslationKey =
  | 'appName'
  | 'tagline'
  | 'zeroCostBadge'
  | 'patient'
  | 'guardian'
  | 'dualMode'
  | 'accessibilitySettings'
  | 'language'
  | 'selectLanguage'
  | 'languageSpokenPreview'
  | 'fullySupported'
  | 'partialSupportNotice'
  | 'highContrast'
  | 'largeText'
  | 'extraLargeText'
  | 'simplifiedMode'
  | 'simplifiedModeDesc'
  | 'largeButtonMode'
  | 'largeButtonModeDesc'
  | 'speechVoice'
  | 'speechVoiceDesc'
  | 'vibration'
  | 'vibrationDesc'
  | 'visualAlert'
  | 'visualAlertDesc'
  | 'tremorSafeguard'
  | 'tremorSafeguardDesc'
  | 'silenceWatchdogTitle'
  | 'silenceRemaining'
  | 'silenceViolated'
  | 'iAmSafe'
  | 'consciousCheckIn'
  | 'schedule'
  | 'medicines'
  | 'guardians'
  | 'history'
  | 'testing'
  | 'todaysRegimen'
  | 'dosesTaken'
  | 'dosesPending'
  | 'dosesMissed'
  | 'noDosesToday'
  | 'addMedicine'
  | 'scheduleMedicine'
  | 'medName'
  | 'dosage'
  | 'instructions'
  | 'scheduledTimes'
  | 'bottlePhoto'
  | 'saveMedicine'
  | 'deleteMedicine'
  | 'confirmTakenYes'
  | 'confirmTakenYesSub'
  | 'confirmNotTakenNo'
  | 'confirmNotTakenNoSub'
  | 'areYouSure'
  | 'tapAgainToConfirm'
  | 'timeForMedicine'
  | 'readAloud'
  | 'snooze5Min'
  | 'guardianActionCenter'
  | 'unresolvedAlerts'
  | 'callPatient'
  | 'confirmTakenByGuardian'
  | 'confirmNotTakenByGuardian'
  | 'acknowledgeAlert'
  | 'pairGuardian'
  | 'verificationCode'
  | 'resetSettings'
  | 'testAccessibility'
  | 'accessibilitySetupTitle'
  | 'accessibilitySetupSub'
  | 'stepSelectLanguage'
  | 'stepSelectNeeds'
  | 'stepReviewRecommendations'
  | 'hearingImpairment'
  | 'visualImpairment'
  | 'limitedMovement'
  | 'tremors'
  | 'difficultyReading'
  | 'cognitiveMemory'
  | 'speechImpairment'
  | 'noAssistance'
  | 'otherNeeds'
  | 'continue'
  | 'finishSetup'
  | 'skipForNow'
  | 'floatingBtnPos'
  | 'resetBtnPos'
  | 'talkBackGuidance'
  | 'ttsNotSupportedNotice'
  | 'addNewPatient'
  | 'addNewPatientDesc'
  | 'addNewMedication'
  | 'addNewMedicationDesc'
  | 'whatWouldYouLikeToAdd'
  | 'savePatient'
  | 'patientName'
  | 'phoneNumber'
  | 'dob'
  | 'doseConfirmedTitle'
  | 'doseConfirmedSub'
  | 'doseRecordedAt'
  | 'takerReceiptOk'
  | 'doseSpokenConfirmed'
  | 'doseDeclinedTitle'
  | 'doseDeclinedSub'
  | 'callGuardianNow'
  | 'changeToYes'
  | 'doseSpokenDeclined'
  | 'captionsSpeaking'
  | 'totalTabletsPresent'
  | 'tabletsRemaining'
  | 'tabletsCurrentlyPresent'
  | 'lowStockWarning'
  | 'refillStock'
  | 'addTablets'
  | 'lowStockNotice'
  | 'voiceCommandActive'
  | 'voiceCommandInstruction'
  | 'voiceListening'
  | 'voiceHeard'
  | 'voiceVerified'
  | 'voiceTestChip'
  | 'voiceCommands'
  | 'voiceCommandsDesc'
  | 'dailyProgress'
  | 'dosesConfirmedPercent'
  | 'allDosesCompleted'
  | 'dosesRemainingToday'
  | 'qrPairingTitle'
  | 'qrPairingDesc'
  | 'copyPublicKey'
  | 'publicKeyCopied'
  | 'downloadQr'
  | 'patientInfoEmptyTitle'
  | 'patientInfoEmptyDesc'
  | 'addPatientInfo'
  | 'addGuardianInfo'
  | 'patientAndGuardianProfile'
  | 'loadDemoProfile'
  | 'noGuardianLinked'
  | 'editPatient'
  | 'deletePatient'
  | 'deleteGuardian'
  | 'confirmDeletePatient'
  | 'confirmDeleteGuardian'
  | 'refillDueDate'
  | 'refillDueSoon'
  | 'consumptionRate'
  | 'helpAndSupport'
  | 'helpTab'
  | 'customReminder'
  | 'suggestedLimit';

const translations: Record<SupportedLanguage, Partial<Record<TranslationKey, string>>> = {
  en: {
    appName: 'CareDose',
    tagline: 'Zero-Cost Offline Medication & Guardian Shield',
    zeroCostBadge: 'Zero-Cost',
    patient: 'Patient',
    guardian: 'Guardian',
    dualMode: 'Dual (Test)',
    accessibilitySettings: 'Accessibility Settings',
    language: 'Language',
    selectLanguage: 'Choose Your Preferred Language',
    languageSpokenPreview: 'Listen to Language Name',
    fullySupported: 'Fully Translated',
    partialSupportNotice: 'Partially translated. Missing phrases will safely fall back to English or Hindi.',
    highContrast: 'High Contrast Mode',
    largeText: 'Large Text',
    extraLargeText: 'Extra Large Text',
    simplifiedMode: 'Simplified Interface',
    simplifiedModeDesc: 'Removes secondary details and shows only your most important task.',
    largeButtonMode: 'Extra-Large Buttons',
    largeButtonModeDesc: 'Enlarges touch targets to 80dp with generous spacing for easier tapping.',
    speechVoice: 'Spoken Reminders (TTS)',
    speechVoiceDesc: 'Reads medication reminders out loud in your selected language.',
    vibration: 'Vibration Alerts',
    vibrationDesc: 'Vibrates your device when it is time to take your medicine.',
    visualAlert: 'Visual Flash Indicator',
    visualAlertDesc: 'Shows a persistent glowing banner for people who are deaf or hard of hearing.',
    tremorSafeguard: 'Tremor & Accidental Tap Safeguard',
    tremorSafeguardDesc: 'Requires a second confirmation tap to prevent unintentional clicks.',
    silenceWatchdogTitle: '48-Hour Silence Watchdog',
    silenceRemaining: 'hrs remaining before guardian alert',
    silenceViolated: 'ESCALATED: Alert sent to guardians',
    iAmSafe: 'I am Safe',
    consciousCheckIn: 'Conscious Check-In',
    schedule: 'Schedule',
    medicines: 'Medicines',
    guardians: 'Guardians',
    history: 'History',
    testing: 'Test / Audit',
    todaysRegimen: "Today's Regimen",
    dosesTaken: 'Taken',
    dosesPending: 'Pending',
    dosesMissed: 'Missed / Declined',
    noDosesToday: 'No doses scheduled for today.',
    addMedicine: 'Add Medicine',
    scheduleMedicine: 'Schedule Medication',
    medName: 'Medication Name',
    dosage: 'Dosage / Quantity',
    instructions: 'Instructions / Notes',
    scheduledTimes: 'Scheduled Times',
    bottlePhoto: 'Bottle / Strip Photo',
    saveMedicine: 'Save Medication',
    deleteMedicine: 'Delete',
    confirmTakenYes: 'YES',
    confirmTakenYesSub: 'I took it',
    confirmNotTakenNo: 'NO',
    confirmNotTakenNoSub: 'I have not',
    areYouSure: 'Confirm your choice',
    tapAgainToConfirm: 'Tap again to confirm your response',
    timeForMedicine: 'TIME FOR YOUR MEDICINE',
    readAloud: 'Read Aloud',
    snooze5Min: 'Snooze 5 minutes',
    guardianActionCenter: 'Guardian Action Center',
    unresolvedAlerts: 'Active Alert(s) Requiring Attention',
    callPatient: 'Call Patient',
    confirmTakenByGuardian: 'Confirm Taken (YES)',
    confirmNotTakenByGuardian: 'Confirm Not Taken (NO)',
    acknowledgeAlert: 'Acknowledge Alert',
    pairGuardian: 'Pair Guardian',
    verificationCode: 'Security Verification Code',
    resetSettings: 'Reset Accessibility Defaults',
    testAccessibility: 'Test Accessibility Settings',
    accessibilitySetupTitle: 'Accessibility & Language Setup',
    accessibilitySetupSub: 'Customize CareDose to match your vision, hearing, motor, or memory needs.',
    stepSelectLanguage: '1. Select Language',
    stepSelectNeeds: '2. Assistance Needs',
    stepReviewRecommendations: '3. Recommended Settings',
    hearingImpairment: 'Hearing impairment or deafness',
    visualImpairment: 'Visual impairment or low vision',
    limitedMovement: 'Limited hand movement or difficulty tapping',
    tremors: 'Tremors or reduced fine-motor control',
    difficultyReading: 'Difficulty reading or understanding complex text',
    cognitiveMemory: 'Memory difficulties or forgetfulness',
    speechImpairment: 'Speech impairment or non-verbal',
    noAssistance: 'No additional assistance needed',
    otherNeeds: 'Other accessibility requirements',
    continue: 'Continue',
    finishSetup: 'Apply & Start CareDose',
    skipForNow: 'Skip Setup',
    floatingBtnPos: 'Floating Button Position',
    resetBtnPos: 'Reset Button Position',
    talkBackGuidance: 'Android TalkBack / Screen-Reader Guidance',
    ttsNotSupportedNotice: 'Device text-to-speech voice is currently missing for this language. System audio chime will still play.',
    addNewPatient: '1. Add New Patient',
    addNewPatientDesc: 'Create a profile for a family member or care recipient',
    addNewMedication: '2. New Medication',
    addNewMedicationDesc: 'Schedule daily dosage, timing and reminder alarms',
    whatWouldYouLikeToAdd: 'What would you like to add?',
    savePatient: 'Save Patient Profile',
    patientName: 'Patient Name',
    phoneNumber: 'Phone Number',
    dob: 'Date of Birth / Age',
    doseConfirmedTitle: 'CONFIRMED: Dose Recorded as Taken!',
    doseConfirmedSub: 'Your conscious check-in was saved. 48-Hour safety clock reset to 48 hours.',
    doseRecordedAt: 'Recorded At',
    takerReceiptOk: 'OK, Understood',
    doseSpokenConfirmed: 'Confirmed! Your dose of {med} has been safely recorded as taken.',
    doseDeclinedTitle: 'RECORDED: Dose NOT Taken',
    doseDeclinedSub: 'Your designated guardian has been notified to check on you if needed.',
    callGuardianNow: 'Call Guardian',
    changeToYes: 'Change to YES (I took it now)',
    doseSpokenDeclined: 'Recorded as not taken. Your designated guardian has been notified.',
    captionsSpeaking: 'Spoken Caption',
    totalTabletsPresent: 'Total Tablets Available',
    tabletsRemaining: 'Tablets Remaining',
    tabletsCurrentlyPresent: 'Current Tablets Present',
    lowStockWarning: 'Low stock! Refill soon',
    refillStock: 'Refill Tablets',
    addTablets: '+ Add Tablets',
    lowStockNotice: 'Low Stock Alert: Only few tablets remaining. Please refill soon.',
    voiceCommandActive: 'Voice Command Active',
    voiceCommandInstruction: "Say 'CareDose, I took my medicine' to confirm hands-free without touching the screen.",
    voiceListening: 'Listening for voice command...',
    voiceHeard: 'Heard',
    voiceVerified: "Voice Verified: 'CareDose, I took my medicine'",
    voiceTestChip: "Test: 'CareDose, I took my medicine'",
    voiceCommands: 'Voice Command Confirmation',
    voiceCommandsDesc: "Allow saying 'CareDose, I took my medicine' to confirm taking medication hands-free.",
    dailyProgress: 'Daily Dose Progress',
    dosesConfirmedPercent: 'Confirmed',
    allDosesCompleted: 'All doses completed for today!',
    dosesRemainingToday: 'remaining today',
    qrPairingTitle: 'Guardian Cryptographic Pairing QR Code',
    qrPairingDesc: 'Scan this QR code from the Guardian device to pair via Bluetooth LE or Local Wi-Fi without any cloud servers.',
    copyPublicKey: 'Copy Public Key',
    publicKeyCopied: 'Copied to clipboard!',
    downloadQr: 'Download QR Code',
    patientInfoEmptyTitle: 'No Patient Configured Yet',
    patientInfoEmptyDesc: 'Add patient details and guardian information to start tracking medication doses and safety alerts.',
    addPatientInfo: 'Add Patient Details',
    addGuardianInfo: 'Add Guardian Information',
    patientAndGuardianProfile: 'Patient & Guardian Profile',
    loadDemoProfile: 'Load Sample Demo (Maria Silva)',
    editPatient: 'Edit Profile',
    deletePatient: 'Delete Patient Profile',
    deleteGuardian: 'Delete Guardian',
    confirmDeletePatient: 'Are you sure you want to delete this patient profile and all associated schedules?',
    confirmDeleteGuardian: 'Are you sure you want to remove this guardian?',
    refillDueDate: 'Refill Due Date',
    refillDueSoon: 'Refill Due Soon',
    consumptionRate: 'Consumption Rate',
    helpAndSupport: 'Help & Feedback',
    helpTab: 'Help',
    customReminder: 'Custom Early Reminder',
    suggestedLimit: 'Suggested max: 30 minutes'
  },
  hi: {
    appName: 'केयरडोज़ (CareDose)',
    tagline: 'निःशुल्क ऑफलाइन दवाई रिमाइंडर एवं अभिभावक सुरक्षा कवच',
    zeroCostBadge: 'निःशुल्क',
    patient: 'मरीज़',
    guardian: 'अभिभावक (Guardian)',
    dualMode: 'दोहरा मोड (Test)',
    accessibilitySettings: 'सुगमता सेटिंग्स (Accessibility)',
    language: 'भाषा (Language)',
    selectLanguage: 'अपनी पसंदीदा भाषा चुनें',
    languageSpokenPreview: 'भाषा का नाम सुनें',
    fullySupported: 'पूरी तरह से अनुवादित',
    partialSupportNotice: 'आंशिक अनुवाद उपलब्ध है।',
    highContrast: 'हाई कंट्रास्ट मोड (गहरा रंग)',
    largeText: 'बड़ा टेक्स्ट (Large Text)',
    extraLargeText: 'बहुत बड़ा टेक्स्ट (Extra Large)',
    simplifiedMode: 'सरल इंटरफ़ेस (Simplified)',
    simplifiedModeDesc: 'अनावश्यक विकल्प हटाकर केवल मुख्य कार्य दिखाता है।',
    largeButtonMode: 'अतिरिक्त बड़े बटन (Large Buttons)',
    largeButtonModeDesc: 'आसान स्पर्श के लिए बटनों का आकार 80dp तक बड़ा करता है।',
    speechVoice: 'बोलकर रिमाइंडर दें (TTS)',
    speechVoiceDesc: 'आपकी चुनी हुई भाषा में दवाई का नाम और समय बोलकर सुनाता है।',
    vibration: 'कंपन अलर्ट (Vibration)',
    vibrationDesc: 'दवाई का समय होने पर फोन में कंपन करता है।',
    visualAlert: 'दृश्य चेतावनी (Visual Alert)',
    visualAlertDesc: 'सुनने में कठिनाई वाले उपयोगकर्ताओं के लिए स्क्रीन पर चमकता बैनर दिखाता है।',
    tremorSafeguard: 'कंपकंपी और गलत स्पर्श से बचाव',
    tremorSafeguardDesc: 'गलती से बटन दबने से रोकने के लिए दो बार पुष्टि मांगता है।',
    silenceWatchdogTitle: '48-घंटे साइलेंस वॉचडॉग',
    silenceRemaining: 'घंटे शेष (अभिभावक अलर्ट से पहले)',
    silenceViolated: 'अलर्ट जारी: अभिभावक को सूचित किया गया',
    iAmSafe: 'मैं सुरक्षित हूँ',
    consciousCheckIn: 'सचेत चेक-इन',
    schedule: 'समय-सारणी',
    medicines: 'दवाइयाँ',
    guardians: 'अभिभावक',
    history: 'इतिहास',
    testing: 'जाँच / ऑडिट',
    todaysRegimen: 'आज की दवाइयाँ',
    dosesTaken: 'ली गईं',
    dosesPending: 'बाकी हैं',
    dosesMissed: 'छूटी / अस्वीकृत',
    noDosesToday: 'आज के लिए कोई दवाई निर्धारित नहीं है।',
    addMedicine: 'दवाई जोड़ें',
    scheduleMedicine: 'दवाई का समय तय करें',
    medName: 'दवाई का नाम',
    dosage: 'मात्रा / खुराक (उदा. 1 गोली)',
    instructions: 'निर्देश (उदा. भोजन के बाद लें)',
    scheduledTimes: 'निर्धारित समय',
    bottlePhoto: 'दवाई या पत्ते की तस्वीर',
    saveMedicine: 'दवाई सुरक्षित करें',
    deleteMedicine: 'हटाएँ',
    confirmTakenYes: 'हाँ',
    confirmTakenYesSub: 'मैंने ले ली',
    confirmNotTakenNo: 'नहीं',
    confirmNotTakenNoSub: 'नहीं ली',
    areYouSure: 'पुष्टि करें',
    tapAgainToConfirm: 'पुष्टि करने के लिए दोबारा दबाएँ',
    timeForMedicine: 'दवाई लेने का समय हो गया है',
    readAloud: 'बोलकर सुनाएँ',
    snooze5Min: '5 मिनट बाद याद दिलाएँ',
    guardianActionCenter: 'अभिभावक एक्शन सेंटर',
    unresolvedAlerts: 'सक्रिय अलर्ट जिन पर ध्यान आवश्यक है',
    callPatient: 'मरीज़ को कॉल करें',
    confirmTakenByGuardian: 'पुष्टि करें - ली गई (हाँ)',
    confirmNotTakenByGuardian: 'पुष्टि करें - नहीं ली (नहीं)',
    acknowledgeAlert: 'अलर्ट स्वीकारें',
    pairGuardian: 'अभिभावक जोड़ें',
    verificationCode: 'सुरक्षा कोड',
    resetSettings: 'डिफ़ॉल्ट सेटिंग्स रीसेट करें',
    testAccessibility: 'सुगमता परीक्षण करें',
    accessibilitySetupTitle: 'भाषा एवं सुगमता सेटअप',
    accessibilitySetupSub: 'देखने, सुनने, हाथ हिलाने या याददाश्त के अनुसार केयरडोज़ को तैयार करें।',
    stepSelectLanguage: '1. भाषा चुनें',
    stepSelectNeeds: '2. सहायता आवश्यकताएँ',
    stepReviewRecommendations: '3. सुझाई गई सेटिंग्स',
    hearingImpairment: 'सुनने में कठिनाई या बधिरता',
    visualImpairment: 'देखने में कठिनाई या कम दृष्टि',
    limitedMovement: 'हाथ हिलाने या छूने में कठिनाई',
    tremors: 'हाथों में कंपन या कंपकंपी',
    difficultyReading: 'पढ़ने या जटिल वाक्य समझने में कठिनाई',
    cognitiveMemory: 'याददाश्त की समस्या या भूलना',
    speechImpairment: 'बोलने में कठिनाई',
    noAssistance: 'किसी अतिरिक्त सहायता की आवश्यकता नहीं',
    otherNeeds: 'अन्य सुगमता आवश्यकताएँ',
    continue: 'आगे बढ़ें',
    finishSetup: 'लागू करें और शुरू करें',
    skipForNow: 'अभी छोड़ें',
    floatingBtnPos: 'फ्लोटिंग बटन की स्थिति',
    resetBtnPos: 'बटन की स्थिति रीसेट करें',
    talkBackGuidance: 'टॉकबैक / स्क्रीन रीडर मार्गदर्शन',
    ttsNotSupportedNotice: 'इस भाषा के लिए डिवाइस में आवाज उपलब्ध नहीं है। ऑडियो टोन बजेगी।',
    addNewPatient: '1. नया मरीज़ जोड़ें',
    addNewPatientDesc: 'परिवार के सदस्य या मरीज़ की प्रोफ़ाइल बनाएँ',
    addNewMedication: '2. नई दवाई जोड़ें',
    addNewMedicationDesc: 'दवाई का समय, खुराक और रिमाइंडर तय करें',
    whatWouldYouLikeToAdd: 'आप क्या जोड़ना चाहते हैं?',
    savePatient: 'मरीज़ प्रोफ़ाइल सुरक्षित करें',
    patientName: 'मरीज़ का नाम',
    phoneNumber: 'फ़ोन नंबर',
    dob: 'जन्म तिथि / उम्र',
    doseConfirmedTitle: 'पुष्टि: दवाई सुरक्षित दर्ज कर ली गई है!',
    doseConfirmedSub: 'आपका सचेत चेक-इन सुरक्षित हो गया है। 48-घंटे की सुरक्षा घड़ी 48 घंटे पर रीसेट हो गई।',
    doseRecordedAt: 'दर्ज समय',
    takerReceiptOk: 'ठीक है, समझ गया',
    doseSpokenConfirmed: 'पुष्टि हुई! आपकी {med} दवाई सुरक्षित दर्ज कर ली गई है।',
    doseDeclinedTitle: 'दर्ज: दवाई नहीं ली गई',
    doseDeclinedSub: 'आपके अभिभावक को सूचित कर दिया गया है ताकि आवश्यकता पड़ने पर वे सहायता कर सकें।',
    callGuardianNow: 'अभिभावक को कॉल करें',
    changeToYes: 'हाँ में बदलें (मैंने अब ले ली)',
    doseSpokenDeclined: 'दवाई नहीं ली गई दर्ज किया गया। आपके अभिभावक को सूचित कर दिया गया है।',
    captionsSpeaking: 'बोले गए शब्द',
    totalTabletsPresent: 'उपलब्ध कुल गोलियां',
    tabletsRemaining: 'गोलियां शेष हैं',
    tabletsCurrentlyPresent: 'वर्तमान में मौजूद गोलियां',
    lowStockWarning: 'दवा कम है! जल्द नई दवा लाएं',
    refillStock: 'गोलियां रीफ़िल करें',
    addTablets: '+ गोलियां जोड़ें',
    lowStockNotice: 'कम स्टॉक चेतावनी: केवल कुछ ही गोलियां बची हैं। कृपया जल्द नई दवाई लाएं।',
    voiceCommandActive: 'वॉयस कमांड सक्रिय',
    voiceCommandInstruction: "हाथ छुए बिना पुष्टि के लिए बोलें: 'CareDose, I took my medicine' या 'केयरडोज़ मैंने दवाई ले ली'",
    voiceListening: 'वॉयस कमांड सुन रहा है...',
    voiceHeard: 'सुना',
    voiceVerified: "वॉयस सत्यापित: 'CareDose, I took my medicine'",
    voiceTestChip: "परीक्षण: 'CareDose, I took my medicine'",
    voiceCommands: 'वॉयस कमांड पुष्टि (Voice Command)',
    voiceCommandsDesc: "हाथ छुए बिना 'CareDose, I took my medicine' बोलकर दवाई की पुष्टि करने की अनुमति दें।",
    dailyProgress: 'दैनिक दवाई प्रगति',
    dosesConfirmedPercent: 'पुष्टि की गई',
    allDosesCompleted: 'आज की सभी दवाइयाँ पूरी हो चुकी हैं!',
    dosesRemainingToday: 'आज शेष हैं',
    qrPairingTitle: 'अभिभावक क्रिप्टोग्राफ़िक युग्मन क्यूआर कोड',
    qrPairingDesc: 'क्लाउड सर्वर के बिना ब्लूटूथ एलई या स्थानीय वाई-फाई से जोड़ने के लिए अभिभावक डिवाइस से यह क्यूआर स्कैन करें।',
    copyPublicKey: 'पब्लिक की कॉपी करें',
    publicKeyCopied: 'क्लिपबोर्ड पर कॉपी हो गया!',
    downloadQr: 'क्यूआर कोड डाउनलोड करें',
    patientInfoEmptyTitle: 'अभी तक कोई मरीज़ नहीं जोड़ा गया',
    patientInfoEmptyDesc: 'दवाइयों की खुराक और सुरक्षा अलर्ट की निगरानी शुरू करने के लिए मरीज़ और अभिभावक की जानकारी जोड़ें।',
    addPatientInfo: 'मरीज़ की जानकारी जोड़ें',
    addGuardianInfo: 'अभिभावक की जानकारी जोड़ें',
    patientAndGuardianProfile: 'मरीज़ एवं अभिभावक प्रोफ़ाइल',
    loadDemoProfile: 'नमूना प्रोफ़ाइल लोड करें (मारिया सिल्वा)',
    editPatient: 'प्रोफ़ाइल बदलें',
    deletePatient: 'मरीज़ प्रोफ़ाइल हटाएं',
    deleteGuardian: 'अभिभावक हटाएं',
    confirmDeletePatient: 'क्या आप वाकई इस मरीज़ प्रोफ़ाइल और उनके सभी दवाई शेड्यूल को हटाना चाहते हैं?',
    confirmDeleteGuardian: 'क्या आप इस अभिभावक को हटाना चाहते हैं?',
    refillDueDate: 'दवाई खत्म होने की अनुमानित तिथि',
    refillDueSoon: 'जल्द ही नई दवाई लाएं',
    consumptionRate: 'खपत दर',
    helpAndSupport: 'मदद एवं सुझाव',
    helpTab: 'मदद (Help)',
    customReminder: 'कस्टम पूर्व रिमाइंडर',
    suggestedLimit: 'सुझाया गया अधिकतम: 30 मिनट'
  },
  mr: {
    appName: 'केअरडोस (CareDose)',
    tagline: 'मोफत औषध आठवण आणि पालक सुरक्षा प्रणाली',
    zeroCostBadge: 'विनामूल्य',
    patient: 'रुग्ण',
    guardian: 'पालक (Guardian)',
    dualMode: 'चाचणी मोड',
    accessibilitySettings: 'सुलभता सेटिंग्ज',
    language: 'भाषा',
    selectLanguage: 'तुमची भाषा निवडा',
    languageSpokenPreview: 'भाषेचे नाव ऐका',
    fullySupported: 'पूर्ण भाषांतरित',
    partialSupportNotice: 'मराठी भाषांतर सक्रिय आहे.',
    highContrast: 'हाय कॉन्ट्रास्ट मोड',
    largeText: 'मोठे अक्षर',
    extraLargeText: 'अतिशय मोठे अक्षर',
    simplifiedMode: 'साधा इंटरफेस',
    simplifiedModeDesc: 'फक्त मुख्य काम दाखवतो.',
    largeButtonMode: 'मोठे बटणे',
    largeButtonModeDesc: 'स्पर्श सुलभ करण्यासाठी बटणे मोठी करतो.',
    speechVoice: 'औषध बोलून सांगा (TTS)',
    speechVoiceDesc: 'मराठीत औषध आठवण करून देतो.',
    vibration: 'कंपन सूचना',
    vibrationDesc: 'औषधाच्या वेळी फोन व्हायब्रेट करतो.',
    visualAlert: 'दृष्टी सूचना',
    visualAlertDesc: 'ऐकू न येणाऱ्यांसाठी स्क्रीनवर प्रकाश दाखवतो.',
    tremorSafeguard: 'कंपन संरक्षण',
    tremorSafeguardDesc: 'चुकीचा स्पर्श टाळण्यासाठी दोनदा विचारतो.',
    silenceWatchdogTitle: '48-तास सुरक्षा वॉचडॉग',
    silenceRemaining: 'तास शिल्लक',
    silenceViolated: 'पालकांना सावध केले',
    iAmSafe: 'मी सुरक्षित आहे',
    consciousCheckIn: 'सजग चेक-इन',
    schedule: 'वेळापत्रक',
    medicines: 'औषधे',
    guardians: 'पालक',
    history: 'इतिहास',
    testing: 'चाचणी',
    todaysRegimen: 'आजची औषधे',
    dosesTaken: 'घेतली',
    dosesPending: 'बाकी',
    dosesMissed: 'सुटलेली',
    noDosesToday: 'आज कोणतीही औषधे नाहीत.',
    addMedicine: 'औषध जोडा',
    scheduleMedicine: 'औषधाची वेळ ठरवा',
    medName: 'औषधाचे नाव',
    dosage: 'प्रमाण',
    instructions: 'सूचना',
    scheduledTimes: 'वेळ',
    bottlePhoto: 'औषधाचा फोटो',
    saveMedicine: 'जतन करा',
    deleteMedicine: 'हटवा',
    confirmTakenYes: 'होय',
    confirmTakenYesSub: 'मी घेतले',
    confirmNotTakenNo: 'नाही',
    confirmNotTakenNoSub: 'नाही घेतले',
    areYouSure: 'खात्री करा',
    tapAgainToConfirm: 'पुन्हा स्पर्श करा',
    timeForMedicine: 'औषध घेण्याची वेळ झाली',
    readAloud: 'वाचा',
    snooze5Min: '5 मिनिटांनी आठवण करा',
    guardianActionCenter: 'पालक कक्ष',
    unresolvedAlerts: 'लक्ष द्या',
    callPatient: 'कॉल करा',
    confirmTakenByGuardian: 'होय, घेतली',
    confirmNotTakenByGuardian: 'नाही घेतली',
    acknowledgeAlert: 'अलर्ट स्वीकारा',
    pairGuardian: 'पालक जोडा',
    verificationCode: 'सुरक्षा कोड',
    resetSettings: 'रीसेट करा',
    testAccessibility: 'चाचणी',
    accessibilitySetupTitle: 'सुलभता सेटअप',
    accessibilitySetupSub: 'तुमच्या गरजेनुसार केअरडोस तयार करा.',
    stepSelectLanguage: '१. भाषा निवडा',
    stepSelectNeeds: '२. गरजा निवडा',
    stepReviewRecommendations: '३. शिफारसी',
    hearingImpairment: 'ऐकण्यात अडचण',
    visualImpairment: 'दृष्टीदोष',
    limitedMovement: 'हात हलवण्यात अडचण',
    tremors: 'हातांची थरथर',
    difficultyReading: 'वाचण्यात अडचण',
    cognitiveMemory: 'विस्मरण किंवा स्मरण समस्या',
    speechImpairment: 'बोलण्यात अडचण',
    noAssistance: 'मदत नको',
    otherNeeds: 'इतर गरजा',
    continue: 'पुढे चला',
    finishSetup: 'सुरू करा',
    skipForNow: 'सोडून द्या',
    floatingBtnPos: 'बटन स्थिती',
    resetBtnPos: 'स्थिती रीसेट करा',
    talkBackGuidance: 'टॉकबॅक मार्गदर्शन',
    ttsNotSupportedNotice: 'आवाज उपलब्ध नाही.'
  },
  bn: {
    appName: 'কেয়ারডোজ (CareDose)',
    tagline: 'বিনা মূল্যের অফলাইন ওষুধ রিমাইন্ডার ও অভিভাবক সুরক্ষা কবচ',
    zeroCostBadge: 'বিনা মূল্যে',
    patient: 'রোগী',
    guardian: 'অভিভাবক',
    dualMode: 'টেস্ট মোড',
    accessibilitySettings: 'অ্যাক্সেসিবিলিটি সেটিংস',
    language: 'ভাষা',
    selectLanguage: 'আপনার ভাষা নির্বাচন করুন',
    languageSpokenPreview: 'ভাষার নাম শুনুন',
    fullySupported: 'সম্পূর্ণ অনুবাদিত',
    partialSupportNotice: 'বাংলা ভাষা সক্রিয় রয়েছে।',
    highContrast: 'উচ্চ বৈসাদৃশ্য মোড',
    largeText: 'বড় লেখা',
    extraLargeText: 'অতিরিক্ত বড় লেখা',
    simplifiedMode: 'সহজ ইন্টারফেস',
    simplifiedModeDesc: 'অপ্রয়োজনীয় তথ্য লুকিয়ে শুধু প্রধান কাজ দেখায়।',
    largeButtonMode: 'বড় বাটন',
    largeButtonModeDesc: 'সহজে স্পর্শ করতে বাটনের আকার ৮০ ডিপি করে।',
    speechVoice: 'মুখে বলে রিমাইন্ডার (TTS)',
    speechVoiceDesc: 'বাংলায় ওষুধের নাম ও নিয়ম পড়ে শোনায়।',
    vibration: 'কম্পন সতর্কতা',
    vibrationDesc: 'ওষুধের সময় হলে ফোন কাঁপবে।',
    visualAlert: 'ভিজ্যুয়াল সতর্কতা',
    visualAlertDesc: 'যাদের শুনতে সমস্যা হয় তাদের জন্য স্ক্রিনে আলো জ্বলে।',
    tremorSafeguard: 'কাঁপুনি সুরক্ষা',
    tremorSafeguardDesc: 'ভুল স্পর্শ ঠেকাতে দুবার নিশ্চিত করতে বলে।',
    silenceWatchdogTitle: '৪৮-ঘণ্টা সতর্কতা পাহারা',
    silenceRemaining: 'ঘণ্টা বাকি',
    silenceViolated: 'অভিভাবককে সতর্ক করা হয়েছে',
    iAmSafe: 'আমি ভালো আছি',
    consciousCheckIn: 'সচেতন চেক-ইন',
    schedule: 'সময়সূচী',
    medicines: 'ওষুধসমূহ',
    guardians: 'অভিভাবক',
    history: 'ইতিহাস',
    testing: 'পরীক্ষা',
    todaysRegimen: 'আজকের ওষুধ',
    dosesTaken: 'নেওয়া হয়েছে',
    dosesPending: 'বাকি আছে',
    dosesMissed: 'মিস হয়েছে',
    noDosesToday: 'আজ কোনো ওষুধ নির্ধারিত নেই।',
    addMedicine: 'ওষুধ যোগ করুন',
    scheduleMedicine: 'ওষুধের সময় নির্ধারণ',
    medName: 'ওষুধের নাম',
    dosage: 'পরিমাণ',
    instructions: 'নির্দেশনা',
    scheduledTimes: 'সময়',
    bottlePhoto: 'ওষুধের ছবি',
    saveMedicine: 'সংরক্ষণ করুন',
    deleteMedicine: 'মুছুন',
    confirmTakenYes: 'হ্যাঁ',
    confirmTakenYesSub: 'নিয়েছি',
    confirmNotTakenNo: 'না',
    confirmNotTakenNoSub: 'নিইনি',
    areYouSure: 'নিশ্চিত করুন',
    tapAgainToConfirm: 'নিশ্চিত করতে আবার চাপুন',
    timeForMedicine: 'ওষুধ খাওয়ার সময় হয়েছে',
    readAloud: 'পড়ে শোনান',
    snooze5Min: '৫ মিনিট পরে মনে করান',
    guardianActionCenter: 'অভিভাবক কেন্দ্র',
    unresolvedAlerts: 'জরুরি সতর্কতা',
    callPatient: 'রোগীকে কল করুন',
    confirmTakenByGuardian: 'হ্যাঁ, ওষুধ নিয়েছে',
    confirmNotTakenByGuardian: 'না, ওষুধ নেয়নি',
    acknowledgeAlert: 'সতর্কতা স্বীকার করুন',
    pairGuardian: 'অভিভাবক সংযুক্ত করুন',
    verificationCode: 'নিরাপত্তা কোড',
    resetSettings: 'রিসেট করুন',
    testAccessibility: 'পরীক্ষা করুন',
    accessibilitySetupTitle: 'অ্যাক্সেসিবিলিটি সেটআপ',
    accessibilitySetupSub: 'আপনার প্রয়োজন অনুযায়ী কেয়ারডোজ সাজিয়ে নিন।',
    stepSelectLanguage: '১. ভাষা নির্বাচন',
    stepSelectNeeds: '২. সহায়তা প্রয়োজন',
    stepReviewRecommendations: '৩. সুপারিশসমূহ',
    hearingImpairment: 'শুনতে সমস্যা বা বধিরতা',
    visualImpairment: 'দেখতে সমস্যা বা স্বল্প দৃষ্টি',
    limitedMovement: 'হাত নাড়াচাড়া করতে সমস্যা',
    tremors: 'হাতে কাঁপুনি',
    difficultyReading: 'পড়তে বা বুঝতে সমস্যা',
    cognitiveMemory: 'স্মৃতিশক্তি বা ভুলে যাওয়ার সমস্যা',
    speechImpairment: 'কথা বলতে সমস্যা',
    noAssistance: 'অতিরিক্ত সহায়তার প্রয়োজন নেই',
    otherNeeds: 'অন্যান্য প্রয়োজন',
    continue: 'এগিয়ে যান',
    finishSetup: 'শুরু করুন',
    skipForNow: 'এখন এড়িয়ে যান',
    floatingBtnPos: 'ভাসমান বাটনের অবস্থান',
    resetBtnPos: 'বাটনের অবস্থান রিসেট',
    talkBackGuidance: 'টকব্যাক নির্দেশিকা',
    ttsNotSupportedNotice: 'এই ভাষার জন্য ডিভাইসে ভয়েস নেই।'
  },
  gu: {},
  ta: {},
  te: {},
  kn: {},
  pa: {},
  ml: {},
  or: {},
  as: {}
};

export class I18nService {
  private static currentLanguage: SupportedLanguage = 'en';
  private static listeners: Array<(lang: SupportedLanguage) => void> = [];

  static init() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('CAREDOS_LANGUAGE') as SupportedLanguage;
      if (saved && LANGUAGES.some(l => l.code === saved)) {
        this.currentLanguage = saved;
      }
    }
  }

  static getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  static getLanguageInfo(code?: SupportedLanguage): LanguageInfo {
    const target = code || this.currentLanguage;
    return LANGUAGES.find(l => l.code === target) || LANGUAGES[0];
  }

  static setLanguage(lang: SupportedLanguage) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('CAREDOS_LANGUAGE', lang);
    }
    this.listeners.forEach(l => l(lang));
  }

  static subscribe(listener: (lang: SupportedLanguage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static t(key: TranslationKey, params?: Record<string, string | number>): string {
    const langDict = translations[this.currentLanguage];
    let val = langDict ? langDict[key] : undefined;

    // Fall back to Hindi if Indian language, otherwise English
    if (!val) {
      if (['mr', 'gu', 'bn', 'pa', 'ta', 'te', 'kn', 'ml', 'or', 'as'].includes(this.currentLanguage)) {
        val = translations['hi']?.[key] || translations['en']?.[key] || key;
      } else {
        val = translations['en']?.[key] || key;
      }
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val?.replace(`{${k}}`, String(v));
      });
    }

    return val || key;
  }

  // Spoken Language Preview
  static speakLanguagePreview(langCode: SupportedLanguage) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const info = this.getLanguageInfo(langCode);
    const utterance = new SpeechSynthesisUtterance(info.sampleSpokenText);
    utterance.lang = info.speechLangCode;
    utterance.rate = 0.85;

    // Check if voice exists for this language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(info.speechLangCode.slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  static isSpeechVoiceAvailable(langCode: SupportedLanguage): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const info = this.getLanguageInfo(langCode);
    const voices = window.speechSynthesis.getVoices();
    return voices.some(v => v.lang.toLowerCase().startsWith(info.speechLangCode.slice(0, 2).toLowerCase()));
  }
}

// Initialize on module evaluation
I18nService.init();

export const t = (key: TranslationKey, params?: Record<string, string | number>) =>
  I18nService.t(key, params);
