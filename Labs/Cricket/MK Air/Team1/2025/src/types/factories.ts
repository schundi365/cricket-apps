// Factory functions for creating data model instances
// Requirements: 1.1, 4.1, 5.1, 6.1

import {
  DataScientistProfile,
  PersonalInfo,
  WorkExperience,
  Education,
  Project,
  Certification,
  SkillCategory,
  Skill,
  TemplateSettings,
  DEFAULT_PROFILE,
} from './index';

// Factory function for creating a new PersonalInfo instance
export function createPersonalInfo(overrides: Partial<PersonalInfo> = {}): PersonalInfo {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: undefined,
    githubUrl: undefined,
    websiteUrl: undefined,
    ...overrides,
  };
}

// Factory function for creating a new Skill instance
export function createSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    name: '',
    proficiencyLevel: 'Intermediate',
    ...overrides,
  };
}

// Factory function for creating a new SkillCategory instance
export function createSkillCategory(overrides: Partial<SkillCategory> = {}): SkillCategory {
  return {
    categoryName: '',
    skills: [],
    ...overrides,
  };
}

// Factory function for creating predefined skill categories for data science
export function createDataScienceSkillCategories(): SkillCategory[] {
  return [
    {
      categoryName: 'Programming Languages',
      skills: [
        createSkill({ name: 'Python', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'R', proficiencyLevel: 'Intermediate' }),
        createSkill({ name: 'SQL', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'JavaScript', proficiencyLevel: 'Intermediate' }),
      ],
    },
    {
      categoryName: 'Machine Learning',
      skills: [
        createSkill({ name: 'Scikit-learn', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'TensorFlow', proficiencyLevel: 'Intermediate' }),
        createSkill({ name: 'PyTorch', proficiencyLevel: 'Intermediate' }),
        createSkill({ name: 'XGBoost', proficiencyLevel: 'Advanced' }),
      ],
    },
    {
      categoryName: 'Data Analysis Tools',
      skills: [
        createSkill({ name: 'Pandas', proficiencyLevel: 'Expert' }),
        createSkill({ name: 'NumPy', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'Matplotlib', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'Seaborn', proficiencyLevel: 'Advanced' }),
      ],
    },
    {
      categoryName: 'Databases',
      skills: [
        createSkill({ name: 'PostgreSQL', proficiencyLevel: 'Advanced' }),
        createSkill({ name: 'MongoDB', proficiencyLevel: 'Intermediate' }),
        createSkill({ name: 'Redis', proficiencyLevel: 'Intermediate' }),
      ],
    },
  ];
}

// Factory function for creating a new WorkExperience instance
export function createWorkExperience(overrides: Partial<WorkExperience> = {}): WorkExperience {
  return {
    companyName: '',
    jobTitle: '',
    startDate: new Date(),
    endDate: undefined,
    location: '',
    responsibilities: [],
    achievements: [],
    ...overrides,
  };
}

// Factory function for creating a new Education instance
export function createEducation(overrides: Partial<Education> = {}): Education {
  return {
    institutionName: '',
    degreeType: '',
    fieldOfStudy: '',
    graduationDate: new Date(),
    gpa: undefined,
    relevantCoursework: [],
    ...overrides,
  };
}

// Factory function for creating a new Project instance
export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    name: '',
    description: '',
    technologiesUsed: [],
    outcomes: [],
    duration: undefined,
    teamSize: undefined,
    repositoryUrl: undefined,
    demoUrl: undefined,
    ...overrides,
  };
}

// Factory function for creating a new Certification instance
export function createCertification(overrides: Partial<Certification> = {}): Certification {
  return {
    name: '',
    issuingOrganization: '',
    issueDate: new Date(),
    expirationDate: undefined,
    credentialUrl: undefined,
    ...overrides,
  };
}

// Factory function for creating a new TemplateSettings instance
export function createTemplateSettings(overrides: Partial<TemplateSettings> = {}): TemplateSettings {
  return {
    templateId: 'modern-1',
    colorScheme: 'blue',
    fontFamily: 'Arial',
    customizations: {},
    ...overrides,
  };
}

// Factory function for creating a new DataScientistProfile instance
export function createDataScientistProfile(overrides: Partial<DataScientistProfile> = {}): DataScientistProfile {
  return {
    ...DEFAULT_PROFILE,
    ...overrides,
  };
}

// Builder class for DataScientistProfile with fluent interface
export class DataScientistProfileBuilder {
  private profile: DataScientistProfile;

  constructor(initialProfile?: Partial<DataScientistProfile>) {
    this.profile = createDataScientistProfile(initialProfile);
  }

  // Personal information methods
  withPersonalInfo(personalInfo: Partial<PersonalInfo>): DataScientistProfileBuilder {
    this.profile.personalInfo = { ...this.profile.personalInfo, ...personalInfo };
    return this;
  }

  withFullName(fullName: string): DataScientistProfileBuilder {
    this.profile.personalInfo.fullName = fullName;
    return this;
  }

  withEmail(email: string): DataScientistProfileBuilder {
    this.profile.personalInfo.email = email;
    return this;
  }

  withPhone(phone: string): DataScientistProfileBuilder {
    this.profile.personalInfo.phone = phone;
    return this;
  }

  withLocation(location: string): DataScientistProfileBuilder {
    this.profile.personalInfo.location = location;
    return this;
  }

  withLinkedIn(linkedinUrl: string): DataScientistProfileBuilder {
    this.profile.personalInfo.linkedinUrl = linkedinUrl;
    return this;
  }

  withGitHub(githubUrl: string): DataScientistProfileBuilder {
    this.profile.personalInfo.githubUrl = githubUrl;
    return this;
  }

