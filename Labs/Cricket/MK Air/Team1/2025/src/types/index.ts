// Core data models for the Data Scientist CV Generator
// Based on the design document specifications

export interface DataScientistProfile {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  technicalSkills: SkillCategory[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  templateSettings: TemplateSettings;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
}

export interface SkillCategory {
  categoryName: string;
  skills: Skill[];
}

export interface Skill {
  name: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface WorkExperience {
  companyName: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  responsibilities: string[];
  achievements: string[];
}

export interface Education {
  institutionName: string;
  degreeType: string;
  fieldOfStudy: string;
  graduationDate: Date;
  gpa?: number;
  relevantCoursework?: string[];
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialUrl?: string;
}

export interface Project {
  name: string;
  description: string;
  technologiesUsed: string[];
  outcomes: string[];
  duration?: string;
  teamSize?: number;
  repositoryUrl?: string;
  demoUrl?: string;
}

export interface TemplateSettings {
  templateId: string;
  colorScheme: string;
  fontFamily: string;
  customizations: Record<string, any>;
}

// Template system interfaces
export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Modern' | 'Classic' | 'Technical' | 'Academic';
  htmlTemplate: string;
  cssStyles: string;
  customizationOptions: CustomizationOption[];
  atsOptimized: boolean;
  previewImage: string;
}

export interface CustomizationOption {
  key: string;
  label: string;
  type: 'color' | 'font' | 'spacing' | 'boolean';
  defaultValue: any;
  options?: any[];
}

// Validation and error handling types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Export system types
export interface ExportOptions {
  format: 'pdf' | 'word';
  templateId: string;
  customizations?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  data?: Blob;
  error?: string;
}

// Service interfaces for dependency injection
export interface ValidationService {
  validateEmail(email: string): ValidationResult;
  validateUrl(url: string): ValidationResult;
  validateDateRange(startDate: Date, endDate?: Date): ValidationResult;
  validateProfile(profile: DataScientistProfile): ValidationResult;
}

export interface StorageService {
  saveProfile(profile: DataScientistProfile): Promise<void>;
  loadProfile(): Promise<DataScientistProfile | null>;
  clearProfile(): Promise<void>;
}

export interface TemplateService {
  getAvailableTemplates(): Promise<CVTemplate[]>;
  getTemplate(id: string): Promise<CVTemplate | null>;
  renderTemplate(template: CVTemplate, profile: DataScientistProfile): Promise<string>;
}

export interface ExportService {
  exportToPdf(html: string, options?: ExportOptions): Promise<ExportResult>;
  exportToWord(html: string, options?: ExportOptions): Promise<ExportResult>;
}

// Component prop types
export interface FormComponentProps {
  value: any;
  onChange: (value: any) => void;
  errors?: ValidationError[];
  disabled?: boolean;
}

// Application state types
export interface AppState {
  profile: DataScientistProfile;
  selectedTemplate: string;
  isLoading: boolean;
  errors: ValidationError[];
  previewMode: boolean;
}

// Constants and enums
export const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const TEMPLATE_CATEGORIES = ['Modern', 'Classic', 'Technical', 'Academic'] as const;
export const EXPORT_FORMATS = ['pdf', 'word'] as const;

// Default values for new profile creation
export const DEFAULT_PROFILE: DataScientistProfile = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
  },
  professionalSummary: '',
  technicalSkills: [],
  workExperience: [],
  education: [],
  certifications: [],
  projects: [],
  templateSettings: {
    templateId: 'modern-1',
    colorScheme: 'blue',
    fontFamily: 'Arial',
    customizations: {},
  },
};

// Utility types
export type ProfileSection = keyof Omit<DataScientistProfile, 'templateSettings'>;
export type RequiredPersonalInfo = Required<Pick<PersonalInfo, 'fullName' | 'email' | 'phone' | 'location'>>;
export type OptionalPersonalInfo = Partial<Pick<PersonalInfo, 'linkedinUrl' | 'githubUrl' | 'websiteUrl'>>;

// Re-export validation functions and factories
export * from './validation';
export * from './factories';