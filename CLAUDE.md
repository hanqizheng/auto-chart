# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto Chart is an AI-powered Next.js application that generates beautiful, informative charts from natural language prompts or uploaded data files. The application features a conversational AI interface and produces static chart images optimized for sharing and presentation, with comprehensive data insights displayed directly on the charts.

## Development Commands

### Core Development

- `pnpm run dev` - Start development server with Turbopack (http://localhost:3000)
- `pnpm run build` - Build production bundle with Turbopack
- `pnpm start` - Start production server
- `pnpm run type-check` - Run TypeScript type checking without emitting files

### Code Quality

- `pnpm run lint` - Run ESLint to check for code issues
- `pnpm run lint:fix` - Auto-fix ESLint issues where possible
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check if code is properly formatted
- `pnpm run type-check` - Run TypeScript type checking without emitting files
- `pnpm run check` - Run all quality checks (type-check, lint, format:check)
- `pnpm run fix` - Auto-fix formatting and linting issues
- `pnpm test` - Currently placeholder (no tests implemented)
- `pnpm run clean` - Clean build artifacts and caches

## Architecture

### Key Technologies

- **Framework**: Next.js 15.5.0 (App Router)
- **UI**: React 19, Tailwind CSS 4, Shadcn/UI components
- **Charts**: Recharts + Shadcn/Charts for advanced chart rendering
- **AI System**: Custom AI agent architecture for chart generation
- **Excel Processing**: XLSX library for parsing Excel files
- **Export**: Enhanced screenshot system with html2canvas and native browser APIs
- **Styling**: Tailwind CSS with Shadcn/UI design system
- **Internationalization**: Next-intl for multi-language support

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main application with AI chat interface
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── charts/           # Advanced chart components
│   │   ├── bar-chart.tsx     # Enhanced bar chart with insights
│   │   ├── line-chart.tsx    # Trend line chart with analysis
│   │   ├── pie-chart.tsx     # Distribution pie chart with breakdowns
│   │   ├── area-chart.tsx    # Cumulative area chart with performance metrics
│   │   ├── enhanced-chart.tsx # Chart wrapper with export functionality
│   │   └── simple-chart.tsx  # Legacy chart component
│   └── ui/               # Shadcn/ui components + custom components
│       ├── v0-ai-chat.tsx    # AI chat interface component
│       └── ...            # Standard Shadcn/UI components
├── constants/            # Application constants
│   ├── index.ts          # Global constants (API endpoints, storage keys)
│   ├── chart.ts          # Chart-specific constants (types, colors, validation)
│   ├── data.ts           # Data processing constants
│   └── agent.ts          # Agent/AI related constants
├── hooks/                # Custom React hooks
│   ├── use-screenshot.ts     # Legacy export functionality
│   └── use-better-screenshot.ts # Enhanced export with localhost support
├── lib/                  # Core utilities and AI system
│   ├── utils.ts          # Tailwind utilities (cn function)
│   ├── ai-agents.ts      # AI agent architecture for chart generation
│   ├── i18n.ts           # Internationalization configuration
│   └── mock-ai-service.ts # Mock AI service for development
└── types/                # Centralized TypeScript definitions
    ├── index.ts          # Barrel export for all types
    ├── chart.ts          # Chart-related type definitions
    ├── agent.ts          # AI agent type definitions
    ├── chat.ts           # Chat interface type definitions
    ├── common.ts         # Common utility types
    ├── data.ts           # Data processing type definitions
    └── ai.ts             # AI service type definitions
```

### Constants and Types Architecture

The project uses a centralized constants and types system to ensure consistency and maintainability:

#### Constants Structure (`src/constants/`)
- **index.ts**: Global application constants (API endpoints, storage keys, HTTP status codes, common sizes/states)
- **chart.ts**: Chart-specific constants (types, categories, colors, legend positions, validation limits)
- **data.ts**: Data processing constants (upload status, quality issues, file formats, error types)
- **agent.ts**: AI agent constants (status types, tool types, frameworks, error handling)

#### Types Structure (`src/types/`)
- All types are derived from constants using `(typeof CONSTANT)[keyof typeof CONSTANT]` pattern
- **index.ts**: Barrel export file that re-exports all types from other modules
- Each type module imports its corresponding constants and derives types automatically
- This ensures type safety and prevents drift between constants and types

#### Key Architectural Principles
1. **Single Source of Truth**: All string literal types come from constants
2. **Type Derivation**: Types are derived from constants, not hardcoded
3. **Centralized Management**: Easy to add new values by updating constants
4. **Import Consistency**: Always prefer importing types from `@/types` and constants from `@/constants`

### Core Data Flow

#### AI-Powered Chart Generation

1. **Natural Language Input**: Users enter prompts via the AI chat interface
2. **AI Processing**: AI Director orchestrates multiple agents to analyze intent
3. **Chart Generation**: AI agents determine chart type, generate mock data, and create configuration
4. **Enhanced Rendering**: Chart rendered using appropriate enhanced chart component
5. **Export**: Advanced screenshot system captures chart without style modifications

#### File-Based Chart Generation

1. **File Upload**: Users upload Excel files through chat interface or drag-and-drop
2. **Excel Processing**: XLSX library parses file data into JSON format
3. **Chart Configuration**: Auto-generates chart config with colors and labels from data
4. **Interactive Selection**: Users can switch between bar, line, area, and pie chart types
5. **Export**: Enhanced screenshot system with localhost compatibility

### Key Components

#### AI Chat Interface (`src/components/ui/v0-ai-chat.tsx`)

- Conversational interface for natural language chart requests
- Auto-resizing textarea with keyboard shortcuts
- Quick action buttons for common chart types
- File upload integration with drag-and-drop support

#### Enhanced Chart Components (`src/components/charts/`)

- **BeautifulBarChart**: Advanced bar charts with data summaries, peak values, and statistical insights
- **BeautifulLineChart**: Trend analysis with growth rates, reference lines, and performance metrics
- **BeautifulPieChart**: Distribution analysis with breakdowns, rankings, and contribution percentages
- **BeautifulAreaChart**: Cumulative data visualization with timeline insights and series analysis
- **EnhancedChart**: Universal wrapper providing export functionality and chart type switching
- **SimpleChart**: Legacy component for basic line/bar charts (supports only `SimpleChartType`)

#### Mobile-First Responsive Design (`src/components/mobile-tabs.tsx`, `src/hooks/use-mobile.ts`)

- **Adaptive Layout**: Desktop shows side-by-side chat and chart panels
- **Mobile Tabs**: Mobile uses bottom tab navigation between chat and chart views
- **Breakpoint Detection**: Automatic switching based on screen size
- **Touch-Friendly**: Optimized interactions for mobile devices

#### AI Agent System (`src/lib/ai-agents.ts`)

- **AIDirector**: Orchestrates multiple specialized agents for chart generation
- **DataAnalysisAgent**: Processes prompts and determines appropriate chart types and mock data
- **ChartStylingAgent**: Optimizes visual appearance and color schemes
- **InsightGenerationAgent**: Adds analytical annotations and insights
- Extensible architecture for adding new AI capabilities

#### Enhanced Export System (`src/hooks/use-better-screenshot.ts`)

- Dual-mode export: html2canvas for production, native browser APIs for localhost
- Style preservation without CSS variable conflicts
- High-DPI support with 2x scaling
- Development mode instructions for manual screenshot capture
- Comprehensive error handling and fallback strategies

### Chart Design Philosophy

Charts are designed for static image export with rich information display:

- **Information Dense**: All insights, statistics, and metadata visible without interaction
- **Self-Documenting**: Comprehensive legends, data summaries, and analytical insights
- **Print-Friendly**: Optimized for sharing as static images with complete context
- **Visual Hierarchy**: Clear typography and spacing for easy comprehension
- **Professional Appearance**: Consistent styling suitable for presentations and reports

### AI Agent Architecture

The AI system uses a multi-agent approach for sophisticated chart generation:

- **Modular Design**: Each agent specializes in specific aspects (analysis, styling, insights)
- **Extensible Framework**: Easy to add new agents for additional capabilities
- **Context Awareness**: Agents consider conversation history and user preferences
- **Fallback Handling**: Graceful degradation when AI processing fails
- **Mock Data Generation**: Intelligent sample data creation based on prompt analysis

### Export System Innovations

- **Localhost Compatibility**: Special handling for development environments
- **Style Preservation**: Advanced CSS processing to maintain visual fidelity
- **Dual Export Modes**: html2canvas fallback with native browser API preference
- **Developer Experience**: Clear instructions and error messages for troubleshooting
- **High Quality Output**: 2x scaling and optimized compression for professional results

## Development Notes

### Constants and Types Development Workflow

When adding new features that require constants or types:

1. **Add Constants First**: Define new values in the appropriate constants file (`src/constants/`)
2. **Derive Types**: Update corresponding types file (`src/types/`) to derive from the new constants
3. **Export Types**: Ensure new types are exported through `src/types/index.ts`
4. **Use Consistently**: Import types from `@/types` and constants from `@/constants` throughout the codebase
5. **Avoid Hardcoded Strings**: Never use string literal types like `"bar" | "line"` - always derive from constants

Example workflow for adding a new chart type:
```typescript
// 1. Add to src/constants/chart.ts
export const CHART_TYPES = {
  // ... existing types
  SCATTER: "scatter",
} as const;

// 2. Type is automatically derived in src/types/chart.ts
export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];

