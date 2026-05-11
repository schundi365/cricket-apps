import React from 'react';
import { SkillCategory, Skill } from '../types';

interface SkillVisualizationProps {
  skillCategories: SkillCategory[];
  visualStyle?: 'bars' | 'circles' | 'radar';
}

const SkillVisualization: React.FC<SkillVisualizationProps> = ({ 
  skillCategories, 
  visualStyle = 'bars' 
}) => {
  const getProficiencyValue = (level: string): number => {
    const levels = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
    return levels[level as keyof typeof levels] || 0;
  };

  const getProficiencyColor = (level: string): string => {
    const colors = {
      'Beginner': '#ff6b6b',
      'Intermediate': '#ffd93d', 
      'Advanced': '#6bcf7f',
      'Expert': '#4ecdc4'
    };
    return colors[level as keyof typeof colors] || '#ddd';
  };

  const renderProgressBar = (skill: Skill) => {
    const value = getProficiencyValue(skill.proficiencyLevel);
    const color = getProficiencyColor(skill.proficiencyLevel);
    
    return (
      <div key={skill.name} className="skill-item">
        <div className="skill-header">
          <span className="skill-name">{skill.name}</span>
          <span className="skill-level">{skill.proficiencyLevel}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${value}%`, 
              backgroundColor: color,
              transition: 'width 0.8s ease-in-out'
            }}
          />
        </div>
      </div>
    );
  };

  const renderCircularProgress = (skill: Skill) => {
    const value = getProficiencyValue(skill.proficiencyLevel);
    const color = getProficiencyColor(skill.proficiencyLevel);
    const circumference = 2 * Math.PI * 40;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div key={skill.name} className="skill-circle">
        <svg width="100" height="100" className="circular-progress">
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke="#e6e6e6" strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
          <text x="50" y="55" textAnchor="middle" className="skill-percentage">
            {value}%
          </text>
        </svg>
        <div className="skill-label">{skill.name}</div>
      </div>
    );
  };

  return (
    <div className="skills-visualization">
      {skillCategories.map((category) => (
        <div key={category.categoryName} className="skill-category">
          <h3 className="category-title">
            <span className="category-icon">🔧</span>
            {category.categoryName}
          </h3>
          <div className={`skills-grid ${visualStyle}`}>
            {category.skills.map((skill) => 
              visualStyle === 'circles' 
                ? renderCircularProgress(skill)
                : renderProgressBar(skill)
            )}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .skills-visualization {
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          margin: 20px 0;
        }
        
        .skill-category {
          margin-bottom: 30px;
        }
        
        .category-title {
          display: flex;
          align-items: center;
          font-size: 1.4em;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 15px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 8px;
        }
        
        .category-icon {
          margin-right: 10px;
          font-size: 1.2em;
        }
        
        .skills-grid.bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .skills-grid.circles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
          justify-items: center;
        }
        
        .skill-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .skill-name {
          font-weight: 500;
          color: #2c3e50;
        }
        
        .skill-level {
          font-size: 0.85em;
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .progress-bar {
          height: 8px;
          background-color: #ecf0f1;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
        }
        
        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }
        
        .skill-circle {
          text-align: center;
          background: white;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .circular-progress {
          margin-bottom: 8px;
        }
        
        .skill-percentage {
          font-size: 14px;
          font-weight: 600;
          fill: #2c3e50;
        }
        
        .skill-label {
          font-size: 0.9em;
          font-weight: 500;
          color: #2c3e50;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @media (max-width: 768px) {
          .skills-grid.circles {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default SkillVisualization;