# Coffee Shop Chatbot Frontend

A beautiful, modern React chatbot interface for Merry's Way Coffee Shop. This standalone frontend application provides an AI-powered customer service chatbot with a coffee shop-themed UI.

## ✨ Features

- 💬 **AI-Powered Chatbot**: Integrated with RunPod API for intelligent conversations
- 🎨 **Modern UI**: Beautiful gradient design with coffee shop theme
- ⚡ **Smooth Animations**: Fade-in effects and smooth scrolling
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔔 **Toast Notifications**: User-friendly error and success messages
- ⌨️ **Keyboard Support**: Press Enter to send messages
- 💭 **Typing Indicators**: Visual feedback when the bot is responding
- 🎯 **Welcome Message**: Friendly greeting on first load

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- RunPod API endpoint (see setup instructions below)

### Installation

1. **Clone or navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your RunPod credentials:
   ```env
   VITE_RUNPOD_API_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run
   VITE_RUNPOD_API_KEY=your_runpod_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   The app will automatically open at `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
npm run preview
```

## 🔧 Configuration

### RunPod API Setup

1. **Deploy your chatbot API on RunPod:**
   - Follow the instructions in `../python_code/api/README.md`
   - Deploy your API endpoint on RunPod
   - Note your endpoint ID and API key

2. **Configure the frontend:**
   - Copy `.env.example` to `.env`
   - Replace `YOUR_ENDPOINT_ID` with your actual RunPod endpoint ID
   - Replace `your_runpod_api_key_here` with your actual API key

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_RUNPOD_API_URL` | Your RunPod API endpoint URL | Yes |
| `VITE_RUNPOD_API_KEY` | Your RunPod API key | Yes |

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── MessageItem.tsx
│   │   ├── MessageList.tsx
│   │   └── TypingIndicator.tsx
│   ├── config/           # Configuration files
│   │   └── runpodConfigs.ts
│   ├── pages/            # Page components
│   │   └── ChatRoom.tsx
│   ├── services/         # API services
│   │   └── chatBot.ts
│   ├── types/            # TypeScript types
│   │   └── types.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .env.example          # Environment variables template
├── index.html            # HTML template
├── package.json          # Dependencies
├── tailwind.config.cjs   # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 🛠️ Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **React Hot Toast**: Toast notifications
- **React Icons**: Icon library

## 🎨 Customization

### Colors

The color scheme can be customized in `tailwind.config.cjs`:

```javascript
colors: {
  coffee: {
    light: '#FEF3C7',
    DEFAULT: '#FCD34D',
    dark: '#F59E0B',
    darker: '#D97706',
  },
}
```

### Welcome Message

Edit the welcome message in `src/pages/ChatRoom.tsx`:

```typescript
const welcomeMessage: MessageInterface = {
  role: 'assistant',
  content: "Your custom welcome message here..."
};
```

## 🐛 Troubleshooting

### API Connection Issues

- **Check your `.env` file**: Make sure `VITE_RUNPOD_API_URL` and `VITE_RUNPOD_API_KEY` are set correctly
- **Verify API endpoint**: Ensure your RunPod endpoint is deployed and running
- **Check network**: Verify your internet connection
- **Review console**: Check browser console for detailed error messages

### Build Issues

- **Clear cache**: Delete `node_modules` and `package-lock.json`, then run `npm install`
- **Check Node version**: Ensure you're using Node.js v18 or higher
- **TypeScript errors**: Run `npm run lint` to check for issues

## 📝 License

Private project

## 🤝 Support

For issues related to the chatbot API backend, refer to `../python_code/api/README.md`.

