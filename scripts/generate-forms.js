const fs = require('fs');
const path = require('path');

const formatDir = path.join(__dirname, '..', 'format');

const groups = [
  {
    id: 'commercial-manufacturing',
    name: 'Commercial Manufacturing',
    description: 'Domestic manufacturing and loan licenses for all device risk classes.',
    forms: ['md-3', 'md-4', 'md-7', 'md-8']
  },
  {
    id: 'small-quantity-testing',
    name: 'Small Quantity Testing',
    description: 'Manufacturing or importing small batches strictly for lab testing, analysis, or demonstration.',
    forms: ['md-12', 'md-16'] // note format folder might be md-16 but checking if it exists
  },
  {
    id: 'commercial-import',
    name: 'Commercial Import',
    description: 'Importing medical devices and In-Vitro Diagnostics (IVDs) in bulk for commercial sale.',
    forms: ['md-14']
  },
   {
    id: 'personal-use-import',
    name: 'Personal Use Import',
    description: 'Application for permission to import a small quantity of a medical device for bona fide personal use.',
    forms: ['md-20']
  },
  {
    id: 'clinical-trials-evaluation',
    name: 'Clinical Trials & Evaluation',
    description: 'Conducting human clinical trials for devices or clinical performance evaluations for IVDs.',
    forms: ['md-22', 'md-24']
  },
  {
    id: 'new-device-approvals',
    name: 'New Device Approvals',
    description: 'First-time approval for entirely new medical devices or IVDs that do not have an existing predicate in the market.',
    forms: ['md-26', 'md-28']
  },
  {
    id: 'audit-testing-bodies',
    name: 'Audit & Testing Bodies',
    description: 'Registering third-party auditing agencies (Notified Bodies) and authorized private testing laboratories.',
    forms: ['md-1', 'md-39']
  },
  {
    id: 'market-sale-distribution',
    name: 'Market Sale & Distribution',
    description: 'Registration for wholesalers, stockists, and retailers to legally sell and distribute devices.',
    forms: ['md-41']
  },
  {
    id: 'audit-inspection-records',
    name: 'Audit & Inspection Records',
    description: 'Prescribed audit and inspection books maintained at licensed medical-device premises for recording observations and non-conformities identified by auditors or Medical Device Officers.',
    forms: ['md-11']
  },

  {
    id: 'inspection-records-sale-distribution',
    name: 'Sale & Distribution Inspection Records',
    description: 'Prescribed inspection book maintained by registration-certificate holders for recording observations and defects noted by Medical Device Officers at registered sale or distribution premises.',
    forms: ['md-43']
  }
];

function determineSource(fileName) {
  const lower = fileName.toLowerCase();
  
  if (lower.includes('cover') || lower.includes('official') || lower.match(/form_md/)) return 'FORM';
  if (lower.includes('constitution') || lower.includes('agreement') || lower.includes('undertaking') || lower.includes('power_of_attorney')) return 'LEGAL';
  if (lower.includes('qms') || lower.includes('quality') || lower.includes('iso') || lower.includes('sop') || lower.includes('organisation')) return 'QMS';
  if (lower.includes('plant') || lower.includes('site')) return 'PMF';
  if (lower.includes('device_master') || lower.includes('essential_principles') || lower.includes('design') || lower.includes('risk') || lower.includes('ifu') || lower.includes('label') || lower.includes('stability') || lower.includes('performance_evaluation')) return 'DMF';
  if (lower.includes('clinical') || lower.includes('investigator') || lower.includes('ethics') || lower.includes('consent') || lower.includes('case_report')) return 'CLINICAL';
  if (lower.includes('fsc') || lower.includes('noc') || lower.includes('audit')) return 'EXTERNAL';
  
  // Default to DMF if we can't figure it out, as it's the most common technical file
  return 'DMF';
}

function generateFriendlyName(fileName) {
  let name = fileName.replace('.docx', '');
  name = name.replace(/^[0-9]+_/, ''); // remove leading 01_
  name = name.replace(/_/g, ' ');
  name = name.replace(/Template/ig, '').trim();
  return name;
}

