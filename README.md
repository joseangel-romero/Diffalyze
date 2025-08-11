# 🚀 Diffalyze

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://diffalyze.app)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red.svg)](https://github.com/yourusername/diffalyze)

> **Professional text comparator for the modern web** 🌟

A lightning-fast, feature-rich diff tool that analyzes text differences, enables intelligent merging, and provides a professional-grade experience entirely in your browser.

## ✨ Features

### 🔍 **Advanced Text Comparison**

- **Myers O(ND) Algorithm** - Industry-standard diff algorithm for optimal results
- **Multi-granularity analysis** - Line, word, and character-level differences
- **Smart move detection** - Identifies relocated code blocks and content
- **Intelligent preprocessing** - Configurable whitespace, case, and blank line handling

### 🎨 **Modern User Experience**

- **Unified & Side-by-Side views** - Choose your preferred diff visualization
- **Real-time syntax highlighting** - Support for 50+ programming languages
- **Dark theme optimized** - Beautiful, eye-friendly interface
- **Responsive design** - Works perfectly on desktop, tablet, and mobile

### ⚡ **Performance Optimized**

- **Web Workers** - Heavy computations run in background threads
- **Lazy loading** - Components load on-demand for faster startup
- **Smart debouncing** - Intelligent input handling prevents lag
- **IndexedDB storage** - Persistent history without server dependency

### 🛠️ **Professional Tools**

- **Interactive merging** - Click to accept changes from either side
- **Undo/Redo system** - Full history with 20-step buffer
- **Advanced search** - Find and navigate through differences
- **Regex filtering** - Ignore patterns during comparison
- **File drag & drop** - Easy file loading with progress indicators

### 🌐 **Internationalization**

- **Multi-language support** - English, Spanish, French
- **Automatic detection** - Browser language preference detection
- **Dynamic switching** - Change language without reload

## 🚀 Quick Start

### Option 1: Use Online (Recommended)

