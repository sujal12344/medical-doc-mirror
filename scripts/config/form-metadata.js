const formDescriptions = {
  'MD-3': 'Manufacture for Sale (Class A/B)',
  'MD-4': 'Loan Licence to Manufacture (Class A/B)',
  'MD-7': 'Manufacture for Sale (Class C/D)',
  'MD-8': 'Loan Licence to Manufacture (Class C/D)',
  'MD-12': 'Manufacture for Test/Evaluation',
  'MD-14': 'Commercial Import Licence',
  'MD-16': 'Import for Test/Evaluation',
  'MD-18': 'Import for Investigational Treatment',
  'MD-20': 'Import for Personal Use',
  'MD-22': 'Conduct Clinical Investigation',
  'MD-24': 'Clinical Performance Evaluation (IVD)',
  'MD-26': 'New Device Approval (No Predicate)',
  'MD-28': 'New IVD Approval',
  'MD-33': 'Purchaser Independent Testing',
  'MD-39': 'Register Testing Laboratory',
  'MD-41': 'Registration to Sell/Distribute',
  'MD-1': 'Register Notified Body',
  'MD-11': 'Audit/Inspection Book (Manufacturing)',
  'MD-43': 'Inspection Book (Sale/Distribution)',
};

const formSummaries = {
  'MD-3': 'License to manufacture low to moderate risk medical devices or IVDs for commercial sale and distribution in India.',
  'MD-4': 'Permission to use the manufacturing facilities of another licensee for commercial production of Class A/B devices.',
  'MD-7': 'License to manufacture high to very high risk medical devices or IVDs, requiring extensive quality and clinical data.',
  'MD-8': "Permission to utilize another licensees facility to manufacture high risk devices under a loan arrangement.",
  'MD-12': 'License to manufacture limited quantities of a device purely for clinical investigation, testing, or demonstration.',
  'MD-16': 'License to import limited quantities of unapproved medical devices strictly for testing or clinical trials.',
  'MD-14': 'Comprehensive license allowing authorized Indian agents to import and sell foreign-manufactured medical devices.',
  'MD-20': 'Permission for patients to legally import small quantities of medical devices prescribed for their personal treatment.',
  'MD-22': 'Approval from CDSCO to initiate a clinical trial for an investigational medical device involving human participants.',
  'MD-24': 'Permission to evaluate the performance and safety of a new In-Vitro Diagnostic (IVD) device using clinical specimens.',
  'MD-26': 'Marketing authorization for innovative medical devices that do not have an equivalent predicate device currently on the market.',
  'MD-28': 'Application to import or manufacture a completely new In-Vitro Diagnostic (IVD) that lacks a predicate in the Indian market.',
  'MD-1': 'Registration for third-party auditing organizations authorized to inspect Class A and Class B manufacturing facilities.',
  'MD-39': 'Approval for private testing laboratories to carry out testing and evaluation of medical devices on behalf of manufacturers.',
  'MD-41': 'Mandatory registration certificate for wholesalers, retailers, and distributors dealing in medical devices.',
  'MD-11': 'Required record book maintained at the manufacturing site for official auditors to log observations and remarks.',
  'MD-43': 'Statutory inspection book maintained by registered distributors to record observations by Medical Device Officers.'
};

const formConfigs = {
  // 1. Commercial Manufacturing
  'MD-3': { requiredContexts: ['PRODUCT_MULTI'], templates: {
      '05_Device_Master_File_Non_IVD_Template.docx': { conditionRule: "context.product?.deviceType === 'medical-device'", badgeLabel: "Non-IVD Only" },
      '06_Device_Master_File_IVD_Template.docx': { conditionRule: "context.product?.deviceType === 'ivd'", badgeLabel: "IVD Only" }
  }},
  'MD-4': { requiredContexts: ['PRODUCT_MULTI'], templates: {
      '05_Device_Master_File_Non_IVD_Template.docx': { conditionRule: "context.product?.deviceType === 'medical-device'", badgeLabel: "Non-IVD Only" },
      '06_Device_Master_File_IVD_Template.docx': { conditionRule: "context.product?.deviceType === 'ivd'", badgeLabel: "IVD Only" }
  }},
  'MD-7': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },
  'MD-8': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },

  // 2. Commercial Import
  'MD-14': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },

  // 3. Small Quantity Testing
  'MD-12': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },
  'MD-16': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },

  // 4. Clinical Trials
  'MD-22': { requiredContexts: ['PRODUCT_SINGLE'], allowedDeviceType: 'medical-device', templates: {} },
  'MD-24': { requiredContexts: ['PRODUCT_SINGLE'], allowedDeviceType: 'ivd', templates: {} },

  // 5. New Device Approvals
  'MD-26': { requiredContexts: ['PRODUCT_SINGLE'], allowedDeviceType: 'medical-device', templates: {} },
  'MD-28': { requiredContexts: ['PRODUCT_SINGLE'], allowedDeviceType: 'ivd', templates: {} },

  // 6. Market Sale / Wholesale
  'MD-41': { requiredContexts: ['PRODUCT_MULTI'], templates: {} },

  // 7. Audit / Testing Bodies
  'MD-1': { requiredContexts: [], templates: {} },
  'MD-39': { requiredContexts: [], templates: {} },

  // 8. Personal Use
  'MD-20': { requiredContexts: ['PRODUCT_SINGLE'], templates: {} },

  // 9. Inspection Records
  'MD-11': { requiredContexts: [], templates: {} },
  'MD-43': { requiredContexts: [], templates: {} }
};

const sourceCategorizationRules = [
  { source: 'FORM', keywords: ['cover', 'official', 'form_md', 'fee_challan'] },
  { source: 'LEGAL', keywords: ['constitution', 'agreement', 'undertaking', 'power_of_attorney'] },
  { source: 'QMS', keywords: ['qms', 'quality', 'iso', 'sop', 'organisation'] },
  { source: 'PMF', keywords: ['plant', 'site'] },
  { source: 'DMF', keywords: ['device_master', 'essential_principles', 'design', 'risk', 'ifu', 'label', 'stability', 'performance_evaluation'] },
  { source: 'CLINICAL', keywords: ['clinical', 'investigator', 'ethics', 'consent', 'case_report'] },
  { source: 'EXTERNAL', keywords: ['fsc', 'noc', 'audit'] }
];

function determineSource(fileName) {
  const lower = fileName.toLowerCase();
  
  for (const rule of sourceCategorizationRules) {
    if (rule.keywords.some(keyword => lower.includes(keyword))) {
      return rule.source;
    }
  }
  
  // Default to DMF if we can't figure it out, as it's the most common technical file
  return 'DMF';
}

module.exports = {
  formDescriptions,
  formSummaries,
  formConfigs,
  determineSource
};
