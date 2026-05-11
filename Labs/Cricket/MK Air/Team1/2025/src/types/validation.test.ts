import {
  validateEmail,
  validateUrl,
  validateDate,
  validateDateRange,
  validatePersonalInfo,
  validateWorkExperience,
  validateEducation,
  validateProject,
  validateCertification,
  validateSkillCategory,
  validateProfessionalSummary,
  validateDataScientistProfile,
  ValidationErrorCodes,
} from './validation';
import {
  createPersonalInfo,
  createWorkExperience,
  createEducation,
  createProject,
  createCertification,
  createSkillCategory,
  createSkill,
  createDataScientistProfile,
} from './factories';

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    test('accepts valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCodes.INVALID_EMAIL);
      });
    });

    test('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCodes.REQUIRED_FIELD);
    });
  });

  describe('validateUrl', () => {
    test('accepts valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.org',
        'https://github.com/user/repo',
        'https://linkedin.com/in/profile',
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url, 'testUrl');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('rejects invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        'http://',
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url, 'testUrl');
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe(ValidationErrorCodes.INVALID_URL);
      });
    });

    test('accepts empty URLs for optional fields', () => {
      const result = validateUrl('', 'optionalUrl', false);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects empty URLs for required fields', () => {
      const result = validateUrl('', 'requiredUrl', true);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCodes.REQUIRED_FIELD);
    });
  });

  describe('validateDateRange', () => {
    test('accepts valid date ranges', () => {
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2021-01-01');
      
      const result = validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid date ranges', () => {
      const startDate = new Date('2021-01-01');
      const endDate = new Date('2020-01-01');
      
      const result = validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === ValidationErrorCodes.INVALID_DATE_RANGE)).toBe(true);
    });

    test('accepts start date without end date', () => {
      const startDate = new Date('2020-01-01');
      
      const result = validateDateRange(startDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validatePersonalInfo', () => {
    test('accepts valid personal information', () => {
      const personalInfo = createPersonalInfo({
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
      });

      const result = validatePersonalInfo(personalInfo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects missing required fields', () => {
      const personalInfo = createPersonalInfo({
        fullName: '',
        email: 'invalid-email',
        phone: '',
        location: '',
      });

      const result = validatePersonalInfo(personalInfo);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for required field errors
      const requiredFieldErrors = result.errors.filter(e => e.code === ValidationErrorCodes.REQUIRED_FIELD);
      expect(requiredFieldErrors.length).toBe(3); // fullName, phone, location
      
      // Check for email validation error
      const emailErrors = result.errors.filter(e => e.code === ValidationErrorCodes.INVALID_EMAIL);
      expect(emailErrors.length).toBe(1);
    });
  });

  describe('validateWorkExperience', () => {
    test('accepts valid work experience', () => {
      const experience = createWorkExperience({
        companyName: 'Tech Corp',
        jobTitle: 'Data Scientist',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2022-01-01'),
        location: 'San Francisco, CA',
        responsibilities: ['Analyze data', 'Build models'],
        achievements: ['Improved accuracy by 10%'],
      });

      const result = validateWorkExperience(experience, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid work experience', () => {
      const experience = createWorkExperience({
        companyName: '',
        jobTitle: '',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2020-01-01'), // Invalid date range
        location: '',
        responsibilities: [], // Empty array
        achievements: [],
      });

      const result = validateWorkExperience(experience, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateProject', () => {
    test('accepts valid project', () => {
      const project = createProject({
        name: 'ML Pipeline',
        description: 'A machine learning pipeline for data processing',
        technologiesUsed: ['Python', 'TensorFlow'],
        outcomes: ['Improved efficiency by 30%'],
        teamSize: 3,
        repositoryUrl: 'https://github.com/user/ml-pipeline',
      });

      const result = validateProject(project, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid project', () => {
      const project = createProject({
        name: '',
        description: '',
        technologiesUsed: [],
        outcomes: [],
        teamSize: 0, // Invalid team size
      });

      const result = validateProject(project, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateProfessionalSummary', () => {
    test('accepts valid professional summary', () => {
      const summary = 'Experienced data scientist with expertise in machine learning and statistical analysis. Proven track record of delivering insights.';
      
      const result = validateProfessionalSummary(summary);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects too short summary', () => {
      const summary = 'Short summary';
      
      const result = validateProfessionalSummary(summary);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCodes.INVALID_LENGTH);
    });

    test('rejects too long summary', () => {
      const summary = 'A'.repeat(501);
      
      const result = validateProfessionalSummary(summary);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCodes.INVALID_LENGTH);
    });

    test('rejects empty summary', () => {
      const result = validateProfessionalSummary('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCodes.REQUIRED_FIELD);
    });
  });

  describe('validateDataScientistProfile', () => {
    test('accepts valid complete profile', () => {
      const profile = createDataScientistProfile({
        personalInfo: createPersonalInfo({
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
          location: 'San Francisco, CA',
        }),
        professionalSummary: 'Experienced data scientist with expertise in machine learning and statistical analysis. Proven track record of delivering actionable insights.',
        technicalSkills: [
          createSkillCategory({
            categoryName: 'Programming',
            skills: [createSkill({ name: 'Python', proficiencyLevel: 'Advanced' })],
          }),
        ],
        workExperience: [
          createWorkExperience({
            companyName: 'Tech Corp',
            jobTitle: 'Data Scientist',
            startDate: new Date('2020-01-01'),
            location: 'San Francisco, CA',
            responsibilities: ['Analyze data'],
            achievements: ['Improved accuracy'],
          }),
        ],
        education: [
          createEducation({
            institutionName: 'University',
            degreeType: 'Bachelor',
            fieldOfStudy: 'Computer Science',
            graduationDate: new Date('2019-06-01'),
          }),
        ],
        projects: [
          createProject({
            name: 'ML Project',
            description: 'Machine learning project',
            technologiesUsed: ['Python'],
            outcomes: ['Success'],
          }),
        ],
      });

      const result = validateDataScientistProfile(profile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accumulates errors from all sections', () => {
      const profile = createDataScientistProfile({
        personalInfo: createPersonalInfo({
          fullName: '', // Invalid
          email: 'invalid-email', // Invalid
          phone: '',
          location: '',
        }),
        professionalSummary: '', // Invalid
        technicalSkills: [],
        workExperience: [],
        education: [],
        projects: [],
      });

      const result = validateDataScientistProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});