Visit **[diffalyze.app](https://diffalyze.app)** - No installation required!

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/diffalyze.git
cd diffalyze

# Serve locally (Python example)
python -m http.server 8080

# Or with Node.js
npx serve .

# Open in browser
open http://localhost:8080
```

### Option 3: GitHub Pages Deployment

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Your instance will be available at `https://yourusername.github.io/diffalyze`

## 📋 Usage Examples

### Basic Text Comparison

1. **Paste or type** your original text in the left panel
2. **Add modified content** in the right panel  
3. **Click "⚡ Analyze"** to see differences
4. **Use merge buttons** to create final version

### File Comparison

1. **Drag & drop files** onto the designated zones
2. **Automatic language detection** enables syntax highlighting
3. **Compare large files** with web worker acceleration

### Advanced Features

- **Regex filtering**: Use `/function\s+\w+\(/g` to ignore function signatures
- **Collapse unchanged**: Hide identical lines for focus on changes
- **Unified view**: See changes in GitHub-style format
- **Keyboard shortcuts**: Press `?` for full list

## 🏗️ Architecture

### Core Components

```text
├── 📁 js/
│   ├── 📁 core/           # Core algorithms and state management
│   │   ├── compare.js     # Main comparison orchestrator
│   │   ├── diff.js        # Myers algorithm implementation
│   │   ├── state.js       # Application state manager
│   │   └── workers.js     # Web worker management
│   ├── 📁 ui/             # User interface components
│   │   ├── display.js     # Diff visualization
│   │   ├── merge.js       # Interactive merging
│   │   ├── history.js     # Persistent storage
│   │   └── interactions.js # Keyboard & drag/drop
│   ├── 📁 utils/          # Utility functions
│   └── 📁 i18n/           # Internationalization
├── 📁 css/               # Modular stylesheet architecture
└── 📁 workers/           # Background processing
```

### Technical Highlights

#### 🧠 **Smart Diff Algorithm**

```javascript
// Myers O(ND) algorithm with move detection
const diff = await calculateDiff(originalLines, changedLines, {
    ignoreSpacesCase: true,
    ignoreBlank: true,
    regex: /\/\*.*?\*\//g,  // Ignore comments
    moveDetection: true
});
```

#### ⚡ **Web Worker Integration**

```javascript
// Heavy computations run in background
if (lines.length > HEAVY_COMPUTATION_THRESHOLD) {
    diff = await heavyWorkerDiff(original, changed, options);
} else {
    diff = await calculateDiff(original, changed, options);
}
```

#### 💾 **Persistent History**

```javascript
// IndexedDB for offline-capable history
await saveToHistory(originalText, changedText, stats);
const history = await loadHistory();
```

## ⚙️ Configuration

### Performance Tuning

Adjust settings in `js/core/config.js`:

```javascript
window.DiffalyzeConfig = {
    maxFileSize: 10 * 1024 * 1024,     // 10MB limit
    maxLines: 50000,                    // Line limit
    workerTimeout: 30000,               // 30s timeout
    heavyComputationThreshold: 10000,   // Worker trigger
    features: {
        syntaxHighlighting: true,
        moveDetection: true,
        dragAndDrop: true,
        // ... more features
    }
};
```

### Language Support

Add new languages in the configuration:

```javascript
languageMap: {
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    // Add your languages here
}
```

## 🎯 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core Diff | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Drag & Drop | ✅ | ✅ | ✅ | ✅ |
| Syntax Highlighting | ✅ | ✅ | ✅ | ✅ |

**Minimum Requirements:**

- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- JavaScript enabled
- 2MB available storage for history

## 🛡️ Security & Privacy

- **Client-side only** - No data sent to servers
- **XSS protection** - DOMPurify sanitization
- **Safe regex** - Timeout protection against ReDoS
- **Local storage** - All data stays on your device

## 🚀 Performance Benchmarks

| File Size | Lines | Processing Time | Memory Usage |
|-----------|-------|----------------|--------------|
| 1KB | 50 | < 10ms | ~2MB |
| 100KB | 5,000 | < 100ms | ~15MB |
| 1MB | 50,000 | < 2s | ~100MB |
| 10MB | 500,000 | < 30s | ~500MB |

> Tested on Chrome 120, M1 MacBook Pro

## 🔧 Development

### Setup Development Environment

```bash
git clone https://github.com/yourusername/diffalyze.git
cd diffalyze

# Install development dependencies (optional)
npm install -g live-server

# Start development server
live-server --port=8080 --open=index.html
```

### Code Structure Guidelines

- **Modular CSS** - Component-based stylesheets
- **ES6+ JavaScript** - Modern syntax throughout
- **Web Components** - Reusable UI elements  
- **Performance first** - Optimize for large files
- **Accessibility** - ARIA labels and keyboard navigation

### Testing Large Files

```bash
# Generate test files
node -e "console.log('line\\n'.repeat(50000))" > large-test.txt
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Areas for Contribution

- 🌐 **New language translations**
- 🎨 **UI/UX improvements**  
- ⚡ **Performance optimizations**
- 🧪 **Test coverage expansion**
- 📱 **Mobile experience enhancements**

### Quick Contribution Setup

```bash
# Fork the repo, then:
git clone https://github.com/yourusername/diffalyze.git
cd diffalyze
git checkout -b feature/amazing-feature

# Make your changes
# Test thoroughly
# Submit a pull request
```

## 📈 Roadmap

### 🎯 Version 2.0 (Coming Soon)

- [ ] **Three-way merge** - Handle complex merge conflicts
- [ ] **Plugin system** - Custom diff algorithms
- [ ] **Collaboration** - Share diffs via URL
- [ ] **API mode** - Programmatic access
- [ ] **Themes** - Light mode and custom themes

### 🔮 Future Ideas

- [ ] **Git integration** - Compare commits directly
- [ ] **Directory comparison** - Recursive folder diffs
- [ ] **PDF diff** - Document comparison
- [ ] **Image diff** - Visual comparison tools

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Myers Algorithm** - Eugene W. Myers for the foundational diff algorithm
- **Prism.js** - Syntax highlighting library
- **DOMPurify** - XSS protection
- **Inter & JetBrains Mono** - Beautiful typography
- **Community** - All contributors and users

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/diffalyze/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/diffalyze/discussions)  
- 📧 **Contact**: [your.email@example.com](mailto:your.email@example.com)
- 💬 **Community**: [Discord Server](https://discord.gg/diffalyze)

---

**[⭐ Star this repo](https://github.com/yourusername/diffalyze)** if Diffalyze helped you!

Made with ❤️ by [Your Name](https://github.com/joseangel-romero)

[🌐 Website](https://diffalyze.com)