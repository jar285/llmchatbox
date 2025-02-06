# LLM-Powered Next.js Application

This is a modern web application built with Next.js that leverages Large Language Models to provide intelligent responses and interactions.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (v8 or higher)
- An OpenAI API key

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following configurations:

```env
NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_MODEL=o3-mini-2025-01-31
NEXT_PUBLIC_SYSTEM_PROMPT="You are a helpful assistant."
```

⚠️ **Important**: Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

### 4. Run the Development Server

```bash
npm run dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).


## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `NEXT_PUBLIC_MODEL` | The model identifier to use | Yes |
| `NEXT_PUBLIC_SYSTEM_PROMPT` | Default system prompt for the AI | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (if configured)

### Best Practices

1. Keep API keys secure and never commit them to version control
2. Update the system prompt in `.env.local` to customize AI behavior
3. Use components from the `components/` directory to maintain consistency
4. Follow the established code style and formatting guidelines

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

