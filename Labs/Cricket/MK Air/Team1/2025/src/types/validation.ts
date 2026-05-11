// Validation functions for data integrity
// Requirements: 1.1, 4.1, 5.1, 6.1

import { 
  DataScientistProfile, 
  PersonalInfo, 
  WorkExperience, 
  Education, 
  Project, 
  Certification,
  SkillCategory,
  ValidationResult,
  ValidationError 
} from './index';

// Validation error codes
export const ValidationErrorCodes = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_URL: 'INVALID_URL',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_GPA: 'INVALID_GPA',
  INVALID_TEAM_SIZE: 'INVALID_TEAM_SIZE',
  INVALID_PROFICIENCY: 'INVALID_PROFICIENCY',
  EMPTY_ARRAY: 'EMPTY_ARRAY',
  INVALID_LENGTH: 'INVALID_LENGTH',
} as const;

// Helper function to create validation errors
function createValidationError(field: string, message: string, code: string): ValidationError {
  return { field, message, code };
}

// Helper function to combine validation results
function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

// Email validation using RFC 5322 standards (simplified)
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email || email.trim() === '') {
    errors.push(createValidationError('email', 'Email is required', ValidationErrorCodes.REQUIRED_FIELD));
  } else {
    // RFC 5322 compliant email regex (simplified version)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email.trim())) {
      errors.push(createValidationError('email', 'Please enter a valid email address', ValidationErrorCodes.INVALID_EMAIL));
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// URL validation for optional fields
export function validateUrl(url: string, fieldName: string, isRequired: boolean = false): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!url || url.trim() === '') {
    if (isRequired) {
      errors.push(createValidationError(fieldName, `${fieldName} is required`, ValidationErrorCodes.REQUIRED_FIELD));
    }
    // Empty URLs are valid for optional fields
    return { isValid: errors.length === 0, errors };
  }
  
  try {
    const urlObj = new URL(url.trim());
    // Ensure it's HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push(createValidationError(fieldName, 'URL must use HTTP or HTTPS protocol', ValidationErrorCodes.INVALID_URL));
    }
  } catch {
    errors.push(createValidationError(fieldName, 'Please enter a valid URL', ValidationErrorCodes.INVALID_URL));
  }
  
  return { isValid: errors.length === 0, errors };
}

// Date validation
export function validateDate(date: Date | string, fieldName: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    errors.push(createValidationError(fieldName, 'Please enter a valid date', ValidationErrorCodes.INVALID_DATE));
  }
  
  return { isValid: errors.length === 0, errors };
}

