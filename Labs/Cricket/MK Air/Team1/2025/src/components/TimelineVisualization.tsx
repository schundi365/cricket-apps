import React from 'react';
import { WorkExperience, Education } from '../types';

interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  description: string[];
  type: 'work' | 'education';
  icon: string;
}

interface TimelineVisualizationProps {
  workExperience: WorkExperience[];
  education: Education[];
  showEducation?: boolean;
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  workExperience,
  education,
  showEducation = true
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getDuration = (startDate: Date, endDate?: Date): string => {
    const end = endDate || new Date();
    const months = (end.getFullYear() - startDate.getFullYear()) * 12 + 
                   (end.getMonth() - startDate.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  const createTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add work experience
    workExperience.forEach((work, index) => {
      items.push({
        id: `work-${index}`,
        title: work.jobTitle,
        subtitle: work.companyName,
        startDate: work.startDate,
        endDate: work.endDate,
        location: work.location,
        description: [...work.responsibilities, ...work.achievements],
        type: 'work',
        icon: '💼'
      });
    });

    // Add education if enabled
    if (showEducation) {
      education.forEach((edu, index) => {
        items.push({
          id: `edu-${index}`,
          title: `${edu.degreeType} in ${edu.fieldOfStudy}`,
          subtitle: edu.institutionName,
          startDate: new Date(edu.graduationDate.getFullYear() - 4, edu.graduationDate.getMonth()),
          endDate: edu.graduationDate,
          location: '',
          description: edu.relevantCoursework || [],
          type: 'education',
          icon: '🎓'
        });
      });
    }

    // Sort by start date (most recent first)
    return items.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  };

  const timelineItems = createTimelineItems();

  return (
    <div className="timeline-visualization">
      <div className="timeline-header">
        <h2>
          <span className="timeline-icon">📈</span>
          Professional Journey
        </h2>
      </div>
      
      <div className="timeline-container">
        <div className="timeline-line"></div>
        
        {timelineItems.map((item, index) => (
          <div key={item.id} className={`timeline-item ${item.type}`}>
            <div className="timeline-marker">
              <div className="marker-icon">{item.icon}</div>
              <div className="marker-pulse"></div>
            </div>
            
            <div className="timeline-content">
              <div className="timeline-card">
                <div className="card-header">
                  <div className="title-section">
                    <h3 className="item-title">{item.title}</h3>
                    <h4 className="item-subtitle">{item.subtitle}</h4>
                  </div>
                  <div className="date-section">
                    <div className="date-range">
                      {formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : 'Present'}
                    </div>
                    <div className="duration">{getDuration(item.startDate, item.endDate)}</div>
                    {item.location && <div className="location">📍 {item.location}</div>}
                  </div>
                </div>
                
                {item.description.length > 0 && (
                  <div className="card-content">
                    <ul className="description-list">
                      {item.description.slice(0, 3).map((desc, i) => (
                        <li key={i} className="description-item">
                          <span className="bullet">▸</span>
                          {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="card-footer">
                  <div className={`type-badge ${item.type}`}>
                    {item.type === 'work' ? 'Experience' : 'Education'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .timeline-visualization {
          padding: 30px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          margin: 20px 0;
          color: white;
        }
        
        .timeline-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .timeline-header h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2em;
          font-weight: 700;
          margin: 0;
        }
        
        .timeline-icon {
          margin-right: 15px;
          font-size: 1.2em;
        }
        
        .timeline-container {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .timeline-line {
          position: absolute;
          left: 30px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #ffffff, rgba(255,255,255,0.3));
          border-radius: 2px;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 40px;
          padding-left: 80px;
        }
        
        .timeline-marker {
          position: absolute;
          left: 0;
          top: 20px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5em;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 2;
          position: relative;
        }
        
        .marker-pulse {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          animation: pulse 2s infinite;
        }
        
        .timeline-content {
          width: 100%;
        }
        
        .timeline-card {
          background: rgba(255,255,255,0.95);
          color: #2c3e50;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .title-section {
          flex: 1;
          min-width: 200px;
        }
        
        .item-title {
          font-size: 1.3em;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 5px 0;
        }
        
        .item-subtitle {
          font-size: 1.1em;
          font-weight: 500;
          color: #3498db;
          margin: 0;
        }
        
        .date-section {
          text-align: right;
          font-size: 0.9em;
        }
        
        .date-range {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 3px;
        }
        
        .duration {
          color: #7f8c8d;
          font-weight: 500;
          margin-bottom: 3px;
        }
        
        .location {
          color: #e74c3c;
          font-weight: 500;
        }
        
        .card-content {
          margin: 15px 0;
        }
        
        .description-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .description-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .bullet {
          color: #3498db;
          font-weight: bold;
          margin-right: 10px;
          margin-top: 2px;
        }
        
        .card-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }
        
        .type-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .type-badge.work {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
        }
        
        .type-badge.education {
          background: linear-gradient(45deg, #f093fb, #f5576c);
          color: white;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .timeline-visualization {
            padding: 20px 15px;
          }
          
          .timeline-item {
            padding-left: 70px;
          }
          
          .timeline-line {
            left: 25px;
          }
          
          .timeline-marker {
            left: -5px;
            width: 50px;
            height: 50px;
          }
          
          .marker-icon {
            width: 40px;
            height: 40px;
            font-size: 1.2em;
          }
          
          .marker-pulse {
            width: 50px;
            height: 50px;
          }
          
          .card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .date-section {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default TimelineVisualization;