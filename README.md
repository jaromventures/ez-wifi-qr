# EZ-WI-FI - Instant Wi-Fi Sharing via QR Codes

A production-ready Progressive Web App for generating Wi-Fi QR codes that let guests connect instantly by scanning. Built with privacy-first, client-side architecture – no server storage of credentials.

## 🚀 Features

### Free Features
- **Instant QR Generation**: Create scannable Wi-Fi QR codes in seconds
- **Manual Network Entry**: Input SSID, password, encryption type (WPA/WEP/Open)
- **Hidden Network Support**: Checkbox for non-broadcast SSIDs
- **Download & Print**: Save as PNG or generate printable PDF
- **Copy Wi-Fi String**: Backup option to copy raw Wi-Fi config
- **Privacy First**: 100% client-side, no data stored anywhere
- **Offline Capable**: Full PWA support with service worker caching
- **Mobile Optimized**: Touch-friendly UI, works on iOS/Android

### Premium Features (Coming Soon)
- 🎨 Custom QR designs (colors, logos, shapes)
- 📊 Scan analytics with location tracking
- 📦 Bulk generation from CSV
- ⏰ Temporary guest codes with expiration
- 🎯 Ad-free experience
- 📋 Professional print templates

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui
- **QR Generation**: qrcode.js
- **PDF Export**: jsPDF
- **PWA**: vite-plugin-pwa with Workbox
- **TypeScript**: Full type safety

## 📱 Progressive Web App

EZ-WI-FI is installable on any device:
- Works offline once installed
- Native app-like experience
- Home screen icon
- Fast loading with service worker caching

## 🎨 Design System

Clean, modern blue/white theme with:
- HSL color tokens for easy theming
- Gradient hero sections
- Soft shadows and smooth animations
- Touch-optimized buttons (48px minimum)
- Fully responsive layout

## 🔒 Security & Privacy

- **Client-side only**: All QR generation happens in your browser
- **No server communication**: Wi-Fi credentials never leave your device
- **HTTPS enforced**: Secure by default
- **No tracking**: Privacy-first approach

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd ez-wi-fi

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Building for Production

```sh
npm run build
```

This generates:
- Optimized production build in `dist/`
- Service worker for offline support
- PWA manifest with app icons

## 📦 Deployment

### Quick Deploy Options

**Vercel** (Recommended):
1. Connect your GitHub repository
2. Deploy with zero configuration
3. Automatic HTTPS and CDN

**Netlify**:
1. Connect repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Manual Deploy
Upload the `dist/` folder contents to any static hosting service.

## 🔧 Configuration

### PWA Customization
Edit `vite.config.ts` to customize:
- App name and description
- Theme colors
- Icons and splash screens
- Caching strategies

### Design System
Modify `src/index.css` and `tailwind.config.ts` to customize:
- Brand colors (HSL values)
- Typography
- Spacing and shadows
- Animations

## 📝 Usage

1. **Enter Network Details**: Input your Wi-Fi SSID and password
2. **Select Security Type**: Choose WPA/WPA2, WEP, or Open
3. **Generate QR Code**: Click to create instant QR
4. **Share**: Download PNG, print PDF, or display on screen
5. **Guests Scan**: Any camera app can scan and connect

## 🌟 Premium Upgrade

Coming soon! Unlock Pro features:
- Custom QR designs
- Scan analytics
- Bulk generation
- Temporary codes
- Premium templates

**Pricing**: $2.99 one-time or $1.99/month

## 🐛 Troubleshooting

### QR Code Won't Scan
- Ensure sufficient contrast (avoid dark backgrounds)
- Make sure QR is large enough (300x300px minimum)
- Try reducing password complexity if QR is too dense

### App Won't Install
- Requires HTTPS (works on localhost for testing)
- Check browser supports PWA installation
- May need to "Add to Home Screen" manually on iOS

## 🤝 Contributing

This is a Lovable-generated project. To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Free for personal use. Commercial licensing coming with Pro tier.

## 🔗 Links

- [Lovable Project](https://lovable.dev/projects/ab28421b-2466-48ae-b0db-89fbcaf3b6cf)
- [Live Demo](https://ez-wi-fi.lovable.app)
- [Issue Tracker](https://github.com/yourusername/ez-wi-fi/issues)

## 💡 Tips

- **For Cafes/Hotels**: Print QR codes and place near entrances
- **For Events**: Display on tablets/screens for easy scanning
- **For Home**: Save to phone for quick guest access
- **For Office**: Generate department-specific QRs

---

Built with ❤️ using [Lovable](https://lovable.dev)