const genericTypes = groups.map(g => g.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'FormId');
let out = `import { \n  FormGroup, \n  FormGroupId,\n  ApplicationFormId,\n`;
for (const t of genericTypes) {
  out += `  ${t},\n`;
}
out += `} from '../form-types';\n\n`;

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
  'MD-22': { requiredContexts: ['PRODUCT_SINGLE'], templates: {} },
  'MD-24': { requiredContexts: ['PRODUCT_SINGLE'], templates: {} },

  // 5. New Device Approvals
  'MD-26': { requiredContexts: ['PRODUCT_SINGLE'], templates: {} },
  'MD-28': { requiredContexts: ['PRODUCT_SINGLE'], templates: {} },

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

for (const group of groups) {
  const genericTypeName = group.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'FormId';

  out += `export const ${group.id.toUpperCase().replace(/-/g, '_')}_GROUP: FormGroup<'${group.id}', ${genericTypeName}> = {\n`;
  out += `  id: '${group.id}',\n`;
  out += `  name: '${group.name}',\n`;
  out += `  description: '${group.description}',\n`;
  out += `  forms: [\n`;

  for (const formFolderName of group.forms) {
    const formId = formFolderName.toUpperCase();
    const dirPath = path.join(formatDir, formFolderName);
    
    const config = formConfigs[formId] || { requiredContexts: [], templates: {} };

    let documentsStr = '';
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.docx'));
      for (const file of files) {
        const tplConfig = config.templates[file];
        let docProps = `fileName: '${file}', name: '${generateFriendlyName(file)}', source: '${determineSource(file)}'`;
        
        if (tplConfig) {
          if (tplConfig.conditionRule) docProps += `, conditionRule: "${tplConfig.conditionRule}"`;
          if (tplConfig.badgeLabel) docProps += `, badgeLabel: '${tplConfig.badgeLabel}'`;
        }
        
        documentsStr += `        { ${docProps} },\n`;
      }
    } else {
      console.log(`Warning: Directory not found for ${formFolderName}`);
    }

    out += `    {\n`;
    out += `      id: '${formId}',\n`;
    out += `      name: 'Application Form ${formId}',\n`;
    out += `      description: '${formDescriptions[formId] || 'Regulatory Application Form'}',\n`;
    if (config.requiredContexts && config.requiredContexts.length > 0) {
      out += `      requiredContexts: [${config.requiredContexts.map(c => `'${c}'`).join(', ')}],\n`;
    }
    out += `      documents: [\n${documentsStr}      ]\n`;
    out += `    },\n`;
  }
  out += `  ]\n};\n\n`;
}

out += `export const CDSCO_FORM_GROUPS: FormGroup<FormGroupId, ApplicationFormId>[] = [\n`;
for (const group of groups) {
  out += `  ${group.id.toUpperCase().replace(/-/g, '_')}_GROUP,\n`;
}
out += `];\n\n`;

out += `/**
 * Dynamically determines which application forms (e.g., MD-3, MD-4) require a given generated document.
 * This ensures full traceability between foundational documents (DMF/PMF) and their required application endpoints.
 */
export function getRequiredFormsForSource(frameworkId: string): string[] {
  // Map standard document framework IDs to their underlying logical Source domain
  let source: string | null = null;
  
  if (frameworkId === 'IN_DMF' || frameworkId === 'IN_DMF_MD') source = 'DMF';
  else if (frameworkId === 'IN_PMF') source = 'PMF';
  // Future mappings (e.g., IN_QMS -> 'QMS') can simply be appended here.

  if (!source) return [];

  const requiredIn: string[] = [];
  for (const group of CDSCO_FORM_GROUPS) {
    for (const form of group.forms) {
      if (form.documents.some(d => d.source === source)) {
        requiredIn.push(form.id);
      }
    }
  }
  return requiredIn;
}
`;

const outPath = path.join(__dirname, '..', 'src', 'lib', 'frameworks', 'asia', 'india-forms.ts');
fs.writeFileSync(outPath, out);
console.log('Successfully generated ' + outPath);
