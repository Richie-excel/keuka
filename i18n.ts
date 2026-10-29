import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from '@/locales/en/common.json'
import enNav from '@/locales/en/nav.json'
import enAuth from '@/locales/en/auth.json'
import enDashboard from '@/locales/en/dashboard.json'
import enPurchases from '@/locales/en/purchases.json'
import enFinance from '@/locales/en/finance.json'
import enInventory from '@/locales/en/inventory.json'
import enBuyers from '@/locales/en/buyers.json'
import enPartners from '@/locales/en/partners.json'
import enHome from '@/locales/en/home.json'
import enLogistics from '@/locales/en/logistics.json'
import enPricing from '@/locales/en/pricing.json'
import enPayroll from '@/locales/en/payroll.json'
import enPersonnel from '@/locales/en/personnel.json'
import enReporting from '@/locales/en/reporting.json'
import enSettings from '@/locales/en/settings.json'
import enUsers from '@/locales/en/users.json'
import enAudit from '@/locales/en/audit.json'
import enStatus from '@/locales/en/status.json'
import enShared from '@/locales/en/shared.json'
import enValidation from '@/locales/en/validation.json'
import enAnalysis from '@/locales/en/analysis.json'
import enSynchronization from '@/locales/en/synchronization.json'
import enToast from '@/locales/en/toast.json'
import enEnterprises from '@/locales/en/enterprises.json'
import enSubscription from '@/locales/en/subscription.json'
import enPlans from '@/locales/en/plans.json'
import enDocuments from '@/locales/en/documents.json'
import enErrors from '@/locales/en/errors.json'
import enRetention from '@/locales/en/retention.json'

import frCommon from '@/locales/fr/common.json'
import frNav from '@/locales/fr/nav.json'
import frAuth from '@/locales/fr/auth.json'
import frDashboard from '@/locales/fr/dashboard.json'
import frPurchases from '@/locales/fr/purchases.json'
import frFinance from '@/locales/fr/finance.json'
import frInventory from '@/locales/fr/inventory.json'
import frBuyers from '@/locales/fr/buyers.json'
import frPartners from '@/locales/fr/partners.json'
import frHome from '@/locales/fr/home.json'
import frLogistics from '@/locales/fr/logistics.json'
import frPricing from '@/locales/fr/pricing.json'
import frPayroll from '@/locales/fr/payroll.json'
import frPersonnel from '@/locales/fr/personnel.json'
import frReporting from '@/locales/fr/reporting.json'
import frSettings from '@/locales/fr/settings.json'
import frUsers from '@/locales/fr/users.json'
import frAudit from '@/locales/fr/audit.json'
import frStatus from '@/locales/fr/status.json'
import frShared from '@/locales/fr/shared.json'
import frValidation from '@/locales/fr/validation.json'
import frAnalysis from '@/locales/fr/analysis.json'
import frSynchronization from '@/locales/fr/synchronization.json'
import frToast from '@/locales/fr/toast.json'
import frEnterprises from '@/locales/fr/enterprises.json'
import frSubscription from '@/locales/fr/subscription.json'
import frPlans from '@/locales/fr/plans.json'
import frDocuments from '@/locales/fr/documents.json'
import frErrors from '@/locales/fr/errors.json'
import frRetention from '@/locales/fr/retention.json'

const en = {
  ...enCommon, ...enNav, ...enAuth, ...enDashboard, ...enPurchases, ...enFinance,
  ...enInventory, ...enBuyers, ...enPartners, ...enHome, ...enLogistics, ...enPricing,
  ...enPayroll, ...enPersonnel, ...enReporting, ...enSettings, ...enUsers, ...enAudit, ...enStatus,
  ...enShared, ...enValidation, ...enAnalysis, ...enSynchronization, ...enToast, ...enEnterprises, ...enSubscription,
  ...enPlans, ...enDocuments, ...enErrors, ...enRetention,
}

const fr = {
  ...frCommon, ...frNav, ...frAuth, ...frDashboard, ...frPurchases, ...frFinance,
  ...frInventory, ...frBuyers, ...frPartners, ...frHome, ...frLogistics, ...frPricing,
  ...frPayroll, ...frPersonnel, ...frReporting, ...frSettings, ...frUsers, ...frAudit, ...frStatus,
  ...frShared, ...frValidation, ...frAnalysis, ...frSynchronization, ...frToast, ...frEnterprises, ...frSubscription,
  ...frPlans, ...frDocuments, ...frErrors, ...frRetention,
}


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cocoa-ms-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  })

const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng)
syncHtmlLang(i18n.resolvedLanguage ?? 'fr')
i18n.on('languageChanged', syncHtmlLang)

export default i18n
