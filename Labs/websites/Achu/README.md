# Alliance Soft Tech Website

Professional fintech website for Alliance Soft Tech - Enterprise API Infrastructure for Banking, Payments & Lending.

## 🚀 Live Site
Visit: [alliancesoft.web.app](https://alliancesoft.web.app)

## 📋 Project Structure
```
alliance-soft-tech-deploy/
├── public/
│   └── index.html          # Main website file
├── firebase.json           # Firebase hosting configuration
├── .firebaserc            # Firebase project settings
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🛠️ Technologies Used
- HTML5
- CSS3 (Custom animations & responsive design)
- JavaScript (Vanilla JS)
- Firebase Hosting

## 🎨 Features
- Fully responsive design
- Smooth animations and transitions
- Modern fintech-focused UI/UX
- SEO optimized
- Fast loading times
- Cross-browser compatible

## 📦 Deployment Instructions

### Prerequisites
1. Node.js and npm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Firebase account
4. Git installed

### Initial Setup

1. **Login to Firebase**
```bash
firebase login
```

2. **Initialize Firebase (if not already done)**
```bash
firebase init hosting
```
- Select your Firebase project or create a new one named "alliancesoft"
- Set public directory as: `public`
- Configure as single-page app: `Yes`
- Don't overwrite index.html: `No`

### Deploy to Firebase

```bash
# Deploy to Firebase Hosting
firebase deploy
```

Your site will be live at: `https://alliancesoft.web.app`

### Quick Deploy Script
```bash
# One-command deployment
firebase deploy --only hosting
```

## 🔄 Update & Redeploy

When you make changes to the website:

1. Edit `public/index.html`
2. Test locally:
```bash
firebase serve
```
3. Deploy updates:
```bash
firebase deploy
```

## 📝 Git Workflow

### Push to GitHub Repository

```bash
# Initialize git (if not already initialized)
git init

# Add remote repository
git remote add origin https://github.com/schundi365/Ecommerce.git

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Alliance Soft Tech website"

# Push to main branch
git push -u origin main
```

### Update and Push Changes
```bash
# After making changes
git add .
git commit -m "Update: [describe your changes]"
git push
```

## 🌐 Custom Domain Setup (Optional)

To use a custom domain:

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. Update DNS records at your domain registrar

## 🔧 Local Development

To test the website locally:

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Serve locally
firebase serve

# Or use a simple HTTP server
npx http-server public
```

Visit `http://localhost:5000` in your browser.

## 📊 Website Sections

1. **Hero Section** - Compelling introduction with key statistics
2. **Services** - Payment Solutions, Lending Platform, Core Banking
3. **Features** - Key differentiators and platform capabilities
4. **Trust Metrics** - Company achievements and reach
5. **CTA Section** - Lead generation form
6. **Footer** - Navigation and company information

## 🎯 SEO Optimization

The website includes:
- Semantic HTML structure
- Meta tags for search engines
- Fast loading times
- Mobile-responsive design
- Clean, crawlable code

## 📱 Responsive Breakpoints

- Desktop: 1024px and above
- Tablet: 768px - 1024px
- Mobile: Below 768px

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Copyright © 2026 Alliance Soft Tech. All rights reserved.

## 📞 Contact

For questions or support, please contact the Alliance Soft Tech team.

---

**Built with ❤️ for Alliance Soft Tech**
