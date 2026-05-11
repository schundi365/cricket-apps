import {
  DataScientistProfile,
  PersonalInfo,
  WorkExperience,
  Education,
  Project,
  Certification,
  SkillCategory,
  CVTemplate,
  DEFAULT_PROFILE,
  PROFICIENCY_LEVELS,
  TEMPLATE_CATEGORIES,
  validateEmail,
  validateDataScientistProfile,
  createPersonalInfo,
  createDataScientistProfile,
  DataScientistProfileBuilder,
} from './index';

describe('Type Definitions', () => {
  test('DEFAULT_PROFILE has correct structure', () => {
    expect(DEFAULT_PROFILE).toHaveProperty('personalInfo');
    expect(DEFAULT_PROFILE).toHaveProperty('professionalSummary');
    expect(DEFAULT_PROFILE).toHaveProperty('technicalSkills');
    expect(DEFAULT_PROFILE).toHaveProperty('workExperience');
    expect(DEFAULT_PROFILE).toHaveProperty('education');
    expect(DEFAULT_PROFILE).toHaveProperty('certifications');
    expect(DEFAULT_PROFILE).toHaveProperty('projects');
    expect(DEFAULT_PROFILE).toHaveProperty('templateSettings');
    
    // Check personal info structure
    expect(DEFAULT_PROFILE.personalInfo).toHaveProperty('fullName');
    expect(DEFAULT_PROFILE.personalInfo).toHaveProperty('email');
    expect(DEFAULT_PROFILE.personalInfo).toHaveProperty('phone');
    expect(DEFAULT_PROFILE.personalInfo).toHaveProperty('location');
    
    // Check template settings
    expect(DEFAULT_PROFILE.templateSettings).toHaveProperty('templateId');
    expect(DEFAULT_PROFILE.templateSettings).toHaveProperty('colorScheme');
    expect(DEFAULT_PROFILE.templateSettings).toHaveProperty('fontFamily');
    expect(DEFAULT_PROFILE.templateSettings).toHaveProperty('customizations');
  });

  test('PROFICIENCY_LEVELS contains expected values', () => {
    expect(PROFICIENCY_LEVELS).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Expert']);
  });

  test('TEMPLATE_CATEGORIES contains expected values', () => {
    expect(TEMPLATE_CATEGORIES).toEqual(['Modern', 'Classic', 'Technical', 'Academic']);
  });

  test('PersonalInfo interface allows required and optional fields', () => {
    const requiredInfo: PersonalInfo = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      location: 'San Francisco, CA',
    };
    
    const fullInfo: PersonalInfo = {
      ...requiredInfo,
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      websiteUrl: 'https://johndoe.dev',
    };
    
    expect(requiredInfo.fullName).toBe('John Doe');
    expect(fullInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe');
  });

  test('WorkExperience interface handles dates correctly', () => {
    const currentJob: WorkExperience = {
      companyName: 'Tech Corp',
      jobTitle: 'Senior Data Scientist',
      startDate: new Date('2022-01-01'),
      location: 'Remote',
      responsibilities: ['Lead ML projects', 'Mentor junior staff'],
      achievements: ['Improved model accuracy by 15%'],
    };
    
    const previousJob: WorkExperience = {
      companyName: 'Data Inc',
      jobTitle: 'Data Scientist',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2021-12-31'),
      location: 'New York, NY',
      responsibilities: ['Built predictive models'],
      achievements: ['Reduced processing time by 30%'],
    };
    
    expect(currentJob.endDate).toBeUndefined();
    expect(previousJob.endDate).toBeInstanceOf(Date);
  });

  test('Project interface supports optional fields', () => {
    const minimalProject: Project = {
      name: 'ML Pipeline',
      description: 'Automated data processing pipeline',
      technologiesUsed: ['Python', 'Apache Airflow'],
      outcomes: ['Reduced manual work by 80%'],
    };
    
    const fullProject: Project = {
      ...minimalProject,
      duration: '6 months',
      teamSize: 3,
      repositoryUrl: 'https://github.com/user/ml-pipeline',
      demoUrl: 'https://demo.example.com',
    };
    
    expect(minimalProject.duration).toBeUndefined();
    expect(fullProject.teamSize).toBe(3);
  });

  test('validation functions are exported', () => {
    expect(typeof validateEmail).toBe('function');
    expect(typeof validateDataScientistProfile).toBe('function');
  });

  test('factory functions are exported', () => {
    expect(typeof createPersonalInfo).toBe('function');
    expect(typeof createDataScientistProfile).toBe('function');
    expect(DataScientistProfileBuilder).toBeDefined();
  });

  test('factory functions work correctly', () => {
    const personalInfo = createPersonalInfo({
      fullName: 'Test User',
      email: 'test@example.com',
    });
    
    expect(personalInfo.fullName).toBe('Test User');
    expect(personalInfo.email).toBe('test@example.com');
    expect(personalInfo.phone).toBe(''); // Default value
  });

  test('profile builder works correctly', () => {
    const profile = new DataScientistProfileBuilder()
      .withFullName('Builder Test')
      .withEmail('builder@example.com')
      .build();
    
    expect(profile.personalInfo.fullName).toBe('Builder Test');
    expect(profile.personalInfo.email).toBe('builder@example.com');
  });
});