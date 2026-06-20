export const PROJECT_TYPES = [
  { value: 'systematic_review', label: 'Systematic Review / Meta-Analysis' },
  { value: 'case_report',       label: 'Case Report'          },
  { value: 'case_series',       label: 'Case Series'          },
  { value: 'retrospective',     label: 'Retrospective Study'  },
  { value: 'prospective',       label: 'Prospective Study'    },
  { value: 'rct',               label: 'RCT'                  },
  { value: 'technical_note',    label: 'Technical Note'       },
  { value: 'literature_review', label: 'Literature Review'    },
  { value: 'registry',          label: 'Registry Analysis'    },
  { value: 'other',             label: 'Other'                },
]

export const STAGE_TEMPLATES = {
  systematic_review: [
    { key: 'idea',               name: 'Idea & Concept'         },
    { key: 'protocol',           name: 'Protocol & Registration' },
    { key: 'literature_search',  name: 'Literature Search'      },
    { key: 'screening',          name: 'Screening'              },
    { key: 'data_extraction',    name: 'Data Extraction'        },
    { key: 'analysis',           name: 'Analysis'               },
    { key: 'manuscript_writing', name: 'Manuscript Writing'     },
    { key: 'submission',         name: 'Submission'             },
  ],
  case_report: [
    { key: 'case_doc',           name: 'Case Documentation'  },
    { key: 'literature_context', name: 'Literature Context'  },
    { key: 'manuscript_writing', name: 'Manuscript Draft'    },
    { key: 'internal_review',    name: 'Internal Review'     },
    { key: 'submission',         name: 'Submission'          },
  ],
  case_series: [
    { key: 'patient_id',         name: 'Patient Identification' },
    { key: 'data_collection',    name: 'Data Collection'        },
    { key: 'analysis',           name: 'Analysis'               },
    { key: 'manuscript_writing', name: 'Manuscript Writing'     },
    { key: 'submission',         name: 'Submission'             },
  ],
  retrospective: [
    { key: 'protocol',           name: 'IRB & Protocol'     },
    { key: 'data_collection',    name: 'Data Collection'    },
    { key: 'data_cleaning',      name: 'Data Cleaning'      },
    { key: 'analysis',           name: 'Statistical Analysis' },
    { key: 'manuscript_writing', name: 'Manuscript Writing' },
    { key: 'submission',         name: 'Submission'         },
  ],
  prospective: [
    { key: 'protocol',           name: 'IRB & Protocol'     },
    { key: 'recruitment',        name: 'Patient Recruitment' },
    { key: 'data_collection',    name: 'Data Collection'    },
    { key: 'followup',           name: 'Follow-up'          },
    { key: 'analysis',           name: 'Analysis'           },
    { key: 'manuscript_writing', name: 'Manuscript Writing' },
    { key: 'submission',         name: 'Submission'         },
  ],
  rct: [
    { key: 'protocol',           name: 'Protocol & Registration' },
    { key: 'irb',                name: 'IRB Approval'            },
    { key: 'recruitment',        name: 'Recruitment'             },
    { key: 'intervention',       name: 'Intervention'            },
    { key: 'followup',           name: 'Follow-up'               },
    { key: 'analysis',           name: 'Data Analysis'           },
    { key: 'manuscript_writing', name: 'Manuscript Writing'      },
    { key: 'submission',         name: 'Submission'              },
  ],
  technical_note: [
    { key: 'technique_dev',      name: 'Technique Development' },
    { key: 'case_doc',           name: 'Case Documentation'    },
    { key: 'figures',            name: 'Figures & Video'       },
    { key: 'manuscript_writing', name: 'Manuscript Writing'    },
    { key: 'submission',         name: 'Submission'            },
  ],
  literature_review: [
    { key: 'idea',               name: 'Scope Definition'   },
    { key: 'literature_search',  name: 'Literature Search'  },
    { key: 'synthesis',          name: 'Synthesis'          },
    { key: 'manuscript_writing', name: 'Manuscript Writing' },
    { key: 'submission',         name: 'Submission'         },
  ],
  registry: [
    { key: 'protocol',           name: 'IRB & Registry Access' },
    { key: 'data_request',       name: 'Data Request'          },
    { key: 'data_cleaning',      name: 'Data Cleaning'         },
    { key: 'analysis',           name: 'Statistical Analysis'  },
    { key: 'manuscript_writing', name: 'Manuscript Writing'    },
    { key: 'submission',         name: 'Submission'            },
  ],
  other: [
    { key: 'planning',           name: 'Planning'          },
    { key: 'execution',          name: 'Execution'         },
    { key: 'manuscript_writing', name: 'Manuscript Writing' },
    { key: 'submission',         name: 'Submission'        },
  ],
}

