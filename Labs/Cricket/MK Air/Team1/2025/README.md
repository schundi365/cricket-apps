# Data Scientist CV Generator

A professional CV generator specifically tailored for Data Scientist positions, featuring ATS-optimized templates, comprehensive skill organization, and export capabilities to PDF and Word formats.

## Features

- ✨ **Professional Templates**: Multiple templates optimized for data science roles
- 📊 **Technical Skills Organization**: Categorized skill entry with proficiency levels
- 🎯 **ATS-Friendly**: Optimized formatting for Applicant Tracking Systems
- 📄 **Multiple Export Formats**: Export to PDF and Word documents
- 🔍 **Real-time Preview**: Live preview with instant template switching
- 💼 **Project Portfolio**: Showcase your data science projects with links and outcomes
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library + fast-check (property-based testing)
- **PDF Generation**: Puppeteer
- **Word Export**: html-docx-js
- **Styling**: CSS3 with modern features

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd data-scientist-cv-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # React components
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── setupTests.ts       # Test configuration
```

## Development Workflow

This project follows a spec-driven development approach with comprehensive requirements, design documentation, and implementation tasks. See the `.kiro/specs/data-scientist-cv-generator/` directory for:

- `requirements.md` - Detailed requirements with acceptance criteria
- `design.md` - System architecture and design decisions
- `tasks.md` - Implementation task breakdown

## Testing Strategy

The project uses a dual testing approach:

- **Unit Tests**: Component and service-level testing with Jest and React Testing Library
- **Property-Based Tests**: Universal behavior validation with fast-check
- **Integration Tests**: End-to-end workflow testing

Run tests with:
```bash
npm test
```

## Contributing

1. Follow the task-based development workflow outlined in `tasks.md`
2. Ensure all tests pass before submitting changes
3. Maintain TypeScript strict mode compliance
4. Follow the established code style and patterns

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **UI Layer**: React components for user interaction
- **Business Logic**: Services for validation, CV building, and content optimization
- **Data Layer**: Profile and template storage management
- **Export System**: PDF and Word document generation

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please refer to the project documentation in the `.kiro/specs/` directory or create an issue in the repository.