  withWebsite(websiteUrl: string): DataScientistProfileBuilder {
    this.profile.personalInfo.websiteUrl = websiteUrl;
    return this;
  }

  // Professional summary
  withProfessionalSummary(summary: string): DataScientistProfileBuilder {
    this.profile.professionalSummary = summary;
    return this;
  }

  // Technical skills methods
  withSkillCategories(skillCategories: SkillCategory[]): DataScientistProfileBuilder {
    this.profile.technicalSkills = skillCategories;
    return this;
  }

  addSkillCategory(skillCategory: SkillCategory): DataScientistProfileBuilder {
    this.profile.technicalSkills.push(skillCategory);
    return this;
  }

  withDataScienceSkills(): DataScientistProfileBuilder {
    this.profile.technicalSkills = createDataScienceSkillCategories();
    return this;
  }

  // Work experience methods
  withWorkExperience(workExperience: WorkExperience[]): DataScientistProfileBuilder {
    this.profile.workExperience = workExperience;
    return this;
  }

  addWorkExperience(experience: WorkExperience): DataScientistProfileBuilder {
    this.profile.workExperience.push(experience);
    return this;
  }

  // Education methods
  withEducation(education: Education[]): DataScientistProfileBuilder {
    this.profile.education = education;
    return this;
  }

  addEducation(education: Education): DataScientistProfileBuilder {
    this.profile.education.push(education);
    return this;
  }

  // Certification methods
  withCertifications(certifications: Certification[]): DataScientistProfileBuilder {
    this.profile.certifications = certifications;
    return this;
  }

  addCertification(certification: Certification): DataScientistProfileBuilder {
    this.profile.certifications.push(certification);
    return this;
  }

  // Project methods
  withProjects(projects: Project[]): DataScientistProfileBuilder {
    this.profile.projects = projects;
    return this;
  }

  addProject(project: Project): DataScientistProfileBuilder {
    this.profile.projects.push(project);
    return this;
  }

  // Template settings
  withTemplateSettings(templateSettings: TemplateSettings): DataScientistProfileBuilder {
    this.profile.templateSettings = templateSettings;
    return this;
  }

  withTemplate(templateId: string): DataScientistProfileBuilder {
    this.profile.templateSettings.templateId = templateId;
    return this;
  }

  withColorScheme(colorScheme: string): DataScientistProfileBuilder {
    this.profile.templateSettings.colorScheme = colorScheme;
    return this;
  }

  withFontFamily(fontFamily: string): DataScientistProfileBuilder {
    this.profile.templateSettings.fontFamily = fontFamily;
    return this;
  }

  // Build method
  build(): DataScientistProfile {
    return { ...this.profile };
  }

  // Clone method for creating variations
  clone(): DataScientistProfileBuilder {
    return new DataScientistProfileBuilder(this.profile);
  }
}

// Utility functions for common data science profile patterns
export function createSampleDataScientistProfile(): DataScientistProfile {
  return new DataScientistProfileBuilder()
    .withFullName('Dr. Jane Smith')
    .withEmail('jane.smith@email.com')
    .withPhone('+1-555-0123')
    .withLocation('San Francisco, CA')
    .withLinkedIn('https://linkedin.com/in/janesmith')
    .withGitHub('https://github.com/janesmith')
    .withProfessionalSummary(
      'Experienced Data Scientist with 5+ years of expertise in machine learning, statistical analysis, and data visualization. ' +
      'Proven track record of delivering actionable insights that drive business growth and optimize operations.'
    )
    .withDataScienceSkills()
    .addWorkExperience(createWorkExperience({
      companyName: 'Tech Innovations Inc.',
      jobTitle: 'Senior Data Scientist',
      startDate: new Date('2022-01-01'),
      location: 'San Francisco, CA',
      responsibilities: [
        'Lead machine learning projects for customer segmentation and churn prediction',
        'Collaborate with cross-functional teams to implement data-driven solutions',
        'Mentor junior data scientists and establish best practices',
      ],
      achievements: [
        'Improved customer retention by 25% through predictive modeling',
        'Reduced model training time by 40% through optimization techniques',
        'Led a team of 4 data scientists on high-impact projects',
      ],
    }))
    .addEducation(createEducation({
      institutionName: 'Stanford University',
      degreeType: 'Ph.D.',
      fieldOfStudy: 'Computer Science - Machine Learning',
      graduationDate: new Date('2019-06-01'),
      gpa: 3.9,
      relevantCoursework: ['Advanced Machine Learning', 'Statistical Learning Theory', 'Deep Learning'],
    }))
    .addProject(createProject({
      name: 'Customer Churn Prediction System',
      description: 'Built an end-to-end machine learning pipeline to predict customer churn with 92% accuracy',
      technologiesUsed: ['Python', 'Scikit-learn', 'PostgreSQL', 'Docker', 'AWS'],
      outcomes: [
        'Achieved 92% prediction accuracy',
        'Reduced customer churn by 18%',
        'Automated monthly reporting process',
      ],
      duration: '6 months',
      teamSize: 3,
      repositoryUrl: 'https://github.com/janesmith/churn-prediction',
    }))
    .build();
}

// Helper function to create an empty profile with proper structure
export function createEmptyProfile(): DataScientistProfile {
  return new DataScientistProfileBuilder()
    .withSkillCategories([
      createSkillCategory({ categoryName: 'Programming Languages', skills: [] }),
      createSkillCategory({ categoryName: 'Machine Learning', skills: [] }),
      createSkillCategory({ categoryName: 'Data Analysis Tools', skills: [] }),
      createSkillCategory({ categoryName: 'Databases', skills: [] }),
    ])
    .build();
}