export const STAGES = [
  { key: 'idea',               name: 'Idea',               order: 0, color: '#8b5cf6', bg: '#ede9fe', text: '#6d28d9' },
  { key: 'protocol',           name: 'Protocol',           order: 1, color: '#3b82f6', bg: '#dbeafe', text: '#1d4ed8' },
  { key: 'literature_search',  name: 'Literature Search',  order: 2, color: '#06b6d4', bg: '#cffafe', text: '#0e7490' },
  { key: 'screening',          name: 'Screening',          order: 3, color: '#14b8a6', bg: '#ccfbf1', text: '#0f766e' },
  { key: 'data_extraction',    name: 'Data Extraction',    order: 4, color: '#10b981', bg: '#d1fae5', text: '#047857' },
  { key: 'analysis',           name: 'Analysis',           order: 5, color: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  { key: 'manuscript_writing', name: 'Manuscript Writing', order: 6, color: '#f59e0b', bg: '#fef3c7', text: '#b45309' },
  { key: 'submission',         name: 'Submission',         order: 7, color: '#6366f1', bg: '#e0e7ff', text: '#4338ca' },
]

export const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

export const STATUS = {
  not_started: { label: 'Not Started', color: '#94a3b8', bg: '#f1f5f9', text: '#475569', ring: 'ring-slate-200'  },
  in_progress:  { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe', text: '#1d4ed8', ring: 'ring-blue-200'  },
  completed:    { label: 'Completed',   color: '#10b981', bg: '#d1fae5', text: '#047857', ring: 'ring-emerald-200'},
  delayed:      { label: 'Delayed',     color: '#ef4444', bg: '#fee2e2', text: '#b91c1c', ring: 'ring-red-200'   },
}

export const ROLES = {
  admin:            { label: 'Admin',                  color: 'bg-brand-100 text-brand-700'   },
  pi:               { label: 'Principal Investigator', color: 'bg-purple-100 text-purple-700' },
  research_fellow:  { label: 'Research Fellow',        color: 'bg-amber-100 text-amber-700'   },
  student:          { label: 'Student / Resident',     color: 'bg-teal-100 text-teal-700'     },
}

export const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500', 'bg-indigo-500','bg-cyan-500',
]

export const DEFAULT_TASKS = {
  idea: [
    'Define research question (PICO/PICOS framework)',
    'Identify literature gap',
    'Discuss concept with PI',
    'Obtain PI approval to proceed',
  ],
  protocol: [
    'Write full protocol document',
    'Define inclusion and exclusion criteria',
    'Develop search strategy',
    'Register in PROSPERO',
    'Obtain ethics approval (if required)',
  ],
  literature_search: [
    'Search PubMed/MEDLINE',
    'Search Embase',
    'Search Cochrane Library',
    'Search additional databases (Web of Science, CINAHL)',
    'Export results to citation manager',
    'Remove duplicates',
  ],
  screening: [
    'Title & abstract screening — Reviewer 1',
    'Title & abstract screening — Reviewer 2',
    'Resolve title/abstract disagreements',
    'Full-text review — Reviewer 1',
    'Full-text review — Reviewer 2',
    'Resolve full-text disagreements',
    'Create PRISMA flow diagram',
  ],
  data_extraction: [
    'Design data extraction form',
    'Pilot data extraction on 5 studies',
    'Extract data — Reviewer 1',
    'Extract data — Reviewer 2',
    'Resolve extraction discrepancies',
    'Assess risk of bias (RoB 2 / NOS)',
  ],
  analysis: [
    'Descriptive summary of included studies',
    'Run meta-analysis (if applicable)',
    'Assess heterogeneity (I² / Q-test)',
    'Perform subgroup analyses',
    'Sensitivity analysis',
    'Create forest plots and funnel plots',
    'Assess publication bias',
  ],
  manuscript_writing: [
    'Write Introduction',
    'Write Methods',
    'Write Results',
    'Create Tables & Figures',
    'Write Discussion',
    'Write Conclusion & Abstract',
    'Internal review by PI',
    'Revise based on PI feedback',
  ],
  submission: [
    'Select target journal',
    'Format manuscript per journal guidelines',
    'Write cover letter',
    'Submit manuscript',
    'Respond to reviewer comments (Round 1)',
    'Resubmit revised manuscript',
  ],
  case_doc: [
    'Obtain patient consent for case publication',
    'Document clinical history and presentation',
    'Collect imaging and laboratory data',
    'Document procedure / intervention details',
    'Document outcomes and follow-up',
  ],
  literature_context: [
    'Search for similar cases in literature',
    'Identify what makes this case unique',
    'Draft background section based on literature',
  ],
  internal_review: [
    'Send draft to PI for review',
    'Incorporate PI feedback',
    'Send to co-authors for review',
    'Finalize manuscript',
  ],
  patient_id: [
    'Define inclusion and exclusion criteria',
    'Identify patients from records',
    'Obtain IRB approval',
    'Obtain patient consent (if required)',
  ],
  data_collection: [
    'Design data collection form',
    'Collect patient demographics',
    'Collect clinical variables',
    'Collect outcomes data',
  ],
  data_cleaning: [
    'Check for missing data',
    'Handle outliers',
    'Validate data accuracy',
    'Create clean analysis dataset',
  ],
  recruitment: [
    'Screen eligible patients',
    'Obtain informed consent',
    'Enroll patients',
  ],
  followup: [
    'Schedule follow-up appointments',
    'Collect follow-up data',
    'Monitor for adverse events',
    'Document lost to follow-up',
  ],
  irb: [
    'Prepare IRB application',
    'Submit IRB application',
    'Respond to IRB queries',
    'Obtain IRB approval letter',
  ],
  intervention: [
    'Deliver intervention per protocol',
    'Monitor compliance',
    'Document protocol deviations',
  ],
  technique_dev: [
    'Develop and refine the technique',
    'Document step-by-step procedure',
    'Identify advantages over existing methods',
  ],
  figures: [
    'Prepare intraoperative images / video',
    'Edit video to highlight key steps',
    'Create schematic diagrams',
    'Obtain consent for figure use',
  ],
  synthesis: [
    'Organize literature by themes',
    'Identify key findings and gaps',
    'Draft summary tables',
  ],
  data_request: [
    'Complete data request application',
    'Submit to registry coordinators',
    'Sign data use agreement',
    'Receive and verify dataset',
  ],
  planning: [
    'Define objectives and scope',
    'Assign roles and responsibilities',
    'Set timeline and milestones',
  ],
  execution: [
    'Collect data / information',
    'Analyse findings',
    'Document results',
  ],
}
