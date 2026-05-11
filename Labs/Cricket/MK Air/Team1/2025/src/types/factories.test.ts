import {
  createPersonalInfo,
  createSkill,
  createSkillCategory,
  createDataScienceSkillCategories,
  createWorkExperience,
  createEducation,
  createProject,
  createCertification,
  createTemplateSettings,
  createDataScientistProfile,
  DataScientistProfileBuilder,
  createSampleDataScientistProfile,
  createEmptyProfile,
} from './factories';
import { PersonalInfo, Skill, SkillCategory } from './index';

describe('Factory Functions', () => {
  describe('createPersonalInfo', () => {
    test('creates default personal info', () => {
      const personalInfo = createPersonalInfo();
      
      expect(personalInfo.fullName).toBe('');
      expect(personalInfo.email).toBe('');
      expect(personalInfo.phone).toBe('');
      expect(personalInfo.location).toBe('');
      expect(personalInfo.linkedinUrl).toBeUndefined();
      expect(personalInfo.githubUrl).toBeUndefined();
      expect(personalInfo.websiteUrl).toBeUndefined();
    });

    test('creates personal info with overrides', () => {
      const overrides: Partial<PersonalInfo> = {
        fullName: 'John Doe',
        email: 'john@example.com',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
      };
      
      const personalInfo = createPersonalInfo(overrides);
      
      expect(personalInfo.fullName).toBe('John Doe');
      expect(personalInfo.email).toBe('john@example.com');
      expect(personalInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe');
      expect(personalInfo.phone).toBe(''); // Default value
    });
  });

  describe('createSkill', () => {
    test('creates default skill', () => {
      const skill = createSkill();
      
      expect(skill.name).toBe('');
      expect(skill.proficiencyLevel).toBe('Intermediate');
    });

    test('creates skill with overrides', () => {
      const skill = createSkill({
        name: 'Python',
        proficiencyLevel: 'Advanced',
      });
      
      expect(skill.name).toBe('Python');
      expect(skill.proficiencyLevel).toBe('Advanced');
    });
  });

  describe('createDataScienceSkillCategories', () => {
    test('creates predefined data science skill categories', () => {
      const categories = createDataScienceSkillCategories();
      
      expect(categories).toHaveLength(4);
      expect(categories[0].categoryName).toBe('Programming Languages');
      expect(categories[1].categoryName).toBe('Machine Learning');
      expect(categories[2].categoryName).toBe('Data Analysis Tools');
      expect(categories[3].categoryName).toBe('Databases');
      
      // Check that each category has skills
      categories.forEach(category => {
        expect(category.skills.length).toBeGreaterThan(0);
      });
      
      // Check specific skills
      const programmingSkills = categories[0].skills;
      expect(programmingSkills.some(skill => skill.name === 'Python')).toBe(true);
      expect(programmingSkills.some(skill => skill.name === 'SQL')).toBe(true);
    });
  });

  describe('createWorkExperience', () => {
    test('creates default work experience', () => {
      const experience = createWorkExperience();
      
      expect(experience.companyName).toBe('');
      expect(experience.jobTitle).toBe('');
      expect(experience.startDate).toBeInstanceOf(Date);
      expect(experience.endDate).toBeUndefined();
      expect(experience.location).toBe('');
      expect(experience.responsibilities).toEqual([]);
      expect(experience.achievements).toEqual([]);
    });

    test('creates work experience with overrides', () => {
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2022-01-01');
      
      const experience = createWorkExperience({
        companyName: 'Tech Corp',
        jobTitle: 'Data Scientist',
        startDate,
        endDate,
        responsibilities: ['Analyze data', 'Build models'],
      });
      
      expect(experience.companyName).toBe('Tech Corp');
      expect(experience.jobTitle).toBe('Data Scientist');
      expect(experience.startDate).toBe(startDate);
      expect(experience.endDate).toBe(endDate);
      expect(experience.responsibilities).toEqual(['Analyze data', 'Build models']);
    });
  });

  describe('createProject', () => {
    test('creates default project', () => {
      const project = createProject();
      
      expect(project.name).toBe('');
      expect(project.description).toBe('');
      expect(project.technologiesUsed).toEqual([]);
      expect(project.outcomes).toEqual([]);
      expect(project.duration).toBeUndefined();
      expect(project.teamSize).toBeUndefined();
      expect(project.repositoryUrl).toBeUndefined();
      expect(project.demoUrl).toBeUndefined();
    });

    test('creates project with overrides', () => {
      const project = createProject({
        name: 'ML Pipeline',
        description: 'A machine learning pipeline',
        technologiesUsed: ['Python', 'TensorFlow'],
        outcomes: ['Improved accuracy by 15%'],
        teamSize: 3,
      });
      
      expect(project.name).toBe('ML Pipeline');
      expect(project.description).toBe('A machine learning pipeline');
      expect(project.technologiesUsed).toEqual(['Python', 'TensorFlow']);
      expect(project.outcomes).toEqual(['Improved accuracy by 15%']);
      expect(project.teamSize).toBe(3);
    });
  });
});

describe('DataScientistProfileBuilder', () => {
  test('builds profile with fluent interface', () => {
    const profile = new DataScientistProfileBuilder()
      .withFullName('Jane Doe')
      .withEmail('jane@example.com')
      .withPhone('+1-555-0123')
      .withLocation('New York, NY')
      .withProfessionalSummary('Experienced data scientist with 5+ years of expertise.')
      .addSkillCategory(createSkillCategory({
        categoryName: 'Programming',
        skills: [createSkill({ name: 'Python', proficiencyLevel: 'Expert' })],
      }))
      .addWorkExperience(createWorkExperience({
        companyName: 'Data Corp',
        jobTitle: 'Senior Data Scientist',
      }))
      .withTemplate('modern-2')
      .withColorScheme('green')
      .build();
    
    expect(profile.personalInfo.fullName).toBe('Jane Doe');
    expect(profile.personalInfo.email).toBe('jane@example.com');
    expect(profile.professionalSummary).toBe('Experienced data scientist with 5+ years of expertise.');
    expect(profile.technicalSkills).toHaveLength(1);
    expect(profile.technicalSkills[0].categoryName).toBe('Programming');
    expect(profile.workExperience).toHaveLength(1);
    expect(profile.workExperience[0].companyName).toBe('Data Corp');
    expect(profile.templateSettings.templateId).toBe('modern-2');
    expect(profile.templateSettings.colorScheme).toBe('green');
  });

  test('supports method chaining', () => {
    const builder = new DataScientistProfileBuilder();
    
    const result = builder
      .withFullName('Test User')
      .withEmail('test@example.com')
      .withDataScienceSkills();
    
    expect(result).toBeInstanceOf(DataScientistProfileBuilder);
    
    const profile = result.build();
    expect(profile.personalInfo.fullName).toBe('Test User');
    expect(profile.technicalSkills.length).toBeGreaterThan(0);
  });

  test('clone creates independent copy', () => {
    const originalBuilder = new DataScientistProfileBuilder()
      .withFullName('Original Name')
      .withEmail('original@example.com');
    
    const clonedBuilder = originalBuilder.clone()
      .withFullName('Cloned Name');
    
    const originalProfile = originalBuilder.build();
    const clonedProfile = clonedBuilder.build();
    
    expect(originalProfile.personalInfo.fullName).toBe('Original Name');
    expect(clonedProfile.personalInfo.fullName).toBe('Cloned Name');
    expect(originalProfile.personalInfo.email).toBe('original@example.com');
    expect(clonedProfile.personalInfo.email).toBe('original@example.com');
  });

  test('withDataScienceSkills adds predefined categories', () => {
    const profile = new DataScientistProfileBuilder()
      .withDataScienceSkills()
      .build();
    
    expect(profile.technicalSkills).toHaveLength(4);
    expect(profile.technicalSkills[0].categoryName).toBe('Programming Languages');
    expect(profile.technicalSkills[1].categoryName).toBe('Machine Learning');
    expect(profile.technicalSkills[2].categoryName).toBe('Data Analysis Tools');
    expect(profile.technicalSkills[3].categoryName).toBe('Databases');
  });
});

describe('Utility Functions', () => {
  describe('createSampleDataScientistProfile', () => {
    test('creates complete sample profile', () => {
      const profile = createSampleDataScientistProfile();
      
      expect(profile.personalInfo.fullName).toBe('Dr. Jane Smith');
      expect(profile.personalInfo.email).toBe('jane.smith@email.com');
      expect(profile.professionalSummary.length).toBeGreaterThan(0);
      expect(profile.technicalSkills.length).toBeGreaterThan(0);
      expect(profile.workExperience.length).toBeGreaterThan(0);
      expect(profile.education.length).toBeGreaterThan(0);
      expect(profile.projects.length).toBeGreaterThan(0);
      
      // Check that the sample has realistic data
      expect(profile.workExperience[0].companyName).toBe('Tech Innovations Inc.');
      expect(profile.education[0].institutionName).toBe('Stanford University');
      expect(profile.projects[0].name).toBe('Customer Churn Prediction System');
    });
  });

  describe('createEmptyProfile', () => {
    test('creates empty profile with proper structure', () => {
      const profile = createEmptyProfile();
      
      expect(profile.personalInfo.fullName).toBe('');
      expect(profile.professionalSummary).toBe('');
      expect(profile.workExperience).toEqual([]);
      expect(profile.education).toEqual([]);
      expect(profile.certifications).toEqual([]);
      expect(profile.projects).toEqual([]);
      
      // Should have empty skill categories with proper names
      expect(profile.technicalSkills).toHaveLength(4);
      expect(profile.technicalSkills[0].categoryName).toBe('Programming Languages');
      expect(profile.technicalSkills[0].skills).toEqual([]);
      expect(profile.technicalSkills[1].categoryName).toBe('Machine Learning');
      expect(profile.technicalSkills[1].skills).toEqual([]);
    });
  });
});