// 3. Use in components
import { CHART_TYPES } from "@/constants/chart";
import { ChartType } from "@/types/chart";
```

### AI-Powered Chart Generation

- Natural language processing for chart type detection
- Keyword-based analysis: "trend" → line chart, "distribution" → pie chart
- Mock data generation with realistic patterns and variations
- Context-aware responses based on conversation history
- Extensible prompt processing for new chart types and data patterns

### Enhanced Chart Features

- **Rich Metadata**: Data point counts, series information, value ranges, peak periods
- **Statistical Analysis**: Averages, totals, growth rates, trend indicators
- **Visual Insights**: Reference lines, peak indicators, contribution percentages
- **Responsive Design**: Optimized for various screen sizes while maintaining export quality
- **Professional Styling**: Consistent color palettes, typography, and spacing

### File Processing Capabilities

- Supports .xlsx, .xls, and .csv formats
- Intelligent data type detection and conversion
- Automatic chart type recommendations based on data structure
- Graceful handling of missing or malformed data
- Support for multiple chart types from same dataset

### Export System Technical Details

- **Development Mode**: Uses native browser screenshot API when available
- **Production Mode**: Falls back to html2canvas with enhanced CSS processing
- **Style Resolution**: Computed styles applied to avoid CSS variable issues
- **Quality Optimization**: 2x scaling, optimized compression, proper color handling
- **Error Recovery**: Multiple fallback strategies with user-friendly error messages

### Performance Considerations

- Lazy loading of chart libraries to reduce initial bundle size
- Optimized re-renders when switching chart types
- Efficient data processing for large datasets
- Memory management for screenshot generation
- Debounced AI processing to prevent excessive API calls

## Extension Points

### Adding New Chart Types

1. Create new chart component in `src/components/charts/`
2. Add type to `EnhancedChart` component
3. Update AI agent keyword detection in `ai-agents.ts`
4. Add mock data generator for the new chart type

### Integrating Real AI Services

1. Replace mock AI processing in `ai-agents.ts`
2. Add API configuration in `constants/index.ts`
3. Implement error handling for external service failures
4. Add rate limiting and cost management

### Advanced Export Features

1. Extend `useBetterScreenshot` for new export formats (SVG, PDF)
2. Add batch export capabilities for multiple charts
3. Implement cloud storage integration for sharing
4. Add watermarking or branding options

## TypeScript Configuration

- Strict mode enabled with ES2017 target
- Path aliases: `@/*` maps to `src/*`
- JSX preserved for Next.js processing
- Incremental compilation enabled