// Date range validation (start date should be before end date)
export function validateDateRange(startDate: Date, endDate?: Date, fieldPrefix: string = ''): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate individual dates first
  const startValidation = validateDate(startDate, `${fieldPrefix}startDate`);
  const endValidation = endDate ? validateDate(endDate, `${fieldPrefix}endDate`) : { isValid: true, errors: [] };
  
  errors.push(...startValidation.errors, ...endValidation.errors);
  
  // If both dates are valid, check the range
  if (startValidation.isValid && endValidation.isValid && endDate) {
    if (startDate >= endDate) {
      errors.push(createValidationError(
        `${fieldPrefix}dateRange`, 
        'Start date must be before end date', 
        ValidationErrorCodes.INVALID_DATE_RANGE
      ));
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Personal information validation
export function validatePersonalInfo(personalInfo: PersonalInfo): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!personalInfo.fullName || personalInfo.fullName.trim() === '') {
    errors.push(createValidationError('fullName', 'Full name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!personalInfo.phone || personalInfo.phone.trim() === '') {
    errors.push(createValidationError('phone', 'Phone number is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!personalInfo.location || personalInfo.location.trim() === '') {
    errors.push(createValidationError('location', 'Location is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Email validation
  const emailValidation = validateEmail(personalInfo.email);
  errors.push(...emailValidation.errors);
  
  // Optional URL validations
  if (personalInfo.linkedinUrl) {
    const linkedinValidation = validateUrl(personalInfo.linkedinUrl, 'linkedinUrl');
    errors.push(...linkedinValidation.errors);
  }
  
  if (personalInfo.githubUrl) {
    const githubValidation = validateUrl(personalInfo.githubUrl, 'githubUrl');
    errors.push(...githubValidation.errors);
  }
  
  if (personalInfo.websiteUrl) {
    const websiteValidation = validateUrl(personalInfo.websiteUrl, 'websiteUrl');
    errors.push(...websiteValidation.errors);
  }
  
  return { isValid: errors.length === 0, errors };
}

// Work experience validation
export function validateWorkExperience(experience: WorkExperience, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldPrefix = `workExperience[${index}].`;
  
  // Required fields
  if (!experience.companyName || experience.companyName.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}companyName`, 'Company name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!experience.jobTitle || experience.jobTitle.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}jobTitle`, 'Job title is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!experience.location || experience.location.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}location`, 'Location is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Date validation
  const dateValidation = validateDateRange(experience.startDate, experience.endDate, fieldPrefix);
  errors.push(...dateValidation.errors);
  
  // Arrays should not be empty
  if (experience.responsibilities.length === 0) {
    errors.push(createValidationError(`${fieldPrefix}responsibilities`, 'At least one responsibility is required', ValidationErrorCodes.EMPTY_ARRAY));
  }
  
  return { isValid: errors.length === 0, errors };
}

// Education validation
export function validateEducation(education: Education, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldPrefix = `education[${index}].`;
  
  // Required fields
  if (!education.institutionName || education.institutionName.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}institutionName`, 'Institution name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!education.degreeType || education.degreeType.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}degreeType`, 'Degree type is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!education.fieldOfStudy || education.fieldOfStudy.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}fieldOfStudy`, 'Field of study is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Date validation
  const dateValidation = validateDate(education.graduationDate, `${fieldPrefix}graduationDate`);
  errors.push(...dateValidation.errors);
  
  // GPA validation (if provided)
  if (education.gpa !== undefined) {
    if (education.gpa < 0 || education.gpa > 4.0) {
      errors.push(createValidationError(`${fieldPrefix}gpa`, 'GPA must be between 0.0 and 4.0', ValidationErrorCodes.INVALID_GPA));
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Project validation
export function validateProject(project: Project, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldPrefix = `projects[${index}].`;
  
  // Required fields
  if (!project.name || project.name.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}name`, 'Project name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!project.description || project.description.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}description`, 'Project description is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Arrays should not be empty
  if (project.technologiesUsed.length === 0) {
    errors.push(createValidationError(`${fieldPrefix}technologiesUsed`, 'At least one technology is required', ValidationErrorCodes.EMPTY_ARRAY));
  }
  
  if (project.outcomes.length === 0) {
    errors.push(createValidationError(`${fieldPrefix}outcomes`, 'At least one outcome is required', ValidationErrorCodes.EMPTY_ARRAY));
  }
  
  // Team size validation (if provided)
  if (project.teamSize !== undefined) {
    if (project.teamSize < 1 || project.teamSize > 100) {
      errors.push(createValidationError(`${fieldPrefix}teamSize`, 'Team size must be between 1 and 100', ValidationErrorCodes.INVALID_TEAM_SIZE));
    }
  }
  
  // URL validations (if provided)
  if (project.repositoryUrl) {
    const repoValidation = validateUrl(project.repositoryUrl, `${fieldPrefix}repositoryUrl`);
    errors.push(...repoValidation.errors);
  }
  
  if (project.demoUrl) {
    const demoValidation = validateUrl(project.demoUrl, `${fieldPrefix}demoUrl`);
    errors.push(...demoValidation.errors);
  }
  
  return { isValid: errors.length === 0, errors };
}

// Certification validation
export function validateCertification(certification: Certification, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldPrefix = `certifications[${index}].`;
  
  // Required fields
  if (!certification.name || certification.name.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}name`, 'Certification name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  if (!certification.issuingOrganization || certification.issuingOrganization.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}issuingOrganization`, 'Issuing organization is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Date validation
  const issueDateValidation = validateDate(certification.issueDate, `${fieldPrefix}issueDate`);
  errors.push(...issueDateValidation.errors);
  
  // Expiration date validation (if provided)
  if (certification.expirationDate) {
    const expirationValidation = validateDate(certification.expirationDate, `${fieldPrefix}expirationDate`);
    errors.push(...expirationValidation.errors);
    
    // Check that expiration is after issue date
    if (issueDateValidation.isValid && expirationValidation.isValid) {
      if (certification.issueDate >= certification.expirationDate) {
        errors.push(createValidationError(
          `${fieldPrefix}dateRange`, 
          'Expiration date must be after issue date', 
          ValidationErrorCodes.INVALID_DATE_RANGE
        ));
      }
    }
  }
  
  // Credential URL validation (if provided)
  if (certification.credentialUrl) {
    const urlValidation = validateUrl(certification.credentialUrl, `${fieldPrefix}credentialUrl`);
    errors.push(...urlValidation.errors);
  }
  
  return { isValid: errors.length === 0, errors };
}

// Skill category validation
export function validateSkillCategory(skillCategory: SkillCategory, index: number): ValidationResult {
  const errors: ValidationError[] = [];
  const fieldPrefix = `technicalSkills[${index}].`;
  
  // Required fields
  if (!skillCategory.categoryName || skillCategory.categoryName.trim() === '') {
    errors.push(createValidationError(`${fieldPrefix}categoryName`, 'Category name is required', ValidationErrorCodes.REQUIRED_FIELD));
  }
  
  // Skills array should not be empty
  if (skillCategory.skills.length === 0) {
    errors.push(createValidationError(`${fieldPrefix}skills`, 'At least one skill is required in each category', ValidationErrorCodes.EMPTY_ARRAY));
  }
  
  // Validate each skill
  skillCategory.skills.forEach((skill, skillIndex) => {
    if (!skill.name || skill.name.trim() === '') {
      errors.push(createValidationError(
        `${fieldPrefix}skills[${skillIndex}].name`, 
        'Skill name is required', 
        ValidationErrorCodes.REQUIRED_FIELD
      ));
    }
    
    const validProficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!validProficiencyLevels.includes(skill.proficiencyLevel)) {
      errors.push(createValidationError(
        `${fieldPrefix}skills[${skillIndex}].proficiencyLevel`, 
        'Invalid proficiency level', 
        ValidationErrorCodes.INVALID_PROFICIENCY
      ));
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

// Professional summary validation
export function validateProfessionalSummary(summary: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!summary || summary.trim() === '') {
    errors.push(createValidationError('professionalSummary', 'Professional summary is required', ValidationErrorCodes.REQUIRED_FIELD));
  } else {
    const length = summary.trim().length;
    if (length < 50) {
      errors.push(createValidationError('professionalSummary', 'Professional summary should be at least 50 characters', ValidationErrorCodes.INVALID_LENGTH));
    }
    if (length > 500) {
      errors.push(createValidationError('professionalSummary', 'Professional summary should not exceed 500 characters', ValidationErrorCodes.INVALID_LENGTH));
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// Complete profile validation
export function validateDataScientistProfile(profile: DataScientistProfile): ValidationResult {
  const validationResults: ValidationResult[] = [];
  
  // Validate personal information
  validationResults.push(validatePersonalInfo(profile.personalInfo));
  
  // Validate professional summary
  validationResults.push(validateProfessionalSummary(profile.professionalSummary));
  
  // Validate technical skills
  profile.technicalSkills.forEach((skillCategory, index) => {
    validationResults.push(validateSkillCategory(skillCategory, index));
  });
  
  // Validate work experience
  profile.workExperience.forEach((experience, index) => {
    validationResults.push(validateWorkExperience(experience, index));
  });
  
  // Validate education
  profile.education.forEach((education, index) => {
    validationResults.push(validateEducation(education, index));
  });
  
  // Validate certifications
  profile.certifications.forEach((certification, index) => {
    validationResults.push(validateCertification(certification, index));
  });
  
  // Validate projects
  profile.projects.forEach((project, index) => {
    validationResults.push(validateProject(project, index));
  });
  
  return combineValidationResults(...validationResults);
}