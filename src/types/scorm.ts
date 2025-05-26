
export interface SCORMManifest {
  identifier: string;
  version: string;
  title: string;
  description?: string;
  organizations: Organization[];
  resources: Resource[];
}

export interface Organization {
  identifier: string;
  title: string;
  items: Item[];
}

export interface Item {
  identifier: string;
  title: string;
  identifierref?: string;
  href?: string;
  children?: Item[];
}

export interface Resource {
  identifier: string;
  type: string;
  href: string;
  files: string[];
}

export interface SCORMPackage {
  manifest: SCORMManifest;
  files: Map<string, File>;
  baseUrl: string;
}

export interface SCORMData {
  'cmi.core.lesson_location': string;
  'cmi.core.lesson_status': 'passed' | 'completed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted';
  'cmi.core.score.raw': string;
  'cmi.core.score.min': string;
  'cmi.core.score.max': string;
  'cmi.core.total_time': string;
  'cmi.core.exit': 'time-out' | 'suspend' | 'logout' | '';
  'cmi.core.entry': 'ab-initio' | 'resume' | '';
  'cmi.core.student_id': string;
  'cmi.core.student_name': string;
  'cmi.suspend_data': string;
}
