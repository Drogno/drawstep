# 🃏 DRAWSTEP - TCG Strategy Hub

> Professional tool suite for Trading Card Game players

## 🎯 About

DRAWSTEP is a collection of professional tools designed to help TCG players improve their gameplay:

- **🃏 Lorcana Mulligan Trainer**: Perfect your starting hand decisions
- **📊 Tournament Tracker**: Track your competitive results *(Coming Soon)*
- **📈 Meta Tracker**: Analyze the competitive landscape *(Coming Soon)*

## 🏗️ Project Structure

```
drawstep/
├── index.html                     # Main landing page
├── assets/                        # Shared assets
│   ├── css/main.css              # Main page styles
│   ├── js/main.js                # Main page functionality
│   └── images/logos/             # Brand assets
├── tools/                        # Individual tools
│   └── lorcana-mulligan/         # Lorcana Mulligan Trainer
│       ├── index.html
│       ├── assets/
│       │   ├── css/mulligan.css
│       │   ├── js/mulligan.js
│       │   └── images/cards/     # ~2000 Lorcana card images
│       └── data/
│           ├── cards.json
│           ├── meta-decks.json
│           └── cardImageMap.js
├── docs/                         # Documentation
└── config/                       # Server configuration
```

## 🚀 Features

### Lorcana Mulligan Trainer
- **Deck Import**: Paste your decklist and start training
- **Meta Decks**: Practice with popular tournament decks
- **Mulligan Simulation**: Real-time hand evaluation
- **Statistics**: Track your training progress
- **Export**: Download your training history

### Technical Features
- **Responsive Design**: Works on desktop and mobile
- **Fast Loading**: Lazy-loaded card images
- **Offline Capable**: Works without internet connection
- **SEO Optimized**: Clean URLs and meta tags

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+  
- ✅ Safari 14+
- ✅ Edge 90+

## 🛠️ Development

### Local Development
1. Clone/download the project
2. Open `index.html` in your browser
3. For card images: Add to `/tools/lorcana-mulligan/assets/images/cards/`

### Adding New Tools
1. Create new folder in `/tools/your-tool-name/`
2. Follow the existing structure pattern
3. Update main navigation in `index.html`

## 📊 Performance

- **Main Page**: ~2MB (HTML + CSS + JS)
- **Card Images**: ~100MB total (~2000 cards)
- **Loading Strategy**: Lazy-loading, browser caching
- **Mobile Optimized**: Responsive images and layouts

## 🔧 Configuration

### Server Requirements
- Apache/Nginx with URL rewriting
- PHP 7.4+ *(for future API features)*
- ~200MB disk space

### Recommended Apache Modules
- `mod_rewrite` (clean URLs)
- `mod_deflate` (compression)
- `mod_expires` (caching)

## 📈 Analytics & SEO

- **Clean URLs**: `/tools/lorcana-mulligan/` instead of `/mulli.html`
- **Meta Tags**: Optimized for search engines
- **Sitemap**: Auto-generated for better indexing
- **robots.txt**: Configured for optimal crawling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and personal use. Lorcana card images are property of Ravensburger/Disney.

## 🆘 Support

- 🐛 **Bug Reports**: Use GitHub Issues
- 💬 **Feature Requests**: Use GitHub Discussions
- 💝 **Support the Project**: Ko-fi, Patreon, PayPal links in app

---

**Built with ❤️ for the TCG community**