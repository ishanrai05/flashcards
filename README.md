# 📚 Flashcard Study App

A modern, responsive flashcard application for studying German vocabulary (or any language) with explanations and examples. Built with vanilla HTML, CSS, and JavaScript - perfect for hosting on GitHub Pages.

## ✨ Features

- **Dynamic Card Loading**: Loads flashcards from a JSON file
- **Smart Filtering**: Filter by theme, show all cards, or display random selections
- **Search Functionality**: Search across terms, explanations, examples, and themes
- **Clickable Theme Badges**: Click any theme badge to filter cards by that theme
- **Session Persistence**: Remembers your last search and filter settings using localStorage
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Modern gradient background, smooth animations, and card hover effects

## 🚀 Quick Start

### Option 1: Deploy to GitHub Pages

1. **Fork or clone this repository**
2. **Go to your repository settings**
3. **Navigate to Pages section**
4. **Select source: Deploy from a branch**
5. **Choose: main branch / (root)**
6. **Save and wait for deployment**
7. **Your site will be available at: `https://ishanrai05.github.io/flashcards`**

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flashcard-app
   ```

2. **Serve the files** (choose one method):
   
   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Using Node.js (if you have it installed):**
   ```bash
   npx serve .
   ```
   
   **Or simply open `index.html` in your browser**

## 📝 Adding Your Own Flashcards

Edit the `cards.json` file to add your own flashcards. Each card should follow this structure:

```json
{
  "term": "Your Term",
  "theme": "Category/Theme",
  "simpleGerman": "Simple explanation in German...",
  "simpleEnglish": "Simple explanation in English...",
  "examples": [
    {
      "context": "Context (e.g., Medical, Business, etc.)",
      "german": "German example sentence...",
      "english": "English translation..."
    }
  ]
}
```

### Example Card:

```json
{
  "term": "Nachhaltigkeit",
  "theme": "Environment",
  "simpleGerman": "'Nachhaltigkeit' bedeutet, so zu handeln, dass auch zukünftige Generationen noch gut leben können.",
  "simpleEnglish": "'Nachhaltigkeit' means acting in a way that allows future generations to live well too.",
  "examples": [
    {
      "context": "Environment",
      "german": "Nachhaltigkeit ist ein wichtiges Thema im Umweltschutz.",
      "english": "Sustainability is an important topic in environmental protection."
    },
    {
      "context": "Business",
      "german": "Viele Unternehmen setzen heute auf Nachhaltigkeit in ihrer Produktion.",
      "english": "Many companies today focus on sustainability in their production."
    }
  ]
}
```

## 🎯 How to Use

1. **Browse All Cards**: Click "All" to see all available flashcards
2. **Random Study**: Click "Random" to get a random selection of 3-5 cards for focused study
3. **Filter by Theme**: Click "By Theme ▼" to see a dropdown of all available themes
4. **Search**: Type in the search box to find specific terms, themes, or content
5. **Quick Theme Filter**: Click any theme badge on a card to filter by that theme
6. **Session Memory**: Your last search and filter settings are automatically saved and restored

## 🛠️ Customization

### Styling
- Edit `style.css` to change colors, fonts, layout, or animations
- The app uses CSS Grid for responsive card layouts
- CSS custom properties make it easy to change the color scheme

### Functionality  
- Modify `script.js` to add new features like:
  - Different random selection algorithms
  - Progress tracking
  - Card statistics
  - Export/import functionality

### Adding New Themes
Simply add cards with new theme names to `cards.json` - the theme dropdown will automatically populate with all unique themes.

## 📱 Mobile Support

The app is fully responsive and includes:
- Touch-friendly interface
- Optimized typography for mobile reading
- Responsive grid that adapts to screen size
- iOS Safari zoom prevention on form inputs

## 🌐 Browser Support

Works in all modern browsers including:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## 📄 File Structure

```
├── index.html          # Main HTML file
├── style.css           # All styles and responsive design
├── script.js           # Application logic and functionality
├── cards.json          # Flashcard data
└── README.md          # This documentation
```

## 🔧 Technical Details

- **No Framework Dependencies**: Pure vanilla JavaScript, HTML, and CSS
- **ES6+ Features**: Uses modern JavaScript (async/await, classes, arrow functions)
- **LocalStorage**: Saves user preferences and session state
- **Fetch API**: Loads flashcard data dynamically
- **CSS Grid & Flexbox**: Modern responsive layout techniques
- **Progressive Enhancement**: Works even if JavaScript fails to load

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Happy studying! 📖✨**
